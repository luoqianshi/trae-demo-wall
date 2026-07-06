"""应用配置"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'qingyou-dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(BASE_DIR, 'instance', 'qingyou.db')
    )
    # 前端静态资源目录
    STATIC_FOLDER = os.path.join(BASE_DIR, '..', 'qingyou-app')
