// 墨脉 MoMai - 工具函数模块
// 包含 toggleDemoPanel, resetDemoLayout, exportData, quickDemo, toggleTheme
window.MoMaiModules = window.MoMaiModules || {};
window.MoMaiModules.utils = function(Vue, deps) {
    const { notes, isJiangnanTheme, demoCollapsed, activeRoadshowTab,
            freeLayout, maximizedPanel, panelWidths, gridLayout,
            activeNoteId, togglePlugin, setSplit1 } = deps;

    // 使用占位符，后续由 app.js 注入
    let _refreshGraphSoon = () => {};

    const setRefreshGraphSoon = (fn) => { _refreshGraphSoon = fn; };

    const toggleTheme = () => {
        isJiangnanTheme.value = !isJiangnanTheme.value;
    };

    // JSON backup file export logic
    const exportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes.value, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `MoMai_Notes_Backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const toggleDemoPanel = (panel) => {
        demoCollapsed.value[panel] = !demoCollapsed.value[panel];
        _refreshGraphSoon();
    };

    const resetDemoLayout = () => {
        demoCollapsed.value = {
            left: false,
            notes: false,
            plugins: false,
            graph: false
        };
        activeRoadshowTab.value = 'tags';
        freeLayout.value = false;
        maximizedPanel.value = null;
        panelWidths.value = { tags: 30, notes: 55, graph: 15 };
        // 使用 setSplit1 重置 gridLayout + colSizes + rowSizes
        setSplit1();
    };

    // Dynamic Demo Trigger to showcase high-fidelity interactions
    const quickDemo = (action, param) => {
        if (action === 'selectNote') {
            const target = notes.value.find(n => n.title === param);
            if (target) {
                activeNoteId.value = target.id;
            }
        } else if (action === 'togglePlugin') {
            togglePlugin(param);
        }
    };

    return {
        toggleTheme,
        exportData,
        toggleDemoPanel,
        resetDemoLayout,
        quickDemo,
        setRefreshGraphSoon
    };
};
