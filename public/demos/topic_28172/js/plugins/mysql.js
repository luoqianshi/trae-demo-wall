/**
 * MySQL 直连插件 (占位)
 * 
 * 此插件为预留扩展功能
 * 需要后端服务支持 MySQL 连接
 * 
 * 预计功能:
 * - MySQL 连接管理
 * - SQL 查询执行
 * - 表结构浏览
 * - 数据导出
 */

class MySQLPlugin extends PluginInterface {
    constructor() {
        super();
        this.name = 'mysql';
        this.title = 'MySQL 直连';
        this.version = '1.0.0';
        this.description = '连接 MySQL 数据库，执行查询';
        this.connected = false;
    }

    render(container) {
        container.innerHTML = `
            <div class="input-panel" style="grid-column: 1;">
                <label>MySQL 连接</label>
                <div style="display:grid;gap:12px;">
                    <input type="text" id="mysqlHost" placeholder="主机 (默认: localhost)" value="localhost" style="padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                    <input type="number" id="mysqlPort" placeholder="端口 (默认: 3306)" value="3306" style="padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                    <input type="text" id="mysqlUser" placeholder="用户名" style="padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                    <input type="password" id="mysqlPassword" placeholder="密码" style="padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                    <input type="text" id="mysqlDatabase" placeholder="数据库名" style="padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                    <button class="btn btn-primary" onclick="alert('此功能需要服务端支持，敬请期待！')" style="width:100%;">连接</button>
                </div>
            </div>
            <div class="action-bar" style="padding-top: 0;"></div>
            <div class="output-panel" style="grid-column: 1;">
                <label>连接状态</label>
                <div style="padding:20px;text-align:center;color:var(--text-secondary);">
                    <p style="margin-bottom:12px;">🔌 插件开发中...</p>
                    <p style="font-size:13px;">此功能需要后端服务支持</p>
                    <p style="font-size:12px;margin-top:12px;color:var(--secondary);">预计支持: SQL 查询、表结构浏览、数据导出</p>
                </div>
            </div>
        `;
    }
}

// 注意: 由于浏览器安全限制，纯前端无法直接连接 MySQL
// 如需使用，请部署带有后端 API 的服务
