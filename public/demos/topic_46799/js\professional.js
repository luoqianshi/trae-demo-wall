const parts = {
    boards: [
        { id: 'board-wood-1', name: '原木板 30×20', price: 25, color: '#C9A86C' },
        { id: 'board-wood-2', name: '原木板 40×30', price: 35, color: '#B8956A' },
        { id: 'board-acrylic-1', name: '透明亚克力板', price: 30, color: '#FFFFFF' },
        { id: 'board-bamboo-1', name: '竹板 25×15', price: 20, color: '#D4C9A0' },
        { id: 'board-mdf-1', name: '密度板 40×30', price: 35, color: '#E8D5B7' },
        { id: 'board-walnut-1', name: '胡桃木片', price: 45, color: '#8B5A2B' }
    ],
    hardware: [
        { id: 'bracket-l', name: 'L型角码', price: 3, color: '#888888' },
        { id: 'screw-wood', name: '木螺丝', price: 0.5, color: '#666666' },
        { id: 'bolt-expansion', name: '膨胀螺栓', price: 2, color: '#999999' },
        { id: 'hinge', name: '合页', price: 5, color: '#AAAAAA' }
    ],
    brackets: [
        { id: 'monitor-bracket', name: '显示器支架', price: 45, color: '#333333' },
        { id: 'keyboard-tray', name: '键盘托架', price: 35, color: '#C9A86C' },
        { id: 'shelf-bracket', name: '搁板支架', price: 15, color: '#888888' }
    ],
    electronics: [
        { id: 'led-strip', name: 'LED灯带 50cm', price: 15, color: '#FFFF00' },
        { id: 'usb-hub', name: 'USB排插', price: 25, color: '#222222' },
        { id: 'fan', name: '风扇模块', price: 30, color: '#333333' }
    ],
    decor: [
        { id: 'plant-pot', name: '绿植花盆', price: 20, color: '#7CB342' },
        { id: 'cable-holder', name: '线缆收纳盒', price: 15, color: '#9B9B8C' },
        { id: 'hook', name: '挂钩', price: 5, color: '#888888' },
        { id: 'mushroom-light', name: '蘑菇小夜灯', price: 35, color: '#E8D5B7' }
    ]
};

let placedParts = [];
let currentTab = 'boards';
let gridVisible = true;

let scene, camera, renderer, raycaster, mouse;
let selectedPart = null;
let isDragging = false;
let gridHelper;

function initPartsGrid() {
    renderPartsGrid();
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.parts-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderPartsGrid();
}

function renderPartsGrid() {
    const grid = document.getElementById('partsGrid');
    const items = parts[currentTab] || [];
    grid.innerHTML = items.map(part => `
        <div class="part-item" draggable="true" ondragstart="onPartDragStart(event, '${part.id}')">
            <div class="part-preview" style="background: ${part.color}; ${part.color === '#FFFFFF' ? 'border: 1px solid #DDD;' : ''}"></div>
            <div class="part-name">${part.name}</div>
            <div class="part-price">¥${part.price}</div>
        </div>
    `).join('');
}

function onPartDragStart(e, partId) {
    e.dataTransfer.setData('partId', partId);
}

function initWorkbench() {
    const canvas = document.getElementById('workbench-canvas');
    if (!canvas || scene) return;

    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5E6C8);

    camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xFFE4B5, 1, 200);
    pointLight.position.set(20, 30, 20);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const tableGeo = new THREE.BoxGeometry(40, 1, 30);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xA67C52, roughness: 0.8 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.5;
    table.receiveShadow = true;
    scene.add(table);

    gridHelper = new THREE.GridHelper(40, 20, 0x8B5A2B, 0xD4C4A8);
    scene.add(gridHelper);

    canvas.ondrop = onCanvasDrop;
    canvas.ondragover = e => e.preventDefault();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onCanvasMouseMove);

    animate();
}

