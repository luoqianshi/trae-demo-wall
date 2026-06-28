class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Shape {
    constructor(id, type, points, color) {
        this.id = id;
        this.type = type;
        this.points = points;
        this.color = color;
        this.selected = false;
    }
}

class CanvasApp {
    constructor() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasSize = 500;
        this.gridSize = 20;
        this.canvasResolution = 2;
        
        this.canvas.width = this.canvasSize * this.canvasResolution;
        this.canvas.height = this.canvasSize * this.canvasResolution;
        
        this.shapes = [];
        this.currentMode = 'select';
        this.scale = 1;
        this.selectedShapeId = null;
        this.drawingPoints = [];
        this.isDragging = false;
        this.isDraggingPoint = false;
        this.draggedPointIndex = -1;
        this.dragOffset = { x: 0, y: 0 };
        this.handleSize = 8 * this.canvasResolution;
        
        this.shapeColors = [
            'rgba(66, 153, 225, 0.6)',
            'rgba(72, 187, 120, 0.6)',
            'rgba(251, 146, 60, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(236, 72, 153, 0.6)'
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateJsonDisplay();
        this.draw();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });
        
        document.querySelectorAll('.scale-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setScale(parseFloat(e.target.dataset.scale)));
        });
        
        document.getElementById('scale-slider').addEventListener('input', (e) => {
            this.setScale(parseFloat(e.target.value));
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        document.getElementById('delete-btn').addEventListener('click', () => this.deleteSelected());
        document.getElementById('apply-json-btn').addEventListener('click', () => this.applyJsonChanges());
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width / this.canvasSize;
        const scaleY = rect.height / this.canvasSize;
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top) / scaleY;
        return new Point(Math.round(x), Math.round(y));
    }
    
    handleClick(e) {
        const pos = this.getMousePos(e);
        
        if (this.currentMode === 'select') {
            this.selectShape(pos);
        } else if (this.currentMode === 'triangle' || this.currentMode === 'quadrilateral' || this.currentMode === 'custom') {
            this.addDrawingPoint(pos);
        }
    }
    
    handleDoubleClick(e) {
        if (this.currentMode === 'custom' && this.drawingPoints.length >= 3) {
            this.completeDrawing();
        }
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        
        if (this.currentMode === 'select') {
            // 首先检查是否点击了选中图形的控制点
            if (this.selectedShapeId) {
                const selectedShape = this.shapes.find(s => s.id === this.selectedShapeId);
                if (selectedShape) {
                    const pointIndex = this.findPointHandle(pos, selectedShape);
                    if (pointIndex !== -1) {
                        // 开始拖拽控制点
                        this.isDraggingPoint = true;
                        this.draggedPointIndex = pointIndex;
                        this.draw();
                        return;
                    }
                }
            }
            
            // 检查是否点击了图形
            const shape = this.findShapeAt(pos);
            if (shape) {
                this.isDragging = true;
                this.selectedShapeId = shape.id;
                shape.selected = true;
                
                const minX = Math.min(...shape.points.map(p => p.x));
                const minY = Math.min(...shape.points.map(p => p.y));
                this.dragOffset = {
                    x: pos.x - minX,
                    y: pos.y - minY
                };
                
                this.updateStatus();
                this.draw();
            }
        }
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        // 拖拽控制点
        if (this.isDraggingPoint && this.selectedShapeId) {
            const shape = this.shapes.find(s => s.id === this.selectedShapeId);
            if (shape && this.draggedPointIndex !== -1) {
                shape.points[this.draggedPointIndex].x = pos.x;
                shape.points[this.draggedPointIndex].y = pos.y;
                this.updateJsonDisplay();
                this.draw();
            }
            return;
        }
        
        // 拖拽整个图形
        if (this.isDragging && this.selectedShapeId) {
            const shape = this.shapes.find(s => s.id === this.selectedShapeId);
            
            if (shape) {
                const minX = Math.min(...shape.points.map(p => p.x));
                const minY = Math.min(...shape.points.map(p => p.y));
                const dx = pos.x - this.dragOffset.x - minX;
                const dy = pos.y - this.dragOffset.y - minY;
                
                shape.points.forEach(p => {
                    p.x += dx;
                    p.y += dy;
                });
                
                this.updateJsonDisplay();
                this.draw();
            }
        }
        
        // 更新鼠标样式
        if (this.currentMode === 'select' && this.selectedShapeId) {
            const selectedShape = this.shapes.find(s => s.id === this.selectedShapeId);
            if (selectedShape) {
                const pointIndex = this.findPointHandle(pos, selectedShape);
                if (pointIndex !== -1) {
                    this.canvas.style.cursor = 'grab';
                } else if (this.isPointInShape(pos, selectedShape)) {
                    this.canvas.style.cursor = 'move';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.isDraggingPoint = false;
        this.draggedPointIndex = -1;
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        if (this.currentMode !== 'select') return;
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(2.0, this.scale + delta));
        
        if (newScale !== this.scale) {
            this.setScale(newScale);
        }
    }
    
    selectShape(pos) {
        let found = false;
        
        this.shapes.forEach(shape => {
            shape.selected = false;
        });
        
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            if (this.isPointInShape(pos, this.shapes[i])) {
                this.shapes[i].selected = true;
                this.selectedShapeId = this.shapes[i].id;
                found = true;
                break;
            }
        }
        
        if (!found) {
            this.selectedShapeId = null;
        }
        
        this.updateStatus();
        this.draw();
    }
    
    findShapeAt(pos) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            if (this.isPointInShape(pos, this.shapes[i])) {
                return this.shapes[i];
            }
        }
        return null;
    }
    
    findPointHandle(pos, shape) {
        // 检查鼠标是否在图形的控制点上
        for (let i = 0; i < shape.points.length; i++) {
            const point = shape.points[i];
            const distance = Math.sqrt(Math.pow(pos.x - point.x, 2) + Math.pow(pos.y - point.y, 2));
            if (distance <= this.handleSize) {
                return i;
            }
        }
        return -1;
    }
    
    isPointInShape(point, shape) {
        const points = shape.points;
        let inside = false;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    addDrawingPoint(pos) {
        this.drawingPoints.push(pos);
        
        if (this.currentMode === 'triangle' && this.drawingPoints.length === 3) {
            this.completeDrawing();
        } else if (this.currentMode === 'quadrilateral' && this.drawingPoints.length === 4) {
            this.completeDrawing();
        }
        
        this.draw();
    }
    
    completeDrawing() {
        if (this.drawingPoints.length >= 3) {
            const color = this.shapeColors[this.shapes.length % this.shapeColors.length];
            const shape = new Shape(
                'shape-' + Date.now(),
                this.currentMode,
                [...this.drawingPoints],
                color
            );
            this.shapes.push(shape);
        }
        
        this.drawingPoints = [];
        this.updateStatus();
        this.updateJsonDisplay();
        this.draw();
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.drawingPoints = [];
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        this.updateStatus();
        this.draw();
    }
    
    setScale(scale) {
        this.scale = scale;
        // 通过CSS transform缩放canvas，保持物理尺寸1000*1000不变
        // 显示尺寸 = 500 * scale
        this.canvas.style.transform = `scale(${scale})`;
        this.canvas.style.transformOrigin = 'top left';
        
        document.querySelectorAll('.scale-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseFloat(btn.dataset.scale) === scale) {
                btn.classList.add('active');
            }
        });
        
        document.getElementById('scale-slider').value = scale;
        document.getElementById('scale-value').textContent = Math.round(scale * 100) + '%';
        
        this.draw();
    }
    
    clearAll() {
        this.shapes = [];
        this.selectedShapeId = null;
        this.drawingPoints = [];
        this.updateStatus();
        this.updateJsonDisplay();
        this.draw();
    }
    
    deleteSelected() {
        if (this.selectedShapeId) {
            this.shapes = this.shapes.filter(s => s.id !== this.selectedShapeId);
            this.selectedShapeId = null;
            this.updateStatus();
            this.updateJsonDisplay();
            this.draw();
        }
    }
    
    updateJsonDisplay() {
        const jsonData = this.shapes.map(shape => ({
            id: shape.id,
            type: shape.type,
            points: shape.points.map(p => ({ x: p.x, y: p.y })),
            color: shape.color
        }));
        
        document.getElementById('json-textarea').value = JSON.stringify(jsonData, null, 2);
    }
    
    applyJsonChanges() {
        const textarea = document.getElementById('json-textarea');
        try {
            const jsonData = JSON.parse(textarea.value);
            
            if (!Array.isArray(jsonData)) {
                throw new Error('JSON必须是数组格式');
            }
            
            this.shapes = jsonData.map(data => {
                const points = data.points.map(p => new Point(p.x, p.y));
                const shape = new Shape(data.id, data.type, points, data.color);
                return shape;
            });
            
            this.selectedShapeId = null;
            this.updateStatus();
            this.draw();
            alert('图形数据已更新');
        } catch (error) {
            alert('JSON解析错误: ' + error.message);
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 使用逻辑坐标(500*500)绘制，乘以canvasResolution映射到1000*1000像素
        this.drawGrid();
        this.drawShapes();
        this.drawDrawingPreview();
    }
    
    drawGrid() {
        // 网格线宽随缩放变化
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1 * this.canvasResolution;
        
        for (let x = 0; x <= this.canvasSize; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.canvasResolution, 0);
            this.ctx.lineTo(x * this.canvasResolution, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvasSize; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.canvasResolution);
            this.ctx.lineTo(this.canvas.width, y * this.canvasResolution);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = '#cbd5e0';
        this.ctx.lineWidth = 2 * this.canvasResolution;
        
        for (let x = 0; x <= this.canvasSize; x += this.gridSize * 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.canvasResolution, 0);
            this.ctx.lineTo(x * this.canvasResolution, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvasSize; y += this.gridSize * 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.canvasResolution);
            this.ctx.lineTo(this.canvas.width, y * this.canvasResolution);
            this.ctx.stroke();
        }
    }
    
    drawShapes() {
        this.shapes.forEach(shape => {
            this.ctx.beginPath();
            // 图形坐标乘以canvasResolution，绘制到1000*1000像素上
            this.ctx.moveTo(shape.points[0].x * this.canvasResolution, shape.points[0].y * this.canvasResolution);
            
            for (let i = 1; i < shape.points.length; i++) {
                this.ctx.lineTo(shape.points[i].x * this.canvasResolution, shape.points[i].y * this.canvasResolution);
            }
            
            this.ctx.closePath();
            
            this.ctx.fillStyle = shape.color;
            this.ctx.fill();
            
            if (shape.selected) {
                this.ctx.strokeStyle = '#1e3a5f';
                this.ctx.lineWidth = 3 * this.canvasResolution;
            } else {
                this.ctx.strokeStyle = this.shapeColors[this.shapes.indexOf(shape) % this.shapeColors.length].replace('0.6', '1');
                this.ctx.lineWidth = 2 * this.canvasResolution;
            }
            
            this.ctx.stroke();
            
            if (shape.selected) {
                this.drawSelectionHandles(shape);
            }
        });
    }
    
    drawSelectionHandles(shape) {
        shape.points.forEach(point => {
            this.ctx.beginPath();
            // 控制点坐标乘以canvasResolution
            this.ctx.arc(point.x * this.canvasResolution, point.y * this.canvasResolution, this.handleSize, 0, Math.PI * 2);
            this.ctx.fillStyle = '#1e3a5f';
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2 * this.canvasResolution;
            this.ctx.stroke();
        });
    }
    
    drawDrawingPreview() {
        if (this.drawingPoints.length > 0) {
            this.ctx.beginPath();
            // 绘制预览坐标乘以canvasResolution
            this.ctx.moveTo(this.drawingPoints[0].x * this.canvasResolution, this.drawingPoints[0].y * this.canvasResolution);
            
            for (let i = 1; i < this.drawingPoints.length; i++) {
                this.ctx.lineTo(this.drawingPoints[i].x * this.canvasResolution, this.drawingPoints[i].y * this.canvasResolution);
            }
            
            this.ctx.strokeStyle = 'rgba(66, 153, 225, 0.8)';
            this.ctx.lineWidth = 2 * this.canvasResolution;
            this.ctx.setLineDash([5 * this.canvasResolution, 5 * this.canvasResolution]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.drawingPoints.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x * this.canvasResolution, point.y * this.canvasResolution, 4 * this.canvasResolution, 0, Math.PI * 2);
                this.ctx.fillStyle = '#4299e1';
                this.ctx.fill();
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2 * this.canvasResolution;
                this.ctx.stroke();
            });
        }
    }
    
    updateStatus() {
        document.getElementById('current-mode').textContent = this.getModeName(this.currentMode);
        document.getElementById('shape-count').textContent = this.shapes.length;
        
        if (this.selectedShapeId) {
            const shape = this.shapes.find(s => s.id === this.selectedShapeId);
            document.getElementById('selected-shape').textContent = this.getModeName(shape.type);
        } else {
            document.getElementById('selected-shape').textContent = '无';
        }
    }
    
    getModeName(mode) {
        const names = {
            'select': '选择',
            'triangle': '三角形',
            'quadrilateral': '四边形',
            'custom': '自定义'
        };
        return names[mode] || mode;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CanvasApp();
});