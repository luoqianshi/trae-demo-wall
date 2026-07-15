// 墨脉 MoMai - 布局模块
// 包含布局系统：freeLayout, gridLayout(网格分屏), demoCollapsed, breakpoint, fullscreen, resize, maximize
window.MoMaiModules = window.MoMaiModules || {};
window.MoMaiModules.layout = function(Vue, deps) {
    const { ref, computed, watch, nextTick } = Vue;
    const { activeNoteId, activeRoadshowTab, filteredNotes, notes } = deps;

    // === 自由面板布局系统 ===
    const freeLayout = ref(false);

    // 面板宽度状态（百分比）
    const panelWidths = ref({
        tags: 30,
        notes: 55,
        graph: 15
    });

    // 面板最大化状态
    const maximizedPanel = ref(null); // null | 'tags' | 'notes' | 'graph'

    // 拖拽调整宽度
    const resizingPanel = ref(null);
    const resizeStartX = ref(0);
    const resizeStartWidths = ref({});

    const startResize = (event, divider) => {
        resizingPanel.value = divider;
        resizeStartX.value = event.clientX;
        resizeStartWidths.value = { ...panelWidths.value };
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
        event.preventDefault();
    };

    const onResize = (event) => {
        if (!resizingPanel.value) return;
        const dx = event.clientX - resizeStartX.value;
        const containerWidth = document.querySelector('.demo-workspace')?.offsetWidth || window.innerWidth - 56;
        const dpPercent = (dx / containerWidth) * 100;

        if (resizingPanel.value === 'tags-notes') {
            const newTags = Math.max(15, Math.min(45, resizeStartWidths.value.tags + dpPercent));
            const newNotes = Math.max(25, Math.min(70, resizeStartWidths.value.notes - dpPercent));
            panelWidths.value.tags = newTags;
            panelWidths.value.notes = newNotes;
        } else if (resizingPanel.value === 'notes-graph') {
            const newNotes = Math.max(25, Math.min(70, resizeStartWidths.value.notes + dpPercent));
            const newGraph = Math.max(10, 100 - panelWidths.value.tags - newNotes);
            panelWidths.value.graph = newGraph;
            panelWidths.value.notes = newNotes;
        }
    };

    const stopResize = () => {
        resizingPanel.value = null;
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
    };

    // 最大化面板
    const toggleMaximize = (panel) => {
        if (maximizedPanel.value === panel) {
            maximizedPanel.value = null;
        } else {
            maximizedPanel.value = panel;
        }
    };

    // === 网格分屏布局系统 ===
    const gridLayout = ref({
        columns: 1,
        rows: 1,
        cells: [{ id: 'cell-0', panel: 'main', noteId: '' }]
    });

    // 列/行尺寸比例数组（浮点数，总和=1）
    const colSizes = ref([1]);
    const rowSizes = ref([1]);

    // 分隔线拖拽状态
    const resizingDivider = ref(null); // null | { type: 'col'|'row', index, startX, startSizes }

    // 格子 ID 自增计数器
    let cellIdCounter = 1;
    const nextCellId = () => 'cell-' + (cellIdCounter++);

    // === 图谱面板：双击笔记详情 ===
    const graphDetailNoteId = ref(null);
    const graphDetailRatio = ref(0.55); // 图谱占的比例
    const graphDetailResizing = ref(false);
    const graphDetailResizeStart = ref({ my: 0, startRatio: 0 });

    const setGraphDetailNote = (noteId) => { graphDetailNoteId.value = noteId; };
    const graphDetailNote = computed(() => {
        if (!graphDetailNoteId.value) return null;
        return notes.value.find(n => n.id === graphDetailNoteId.value) || null;
    });

    const startGraphDetailResize = (event) => {
        event.preventDefault();
        const container = event.currentTarget.parentElement;
        graphDetailResizing.value = true;
        graphDetailResizeStart.value = { my: event.clientY, startRatio: graphDetailRatio.value };
        const onMove = (e) => {
            const containerRect = container.getBoundingClientRect();
            const dy = e.clientY - graphDetailResizeStart.value.my;
            const dRatio = dy / containerRect.height;
            graphDetailRatio.value = Math.max(0.25, Math.min(0.85, graphDetailResizeStart.value.startRatio + dRatio));
        };
        const onUp = () => {
            graphDetailResizing.value = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    // === 浮动工具栏拖拽 ===
    const toolbarPos = ref({ x: null, y: null }); // null = 居中默认
    const toolbarDragging = ref(false);
    const toolbarDragStart = ref({ mx: 0, my: 0, ox: 0, oy: 0 });

    const toolbarDragStyle = computed(() => {
        if (toolbarPos.value.x === null) return {};
        return {
            left: toolbarPos.value.x + 'px',
            top: toolbarPos.value.y + 'px',
            transform: 'none'
        };
    });

    const startToolbarDrag = (event) => {
        const container = event.currentTarget.parentElement;
        const rect = event.currentTarget.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();

        // 首次拖拽：把当前居中位置换算为绝对坐标
        let ox, oy;
        if (toolbarPos.value.x === null) {
            ox = rect.left - parentRect.left;
            oy = rect.top - parentRect.top;
        } else {
            ox = toolbarPos.value.x;
            oy = toolbarPos.value.y;
        }

        toolbarDragging.value = true;
        toolbarDragStart.value = { mx: event.clientX, my: event.clientY, ox, oy };

        const onMove = (e) => {
            const dx = e.clientX - toolbarDragStart.value.mx;
            const dy = e.clientY - toolbarDragStart.value.my;
            toolbarPos.value = {
                x: Math.max(0, Math.min(ox + dx, parentRect.width - rect.width)),
                y: Math.max(0, Math.min(oy + dy, parentRect.height - rect.height))
            };
        };
        const onUp = () => {
            toolbarDragging.value = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    // 面板拖拽状态
    const panelDragSource = ref(null);
    const panelDragTarget = ref(null);

    // 使用占位符，后续由 app.js 注入
    let _refreshGraphSoon = () => {};

    const setRefreshGraphSoon = (fn) => { _refreshGraphSoon = fn; };

    // === 网格 computed ===
    const isGridLayoutActive = computed(() => gridLayout.value.cells.length > 1);
    const controlSidebarHidden = computed(() => isGridLayoutActive.value);

    const gridRows = computed(() => {
        const { columns, rows, cells } = gridLayout.value;
        const result = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < columns; c++) {
                const flatIdx = r * columns + c;
                if (flatIdx < cells.length) {
                    row.push({ ...cells[flatIdx], rowIndex: r, colIndex: c, gridIndex: flatIdx });
                }
            }
            result.push(row);
        }
        return result;
    });

    // === 分隔线拖拽 ===
    const startDividerResize = (event, type, index) => {
        resizingDivider.value = {
            type, index,
            startX: type === 'col' ? event.clientX : event.clientY,
            startSizes: type === 'col' ? [...colSizes.value] : [...rowSizes.value]
        };
        document.addEventListener('mousemove', onDividerResize);
        document.addEventListener('mouseup', stopDividerResize);
        event.preventDefault();
        event.stopPropagation();
    };

    const onDividerResize = (event) => {
        const d = resizingDivider.value;
        if (!d) return;
        const container = document.querySelector('.workspace-grid');
        if (!container) return;
        const totalSize = d.type === 'col' ? container.clientWidth : container.clientHeight;
        if (totalSize === 0) return;
        const currentPos = d.type === 'col' ? event.clientX : event.clientY;
        const delta = (currentPos - d.startX) / totalSize;

        const sizes = d.type === 'col' ? colSizes.value : rowSizes.value;
        const MIN_SIZE = 0.15;
        const i = d.index;
        const sumAB = d.startSizes[i] + d.startSizes[i + 1];

        // 计算新的比例，保持总和不变
        const newA = Math.max(MIN_SIZE, Math.min(sumAB - MIN_SIZE, d.startSizes[i] + delta));
        const newB = sumAB - newA;

        sizes[i] = newA;
        sizes[i + 1] = newB;
    };

    const stopDividerResize = () => {
        resizingDivider.value = null;
        document.removeEventListener('mousemove', onDividerResize);
        document.removeEventListener('mouseup', stopDividerResize);
    };

    // === 样式计算 ===
    const rowStyle = (rowIdx) => ({
        display: 'flex',
        flex: `${(rowSizes.value[rowIdx] || 1)} 1 0%`,
        minHeight: '0'
    });

    const cellStyle = (colIdx) => ({
        flex: `${(colSizes.value[colIdx] || 1)} 1 0%`,
        minHeight: '0',
        minWidth: '0'
    });

    // === 网格布局操作 ===
    const setGridLayout = (cols, rows) => {
        const total = cols * rows;
        const firstCell = gridLayout.value.cells[0] || { id: 'cell-0', panel: 'main', noteId: activeNoteId.value };
        const newCells = [{ ...firstCell, id: firstCell.id || 'cell-0' }];

        for (let i = 1; i < total; i++) {
            if (gridLayout.value.cells[i]) {
                newCells.push({ ...gridLayout.value.cells[i] });
            } else {
                newCells.push({
                    id: nextCellId(),
                    panel: 'note',
                    noteId: ''  // 默认空，显示笔记总览供用户选择
                });
            }
        }

        gridLayout.value.columns = cols;
        gridLayout.value.rows = rows;
        gridLayout.value.cells = newCells;

        colSizes.value = Array(cols).fill(1 / cols);
        rowSizes.value = Array(rows).fill(1 / rows);

        _refreshGraphSoon();
    };

    // 快捷分屏函数
    const setSplit1 = () => {
        gridLayout.value = { columns: 1, rows: 1, cells: [{ id: 'cell-0', panel: 'main', noteId: '' }] };
        colSizes.value = [1];
        rowSizes.value = [1];
        _refreshGraphSoon();
    };
    const setSplit2 = () => setGridLayout(2, 1);
    const setSplit3 = () => setGridLayout(3, 1);
    const setSplit4 = () => setGridLayout(2, 2);

    const addSplitPanel = () => {
        const len = gridLayout.value.cells.length;
        if (len >= 4) return;
        if (len === 1) { setSplit2(); return; }
        if (len === 2) { setSplit3(); return; }
        if (len === 3) { setSplit4(); return; }
    };

    const removeSplitPanel = (idx) => {
        if (idx === 0) return;
        gridLayout.value.cells.splice(idx, 1);
        const len = gridLayout.value.cells.length;
        if (len === 1) { setSplit1(); return; }
        if (len === 2) {
            gridLayout.value.columns = 2;
            gridLayout.value.rows = 1;
            colSizes.value = [0.5, 0.5];
            rowSizes.value = [1];
        }
        if (len === 3) {
            gridLayout.value.columns = 3;
            gridLayout.value.rows = 1;
            colSizes.value = [1/3, 1/3, 1/3];
            rowSizes.value = [1];
        }
        _refreshGraphSoon();
    };

    // 改变某格的面板类型
    const setCellPanel = (idx, panelType) => {
        if (gridLayout.value.cells[idx]) {
            gridLayout.value.cells[idx].panel = panelType;
            if (panelType === 'note' && !gridLayout.value.cells[idx].noteId) {
                gridLayout.value.cells[idx].noteId = activeNoteId.value;
            }
        }
    };

    // 拖拽面板到格子
    const onPanelDragStart = (e, idx) => { panelDragSource.value = idx; e.dataTransfer.effectAllowed = 'move'; };
    const onPanelDragOver = (e, idx) => { e.preventDefault(); panelDragTarget.value = idx; };
    const onCellDrop = (idx) => {
        if (panelDragSource.value !== null && panelDragSource.value !== idx) {
            const temp = { ...gridLayout.value.cells[panelDragSource.value] };
            gridLayout.value.cells[panelDragSource.value] = { ...gridLayout.value.cells[idx] };
            gridLayout.value.cells[idx] = temp;
        }
        panelDragSource.value = null;
        panelDragTarget.value = null;
    };

    // Fullscreen view state: null | 'graph' | 'plugins'
    const fullscreenView = ref(null);
    const graphSelectedNoteId = ref(null);
    const enterFullscreen = (view) => { fullscreenView.value = view; graphSelectedNoteId.value = null; };
    const exitFullscreen = () => { fullscreenView.value = null; graphSelectedNoteId.value = null; };

    // Computed: note selected in fullscreen graph
    const graphSelectedNote = computed(() => {
        if (!graphSelectedNoteId.value) return null;
        return notes.value.find(n => n.id === graphSelectedNoteId.value) || null;
    });

    // Responsive breakpoint state
    const breakpoint = ref('xl');
    const mobileTab = ref('notes');

    const updateBreakpoint = () => {
        const w = window.innerWidth;
        if (w >= 1280) breakpoint.value = 'xl';
        else if (w >= 1024) breakpoint.value = 'lg';
        else if (w >= 768) breakpoint.value = 'md';
        else breakpoint.value = 'sm';
    };

    // 使用占位符，后续由 app.js 注入
    let _initD3Graph = () => {};

    const setInitD3Graph = (fn) => { _initD3Graph = fn; };

    // demoCollapsed
    const demoCollapsed = ref({
        left: false,
        notes: false,
        plugins: false,
        graph: false
    });

    // Auto-collapse based on breakpoint
    watch(breakpoint, (bp) => {
        if (bp === 'lg') {
            demoCollapsed.value.left = true;
            demoCollapsed.value.notes = false;
            demoCollapsed.value.plugins = false;
        } else if (bp === 'md') {
            demoCollapsed.value.left = true;
            demoCollapsed.value.notes = false;
            demoCollapsed.value.plugins = false;
        } else if (bp === 'sm') {
            demoCollapsed.value.left = true;
            demoCollapsed.value.notes = false;
            demoCollapsed.value.plugins = true;
            mobileTab.value = 'notes';
        } else {
            demoCollapsed.value.left = false;
            demoCollapsed.value.notes = false;
            demoCollapsed.value.plugins = false;
        }
        nextTick(() => setTimeout(_initD3Graph, 350));
    }, { immediate: false });

    // Redraw graph when entering fullscreen
    watch(fullscreenView, (view) => {
        if (view === 'graph') {
            nextTick(() => setTimeout(_initD3Graph, 300));
        }
    });

    return {
        freeLayout,
        panelWidths,
        maximizedPanel,
        resizingPanel,
        startResize,
        onResize,
        stopResize,
        toggleMaximize,
        // 网格分屏
        gridLayout,
        colSizes,
        rowSizes,
        resizingDivider,
        startDividerResize,
        onDividerResize,
        stopDividerResize,
        isGridLayoutActive,
        controlSidebarHidden,
        gridRows,
        rowStyle,
        cellStyle,
        toolbarDragStyle,
        startToolbarDrag,
        // 图谱面板双击详情
        graphDetailNoteId,
        graphDetailRatio,
        setGraphDetailNote,
        graphDetailNote,
        startGraphDetailResize,
        panelDragSource,
        panelDragTarget,
        setGridLayout,
        setSplit1,
        setSplit2,
        setSplit3,
        setSplit4,
        addSplitPanel,
        removeSplitPanel,
        setCellPanel,
        onPanelDragStart,
        onPanelDragOver,
        onCellDrop,
        // Fullscreen
        fullscreenView,
        graphSelectedNoteId,
        enterFullscreen,
        exitFullscreen,
        graphSelectedNote,
        // Responsive
        breakpoint,
        mobileTab,
        updateBreakpoint,
        demoCollapsed,
        // Cross-module
        setRefreshGraphSoon,
        setInitD3Graph
    };
};
