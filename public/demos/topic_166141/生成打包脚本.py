# -*- coding: utf-8 -*-
"""
生成 Windows 批处理文件(强制使用 CRLF 行尾)
直接运行后会在同目录生成 打包.bat
"""
import os

CONTENT = r"""@echo off
chcp 65001 >nul
title 一键打包 - 我是皇帝
echo.
echo  ============================================
echo       《我是皇帝》一键打包工具 v1.0
echo  ============================================
echo.

REM 优先使用 python,其次 python3
where python >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] 使用 python 运行打包脚本...
    python 打包.py
    goto :end
)

where python3 >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] 使用 python3 运行打包脚本...
    python3 打包.py
    goto :end
)

echo [ERROR] 未检测到 Python,请先安装 Python 3.7+
echo         下载地址: https://www.python.org/downloads/
pause
exit /b 1

:end
if exist "dist\*.zip" (
    echo.
    echo  ============================================
    echo   打包成功!输出目录: dist\
    echo   双击 dist 目录下的 zip 文件即可分发
    echo  ============================================
) else (
    echo [WARN] 未检测到 zip 输出文件
)
echo.
pause
"""

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '打包.bat')

# 强制使用 CRLF
data = CONTENT.replace('\r\n', '\n').replace('\n', '\r\n').encode('utf-8')
# 验证
crlf_count = data.count(b'\r\n')
total_newline = data.count(b'\n')
print(f'CRLF 行数: {crlf_count}, 总换行: {total_newline}, 匹配: {crlf_count == total_newline}')

with open(OUT, 'wb') as f:
    f.write(data)

print(f'✅ 已生成: {OUT}')
print(f'   大小: {os.path.getsize(OUT)} bytes')
