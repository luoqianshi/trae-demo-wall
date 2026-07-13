var Nian3DSprite = (function() {
    'use strict';

    var THREE = null;
    var webglSupported = null;

    var STATE_NAMES = [
        'idle', 'walk', 'happy', 'thinking', 'wave',
        'sleep', 'work', 'celebrate', 'confused', 'point'
    ];

    function checkWebGLSupport() {
        if (webglSupported !== null) return webglSupported;
        try {
            var canvas = document.createElement('canvas');
            webglSupported = !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            webglSupported = false;
        }
        return webglSupported;
    }

    function loadTHREE(callback) {
        if (window.THREE) {
            THREE = window.THREE;
            callback(null, THREE);
            return;
        }
        if (typeof window.__threeLoading === 'undefined') {
            window.__threeLoading = true;
            window.__threeCallbacks = [callback];

            var localSrc = 'js/utils/three.min.js';
            var cdnSrc = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

            function tryLoad(src, onError) {
                var script = document.createElement('script');
                script.src = src;
                script.onload = function() {
                    THREE = window.THREE;
                    window.__threeLoading = false;
                    var cbs = window.__threeCallbacks || [];
                    window.__threeCallbacks = null;
                    cbs.forEach(function(cb) { cb(null, THREE); });
                };
                script.onerror = function() {
                    if (onError) {
                        onError();
                    } else {
                        window.__threeLoading = false;
                        var cbs = window.__threeCallbacks || [];
                        window.__threeCallbacks = null;
                        cbs.forEach(function(cb) { cb(new Error('Failed to load Three.js'), null); });
                    }
                };
                document.head.appendChild(script);
            }

            tryLoad(localSrc, function() {
                tryLoad(cdnSrc);
            });
        } else {
            window.__threeCallbacks.push(callback);
        }
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function Nian3DSprite(options) {
        options = options || {};
        this.width = options.width || 100;
        this.height = options.height || 140;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.initialState = options.initialState || 'idle';
        this.facing = options.facing || 'right';

        this._element = null;
        this._canvas = null;
        this._initialized = false;
        this._threeReady = false;
        this._running = false;
        this._animationFrameId = null;
        this._lastTime = 0;
        this._deltaTime = 0;

        this.currentState = this.initialState;
        this._updateCallbacks = [];

        this._moveAnimating = false;
        this._moveStartX = 0;
        this._moveStartY = 0;
        this._moveTargetX = 0;
        this._moveTargetY = 0;
        this._moveDuration = 0;
        this._moveElapsed = 0;
        this._moveCallback = null;

        this._renderer = null;
        this._scene = null;
        this._camera = null;
        this._characterGroup = null;
        this._headGroup = null;
        this._leftEye = null;
        this._rightEye = null;
        this._leftShine = null;
        this._rightShine = null;
        this._mouthGroup = null;
        this._innerGlow = null;
        this._bulbGlassMat = null;
        this._leftArmGroup = null;
        this._rightArmGroup = null;
        this._leftLegGroup = null;
        this._rightLegGroup = null;
        this._bodyGroup = null;
        this._particles = null;
        this._particleGroup = null;
        this._zzzGroup = null;
        this._questionGroup = null;

        this._stateTime = 0;
        this._blinkTimer = 0;
        this._isBlinking = false;
    }

    Nian3DSprite.prototype.init = function(container) {
        if (this._initialized) return;

        this._createDOM();

        if (container) {
            this.attachTo(container);
        }

        if (checkWebGLSupport()) {
            var self = this;
            loadTHREE(function(err) {
                if (err) {
                    console.warn('Nian3DSprite: Failed to load Three.js');
                    self._hideLoading();
                    return;
                }
                THREE = window.THREE;
                if (!THREE) {
                    console.warn('Nian3DSprite: THREE is not available');
                    self._hideLoading();
                    return;
                }
                self._setupThree();
                self._buildCharacter();
                self._threeReady = true;
                self._initialized = true;
                self._hideLoading();
                if (self._running) {
                    self._startRenderLoop();
                }
            });
        } else {
            console.warn('Nian3DSprite: WebGL not supported');
            this._hideLoading();
            this._initialized = true;
        }
    };

    Nian3DSprite.prototype._createDOM = function() {
        this._element = document.createElement('div');
        this._element.className = 'nian-3d-sprite';
        this._element.style.position = 'absolute';
        this._element.style.width = this.width + 'px';
        this._element.style.height = this.height + 'px';
        this._element.style.willChange = 'transform';
        this._element.style.overflow = 'hidden';
        this._element.style.pointerEvents = 'auto';
        this._element.style.cursor = 'pointer';

        this._canvas = document.createElement('canvas');
        this._canvas.className = 'nian-3d-sprite-canvas';
        this._canvas.style.display = 'block';
        this._canvas.style.width = '100%';
        this._canvas.style.height = '100%';
        this._element.appendChild(this._canvas);

        this._loadingEl = document.createElement('div');
        this._loadingEl.className = 'nian-3d-loading';
        this._loadingEl.style.position = 'absolute';
        this._loadingEl.style.top = '0';
        this._loadingEl.style.left = '0';
        this._loadingEl.style.width = '100%';
        this._loadingEl.style.height = '100%';
        this._loadingEl.style.display = 'flex';
        this._loadingEl.style.alignItems = 'center';
        this._loadingEl.style.justifyContent = 'center';
        this._loadingEl.style.background = 'rgba(255, 248, 232, 0.8)';
        this._loadingEl.style.borderRadius = '50%';
        this._loadingEl.style.fontSize = '12px';
        this._loadingEl.style.color = '#8B6F47';
        this._loadingEl.style.transition = 'opacity 0.3s ease';
        this._loadingEl.textContent = '加载中...';
        this._element.appendChild(this._loadingEl);

        this._updatePosition();
        this._updateFacing();
    };

    Nian3DSprite.prototype._setupThree = function() {
        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            alpha: true,
            antialias: true,
            premultipliedAlpha: true
        });
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this._renderer.setSize(this.width, this.height, false);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.setClearColor(0x000000, 0);

        this._scene = new THREE.Scene();

        this._camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
        this._camera.position.set(0, 0.2, 4.5);
        this._camera.lookAt(0, 0.2, 0);

        var ambientLight = new THREE.AmbientLight(0xfff8e8, 0.5);
        this._scene.add(ambientLight);

        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8dcc8, 0.4);
        this._scene.add(hemiLight);

        var mainLight = new THREE.DirectionalLight(0xfff0d8, 1.0);
        mainLight.position.set(2, 4, 3);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 512;
        mainLight.shadow.mapSize.height = 512;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 10;
        mainLight.shadow.camera.left = -2;
        mainLight.shadow.camera.right = 2;
        mainLight.shadow.camera.top = 3;
        mainLight.shadow.camera.bottom = -2;
        this._scene.add(mainLight);

        var fillLight = new THREE.DirectionalLight(0xe8d0b8, 0.3);
        fillLight.position.set(-2, 2, 2);
        this._scene.add(fillLight);
    };

    Nian3DSprite.prototype._buildCharacter = function() {
        this._characterGroup = new THREE.Group();
        this._characterGroup.position.y = -0.3;
        this._characterGroup.scale.setScalar(0.8);
        this._scene.add(this._characterGroup);

        var bodyMat = new THREE.MeshStandardMaterial({
            color: 0xfffaf5, roughness: 0.45, metalness: 0.03
        });
        var bulbGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xfaf8f0, roughness: 0.08, metalness: 0,
            transparent: true, opacity: 0.92,
            emissive: 0xffe8a0, emissiveIntensity: 0.15,
            reflectivity: 0.6
        });
        this._bulbGlassMat = bulbGlassMat;
        var filamentMat = new THREE.MeshStandardMaterial({
            color: 0xfff0c8, emissive: 0xffd080, emissiveIntensity: 1.2, roughness: 0.3
        });
        var baseMat = new THREE.MeshStandardMaterial({
            color: 0xd4a853, roughness: 0.5, metalness: 0.3
        });
        var eyeMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a, roughness: 0.25, metalness: 0.1
        });
        var eyeShineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        var blushMat = new THREE.MeshStandardMaterial({
            color: 0xff9999, transparent: true, opacity: 0.5, roughness: 1
        });
        var mouthMat = new THREE.MeshStandardMaterial({
            color: 0x5a4a3a, roughness: 0.5
        });
        var wireMat = new THREE.MeshStandardMaterial({
            color: 0x999999, metalness: 0.8, roughness: 0.3
        });
        var armMat = new THREE.MeshStandardMaterial({
            color: 0xffe066, roughness: 0.4, metalness: 0.05
        });
        var legMat = new THREE.MeshStandardMaterial({
            color: 0xd4a853, roughness: 0.5, metalness: 0.2
        });

        this._bodyGroup = new THREE.Group();
        this._bodyGroup.position.y = -0.2;
        this._characterGroup.add(this._bodyGroup);

        var bodyGeo = new THREE.SphereGeometry(0.45, 24, 24);
        bodyGeo.scale(1, 0.8, 0.85);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        this._bodyGroup.add(body);

        this._headGroup = new THREE.Group();
        this._headGroup.position.y = 0.5;
        this._characterGroup.add(this._headGroup);

        var bulbGeo = new THREE.SphereGeometry(0.5, 32, 32);
        var bulb = new THREE.Mesh(bulbGeo, bulbGlassMat);
        bulb.castShadow = true;
        this._headGroup.add(bulb);

        var bulbBottomGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.12, 24);
        var bulbBottom = new THREE.Mesh(bulbBottomGeo, baseMat);
        bulbBottom.position.y = -0.42;
        bulbBottom.castShadow = true;
        this._headGroup.add(bulbBottom);

        for (var i = 0; i < 3; i++) {
            var threadGeo = new THREE.TorusGeometry(0.28 - i * 0.012, 0.01, 6, 32);
            var thread = new THREE.Mesh(threadGeo, baseMat);
            thread.position.y = -0.37 + i * 0.03;
            thread.rotation.x = Math.PI / 2;
            this._headGroup.add(thread);
        }

        var wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6), wireMat);
        wire1.position.set(-0.05, 0, 0);
        this._headGroup.add(wire1);
        var wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6), wireMat);
        wire2.position.set(0.05, 0, 0);
        this._headGroup.add(wire2);

        var filamentCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.05, 0.08, 0),
            new THREE.Vector3(-0.03, 0.18, -0.02),
            new THREE.Vector3(0, 0.22, 0.02),
            new THREE.Vector3(0.03, 0.18, -0.02),
            new THREE.Vector3(0.05, 0.08, 0)
        ]);
        var filamentGeo = new THREE.TubeGeometry(filamentCurve, 16, 0.01, 6, false);
        var filament = new THREE.Mesh(filamentGeo, filamentMat);
        this._headGroup.add(filament);

        this._innerGlow = new THREE.PointLight(0xffd080, 0.7, 2, 2);
        this._innerGlow.position.y = 0.08;
        this._headGroup.add(this._innerGlow);

        this._leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), eyeMat);
        this._leftEye.scale.set(1.05, 1.15, 1);
        this._leftEye.position.set(-0.16, 0.02, 0.44);
        this._headGroup.add(this._leftEye);
        this._rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), eyeMat);
        this._rightEye.scale.set(1.05, 1.15, 1);
        this._rightEye.position.set(0.16, 0.02, 0.44);
        this._headGroup.add(this._rightEye);

        this._leftShine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), eyeShineMat);
        this._leftShine.position.set(-0.14, 0.05, 0.5);
        this._headGroup.add(this._leftShine);
        this._rightShine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), eyeShineMat);
        this._rightShine.position.set(0.18, 0.05, 0.5);
        this._headGroup.add(this._rightShine);

        var leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), blushMat);
        leftBlush.position.set(-0.26, -0.08, 0.4);
        leftBlush.rotation.y = -0.5;
        this._headGroup.add(leftBlush);
        var rightBlush = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), blushMat);
        rightBlush.position.set(0.26, -0.08, 0.4);
        rightBlush.rotation.y = 0.5;
        this._headGroup.add(rightBlush);

        this._mouthGroup = new THREE.Group();
        this._mouthGroup.position.set(0, -0.16, 0.46);
        this._headGroup.add(this._mouthGroup);
        this._updateMouth('happy');

        var armGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.28, 12);
        var shoulderGeo = new THREE.SphereGeometry(0.06, 12, 12);
        var handGeo = new THREE.SphereGeometry(0.065, 12, 12);

        this._leftArmGroup = new THREE.Group();
        this._leftArmGroup.position.set(-0.42, -0.15, 0);
        this._bodyGroup.add(this._leftArmGroup);
        var leftShoulder = new THREE.Mesh(shoulderGeo, armMat);
        leftShoulder.castShadow = true;
        this._leftArmGroup.add(leftShoulder);
        var leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.y = -0.18;
        leftArm.rotation.z = 0.25;
        leftArm.castShadow = true;
        this._leftArmGroup.add(leftArm);
        var leftHand = new THREE.Mesh(handGeo, armMat);
        leftHand.position.set(-0.03, -0.33, 0);
        leftHand.castShadow = true;
        this._leftArmGroup.add(leftHand);

        this._rightArmGroup = new THREE.Group();
        this._rightArmGroup.position.set(0.42, -0.15, 0);
        this._bodyGroup.add(this._rightArmGroup);
        var rightShoulder = new THREE.Mesh(shoulderGeo, armMat);
        rightShoulder.castShadow = true;
        this._rightArmGroup.add(rightShoulder);
        var rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.y = -0.18;
        rightArm.rotation.z = -0.25;
        rightArm.castShadow = true;
        this._rightArmGroup.add(rightArm);
        var rightHand = new THREE.Mesh(handGeo, armMat);
        rightHand.position.set(0.03, -0.33, 0);
        rightHand.castShadow = true;
        this._rightArmGroup.add(rightHand);

        var legGeo = new THREE.CylinderGeometry(0.06, 0.065, 0.25, 12);
        var footGeo = new THREE.SphereGeometry(0.07, 12, 12);

        this._leftLegGroup = new THREE.Group();
        this._leftLegGroup.position.set(-0.15, -0.55, 0);
        this._bodyGroup.add(this._leftLegGroup);
        var leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.y = -0.12;
        leftLeg.castShadow = true;
        this._leftLegGroup.add(leftLeg);
        var leftFoot = new THREE.Mesh(footGeo, legMat);
        leftFoot.position.y = -0.25;
        leftFoot.scale.set(1, 0.7, 1.3);
        leftFoot.castShadow = true;
        this._leftLegGroup.add(leftFoot);

        this._rightLegGroup = new THREE.Group();
        this._rightLegGroup.position.set(0.15, -0.55, 0);
        this._bodyGroup.add(this._rightLegGroup);
        var rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.y = -0.12;
        rightLeg.castShadow = true;
        this._rightLegGroup.add(rightLeg);
        var rightFoot = new THREE.Mesh(footGeo, legMat);
        rightFoot.position.y = -0.25;
        rightFoot.scale.set(1, 0.7, 1.3);
        rightFoot.castShadow = true;
        this._rightLegGroup.add(rightFoot);

        this._particleGroup = new THREE.Group();
        this._particleGroup.position.y = 0.3;
        this._scene.add(this._particleGroup);
        this._particles = [];
        var particleColors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff8cc8];
        for (var p = 0; p < 20; p++) {
            var pGeo = new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 8, 8);
            var pMat = new THREE.MeshBasicMaterial({
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                transparent: true,
                opacity: 0
            });
            var particle = new THREE.Mesh(pGeo, pMat);
            particle.visible = false;
            particle.userData = {
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 1
            };
            this._particles.push(particle);
            this._particleGroup.add(particle);
        }

        this._zzzGroup = new THREE.Group();
        this._zzzGroup.position.set(0.25, 0.6, 0);
        this._scene.add(this._zzzGroup);
        this._zzzGroup.visible = false;
        var zColors = [0x666666, 0x888888, 0xaaaaaa];
        for (var z = 0; z < 3; z++) {
            var zGeo = new THREE.PlaneGeometry(0.15, 0.18);
            var zMat = new THREE.MeshBasicMaterial({
                color: zColors[z],
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            var zMesh = new THREE.Mesh(zGeo, zMat);
            zMesh.position.set(z * 0.1, z * 0.12, 0);
            zMesh.userData.baseY = z * 0.12;
            this._zzzGroup.add(zMesh);
        }

        this._questionGroup = new THREE.Group();
        this._questionGroup.position.set(0.2, 0.7, 0.3);
        this._scene.add(this._questionGroup);
        this._questionGroup.visible = false;
        var qGeo = new THREE.PlaneGeometry(0.2, 0.3);
        var qMat = new THREE.MeshBasicMaterial({
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        var qMesh = new THREE.Mesh(qGeo, qMat);
        this._questionGroup.add(qMesh);
    };

    Nian3DSprite.prototype._updateMouth = function(expr) {
        if (!this._mouthGroup || !THREE) return;

        while (this._mouthGroup.children.length > 0) {
            this._mouthGroup.remove(this._mouthGroup.children[0]);
        }

        var mouthMat = new THREE.MeshStandardMaterial({
            color: 0x5a4a3a, roughness: 0.5
        });

        if (expr === 'happy') {
            this._mouthGroup.scale.set(1.1, 1.1, 1);
            var smileShape = new THREE.Shape();
            smileShape.moveTo(-0.04, 0.01);
            smileShape.quadraticCurveTo(0, -0.035, 0.04, 0.01);
            smileShape.quadraticCurveTo(0, -0.008, -0.04, 0.01);
            var smileGeo = new THREE.ShapeGeometry(smileShape);
            var smile = new THREE.Mesh(smileGeo, mouthMat);
            smile.position.z = 0.001;
            this._mouthGroup.add(smile);
        } else if (expr === 'confused') {
            this._mouthGroup.scale.set(0.9, 0.9, 1);
            var oGeo = new THREE.CircleGeometry(0.028, 16);
            var oMouth = new THREE.Mesh(oGeo, mouthMat);
            oMouth.position.z = 0.001;
            this._mouthGroup.add(oMouth);
        } else if (expr === 'sleep') {
            this._mouthGroup.scale.set(0.8, 0.8, 1);
            var lineGeo = new THREE.PlaneGeometry(0.04, 0.006);
            var lineMouth = new THREE.Mesh(lineGeo, mouthMat);
            lineMouth.position.z = 0.001;
            lineMouth.position.y = -0.005;
            this._mouthGroup.add(lineMouth);
        } else if (expr === 'focus') {
            this._mouthGroup.scale.set(0.9, 0.9, 1);
            var focusLineGeo = new THREE.PlaneGeometry(0.035, 0.008);
            var focusMouth = new THREE.Mesh(focusLineGeo, mouthMat);
            focusMouth.position.z = 0.001;
            this._mouthGroup.add(focusMouth);
        } else {
            this._mouthGroup.scale.set(1, 1, 1);
            var defaultGeo = new THREE.CircleGeometry(0.022, 16);
            var defaultMouth = new THREE.Mesh(defaultGeo, mouthMat);
            defaultMouth.position.z = 0.001;
            this._mouthGroup.add(defaultMouth);
        }
    };

    Nian3DSprite.prototype.setState = function(stateName) {
        if (STATE_NAMES.indexOf(stateName) === -1 || this.currentState === stateName) return;
        this.currentState = stateName;
        this._stateTime = 0;

        if (this._threeReady && this._mouthGroup) {
            var expr = 'happy';
            switch (stateName) {
                case 'confused':
                    expr = 'confused';
                    break;
                case 'sleep':
                    expr = 'sleep';
                    break;
                case 'work':
                case 'point':
                    expr = 'focus';
                    break;
                case 'thinking':
                    expr = 'confused';
                    break;
                default:
                    expr = 'happy';
            }
            this._updateMouth(expr);
        }

        if (this._particleGroup) {
            this._particleGroup.visible = (stateName === 'celebrate');
        }
        if (this._zzzGroup) {
            this._zzzGroup.visible = (stateName === 'sleep');
        }
        if (this._questionGroup) {
            this._questionGroup.visible = (stateName === 'confused' || stateName === 'thinking');
        }
    };

    Nian3DSprite.prototype.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
        this._moveAnimating = false;
        this._updatePosition();
    };

    Nian3DSprite.prototype.moveTo = function(x, y, duration, callback) {
        if (duration <= 0 || !duration) {
            this.setPosition(x, y);
            if (callback) callback();
            return;
        }

        this._moveStartX = this.x;
        this._moveStartY = this.y;
        this._moveTargetX = x;
        this._moveTargetY = y;
        this._moveDuration = duration;
        this._moveElapsed = 0;
        this._moveAnimating = true;
        this._moveCallback = callback || null;

        if (x < this.x) {
            this.setFacing('left');
        } else if (x > this.x) {
            this.setFacing('right');
        }
    };

    Nian3DSprite.prototype.setFacing = function(direction) {
        if (direction !== 'left' && direction !== 'right') return;
        this.facing = direction;
        this._updateFacing();
    };

    Nian3DSprite.prototype._updatePosition = function() {
        if (!this._element) return;
        this._element.style.transform = 'translate3d(' + this.x + 'px, ' + this.y + 'px, 0)';
    };

    Nian3DSprite.prototype._updateFacing = function() {
        if (!this._element) return;
        if (this.facing === 'left') {
            this._element.style.transform = this._element.style.transform.replace(/scaleX\(-?\d*\.?\d+\)/g, '');
            this._element.style.transform += ' scaleX(-1)';
        } else {
            this._element.style.transform = this._element.style.transform.replace(/\s*scaleX\(-?\d*\.?\d+\)/g, '');
        }
    };

    Nian3DSprite.prototype.update = function(deltaTime) {
        if (this._moveAnimating) {
            this._moveElapsed += deltaTime;
            var progress = this._moveElapsed / this._moveDuration;

            if (progress >= 1) {
                progress = 1;
                this._moveAnimating = false;
                this.x = this._moveTargetX;
                this.y = this._moveTargetY;
                this._updatePosition();
                if (this._moveCallback) {
                    var cb = this._moveCallback;
                    this._moveCallback = null;
                    cb();
                }
            } else {
                var easedProgress = easeInOutCubic(progress);
                this.x = this._moveStartX + (this._moveTargetX - this._moveStartX) * easedProgress;
                this.y = this._moveStartY + (this._moveTargetY - this._moveStartY) * easedProgress;
                this._updatePosition();
            }
        }

        this._stateTime += deltaTime * 0.001;
        this._blinkTimer += deltaTime;

        if (this._blinkTimer > 3000 && !this._isBlinking) {
            this._isBlinking = true;
            this._blinkTimer = 0;
        }
        if (this._isBlinking) {
            if (this._blinkTimer > 150) {
                this._isBlinking = false;
                this._blinkTimer = 0;
            }
        }

        this._updateStateAnimation(deltaTime);

        for (var i = 0; i < this._updateCallbacks.length; i++) {
            this._updateCallbacks[i](deltaTime, this);
        }
    };

    Nian3DSprite.prototype._updateStateAnimation = function(deltaTime) {
        if (!this._threeReady || !this._characterGroup) return;

        var t = this._stateTime;
        var state = this.currentState;

        var breathe = Math.sin(t * 1.8) * 0.02;
        var float = Math.sin(t * 1.0) * 0.015;
        var baseY = -0.3;
        var bodyBob = 0;
        var headTilt = 0;
        var headRotY = Math.sin(t * 0.5) * 0.04;
        var headRotZ = 0;
        var leftArmRot = 0;
        var rightArmRot = 0;
        var leftLegRot = 0;
        var rightLegRot = 0;
        var glowIntensity = 0.6;
        var emissiveIntensity = 0.12;

        var blinkProgress = 0;
        if (this._isBlinking && state !== 'sleep') {
            var blinkT = this._blinkTimer / 150;
            blinkProgress = Math.sin(blinkT * Math.PI);
        }

        switch (state) {
            case 'idle':
                bodyBob = breathe + float;
                headRotZ = Math.sin(t * 0.7) * 0.015;
                glowIntensity = 0.55 + Math.sin(t * 2) * 0.15;
                emissiveIntensity = 0.1 + Math.sin(t * 2) * 0.06;
                break;

            case 'walk':
                bodyBob = Math.sin(t * 8) * 0.03;
                leftLegRot = Math.sin(t * 8) * 0.4;
                rightLegRot = -Math.sin(t * 8) * 0.4;
                leftArmRot = -Math.sin(t * 8) * 0.2;
                rightArmRot = Math.sin(t * 8) * 0.2;
                headRotZ = Math.sin(t * 8) * 0.02;
                glowIntensity = 0.6 + Math.sin(t * 4) * 0.1;
                emissiveIntensity = 0.12 + Math.sin(t * 4) * 0.05;
                break;

            case 'happy':
                bodyBob = breathe + float + Math.sin(t * 5) * 0.04;
                headRotZ = Math.sin(t * 3) * 0.05;
                leftArmRot = Math.sin(t * 6) * 0.3 - 0.2;
                rightArmRot = -Math.sin(t * 6) * 0.3 + 0.2;
                glowIntensity = 0.9 + Math.sin(t * 4) * 0.3;
                emissiveIntensity = 0.25 + Math.sin(t * 4) * 0.1;
                break;

            case 'thinking':
                bodyBob = breathe + float * 0.5;
                headTilt = Math.sin(t * 0.8) * 0.08;
                headRotZ = Math.sin(t * 0.6) * 0.06;
                leftArmRot = -0.5 + Math.sin(t * 2) * 0.1;
                glowIntensity = 0.5 + Math.sin(t * 1.5) * 0.1;
                emissiveIntensity = 0.08 + Math.sin(t * 1.5) * 0.04;
                break;

            case 'wave':
                bodyBob = breathe + float;
                rightArmRot = -1.2 + Math.sin(t * 6) * 0.4;
                headRotY = Math.sin(t * 0.5) * 0.06;
                glowIntensity = 0.7 + Math.sin(t * 3) * 0.2;
                emissiveIntensity = 0.15 + Math.sin(t * 3) * 0.08;
                break;

            case 'sleep':
                bodyBob = Math.sin(t * 0.8) * 0.01;
                baseY = -0.4;
                headRotZ = 0.1;
                glowIntensity = 0.2 + Math.sin(t * 0.5) * 0.05;
                emissiveIntensity = 0.03 + Math.sin(t * 0.5) * 0.02;
                blinkProgress = 0.95;
                break;

            case 'work':
                bodyBob = breathe + float * 0.3;
                headRotZ = Math.sin(t * 0.3) * 0.02;
                glowIntensity = 0.8 + Math.sin(t * 3) * 0.25;
                emissiveIntensity = 0.2 + Math.sin(t * 3) * 0.1;
                leftArmRot = -0.3;
                rightArmRot = 0.3;
                break;

            case 'celebrate':
                bodyBob = Math.sin(t * 10) * 0.08;
                headRotZ = Math.sin(t * 8) * 0.08;
                leftArmRot = Math.sin(t * 10) * 0.5 - 0.8;
                rightArmRot = -Math.sin(t * 10) * 0.5 + 0.8;
                glowIntensity = 1.2 + Math.sin(t * 6) * 0.4;
                emissiveIntensity = 0.35 + Math.sin(t * 6) * 0.15;
                this._updateParticles(deltaTime);
                break;

            case 'confused':
                bodyBob = breathe + float * 0.7;
                headTilt = Math.sin(t * 1.2) * 0.1;
                headRotZ = Math.sin(t * 1) * 0.08;
                glowIntensity = 0.5 + Math.sin(t * 2) * 0.15;
                emissiveIntensity = 0.1 + Math.sin(t * 2) * 0.05;
                break;

            case 'point':
                bodyBob = breathe + float * 0.5;
                rightArmRot = -0.9;
                headRotY = 0.15;
                glowIntensity = 0.7 + Math.sin(t * 2.5) * 0.15;
                emissiveIntensity = 0.15 + Math.sin(t * 2.5) * 0.07;
                break;
        }

        this._characterGroup.position.y = baseY + bodyBob;
        this._characterGroup.scale.setScalar(0.8 + breathe * 0.15);

        if (this._headGroup) {
            this._headGroup.rotation.y = headRotY;
            this._headGroup.rotation.z = headRotZ + headTilt;
        }

        if (this._leftArmGroup) {
            this._leftArmGroup.rotation.z = 0.25 + leftArmRot;
        }
        if (this._rightArmGroup) {
            this._rightArmGroup.rotation.z = -0.25 + rightArmRot;
        }

        if (this._leftLegGroup) {
            this._leftLegGroup.rotation.x = leftLegRot;
        }
        if (this._rightLegGroup) {
            this._rightLegGroup.rotation.x = rightLegRot;
        }

        if (this._leftEye && this._rightEye) {
            var eyeScaleY = 1.15 - blinkProgress * 0.95;
            this._leftEye.scale.y = eyeScaleY;
            this._rightEye.scale.y = eyeScaleY;
        }
        if (this._leftShine && this._rightShine) {
            var shineScaleY = 1 - blinkProgress * 0.95;
            this._leftShine.scale.y = shineScaleY;
            this._rightShine.scale.y = shineScaleY;
        }

        if (this._innerGlow) {
            this._innerGlow.intensity = glowIntensity;
        }
        if (this._bulbGlassMat) {
            this._bulbGlassMat.emissiveIntensity = emissiveIntensity;
        }

        if (this._zzzGroup && this._zzzGroup.visible) {
            for (var z = 0; z < this._zzzGroup.children.length; z++) {
                var zMesh = this._zzzGroup.children[z];
                zMesh.position.y = zMesh.userData.baseY + Math.sin(t * 1.5 + z) * 0.03;
                zMesh.material.opacity = 0.6 + Math.sin(t * 2 + z * 0.5) * 0.3;
            }
        }

        if (this._questionGroup && this._questionGroup.visible) {
            this._questionGroup.position.y = 0.7 + Math.sin(t * 2) * 0.05;
            this._questionGroup.rotation.z = Math.sin(t * 1.5) * 0.1;
        }
    };

    Nian3DSprite.prototype._updateParticles = function(deltaTime) {
        if (!this._particles || !this._particleGroup) return;

        var t = this._stateTime;
        var particleCount = this._particles.length;

        for (var i = 0; i < particleCount; i++) {
            var particle = this._particles[i];
            var data = particle.userData;

            if (data.life <= 0 && Math.random() < 0.1) {
                particle.visible = true;
                data.life = 1 + Math.random();
                data.maxLife = data.life;
                particle.position.set(
                    (Math.random() - 0.5) * 0.8,
                    -0.2,
                    (Math.random() - 0.5) * 0.5
                );
                data.velocity.set(
                    (Math.random() - 0.5) * 1.5,
                    1.5 + Math.random() * 1.5,
                    (Math.random() - 0.5) * 1
                );
            }

            if (data.life > 0) {
                var dt = deltaTime * 0.001;
                data.life -= dt;
                data.velocity.y -= 2 * dt;
                particle.position.x += data.velocity.x * dt;
                particle.position.y += data.velocity.y * dt;
                particle.position.z += data.velocity.z * dt;
                particle.material.opacity = Math.max(0, data.life / data.maxLife);
                particle.rotation.x += dt * 3;
                particle.rotation.y += dt * 2;

                if (data.life <= 0) {
                    particle.visible = false;
                }
            }
        }
    };

    Nian3DSprite.prototype.start = function() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();

        if (this._threeReady) {
            this._startRenderLoop();
        }
    };

    Nian3DSprite.prototype._startRenderLoop = function() {
        if (!this._threeReady || this._animationFrameId) return;

        var self = this;
        function loop(currentTime) {
            if (!self._running) return;

            self._deltaTime = currentTime - self._lastTime;
            self._lastTime = currentTime;

            self.update(self._deltaTime);
            self._render();

            self._animationFrameId = requestAnimationFrame(loop);
        }

        this._animationFrameId = requestAnimationFrame(loop);
    };

    Nian3DSprite.prototype._render = function() {
        if (this._renderer && this._scene && this._camera) {
            this._renderer.render(this._scene, this._camera);
        }
    };

    Nian3DSprite.prototype._hideLoading = function() {
        if (this._loadingEl) {
            this._loadingEl.style.opacity = '0';
            var self = this;
            setTimeout(function() {
                if (self._loadingEl && self._loadingEl.parentNode) {
                    self._loadingEl.parentNode.removeChild(self._loadingEl);
                }
                self._loadingEl = null;
            }, 300);
        }
    };

    Nian3DSprite.prototype.setSize = function(width, height) {
        this.width = width || this.width;
        this.height = height || this.height;

        if (this._element) {
            this._element.style.width = this.width + 'px';
            this._element.style.height = this.height + 'px';
        }

        if (this._renderer && this._camera) {
            this._renderer.setSize(this.width, this.height, false);
            this._camera.aspect = this.width / this.height;
            this._camera.updateProjectionMatrix();
        }
    };

    Nian3DSprite.prototype.setPixelRatio = function(ratio) {
        if (this._renderer) {
            this._renderer.setPixelRatio(ratio);
        }
    };

    Nian3DSprite.prototype.pause = function() {
        this._wasRunning = this._running;
        this.stop();
    };

    Nian3DSprite.prototype.resume = function() {
        if (!this._wasRunning) return;
        this._wasRunning = false;
        this.start();
    };

    Nian3DSprite.prototype.is3DReady = function() {
        return this._threeReady;
    };

    Nian3DSprite.prototype.stop = function() {
        this._running = false;
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    };

    Nian3DSprite.prototype.getElement = function() {
        return this._element;
    };

    Nian3DSprite.prototype.attachTo = function(container) {
        if (!this._element) return;
        if (container && this._element.parentNode !== container) {
            container.appendChild(this._element);
        }
    };

    Nian3DSprite.prototype.getCurrentState = function() {
        return this.currentState;
    };

    Nian3DSprite.prototype.isMoving = function() {
        return this._moveAnimating;
    };

    Nian3DSprite.prototype.addUpdateCallback = function(callback) {
        if (typeof callback === 'function' && this._updateCallbacks.indexOf(callback) === -1) {
            this._updateCallbacks.push(callback);
        }
    };

    Nian3DSprite.prototype.removeUpdateCallback = function(callback) {
        var index = this._updateCallbacks.indexOf(callback);
        if (index > -1) {
            this._updateCallbacks.splice(index, 1);
        }
    };

    Nian3DSprite.prototype.destroy = function() {
        this.stop();
        this._updateCallbacks = [];
        this._moveCallback = null;

        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
        this._canvas = null;
        this._loadingEl = null;

        if (this._scene) {
            this._scene.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(function(m) { m.dispose(); });
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            this._scene = null;
        }

        if (this._renderer) {
            this._renderer.dispose();
            this._renderer = null;
        }

        this._camera = null;
        this._characterGroup = null;
        this._headGroup = null;
        this._leftEye = null;
        this._rightEye = null;
        this._leftShine = null;
        this._rightShine = null;
        this._mouthGroup = null;
        this._innerGlow = null;
        this._bulbGlassMat = null;
        this._leftArmGroup = null;
        this._rightArmGroup = null;
        this._leftLegGroup = null;
        this._rightLegGroup = null;
        this._bodyGroup = null;
        this._particles = null;
        this._particleGroup = null;
        this._zzzGroup = null;
        this._questionGroup = null;

        this._initialized = false;
        this._threeReady = false;
    };

    Nian3DSprite.prototype.addToScene = function(scene, layerId) {
        if (!scene || !scene.getLayer) return false;

        var layer = scene.getLayer(layerId);
        if (!layer) return false;

        var el = this.getElement();
        if (el && layer.addElement) {
            layer.addElement(el);
        }

        if (scene.addUpdateCallback) {
            var self = this;
            scene.addUpdateCallback(function(deltaTime) {
                self.update(deltaTime);
            });
        }

        return true;
    };

    return {
        Nian3DSprite: Nian3DSprite,
        STATES: STATE_NAMES.slice(),
        isSupported: checkWebGLSupport,
        create: function(options) {
            return new Nian3DSprite(options);
        }
    };
})();
