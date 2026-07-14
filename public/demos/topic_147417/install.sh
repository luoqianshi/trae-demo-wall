#!/bin/bash
# HomeWizard 一键安装脚本
# 用法: bash install.sh

set -e

echo "============================================"
echo "  HomeWizard v2.0.0 一键安装"
echo "============================================"

# 检查 Python 版本
PYTHON=${PYTHON:-python3}
echo ""
echo "▶ 检查 Python 版本..."
if ! command -v $PYTHON &> /dev/null; then
    echo "❌ 未找到 $PYTHON，请先安装 Python 3.10+"
    exit 1
fi
PY_VERSION=$($PYTHON --version 2>&1 | awk '{print $2}')
echo "✅ Python 版本: $PY_VERSION"

# 创建虚拟环境（可选）
if [ "$1" == "--venv" ]; then
    echo ""
    echo "▶ 创建虚拟环境..."
    $PYTHON -m venv venv
    source venv/bin/activate
    PYTHON=python
    echo "✅ 虚拟环境已创建并激活"
fi

# 安装依赖
echo ""
echo "▶ 安装依赖包..."
pip install -r requirements.txt
echo "✅ 依赖安装完成"

# 验证安装
echo ""
echo "▶ 验证安装..."
$PYTHON -c "
import streamlit
import openpyxl
import yaml
import requests
print(f'  streamlit: {streamlit.__version__}')
print(f'  openpyxl:  {openpyxl.__version__}')
print(f'  PyYAML:    {yaml.__version__}')
print(f'  requests:  {requests.__version__}')
print('✅ 核心依赖验证通过')
"

# 创建 secrets.toml（如果不存在）
if [ ! -f ".streamlit/secrets.toml" ]; then
    echo ""
    echo "▶ 创建 .streamlit/secrets.toml..."
    echo "# 在此添加 API Key（可选）" > .streamlit/secrets.toml
    echo "✅ secrets.toml 已创建"
fi

echo ""
echo "============================================"
echo "  ✅ 安装完成！"
echo "============================================"
echo ""
echo "启动项目："
echo "  streamlit run app.py --server.port 8501"
echo ""
echo "运行测试："
echo "  python3 -m pytest tests/ -v"
echo ""
echo "诊断工具："
echo "  python3 scripts/diagnostic.py"
echo ""
