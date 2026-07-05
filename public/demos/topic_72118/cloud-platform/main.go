package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	baseDomain   = "daodun.xyz"
	dataFile     = "data/tunnels.json"
	credDir      = "credentials"
	listenAddr   = ":8800"
)

type Tunnel struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Subdomain string `json:"subdomain"`
	Domain    string `json:"domain"`
	Port      int    `json:"port"`
	CreatedAt string `json:"created_at"`
	CredFile  string `json:"cred_file"`
}

type DB struct {
	Tunnels []Tunnel `json:"tunnels"`
}

var (
	db   DB
	mu   sync.RWMutex
	root string
)

func init() {
	ex, _ := os.Executable()
	root = filepath.Dir(ex)
	// for development, use working directory
	root, _ = os.Getwd()
}

func loadDB() {
	data, err := os.ReadFile(filepath.Join(root, dataFile))
	if err != nil {
		db = DB{Tunnels: []Tunnel{}}
		return
	}
	json.Unmarshal(data, &db)
	if db.Tunnels == nil {
		db.Tunnels = []Tunnel{}
	}
}

func saveDB() {
	data, _ := json.MarshalIndent(db, "", "  ")
	os.WriteFile(filepath.Join(root, dataFile), data, 0644)
}

func randomSubdomain() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	loadDB()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.LoadHTMLGlob(filepath.Join(root, "templates/*"))
	r.Static("/static", filepath.Join(root, "static"))

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	r.POST("/api/tunnel/create", func(c *gin.Context) {
		var req struct {
			Port      int    `json:"port" binding:"required"`
			Subdomain string `json:"subdomain"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "请填写端口号"})
			return
		}
		if req.Port < 1 || req.Port > 65535 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "端口号不对哦，应该是 1 到 65535 之间的数字"})
			return
		}

		subdomain := req.Subdomain
		if subdomain == "" {
			subdomain = randomSubdomain()
		}

		domain := subdomain + "." + baseDomain
		// Tunnel 名字使用完整域名，点替换为短横线，避免重名
		// 例如: cloud.daodun.xyz -> cloud-daodun-xyz
		tunnelName := strings.ReplaceAll(domain, ".", "-")
		tunnelID := uuid.New().String()
		credFilePath := filepath.Join(root, credDir, tunnelID+".json")

		// 1. Create tunnel
		cmd := exec.Command("cloudflared", "tunnel", "--cred-file", credFilePath, "create", tunnelName)
		output, err := cmd.CombinedOutput()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败了，请稍后再试: " + string(output)})
			return
		}

		// Extract tunnel ID from output
		// Output format: "Created tunnel demo with id 8ee5cb4a-..."
		realTunnelID := tunnelID
		outputStr := string(output)
		for i := len(outputStr) - 1; i >= 0; i-- {
			if outputStr[i] == ' ' {
				realTunnelID = outputStr[i+1:]
				break
			}
		}
		// trim newline
		if len(realTunnelID) > 0 && realTunnelID[len(realTunnelID)-1] == '\n' {
			realTunnelID = realTunnelID[:len(realTunnelID)-1]
		}

		// 2. Route DNS
		cmd = exec.Command("cloudflared", "tunnel", "route", "dns", "-f", realTunnelID, domain)
		output, err = cmd.CombinedOutput()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "域名设置失败，请稍后再试: " + string(output)})
			return
		}

		// 3. Save to DB
		tunnel := Tunnel{
			ID:        realTunnelID,
			Name:      tunnelName,
			Subdomain: subdomain,
			Domain:    domain,
			Port:      req.Port,
			CreatedAt: time.Now().Format(time.RFC3339),
			CredFile:  credFilePath,
		}

		mu.Lock()
		db.Tunnels = append(db.Tunnels, tunnel)
		saveDB()
		mu.Unlock()

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"tunnel":  tunnel,
			"message": fmt.Sprintf("上线成功！你的网址: %s -> localhost:%d", domain, req.Port),
		})
	})

	r.GET("/api/tunnels", func(c *gin.Context) {
		mu.RLock()
		defer mu.RUnlock()
		c.JSON(http.StatusOK, db.Tunnels)
	})

	r.GET("/api/tunnel/:id/config", func(c *gin.Context) {
		id := c.Param("id")
		mu.RLock()
		var tunnel *Tunnel
		for i := range db.Tunnels {
			if db.Tunnels[i].ID == id {
				tunnel = &db.Tunnels[i]
				break
			}
		}
		mu.RUnlock()

		if tunnel == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到这个服务"})
			return
		}

		configContent := fmt.Sprintf(`tunnel: %s
credentials-file: tunnel-cred.json
protocol: http2

ingress:
  - hostname: %s
    service: http://localhost:%d
  - service: http_status:404
`, tunnel.ID, tunnel.Domain, tunnel.Port)

		c.Header("Content-Type", "text/yaml")
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="config_%s.yml"`, tunnel.Subdomain))
		c.String(http.StatusOK, configContent)
	})

	r.GET("/api/tunnel/:id/cred", func(c *gin.Context) {
		id := c.Param("id")
		mu.RLock()
		var tunnel *Tunnel
		for i := range db.Tunnels {
			if db.Tunnels[i].ID == id {
				tunnel = &db.Tunnels[i]
				break
			}
		}
		mu.RUnlock()

		if tunnel == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到这个服务"})
			return
		}

		c.Header("Content-Type", "application/json")
		c.Header("Content-Disposition", `attachment; filename="tunnel-cred.json"`)
		c.File(tunnel.CredFile)
	})

	r.GET("/api/tunnel/:id/download", func(c *gin.Context) {
		id := c.Param("id")
		mu.RLock()
		var tunnel *Tunnel
		for i := range db.Tunnels {
			if db.Tunnels[i].ID == id {
				tunnel = &db.Tunnels[i]
				break
			}
		}
		mu.RUnlock()

		if tunnel == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到这个服务"})
			return
		}

		// Generate config content
		configContent := fmt.Sprintf(`tunnel: %s
credentials-file: tunnel-cred.json
protocol: http2

ingress:
  - hostname: %s
    service: http://localhost:%d
  - service: http_status:404
`, tunnel.ID, tunnel.Domain, tunnel.Port)

		// Read credentials
		credData, err := os.ReadFile(tunnel.CredFile)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "读取配置失败"})
			return
		}

		// Create zip in memory
		c.Header("Content-Type", "application/zip")
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="cloudflare-tunnel_%s.zip"`, tunnel.Subdomain))

		zipWriter := zip.NewWriter(c.Writer)
		defer zipWriter.Close()

		// Add config.yml
		f1, _ := zipWriter.Create("config.yml")
		f1.Write([]byte(configContent))

		// Add tunnel-cred.json
		f2, _ := zipWriter.Create("tunnel-cred.json")
		f2.Write(credData)

		// Add run.sh
		f3, _ := zipWriter.Create("run.sh")
		f3.Write([]byte(fmt.Sprintf(`#!/bin/bash
