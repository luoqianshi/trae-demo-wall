// 开发者工具集 - 主应用
class DevToolsApp {
    constructor() {
        this.modules = {};
        this.currentModule = null;
        this.init();
    }

    init() {
        this.registerModules();
        this.bindNavigation();
        this.bindTheme();
        this.loadModule('json');
        this.setStatus('就绪');
    }

    registerModules() {
        const moduleDefs = [
            { name: 'json', title: 'JSON 格式化', cls: JsonModule },
            { name: 'xml', title: 'XML 格式化', cls: XmlModule },
            { name: 'url', title: 'URL 编码/解码', cls: UrlModule },
            { name: 'base64', title: 'Base64 编码/解码', cls: Base64Module },
            { name: 'image', title: '图片格式转换', cls: ImageModule },
            { name: 'date', title: '日期转换', cls: DateModule },
            { name: 'color', title: '颜色转换', cls: ColorModule },
            { name: 'md5', title: 'MD5 加密', cls: Md5Module },
            { name: 'sha', title: 'SHA 加密', cls: ShaModule },
            { name: 'qrcode', title: '二维码生成', cls: QrcodeModule },
            { name: 'uuid', title: 'UUID 生成', cls: UuidModule },
            { name: 'redis', title: 'Redis 直连', cls: RedisPlugin },
            { name: 'mysql', title: 'MySQL 直连', cls: MySQLPlugin },
            { name: 'linuxcmd', title: 'Linux 指令集', cls: LinuxCmdModule },
            { name: 'docker', title: 'Docker 指令集', cls: DockerModule },
            { name: 'llm', title: '大模型指令集', cls: LlmModule }
        ];
        moduleDefs.forEach(def => {
            if (typeof def.cls !== 'undefined') {
                this.modules[def.name] = new def.cls();
                this.modules[def.name].title = def.title;
            }
        });
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item, .plugin-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const module = item.getAttribute('data-module');
                this.loadModule(module);
            });
        });
    }

    bindTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('light-theme');
            });
        }
    }

    loadModule(name) {
        if (!this.modules[name]) {
            app.setStatus('模块不可用', 'error');
            return;
        }

        // 更新激活状态
        document.querySelectorAll('.nav-item, .plugin-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-module') === name) {
                item.classList.add('active');
            }
        });

        // 更新标题
        const titleEl = document.getElementById('moduleTitle');
        if (titleEl && this.modules[name].title) {
            titleEl.textContent = this.modules[name].title;
        }

        // 渲染内容
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = '';
            this.modules[name].render(content);
        }

        this.currentModule = name;
    }

    setStatus(message, type) {
        const statusBar = document.getElementById('status-bar');
        if (!statusBar) return;
        statusBar.textContent = message;
        statusBar.style.color = type === 'error' ? 'var(--danger)' : 'var(--text-secondary)';
        if (type !== 'error') {
            setTimeout(() => {
                statusBar.textContent = '就绪';
                statusBar.style.color = 'var(--text-secondary)';
            }, 3000);
        }
    }

    copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(String(text)).then(() => {
                this.setStatus('已复制到剪贴板');
            }).catch(() => {
                    this.copyFallback(String(text));
                });
        } else {
            this.copyFallback(String(text));
        }
    }

    copyFallback(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.setStatus('已复制到剪贴板');
        } catch (e) {
            this.setStatus('复制失败', 'error');
        }
        document.body.removeChild(textarea);
    }
}

// 启动应用
const app = new DevToolsApp();
