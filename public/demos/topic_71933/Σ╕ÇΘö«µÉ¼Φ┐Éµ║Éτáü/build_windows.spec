# -*- mode: python ; coding: utf-8 -*-
"""一键搬运 — PyInstaller Windows 打包配置。"""

import os
import sys
from pathlib import Path

block_cipher = None
base_dir = os.path.dirname(os.path.abspath(SPEC))

# 收集数据文件
datas = [
    ('static', 'static'),
]

# 隐式导入
hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'pydantic',
    'pydantic_settings',
    'httpx',
    'loguru',
    'cv2',
    'numpy',
    'moviepy',
    'whisper',
    'playwright',
    'multipart',
    'starlette',
    'starlette.staticfiles',
    'starlette.responses',
    'PIL',
    'imageio_ffmpeg',
]

a = Analysis(
    ['launcher.py'],
    pathex=[base_dir],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter', 'matplotlib',
        'pytest', 'unittest', 'doctest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='一键搬运',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='一键搬运',
)