echo "正在启动 Cloudflare Tunnel..."
echo "域名: %s -> localhost:%d"
echo ""
echo "请确保 cloudflared 已安装: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/"
echo ""
cloudflared tunnel --config config.yml run %s
`, tunnel.Domain, tunnel.Port, tunnel.Name)))
	})

	r.GET("/api/tunnel/:id/deploy", func(c *gin.Context) {
		id := c.Param("id")
		mu.RLock()
		var tunnel *Tunnel
		for i := range db.Tunnels {
			if db.Tunnels[i].ID == id {
				tunnel = &db.Tunnels[i]
				break
			}
		}
		mu.RUnlock()

		if tunnel == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到这个服务"})
			return
		}

		// Read credentials
		credData, err := os.ReadFile(tunnel.CredFile)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "读取配置失败"})
			return
		}

		// Get platform base URL for cloudflared binary download
		scheme := "https"
		if c.Request.TLS == nil {
			if fwd := c.GetHeader("X-Forwarded-Proto"); fwd != "" {
				scheme = fwd
			} else if c.Request.Header.Get("Origin") != "" {
				// parse from origin
			}
		}
		host := c.Request.Host
		baseURL := scheme + "://" + host

		script := fmt.Sprintf(`#!/bin/bash
set -e

# ========== 一键部署 cloud.daodun.xyz (v2) ==========
# 修复：代理干扰、DNS 解析、架构判断、路径问题等

DOMAIN="%s"
PORT=%d
TUNNEL_NAME="%s"
TUNNEL_ID="%s"
BASE_URL="%s"

DIR="$HOME/.cloudflared-deploy/$TUNNEL_NAME"
mkdir -p "$DIR"

# ---------- 1. 清理代理环境变量 ----------
ORIG_HTTP_PROXY="${http_proxy:-}"
ORIG_HTTPS_PROXY="${https_proxy:-}"
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy 2>/dev/null || true

# ---------- 2. 前置检查 ----------
echo ""
echo "========================================="
echo "  cloud.daodun.xyz 一键部署 (v2)"
echo "========================================="
echo "  域名: $DOMAIN"
echo "  本地: localhost:$PORT"
echo "  目录: $DIR"
echo "========================================="
echo ""

