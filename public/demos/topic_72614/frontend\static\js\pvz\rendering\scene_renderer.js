const THREE = window.THREE;

const GRID_ROWS = 5;
const GRID_COLS = 9;
const CELL_SIZE = 80;
const GRID_OFFSET_X = 80;
const GRID_OFFSET_Y = 100;
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 500;

export class SceneRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.backgroundGroup = null;
        this.gridGroup = null;
        this.fogOverlay = null;
        this.fogRadius = 2;
        this.planternRadius = 5;
        this.selectedPlant = null;
        this.waterRows = [];
        this.waveTime = 0;
    }

    createBackground(sceneType) {
        if (this.backgroundGroup) {
            this.renderer.scene.remove(this.backgroundGroup);
        }

        this.backgroundGroup = new THREE.Group();

        switch (sceneType) {
            case 'lawn':
                this._createLawnBackground();
                break;
            case 'pool':
                this._createPoolBackground();
                break;
            case 'roof':
                this._createRoofBackground();
                break;
            case 'fog_forest':
                this._createFogForestBackground();
                break;
            default:
                this._createLawnBackground();
        }

        this.renderer.scene.add(this.backgroundGroup);
        return this.backgroundGroup;
    }

    _createCanvasTexture(width, height, drawFn) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, width, height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    _createLawnBackground() {
        // Sky
        const skyTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx, w, h) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, GRID_OFFSET_Y);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#B0E0FF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Grass area
            const grassGradient = ctx.createLinearGradient(0, GRID_OFFSET_Y, 0, h);
            grassGradient.addColorStop(0, '#5aaa3a');
            grassGradient.addColorStop(1, '#4a9a2a');
            ctx.fillStyle = grassGradient;
            ctx.fillRect(0, GRID_OFFSET_Y, w, h - GRID_OFFSET_Y);

            // Checkerboard grass
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const x = GRID_OFFSET_X + col * CELL_SIZE;
                    const y = GRID_OFFSET_Y + row * CELL_SIZE;
                    const isLight = (row + col) % 2 === 0;
                    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }
        });

        const skyGeo = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
        const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture });
        const skyPlane = new THREE.Mesh(skyGeo, skyMat);
        skyPlane.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, -1);
        this.backgroundGroup.add(skyPlane);
    }

    _createPoolBackground() {
        this.waterRows = [2, 3]; // Rows 2 and 3 are water

        const bgTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx, w, h) => {
            // Sky
            const gradient = ctx.createLinearGradient(0, 0, 0, GRID_OFFSET_Y);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#B0E0FF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Grass area
            ctx.fillStyle = '#5aaa3a';
            ctx.fillRect(0, GRID_OFFSET_Y, w, h - GRID_OFFSET_Y);

            // Checkerboard grass
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const x = GRID_OFFSET_X + col * CELL_SIZE;
                    const y = GRID_OFFSET_Y + row * CELL_SIZE;

                    if (this.waterRows.includes(row)) {
                        // Water cells
                        ctx.fillStyle = '#4488cc';
                        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                        // Water shimmer
                        ctx.fillStyle = 'rgba(255,255,255,0.1)';
                        ctx.fillRect(x + 10, y + 20, 30, 3);
                        ctx.fillRect(x + 30, y + 50, 25, 2);
                    } else {
                        const isLight = (row + col) % 2 === 0;
                        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
                        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                    }
                }
            }
        });

        const geo = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
        const mat = new THREE.MeshBasicMaterial({ map: bgTexture });
        const plane = new THREE.Mesh(geo, mat);
        plane.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, -1);
        this.backgroundGroup.add(plane);
    }

    _createRoofBackground() {
        const bgTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx, w, h) => {
            // Sky
            const gradient = ctx.createLinearGradient(0, 0, 0, GRID_OFFSET_Y);
            gradient.addColorStop(0, '#ff9966');
            gradient.addColorStop(1, '#ffccaa');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Roof slope
            ctx.fillStyle = '#8b6914';
            ctx.fillRect(0, GRID_OFFSET_Y, w, h - GRID_OFFSET_Y);

            // Roof tiles
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const x = GRID_OFFSET_X + col * CELL_SIZE;
                    const y = GRID_OFFSET_Y + row * CELL_SIZE;
                    // Slope effect - higher rows are lighter
                    const slopeFactor = 1 - (row / GRID_ROWS) * 0.3;
                    ctx.fillStyle = `rgba(139,105,20,${slopeFactor})`;
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                    // Tile lines
                    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }

            // Flower pot row indicator at bottom
            ctx.fillStyle = '#c67a42';
            for (let col = 0; col < GRID_COLS; col++) {
                const x = GRID_OFFSET_X + col * CELL_SIZE + 20;
                const y = GRID_OFFSET_Y + 4 * CELL_SIZE + 10;
                ctx.fillRect(x, y, 40, 20);
            }
        });

        const geo = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
        const mat = new THREE.MeshBasicMaterial({ map: bgTexture });
        const plane = new THREE.Mesh(geo, mat);
        plane.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, -1);
        this.backgroundGroup.add(plane);
    }

    _createFogForestBackground() {
        const bgTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx, w, h) => {
            // Dark sky
            const gradient = ctx.createLinearGradient(0, 0, 0, GRID_OFFSET_Y);
            gradient.addColorStop(0, '#1a3a2a');
            gradient.addColorStop(1, '#2a5a3a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Dark grass
            ctx.fillStyle = '#2a5a2a';
            ctx.fillRect(0, GRID_OFFSET_Y, w, h - GRID_OFFSET_Y);

            // Checkerboard dark grass
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const x = GRID_OFFSET_X + col * CELL_SIZE;
                    const y = GRID_OFFSET_Y + row * CELL_SIZE;
                    const isLight = (row + col) % 2 === 0;
                    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }

            // Fog overlay
            ctx.fillStyle = 'rgba(100,140,100,0.3)';
            ctx.fillRect(0, 0, w, h);
        });

        const geo = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
        const mat = new THREE.MeshBasicMaterial({ map: bgTexture });
        const plane = new THREE.Mesh(geo, mat);
        plane.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, -1);
        this.backgroundGroup.add(plane);

        // Fog overlay
        this._createFogOverlay();
    }

    _createFogOverlay() {
        const fogTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx, w, h) => {
            ctx.fillStyle = 'rgba(20,40,20,0.7)';
            ctx.fillRect(0, 0, w, h);
        });

        const geo = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
        const mat = new THREE.MeshBasicMaterial({
            map: fogTexture,
            transparent: true,
            depthWrite: false
        });
        this.fogOverlay = new THREE.Mesh(geo, mat);
        this.fogOverlay.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 5);
        this.backgroundGroup.add(this.fogOverlay);
    }

    renderScene(sceneType) {
        this.createBackground(sceneType);
    }

    renderGrid(grid) {
        if (this.gridGroup) {
            this.renderer.scene.remove(this.gridGroup);
        }

        this.gridGroup = new THREE.Group();

        const gridTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const x = GRID_OFFSET_X + col * CELL_SIZE;
                    const y = GRID_OFFSET_Y + row * CELL_SIZE;

                    // Grid lines
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

                    // Cell highlight if plant is selected
                    if (this.selectedPlant) {
                        const cellData = grid ? grid[row]?.[col] : null;
                        const isWater = this.waterRows.includes(row);

                        if (!cellData || !cellData.plant) {
                            if (isWater && this.selectedPlant !== 'lilypad') {
                                ctx.fillStyle = 'rgba(255,0,0,0.15)';
                            } else {
                                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                            }
                            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                        }
                    }

                    // Water cell indicator
                    if (this.waterRows.includes(row)) {
                        ctx.fillStyle = 'rgba(68,136,204,0.15)';
                        ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    }
                }
            }
        });

        const geo = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
        const mat = new THREE.MeshBasicMaterial({
            map: gridTexture,
            transparent: true,
            depthWrite: false
        });
        const gridPlane = new THREE.Mesh(geo, mat);
        gridPlane.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0);
        this.gridGroup.add(gridPlane);

        this.renderer.scene.add(this.gridGroup);
    }

    renderLawnMowers(game) {
        if (!game || !game.lawnMowers) return;

        const mowerTexture = this._createCanvasTexture(40, 40, (ctx) => {
            // Mower body
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(4, 12, 28, 16);
            // Wheels
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(10, 30, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(28, 30, 5, 0, Math.PI * 2);
            ctx.fill();
            // Handle
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(30, 16);
            ctx.lineTo(36, 8);
            ctx.stroke();
        });

        for (const mower of game.lawnMowers) {
            if (mower.active) {
                const geo = new THREE.PlaneGeometry(40, 40);
                const mat = new THREE.MeshBasicMaterial({ map: mowerTexture, transparent: true });
                const sprite = new THREE.Mesh(geo, mat);
                const x = GRID_OFFSET_X - 40;
                const y = GRID_OFFSET_Y + mower.row * CELL_SIZE + CELL_SIZE / 2;
                sprite.position.set(x, y, 1);
                this.renderer.scene.add(sprite);
            }
        }
    }

    renderGraves(graves) {
        if (!graves || graves.length === 0) return;

        const graveTexture = this._createCanvasTexture(40, 50, (ctx) => {
            // Grave stone
            ctx.fillStyle = '#8a8a8a';
            ctx.beginPath();
            ctx.moveTo(8, 48);
            ctx.lineTo(8, 16);
            ctx.quadraticCurveTo(20, 4, 32, 16);
            ctx.lineTo(32, 48);
            ctx.closePath();
            ctx.fill();
            // Cross
            ctx.strokeStyle = '#5a5a5a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(20, 20);
            ctx.lineTo(20, 36);
            ctx.moveTo(14, 26);
            ctx.lineTo(26, 26);
            ctx.stroke();
            // RIP text
            ctx.fillStyle = '#5a5a5a';
            ctx.font = '8px sans-serif';
            ctx.fillText('RIP', 14, 44);
        });

        for (const grave of graves) {
            const geo = new THREE.PlaneGeometry(40, 50);
            const mat = new THREE.MeshBasicMaterial({ map: graveTexture, transparent: true });
            const sprite = new THREE.Mesh(geo, mat);
            const x = GRID_OFFSET_X + grave.col * CELL_SIZE + CELL_SIZE / 2;
            const y = GRID_OFFSET_Y + grave.row * CELL_SIZE + CELL_SIZE / 2;
            sprite.position.set(x, y, 1);
            this.renderer.scene.add(sprite);
        }
    }

    updateFog(fogRadius, plants) {
        if (!this.fogOverlay) return;

        this.fogRadius = fogRadius || 2;

        // Find plantern positions
        const planternPositions = [];
        if (plants) {
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const cell = plants[row]?.[col];
                    if (cell && cell.type === 'plantern') {
                        planternPositions.push({
                            x: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
                            y: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2
                        });
                    }
                }
            }
        }

        // Redraw fog with cutouts
        const fogTexture = this._createCanvasTexture(CANVAS_WIDTH, CANVAS_HEIGHT, (ctx) => {
            // Fill with dark fog
            ctx.fillStyle = 'rgba(20,40,20,0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Cut out visibility around planterns
            ctx.globalCompositeOperation = 'destination-out';
            for (const pos of planternPositions) {
                const radius = this.planternRadius * CELL_SIZE;
                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
                gradient.addColorStop(0, 'rgba(0,0,0,1)');
                gradient.addColorStop(0.7, 'rgba(0,0,0,0.8)');
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Default fog radius visibility (smaller)
            const defaultRadius = this.fogRadius * CELL_SIZE;
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const cell = plants?.[row]?.[col];
                    if (cell && cell.type !== 'plantern') {
                        const px = GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
                        const py = GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;
                        const gradient = ctx.createRadialGradient(px, py, 0, px, py, defaultRadius);
                        gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
                        gradient.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(px, py, defaultRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            ctx.globalCompositeOperation = 'source-over';
        });

        this.fogOverlay.material.map.dispose();
        this.fogOverlay.material.map = fogTexture;
        this.fogOverlay.material.needsUpdate = true;
    }

    setSelectedPlant(plantType) {
        this.selectedPlant = plantType;
    }

    updateWaveAnimation(deltaTime) {
        this.waveTime += deltaTime;
        // Water wave animation could be applied to water row textures
        // This is a hook for future animation updates
    }
}
