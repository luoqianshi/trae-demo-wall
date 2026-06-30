from http.server import HTTPServer
from valueledger.config import SERVER_HOST, SERVER_PORT
from valueledger.server.db import init_db
from valueledger.server.api_handlers import APIHandler
from valueledger.server.utils import get_host_ip


def main():
    print("=" * 60)
    print("  ValueLedger 创值账本 - 服务端启动")
    print("=" * 60)

    init_db()
    print(f"[OK] 数据库初始化完成")

    server_address = (SERVER_HOST, SERVER_PORT)
    httpd = HTTPServer(server_address, APIHandler)

    local_ip = get_host_ip()
    print(f"[OK] 服务端已启动")
    print(f"     本机访问: http://127.0.0.1:{SERVER_PORT}")
    print(f"     局域网访问: http://{local_ip}:{SERVER_PORT}")
    print(f"[提示] 第一个注册的用户将自动成为 boss")
    print("=" * 60)
    print("等待客户端连接...\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务端已停止")
        httpd.server_close()


if __name__ == "__main__":
    main()
