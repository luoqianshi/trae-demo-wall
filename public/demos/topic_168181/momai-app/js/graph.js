// 墨脉 MoMai - 图谱模块
// 包含 D3.js 图谱相关：renderGraphInto, initD3Graph, updateD3Graph, zoom控制
window.MoMaiModules = window.MoMaiModules || {};
window.MoMaiModules.graph = function(Vue, deps) {
    const { ref, nextTick } = Vue;
    const { filteredNotes, activeNoteId, fullscreenView, graphSelectedNoteId, selectNote, setGraphDetailNote, isGridLayoutActive } = deps;

    // === 图谱选中状态（单击选中，持久高亮关联） ===
    const graphSelectedNode = ref(null); // 选中的笔记 id

    // 获取笔记的所有 h1/h2 标题文本
    const getNoteTitles = (note) => {
        if (!note || !note.blocks) return new Set();
        const titles = new Set();
        note.blocks.forEach(b => {
            if (b.type === 'h1' || b.type === 'h2') {
                titles.add(b.content.trim());
            }
        });
        return titles;
    };

    let svg, simulation, zoomBehavior;
    let currentZoomScale = 1;
    let tooltipEl = null;

    // 存储各容器的图谱实例引用
    const graphInstances = {};

    // === 通用图谱渲染函数（支持任意容器） ===
    const renderGraphInto = (containerId, tooltipId, bp) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const tooltip = document.getElementById(tooltipId);
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 400;
        if (width < 10 || height < 10) return;

        // 清除旧 SVG
        d3.select('#' + containerId).selectAll('svg').remove();

        const svgEl = d3.select('#' + containerId)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('cursor', 'grab');

        const g = svgEl.append('g');
        let localZoomScale = 1;

        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                localZoomScale = event.transform.k;
                const labels = g.selectAll('.node-label');
                if (localZoomScale >= 1.2) {
                    labels.transition().duration(150)
                        .style('opacity', Math.min(1, (localZoomScale - 1.2) * 2))
                        .attr('transform', () => `scale(${1 / localZoomScale})`);
                } else { labels.transition().duration(150).style('opacity', 0); }
                const metaLabels = g.selectAll('.node-meta-label');
                if (localZoomScale >= 1.8) {
                    metaLabels.transition().duration(150)
                        .style('opacity', Math.min(0.8, (localZoomScale - 1.8) * 1.5))
                        .attr('transform', () => `scale(${1 / localZoomScale})`);
                } else { metaLabels.transition().duration(150).style('opacity', 0); }
            });
        svgEl.call(zoom);

        // 临时替换 tooltipEl 以复用 updateD3Graph 中的 tooltip 逻辑
        const origTooltip = tooltipEl;
        tooltipEl = tooltip;

        updateD3Graph(g, width, height, bp, svgEl);

        tooltipEl = origTooltip;

        graphInstances[containerId] = { svg: svgEl, zoom, container };
    };

    // === 原始 initD3Graph（兼容主容器和全屏容器） ===
    const initD3Graph = () => {
        // 主图谱容器
        const mainContainer = document.getElementById('d3-canvas-container');
        if (mainContainer) {
            const bp = window.innerWidth >= 1280 ? 'xl' : window.innerWidth >= 1024 ? 'lg' : window.innerWidth >= 768 ? 'md' : 'sm';
            renderGraphInto('d3-canvas-container', 'graph-tooltip', bp);
            // 更新全局引用以兼容 zoomGraph/resetGraph
            const inst = graphInstances['d3-canvas-container'];
            if (inst) { svg = inst.svg; zoomBehavior = inst.zoom; }
        }

        // 全屏图谱容器
        const fsContainer = document.getElementById('fullscreen-graph-container');
        if (fsContainer) {
            renderGraphInto('fullscreen-graph-container', 'fullscreen-graph-tooltip', 'xl');
        }
    };

    const updateD3Graph = (g, width, height, bp = 'xl', svgEl) => {
        // ---- True Obsidian-style Graph: Minimalist dark theme ----

        // 1. Build node data
        const allNotes = filteredNotes.value;
        const MAX_NODES = 50;

        let displayNotes;
        if (allNotes.length <= MAX_NODES) {
            displayNotes = allNotes;
        } else {
            const active = allNotes.find(n => n.id === activeNoteId.value);
            const withTags = allNotes.filter(n => n.tags && n.tags.length > 0);
            const others = allNotes.filter(n => !n.tags || n.tags.length === 0);
            displayNotes = [];
            if (active) displayNotes.push(active);
            displayNotes.push(...withTags.slice(0, MAX_NODES - displayNotes.length - 5));
            displayNotes.push(...others.slice(0, MAX_NODES - displayNotes.length));
            displayNotes = [...new Map(displayNotes.map(n => [n.id, n])).values()];
        }

        const noteNodes = displayNotes.map(note => ({
            id: note.id,
            type: 'note',
            title: note.title,
            category: note.category,
            tags: note.tags || [],
            val: note.id === activeNoteId.value ? 5 : 3,
            isActive: note.id === activeNoteId.value,
            _rawNote: note  // 保留原始引用，用于 h1/h2 标题关联检测
        }));

        // Build links: note-to-note via shared tags
        const graphLinks = [];
        const linkSet = new Set();
        for (let i = 0; i < noteNodes.length; i++) {
            for (let j = i + 1; j < noteNodes.length; j++) {
                const a = noteNodes[i];
                const b = noteNodes[j];
                // 关联方式1：共享标签
                const sharedTags = a.tags.filter(t => b.tags.includes(t));
                // 关联方式2：h1/h2 标题文本相同
                const titlesA = getNoteTitles(a._rawNote);
                const titlesB = getNoteTitles(b._rawNote);
                let sharedTitle = false;
                titlesA.forEach(t => { if (titlesB.has(t)) sharedTitle = true; });
                const strength = sharedTags.length + (sharedTitle ? 1 : 0);
                if (strength > 0) {
                    const linkId = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
                    if (!linkSet.has(linkId)) {
                        linkSet.add(linkId);
                        graphLinks.push({ source: a.id, target: b.id, strength, byTitle: sharedTitle });
                    }
                }
            }
        }

        const graphNodes = noteNodes;
        const svgRef = svgEl || svg;

        // 2. Force simulation
        const padding = 30;
        simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphLinks).id(d => d.id).distance(160).strength(0.03))
            .force('charge', d3.forceManyBody().strength(-160).distanceMax(300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(14).iterations(3))
            .force('x', d3.forceX(width / 2).strength(0.015))
            .force('y', d3.forceY(height / 2).strength(0.015));

        // 3. Render links
        const linkGroup = g.append('g').attr('class', 'links');
        linkGroup.selectAll('line')
            .data(graphLinks)
            .enter()
            .append('line')
            .attr('stroke-width', 0.8)
            .attr('stroke', '#4a4a4a')
            .attr('stroke-opacity', 0.25);

        const link = linkGroup.selectAll('line');

        // 4. Render nodes
        const nodeGroup = g.append('g').attr('class', 'nodes');

        const nodeEnter = nodeGroup.selectAll('.node-element')
            .data(graphNodes, d => d.id)
            .enter()
            .append('g')
            .attr('class', d => `node-element ${d.isActive ? 'node-active' : ''}`)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Active node glow
        nodeEnter.filter(d => d.isActive)
            .append('circle')
            .attr('r', 12)
            .attr('fill', 'none')
            .attr('stroke', '#6b8cae')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.3)
            .style('pointer-events', 'none');

        // Main dot
        nodeEnter.append('circle')
            .attr('r', d => d.isActive ? 5 : 3)
            .attr('fill', d => d.isActive ? '#6b8cae' : '#888888')
            .attr('stroke', d => d.isActive ? '#8ab4d9' : 'none')
            .attr('stroke-width', d => d.isActive ? 1.5 : 0);

        // Title label
        nodeEnter.append('text')
            .attr('class', 'node-label')
            .text(d => {
                const t = d.title;
                return t.length > 20 ? t.slice(0, 18) + '...' : t;
            })
            .attr('dy', 14)
            .attr('text-anchor', 'middle')
            .attr('fill', d => d.isActive ? '#a0c4e8' : '#b0b0b0')
            .style('font-size', '11px')
            .style('font-family', "'Noto Serif SC', serif")
            .style('font-weight', d => d.isActive ? 'bold' : 'normal')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Category + Tags label
        nodeEnter.append('text')
            .attr('class', 'node-meta-label')
            .text(d => {
                const parts = [];
                if (d.category) parts.push(d.category);
                if (d.tags && d.tags.length > 0) parts.push(d.tags.map(t => '#' + t).join(' '));
                return parts.join('  ');
            })
            .attr('dy', 26)
            .attr('text-anchor', 'middle')
            .attr('fill', '#777777')
            .style('font-size', '9px')
            .style('font-family', "'Noto Serif SC', serif")
            .style('pointer-events', 'none')
            .style('opacity', 0);

        const allNodes = nodeGroup.selectAll('.node-element');

        // 5. Tooltip
        const showTooltip = (d, event) => {
            if (!tooltipEl) return;
            // Simple tooltip for cell containers (no .tooltip-title/.tooltip-body structure)
            if (tooltipEl.classList.contains('graph-tooltip-cell')) {
                const rect = svgRef ? svgRef.node().getBoundingClientRect() : { left: 0, top: 0 };
                tooltipEl.innerHTML = `<div style="font-weight:bold;margin-bottom:2px;">${d.title}</div>` +
                    `${d.tags.length > 0 ? '<div style="font-size:10px;opacity:0.7;">标签: ' + d.tags.map(t => '#' + t).join(' ') + '</div>' : ''}`;
                tooltipEl.style.left = (event.clientX - rect.left + 12) + 'px';
                tooltipEl.style.top = (event.clientY - rect.top - 30) + 'px';
                tooltipEl.style.opacity = '1';
            } else {
                const rect = svgRef.node().getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const titleEl = tooltipEl.querySelector('.tooltip-title');
                const bodyEl = tooltipEl.querySelector('.tooltip-body');
                if (titleEl) titleEl.textContent = d.title;
                if (bodyEl) bodyEl.innerHTML = `${d.tags.length > 0 ? '标签: ' + d.tags.map(t => '#' + t).join(' ') : ''}`;
                tooltipEl.style.left = (x + 12) + 'px';
                tooltipEl.style.top = (y - 30) + 'px';
                tooltipEl.style.opacity = '1';
            }
        };
        const hideTooltip = () => { if (tooltipEl) tooltipEl.style.opacity = '0'; };

        // 6. Interactions
        let hoveredNode = null;

        // 选中高亮函数
        const applySelectionHighlight = (selectedId) => {
            if (!selectedId) {
                // 取消选中：恢复所有节点和连线
                allNodes.transition().duration(200).style('opacity', 1);
                link.transition().duration(200)
                    .attr('stroke-opacity', 0.25).attr('stroke', '#4a4a4a').attr('stroke-width', 0.8);
                allNodes.each(function(d) {
                    d3.select(this).select('.selection-ring').remove();
                });
                return;
            }
            const conn = new Set([selectedId]);
            graphLinks.forEach(l => {
                if (l.source.id === selectedId) conn.add(l.target.id);
                if (l.target.id === selectedId) conn.add(l.source.id);
            });
            // 高亮关联节点，淡化无关节点
            allNodes.transition().duration(200)
                .style('opacity', n => conn.has(n.id) ? 1 : 0.12);
            // 高亮关联连线
            link.transition().duration(200)
                .attr('stroke-opacity', l =>
                    (l.source.id === selectedId || l.target.id === selectedId) ? 0.7 : 0.05)
                .attr('stroke', l =>
                    (l.source.id === selectedId || l.target.id === selectedId) ? '#6b8cae' : '#4a4a4a')
                .attr('stroke-width', l =>
                    (l.source.id === selectedId || l.target.id === selectedId) ? 1.8 : 0.8);
            // 给选中节点添加持久选中环
            allNodes.each(function(d) {
                d3.select(this).select('.selection-ring').remove();
                if (d.id === selectedId) {
                    d3.select(this).insert('circle', ':first-child')
                        .attr('class', 'selection-ring')
                        .attr('r', 16).attr('fill', 'none')
                        .attr('stroke', '#2d8cf0').attr('stroke-width', 2)
                        .attr('stroke-opacity', 0.6)
                        .attr('stroke-dasharray', '4 2')
                        .style('pointer-events', 'none');
                }
            });
        };

        // 点击 SVG 空白区域取消选中
        svgRef.on('click', () => {
            if (graphSelectedNode.value) {
                graphSelectedNode.value = null;
                applySelectionHighlight(null);
            }
        });

        allNodes
            .on('mouseenter', function(event, d) {
                hoveredNode = d;
                const conn = new Set([d.id]);
                graphLinks.forEach(l => {
                    if (l.source.id === d.id) conn.add(l.target.id);
                    if (l.target.id === d.id) conn.add(l.source.id);
                });
                allNodes.transition().duration(100)
                    .style('opacity', n => conn.has(n.id) ? 1 : 0.15);
                link.transition().duration(100)
                    .attr('stroke-opacity', l =>
                        (l.source.id === d.id || l.target.id === d.id) ? 0.6 : 0.08)
                    .attr('stroke', l =>
                        (l.source.id === d.id || l.target.id === d.id) ? '#6b8cae' : '#4a4a4a');
                d3.select(this).select('circle:last-child')
                    .transition().duration(100)
                    .attr('r', d.isActive ? 7 : 5)
                    .attr('fill', '#a0c4e8');
                showTooltip(d, event);
            })
            .on('mousemove', function(event, d) {
                if (hoveredNode) showTooltip(d, event);
            })
            .on('mouseleave', function(event, d) {
                hoveredNode = null;
                allNodes.transition().duration(200).style('opacity', 1);
                link.transition().duration(200)
                    .attr('stroke-opacity', 0.25)
                    .attr('stroke', '#4a4a4a');
                d3.select(this).select('circle:last-child')
                    .transition().duration(100)
                    .attr('r', d.isActive ? 5 : 3)
                    .attr('fill', d.isActive ? '#6b8cae' : '#888888');
                hideTooltip();
            })
            .on('click', (event, d) => {
                event.stopPropagation();
                // 切换选中状态
                if (graphSelectedNode.value === d.id) {
                    graphSelectedNode.value = null; // 取消选中
                } else {
                    graphSelectedNode.value = d.id;
                }
                applySelectionHighlight(graphSelectedNode.value);
            })
            .on('dblclick', (event, d) => {
                selectNote(d.id);
                const clickedNode = d3.select(event.currentTarget);
                clickedNode.append('circle')
                    .attr('r', 5).attr('fill', 'none')
                    .attr('stroke', '#8ab4d9').attr('stroke-width', 2.5).attr('opacity', 0.9)
                    .transition().duration(600).attr('r', 28).attr('opacity', 0).remove();
                if (fullscreenView.value === 'graph') {
                    graphSelectedNoteId.value = d.id;
                }
                // 分屏模式下：在图谱面板中显示双击笔记详情
                if (isGridLayoutActive && isGridLayoutActive.value && setGraphDetailNote) {
                    setGraphDetailNote(d.id);
                }
                nextTick(() => {
                    const activeEl = document.querySelector(`[data-note-id="${d.id}"]`);
                    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });

        // 7. Tick
        simulation.on('tick', () => {
            graphNodes.forEach(d => {
                d.x = Math.max(padding, Math.min(width - padding, d.x));
                d.y = Math.max(padding, Math.min(height - padding, d.y));
            });
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            allNodes.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        simulation.alpha(0.6).restart();

        // 8. Drag
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.2).restart();
            d.fx = d.x; d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = Math.max(padding, Math.min(width - padding, event.x));
            d.fy = Math.max(padding, Math.min(height - padding, event.y));
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
        }
    };

    const zoomGraph = (factor) => {
        if (svg && zoomBehavior) {
            svg.transition().duration(300).call(zoomBehavior.scaleBy, factor);
        }
    };

    const resetGraph = () => {
        if (svg && zoomBehavior) {
            svg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity);
        }
    };

    const refreshGraphSoon = () => {
        nextTick(() => {
            setTimeout(() => {
                initD3Graph();
            }, 320);
        });
    };

    return {
        initD3Graph,
        renderGraphInto,
        graphInstances,
        updateD3Graph,
        zoomGraph,
        resetGraph,
        refreshGraphSoon,
        graphSelectedNode
    };
};
