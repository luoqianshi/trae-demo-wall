// === Three.js 3D Earth Scene ===
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var scene, camera, renderer, controls;
var earth, atmosphere, stars, flightArc;
var flightDot = null;
var itineraryGroup = null;
var clock = new THREE.Clock();
var isVisible = true;
var spectrumData = [];

// === CITIES with lat/lon ===
var cities = {
  '北京': [39.9042, 116.4074],
  '上海': [31.2304, 121.4737],
  '成都': [30.5728, 104.0668],
  '西安': [34.3416, 108.9398],
  '杭州': [30.2741, 120.1551],
  '重庆': [29.5630, 106.5516],
  '厦门': [24.4798, 118.0894],
  '青岛': [36.0671, 120.3826],
  '三亚': [18.2528, 109.5120],
  '哈尔滨': [45.8038, 126.5350],
  '大理': [25.6065, 100.2676],
  '丽江': [26.8721, 100.2295],
  '拉萨': [29.6500, 91.1000],
  '桂林': [25.2736, 110.2900],
  '张家界': [29.1171, 110.4792],
  '武汉': [30.5928, 114.3055],
  '南京': [32.0603, 118.7969],
  '长沙': [28.2282, 112.9388],
  '苏州': [31.2989, 120.5853],
  '昆明': [25.0389, 102.7183]
};

function latLonToVector3(lat, lon, radius) {
  var phi = (90 - lat) * (Math.PI / 180);
  var theta = (lon + 180) * (Math.PI / 180);
  var x = -(radius * Math.sin(phi) * Math.cos(theta));
  var z = radius * Math.sin(phi) * Math.sin(theta);
  var y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function init() {
  var container = document.getElementById('threeContainer');
  if (!container) return;

  // Scene
  scene = new THREE.Scene();

  // Lighting for Phong material
  var ambientLight = new THREE.AmbientLight(0x6688cc, 0.6);
  scene.add(ambientLight);

  var sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);

  var rimLight = new THREE.DirectionalLight(0x4488ff, 0.4);
  rimLight.position.set(-5, 0, -5);
  scene.add(rimLight);

  // Camera
  var aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
  camera.position.set(0, 0, 18);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.minPolarAngle = Math.PI * 0.3;
  controls.maxPolarAngle = Math.PI * 0.7;

  // Earth
  createEarth();

  // Atmosphere
  createAtmosphere();

  // Stars
  createStars();

  // Resize
  window.addEventListener('resize', onResize);

  // Visibility observer
  var observer = new IntersectionObserver(function(entries) {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0 });
  observer.observe(container);

  animate();
}

