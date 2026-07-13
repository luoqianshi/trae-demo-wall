"""
考研知识库系统 · 融合控制台
极简Flask启动壳，serve静态文件。双击index.html也能直接打开，无需启动后端。
"""
import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'考研知识库系统启动中...')
    print(f'请在浏览器打开: http://127.0.0.1:{port}')
    print(f'也可以直接双击 index.html 打开，无需启动后端')
    app.run(host='127.0.0.1', port=port, debug=False)