# 2.1 检查本地端口是否有服务
if command -v curl &>/dev/null; then
    if ! curl -s -o /dev/null "http://localhost:$PORT/" --connect-timeout 3 2>/dev/null; then
        echo "[!] 警告: localhost:$PORT 似乎没有服务在运行"
        echo "    隧道仍会启动，但访问域名会返回 502"
        echo "    请确保在另一个终端启动你的本地服务"
        read -p "    是否继续？(y/N) " -n 1 -r
        echo ""
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    else
        echo "[OK] 本地端口 $PORT 有服务在运行"
    fi
fi

# 2.2 检查 DNS 解析能力
echo "[*] 检查 DNS 解析..."
DNS_OK=false
if command -v dig &>/dev/null; then
    if dig +short +time=3 +tries=1 region1.v2.argotunnel.com @1.1.1.1 >/dev/null 2>&1; then
        DNS_OK=true
    fi
    if dig +short +time=3 +tries=1 region1.v2.argotunnel.com >/dev/null 2>&1; then
        echo "[OK] 系统 DNS 可以解析 argotunnel.com"
    else
        echo "[!] 系统 DNS 无法解析 argotunnel.com"
    fi
elif command -v nslookup &>/dev/null; then
    if nslookup region1.v2.argotunnel.com 1.1.1.1 >/dev/null 2>&1; then
        DNS_OK=true
    fi
fi

# 2.3 如果系统 DNS 不行，尝试修改 DNS
if [ "$DNS_OK" = true ]; then
    if command -v dig &>/dev/null; then
        if ! dig +short +time=3 +tries=1 region1.v2.argotunnel.com >/dev/null 2>&1; then
            echo "[!] 系统 DNS 无法解析 Cloudflare 隧道域名，尝试修复..."
            OS_TYPE="$(uname -s)"
            case "$OS_TYPE" in
                Darwin)
                    NET_SERVICE=""
                    for svc in "Wi-Fi" "Ethernet" "USB 10/100/1000 LAN"; do
                        if networksetup -getdnsservers "$svc" >/dev/null 2>&1; then
                            NET_SERVICE="$svc"
                            break
                        fi
                    done
                    if [ -n "$NET_SERVICE" ]; then
                        OLD_DNS=$(networksetup -getdnsservers "$NET_SERVICE" 2>/dev/null || echo "")
                        if networksetup -setdnsservers "$NET_SERVICE" 1.1.1.1 1.0.0.1 114.114.114.114 2>/dev/null; then
                            echo "[OK] DNS 已修改为 1.1.1.1 优先"
                            trap 'networksetup -setdnsservers "$NET_SERVICE" empty 2>/dev/null; echo "[*] DNS 已恢复"' EXIT
                        else
                            echo "[!] DNS 修改失败（可能需要 sudo）"
                            echo "    请手动执行: sudo networksetup -setdnsservers \"$NET_SERVICE\" 1.1.1.1 1.0.0.1"
                            read -p "    修改后按回车继续，或输入 q 退出: " -r
                            [[ "$REPLY" =~ ^[Qq]$ ]] && exit 1
                        fi
                    fi
                    ;;
                Linux)
                    echo "    请执行: echo 'nameserver 1.1.1.1' | sudo tee /etc/resolv.conf"
                    read -p "    修改后按回车继续，或输入 q 退出: " -r
                    [[ "$REPLY" =~ ^[Qq]$ ]] && exit 1
                    ;;
            esac
        fi
    fi
fi

# ---------- 3. 写入配置（使用绝对路径）----------
cat > "$DIR/config.yml" << CONFIGEOF
tunnel: $TUNNEL_ID
credentials-file: $DIR/tunnel-cred.json
protocol: http2

ingress:
  - hostname: $DOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
CONFIGEOF

cat > "$DIR/tunnel-cred.json" << 'CREDEOF'
%sCREDEOF