function createEarth() {
  var geometry = new THREE.SphereGeometry(5, 128, 128);

  var loader = new THREE.TextureLoader();

  // Realistic earth with NASA texture + normal map + specular map
  var material = new THREE.MeshPhongMaterial({
    map: loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'),
    bumpMap: loader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg'),
    bumpScale: 0.05,
    specularMap: loader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'),
    specular: new THREE.Color(0x333333),
    shininess: 25
  });

  earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  // Cloud layer
  var cloudGeo = new THREE.SphereGeometry(5.02, 64, 64);
  var cloudMat = new THREE.MeshPhongMaterial({
    map: loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png'),
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var clouds = new THREE.Mesh(cloudGeo, cloudMat);
  earth.add(clouds);
}

function createAtmosphere() {
  var geometry = new THREE.SphereGeometry(5.15, 64, 64);
  var material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#06b6d4') }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(uColor, intensity * 0.8);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  atmosphere = new THREE.Mesh(geometry, material);
  scene.add(atmosphere);
}

function createStars() {
  var count = 15000;
  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var sizes = new Float32Array(count);

  for (var i = 0; i < count; i++) {
    var r = 50 + Math.random() * 100;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    var colorChoice = Math.random();
    if (colorChoice < 0.4) {
      colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0; // Blue
    } else if (colorChoice < 0.7) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.6; // Warm
    } else {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0; // White
    }

    sizes[i] = Math.random() * 2 + 0.5;
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  var material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pulse = sin(uTime * 2.0 + position.x * 0.1) * 0.3 + 0.7;
        gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

export function createFlightArc(fromCity, toCity) {
  if (!earth) return;
  if (flightArc) {
    earth.remove(flightArc);
    flightArc.geometry.dispose();
    flightArc.material.dispose();
    flightArc = null;
  }
  if (flightDot) {
    earth.remove(flightDot);
    flightDot = null;
  }

  var fromCoords = cities[fromCity];
  var toCoords = cities[toCity];
  if (!fromCoords || !toCoords) return;

  var start = latLonToVector3(fromCoords[0], fromCoords[1], 5.05);
  var end = latLonToVector3(toCoords[0], toCoords[1], 5.05);
  var mid = start.clone().add(end).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(5.05 + start.distanceTo(end) * 0.4);

  var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  var tubeGeo = new THREE.TubeGeometry(curve, 64, 0.03, 8, false);
  var tubeMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#f59e0b') }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float flow = fract(vUv.x - uTime * 0.5);
        float glow = exp(-pow(flow - 0.5, 2.0) * 20.0);
        gl_FragColor = vec4(uColor, glow * 0.9 + 0.1);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  flightArc = new THREE.Mesh(tubeGeo, tubeMat);
  earth.add(flightArc);

  // Flight dot
  var dotGeo = new THREE.SphereGeometry(0.08, 16, 16);
  var dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  flightDot = new THREE.Mesh(dotGeo, dotMat);
  earth.add(flightDot);

  // Animate dot along curve
  var progress = 0;
  function animateDot() {
    if (!flightDot) return;
    progress += 0.003;
    if (progress > 1) progress = 0;
    var pos = curve.getPointAt(progress);
    flightDot.position.copy(pos);
    requestAnimationFrame(animateDot);
  }
  animateDot();
}

export function updateSpectrum(spectrum) {
  spectrumData = spectrum;
}

function onResize() {
  var container = document.getElementById('threeContainer');
  if (!container || !camera || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (!isVisible || !renderer) return;

  var elapsed = clock.getElapsedTime();

  if (earth) {
    earth.rotation.y = elapsed * 0.02;
  }

  if (atmosphere) {
    atmosphere.rotation.y = elapsed * 0.02;
  }

  if (stars) {
    stars.material.uniforms.uTime.value = elapsed;
    stars.rotation.y = elapsed * 0.005;
  }

  if (flightArc) {
    flightArc.material.uniforms.uTime.value = elapsed;
  }

  // Spectrum-reactive effects
  if (spectrumData.length > 0 && earth) {
    var bass = spectrumData.slice(0, 20).reduce(function(a, b) { return a + b; }, 0) / 20;
    var treble = spectrumData.slice(60, 100).reduce(function(a, b) { return a + b; }, 0) / 40;
    earth.scale.setScalar(1 + bass * 0.02);
    if (atmosphere) {
      atmosphere.scale.setScalar(1 + treble * 0.01);
    }
  }

  if (controls) controls.update();
  renderer.render(scene, camera);
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ==================== ITINERARY ROUTE ON GLOBE ====================
// Draw polygon ring: fromCity -> destinations[0] -> ... -> destinations[n-1] -> fromCity
export function drawItineraryRoute(destinations, fromCity) {
  if (!earth) return;

  // Clear previous itinerary
  if (itineraryGroup) {
    earth.remove(itineraryGroup);
    itineraryGroup.traverse(function(child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    itineraryGroup = null;
  }

  itineraryGroup = new THREE.Group();
  var segmentColors = ['#f59e0b', '#06b6d4', '#a855f7', '#10b981', '#ef4444', '#ec4899', '#f97316'];

  // Build full route: fromCity -> all destinations -> fromCity
  var route = [fromCity].concat(destinations).concat([fromCity]);

  for (var i = 0; i < route.length - 1; i++) {
    var cityA = route[i];
    var cityB = route[i + 1];
    var color = segmentColors[i % segmentColors.length];
    var colorObj = new THREE.Color(color);
    var isReturn = (i === route.length - 2);

    // Get coordinates for both cities
    var coordsA = getCityCoords(cityA);
    var coordsB = getCityCoords(cityB);

    if (!coordsA || !coordsB) continue;

    var from = latLonToVector3(coordsA[0], coordsA[1], 5.05);
    var to = latLonToVector3(coordsB[0], coordsB[1], 5.05);

    // Arc height: higher for longer distances, lower for short hops
    var dist = from.distanceTo(to);
    var arcHeight = Math.max(0.08, dist * 1.2);
    var mid = from.clone().add(to).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(5.05 + arcHeight);

    var curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    var tubeRadius = isReturn ? 0.012 : 0.02;
    var tubeGeo = new THREE.TubeGeometry(curve, 48, tubeRadius, 8, false);
    var tubeMat = new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: isReturn ? 0.5 : 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var arcMesh = new THREE.Mesh(tubeGeo, tubeMat);
    itineraryGroup.add(arcMesh);

    // Pulsing dot animation along the arc (dashed effect with small spheres)
    var numDots = Math.floor(dist * 8);
    for (var j = 0; j < numDots; j++) {
      var t = j / numDots;
      var pt = curve.getPointAt(t);
      var dotGeo = new THREE.SphereGeometry(0.025, 6, 6);
      var dotMat = new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0.3 + 0.4 * Math.abs(Math.sin(t * Math.PI * 3)),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      var dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pt);
      itineraryGroup.add(dot);
    }

    // City marker at point B (not for the final return to avoid duplicate)
    if (!isReturn) {
      addCityMarker(to.clone().normalize().multiplyScalar(5.06), cityB, colorObj);
    }
  }

  // Also add a marker for fromCity
  var fromCoords = getCityCoords(fromCity);
  if (fromCoords) {
    var fromPos = latLonToVector3(fromCoords[0], fromCoords[1], 5.06);
    addCityMarker(fromPos, fromCity, new THREE.Color('#f59e0b'));
  }

  earth.add(itineraryGroup);
}

// Helper: get city coordinates from the cities data
function getCityCoords(cityName) {
  // Try exact match first
  if (cities[cityName]) return cities[cityName];
  // Try case-insensitive
  var keys = Object.keys(cities);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.toLowerCase() === cityName.toLowerCase()) return cities[key];
    var info = cities[key];
    if (info && info[2] && info[2].toLowerCase() === cityName.toLowerCase()) return [info[0], info[1]];
  }
  // Try partial match
  for (var k = 0; k < keys.length; k++) {
    var key2 = keys[k];
    if (key2.indexOf(cityName) !== -1 || cityName.indexOf(key2) !== -1) return cities[key2];
  }
  return null;
}

function addCityMarker(pos, label, colorObj) {
  // Glow marker
  var markerGeo = new THREE.SphereGeometry(0.06, 16, 16);
  var markerMat = new THREE.MeshBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  var marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.copy(pos);
  itineraryGroup.add(marker);

  // Outer ring
  var ringGeo = new THREE.RingGeometry(0.07, 0.1, 24);
  var ringMat = new THREE.MeshBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos.clone().normalize().multiplyScalar(5.061));
  ring.lookAt(new THREE.Vector3(0, 0, 0));
  itineraryGroup.add(ring);

  // Label sprite
  var canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  var ctx = canvas.getContext('2d');
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#' + colorObj.getHexString();
  ctx.textAlign = 'center';
  ctx.fillText(label, 64, 30);
  var tex = new THREE.CanvasTexture(canvas);
  var spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  var sprite = new THREE.Sprite(spriteMat);
  sprite.position.copy(pos.clone().normalize().multiplyScalar(5.2));
  sprite.scale.set(0.35, 0.13, 1);
  itineraryGroup.add(sprite);
}

// Expose to global for non-module scripts
window.createFlightArc = createFlightArc;
window.updateThreeSpectrum = updateSpectrum;
window.drawItineraryRoute = drawItineraryRoute;
