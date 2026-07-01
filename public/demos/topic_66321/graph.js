/* ============================================
   graph.js - 力导向图可视化引擎
   基于原生 SVG + 物理模拟实现
   功能：力导向布局 / 拖拽 / 缩放 / 平移 / 选中高亮
   ============================================ */

(function (global) {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';

    class KnowledgeGraph {
        constructor(svgEl, options) {
            this.svg = svgEl;
            this.viewport = svgEl.querySelector('#viewport');
            this.edgesLayer = svgEl.querySelector('#edgesLayer');
            this.nodesLayer = svgEl.querySelector('#nodesLayer');
            this.options = Object.assign({
                onNodeClick: null,
                onNodeHover: null,
                onBackgroundClick: null,
                showLabels: true,
                showAllLabels: false
            }, options || {});

            this.nodes = [];
            this.edges = [];
            this.nodeById = new Map();
            this.edgesOfNode = new Map(); // nodeId -> [edge]
            this.neighbors = new Map(); // nodeId -> Set<nodeId>
            this._nodeIdSeq = 0; // 用户添加节点的自增序号

            this.selectedId = null;
            this.hoveredId = null;

            // 视图变换
            this.viewScale = 1;
            this.viewX = 0;
            this.viewY = 0;

            // 物理参数
            this.simulation = null;
            this.alpha = 1.0;
            this.alphaDecay = 0.005;
            this.alphaMin = 0.02;
            this.velocityDecay = 0.6;

            // 力参数
            this.repulsion = 1800;       // 节点间斥力
            this.linkDistance = 90;      // 边的理想长度
            this.linkStrength = 0.3;     // 边的弹簧强度
            this.centerStrength = 0.04;  // 中心引力
            this.gravity = 0.02;         // 全局重力

            // 画布尺寸
            this.width = 0;
            this.height = 0;
            this.centerX = 0;
            this.centerY = 0;

            // 拖拽状态
            this.dragging = null;
            this.panning = false;
            this.lastPan = { x: 0, y: 0 };

            // 节点 SVG 元素映射
            this.nodeElements = new Map(); // id -> {group, circle, label}
            this.edgeElements = new Map(); // key -> line

            this._bindEvents();
            this._resize();
        }

        /* ---------- 尺寸 ---------- */
        _resize() {
            const rect = this.svg.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
            this.centerX = this.width / 2;
            this.centerY = this.height / 2;
            this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        }

        /* ---------- 事件绑定 ---------- */
        _bindEvents() {
            // 缩放（滚轮）
            this.svg.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
                const rect = this.svg.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                this._zoomAt(mx, my, delta);
            }, { passive: false });

            // 平移（背景拖拽）
            this.svg.addEventListener('mousedown', (e) => {
                if (e.target === this.svg || e.target.tagName === 'svg' ||
                    e.target === this.viewport || e.target === this.edgesLayer) {
                    this.panning = true;
                    this.lastPan = { x: e.clientX, y: e.clientY };
                    this.svg.style.cursor = 'grabbing';
                    // 点击背景取消选中
                    if (this.selectedId) {
                        this.selectNode(null);
                        if (this.options.onBackgroundClick) this.options.onBackgroundClick();
                    }
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (this.panning) {
                    const dx = e.clientX - this.lastPan.x;
                    const dy = e.clientY - this.lastPan.y;
                    this.viewX += dx;
                    this.viewY += dy;
                    this.lastPan = { x: e.clientX, y: e.clientY };
                    this._applyTransform();
                }
            });

            window.addEventListener('mouseup', () => {
                if (this.panning) {
                    this.panning = false;
                    this.svg.style.cursor = 'grab';
                }
            });

            // 窗口尺寸变化
            window.addEventListener('resize', () => {
                this._resize();
                if (this.nodes.length > 0) this.fitView();
            });
        }

        _zoomAt(mx, my, delta) {
            const newScale = Math.min(3, Math.max(0.2, this.viewScale * delta));
            const actualDelta = newScale / this.viewScale;
            // 以鼠标位置为缩放中心
            this.viewX = mx - (mx - this.viewX) * actualDelta;
            this.viewY = my - (my - this.viewY) * actualDelta;
            this.viewScale = newScale;
            this._applyTransform();
            if (this.options.onZoom) this.options.onZoom(this.viewScale);
        }

        _applyTransform() {
            this.viewport.setAttribute('transform',
                `translate(${this.viewX},${this.viewY}) scale(${this.viewScale})`);
        }

        /* ---------- 数据装载 ---------- */
        setData(nodes, edges) {
            this.nodes = nodes.map((n, i) => ({
                ...n,
                x: this.centerX + (Math.random() - 0.5) * 200,
                y: this.centerY + (Math.random() - 0.5) * 200,
                vx: 0,
                vy: 0,
                fx: null,
                fy: null
            }));
            this.edges = edges.map(e => ({ ...e }));

            this.nodeById = new Map(this.nodes.map(n => [n.id, n]));
            this.edgesOfNode = new Map();
            this.neighbors = new Map();
            for (const n of this.nodes) {
                this.edgesOfNode.set(n.id, []);
                this.neighbors.set(n.id, new Set());
            }
            for (const e of this.edges) {
                this.edgesOfNode.get(e.source).push(e);
                this.edgesOfNode.get(e.target).push(e);
                this.neighbors.get(e.source).add(e.target);
                this.neighbors.get(e.target).add(e.source);
            }

            this._render();
            this._startSimulation();
        }

        /* ---------- 节点编辑 ---------- */
        addNode(nodeData) {
            if (!nodeData || !nodeData.label) return null;
            let id = nodeData.id;
            if (!id) {
                do {
                    id = 'u' + (++this._nodeIdSeq);
                } while (this.nodeById.has(id));
            }
            if (this.nodeById.has(id)) return null;

            const node = {
                id: id,
                label: nodeData.label,
                category: nodeData.category || 'other',
                weight: nodeData.weight != null ? nodeData.weight : 1,
                score: nodeData.score != null ? nodeData.score : 0,
                contexts: nodeData.contexts || [],
                size: nodeData.size != null ? nodeData.size : 22,
                x: this.centerX + (Math.random() - 0.5) * 200,
                y: this.centerY + (Math.random() - 0.5) * 200,
                vx: 0,
                vy: 0,
                fx: null,
                fy: null
            };

            this.nodes.push(node);
            this.nodeById.set(node.id, node);
            this.edgesOfNode.set(node.id, []);
            this.neighbors.set(node.id, new Set());

            this._renderNode(node);
            this._updateLabelVisibility();

            // 重启物理模拟，自动布局
            this.alpha = 1.0;
            this._startSimulation();

            return node;
        }

        removeNode(nodeId) {
            if (!this.nodeById.has(nodeId)) return false;

            // 收集并移除所有相关边
            const relatedEdges = (this.edgesOfNode.get(nodeId) || []).slice();
            for (const e of relatedEdges) {
                const otherId = e.source === nodeId ? e.target : e.source;
                const otherEdges = this.edgesOfNode.get(otherId);
                if (otherEdges) {
                    const idx = otherEdges.indexOf(e);
                    if (idx >= 0) otherEdges.splice(idx, 1);
                }
                if (this.neighbors.has(otherId)) this.neighbors.get(otherId).delete(nodeId);
                const key = `${e.source}-${e.target}`;
                const line = this.edgeElements.get(key);
                if (line) line.remove();
                this.edgeElements.delete(key);
            }
            this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

            // 移除节点本身
            this.nodes = this.nodes.filter(n => n.id !== nodeId);
            this.nodeById.delete(nodeId);
            this.edgesOfNode.delete(nodeId);
            this.neighbors.delete(nodeId);

            const el = this.nodeElements.get(nodeId);
            if (el) el.group.remove();
            this.nodeElements.delete(nodeId);

            if (this.selectedId === nodeId) this.selectedId = null;
            if (this.hoveredId === nodeId) this.hoveredId = null;

            // 重启物理模拟
            this.alpha = Math.max(this.alpha, 0.5);
            this._startSimulation();

            return true;
        }

        addEdge(sourceId, targetId, weight) {
            if (!sourceId || !targetId || sourceId === targetId) return null;
            if (!this.nodeById.has(sourceId) || !this.nodeById.has(targetId)) return null;

            // 双向检查是否已存在
            const key1 = `${sourceId}-${targetId}`;
            const key2 = `${targetId}-${sourceId}`;
            if (this.edgeElements.has(key1) || this.edgeElements.has(key2)) return null;

            const w = weight != null ? weight : 1;
            const edge = {
                source: sourceId,
                target: targetId,
                weight: w,
                strength: w
            };

            this.edges.push(edge);
            this.edgesOfNode.get(sourceId).push(edge);
            this.edgesOfNode.get(targetId).push(edge);
            this.neighbors.get(sourceId).add(targetId);
            this.neighbors.get(targetId).add(sourceId);

            this._renderEdge(edge);

            // 重启物理模拟
            this.alpha = Math.max(this.alpha, 0.5);
            this._startSimulation();

            return edge;
        }

        /* ---------- 渲染 ---------- */
        _render() {
            // 清空
            this.edgesLayer.innerHTML = '';
            this.nodesLayer.innerHTML = '';
            this.nodeElements.clear();
            this.edgeElements.clear();

            // 渲染边
            for (const e of this.edges) {
                this._renderEdge(e);
            }

            // 渲染节点
            for (const n of this.nodes) {
                this._renderNode(n);
            }

            this._updatePositions();
        }

        _renderNode(n) {
            const group = document.createElementNS(SVG_NS, 'g');
            group.setAttribute('class', 'node');
            group.setAttribute('data-id', n.id);

            const circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('class', 'node-circle');
            circle.setAttribute('r', n.size);
            circle.setAttribute('fill', this._categoryColor(n.category));
            circle.setAttribute('stroke', 'rgba(255,255,255,0.3)');
            circle.setAttribute('stroke-width', '1.5');
            circle.style.color = this._categoryColor(n.category);
            group.appendChild(circle);

            const label = document.createElementNS(SVG_NS, 'text');
            label.setAttribute('class', 'node-label');
            label.setAttribute('y', n.size + 14);
            label.textContent = n.label;
            if (!this.options.showAllLabels && n.size < 22) {
                label.style.display = 'none';
            }
            group.appendChild(label);

            this.nodesLayer.appendChild(group);
            this.nodeElements.set(n.id, { group, circle, label });

            this._bindNodeEvents(n, group, circle);
        }

        _renderEdge(e) {
            const line = document.createElementNS(SVG_NS, 'line');
            line.setAttribute('class', 'edge');
            line.setAttribute('stroke-width', Math.min(4, 0.8 + e.weight * 0.6));
            this.edgesLayer.appendChild(line);
            const key = `${e.source}-${e.target}`;
            this.edgeElements.set(key, line);
        }

        _categoryColor(category) {
            const colors = {
                technology: '#667eea',
                concept: '#f093fb',
                person: '#f5576c',
                place: '#4facfe',
                organization: '#43e97b',
                time: '#fa709a',
                other: '#a8a8b8'
            };
            return colors[category] || colors.other;
        }

        _bindNodeEvents(node, group, circle) {
            let dragStart = null;
            let moved = false;

            group.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                dragStart = { x: e.clientX, y: e.clientY };
                moved = false;
                this.dragging = node;
                node.fx = node.x;
                node.fy = node.y;
                this.alpha = Math.max(this.alpha, 0.3);
                this._startSimulation();
            });

            group.addEventListener('mouseenter', () => {
                if (this.dragging) return;
                this.hoveredId = node.id;
                circle.classList.add('hovered');
                this._highlightNeighbors(node.id);
            });

            group.addEventListener('mouseleave', () => {
                if (this.dragging) return;
                this.hoveredId = null;
                circle.classList.remove('hovered');
                if (this.selectedId !== node.id) {
                    this._clearHighlight();
                    if (this.selectedId) this._highlightNeighbors(this.selectedId);
                }
            });

            // 拖拽移动
            const onMouseMove = (e) => {
                if (!this.dragging || this.dragging.id !== node.id) return;
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
                // 转换到画布坐标
                const rect = this.svg.getBoundingClientRect();
                const cx = (e.clientX - rect.left - this.viewX) / this.viewScale;
                const cy = (e.clientY - rect.top - this.viewY) / this.viewScale;
                this.dragging.fx = cx;
                this.dragging.fy = cy;
            };
            window.addEventListener('mousemove', onMouseMove);

            const onMouseUp = (e) => {
                if (this.dragging && this.dragging.id === node.id) {
                    // 释放固定，让节点回归自然
                    this.dragging.fx = null;
                    this.dragging.fy = null;
                    this.dragging = null;
                    if (!moved) {
                        // 没移动则视为点击
                        this.selectNode(node.id);
                        if (this.options.onNodeClick) this.options.onNodeClick(node);
                    }
                }
            };
            window.addEventListener('mouseup', onMouseUp);
        }

        /* ---------- 高亮 ---------- */
        _highlightNeighbors(nodeId) {
            const neighborSet = this.neighbors.get(nodeId) || new Set();
            neighborSet.add(nodeId);

            for (const [id, el] of this.nodeElements) {
                if (!neighborSet.has(id)) {
                    el.group.classList.add('dimmed');
                } else {
                    el.group.classList.remove('dimmed');
                }
            }
            for (const [key, line] of this.edgeElements) {
                const [s, t] = key.split('-');
                if (s === nodeId || t === nodeId) {
                    line.classList.add('highlighted');
                    line.classList.remove('dimmed');
                } else {
                    line.classList.add('dimmed');
                    line.classList.remove('highlighted');
                }
            }
        }

        _clearHighlight() {
            for (const [, el] of this.nodeElements) {
                el.group.classList.remove('dimmed');
            }
            for (const [, line] of this.edgeElements) {
                line.classList.remove('dimmed', 'highlighted');
            }
        }

        /* ---------- 选中 ---------- */
        selectNode(nodeId) {
            // 清除上一个选中
            if (this.selectedId && this.nodeElements.has(this.selectedId)) {
                this.nodeElements.get(this.selectedId).circle.classList.remove('selected');
            }
            this.selectedId = nodeId;
            this._clearHighlight();
            if (nodeId && this.nodeElements.has(nodeId)) {
                this.nodeElements.get(nodeId).circle.classList.add('selected');
                this._highlightNeighbors(nodeId);
            }
        }

        /* ---------- 物理模拟 ---------- */
        _startSimulation() {
            if (this.simulation) cancelAnimationFrame(this.simulation);
            this.alpha = Math.max(this.alpha, 0.3);
            this._tick();
        }

        _tick() {
            if (this.nodes.length === 0) return;

            // 力计算
            const n = this.nodes.length;

            // 1. 节点间斥力（O(n²)）
            for (let i = 0; i < n; i++) {
                const a = this.nodes[i];
                for (let j = i + 1; j < n; j++) {
                    const b = this.nodes[j];
                    let dx = a.x - b.x;
                    let dy = a.y - b.y;
                    let dist2 = dx * dx + dy * dy;
                    if (dist2 < 0.01) {
                        dx = (Math.random() - 0.5) * 1;
                        dy = (Math.random() - 0.5) * 1;
                        dist2 = dx * dx + dy * dy;
                    }
                    const dist = Math.sqrt(dist2);
                    // 斥力大小 = repulsion / dist²
                    const force = this.repulsion * this.alpha / dist2;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    a.vx += fx;
                    a.vy += fy;
                    b.vx -= fx;
                    b.vy -= fy;
                }
            }

            // 2. 边的弹簧力（吸引到理想长度）
            for (const e of this.edges) {
                const s = this.nodeById.get(e.source);
                const t = this.nodeById.get(e.target);
                if (!s || !t) continue;
                const dx = t.x - s.x;
                const dy = t.y - s.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const diff = dist - this.linkDistance;
                // 弹簧力：朝向理想长度
                const force = diff * this.linkStrength * this.alpha;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                s.vx += fx;
                s.vy += fy;
                t.vx -= fx;
                t.vy -= fy;
            }

            // 3. 中心引力 + 全局重力
            for (const node of this.nodes) {
                // 向中心吸引
                node.vx += (this.centerX - node.x) * this.centerStrength * this.alpha;
                node.vy += (this.centerY - node.y) * this.centerStrength * this.alpha;
                // 轻微全局重力（防止飞出）
                node.vx *= (1 - this.gravity * this.alpha);
                node.vy *= (1 - this.gravity * this.alpha);
            }

            // 4. 速度衰减 + 位置更新
            for (const node of this.nodes) {
                if (node.fx !== null) {
                    node.x = node.fx;
                    node.vx = 0;
                } else {
                    node.vx *= this.velocityDecay;
                    node.x += node.vx;
                }
                if (node.fy !== null) {
                    node.y = node.fy;
                    node.vy = 0;
                } else {
                    node.vy *= this.velocityDecay;
                    node.y += node.vy;
                }
            }

            this._updatePositions();

            this.alpha -= this.alphaDecay;
            if (this.alpha > this.alphaMin) {
                this.simulation = requestAnimationFrame(() => this._tick());
            } else {
                this.simulation = null;
            }
        }

        _updatePositions() {
            for (const node of this.nodes) {
                const el = this.nodeElements.get(node.id);
                if (!el) continue;
                el.group.setAttribute('transform', `translate(${node.x},${node.y})`);
            }
            for (const e of this.edges) {
                const s = this.nodeById.get(e.source);
                const t = this.nodeById.get(e.target);
                if (!s || !t) continue;
                const line = this.edgeElements.get(`${e.source}-${e.target}`);
                if (line) {
                    line.setAttribute('x1', s.x);
                    line.setAttribute('y1', s.y);
                    line.setAttribute('x2', t.x);
                    line.setAttribute('y2', t.y);
                }
            }
        }

        /* ---------- 视图操作 ---------- */
        zoomBy(delta) {
            const newScale = Math.min(3, Math.max(0.2, this.viewScale * delta));
            const actualDelta = newScale / this.viewScale;
            this.viewX = this.centerX - (this.centerX - this.viewX) * actualDelta;
            this.viewY = this.centerY - (this.centerY - this.viewY) * actualDelta;
            this.viewScale = newScale;
            this._applyTransform();
            if (this.options.onZoom) this.options.onZoom(this.viewScale);
        }

        fitView() {
            if (this.nodes.length === 0) {
                this.viewScale = 1;
                this.viewX = 0;
                this.viewY = 0;
                this._applyTransform();
                return;
            }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const n of this.nodes) {
                const r = n.size + 20;
                minX = Math.min(minX, n.x - r);
                minY = Math.min(minY, n.y - r);
                maxX = Math.max(maxX, n.x + r);
                maxY = Math.max(maxY, n.y + r);
            }
            const w = maxX - minX;
            const h = maxY - minY;
            const padding = 40;
            const scaleX = (this.width - padding * 2) / Math.max(w, 1);
            const scaleY = (this.height - padding * 2) / Math.max(h, 1);
            this.viewScale = Math.min(1.5, Math.min(scaleX, scaleY));
            this.viewX = this.centerX - (minX + w / 2) * this.viewScale;
            this.viewY = this.centerY - (minY + h / 2) * this.viewScale;
            this._applyTransform();
            if (this.options.onZoom) this.options.onZoom(this.viewScale);
        }

        resetLayout() {
            // 重新随机分布并重启模拟
            for (const node of this.nodes) {
                node.x = this.centerX + (Math.random() - 0.5) * 300;
                node.y = this.centerY + (Math.random() - 0.5) * 300;
                node.vx = 0;
                node.vy = 0;
                node.fx = null;
                node.fy = null;
            }
            this.alpha = 1.0;
            this._startSimulation();
        }

        setShowLabels(show) {
            this.options.showLabels = show;
            this._updateLabelVisibility();
        }

        setShowAllLabels(show) {
            this.options.showAllLabels = show;
            this._updateLabelVisibility();
        }

        _updateLabelVisibility() {
            for (const [id, n] of this.nodeById) {
                const el = this.nodeElements.get(id);
                if (!el) continue;
                if (this.options.showAllLabels) {
                    el.label.style.display = this.options.showLabels ? '' : 'none';
                } else {
                    el.label.style.display = (this.options.showLabels && n.size >= 22) ? '' : 'none';
                }
            }
        }

        focusNode(nodeId) {
            const node = this.nodeById.get(nodeId);
            if (!node) return;
            // 平滑移动到节点
            this.viewScale = 1.3;
            this.viewX = this.centerX - node.x * this.viewScale;
            this.viewY = this.centerY - node.y * this.viewScale;
            this._applyTransform();
            if (this.options.onZoom) this.options.onZoom(this.viewScale);
            this.selectNode(nodeId);
        }

        clear() {
            this.nodes = [];
            this.edges = [];
            this.nodeById.clear();
            this.edgesOfNode.clear();
            this.neighbors.clear();
            this.selectedId = null;
            this.hoveredId = null;
            this.edgesLayer.innerHTML = '';
            this.nodesLayer.innerHTML = '';
            this.nodeElements.clear();
            this.edgeElements.clear();
            if (this.simulation) {
                cancelAnimationFrame(this.simulation);
                this.simulation = null;
            }
        }
    }

    global.KnowledgeGraph = KnowledgeGraph;

})(window);