# ---------- 4. 检测并安装 cloudflared ----------
install_cloudflared() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"

    case "$OS" in
        Darwin)
            case "$ARCH" in
                arm64)  BIN_NAME="cloudflared-darwin-arm64" ;;
                x86_64) BIN_NAME="cloudflared-darwin-amd64" ;;
                *)      echo "不支持的架构: $ARCH"; exit 1 ;;
            esac
            ;;
        Linux)
            case "$ARCH" in
                x86_64)  BIN_NAME="cloudflared-linux-amd64" ;;
                aarch64) BIN_NAME="cloudflared-linux-arm64" ;;
                armv7l)  BIN_NAME="cloudflared-linux-arm" ;;
                *)       echo "不支持的架构: $ARCH"; exit 1 ;;
            esac
            ;;
        MINGW*|MSYS*|CYGWIN*)
            BIN_NAME="cloudflared-windows-amd64.exe"
            ;;
        *)
            echo "不支持的操作系统: $OS"
            exit 1
            ;;
    esac

    CF_PATH="$DIR/cloudflared"

    download_file() {
        local url="$1"
        local dest="$2"
        if command -v curl &>/dev/null; then
            curl -#fSL --connect-timeout 15 -o "$dest" "$url" 2>&1
        elif command -v wget &>/dev/null; then
            wget -q --show-progress --timeout=15 -O "$dest" "$url" 2>&1
        else
            echo "错误: 需要 curl 或 wget"
            return 1
        fi
    }

    DOWNLOAD_SOURCES=(
        "$BASE_URL/static/bin/$BIN_NAME"
        "https://github.com/cloudflare/cloudflared/releases/latest/download/$BIN_NAME"
        "https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/$BIN_NAME"
        "https://ghproxy.net/https://github.com/cloudflare/cloudflared/releases/latest/download/$BIN_NAME"
    )

    echo "正在下载 cloudflared ($OS $ARCH)..."
    for url in "${DOWNLOAD_SOURCES[@]}"; do
        echo "  尝试: $url"
        if download_file "$url" "$CF_PATH"; then
            chmod +x "$CF_PATH"
            if "$CF_PATH" --version >/dev/null 2>&1; then
                echo "[OK] 下载成功: $("$CF_PATH" --version 2>&1 | head -1)"
                return 0
            fi
            echo "  下载的文件无效，尝试下一个源..."
            rm -f "$CF_PATH"
        fi
    done

    echo "[X] 所有下载源均失败"
    echo "    请手动下载 cloudflared 并放到: $CF_PATH"
    exit 1
}

if command -v cloudflared &>/dev/null; then
    CF_CMD="cloudflared"
    echo "[OK] 检测到 cloudflared: $(cloudflared --version 2>&1 | head -1)"
elif [ -x "$DIR/cloudflared" ]; then
    CF_CMD="$DIR/cloudflared"
    echo "[OK] 使用本地 cloudflared: $DIR/cloudflared"
else
    echo "[*] 未检测到 cloudflared，正在自动安装..."
    install_cloudflared
    CF_CMD="$DIR/cloudflared"
fi

# ---------- 5. 启动 Tunnel ----------
echo ""
echo "[*] 启动 tunnel..."
echo "    域名: https://$DOMAIN -> localhost:$PORT"
echo "    按 Ctrl+C 停止"
echo ""

cleanup() {
    echo ""
    echo "[*] Tunnel 已停止"
    [ -n "$ORIG_HTTP_PROXY" ] && export http_proxy="$ORIG_HTTP_PROXY"
    [ -n "$ORIG_HTTPS_PROXY" ] && export https_proxy="$ORIG_HTTPS_PROXY"
}
trap cleanup INT TERM

exec "$CF_CMD" tunnel --config "$DIR/config.yml" run "$TUNNEL_NAME"
`, tunnel.Domain, tunnel.Port, tunnel.Name, tunnel.ID, baseURL, string(credData))

		c.Header("Content-Type", "text/x-shellscript")
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="deploy_%s.sh"`, tunnel.Subdomain))
		c.String(http.StatusOK, script)
	})

	r.GET("/api/tunnel/:id/run-cmd", func(c *gin.Context) {
		id := c.Param("id")
		mu.RLock()
		var tunnel *Tunnel
		for i := range db.Tunnels {
			if db.Tunnels[i].ID == id {
				tunnel = &db.Tunnels[i]
				break
			}
		}
		mu.RUnlock()

		if tunnel == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到这个服务"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"command": fmt.Sprintf("cloudflared tunnel --config config.yml run %s", tunnel.Name),
		})
	})

	r.DELETE("/api/tunnel/:id", func(c *gin.Context) {
		id := c.Param("id")
		mu.Lock()
		defer mu.Unlock()

		for i, t := range db.Tunnels {
			if t.ID == id {
				// Delete tunnel
				exec.Command("cloudflared", "tunnel", "delete", t.ID).Run()
				// Delete credentials file
				os.Remove(t.CredFile)
				// Remove from DB
				db.Tunnels = append(db.Tunnels[:i], db.Tunnels[i+1:]...)
				saveDB()
				c.JSON(http.StatusOK, gin.H{"success": true, "message": "已删除"})
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "找不到这个服务"})
	})

	fmt.Printf("cloud.daodun.xyz 已启动: http://localhost%s\n", listenAddr)
	r.Run(listenAddr)
}
