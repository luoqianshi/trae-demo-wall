#!/bin/bash
cd "$(dirname "$0")"

export HTTP_PROXY=
export HTTPS_PROXY=
export http_proxy=
export https_proxy=
export no_proxy=localhost,127.0.0.1

do_stop() {
    echo "正在停止服务..."
    if [ -f "go-server.pid" ]; then
        kill "$(cat go-server.pid)" 2>/dev/null || true
        rm -f go-server.pid
    fi
    if [ -f "cloudflared.pid" ]; then
        kill "$(cat cloudflared.pid)" 2>/dev/null || true
        rm -f cloudflared.pid
    fi
    pkill -f "./cloud-platform" 2>/dev/null || true
    pkill -f "cloudflared tunnel.*cloud-platform" 2>/dev/null || true
    sleep 1
    echo "✅ 所有服务已停止"
}

do_start() {
    if [ -f "go-server.pid" ] && kill -0 "$(cat go-server.pid)" 2>/dev/null; then
        echo "⚠️  服务已在运行，请先停止再启动"
        return
    fi

    echo "正在启动服务..."

    if [ ! -f "./cloud-platform" ]; then
        echo "正在编译..."
        go build -o cloud-platform .
    fi

    nohup ./cloud-platform > go-server.log 2>&1 &
    echo $! > go-server.pid
    sleep 2

    if ! kill -0 "$(cat go-server.pid)" 2>/dev/null; then
        echo "❌ Go 服务启动失败，请查看 go-server.log"
        return
    fi

    nohup cloudflared tunnel --config config.yml run cloud-platform > cloudflared.log 2>&1 &
    echo $! > cloudflared.pid
    sleep 3

    if ! kill -0 "$(cat cloudflared.pid)" 2>/dev/null; then
        echo "❌ cloudflared 启动失败，请查看 cloudflared.log"
        return
    fi

    echo "✅ 服务已启动"
}

show_info() {
    clear
    echo "========================================="
    echo "  Cloudflare Tunnel 服务分发平台"
    echo "========================================="
    echo ""
    echo "  本地访问: http://localhost:8800"
    echo "  公网访问: https://cloud.daodun.xyz"
    echo ""
    if [ -f "go-server.pid" ] && kill -0 "$(cat go-server.pid)" 2>/dev/null; then
        echo "  Go 服务:     ✅ 运行中 (PID: $(cat go-server.pid))"
    else
        echo "  Go 服务:     ❌ 未运行"
    fi
    if [ -f "cloudflared.pid" ] && kill -0 "$(cat cloudflared.pid)" 2>/dev/null; then
        echo "  cloudflared: ✅ 运行中 (PID: $(cat cloudflared.pid))"
    else
        echo "  cloudflared: ❌ 未运行"
    fi
    echo ""
    echo "========================================="
}

while true; do
    clear
    echo "========================================="
    echo "  Cloudflare Tunnel 服务管理"
    echo "========================================="
    echo ""
    echo "  1) 启动服务"
    echo "  2) 停止服务"
    echo "  3) 重启服务"
    echo "  4) 查看状态"
    echo "  0) 退出"
    echo ""
    echo "========================================="
    read -p "  请选择操作 [0-4]: " choice
    case $choice in
        1) do_start; read -n 1 -s -r -p "按任意键继续..." ;;
        2) do_stop; read -n 1 -s -r -p "按任意键继续..." ;;
        3) do_stop; sleep 1; do_start; read -n 1 -s -r -p "按任意键继续..." ;;
        4) show_info; read -n 1 -s -r -p "按任意键继续..." ;;
        0) exit 0 ;;
        *) echo "无效选项"; sleep 1 ;;
    esac
done
