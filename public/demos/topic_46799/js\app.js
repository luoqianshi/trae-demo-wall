const AppState = {
    currentPage: 'home',
    importedScheme: null,
    importedParts: [],

    setImportedScheme(schemeData) {
        this.importedScheme = schemeData;
        this.importedParts = schemeData.parts || [];
    },

    clearImportedScheme() {
        this.importedScheme = null;
        this.importedParts = [];
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    initNavigation();
    await loadModelsFromServer();
    initModels();
    initPartsGrid();
});

function initNavigation() {
    document.querySelectorAll('.app-nav-link').forEach(link => {
        link.addEventListener('click', function() {
            const page = this.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageName).classList.add('active');
    window.scrollTo(0, 0);

    document.querySelectorAll('.app-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    AppState.currentPage = pageName;

    if (pageName === 'professional') {
        setTimeout(() => {
            initWorkbench();
            if (AppState.importedParts.length > 0) {
                loadImportedParts();
            }
        }, 50);
    }
    if (pageName === 'inspiration') {
        setTimeout(initInspiration3D, 50);
    }
}

function loadImportedParts() {
    if (!AppState.importedParts || AppState.importedParts.length === 0) return;

    const positions = generateImportedPositions(AppState.importedParts.length);
    AppState.importedParts.forEach((part, index) => {
        const pos = positions[index];
        createPartMesh(part, new THREE.Vector3(pos.x, 0, pos.z));
    });

    AppState.clearImportedScheme();
}

function generateImportedPositions(count) {
    const positions = [];
    const spacing = 4;
    const cols = Math.ceil(Math.sqrt(count));
    const startX = -((cols - 1) * spacing) / 2;
    const startZ = -((Math.ceil(count / cols) - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.push({
            x: startX + col * spacing,
            z: startZ + row * spacing
        });
    }
    return positions;
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
