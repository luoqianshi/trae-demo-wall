var Nian3DAvatar = (function() {
    'use strict';

    var instances = [];
    var THREE = null;
    var webglSupported = null;

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

    function createAvatar(options) {
        options = options || {};
        var container = options.container;
        var size = options.size || 80;
        var expression = options.expression || 'happy';
        var interactive = options.interactive !== false;
        var autoRotate = options.autoRotate !== false;
        var onClick = options.onClick || null;

        if (!container) {
            console.error('Nian3DAvatar: container is required');
            return null;
        }

        if (!checkWebGLSupport()) {
            console.warn('Nian3DAvatar: WebGL not supported, falling back to SVG');
            return null;
        }

        var instance = {
            container: container,
            size: size,
            expression: expression,
            interactive: interactive,
            autoRotate: autoRotate,
            onClick: onClick,
            renderer: null,
            scene: null,
            camera: null,
            characterGroup: null,
            headGroup: null,
            leftEye: null,
            rightEye: null,
            leftShine: null,
            rightShine: null,
            mouthGroup: null,
            innerGlow: null,
            bulbGlassMat: null,
            animationId: null,
            startTime: Date.now(),
            mouseX: 0,
            mouseY: 0,
            targetRotY: 0,
            targetRotX: 0,
            destroyed: false
        };

        function init() {
            loadTHREE(function(err, three) {
                if (err || instance.destroyed) {
                    if (err) console.error('Nian3DAvatar:', err.message);
                    return;
                }
                THREE = three || window.THREE;
                if (!THREE) {
                    console.error('Nian3DAvatar: THREE is not available');
                    return;
                }

                setupRenderer();
                setupScene();
                setupLights();
                buildCharacter();
                setupInteraction();
                animate();
            });
        }

        function setupRenderer() {
            var canvas = document.createElement('canvas');
            canvas.className = 'nian-3d-avatar-canvas';
            canvas.width = size;
            canvas.height = size;
            container.appendChild(canvas);

            instance.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true,
                premultipliedAlpha: true
            });
            instance.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            instance.renderer.setSize(size, size, false);
            instance.renderer.shadowMap.enabled = true;
            instance.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            instance.renderer.setClearColor(0x000000, 0);
        }

        function setupScene() {
            instance.scene = new THREE.Scene();
            instance.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
            instance.camera.position.set(0, 0, 4.2);
            instance.camera.lookAt(0, 0, 0);
        }

        function setupLights() {
            var ambientLight = new THREE.AmbientLight(0xfff8e8, 0.5);
            instance.scene.add(ambientLight);

            var hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8dcc8, 0.5);
            instance.scene.add(hemiLight);

            var mainLight = new THREE.DirectionalLight(0xfff0d8, 1.1);
            mainLight.position.set(2, 4, 3);
            mainLight.castShadow = true;
            mainLight.shadow.mapSize.width = 512;
            mainLight.shadow.mapSize.height = 512;
            mainLight.shadow.camera.near = 0.5;
            mainLight.shadow.camera.far = 10;
            mainLight.shadow.camera.left = -2;
            mainLight.shadow.camera.right = 2;
            mainLight.shadow.camera.top = 2;
            mainLight.shadow.camera.bottom = -2;
            instance.scene.add(mainLight);

            var fillLight = new THREE.DirectionalLight(0xe8d0b8, 0.3);
            fillLight.position.set(-2, 2, 2);
            instance.scene.add(fillLight);
        }

        function buildCharacter() {
            instance.characterGroup = new THREE.Group();
            instance.characterGroup.position.y = -0.25;
            instance.characterGroup.scale.setScalar(0.85);
            instance.scene.add(instance.characterGroup);

            var bodyMat = new THREE.MeshStandardMaterial({ 
                color: 0xfffaf5, roughness: 0.45, metalness: 0.03 
            });
            var scarfMat = new THREE.MeshStandardMaterial({ 
                color: 0xf5ede0, roughness: 0.85, metalness: 0 
            });
            var bulbGlassMat = new THREE.MeshPhysicalMaterial({
                color: 0xfaf8f0, roughness: 0.08, metalness: 0,
                transparent: true, opacity: 0.92,
                emissive: 0xeef4ff, emissiveIntensity: 0.18,
                reflectivity: 0.6
            });
            instance.bulbGlassMat = bulbGlassMat;
            var filamentMat = new THREE.MeshStandardMaterial({
                color: 0xfff0c8, emissive: 0xffd080, emissiveIntensity: 1.5, roughness: 0.3
            });
            var baseMat = new THREE.MeshStandardMaterial({ 
                color: 0xc8b898, roughness: 0.5, metalness: 0.3 
            });
            var eyeMat = new THREE.MeshStandardMaterial({ 
                color: 0x3a4a5a, roughness: 0.25, metalness: 0.1 
            });
            var eyeShineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            var blushMat = new THREE.MeshStandardMaterial({
                color: 0xd8a8b0, transparent: true, opacity: 0.4, roughness: 1
            });
            var mouthMat = new THREE.MeshStandardMaterial({ 
                color: 0x8a7a6a, roughness: 0.5 
            });
            var wireMat = new THREE.MeshStandardMaterial({ 
                color: 0x999999, metalness: 0.8, roughness: 0.3 
            });

            var bodyGeo = new THREE.SphereGeometry(0.5, 24, 24);
            bodyGeo.scale(1, 0.85, 0.9);
            var body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = -0.3;
            body.castShadow = true;
            instance.characterGroup.add(body);

            var scarfGeo = new THREE.TorusGeometry(0.48, 0.12, 12, 32);
            var scarf = new THREE.Mesh(scarfGeo, scarfMat);
            scarf.position.y = 0.05;
            scarf.rotation.x = Math.PI / 2.2;
            scarf.castShadow = true;
            instance.characterGroup.add(scarf);

            var scarfKnotGeo = new THREE.SphereGeometry(0.15, 12, 12);
            var scarfKnot = new THREE.Mesh(scarfKnotGeo, scarfMat);
            scarfKnot.position.set(0, -0.02, 0.42);
            scarfKnot.scale.set(1, 0.7, 0.8);
            scarfKnot.castShadow = true;
            instance.characterGroup.add(scarfKnot);

            instance.headGroup = new THREE.Group();
            instance.headGroup.position.y = 0.55;
            instance.characterGroup.add(instance.headGroup);

            var bulbGeo = new THREE.SphereGeometry(0.55, 32, 32);
            var bulb = new THREE.Mesh(bulbGeo, bulbGlassMat);
            bulb.castShadow = true;
            instance.headGroup.add(bulb);

            var bulbBottomGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.15, 24);
            var bulbBottom = new THREE.Mesh(bulbBottomGeo, baseMat);
            bulbBottom.position.y = -0.48;
            bulbBottom.castShadow = true;
            instance.headGroup.add(bulbBottom);

            for (var i = 0; i < 3; i++) {
                var threadGeo = new THREE.TorusGeometry(0.32 - i * 0.015, 0.012, 6, 32);
                var thread = new THREE.Mesh(threadGeo, baseMat);
                thread.position.y = -0.42 + i * 0.035;
                thread.rotation.x = Math.PI / 2;
                instance.headGroup.add(thread);
            }

            var wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), wireMat);
            wire1.position.set(-0.06, 0, 0);
            instance.headGroup.add(wire1);
            var wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), wireMat);
            wire2.position.set(0.06, 0, 0);
            instance.headGroup.add(wire2);

            var filamentCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.06, 0.1, 0),
                new THREE.Vector3(-0.04, 0.2, -0.02),
                new THREE.Vector3(0, 0.25, 0.02),
                new THREE.Vector3(0.04, 0.2, -0.02),
                new THREE.Vector3(0.06, 0.1, 0)
            ]);
            var filamentGeo = new THREE.TubeGeometry(filamentCurve, 16, 0.012, 6, false);
            var filament = new THREE.Mesh(filamentGeo, filamentMat);
            filament.position.y = 0;
            instance.headGroup.add(filament);

            instance.innerGlow = new THREE.PointLight(0xffd080, 0.8, 2, 2);
            instance.innerGlow.position.y = 0.1;
            instance.headGroup.add(instance.innerGlow);

            instance.leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), eyeMat);
            instance.leftEye.scale.set(1.05, 1.15, 1);
            instance.leftEye.position.set(-0.18, 0.01, 0.48);
            instance.headGroup.add(instance.leftEye);
            instance.rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), eyeMat);
            instance.rightEye.scale.set(1.05, 1.15, 1);
            instance.rightEye.position.set(0.18, 0.01, 0.48);
            instance.headGroup.add(instance.rightEye);

            instance.leftShine = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), eyeShineMat);
            instance.leftShine.position.set(-0.16, 0.04, 0.54);
            instance.headGroup.add(instance.leftShine);
            instance.rightShine = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), eyeShineMat);
            instance.rightShine.position.set(0.20, 0.04, 0.54);
            instance.headGroup.add(instance.rightShine);

            var leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), blushMat);
            leftBlush.position.set(-0.28, -0.09, 0.45);
            leftBlush.rotation.y = -0.5;
            instance.headGroup.add(leftBlush);
            var rightBlush = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), blushMat);
            rightBlush.position.set(0.28, -0.09, 0.45);
            rightBlush.rotation.y = 0.5;
            instance.headGroup.add(rightBlush);

            instance.mouthGroup = new THREE.Group();
            instance.mouthGroup.position.set(0, -0.18, 0.5);
            instance.headGroup.add(instance.mouthGroup);
            updateMouth(expression);

            var armGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.3, 12);
            var shoulderGeo = new THREE.SphereGeometry(0.065, 12, 12);
            
            var leftShoulder = new THREE.Mesh(shoulderGeo, bodyMat);
            leftShoulder.position.set(-0.5, -0.18, 0);
            leftShoulder.castShadow = true;
            instance.characterGroup.add(leftShoulder);
            
            var leftArm = new THREE.Mesh(armGeo, bodyMat);
            leftArm.position.set(-0.55, -0.35, 0);
            leftArm.rotation.z = 0.3;
            leftArm.castShadow = true;
            instance.characterGroup.add(leftArm);
            
            var rightShoulder = new THREE.Mesh(shoulderGeo, bodyMat);
            rightShoulder.position.set(0.5, -0.18, 0);
            rightShoulder.castShadow = true;
            instance.characterGroup.add(rightShoulder);
            
            var rightArm = new THREE.Mesh(armGeo, bodyMat);
            rightArm.position.set(0.55, -0.35, 0);
            rightArm.rotation.z = -0.3;
            rightArm.castShadow = true;
            instance.characterGroup.add(rightArm);

            var handGeo = new THREE.SphereGeometry(0.07, 12, 12);
            var leftHand = new THREE.Mesh(handGeo, bodyMat);
            leftHand.position.set(-0.65, -0.52, 0);
            leftHand.castShadow = true;
            instance.characterGroup.add(leftHand);
            var rightHand = new THREE.Mesh(handGeo, bodyMat);
            rightHand.position.set(0.65, -0.52, 0);
            rightHand.castShadow = true;
            instance.characterGroup.add(rightHand);
        }

        function updateMouth(expr) {
            if (!instance.mouthGroup || !instance.mouthGroup.parent) return;
            if (!THREE) return;

            while (instance.mouthGroup.children.length > 0) {
                instance.mouthGroup.remove(instance.mouthGroup.children[0]);
            }

            var mouthMat = new THREE.MeshStandardMaterial({ 
                color: 0x8a7a6a, roughness: 0.5 
            });

            if (expr === 'happy') {
                instance.mouthGroup.scale.set(1.1, 1.1, 1);
                var smileShape = new THREE.Shape();
                smileShape.moveTo(-0.045, 0.01);
                smileShape.quadraticCurveTo(0, -0.04, 0.045, 0.01);
                smileShape.quadraticCurveTo(0, -0.01, -0.045, 0.01);
                var smileGeo = new THREE.ShapeGeometry(smileShape);
                var smile = new THREE.Mesh(smileGeo, mouthMat);
                smile.position.z = 0.001;
                instance.mouthGroup.add(smile);
            } else if (expr === 'confused') {
                instance.mouthGroup.scale.set(0.9, 0.9, 1);
                var oGeo = new THREE.CircleGeometry(0.03, 16);
                var oMouth = new THREE.Mesh(oGeo, mouthMat);
                oMouth.position.z = 0.001;
                instance.mouthGroup.add(oMouth);
            } else if (expr === 'nervous') {
                instance.mouthGroup.scale.set(0.85, 0.85, 1);
                var lineGeo = new THREE.PlaneGeometry(0.05, 0.008);
                var lineMouth = new THREE.Mesh(lineGeo, mouthMat);
                lineMouth.position.z = 0.001;
                lineMouth.position.y = -0.005;
                instance.mouthGroup.add(lineMouth);
            } else {
                instance.mouthGroup.scale.set(1, 1, 1);
                var defaultGeo = new THREE.CircleGeometry(0.025, 16);
                var defaultMouth = new THREE.Mesh(defaultGeo, mouthMat);
                defaultMouth.position.z = 0.001;
                instance.mouthGroup.add(defaultMouth);
            }
        }

        function setupInteraction() {
            if (!interactive) return;

            var canvas = instance.renderer.domElement;
            canvas.style.cursor = 'pointer';

            canvas.addEventListener('mousemove', function(e) {
                var rect = canvas.getBoundingClientRect();
                instance.mouseX = ((e.clientX - rect.left) / size - 0.5) * 2;
                instance.mouseY = ((e.clientY - rect.top) / size - 0.5) * 2;
                instance.targetRotY = instance.mouseX * 0.4;
                instance.targetRotX = -instance.mouseY * 0.2;
            });

            canvas.addEventListener('mouseleave', function() {
                instance.targetRotY = 0;
                instance.targetRotX = 0;
            });

            canvas.addEventListener('click', function(e) {
                if (typeof instance.onClick === 'function') {
                    instance.onClick(e);
                }
            });
        }

        function animate() {
            if (instance.destroyed) return;
            instance.animationId = requestAnimationFrame(animate);

            var t = (Date.now() - instance.startTime) * 0.001;

            var breathe = Math.sin(t * 1.8) * 0.025;
            var float = Math.sin(t * 1.0) * 0.02;
            instance.characterGroup.position.y = -0.25 + breathe + float;
            instance.characterGroup.scale.setScalar(0.85 + breathe * 0.2);

            if (autoRotate && !interactive) {
                instance.characterGroup.rotation.y = Math.sin(t * 0.3) * 0.15;
            } else {
                instance.characterGroup.rotation.y += (instance.targetRotY - instance.characterGroup.rotation.y) * 0.08;
                instance.characterGroup.rotation.x += (instance.targetRotX - instance.characterGroup.rotation.x) * 0.08;
            }

            instance.headGroup.rotation.y = Math.sin(t * 0.5) * 0.06;
            instance.headGroup.rotation.z = Math.sin(t * 0.7) * 0.02;

            var blinkCycle = t % 4;
            var blinkDur = blinkCycle > 2.8 && blinkCycle < 2.95 ?
                Math.sin((blinkCycle - 2.8) / 0.15 * Math.PI) : 0;
            var eyeScaleY = 1.15 - blinkDur * 0.9;
            if (instance.leftEye) {
                instance.leftEye.scale.y = eyeScaleY;
                instance.rightEye.scale.y = eyeScaleY;
            }
            if (instance.leftShine) {
                instance.leftShine.scale.y = 1 - blinkDur * 0.9;
                instance.rightShine.scale.y = 1 - blinkDur * 0.9;
            }

            if (instance.innerGlow) {
                instance.innerGlow.intensity = 0.6 + Math.sin(t * 2) * 0.2;
            }
            if (instance.bulbGlassMat) {
                instance.bulbGlassMat.emissiveIntensity = 0.12 + Math.sin(t * 2) * 0.08;
            }

            if (instance.renderer && instance.scene && instance.camera) {
                instance.renderer.render(instance.scene, instance.camera);
            }
        }

        function setExpression(expr) {
            instance.expression = expr;
            updateMouth(expr);
        }

        function setSize(newSize) {
            instance.size = newSize;
            if (instance.renderer) {
                instance.renderer.setSize(newSize, newSize, false);
            }
            if (instance.camera) {
                instance.camera.aspect = 1;
                instance.camera.updateProjectionMatrix();
            }
        }

        function destroy() {
            instance.destroyed = true;
            if (instance.animationId) {
                cancelAnimationFrame(instance.animationId);
                instance.animationId = null;
            }
            if (instance.renderer) {
                instance.renderer.dispose();
                instance.renderer = null;
            }
            if (instance.scene) {
                instance.scene.traverse(function(obj) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(function(m) { m.dispose(); });
                        } else {
                            obj.material.dispose();
                        }
                    }
                });
                instance.scene = null;
            }
            var idx = instances.indexOf(instance);
            if (idx > -1) instances.splice(idx, 1);
        }

        init();
        instances.push(instance);

        return {
            setExpression: setExpression,
            setSize: setSize,
            setOnClick: function(fn) { instance.onClick = fn; },
            destroy: destroy,
            getElement: function() { return instance.renderer ? instance.renderer.domElement : null; }
        };
    }

    return {
        create: createAvatar,
        isSupported: checkWebGLSupport
    };
})();
