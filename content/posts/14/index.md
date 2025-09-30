---
title: ASGI - application
date: "2025-09-28"
toc: true
summary: "개요 / Event / ASGI application / 정리"
readTime: true
autonumber: false
showTags: true
tags: [web server, server, python, wsgi, asgi, fastapi, starlette]
---

이전에 WSGI application, server, 그리고 middleware에 대한 스펙을 정의한 Proposal(PEP3333)에 대해 다뤘다. 

[이전 글](https://choieastsea.github.io/posts/4)을 정리하면, python을 웹 서비스로 만들기 위해서는 WSGI를 준수하는 application(ex. django, flask app)와 이를 서빙할 WSGI server(gunicorn, uwsgi)를 선택해야한다고 했다.

이번 글에는 WSGI를 개선하여 다양한 통신 방법에 대응 가능한 스펙인 `ASGI`에 대해 알아보도록 한다. 

## 개요

ASGI(Asynchronous Server Gateway Interface)는 `WSGI`의 **한계를 극복하여 비동기 메커니즘을 지원하기 위해 고안된 표준 인터페이스**이다. `PEP`에 채택되진 않았지만 **사실상(de facto) 비동기 웹 표준**으로 채택되어 사용된다.

역시 app과 server로 구성된다.

## Event

우선, ASGI의 `event`라는 개념을 알고 가면 좋을 것 같다.

ASGI는 application이 수신하고 작업, 응답까지의 일들을 각각의 event로 표현한다. event는 dictionary로 제공되며 "type"이라는 키(ex. `http.request`, `http.disconnect`)를 포함한다.

`server-client` 구조에서, 맺은 연결을 connection이라고 하고, 해당 connection에서 발생하는 메시지를 event라고 알고 있으면 좋다.

## ASGI application

ASGI app은 다음의 스펙을 준수해야 한다.
```python
async def application(scope, receive, send):
```
위 application 함수는 ASGI server 구현체에 의해 호출될 것이다. 주요 파라미터들은 다음과 같다.

- `scope`
    연결(connection) 정보를 담고 있는 dictionary이다. key로는 "type" (value: "http", "websocket", "lifespan"), "method", "path", "headers" 등이 있다.
    
    connection은 프로토콜에 따라 다른데, *HTTP의 경우 하나의 요청, ws의 경우 한 websocket connection을 의미*한다. scope는 WSGI의 environ처럼 request context의 일부를 담고 있다.
- `receive`
    서버로부터 이벤트를 받아 새로운 event dictionary를 반환하는 awaitable 함수라고 한다. 서버에서 전달해주는 *이벤트에 대한 정보를 가져올 수 있는 코루틴*이라고 보면 된다. 

- `send`
    단일 event dictionary를 인자로 받는 awaitable 함수이고, *send 완료 혹은 connection 종료 시점에 return* None 한다.

간단하게 정리하면, 이벤트 발생시 receive를 통해 server to app으로 내용을 받아올 수 있고, send를 통해 app to server로 이벤트를 전달한다. 연결에 대한 정적인 메타데이터는 scope에 담고 있다.

### lifespan

scope의 type 중에 `lifespan`이라는 게 올 수가 있다고 했는데, 이는 event loop의 lifecycle에 대한 이벤트이다. 이벤트 루프는 하나의 ASGI server process내에서 하나만 존재한다.

`startup`과 `shutdown` 타입의 이벤트가 발생하여 해당 시점에 application context의 initialize나 cleanup을 수행할 수 있도록 지원한다.

또한, application context를 유지하고 싶은 경우, `scope["state"]`라는 네임스페이스로 제공된다. 설정한 state는 이후 연결마다 shallow copy되어 전달되므로, application context로 활용할 객체(ex. db connection)를 넣는 식으로 활용 가능하다.


### WSGI와의 차이점

WSGI application의 인터페이스는 다음과 같았다.
```python
def app(environ, start_response):
```
이는 요청-응답의 동기 구조로 되어있어, 비동기 이벤트에 대한 처리가 불가능한 구조이다. streaming, WebSocket과 같은 구조는 WSGI 스펙에서 정의된 것은 아니다.

ASGI는 WSGI에서의 **단일 요청~응답을 한 connection(채널)과 여러 개의 event(메시지)로 세분화**하였다고 볼 수 있다.

보통 ASGI server들은 WSGI application을 이벤트 루프에서 실행할 수 있는 wrapper middleware가 제공되어, *하나의 ASGI 서버는 ASGI, WSGI app 모두를 실행할 수 있다*.

### fastapi / starlette

대표적인 ASGI application인 `fastapi`는 어떻게 되어있나 살펴보자. 위에서 봤던 ASGI application spec을 class based로 구현하였고, 이는 `__call__` method를 보면 된다.

```python
# fastapi/applicatoins.py
class FastAPI(Starlette):
    ...
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if self.root_path:
            scope["root_path"] = self.root_path
        await super().__call__(scope, receive, send)
```
[출처](https://github.com/fastapi/fastapi/blob/master/fastapi/applications.py#L1079-L1082)

해당 클래스에서는 부모 클래스를 거의 그대로 호출한다. Starlette도 보자. (fastapi는 starlette + pydantic을 확장한 applicatoin framework라고 보면 좋을 것 같다)

```python
# starlette/applications.py
class Starlette:
    ...
    def build_middleware_stack(self) -> ASGIApp:
        debug = self.debug
        error_handler = None
        exception_handlers: dict[typing.Any, typing.Callable[[Request, Exception], Response]] = {}

        for key, value in self.exception_handlers.items():
            if key in (500, Exception):
                error_handler = value
            else:
                exception_handlers[key] = value

        middleware = (
            [Middleware(ServerErrorMiddleware, handler=error_handler, debug=debug)]
            + self.user_middleware
            + [Middleware(ExceptionMiddleware, handlers=exception_handlers, debug=debug)]
        )

        app = self.router
        for cls, args, kwargs in reversed(middleware):
            app = cls(app=app, *args, **kwargs)
        return app
    
    ...
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        scope["app"] = self
        if self.middleware_stack is None:
            self.middleware_stack = self.build_middleware_stack()
        await self.middleware_stack(scope, receive, send)
```
[출처](https://github.com/Kludex/starlette/blob/main/starlette/applications.py#L109-L113)

middleware를 체이닝하여 application을 감싼 후 호출한다. fastapi에서도 흔히 사용하는 router의 개념도 starlette에서 온 것인데, ASGI에서 제안한 기능에 웹서버를 위한 고수준의 "라우팅" 클래스이다. ASGI 자체에는 routing에 대한 표준은 없다.

인자는 scope, receive, send로 ASGI application spec을 준수함을 확인할 수 있다.

## 정리

ASGI는 WSGI에서 제공하지 못하던 비동기 기능을 지원하기 위해 고안된 **파이썬 비동기 웹 인터페이스의 사실상 표준**이다.

ASGI application은 connection과 event에 대해 `scope`, `receive`, `send`를 파라미터로 전달하여 실행한다.

lifespan을 통해 이벤트 루프의 라이프사이클을 알 수 있고, application context variable을 위한 `state`라는 네임스페이스가 제공된다.

fastapi, starlette은 ASGI 스펙을 준수하고 추가 기능을 확장한 어플리케이션 프레임워크이다. ASGI server 스펙을 준수하는 uvicorn 등으로 실행이 가능하다.

다음에는 ASGI server에 대해서도 알아보도록 하자.

끝!! 


### 참고

https://asgi.readthedocs.io/en/latest/index.html