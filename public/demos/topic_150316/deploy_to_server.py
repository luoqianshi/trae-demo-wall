#!/usr/bin/env python3
"""部署脚本 - 将项目文件上传到阿里云服务器并重启服务"""
import paramiko
import os
import sys

# 配置
LOCAL_DIR = r'c:\Users\27115\Documents\trae_projects\test1'
HOST = '8.163.43.183'
USER = 'root'
KEY_PATH = r'c:\Users\27115\Documents\trae_projects\test1\8.163.43.183_id_ed25519'
REMOTE_DIR = '/opt/shuatitong'
WWW_DIR = '/www/wwwroot/shuatitong'

# 要上传的文件（不包括数据库）
UPLOAD_FILES = ['server.py', '刷题通demo.html', 'admin.html', 'server_config.json']
UPLOAD_DIRS = ['skills']

print('=== 开始部署到服务器 ===')
print(f'目标: {HOST}')
print(f'远程目录: {REMOTE_DIR}')

key = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, pkey=key, timeout=10)

PY38 = '/www/server/python_manager/versions/3.8.5/bin/python3.8'

# 1. 停止旧服务
print('\n[1/5] 停止旧服务...')
stdin, stdout, stderr = c.exec_command(f'pkill -f "python3.8 server.py" 2>/dev/null; sleep 2; echo DONE')
print(stdout.read().decode().strip())

# 2. 上传文件到 /opt/shuatitong
print('\n[2/5] 上传文件到 /opt/shuatitong...')
sftp = c.open_sftp()
for f in UPLOAD_FILES:
    local_path = os.path.join(LOCAL_DIR, f)
    remote_path = f'{REMOTE_DIR}/{f}'
    sftp.put(local_path, remote_path)
    print(f'  已上传: {f} ({os.path.getsize(local_path)} bytes)')

# 上传 skills 目录
for d in UPLOAD_DIRS:
    local_d = os.path.join(LOCAL_DIR, d)
    remote_d = f'{REMOTE_DIR}/{d}'
    try:
        sftp.stat(remote_d)
    except:
        sftp.mkdir(remote_d)
    for root, dirs, files in os.walk(local_d):
        rel_root = os.path.relpath(root, local_d)
        remote_root = f'{remote_d}/{rel_root}' if rel_root != '.' else remote_d
        for subdir in dirs:
            try:
                sftp.stat(f'{remote_root}/{subdir}')
            except:
                sftp.mkdir(f'{remote_root}/{subdir}')
        for fname in files:
            if fname.endswith('.pyc'):
                continue
            local_fp = os.path.join(root, fname)
            remote_fp = f'{remote_root}/{fname}'.replace('\\', '/')
            sftp.put(local_fp, remote_fp)
            print(f'  已上传: {d}/{os.path.relpath(local_fp, local_d)} ({os.path.getsize(local_fp)} bytes)')

sftp.close()
print('  上传完成')

# 3. 同步到 /www/wwwroot/shuatitong
print('\n[3/5] 同步到 /www/wwwroot/shuatitong...')
sync_cmd = (
    f'cp {REMOTE_DIR}/server.py {WWW_DIR}/server.py && '
    f'cp {REMOTE_DIR}/刷题通demo.html {WWW_DIR}/刷题通demo.html && '
    f'cp {REMOTE_DIR}/admin.html {WWW_DIR}/admin.html && '
    f'cp {REMOTE_DIR}/server_config.json {WWW_DIR}/server_config.json && '
    f'cp -r {REMOTE_DIR}/skills {WWW_DIR}/ && '
    f'chown -R www:www {WWW_DIR}/ && '
    f'echo DONE'
)
stdin, stdout, stderr = c.exec_command(sync_cmd)
print(stdout.read().decode().strip())

# 4. 检查并安装依赖
print('\n[4/5] 检查依赖...')
stdin, stdout, stderr = c.exec_command('pip3.8 install fastapi uvicorn httpx python-multipart aiofiles python-docx pdfplumber olefile PyPDF2 markitdown 2>&1 | tail -5')
print(stdout.read().decode().strip())

# 5. 启动服务
print('\n[5/5] 启动服务...')
start_cmd = 'cd {} && nohup {} -u server.py > /tmp/shuatitong.log 2>&1 & sleep 3 && cat /tmp/shuatitong.log'.format(REMOTE_DIR, PY38)
stdin, stdout, stderr = c.exec_command(start_cmd)
print(stdout.read().decode().strip())

# 验证服务
stdin, stdout, stderr = c.exec_command('ss -tlnp | grep 8800')
output = stdout.read().decode().strip()
if output:
    print('\n服务运行中: {}'.format(output))
else:
    print('\n警告: 服务未在 8800 端口运行!')
    stdin, stdout, stderr = c.exec_command('cat /tmp/shuatitong.log')
    print('日志:\n{}'.format(stdout.read().decode()))

c.close()
print('\n=== 部署完成 ===')
print(f'访问地址: http://{HOST}:8800')
print(f'管理后台: http://{HOST}:8800/admin')
print(f'默认管理员密码: admin123')