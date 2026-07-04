let inspScene, inspCamera, inspRenderer, inspModelGroup;
let inspParams = {
    length: 30,
    width: 20,
    height: 10,
    material: 'wood',
    color: '#C9A86C'
};

function initInspiration3D() {
    const canvas = document.getElementById('inspiration-3d-canvas');
    if (!canvas) return;

    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
        setTimeout(initInspiration3D, 100);
        return;
    }

    if (inspRenderer) return;

    canvas.width = rect.width;
    canvas.height = rect.height;

    inspScene = new THREE.Scene();
    inspScene.background = new THREE.Color(0xFFFBF5);

    inspCamera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
    inspCamera.position.set(6, 5, 8);
    inspCamera.lookAt(0, 1, 0);

    inspRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    inspRenderer.setSize(rect.width, rect.height);
    inspRenderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    inspScene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xFFE4B5, 0.8);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    inspScene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xC9A86C, 0.3);
    fillLight.position.set(-5, 5, -5);
    inspScene.add(fillLight);

    const platformGeo = new THREE.BoxGeometry(10, 0.3, 8);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0xD4B896, roughness: 0.9 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.15;
    platform.receiveShadow = true;
    inspScene.add(platform);

    inspModelGroup = new THREE.Group();
    inspScene.add(inspModelGroup);

    let isRotating = true;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    function animateInspiration3D() {
        requestAnimationFrame(animateInspiration3D);

        if (isRotating && inspModelGroup) {
            inspModelGroup.rotation.y += 0.005;
        } else if (!isRotating && inspModelGroup) {
            inspModelGroup.rotation.y += (targetRotationY - inspModelGroup.rotation.y) * 0.1;
            inspModelGroup.rotation.x += (targetRotationX - inspModelGroup.rotation.x) * 0.1;
        }

        inspRenderer.render(inspScene, inspCamera);
    }

    animateInspiration3D();

    canvas.addEventListener('mousedown', (e) => {
        isRotating = false;
        isDragging = true;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    });
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMouseX;
            const deltaY = e.clientY - previousMouseY;
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationX));
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        }
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoom = e.deltaY > 0 ? 1.1 : 0.9;
        inspCamera.position.multiplyScalar(zoom);
        inspCamera.position.clampLength(5, 20);
    });

    window.addEventListener('resize', () => {
        const r = container.getBoundingClientRect();
        if (r.width < 10 || r.height < 10) return;
        canvas.width = r.width;
        canvas.height = r.height;
        inspCamera.aspect = r.width / r.height;
        inspCamera.updateProjectionMatrix();
        inspRenderer.setSize(r.width, r.height);
    });
}

function buildInspirationModel(schemeIndex) {
    if (!inspModelGroup || !inspScene) return;

    while (inspModelGroup.children.length > 0) {
        const child = inspModelGroup.children[0];
        inspModelGroup.remove(child);
    }

    const color = new THREE.Color(inspParams.color);
    const materialProps = { color, roughness: 0.6, metalness: 0.05 };

    if (inspParams.material === 'metal') {
        materialProps.metalness = 0.8;
        materialProps.roughness = 0.3;
    } else if (inspParams.material === 'acrylic') {
        materialProps.transparent = true;
        materialProps.opacity = 0.6;
        materialProps.roughness = 0.1;
    }

    const mat = new THREE.MeshStandardMaterial(materialProps);

    const s = 0.1;
    const w = inspParams.width * s;
    const l = inspParams.length * s;
    const h = inspParams.height * s;

    switch (schemeIndex) {
        case 0:
            buildMonitorRiser(l, w, h, mat);
            break;
        case 1:
            buildStorageBox(l, w, h, mat);
            break;
        case 2:
            buildHeadphoneStand(l, w, h, mat);
            break;
    }
}

