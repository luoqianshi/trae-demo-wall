"""WSGI 入口文件，用于 PythonAnywhere / gunicorn 等部署环境"""

from app import app

# PythonAnywhere 需要 application 变量
application = app

if __name__ == "__main__":
    app.run()
