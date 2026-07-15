// 墨脉 MoMai - 应用入口模块
// createApp + setup() 骨架 + return 对象 + mount
const { createApp, ref, computed, watch, nextTick, onMounted } = Vue;

createApp({
    setup() {
        // === 核心视图状态 ===
        const activeView = ref('landing');
        const activeRoadshowTab = ref('tags');
        const isJiangnanTheme = ref(false);
        const activeNoteId = ref('note1');
        const activeFolder = ref('all');
        const activeSceneTab = ref('study');
        const setActiveSceneTab = (tab) => { activeSceneTab.value = tab; };

        // landing 页锚点平滑滚动（处理嵌套滚动容器）
        const scrollToAnchor = (anchorId) => {
            const el = document.getElementById(anchorId);
            if (el) {
                const scrollContainer = el.closest('.overflow-y-auto') || window;
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        // === 加载各模块 ===

        // 1. 数据模块（无依赖）
        const data = MoMaiModules.data(Vue, {});

        // 2. 编辑器模块（依赖 data 中的 ref）
        const editor = MoMaiModules.editor(Vue, {
            ...data,
            activeNoteId,
            activeFolder
        });

        // 3. 布局模块（依赖 activeNoteId, filteredNotes, notes）
        const layout = MoMaiModules.layout(Vue, {
            activeNoteId,
            activeRoadshowTab,
            filteredNotes: editor.filteredNotes,
            notes: data.notes
        });

        // 4. 图谱模块（依赖 filteredNotes, activeNoteId, fullscreenView, selectNote, setGraphDetailNote, isGridLayoutActive）
        const graph = MoMaiModules.graph(Vue, {
            filteredNotes: editor.filteredNotes,
            activeNoteId,
            fullscreenView: layout.fullscreenView,
            graphSelectedNoteId: layout.graphSelectedNoteId,
            selectNote: editor.selectNote,
            setGraphDetailNote: layout.setGraphDetailNote,
            isGridLayoutActive: layout.isGridLayoutActive
        });

        // 5. 插件模块（依赖 activeNote）
        const plugins = MoMaiModules.plugins(Vue, {
            activeNote: editor.activeNote
        });

        // 6. 工具函数模块（依赖多个模块的状态 + setSplit1）
        const utils = MoMaiModules.utils(Vue, {
            notes: data.notes,
            isJiangnanTheme,
            demoCollapsed: layout.demoCollapsed,
            activeRoadshowTab,
            freeLayout: layout.freeLayout,
            maximizedPanel: layout.maximizedPanel,
            panelWidths: layout.panelWidths,
            gridLayout: layout.gridLayout,
            activeNoteId,
            togglePlugin: plugins.togglePlugin,
            setSplit1: layout.setSplit1
        });

        // === 注入跨模块回调 ===
        layout.setInitD3Graph(graph.initD3Graph);
        layout.setRefreshGraphSoon(graph.refreshGraphSoon);
        editor.setRefreshGraphSoon(graph.refreshGraphSoon);
        editor.setTogglePlugin(plugins.togglePlugin);
        utils.setRefreshGraphSoon(graph.refreshGraphSoon);

        // === 全局 watchers ===

        // Watch notes and active note update events to redraw graph
        watch([editor.filteredNotes, activeNoteId], () => {
            if (editor.filteredNotes.value.length && !editor.filteredNotes.value.some(note => note.id === activeNoteId.value)) {
                activeNoteId.value = editor.filteredNotes.value[0].id;
                return;
            }
            nextTick(() => {
                graph.initD3Graph();
            });
        }, { deep: true });

        watch(activeView, (view) => {
            if (view === 'demo') {
                nextTick(() => {
                    graph.initD3Graph();
                });
            }
        });

        // 监听 gridLayout.cells 变化，重绘所有图谱格子
        watch(() => layout.gridLayout.value.cells.map(c => c.panel).join(','), () => {
            nextTick(() => {
                setTimeout(() => {
                    // 重绘主图谱
                    graph.initD3Graph();
                    // 重绘分屏格子中的图谱
                    layout.gridLayout.value.cells.forEach(cell => {
                        if (cell.panel === 'graph' && cell.id) {
                            graph.renderGraphInto(
                                'd3-cell-' + cell.id,
                                'tooltip-cell-' + cell.id,
                                'xl'
                            );
                        }
                    });
                }, 400);
            });
        });

        onMounted(() => {
            layout.updateBreakpoint();
            graph.initD3Graph();
            let resizeTimer = null;
            window.addEventListener('resize', () => {
                layout.updateBreakpoint();
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    graph.initD3Graph();
                }, 200);
            });
        });

        return {
            // 核心视图状态
            activeView,
            activeRoadshowTab,
            activeNoteId,
            activeFolder,
            isJiangnanTheme,
            activeSceneTab,
            setActiveSceneTab,
            scrollToAnchor,

            // 数据模块
            ...data,

            // 编辑器模块
            ...editor,

            // 布局模块
            ...layout,

            // 图谱模块
            ...graph,

            // 插件模块
            ...plugins,

            // 工具模块
            ...utils
        };
    }
}).mount('#app');
