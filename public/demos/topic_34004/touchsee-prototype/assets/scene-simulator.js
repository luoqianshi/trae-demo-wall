// ============================================================
// TouchSee Scene Simulator — 场景模拟器交互模块
// ============================================================
(function (global) {
  'use strict';

  var Engine = global.TouchSee && global.TouchSee.Engine;
  var Scenes = global.TouchSee && global.TouchSee.Scenes;
  var Audio = global.TouchSee && global.TouchSee.Audio;
  if (!Engine || !Scenes) { console.error('[TouchSee] Dependencies not loaded'); return; }

  var state = {
    currentScene: 0,
    currentTime: 0,
    playing: false,
    speed: 1,
    viewMode: 'detection',
    lastFrameTime: 0,
    logThrottle: 0,
    activeObstacleIds: {},
    soundEnabled: false,
  };

  var elements = {};
  var canvas, ctx;
  var bodyContainer;

  function init() {
    // Cache elements
    elements.sceneTabs = document.getElementById('scene-tabs');
    elements.canvas = document.getElementById('scene-canvas');
    elements.bodyContainer = document.getElementById('sim-body-container');
    elements.log = document.getElementById('detection-log');
    elements.playBtn = document.getElementById('tl-play');
    elements.resetBtn = document.getElementById('tl-reset');
    elements.progress = document.getElementById('tl-progress');
    elements.fill = document.getElementById('tl-fill');
    elements.timeDisplay = document.getElementById('tl-time');
    elements.speedSelect = document.getElementById('tl-speed');
    elements.viewModeBtns = document.getElementById('view-mode-btns');
    elements.soundToggle = document.getElementById('sim-sound-toggle');

    canvas = elements.canvas;
    ctx = canvas.getContext('2d');
    bodyContainer = elements.bodyContainer;

    if (!canvas || !bodyContainer) return;

    // Render scene tabs
    renderSceneTabs();

    // Render body model (front view for simulator)
    bodyContainer.innerHTML = Engine.createBodySVG('front', 140);

    // Bind events
    bindEvents();

    // Draw initial scene
    drawScene(0);
  }

  function renderSceneTabs() {
    var html = [];
    for (var i = 0; i < Scenes.SCENES.length; i++) {
      var s = Scenes.SCENES[i];
      html.push('<button class="scene-tab' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' + s.name + '</button>');
    }
    elements.sceneTabs.innerHTML = html.join('');

    var tabs = elements.sceneTabs.querySelectorAll('.scene-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        selectScene(idx);
      });
    }
  }

  function selectScene(idx) {
    state.currentScene = idx;
    state.currentTime = 0;
    state.playing = false;
    state.activeObstacleIds = {};

    // Stop audio
    if (Audio) Audio.stopAll();

    // Update tabs
    var tabs = elements.sceneTabs.querySelectorAll('.scene-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', i === idx);
    }

    // Reset UI
    elements.playBtn.textContent = '▶';
    elements.fill.style.width = '0%';
    elements.timeDisplay.textContent = '0.0s';
    elements.log.innerHTML = '<div class="log-entry"><span class="time">[场景切换]</span> ' + Scenes.SCENES[idx].name + ' — ' + Scenes.SCENES[idx].description + '</div>';

    // Clear body model
    Engine.clearAllMotors(bodyContainer);

    // Draw scene
    drawScene(0);
  }

  function bindEvents() {
    // Play/Pause
    elements.playBtn.addEventListener('click', function () {
      if (state.playing) {
        pause();
      } else {
        play();
      }
    });

    // Reset
    elements.resetBtn.addEventListener('click', function () {
      state.currentTime = 0;
      state.playing = false;
      state.activeObstacleIds = {};
      if (Audio) Audio.stopAll();
      elements.playBtn.textContent = '▶';
      elements.fill.style.width = '0%';
      elements.timeDisplay.textContent = '0.0s';
      Engine.clearAllMotors(bodyContainer);
      drawScene(0);
    });

    // Speed
    elements.speedSelect.addEventListener('change', function () {
      state.speed = parseFloat(this.value);
    });

    // Sound toggle
    if (elements.soundToggle) {
      elements.soundToggle.addEventListener('click', function () {
        state.soundEnabled = !state.soundEnabled;
        if (Audio) {
          Audio.setEnabled(state.soundEnabled);
        }
        elements.soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
        elements.soundToggle.classList.toggle('active', state.soundEnabled);
        if (!state.soundEnabled && Audio) {
          Audio.stopAll();
        }
      });
    }

    // Timeline click/seek
    elements.progress.addEventListener('click', function (e) {
      var rect = elements.progress.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width;
      var scene = Scenes.SCENES[state.currentScene];
      state.currentTime = ratio * scene.duration;
      drawScene(state.currentTime);
      updateTimeline();
    });

    // View mode
    var modeBtns = elements.viewModeBtns.querySelectorAll('.view-mode-btn');
    for (var i = 0; i < modeBtns.length; i++) {
      modeBtns[i].addEventListener('click', function () {
        state.viewMode = this.getAttribute('data-mode');
        for (var j = 0; j < modeBtns.length; j++) {
          modeBtns[j].classList.remove('active');
        }
        this.classList.add('active');
        drawScene(state.currentTime);
      });
    }
  }

  function play() {
    state.playing = true;
    state.lastFrameTime = 0;
    elements.playBtn.textContent = '❚❚';
    requestAnimationFrame(loop);
  }

  function pause() {
    state.playing = false;
    elements.playBtn.textContent = '▶';
    if (Audio) Audio.stopAll();
  }

  function loop(ts) {
    if (!state.playing) return;

    if (state.lastFrameTime === 0) state.lastFrameTime = ts;
    var delta = (ts - state.lastFrameTime) / 1000; // seconds
    state.lastFrameTime = ts;

    var scene = Scenes.SCENES[state.currentScene];
    state.currentTime += delta * state.speed;

    if (state.currentTime >= scene.duration) {
      state.currentTime = scene.duration;
      pause();
    }

    drawScene(state.currentTime);
    updateTimeline();
    updateLog(state.currentTime);

    if (state.playing) {
      requestAnimationFrame(loop);
    }
  }

  function updateTimeline() {
    var scene = Scenes.SCENES[state.currentScene];
    var pct = (state.currentTime / scene.duration) * 100;
    elements.fill.style.width = pct + '%';
    elements.timeDisplay.textContent = state.currentTime.toFixed(1) + 's';
  }

  // ====== Canvas Rendering ======
  function drawScene(t) {
    var scene = Scenes.SCENES[state.currentScene];
    var w = canvas.width;
    var h = canvas.height;

    // Background
    ctx.fillStyle = scene.bgColor || '#050D1A';
    ctx.fillRect(0, 0, w, h);

    // Ground plane (perspective)
    drawGround(w, h, scene);

    // Sky gradient
    var grad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    grad.addColorStop(0, scene.bgColor || '#050D1A');
    grad.addColorStop(1, 'rgba(30,58,95,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h * 0.5);

    // Grid lines on ground (perspective)
    drawPerspectiveGrid(w, h, scene);

    // Get active obstacles at time t
    var activeObstacles = [];
    for (var i = 0; i < scene.obstacles.length; i++) {
      var obs = scene.obstacles[i];
      var traj = Engine.interpolateTrajectory(obs.trajectory, t);
      if (traj && t >= obs.trajectory[0].t && t <= obs.trajectory[obs.trajectory.length - 1].t + 0.5) {
        activeObstacles.push({
          id: obs.id,
          type: obs.type,
          label: obs.label,
          azimuth: traj.azimuth,
          elevation: traj.elevation,
          distance: traj.distance,
          confidence: traj.confidence,
        });
      }
    }

    // Sort by distance (far to near for proper rendering)
    activeObstacles.sort(function (a, b) { return b.distance - a.distance; });

    // Draw obstacles
    for (var i = 0; i < activeObstacles.length; i++) {
      drawObstacle(activeObstacles[i], w, h);
    }

    // Draw depth heatmap overlay
    if (state.viewMode === 'depth') {
      drawDepthOverlay(activeObstacles, w, h);
    }

    // Draw HUD
    drawHUD(w, h, scene, t, activeObstacles);

    // Update haptic engine
    if (activeObstacles.length > 0) {
      var motorStates = Engine.resolveHaptics(activeObstacles);
      Engine.updateMotorStates(bodyContainer, motorStates, 'front');
    } else {
      Engine.clearAllMotors(bodyContainer);
    }

    // Update audio engine (dual-safety sound alert)
    if (state.soundEnabled && Audio) {
      if (activeObstacles.length > 0) {
        Audio.playAlert(activeObstacles);
      } else {
        Audio.stopAll();
      }
    }
  }

  function drawGround(w, h, scene) {
    ctx.fillStyle = scene.groundColor || '#0A1020';
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Horizon line
    ctx.strokeStyle = 'rgba(0,212,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
  }

  function drawPerspectiveGrid(w, h, scene) {
    ctx.strokeStyle = 'rgba(30,58,95,0.4)';
    ctx.lineWidth = 1;

    // Vertical lines (converging to center)
    var vanishX = w / 2;
    var vanishY = h * 0.5;
    for (var i = -4; i <= 4; i++) {
      var xBottom = w / 2 + i * (w / 8);
      ctx.beginPath();
      ctx.moveTo(xBottom, h);
      ctx.lineTo(vanishX, vanishY);
      ctx.stroke();
    }

    // Horizontal lines (perspective)
    for (var j = 1; j <= 5; j++) {
      var y = vanishY + (h - vanishY) * (j / 5) * (j / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawObstacle(obs, w, h) {
    // Map azimuth (-90 to +90) to x position
    var azClamped = Math.max(-90, Math.min(90, obs.azimuth));
    var x = w / 2 + (azClamped / 90) * (w / 2.2);

    // Map distance to size (closer = bigger)
    var sizeScale = Math.max(0.3, Math.min(2.5, 4 / obs.distance));

    // Map elevation to y offset (positive = up)
    var elevOffset = -obs.elevation * 1.5;

    // Base y position (horizon + distance perspective)
    var baseY = h * 0.5 + (h * 0.3) * (1 - obs.distance / 6) + elevOffset;

    // Get obstacle color
    var color = Scenes.OBSTACLE_COLORS[obs.type] || '#00D4FF';

    // Draw obstacle shape based on type
    var objW, objH;
    switch (obs.type) {
      case 'person':
        objW = 25 * sizeScale;
        objH = 60 * sizeScale;
        drawPerson(x, baseY, objW, objH, color);
        break;
      case 'vehicle':
        objW = 60 * sizeScale;
        objH = 35 * sizeScale;
        drawVehicle(x, baseY, objW, objH, color);
        break;
      case 'stairs':
        objW = 50 * sizeScale;
        objH = 30 * sizeScale;
        drawStairs(x, baseY, objW, objH, color);
        break;
      case 'doorframe':
        objW = 40 * sizeScale;
        objH = 70 * sizeScale;
        drawDoorframe(x, baseY, objW, objH, color);
        break;
      case 'overhead':
        objW = 45 * sizeScale;
        objH = 20 * sizeScale;
        drawOverhead(x, baseY - 40 * sizeScale, objW, objH, color);
        break;
      case 'wall':
        objW = 70 * sizeScale;
        objH = 45 * sizeScale;
        drawWall(x, baseY, objW, objH, color);
        break;
      case 'pole':
        objW = 12 * sizeScale;
        objH = 55 * sizeScale;
        drawPole(x, baseY, objW, objH, color);
        break;
      default:
        objW = 30 * sizeScale;
        objH = 40 * sizeScale;
        ctx.fillStyle = color;
        ctx.fillRect(x - objW / 2, baseY - objH, objW, objH);
    }

    // Draw detection box (if in detection mode)
    if (state.viewMode === 'detection') {
      var boxW = Math.max(objW, 35) + 8;
      var boxH = objH + 8;
      var boxX = x - boxW / 2;
      var boxY = baseY - objH - 4;

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      // Label background
      var label = obs.label + ' ' + (obs.confidence * 100).toFixed(0) + '%';
      ctx.font = '11px monospace';
      var labelW = ctx.measureText(label).width + 8;
      ctx.fillStyle = color;
      ctx.fillRect(boxX, boxY - 16, labelW, 14);

      // Label text
      ctx.fillStyle = '#0A1628';
      ctx.fillText(label, boxX + 4, boxY - 5);

      // Distance label
      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.fillText(obs.distance.toFixed(1) + 'm', boxX + boxW - 30, boxY + boxH + 12);
    }
  }

  function drawPerson(x, baseY, w, h, color) {
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, baseY - h + w * 0.4, w * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillRect(x - w * 0.3, baseY - h + w * 0.7, w * 0.6, h - w * 0.7);
  }

  function drawVehicle(x, baseY, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    // Windshield
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x - w / 2 + 4, baseY - h + 4, w - 8, h * 0.3);
  }

  function drawStairs(x, baseY, w, h, color) {
    ctx.fillStyle = color;
    var steps = 4;
    var stepH = h / steps;
    for (var i = 0; i < steps; i++) {
      ctx.fillRect(x - w / 2, baseY - (i + 1) * stepH, w, stepH - 2);
    }
  }

  function drawDoorframe(x, baseY, w, h, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2, baseY - h, w, h);
    // Top bar
    ctx.fillRect(x - w / 2 - 3, baseY - h - 3, w + 6, 6);
  }

  function drawOverhead(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    // Warning stripes
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (var i = 0; i < 3; i++) {
      ctx.fillRect(x - w / 2 + i * (w / 3) + 2, y - h / 2, w / 6, h);
    }
  }

  function drawWall(x, baseY, w, h, color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    ctx.globalAlpha = 1;
    // Brick lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (var i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, baseY - h + (h / 3) * i);
      ctx.lineTo(x + w / 2, baseY - h + (h / 3) * i);
      ctx.stroke();
    }
  }

  function drawPole(x, baseY, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    // Top cap
    ctx.beginPath();
    ctx.arc(x, baseY - h, w * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDepthOverlay(obstacles, w, h) {
    // Semi-transparent depth overlay
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      var azClamped = Math.max(-90, Math.min(90, obs.azimuth));
      var x = w / 2 + (azClamped / 90) * (w / 2.2);
      var sizeScale = Math.max(0.3, Math.min(2.5, 4 / obs.distance));
      var baseY = h * 0.5 + (h * 0.3) * (1 - obs.distance / 6);
      var radius = 40 * sizeScale;

      // Depth color (red near, blue far)
      var dist = obs.distance;
      var r, g, b;
      if (dist < 1) { r = 239; g = 68; b = 68; }
      else if (dist < 2) { r = 249; g = 115; b = 22; }
      else if (dist < 4) { r = 251; g = 191; b = 36; }
      else { r = 59; g = 130; b = 246; }

      var grad = ctx.createRadialGradient(x, baseY, 0, x, baseY, radius);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.4)');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - radius, baseY - radius, radius * 2, radius * 2);
    }
  }

  function drawHUD(w, h, scene, t, activeObstacles) {
    // Top-left: scene info
    ctx.fillStyle = 'rgba(10,22,40,0.7)';
    ctx.fillRect(8, 8, 200, 24);
    ctx.fillStyle = '#00D4FF';
    ctx.font = '11px monospace';
    ctx.fillText('● ' + scene.name + ' | t=' + t.toFixed(1) + 's', 14, 24);

    // Top-right: obstacle count
    ctx.fillStyle = 'rgba(10,22,40,0.7)';
    ctx.fillRect(w - 140, 8, 132, 24);
    ctx.fillStyle = '#8B5CF6';
    ctx.fillText('检测: ' + activeObstacles.length + ' 个障碍物', w - 134, 24);

    // Crosshair (center)
    ctx.strokeStyle = 'rgba(0,212,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, h / 2);
    ctx.lineTo(w / 2 + 10, h / 2);
    ctx.moveTo(w / 2, h / 2 - 10);
    ctx.lineTo(w / 2, h / 2 + 10);
    ctx.stroke();

    // FOV indicator
    ctx.strokeStyle = 'rgba(0,212,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.5);
    ctx.lineTo(0, h);
    ctx.moveTo(w / 2, h * 0.5);
    ctx.lineTo(w, h);
    ctx.stroke();
  }

  function updateLog(t) {
    state.logThrottle++;
    if (state.logThrottle < 5) return; // Throttle log updates
    state.logThrottle = 0;

    var scene = Scenes.SCENES[state.currentScene];
    var entries = [];

    for (var i = 0; i < scene.obstacles.length; i++) {
      var obs = scene.obstacles[i];
      var traj = Engine.interpolateTrajectory(obs.trajectory, t);
      if (!traj || t < obs.trajectory[0].t || t > obs.trajectory[obs.trajectory.length - 1].t + 0.5) continue;

      var dist = Engine.mapDistance(traj.distance);
      var dirLabel = Engine.getDirectionLabel(traj.azimuth, traj.elevation);
      var typePattern = Engine.TYPE_PATTERNS[obs.type];

      var alertClass = traj.distance < 1.0 ? 'alert' : '';
      var entry = '<div class="log-entry">' +
        '<span class="time">[' + t.toFixed(1) + 's]</span> ' +
        '<span class="type">' + typePattern.label + '</span> ' +
        dirLabel + ' ' + traj.distance.toFixed(1) + 'm' +
        (alertClass ? ' <span class="' + alertClass + '">⚠ ' + dist.semantic + '</span>' : '') +
        '</div>';
      entries.push(entry);
    }

    if (entries.length === 0) {
      entries.push('<div class="log-entry"><span class="time">[' + t.toFixed(1) + 's]</span> 无障碍物</div>');
    }

    elements.log.innerHTML = entries.join('');

    // Auto-scroll to top
    elements.log.scrollTop = 0;
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
