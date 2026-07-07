/* ============================================
   app.js - 主应用逻辑
   串联 文本分析 / 图谱渲染 / 检索 / 详情展示
   ============================================ */

(function () {
    'use strict';

    /* ---------- DOM 元素引用 ---------- */
    const $ = (id) => document.getElementById(id);
    const dom = {
        inputText: $('inputText'),
        analyzeBtn: $('analyzeBtn'),
        clearBtn: $('clearBtn'),
        loadSampleBtn: $('loadSampleBtn'),
        importBtn: $('importBtn'),
        importFile: $('importFile'),
        charCount: $('charCount'),
        // stats
        statNodes: $('statNodes'),
        statEdges: $('statEdges'),
        statCategories: $('statCategories'),
        statDensity: $('statDensity'),
        // legend
        legend: $('legend'),
        // controls
        resetLayoutBtn: $('resetLayoutBtn'),
        zoomInBtn: $('zoomInBtn'),
        zoomOutBtn: $('zoomOutBtn'),
        fitViewBtn: $('fitViewBtn'),
        exportPngBtn: $('exportPngBtn'),
        saveDataBtn: $('saveDataBtn'),
        showLabels: $('showLabels'),
        showAllLabels: $('showAllLabels'),
        // canvas
        graphSvg: $('graphSvg'),
        canvasWrap: $('canvasWrap'),
        canvasStatus: $('canvasStatus'),
        zoomLevel: $('zoomLevel'),
        emptyState: $('emptyState'),
        loadingOverlay: $('loadingOverlay'),
        // search
        searchInput: $('searchInput'),
        searchResults: $('searchResults'),
        // detail
        detailContent: $('detailContent'),
        recommendSection: $('recommendSection'),
        recommendList: $('recommendList'),
        // insights
        insightSection: $('insightSection'),
        insightList: $('insightList'),
        // 节点编辑
        addNodeBtn: $('addNodeBtn'),
        removeNodeBtn: $('removeNodeBtn'),
        addEdgeBtn: $('addEdgeBtn'),
        addNodeModal: $('addNodeModal'),
        addNodeName: $('addNodeName'),
        addNodeCategory: $('addNodeCategory'),
        addNodeConfirm: $('addNodeConfirm'),
        addNodeCancel: $('addNodeCancel'),
        addNodeClose: $('addNodeClose'),
        edgeModeBanner: $('edgeModeBanner'),
        edgeModeText: $('edgeModeText'),
        // footer
        lastAction: $('lastAction'),
        toast: $('toast')
    };

    /* ---------- 状态 ---------- */
    const state = {
        currentData: null,    // {nodes, edges, sentences, stats}
        graph: null,          // KnowledgeGraph 实例
        currentSampleIdx: 0,
        // 节点编辑状态
        edgeMode: false,            // 是否处于「添加关联」模式
        edgeSourceId: null,         // 关联起点节点 id
        addNodeSelectedCat: 'technology'  // 添加节点弹窗中选中的类别
    };

    /* ---------- 初始化图谱 ---------- */
    function initGraph() {
        state.graph = new KnowledgeGraph(dom.graphSvg, {
            onNodeClick: (node) => {
                if (state.edgeMode) {
                    handleEdgeModeClick(node);
                } else {
                    showNodeDetail(node);
                }
            },
            onBackgroundClick: () => {
                if (state.edgeMode) {
                    exitEdgeMode();
                    toast('已取消关联模式');
                } else {
                    clearDetail();
                }
            },
            onZoom: (scale) => {
                dom.zoomLevel.textContent = Math.round(scale * 100) + '%';
            }
        });
    }

    /* ---------- Toast 提示 ---------- */
    let toastTimer = null;
    function toast(msg, type) {
        dom.toast.textContent = msg;
        dom.toast.className = 'toast show' + (type ? ' ' + type : '');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            dom.toast.className = 'toast';
        }, 2200);
    }

    function setAction(text) {
        dom.lastAction.textContent = text;
    }

    function setStatus(text) {
        dom.canvasStatus.textContent = text;
    }

    /* ---------- 字数统计 ---------- */
    function updateCharCount() {
        dom.charCount.textContent = dom.inputText.value.length;
    }

    /* ---------- 执行分析 ---------- */
    function doAnalyze() {
        const text = dom.inputText.value.trim();
        if (text.length < 10) {
            toast('请输入至少 10 个字符的文本内容', 'warning');
            dom.inputText.focus();
            return;
        }

        // 显示加载
        dom.loadingOverlay.classList.add('active');
        setStatus('正在分析…');
        setAction('开始智能分析');

        // 用 setTimeout 让 UI 有时间渲染加载态
        setTimeout(() => {
            try {
                const result = window.KGAnalyzer.analyze(text);
                if (result.nodes.length === 0) {
                    dom.loadingOverlay.classList.remove('active');
                    toast('未能从文本中提取到有效知识节点，请尝试更长的内容', 'warning');
                    setStatus('分析完成 · 未提取到节点');
                    return;
                }
                state.currentData = result;
                renderGraph(result);
                updateStats(result.stats);
                updateLegend(result.nodes);
                const insights = window.KGAnalyzer.analyzeInsights(result.nodes, result.edges);
                renderInsights(insights);
                clearDetail();
                dom.emptyState.style.display = 'none';
                dom.loadingOverlay.classList.remove('active');
                setStatus(`分析完成 · ${result.stats.nodes} 个节点 / ${result.stats.edges} 条关系`);
                setAction(`分析 ${result.stats.nodes} 节点 / ${result.stats.edges} 关系`);
                toast(`提取到 ${result.stats.nodes} 个知识节点，${result.stats.edges} 条关联关系`, 'success');
            } catch (err) {
                console.error(err);
                dom.loadingOverlay.classList.remove('active');
                toast('分析过程出错：' + err.message, 'error');
                setStatus('分析失败');
            }
        }, 350);
    }

    /* ---------- 渲染图谱 ---------- */
    function renderGraph(data) {
        state.graph.setData(data.nodes, data.edges);
        // 等模拟稳定后自动适应视图
        setTimeout(() => {
            state.graph.fitView();
        }, 600);
    }

    /* ---------- 更新统计 ---------- */
    function updateStats(stats) {
        animateNumber(dom.statNodes, stats.nodes);
        animateNumber(dom.statEdges, stats.edges);
        animateNumber(dom.statCategories, stats.categories);
        dom.statDensity.textContent = stats.density + '%';
    }

    function animateNumber(el, target) {
        const start = parseInt(el.textContent) || 0;
        const duration = 500;
        const startTime = performance.now();
        function step(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const val = Math.round(start + (target - start) * (1 - Math.pow(1 - t, 3)));
            el.textContent = val;
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ---------- 更新图例 ---------- */
    function updateLegend(nodes) {
        const catCounts = {};
        for (const n of nodes) {
            catCounts[n.category] = (catCounts[n.category] || 0) + 1;
        }
        const cats = window.KGAnalyzer.CATEGORIES;
        let html = '';
        // 按数量排序
        const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
        for (const [key, count] of sorted) {
            const cat = cats[key];
            if (!cat) continue;
            html += `
                <div class="legend-item" data-cat="${key}">
                    <div class="legend-dot" style="background:${cat.color};color:${cat.color}"></div>
                    <span class="legend-label">${cat.label}</span>
                    <span class="legend-count">${count}</span>
                </div>`;
        }
        dom.legend.innerHTML = html;

        // 图例点击：聚焦该类别节点（高亮）
        dom.legend.querySelectorAll('.legend-item').forEach(item => {
            item.addEventListener('click', () => {
                const cat = item.dataset.cat;
                // 在搜索结果中显示该类别所有节点
                const matched = state.currentData.nodes.filter(n => n.category === cat);
                showSearchResults(matched.map(n => ({ node: n, score: 1 })));
                dom.searchInput.value = '';
                toast(`已筛选「${cats[cat].label}」类别 ${matched.length} 个节点`);
            });
        });
    }

    /* ---------- 节点详情 ---------- */
    function showNodeDetail(node) {
        const cat = window.KGAnalyzer.CATEGORIES[node.category];
        const edges = state.currentData.edges;
        const allNodes = state.currentData.nodes;

        // 找出关联节点
        const relations = [];
        for (const e of edges) {
            if (e.source === node.id) {
                const t = allNodes.find(n => n.id === e.target);
                if (t) relations.push({ node: t, weight: e.weight });
            } else if (e.target === node.id) {
                const s = allNodes.find(n => n.id === e.source);
                if (s) relations.push({ node: s, weight: e.weight });
            }
        }
        relations.sort((a, b) => b.weight - a.weight);

        // 推荐关联
        const recommendations = window.KGAnalyzer.recommend(node.id, edges, allNodes, 5);

        // 渲染详情卡片
        const contextHtml = node.contexts && node.contexts.length > 0
            ? node.contexts.map(c => `<div>${escapeHtml(c)}</div>`).join('')
            : '<div style="color:var(--text-muted)">暂无上下文</div>';

        let relationsHtml = '';
        if (relations.length > 0) {
            relationsHtml = relations.slice(0, 8).map(r => {
                const rcat = window.KGAnalyzer.CATEGORIES[r.node.category];
                return `
                    <div class="relation-item" data-id="${r.node.id}">
                        <div class="relation-dot" style="background:${rcat.color}"></div>
                        <span class="relation-name">${escapeHtml(r.node.label)}</span>
                        <span class="relation-weight">共现 ${r.weight} 次</span>
                    </div>`;
            }).join('');
        } else {
            relationsHtml = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0">暂无直接关联</div>';
        }

        dom.detailContent.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div class="detail-node-dot" style="background:${cat.color};color:${cat.color}"></div>
                    <div class="detail-name">${escapeHtml(node.label)}</div>
                </div>
                <span class="detail-cat-tag" style="background:${cat.color}">${cat.label}</span>
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <div class="detail-meta-value">${node.weight}</div>
                        <div class="detail-meta-label">出现次数</div>
                    </div>
                    <div class="detail-meta-item">
                        <div class="detail-meta-value">${relations.length}</div>
                        <div class="detail-meta-label">关联节点</div>
                    </div>
                </div>
                <div class="detail-section-title">上下文</div>
                <div class="detail-context">${contextHtml}</div>
                <div class="detail-section-title">直接关联（${relations.length}）</div>
                <div class="relation-list">${relationsHtml}</div>
            </div>
        `;

        // 关联节点点击
        dom.detailContent.querySelectorAll('.relation-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const target = allNodes.find(n => n.id === id);
                if (target) {
                    state.graph.focusNode(id);
                    showNodeDetail(target);
                }
            });
        });

        // 推荐关联
        if (recommendations.length > 0) {
            let recHtml = '';
            recommendations.forEach((r, idx) => {
                const rcat = window.KGAnalyzer.CATEGORIES[r.node.category];
                recHtml += `
                    <div class="recommend-item" data-id="${r.node.id}">
                        <div class="recommend-rank">${idx + 1}</div>
                        <div class="recommend-info">
                            <div class="recommend-name">${escapeHtml(r.node.label)}</div>
                            <div class="recommend-reason">${r.reason} · ${rcat.label}</div>
                        </div>
                    </div>`;
            });
            dom.recommendList.innerHTML = recHtml;
            dom.recommendSection.style.display = '';
            dom.recommendList.querySelectorAll('.recommend-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const target = allNodes.find(n => n.id === id);
                    if (target) {
                        state.graph.focusNode(id);
                        showNodeDetail(target);
                    }
                });
            });
        } else {
            dom.recommendSection.style.display = 'none';
        }

        setAction(`查看节点：${node.label}`);
    }

    /* ---------- 知识洞察 ---------- */
    function renderInsights(insights) {
        const hasAny = insights && (
            insights.coreTopic ||
            (insights.hubs && insights.hubs.length > 0) ||
            (insights.isolated && insights.isolated.length > 0) ||
            (insights.categoryDistribution && insights.categoryDistribution.length > 0)
        );
        if (!hasAny) {
            dom.insightSection.style.display = 'none';
            dom.insightList.innerHTML = '';
            return;
        }

        const cats = window.KGAnalyzer.CATEGORIES;
        let html = '';

        // 核心主题：高亮卡片
        if (insights.coreTopic) {
            const ct = insights.coreTopic;
            const cat = cats[ct.node.category] || { color: '#a8a8b8', label: '其他' };
            html += `
                <div class="insight-card insight-card-core" data-id="${ct.node.id}" data-focusable="1">
                    <div class="insight-card-header">
                        <span class="insight-icon">⭐</span>
                        <span class="insight-label">核心主题</span>
                        <span class="insight-badge">${ct.degree} 关联</span>
                    </div>
                    <div class="insight-card-body">
                        <div class="insight-node-name" style="--node-color:${cat.color}">${escapeHtml(ct.node.label)}</div>
                        <div class="insight-desc">关联数最多的节点，是整个知识网络的核心</div>
                    </div>
                </div>`;
        }

        // 知识枢纽：可点击聚焦
        if (insights.hubs && insights.hubs.length > 0) {
            const topHubs = insights.hubs.slice(0, 3);
            for (const h of topHubs) {
                const cat = cats[h.node.category] || { color: '#a8a8b8', label: '其他' };
                const catLabels = h.neighborCategories
                    .map(k => (cats[k] && cats[k].label) || k)
                    .join(' · ');
                html += `
                    <div class="insight-card insight-card-hub" data-id="${h.node.id}" data-focusable="1">
                        <div class="insight-card-header">
                            <span class="insight-icon">🔗</span>
                            <span class="insight-label">知识枢纽</span>
                            <span class="insight-badge">跨 ${h.neighborCategories.length} 类</span>
                        </div>
                        <div class="insight-card-body">
                            <div class="insight-node-name" style="--node-color:${cat.color}">${escapeHtml(h.node.label)}</div>
                            <div class="insight-desc">连接 ${escapeHtml(catLabels)}，是跨领域知识桥梁</div>
                        </div>
                    </div>`;
            }
        }

        // 孤立节点：警示色提示
        if (insights.isolated && insights.isolated.length > 0) {
            const isoList = insights.isolated.slice(0, 6).map(i => {
                const cat = cats[i.node.category] || { color: '#a8a8b8', label: '其他' };
                return `<span class="insight-iso-tag" data-id="${i.node.id}" data-focusable="1" style="--node-color:${cat.color}" title="度=${i.degree}，点击聚焦">${escapeHtml(i.node.label)}</span>`;
            }).join('');
            html += `
                <div class="insight-card insight-card-warn">
                    <div class="insight-card-header">
                        <span class="insight-icon">⚠️</span>
                        <span class="insight-label">知识薄弱点</span>
                        <span class="insight-badge">${insights.isolated.length} 个</span>
                    </div>
                    <div class="insight-card-body">
                        <div class="insight-desc">以下节点关联稀少（0-1 条），建议补充相关内容：</div>
                        <div class="insight-iso-list">${isoList}</div>
                    </div>
                </div>`;
        }

        // 类别分布：进度条
        if (insights.categoryDistribution && insights.categoryDistribution.length > 0) {
            let bars = '';
            for (const c of insights.categoryDistribution) {
                bars += `
                    <div class="insight-dist-row">
                        <div class="insight-dist-label">
                            <span class="insight-dist-dot" style="background:${c.color}"></span>
                            <span>${escapeHtml(c.label)}</span>
                        </div>
                        <div class="insight-dist-bar">
                            <div class="insight-dist-fill" style="width:0%;background:${c.color}" data-target="${c.percentage}"></div>
                        </div>
                        <div class="insight-dist-count">${c.count} · ${c.percentage}%</div>
                    </div>`;
            }
            html += `
                <div class="insight-card insight-card-dist">
                    <div class="insight-card-header">
                        <span class="insight-icon">📊</span>
                        <span class="insight-label">类别分布</span>
                    </div>
                    <div class="insight-card-body">
                        <div class="insight-dist-list">${bars}</div>
                    </div>
                </div>`;
        }

        dom.insightList.innerHTML = html;
        dom.insightSection.style.display = '';

        // 进度条动画（下一帧应用目标宽度）
        requestAnimationFrame(() => {
            dom.insightList.querySelectorAll('.insight-dist-fill').forEach(el => {
                el.style.width = el.dataset.target + '%';
            });
        });

        // 点击「核心主题」或「知识枢纽」/孤立节点标签 → 聚焦
        dom.insightList.querySelectorAll('[data-focusable="1"]').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.id;
                const target = state.currentData.nodes.find(n => n.id === id);
                if (target) {
                    state.graph.focusNode(id);
                    showNodeDetail(target);
                    setAction(`洞察聚焦：${target.label}`);
                }
            });
        });
    }

    function clearDetail() {
        dom.detailContent.innerHTML = `
            <div class="detail-empty">
                <div class="empty-icon-small">💡</div>
                <p>点击图谱中的节点查看详情</p>
                <p class="detail-hint">节点会展示类别、关联数、关联节点推荐等信息</p>
            </div>`;
        dom.recommendSection.style.display = 'none';
    }

    /* ---------- 搜索 ---------- */
    function doSearch() {
        const query = dom.searchInput.value.trim();
        if (!query || !state.currentData) {
            dom.searchResults.innerHTML = '';
            return;
        }
        const results = window.KGAnalyzer.search(state.currentData.nodes, query);
        showSearchResults(results);
    }

    function showSearchResults(results) {
        if (results.length === 0) {
            dom.searchResults.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;text-align:center">未找到匹配节点</div>';
            return;
        }
        const cats = window.KGAnalyzer.CATEGORIES;
        let html = '';
        for (const r of results) {
            const cat = cats[r.node.category];
            html += `
                <div class="search-result-item" data-id="${r.node.id}">
                    <div class="search-result-dot" style="background:${cat.color}"></div>
                    <span class="search-result-label">${escapeHtml(r.node.label)}</span>
                    <span class="search-result-cat">${cat.label}</span>
                </div>`;
        }
        dom.searchResults.innerHTML = html;
        dom.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const target = state.currentData.nodes.find(n => n.id === id);
                if (target) {
                    state.graph.focusNode(id);
                    showNodeDetail(target);
                }
            });
        });
    }

    /* ---------- 加载示例 ---------- */
    function loadSample() {
        // 循环加载不同示例
        const samples = window.SAMPLE_DATA.list;
        const sample = samples[state.currentSampleIdx % samples.length];
        state.currentSampleIdx++;
        dom.inputText.value = sample.text;
        updateCharCount();
        doAnalyze();
        toast(`已加载示例：${sample.name}`, 'success');
    }

    /* ---------- 清空 ---------- */
    function clearAll() {
        dom.inputText.value = '';
        updateCharCount();
        state.currentData = null;
        state.graph.clear();
        dom.emptyState.style.display = '';
        dom.searchInput.value = '';
        dom.searchResults.innerHTML = '';
        clearDetail();
        // 重置统计
        dom.statNodes.textContent = '0';
        dom.statEdges.textContent = '0';
        dom.statCategories.textContent = '0';
        dom.statDensity.textContent = '0%';
        // 重置图例
        dom.legend.innerHTML = '<div class="legend-empty">分析后显示类别</div>';
        // 重置洞察
        dom.insightSection.style.display = 'none';
        dom.insightList.innerHTML = '';
        setStatus('就绪 · 点击「加载示例」开始体验');
        setAction('已清空');
        toast('已清空');
    }

    /* ---------- 同步 currentData 与图谱一致 ---------- */
    function syncCurrentData() {
        if (!state.graph) return;
        if (!state.currentData) {
            state.currentData = { nodes: [], edges: [], sentences: [], stats: { nodes: 0, edges: 0, categories: 0, density: 0 } };
        }
        state.currentData.nodes = state.graph.nodes.map(n => ({
            id: n.id, label: n.label, category: n.category,
            weight: n.weight, score: n.score || 0, contexts: n.contexts || [], size: n.size
        }));
        state.currentData.edges = state.graph.edges.map(e => ({
            source: e.source, target: e.target,
            weight: e.weight, strength: e.strength || e.weight || 1
        }));
        const cats = new Set(state.currentData.nodes.map(n => n.category));
        const n = state.currentData.nodes.length;
        const maxE = n * (n - 1) / 2;
        const density = maxE > 0 ? Math.round(state.currentData.edges.length / maxE * 100) : 0;
        state.currentData.stats = {
            nodes: n,
            edges: state.currentData.edges.length,
            categories: cats.size,
            density: density
        };
        updateStats(state.currentData.stats);
        updateLegend(state.currentData.nodes);
        if (window.KGAnalyzer && typeof window.KGAnalyzer.analyzeInsights === 'function' && dom.insightSection) {
            const insights = window.KGAnalyzer.analyzeInsights(state.currentData.nodes, state.currentData.edges);
            renderInsights(insights);
        }
    }

    /* ---------- 节点编辑：添加节点 ---------- */
    function openAddNodeModal() {
        if (!state.graph) return;
        // 若还没有数据，初始化一个空图谱以便从零构建
        if (!state.currentData) {
            state.currentData = { nodes: [], edges: [], sentences: [], stats: { nodes: 0, edges: 0, categories: 0, density: 0 } };
            dom.emptyState.style.display = 'none';
            setStatus('开始构建图谱');
        }
        dom.addNodeName.value = '';
        state.addNodeSelectedCat = 'technology';
        renderCategoryPicker();
        dom.addNodeModal.classList.add('active');
        setTimeout(() => dom.addNodeName.focus(), 50);
    }

    function closeAddNodeModal() {
        dom.addNodeModal.classList.remove('active');
    }

    function renderCategoryPicker() {
        const cats = window.KGAnalyzer.CATEGORIES;
        let html = '';
        for (const [key, cat] of Object.entries(cats)) {
            html += `<div class="cat-chip" data-cat="${key}">
                <span class="cat-chip-dot" style="background:${cat.color}"></span>
                <span>${cat.label}</span>
            </div>`;
        }
        dom.addNodeCategory.innerHTML = html;
        updateCategoryPickerSelection();
        dom.addNodeCategory.querySelectorAll('.cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                state.addNodeSelectedCat = chip.dataset.cat;
                updateCategoryPickerSelection();
            });
        });
    }

    function updateCategoryPickerSelection() {
        const cats = window.KGAnalyzer.CATEGORIES;
        dom.addNodeCategory.querySelectorAll('.cat-chip').forEach(chip => {
            const cat = cats[chip.dataset.cat];
            if (chip.dataset.cat === state.addNodeSelectedCat) {
                chip.classList.add('selected');
                chip.style.background = cat.color;
                chip.style.borderColor = 'transparent';
                chip.style.color = '#fff';
            } else {
                chip.classList.remove('selected');
                chip.style.background = '';
                chip.style.borderColor = '';
                chip.style.color = '';
            }
        });
    }

    function confirmAddNode() {
        const name = dom.addNodeName.value.trim();
        if (!name) {
            toast('请输入节点名称', 'warning');
            dom.addNodeName.focus();
            return;
        }
        // 同名检测
        const exists = state.graph.nodes.some(n => n.label === name);
        if (exists) {
            toast('已存在同名节点：' + name, 'warning');
            dom.addNodeName.focus();
            return;
        }
        const node = state.graph.addNode({
            label: name,
            category: state.addNodeSelectedCat,
            weight: 1,
            size: 22
        });
        closeAddNodeModal();
        if (node) {
            syncCurrentData();
            // 自动选中新节点并展示详情
            state.graph.selectNode(node.id);
            showNodeDetail(node);
            toast(`已添加节点：${name}`, 'success');
            setAction(`添加节点：${name}`);
            setStatus(`已添加节点 · 当前 ${state.currentData.stats.nodes} 个节点`);
        } else {
            toast('添加节点失败', 'error');
        }
    }

    /* ---------- 节点编辑：删除节点 ---------- */
    function deleteSelectedNode() {
        if (!state.currentData) {
            toast('请先加载或分析内容', 'warning');
            return;
        }
        const selectedId = state.graph.selectedId;
        if (!selectedId) {
            toast('请先选中要删除的节点', 'warning');
            return;
        }
        const node = state.graph.nodeById.get(selectedId);
        const name = node ? node.label : '';
        const removed = state.graph.removeNode(selectedId);
        if (removed) {
            clearDetail();
            syncCurrentData();
            toast(`已删除节点：${name}`, 'success');
            setAction(`删除节点：${name}`);
            setStatus(`已删除节点 · 当前 ${state.currentData.stats.nodes} 个节点`);
        } else {
            toast('删除节点失败', 'error');
        }
    }

    /* ---------- 节点编辑：添加关联 ---------- */
    function enterEdgeMode() {
        if (!state.currentData) {
            toast('请先加载或分析内容', 'warning');
            return;
        }
        const selectedId = state.graph.selectedId;
        if (!selectedId) {
            toast('请先选中一个节点作为关联起点', 'warning');
            return;
        }
        state.edgeMode = true;
        state.edgeSourceId = selectedId;
        dom.edgeModeBanner.classList.add('active');
        dom.canvasWrap.classList.add('edge-mode');
        const srcNode = state.graph.nodeById.get(selectedId);
        const srcLabel = srcNode ? srcNode.label : '';
        dom.edgeModeText.textContent = `关联模式：已选择「${srcLabel}」，请点击目标节点建立关联（点击空白处或按 ESC 取消）`;
        toast(`关联模式：已选择「${srcLabel}」，请点击目标节点`);
        setAction('关联模式：等待选择目标节点');
    }

    function exitEdgeMode() {
        state.edgeMode = false;
        state.edgeSourceId = null;
        dom.edgeModeBanner.classList.remove('active');
        dom.canvasWrap.classList.remove('edge-mode');
    }

    function handleEdgeModeClick(node) {
        const srcId = state.edgeSourceId;
        if (!srcId) {
            state.edgeSourceId = node.id;
            toast('已选择起点，请点击目标节点');
            return;
        }
        if (srcId === node.id) {
            toast('不能与同一节点建立关联', 'warning');
            return;
        }
        const srcNode = state.graph.nodeById.get(srcId);
        const edge = state.graph.addEdge(srcId, node.id, 1);
        if (edge) {
            syncCurrentData();
            toast(`已添加关联：${srcNode ? srcNode.label : ''} ↔ ${node.label}`, 'success');
            setAction(`添加关联：${srcNode ? srcNode.label : ''} ↔ ${node.label}`);
            // 选中目标节点并展示其详情
            state.graph.selectNode(node.id);
            showNodeDetail(node);
        } else {
            toast('该关联已存在', 'warning');
        }
        exitEdgeMode();
    }

    /* ---------- 工具：时间戳文件名 ---------- */
    function formatTimestamp() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
            `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    }

    /* ---------- 工具：触发下载 ---------- */
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ---------- 导出 PNG 图片（SVG → Canvas，保留暗色背景） ---------- */
    function exportPng() {
        if (!state.currentData || state.currentData.nodes.length === 0) {
            toast('当前没有可导出的图谱', 'warning');
            return;
        }

        const svg = dom.graphSvg;
        const rect = svg.getBoundingClientRect();
        const width = Math.max(1, Math.ceil(rect.width));
        const height = Math.max(1, Math.ceil(rect.height));

        // 克隆 SVG，并内联必要样式以保证脱离页面后渲染正确
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', width);
        clone.setAttribute('height', height);

        const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleEl.setAttribute('type', 'text/css');
        styleEl.textContent = [
            'text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }',
            '.node-label { fill: rgba(255,255,255,0.92); font-size: 11px; font-weight: 500; text-anchor: middle; }',
            '.edge { stroke: rgba(255,255,255,0.18); fill: none; }',
            '.node-circle { stroke: rgba(255,255,255,0.3); stroke-width: 1.5; }',
            '.node-circle.selected { stroke: #ffffff; stroke-width: 3; }',
            '.edge.highlighted { stroke: rgba(245,147,251,0.85); stroke-width: 2; }'
        ].join('\n');
        clone.insertBefore(styleEl, clone.firstChild);

        const svgData = new XMLSerializer().serializeToString(clone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const scale = 2; // 2 倍像素，提升清晰度
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            // 保留暗色背景
            ctx.fillStyle = '#0f1023';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (!blob) {
                    toast('图片生成失败', 'error');
                    return;
                }
                downloadBlob(blob, `知识图谱_${formatTimestamp()}.png`);
                toast('图片已导出', 'success');
                setAction('导出 PNG 图片');
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            toast('图片导出失败，请重试', 'error');
        };
        img.src = url;
    }

    /* ---------- 保存图谱数据为 JSON ---------- */
    function saveData() {
        if (!state.currentData || state.currentData.nodes.length === 0) {
            toast('当前没有可保存的图谱数据', 'warning');
            return;
        }
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            nodes: state.currentData.nodes.map(n => ({
                id: n.id,
                label: n.label,
                category: n.category,
                weight: n.weight,
                size: n.size,
                contexts: n.contexts || []
            })),
            edges: state.currentData.edges.map(e => ({
                source: e.source,
                target: e.target,
                weight: e.weight
            }))
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        downloadBlob(blob, `知识图谱数据_${formatTimestamp()}.json`);
        toast(`已保存 ${data.nodes.length} 个节点 / ${data.edges.length} 条关系`, 'success');
        setAction('保存图谱数据');
    }

    /* ---------- 导入 JSON 数据还原图谱 ---------- */
    function importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
                    toast('文件格式不正确：缺少 nodes 或 edges 字段', 'error');
                    return;
                }
                // 基本校验
                const validNode = data.nodes.every(n =>
                    n && typeof n.id !== 'undefined' && typeof n.label !== 'undefined' && n.category
                );
                if (!validNode) {
                    toast('节点数据格式不正确', 'error');
                    return;
                }

                const nodeCount = data.nodes.length;
                const edgeCount = data.edges.length;
                const categorySet = new Set(data.nodes.map(n => n.category));
                const maxPossible = nodeCount * (nodeCount - 1) / 2;
                const density = maxPossible > 0 ? Math.round((edgeCount / maxPossible) * 100) : 0;

                const result = {
                    nodes: data.nodes.map(n => ({
                        id: n.id,
                        label: n.label,
                        category: n.category,
                        weight: n.weight || 1,
                        size: n.size || 0,
                        contexts: Array.isArray(n.contexts) ? n.contexts : []
                    })),
                    edges: data.edges.map(e => ({
                        source: e.source,
                        target: e.target,
                        weight: e.weight || 1
                    })),
                    sentences: Array.isArray(data.sentences) ? data.sentences : [],
                    stats: {
                        nodes: nodeCount,
                        edges: edgeCount,
                        categories: categorySet.size,
                        density: density
                    }
                };

                state.currentData = result;
                renderGraph(result);
                updateStats(result.stats);
                updateLegend(result.nodes);
                const insights = window.KGAnalyzer.analyzeInsights(result.nodes, result.edges);
                renderInsights(insights);
                clearDetail();
                dom.emptyState.style.display = 'none';
                setStatus(`已导入 · ${result.stats.nodes} 个节点 / ${result.stats.edges} 条关系`);
                setAction(`导入 ${result.stats.nodes} 节点 / ${result.stats.edges} 关系`);
                toast(`成功导入 ${result.stats.nodes} 个节点 / ${result.stats.edges} 条关系`, 'success');
            } catch (err) {
                console.error(err);
                toast('JSON 解析失败：' + err.message, 'error');
            }
        };
        reader.onerror = () => toast('文件读取失败', 'error');
        reader.readAsText(file);
    }

    /* ---------- 工具：HTML 转义 ---------- */
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ---------- 事件绑定 ---------- */
    function bindEvents() {
        // 输入
        dom.inputText.addEventListener('input', updateCharCount);
        // Ctrl/Cmd + Enter 快捷分析
        dom.inputText.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                doAnalyze();
            }
        });

        // 按钮
        dom.analyzeBtn.addEventListener('click', doAnalyze);
        dom.clearBtn.addEventListener('click', clearAll);
        dom.loadSampleBtn.addEventListener('click', loadSample);

        // 导入数据
        dom.importBtn.addEventListener('click', () => dom.importFile.click());
        dom.importFile.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) importData(file);
            // 重置 value 以便相同文件可再次触发 change
            e.target.value = '';
        });

        // 图谱控制
        dom.resetLayoutBtn.addEventListener('click', () => {
            if (state.currentData) {
                state.graph.resetLayout();
                setTimeout(() => state.graph.fitView(), 800);
                toast('已重新布局');
            }
        });
        dom.zoomInBtn.addEventListener('click', () => state.graph.zoomBy(1.25));
        dom.zoomOutBtn.addEventListener('click', () => state.graph.zoomBy(0.8));
        dom.fitViewBtn.addEventListener('click', () => {
            state.graph.fitView();
            toast('已适应视图');
        });

        // 导出 / 保存
        dom.exportPngBtn.addEventListener('click', exportPng);
        dom.saveDataBtn.addEventListener('click', saveData);

        // 标签开关
        dom.showLabels.addEventListener('change', (e) => {
            state.graph.setShowLabels(e.target.checked);
        });
        dom.showAllLabels.addEventListener('change', (e) => {
            state.graph.setShowAllLabels(e.target.checked);
        });

        // 搜索
        let searchTimer = null;
        dom.searchInput.addEventListener('input', () => {
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(doSearch, 200);
        });
        dom.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = dom.searchResults.querySelector('.search-result-item');
                if (first) first.click();
            }
        });

        // 节点编辑
        dom.addNodeBtn.addEventListener('click', openAddNodeModal);
        dom.removeNodeBtn.addEventListener('click', deleteSelectedNode);
        dom.addEdgeBtn.addEventListener('click', enterEdgeMode);

        dom.addNodeConfirm.addEventListener('click', confirmAddNode);
        dom.addNodeCancel.addEventListener('click', closeAddNodeModal);
        dom.addNodeClose.addEventListener('click', closeAddNodeModal);

        // 弹窗内回车提交 / ESC 关闭
        dom.addNodeName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmAddNode();
            } else if (e.key === 'Escape') {
                closeAddNodeModal();
            }
        });
        // 点击遮罩关闭弹窗
        dom.addNodeModal.addEventListener('click', (e) => {
            if (e.target === dom.addNodeModal) closeAddNodeModal();
        });

        // ESC 退出关联模式
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.edgeMode) {
                exitEdgeMode();
                toast('已取消关联模式');
            }
        });
    }

    /* ---------- 启动 ---------- */
    function init() {
        initGraph();
        bindEvents();
        // 提示用户可以加载示例
        setAction('等待操作');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
