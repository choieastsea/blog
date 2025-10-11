---
title: ASGI - uvicorn 코드로 알아보는 ASGI server
date: "2025-10-01"
toc: true
summary: "uvicorn / startup / protocol"
readTime: true
autonumber: false
showTags: true
tags: [web server, server, python, asgi, fastapi, uvicorn, debugging]
---

저번에 이어 ASGI server에 대해 알아보고, 간단한 웹 어플리케이션을 `uvicorn` 라이브러리를 통해 서빙하고 디버깅해보며 ASGI server에서 하는 일들을 알아보자.

## uvicorn

uvicorn은 대표적인 ASGI server의 구현체이다. [github](https://github.com/Kludex/uvicorn)

`fastapi`와 같은 ASGI application을 서빙할 때 필요한 존재이며, 상단에 WSGI server인 `gunicorn`을 두어 스케일 아웃을 하기도 한다. (아니면 nginx와 같은 web server에 연결된다)

## 환경 설정

우선 간단한 개발환경을 설정한다. `uv`를 사용했다.
```shell
❯ uv init asgi
❯ cd asgi
❯ uv add uvicorn
```
`main.py`를 다음과 같이 수정한다. 간단한 HTTP 요청을 path와 함께 받아 hello world를 출력해주는 **ASGI application**이다. application spec은 [이전 글을 참고]({{< relref "../14/index.md" >}})한다. 

```python
import asyncio


async def app(scope, receive, send):
    if scope.get("type") != "http":
        raise NotImplementedError

    path = scope.get("path", "/")
    name = path.split("/")[1] or "world"

    await asyncio.sleep(1)
    await send(
        {
            "type": "http.response.start",
            "status": 200,
            "headers": [(b"content-type", b"text/plain; charset=utf-8")],
        }
    )
    await send(
        {
            "type": "http.response.body",
            "body": f"hello {name}\n".encode(),
        }
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000)

```
`scope`에는 connection에 대한 정적인 메타데이터가 들어있고, `send` 파라미터는 awaitable callable이 주입되어 dictionary로 ASGI server가 client에게 응답하기를 기대한다.

위 코드는 scope로부터 path parameter를 가져와 "hello {name}"의 꼴로 응답하고 종료하기를 기대된다.

이제 디버깅을 해보자!

### vscode 디버깅 환경 구성

`vscode`의 `launch.json`을 다음과 같이 작성하고 디버깅을 수행하였다. 가상환경 python 위치와 justMyCode를 false로 두어 설치한 uvicorn 코드까지 보도록 하자.

```json
{
    "version": "0.2.0",
    "configurations": [

        {
            "name": "debug ASGI",
            "type": "debugpy",
            "request": "launch",
            "python": "${command:python.interpreterPath}",
            "program": "main.py",
            "console": "integratedTerminal",
            "justMyCode": false
        }
    ]
}
```

주요 지점에 대해 브레이크 포인트를 찍고, ASGI 서버가 어떤 역할을 수행하는지를 위주로 살펴보고자 한다. event loop와 그 스펙은 간단하게만 짚고 넘어간다. 

(이하의 코드들은 중요 부분만 남기고, 일부는 생략 & 주석을 수정하였으니 원본을 보고 싶으면 해당 코드를 직접 확인하자)

## startup

`uvicorn/server.py`

ASGI server가 최초 실행될 때(_serve 메서드) startup이 호출된다.

```python
class Server:
    async def startup(self, sockets: list[socket.socket] | None = None) -> None:
        await self.lifespan.startup()
        def create_protocol(
            _loop: asyncio.AbstractEventLoop | None = None,
        ) -> asyncio.Protocol:
            ...
        try:
            server = await loop.create_server(
                create_protocol,
                host=config.host,
                port=config.port,
                ssl=config.ssl,
                backlog=config.backlog,
            )
        except OSError as exc:
            logger.error(exc)
            await self.lifespan.shutdown()
            sys.exit(1)

        assert server.sockets is not None
        listeners = server.sockets
        self.servers = [server]
```
`create_protocol` 메서드는 **현재 이벤트 루프**를 가져오고, ASGI 서버 실행시 설정한 ASGI application 정보를 통해 `Protocol` 객체를 생성한다.

 [Protocol](https://docs.python.org/ko/3.13/library/asyncio-protocol.html#protocols)은 저수준의 통신 채널의 추상화 객체인 [Transport](https://docs.python.org/ko/3.13/library/asyncio-protocol.html#transports) 객체에 등록하는 콜백을 포함한 인스턴스이다. 

쉽게 설명하면 **이벤트 루프가 이벤트를 감지하고, Transport가 약속된 Protocol의 행동(메서드)들을 수행**하도록 되어 있는 것이다.

코드를 보면, 이벤트루프의 `create_server` 메서드를 호출하고, `create_protocol`메서드를 등록한다. 이후 **TCP connection이 생성되면 이벤트루프가 create_protocol을 호출**하여 HTTP Protocol 객체를 생성하고, 요청시 protocol의 data_recieved가 호출한다. (*일반적으로 하나의 요청에 하나의 Protocol이 생성*된다)

`curl http://localhost:8000/bada` 를 실행했을 때의 흐름을 따라가보자.

## Protocol

`uvicorn/protocols/http/h11_impl.py`

http 요청의 경우, 옵션에 따라 다를 수 있는데(기본적으로는 httptools) 여기서는 h11_impl(순수 파이썬) 기준으로 보자.

HTTP 요청시, 등록된 Protocol 인스턴스의 `data_received` 콜백이 수행된다.

```python
class H11Protocol(asyncio.Protocol):
    def data_received(self, data: bytes) -> None:
        self._unset_keepalive_if_required()

        self.conn.receive_data(data)
        self.handle_events()
    
    def handle_events(self) -> None:
        while True:
            event = self.conn.next_event()
            # HTTP 요청 이벤트
            if isinstance(event, h11.Request):
                # scope 초기화
                self.scope = {
                    "type": "http",
                    "asgi": {"version": self.config.asgi_version, "spec_version": "2.3"},
                    "http_version": event.http_version.decode("ascii"),
                    "server": self.server,
                    "client": self.client,
                    "scheme": self.scheme,
                    "method": event.method.decode("ascii"),
                    "root_path": self.root_path,
                    "path": full_path,
                    "raw_path": full_raw_path,
                    "query_string": query_string,
                    "headers": self.headers,
                    "state": self.app_state.copy(),
                }
                # WS upgrade
                if self._should_upgrade():
                    self.handle_websocket_upgrade(event)
                    return
                app = self.app
                # Cycle 생성
                self.cycle = RequestResponseCycle(
                    scope=self.scope,
                    conn=self.conn,
                    transport=self.transport,
                    flow=self.flow,
                    logger=self.logger,
                    access_logger=self.access_logger,
                    access_log=self.access_log,
                    default_headers=self.server_state.default_headers,
                    message_event=asyncio.Event(),
                    on_response=self.on_response_complete,
                )
                # event loop에 task 등록
                task = self.loop.create_task(self.cycle.run_asgi(app))
                task.add_done_callback(self.tasks.discard)
                self.tasks.add(task)
```
이벤트 루프에 의해 transport가  `H11Protocol` 객체의 `data_received` 콜백을 호출하고, 이는 (uvicorn 기준) `handle_events`를 호출하여 ASGI application에 넘겨줄 인자들을 만들어주고 cycle에서 application을 실행하도록 task로 등록한다.

### Cycle (uvicorn)

`uvicorn/protocols/http/h11_impl.py`

cycle은 uvicorn에서 ASGI application을 실행하고 처리하는 주체이다. `run_asgi` 메서드로 우리가 만든 application이 호출될 것이다.

```python
class RequestResponseCycle:
    async def run_asgi(self, app: ASGI3Application) -> None:
        try:
            result = await app(  
                self.scope, self.receive, self.send
            )
        except BaseException as exc:
            ...
```

## ASGI Application 실행
아까 생성한 main.py가 실행되어 1초간 기다리고 응답이 온다. 

```shell
❯ curl http://localhost:8000/bada
hello bada
```

응답 이후 다시 ASGI 서버가 무한루프를 돌며 서버가 유지된다.

만약 종료하게 되면 ASGI 서버에서 cleanup 동작을 수행하고, 반환하게 될 것이다.


## 정리

* ASGI 서버는 시작 시, asyncio 이벤트 루프에 Transport/Protocol에 대한 정보ㄹㄹ 등록한다.
* HTTP 요청/웹소켓등의 이벤트가 발생하면, 이벤트 루프가 해당 **Protocol 인스턴스의 콜백(data_received)**을 호출하고, Protocol은 이를 적절히 파싱해 인자를 만들고, ASGI application(코루틴)을 실행한다.
* ASGI application은 이벤트 루프에 의해 cooperative하게 동작하며, `receive`로 입력 이벤트를 받고 `send`로 응답 이벤트를 내보낸다.



처음 정리하려던 것보다는 내용이 더 깊어졌는데, 언젠가 이벤트루프 관련한 스펙도 알아보면 좋을 것 같다는 생각이 든다.

그럼 모두 화이팅👏
