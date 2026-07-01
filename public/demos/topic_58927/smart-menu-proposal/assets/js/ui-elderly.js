/**
 * ui-elderly.js — 适老化模式模块
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.uiElderly（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) init()            绑定 #switch-elderly change 事件，按 store 持久化状态初始化
 *  2) toggleElderly(on) 切换 html.elderly-mode class、store.set、showToast、同步开关 UI
 *  3) 语音播报（供 ui-cooking 调用）：speak / stopSpeak / isSpeaking
 *
 * 说明：
 *  - 引导脚本（index.html 末尾的内联 IIFE）已为 #switch-elderly 绑定了一个占位监听。
 *    本模块在 init() 中通过"克隆替换"剥离该占位监听，统一接管开关逻辑
 *    （含 store.set 持久化，占位逻辑未做持久化）。
 *  - 为确保剥离发生在引导脚本绑定之后，实际接管放在 setTimeout(0) 中执行。
 *  - 语音播报使用 window.speechSynthesis，优先选用 zh-CN 语音，支持队列朗读。
 *
 * 依赖：
 *  SMART_MENU.store（store.js）
 *  SMART_MENU.showToast（引导脚本）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.uiElderly = (function () {
    'use strict';

    var SM = SMART_MENU;
    var inited = false;

    /* ============ 语音播报相关 ============ */
    var synth = window.speechSynthesis || null;
    var queue = [];       // 待播报队列：[{ text, opts }]
    var speaking = false;
    var zhVoice = null;   // 缓存的中文语音

    /* ============================================================
     *  init() —— 接管适老化开关
     *  说明：实际绑定延迟到下一个事件循环，保证晚于引导脚本的占位绑定，
     *        从而用"克隆替换"干净地剥离占位监听。
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;
        setTimeout(actuallyInit, 0);
    }

    function actuallyInit() {
        var old = document.getElementById('switch-elderly');
        if (old) {
            // 克隆替换：cloneNode 不复制 addEventListener 绑定的监听器，
            // 从而剥离引导脚本绑定的占位 handler，由本模块统一接管。
            var fresh = old.cloneNode(true);
            if (old.parentNode) old.parentNode.replaceChild(fresh, old);

            // 读取持久化状态初始化开关
            var isOn = !!(SM.store && SM.store.get('elderlyMode'));
            fresh.checked = isOn;
            document.documentElement.classList.toggle('elderly-mode', isOn);

            fresh.addEventListener('change', function () {
                toggleElderly(fresh.checked);
            });
        }
        initSpeech();
    }

    /* ============================================================
     *  toggleElderly(forceOn)
     * ============================================================ */
    function toggleElderly(forceOn) {
        var on;
        if (typeof forceOn === 'boolean') {
            on = forceOn;
        } else {
            on = !document.documentElement.classList.contains('elderly-mode');
        }

        // 切换 html.elderly-mode（elderly.css 据此放大字号 / 提高对比度）
        document.documentElement.classList.toggle('elderly-mode', on);

        // 持久化
        if (SM.store) SM.store.set('elderlyMode', on);

        // 同步开关 UI（避免与实际状态不一致）
        var sw = document.getElementById('switch-elderly');
        if (sw && sw.checked !== on) sw.checked = on;

        // 提示
        if (SM.showToast) {
            SM.showToast(on ? '已开启适老化大字模式' : '已关闭适老化模式', 'info');
        }
    }

    /* ============================================================
     *  语音播报
     * ============================================================ */

    /* ---- 初始化语音：查找中文语音 ---- */
    function initSpeech() {
        if (!synth) return;  // 不支持时，speak() 中再提示
        loadVoices();
        // 部分浏览器需等 voices 加载完成
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }

    function loadVoices() {
        if (!synth || !synth.getVoices) return;
        var voices = synth.getVoices();
        if (!voices.length) return;
        // 优先 zh-CN，其次任意 zh 开头
        for (var i = 0; i < voices.length; i++) {
            var lang = (voices[i].lang || '').toLowerCase();
            if (lang.indexOf('zh') === 0) {
                if (!zhVoice || lang.indexOf('zh-cn') === 0) {
                    zhVoice = voices[i];
                }
            }
        }
    }

    /* ---- 朗读文本（入队，支持队列顺序播放） ---- */
    function speak(text, opts) {
        opts = opts || {};
        if (!synth) {
            if (SM.showToast) SM.showToast('当前浏览器不支持语音播报', 'error');
            return;
        }
        if (text == null || text === '') return;
        queue.push({ text: String(text), opts: opts });
        if (!speaking) runQueue();
    }

    /* ---- 处理队列：逐条朗读 ---- */
    function runQueue() {
        if (!synth) { speaking = false; return; }
        if (!queue.length) { speaking = false; return; }

        var item = queue.shift();
        speaking = true;

        var u = new SpeechSynthesisUtterance(item.text);
        u.lang = 'zh-CN';
        if (zhVoice) u.voice = zhVoice;
        if (item.opts.rate != null) u.rate = item.opts.rate;
        if (item.opts.pitch != null) u.pitch = item.opts.pitch;
        if (item.opts.volume != null) u.volume = item.opts.volume;
        // 一条结束 → 处理下一条
        u.onend = function () { runQueue(); };
        u.onerror = function () { runQueue(); };

        synth.speak(u);
    }

    /* ---- 是否正在播报 ---- */
    function isSpeaking() {
        if (speaking) return true;
        if (synth && synth.speaking) return true;
        return false;
    }

    /* ---- 停止播报并清空队列 ---- */
    function stopSpeak() {
        queue = [];
        speaking = false;
        if (synth) synth.cancel();
    }

    /* ============ 对外暴露 ============ */
    return {
        init: init,
        toggleElderly: toggleElderly,
        // 语音播报（供 ui-cooking 调用）
        speak: speak,
        stopSpeak: stopSpeak,
        isSpeaking: isSpeaking
    };
})();

/* ============ 模块加载后自动初始化 ============
 * 引导脚本（内联 IIFE）在本文件之后执行并占位绑定 #switch-elderly；
 * init() 内部用 setTimeout(0) 把实际接管推迟到引导脚本执行完毕之后，
 * 再通过"克隆替换"剥离占位监听，确保开关逻辑由本模块统一管理。
 * 若 app.js 后续也调用 init()，inited 标志会保证只执行一次。
 */
SMART_MENU.uiElderly.init();
