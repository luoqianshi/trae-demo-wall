// 拾光 在线状态感知 - 监听 online/offline 事件
window.shiguangOnline = {
    _ref: null,
    _onlineHandler: null,
    _offlineHandler: null,

    init: function (dotNetRef) {
        this._ref = dotNetRef;
        this._onlineHandler = () => dotNetRef.invokeMethodAsync("SetOnline", true);
        this._offlineHandler = () => dotNetRef.invokeMethodAsync("SetOnline", false);
        window.addEventListener("online", this._onlineHandler);
        window.addEventListener("offline", this._offlineHandler);
        // 初始化时同步当前状态
        dotNetRef.invokeMethodAsync("SetOnline", navigator.onLine);
    },

    dispose: function () {
        if (this._onlineHandler) window.removeEventListener("online", this._onlineHandler);
        if (this._offlineHandler) window.removeEventListener("offline", this._offlineHandler);
        this._ref = null;
    }
};