function buildMonitorRiser(l, w, h, mat) {
    const topGeo = new THREE.BoxGeometry(l, 0.15, w);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.y = h;
    top.castShadow = true;
    top.receiveShadow = true;
    inspModelGroup.add(top);

    const legGeo = new THREE.BoxGeometry(l * 0.1, h, w * 0.9);
    const leg1 = new THREE.Mesh(legGeo, mat.clone());
    leg1.position.x = -l * 0.4;
    leg1.position.y = h / 2;
    leg1.castShadow = true;
    inspModelGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, mat.clone());
    leg2.position.x = l * 0.4;
    leg2.position.y = h / 2;
    leg2.castShadow = true;
    inspModelGroup.add(leg2);

    inspModelGroup.position.y = 0.1;
}

function buildStorageBox(l, w, h, mat) {
    const baseGeo = new THREE.BoxGeometry(l, 0.1, w);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    inspModelGroup.add(base);

    const wallThick = 0.08;
    const wallH = h;

    const frontGeo = new THREE.BoxGeometry(l, wallH, wallThick);
    const front = new THREE.Mesh(frontGeo, mat.clone());
    front.position.z = w / 2 - wallThick / 2;
    front.position.y = wallH / 2 + 0.1;
    front.castShadow = true;
    inspModelGroup.add(front);

    const back = new THREE.Mesh(frontGeo, mat.clone());
    back.position.z = -w / 2 + wallThick / 2;
    back.position.y = wallH / 2 + 0.1;
    back.castShadow = true;
    inspModelGroup.add(back);

    const sideGeo = new THREE.BoxGeometry(wallThick, wallH, w);
    const left = new THREE.Mesh(sideGeo, mat.clone());
    left.position.x = -l / 2 + wallThick / 2;
    left.position.y = wallH / 2 + 0.1;
    left.castShadow = true;
    inspModelGroup.add(left);

    const right = new THREE.Mesh(sideGeo, mat.clone());
    right.position.x = l / 2 - wallThick / 2;
    right.position.y = wallH / 2 + 0.1;
    right.castShadow = true;
    inspModelGroup.add(right);

    const dividerGeo = new THREE.BoxGeometry(l * 0.05, wallH * 0.8, w);
    const divider = new THREE.Mesh(dividerGeo, mat.clone());
    divider.position.y = wallH * 0.4 + 0.1;
    divider.castShadow = true;
    inspModelGroup.add(divider);

    inspModelGroup.position.y = 0.1;
}

function buildHeadphoneStand(l, w, h, mat) {
    const baseGeo = new THREE.CylinderGeometry(l * 0.3, l * 0.35, 0.15, 32);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    inspModelGroup.add(base);

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, h * 0.8, 16);
    const pole = new THREE.Mesh(poleGeo, mat.clone());
    pole.position.y = 0.15 + h * 0.4;
    pole.castShadow = true;
    inspModelGroup.add(pole);

    const topGeo = new THREE.TorusGeometry(l * 0.25, 0.06, 8, 24, Math.PI);
    const top = new THREE.Mesh(topGeo, mat.clone());
    top.position.y = 0.15 + h * 0.8;
    top.rotation.x = -Math.PI / 2;
    top.rotation.z = Math.PI;
    top.castShadow = true;
    inspModelGroup.add(top);

    if (currentSchemeIndex === 2) {
        const usbGeo = new THREE.BoxGeometry(l * 0.4, 0.12, w * 0.3);
        const usbMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const usb = new THREE.Mesh(usbGeo, usbMat);
        usb.position.y = 0.21;
        usb.position.z = w * 0.2;
        usb.castShadow = true;
        inspModelGroup.add(usb);

        const ledGeo = new THREE.BoxGeometry(l * 0.45, 0.02, w * 0.08);
        const ledMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.5 });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.y = 0.16;
        led.position.z = -w * 0.2;
        inspModelGroup.add(led);
    }

    inspModelGroup.position.y = 0.1;
}

function updateInspirationColor(color) {
    inspParams.color = color;
    if (currentSchemeIndex !== null) {
        buildInspirationModel(currentSchemeIndex);
    }
}

function updateInspirationSize(axis, value) {
    inspParams[axis] = parseInt(value);
    if (currentSchemeIndex !== null) {
        buildInspirationModel(currentSchemeIndex);
    }
}

function updateInspirationMaterial(material) {
    inspParams.material = material;
    if (currentSchemeIndex !== null) {
        buildInspirationModel(currentSchemeIndex);
    }
}
