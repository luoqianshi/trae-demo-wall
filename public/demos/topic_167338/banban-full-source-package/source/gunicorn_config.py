"""
Gunicorn 配置文件 - 云端部署用
"""
import multiprocessing

# 监听地址和端口
bind = "0.0.0.0:8000"

# 工作进程数
workers = 2

# 工作模式
worker_class = "sync"

# 每个worker的最大连接数
worker_connections = 1000

# 超时时间（秒）
timeout = 120

# 优雅重启超时
graceful_timeout = 30

# 日志
accesslog = "logs/access.log"
errorlog = "logs/error.log"
loglevel = "info"

# 进程名
proc_name = "banban-companion"

# 后台运行
daemon = False
