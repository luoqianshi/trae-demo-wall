#!/bin/bash

echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║      🪄  冰箱魔法 FridgeMagic    ║"
echo "  ╚══════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "  [错误] 未检测到 Java，请先安装 JDK 17+"
    echo "  下载地址: https://jdk.java.net/"
    exit 1
fi

# 检查 api_key.txt
if [ ! -f "api_key.txt" ]; then
    echo "  [提示] 未找到 api_key.txt 文件"
    echo "  请创建 api_key.txt 并填入你的智谱AI API Key"
    echo "  （可参考 api_key.example.txt）"
    echo ""
fi

# 启动 Spring Boot
echo "  [启动] Spring Boot 编译并启动中..."
echo ""
./mvnw spring-boot:run