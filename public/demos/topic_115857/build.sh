#!/bin/bash

DIR=$(cd "$(dirname "$0")" && pwd)
BUILD_DIR="$DIR/dist"
ZIP_NAME="manhua-drama.zip"

build_project() {
    echo "📦 正在构建漫剧制作陪跑平台..."
    echo "📂 项目目录: $DIR"
    
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    
    echo "🔄 复制文件..."
    
    cp -f "$DIR/index.html" "$BUILD_DIR/"
    cp -rf "$DIR/css" "$BUILD_DIR/"
    cp -rf "$DIR/js" "$BUILD_DIR/"
    cp -rf "$DIR/assets" "$BUILD_DIR/"
    cp -f "$DIR/start.sh" "$BUILD_DIR/"
    cp -f "$DIR/server.py" "$BUILD_DIR/"
    if [ -f "$DIR/CLAUDE.md" ]; then
        cp -f "$DIR/CLAUDE.md" "$BUILD_DIR/"
    fi
    
    echo "✅ 文件复制完成"
    
    echo "📄 生成 README.md..."
    cat > "$BUILD_DIR/README.md" << 'EOF'
# 漫剧制作陪跑平台

一个让小白也能轻松做出漫剧的Web平台。

## 功能特点

- 🎨 六阶段全流程指引（编剧→分镜→绘画→配音→剪辑→发布）
- 📝 30+细分任务，每个任务都有大白话说明
- 🤖 内置AI创作助手，一键生成剧本/分镜/人设
- 🛠️ 20+工具推荐，一站式收录
- 💾 进度追踪，数据本地保存
- 🌸 粉色可爱清新系UI

## 快速开始

### 方法一：使用启动脚本（推荐）

```bash
# 给脚本添加执行权限
chmod +x start.sh server.py

# 启动服务器（含本地 LLM 代理，可绕过浏览器 CORS）
./start.sh start
```

### 方法二：直接用浏览器打开

直接在浏览器中打开 `index.html` 文件即可。
注意：此方式无法使用本地代理，部分大模型 API 会因 CORS 失败。

### 方法三：使用 Python 服务

```bash
python3 server.py
# 或
python3 -m http.server 8080   # 仅静态文件，无代理
```

然后访问 http://localhost:8080

## 使用指南

1. 打开页面后先看新手引导
2. 点击右上角设置，配置你的大模型API
3. 从编剧阶段开始，跟着任务一步步做
4. 遇到需要创作的任务，点「AI生成」直接调用大模型

## 支持的大模型

- OpenAI (GPT-4o)
- Claude (Anthropic)
- DeepSeek
- 通义千问
- 豆包（火山引擎）
- 智谱AI
- 自定义接口

## 技术栈

- HTML5
- CSS3 + Tailwind CSS
- JavaScript (ES6+)
- Font Awesome 图标库

## 注意事项

- 所有数据都保存在浏览器本地，不会上传到任何服务器
- 需要配置大模型API密钥才能使用AI创作功能
- 建议使用现代浏览器（Chrome、Edge、Safari）
EOF
    
    echo "✅ README.md 生成完成"
    
    echo "📦 创建压缩包..."
    cd "$BUILD_DIR"
    zip -r "$DIR/$ZIP_NAME" . -q
    cd "$DIR"
    
    echo "✅ 构建完成！"
    echo ""
    echo "📁 构建目录: $BUILD_DIR"
    echo "📦 压缩包: $DIR/$ZIP_NAME"
    echo ""
    echo "🚀 启动方式:"
    echo "  cd $BUILD_DIR"
    echo "  ./start.sh start"
    echo ""
    echo "🔗 访问地址: http://localhost:8080"
}

clean_build() {
    echo "🧹 清理构建文件..."
    rm -rf "$BUILD_DIR"
    rm -f "$DIR/$ZIP_NAME"
    echo "✅ 清理完成"
}

case "$1" in
    build)
        build_project
        ;;
    clean)
        clean_build
        ;;
    *)
        echo "📖 用法: $0 {build|clean}"
        echo ""
        echo "🎨 漫剧制作陪跑平台 - 构建脚本"
        echo ""
        echo "命令说明:"
        echo "  build   - 构建项目，生成dist目录和压缩包"
        echo "  clean   - 清理构建文件"
        echo ""
        echo "💡 直接运行 $0 会显示此帮助信息"
        ;;
esac
