# -*- coding: utf-8 -*-
"""
TimeForge X - 配置文件
"""
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'timeforge-x-secret-key-2024')
    JWT_EXPIRATION_HOURS = 24
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
    DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
    DATABASE = 'timeforge.db'
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000