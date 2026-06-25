# Hatter 服务器部署指南

## 文件清单

```
server/
├── server.js          # 后端主程序
├── package.json       # Node.js 依赖
├── deploy.sh          # 一键部署脚本
└── cloud-sync.js      # 前端同步模块（集成到 index.html）
```

## 部署步骤

### 1. 上传文件到服务器

在本地执行：

```bash
# 方法 A：使用 scp
scp -r server/* root@8.137.196.81:/root/

# 方法 B：使用 SFTP 工具（如 FileZilla、WinSCP）
# 连接信息：
# 主机：8.137.196.81
# 端口：22
# 用户：root
# 密码：（阿里云控制台重置的密码）
```

### 2. SSH 登录服务器

```bash
ssh root@8.137.196.81
```

### 3. 运行部署脚本

```bash
cd /root
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
- 安装 Node.js 20.x
- 安装依赖（express, better-sqlite3, cors, helmet）
- 创建 systemd 服务
- 配置防火墙（开放 3000 端口）
- 生成随机 API Key

**部署成功后会输出：**
```
=== 部署完成 ===
服务器地址: http://8.137.196.81:3000
API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

重要：请保存 API Key，前端需要用到
查看日志: journalctl -u hatter -f
重启服务: systemctl restart hatter
停止服务: systemctl stop hatter
```

### 4. 测试服务

```bash
# 健康检查
curl http://8.137.196.81:3000/health

# 应返回：{"status":"ok","timestamp":...}
```

### 5. 前端集成

#### 5.1 引入 cloud-sync.js

在 `index.html` 的 `<script>` 标签前添加：

```html
<script src="server/cloud-sync.js"></script>
```

#### 5.2 修改 saveSessions

找到 `saveSessions` 函数，添加云同步：

```javascript
const saveSessions = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userSessions));
    // 添加这行
    syncToCloud();
};
```

#### 5.3 修改 deleteSession

找到 `deleteSession` 函数，添加云删除：

```javascript
const deleteSession = async id => {
    if (!await showConfirm('确定删除这条对话？')) return;
    userSessions = userSessions.filter(s => s.id !== id);
    saveSessions();
    // 添加这行
    syncDeleteToCloud(id);
    if (currentSessionId === id) {
        if (userSessions.length > 0) await loadSession(userSessions[0].id);
        else await createNewSession();
    }
    renderSessionList();
};
```

#### 5.4 添加云同步设置 UI

在设置页面添加：

```html
<!-- 云同步设置 -->
<div class="settings-item">
    <label>云同步</label>
    <div class="cloud-sync-settings">
        <input type="text" id="cloudApiKey" placeholder="输入 API Key" />
        <button onclick="testCloudConnection()">测试连接</button>
        <label>
            <input type="checkbox" id="cloudSyncToggle" />
            启用云同步
        </label>
    </div>
</div>
```

#### 5.5 添加设置逻辑

```javascript
// 加载设置
const loadCloudSettings = () => {
    $('cloudApiKey').value = getCloudApiKey();
    $('cloudSyncToggle').checked = isCloudSyncEnabled();
};

// 保存设置
$('cloudApiKey').addEventListener('change', (e) => {
    setCloudApiKey(e.target.value);
});

$('cloudSyncToggle').addEventListener('change', (e) => {
    setCloudSyncEnabled(e.target.checked);
    if (e.target.checked) syncFromCloud();
});

// 测试连接
window.testCloudConnection = async () => {
    const ok = await cloudApi.testConnection();
    showToast(ok ? '连接成功' : '连接失败');
};
```

## 常用命令

```bash
# 查看服务状态
systemctl status hatter

# 查看日志
journalctl -u hatter -f

# 重启服务
systemctl restart hatter

# 停止服务
systemctl stop hatter

# 备份数据库
cp /opt/hatter/data/hatter.db /opt/hatter/data/hatter.db.backup

# 恢复数据库
systemctl stop hatter
cp /opt/hatter/data/hatter.db.backup /opt/hatter/data/hatter.db
systemctl start hatter
```

## 安全建议

1. **修改默认 API Key**：部署后生成的随机 Key 已足够安全
2. **定期备份**：建议每天备份 `hatter.db`
3. **监控流量**：阿里云控制台可查看流量使用情况
4. **防火墙**：仅开放 3000 端口，其他端口保持关闭

## 故障排查

### 服务无法启动

```bash
# 查看详细错误
journalctl -u hatter -n 50

# 检查端口占用
netstat -tlnp | grep 3000

# 手动启动测试
cd /opt/hatter
node server.js
```

### 前端无法连接

1. 检查防火墙是否开放 3000 端口
2. 检查 API Key 是否正确
3. 浏览器控制台查看网络请求

### 数据库损坏

```bash
# 停止服务
systemctl stop hatter

# 检查数据库完整性
sqlite3 /opt/hatter/data/hatter.db "PRAGMA integrity_check;"

# 从备份恢复
cp /opt/hatter/data/hatter.db.backup /opt/hatter/data/hatter.db

# 启动服务
systemctl start hatter
```

## 性能优化（可选）

### 1. 启用 HTTPS（推荐）

```bash
# 安装 Nginx
apt install nginx certbot python3-certbot-nginx -y

# 配置 Nginx 反向代理
cat > /etc/nginx/sites-available/hatter << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/hatter /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 申请 SSL 证书
certbot --nginx -d your-domain.com
```

### 2. 数据库优化

```bash
# 定期清理旧对话（保留最近 100 条）
sqlite3 /opt/hatter/data/hatter.db "DELETE FROM conversations WHERE id NOT IN (SELECT id FROM conversations ORDER BY updated_at DESC LIMIT 100);"

# 优化数据库
sqlite3 /opt/hatter/data/hatter.db "VACUUM;"
```

## 费用预估

- 服务器：¥56/月
- 流量：对话数据极小，约 ¥0-5/月
- 域名（可选）：¥30-60/年
- **总计：约 ¥56-61/月**

## 下一步

部署成功后，可以：
1. 在设置页面配置 API Key
2. 启用云同步
3. 测试对话保存和恢复
4. 配置自动备份脚本
