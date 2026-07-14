#!/usr/bin/env bash
# ============================================================
# 一句话头像灵感站 - 启动脚本 (macOS / Linux)
# 1. 检测 Python
# 2. 没有虚拟环境则创建
# 3. 没有依赖则安装
# 4. 启动后端
# ============================================================
set -e

# 切到脚本所在目录（项目根目录）
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

echo ""
echo "============================================"
echo "  一句话头像灵感站 - 启动脚本 (macOS/Linux)"
echo "============================================"
echo ""

# ---- 1. 检测 Python ----
echo "[1/4] 检测 Python ..."
PY_CMD=""
# 优先 python3，其次 python
if command -v python3 >/dev/null 2>&1; then
    PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PY_CMD="python"
else
    echo ""
    echo "[错误] 未检测到 Python，请先安装 Python 3.8+ 并加入 PATH。"
    echo "       macOS:   brew install python3"
    echo "       Ubuntu:  sudo apt install python3 python3-venv"
    echo "       下载:    https://www.python.org/downloads/"
    echo ""
    exit 1
fi
$PY_CMD --version
echo "       Python 路径: $(command -v $PY_CMD)"
echo ""

# ---- 2. 检测/创建虚拟环境 ----
echo "[2/4] 检测虚拟环境 ..."
VENV_DIR="$PROJECT_DIR/.venv"
VENV_PY="$VENV_DIR/bin/python"
if [ -f "$VENV_PY" ]; then
    echo "       虚拟环境已存在: $VENV_DIR"
else
    echo "       未检测到虚拟环境，正在创建 ..."
    # Ubuntu/Debian 部分版本需要 python3-venv 包
    "$PY_CMD" -m venv "$VENV_DIR" 2>/dev/null || {
        echo ""
        echo "[提示] venv 创建失败，可能缺少 python3-venv 包。"
        echo "       Ubuntu/Debian 请执行: sudo apt install python3-venv"
        echo ""
        exit 1
    }
    if [ ! -f "$VENV_PY" ]; then
        echo ""
        echo "[错误] 虚拟环境创建失败。"
        exit 1
    fi
    echo "       虚拟环境已创建: $VENV_DIR"
fi
echo ""

# ---- 3. 检测/安装依赖 ----
echo "[3/4] 检测依赖 ..."
# 用 fastapi 是否可导入来判断依赖是否已装
if "$VENV_PY" -c "import fastapi" >/dev/null 2>&1; then
    echo "       依赖已安装，跳过安装。"
else
    REQ_FILE="$PROJECT_DIR/backend/requirements.txt"
    if [ ! -f "$REQ_FILE" ]; then
        echo ""
        echo "[错误] 未找到 backend/requirements.txt"
        exit 1
    fi
    echo "       依赖未安装，正在安装 requirements.txt ..."
    "$VENV_PY" -m pip install --upgrade pip -q
    "$VENV_PY" -m pip install -r "$REQ_FILE"
    if [ $? -ne 0 ]; then
        echo ""
        echo "[错误] 依赖安装失败，请检查网络或手动安装。"
        exit 1
    fi
    echo "       依赖安装完成。"
fi
echo ""

# ---- 4. 启动后端 ----
echo "[4/4] 启动后端服务 ..."
echo "       工作目录: $PROJECT_DIR/backend"
echo "       访问地址: http://localhost:8000/"
echo "       按 Ctrl+C 停止服务"
echo "--------------------------------------------"
echo ""

cd "$PROJECT_DIR/backend"
"$VENV_PY" main.py
