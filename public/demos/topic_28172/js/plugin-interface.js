/**
 * DevToolkit 插件接口
 * 
 * 开发者可以通过实现此接口来扩展工具箱功能
 * 
 * 使用方法:
 * 1. 创建新的插件文件 (如 js/plugins/my-plugin.js)
 * 2. 实现 PluginInterface
 * 3. 调用 DevToolkitPlugin.register('pluginName', new MyPlugin())
 */

class PluginInterface {
    constructor() {
        this.name = '';
        this.title = '';
        this.version = '1.0.0';
        this.description = '';
        this.actions = [];
        this.dependencies = [];
    }

    /**
     * 渲染插件界面
     * @param {HTMLElement} container - 模块容器
     */
    render(container) {
        throw new Error('render() 方法必须被实现');
    }

    /**
     * 初始化插件
     */
    init() {
        console.log(`插件 ${this.name} 已初始化`);
    }

    /**
     * 销毁插件
     */
    destroy() {
        console.log(`插件 ${this.name} 已销毁`);
    }
}

// 插件管理器
class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = {};
    }

    register(name, plugin) {
        if (this.plugins.has(name)) {
            console.warn(`插件 ${name} 已存在，将被替换`);
        }
        this.plugins.set(name, plugin);
        plugin.init();
        console.log(`插件 ${name} 注册成功`);
    }

    unregister(name) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.destroy();
            this.plugins.delete(name);
            console.log(`插件 ${name} 已卸载`);
        }
    }

    get(name) {
        return this.plugins.get(name);
    }

    list() {
        return Array.from(this.plugins.keys());
    }

    // 注册钩子
    registerHook(name, callback) {
        if (!this.hooks[name]) {
            this.hooks[name] = [];
        }
        this.hooks[name].push(callback);
    }

    // 触发钩子
    triggerHook(name, data) {
        if (this.hooks[name]) {
            this.hooks[name].forEach(callback => callback(data));
        }
    }
}

// 全局插件管理器实例
window.pluginManager = new PluginManager();

// 示例：如何注册一个插件
// window.DevToolkitPlugin.register('myPlugin', new MyPlugin());