function animate() {
    if (!renderer) return;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function onCanvasDrop(e) {
    e.preventDefault();
    const partId = e.dataTransfer.getData('partId');
    if (!partId) return;

    let partData;
    Object.values(parts).forEach(cat => {
        const found = cat.find(p => p.id === partId);
        if (found) partData = found;
    });
    if (!partData) return;

    const canvas = document.getElementById('workbench-canvas');
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);

    if (!gridVisible) {
        createPartMesh(partData, point);
    } else {
        point.x = Math.round(point.x / 2) * 2;
        point.z = Math.round(point.z / 2) * 2;
        createPartMesh(partData, point);
    }
}

function createPartMesh(partData, position) {
    const geo = new THREE.BoxGeometry(2, 1, 2);
    const color = partData.color;
    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.5,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.position.y = 0.5;
    mesh.castShadow = true;
    mesh.userData = { partData };
    scene.add(mesh);
    placedParts.push(mesh);
    updateBOM();
}

function onCanvasClick(e) {
    const canvas = document.getElementById('workbench-canvas');
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(placedParts);

    if (selectedPart) {
        selectedPart.material.emissive.setHex(0x000000);
    }

    if (intersects.length > 0) {
        selectedPart = intersects[0].object;
        selectedPart.material.emissive.setHex(0x444444);
    } else {
        selectedPart = null;
    }
}

function onCanvasMouseMove(e) {
}

function updateBOM() {
    const bomList = document.getElementById('bomList');
    const bomTotal = document.getElementById('bomTotal');
    const bomCount = document.getElementById('bomCount');

    const summary = {};
    placedParts.forEach(part => {
        const id = part.userData.partData.id;
        if (!summary[id]) {
            summary[id] = { ...part.userData.partData, count: 0 };
        }
        summary[id].count++;
    });

    const items = Object.values(summary);
    bomCount.textContent = `${placedParts.length} 件`;

    if (items.length === 0) {
        bomList.innerHTML = '<div class="bom-empty"><div class="bom-empty-icon">📦</div><div class="bom-empty-text">从左侧拖拽零件到这里<br>开始你的创作吧</div></div>';
        bomTotal.textContent = '¥0';
        return;
    }

    bomList.innerHTML = items.map(item => `
        <div class="bom-card">
            <div class="bom-color" style="background: ${item.color}; ${item.color === '#FFFFFF' ? 'border: 1px solid #DDD;' : ''}"></div>
            <div class="bom-info">
                <div class="bom-name">${item.name}</div>
                <div class="bom-qty">×${item.count}</div>
            </div>
            <div class="bom-price">¥${(item.price * item.count).toFixed(0)}</div>
        </div>
    `).join('');

    const total = items.reduce((sum, item) => sum + item.price * item.count, 0);
    bomTotal.textContent = `¥${total.toFixed(0)}`;
}

function setView(view) {
    document.querySelectorAll('.pro-toolbar .tool-btn').forEach(btn => {
        if (btn.title && btn.title.includes('视图')) btn.classList.remove('active');
    });
    event.target.classList.add('active');

    switch(view) {
        case 'top':
            camera.position.set(0, 30, 0);
            camera.lookAt(0, 0, 0);
            break;
        case 'front':
            camera.position.set(0, 10, 30);
            camera.lookAt(0, 0, 0);
            break;
        case 'free':
            camera.position.set(15, 15, 15);
            camera.lookAt(0, 0, 0);
            break;
    }
}

function toggleGrid() {
    gridVisible = !gridVisible;
    if (gridHelper) gridHelper.visible = gridVisible;
    document.getElementById('gridBtn').classList.toggle('active', gridVisible);
}

function exportBOM() {
    const summary = {};
    placedParts.forEach(part => {
        const id = part.userData.partData.id;
        if (!summary[id]) {
            summary[id] = { ...part.userData.partData, count: 0 };
        }
        summary[id].count++;
    });

    const items = Object.values(summary);
    const total = items.reduce((sum, item) => sum + item.price * item.count, 0);

    let text = '原子工坊 AtomWorks - 物料清单\n';
    text += '================================\n\n';
    items.forEach(item => {
        text += `${item.name} × ${item.count} = ¥${(item.price * item.count).toFixed(0)}\n`;
    });
    text += '\n================================\n';
    text += `总计：¥${total.toFixed(0)}\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AtomWorks-BOM.txt';
    a.click();
    URL.revokeObjectURL(url);
}
