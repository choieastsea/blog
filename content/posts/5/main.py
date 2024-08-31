import socket


def my_app(environ, start_response):
    """WSGI 애플리케이션 예시"""
    status = "200 OK"
    headers = [("Content-Type", "text/plain")]
    start_response(status, headers)
    return [b"Hello, WSGI World!"]

def create_app(app):
    def middleware(environ, start_response):
        # 요청 URI를 로깅
        print(f"<Request URI>: {environ['PATH_INFO']}")
        # 애플리케이션 호출
        response = app(environ, start_response)
        # 응답 데이터를 로깅
        print(f"<Response data>: {app(environ, start_response)}")
        return response

    return middleware


def run_wsgi_server(application, host="127.0.0.1", port=8000):
    """간단한 WSGI 서버 구현"""
    # 소켓 생성 및 바인딩
    with socket.socket(
        socket.AF_INET, socket.SOCK_STREAM
    ) as server_socket:  # TCP기반 IPv4 소켓 객체 생성
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((host, port))
        server_socket.listen(1)  # 최대 동시 연결 수
        print(f"Serving on http://{host}:{port} ...")

        while True:
            # 클라이언트 요청 수신할 때까지 block
            client_socket, client_address = server_socket.accept()
            with client_socket:
                print(f"request from {client_address}")
                request = client_socket.recv(1024).decode("utf-8")
                if not request:
                    continue

                # 환경 변수 설정 (app을 call할 때 인자로 전달)
                environ = {
                    "REQUEST_METHOD": "GET",  # 단순화하여 GET 요청만 처리
                    "PATH_INFO": "/",
                    "SERVER_NAME": host,
                    "SERVER_PORT": str(port),
                }

                # 응답 함수 (app을 call할 때 인자로 전달)
                def start_response(status, response_headers):
                    client_socket.sendall(f"HTTP/1.1 {status}\r\n".encode("utf-8"))
                    for header in response_headers:
                        client_socket.sendall(
                            f"{header[0]}: {header[1]}\r\n".encode("utf-8")
                        )
                    client_socket.sendall(b"\r\n")

                # WSGI 애플리케이션 호출 및 응답 전송
                response_body = application(environ, start_response)
                for data in response_body:
                    client_socket.sendall(data)


if __name__ == "__main__":
    run_wsgi_server(create_app(my_app))
