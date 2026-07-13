#!/bin/bash

PORT=8080
DIR=$(cd "$(dirname "$0")" && pwd)
PID_FILE="$DIR/.server.pid"
SERVER_PY="$DIR/server.py"

start_server() {
    echo "🚀 正在启动漫剧制作陪跑平台..."
    echo "📂 项目目录: $DIR"
    echo "🌐 端口: $PORT"

    if [ ! -f "$SERVER_PY" ]; then
        echo "❌ 错误：找不到 server.py"
        exit 1
    fi

    if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
        echo "❌ 错误：未找到 Python，请先安装 Python"
        exit 1
    fi

    PY=python3
    if ! command -v python3 &>/dev/null; then
        PY=python
    fi

    cd "$DIR"
    PORT="$PORT" "$PY" "$SERVER_PY" &
    echo $! > "$PID_FILE"
    sleep 1

    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "✅ 启动成功！"
        echo "🔗 访问地址: http://localhost:$PORT"
        echo "🔀 已启用本地 LLM 代理（解决浏览器 CORS）"
        echo "💡 按 Ctrl+C 停止服务器"
        wait
    else
        echo "❌ 启动失败，请检查端口 $PORT 是否被占用"
        rm -f "$PID_FILE"
        exit 1
    fi
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "🛑 正在停止服务器..."
            kill "$PID" 2>/dev/null
            # 若主进程是 shell 包一层，尽量清掉同端口 python
            sleep 0.3
            rm -f "$PID_FILE"
            echo "✅ 服务器已停止"
        else
            echo "⚠️ 服务器未运行"
            rm -f "$PID_FILE"
        fi
    else
        # 兜底：按端口杀
        if command -v lsof &>/dev/null; then
            PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null)
            if [ -n "$PIDS" ]; then
                echo "🛑 清理端口 $PORT 上的进程..."
                kill $PIDS 2>/dev/null
                echo "✅ 已停止"
                return
            fi
        fi
        echo "⚠️ 未找到服务器进程文件"
    fi
}

check_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "🟢 服务器正在运行，PID: $PID"
            echo "🔗 访问地址: http://localhost:$PORT"
            return 0
        else
            echo "🔴 服务器进程已停止"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo "🔴 服务器未运行"
        return 1
    fi
}

case "$1" in
    start)
        stop_server
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 1
        start_server
        ;;
    status)
        check_server
        ;;
    *)
        echo "📖 用法: $0 {start|stop|restart|status}"
        echo ""
        echo "🎨 漫剧制作陪跑平台 - 启动脚本"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动服务器（含 /__proxy CORS 代理）"
        echo "  stop    - 停止服务器"
        echo "  restart - 重启服务器"
        echo "  status  - 查看服务器状态"
        echo ""
        echo "💡 直接运行 $0 会显示此帮助信息"
        ;;
esac
