// 主逻辑与事件模块 - 视图控制、核心操作、动画循环、事件绑定

function resetViewState() {
  State.selectedBodyIndex = -1;
  State.trackingBodyIndex = -1;
  State.offsetX = 0;
  State.offsetY = 0;
  State.scale = 1;
}

function defocus() {
  State.selectedBodyIndex = -1;
  State.trackingBodyIndex = -1;
}

function saveInitialView() {
  State.initialView.scale = State.scale;
  State.initialView.offsetX = State.offsetX;
  State.initialView.offsetY = State.offsetY;
}

function restoreInitialView() {
  State.scale = State.initialView.scale;
  State.offsetX = State.initialView.offsetX;
  State.offsetY = State.initialView.offsetY;
}

function randomBodies() {
  const count = State.bodies.length > 0 ? State.bodies.length : 3;
  const oldNames = State.bodies.map((b) => b.name);
  const oldColors = State.bodies.map((b) => b.color);
  State.bodies = [];

  const { massMin, massMax, speedMin, speedMax, posRange } = getRandomParams();

  for (let i = 0; i < count; i++) {
    const angle =
      ((Math.PI * 2) / count) * i + Math.random() * 0.5 - 0.25;
    const dist = posRange * (0.5 + Math.random() * 0.5);
    const mass = massMin + Math.random() * (massMax - massMin);
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const velAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.6;

    State.bodies.push({
      name: oldNames[i] || "天体" + (i + 1),
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      vx: Math.cos(velAngle) * speed,
      vy: Math.sin(velAngle) * speed,
      mass: mass,
      radius: getBodyRadius(mass),
      color: oldColors[i] || randomColor(),
      trail: [],
    });
  }

  let totalMomentumX = 0,
    totalMomentumY = 0,
    totalMass = 0;
  for (const b of State.bodies) {
    totalMomentumX += b.vx * b.mass;
    totalMomentumY += b.vy * b.mass;
    totalMass += b.mass;
  }
  for (const b of State.bodies) {
    b.vx -= totalMomentumX / totalMass;
    b.vy -= totalMomentumY / totalMass;
  }

  State.simulationTime = 0;
  State.isRunning = false;
  resetViewState();
  State.initialView = { scale: 1, offsetX: 0, offsetY: 0 };
  State.bodyNameCounter = State.bodies.length;
  State.initialBodies = State.bodies.map((b) => ({ ...b, trail: [] }));
  updatePlayButton();
  updateBodyDetailPopup();
  renderBodyList();
}

function reset() {
  State.bodies = State.initialBodies.map((b) => ({ ...b, trail: [] }));
  State.simulationTime = 0;
  State.isRunning = false;
  defocus();
  restoreInitialView();
  State.bodyNameCounter = State.bodies.length;
  updatePlayButton();
  updateBodyDetailPopup();
  setControlsEnabled(true);
  renderBodyList();
}

function resize() {
  State.width = State.canvas.width = window.innerWidth;
  State.height = State.canvas.height = window.innerHeight;
  State.centerX = State.width / 2;
  State.centerY = State.height / 2;
  generateStars();
}

function animate() {
  State.ctx.fillStyle = "#0a0a1a";
  State.ctx.fillRect(0, 0, State.width, State.height);

  drawStars();

  if (State.isRunning) {
    const steps = Math.max(1, Math.floor(State.speed * 3));
    for (let i = 0; i < steps; i++) {
      updatePhysics();
    }
  }

  if (State.trackingBodyIndex >= 0 && State.bodies[State.trackingBodyIndex]) {
    const body = State.bodies[State.trackingBodyIndex];
    State.offsetX = -body.x;
    State.offsetY = -body.y;
  }

  drawTrails();
  drawBodies();

  State.frameCount++;
  const now = performance.now();
  if (now - State.lastTime >= 500) {
    State.fps = Math.round((State.frameCount * 1000) / (now - State.lastTime));
    State.frameCount = 0;
    State.lastTime = now;
    document.getElementById("fpsDisplay").textContent = State.fps;
  }

  document.getElementById("timeDisplay").textContent =
    State.simulationTime.toFixed(2);

  if (State.isRunning) {
    const body = State.bodies[State.selectedBodyIndex];
    if (body) {
      const speedVal = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
      document.getElementById("bodySpeedInput").value = speedVal.toFixed(2);

      let angle = (Math.atan2(body.vy, body.vx) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      document.getElementById("bodyAngleInput").value = Math.round(angle);
    }
  }

  requestAnimationFrame(animate);
}

function handleBodyPress(index) {
  State.selectedBodyIndex = index;
  if (State.simulationTime === 0) {
    State.isDraggingBody = true;
    State.draggedBodyIndex = index;
    State.dragMoved = false;
    State.trackingBodyIndex = -1;
    hideBodyDetailPopup();
  } else {
    State.trackingBodyIndex = index;
  }
  renderBodyList();
}

function handleBackgroundPress(clientX, clientY) {
  State.selectedBodyIndex = -1;
  State.trackingBodyIndex = -1;
  State.isPanning = true;
  hideBodyDetailPopup();
  renderBodyList();
  State.lastMouseX = clientX;
  State.lastMouseY = clientY;
}

function handleDragMove(clientX, clientY, threshold = 3) {
  if (State.isDraggingBody && State.draggedBodyIndex >= 0) {
    const dx = clientX - State.dragStartX;
    const dy = clientY - State.dragStartY;
    if (!State.dragMoved && Math.sqrt(dx * dx + dy * dy) > threshold) {
      State.dragMoved = true;
    }
    const world = screenToWorld(clientX, clientY);
    State.bodies[State.draggedBodyIndex].x = world.x;
    State.bodies[State.draggedBodyIndex].y = world.y;
    State.bodies[State.draggedBodyIndex].trail = [];
    return true;
  }
  if (State.isPanning) {
    State.offsetX += (clientX - State.lastMouseX) / State.scale;
    State.offsetY += (clientY - State.lastMouseY) / State.scale;
    State.lastMouseX = clientX;
    State.lastMouseY = clientY;
    return true;
  }
  return false;
}

function handleDragEnd() {
  if (State.isDraggingBody && !State.isRunning) {
    if (State.dragMoved) {
      saveInitialBodies();
      State.selectedBodyIndex = -1;
      State.trackingBodyIndex = -1;
      hideBodyDetailPopup();
      renderBodyList();
    } else {
      showBodyDetailModal();
    }
  }
  State.isDraggingBody = false;
  State.draggedBodyIndex = -1;
  State.isPanning = false;
}

// 事件绑定
function bindEvents() {
  const canvas = State.canvas;
  const playBtn = document.getElementById("playBtn");
  const resetBtn = document.getElementById("resetBtn");
  const randomBtn = document.getElementById("randomBtn");
  const speedInput = document.getElementById("speedInput");
  const trailToggle = document.getElementById("trailToggle");
  const velocityToggle = document.getElementById("velocityToggle");

  // 播放/暂停
  playBtn.addEventListener("click", function () {
    State.isRunning = !State.isRunning;
    updatePlayButton();
    if (State.isRunning) {
      if (State.simulationTime === 0) {
        saveInitialView();
        defocus();
      }
      updateBodyDetailPopup();
      setControlsEnabled(false);
    } else {
      setControlsEnabled(false);
    }
    renderBodyList();
  });

  // 重置
  resetBtn.addEventListener("click", reset);

  // 随机生成
  randomBtn.addEventListener("click", randomBodies);

  // 模拟速度
  speedInput.addEventListener("change", function () {
    const val = parseNumber(this.value, 1, 0.01, 1000);
    State.speed = val;
    this.value = val.toFixed(1);
  });

  // 高级设置折叠
  const advancedToggle = document.getElementById("advancedToggle");
  advancedToggle.addEventListener("click", function () {
    this.classList.toggle("active");
  });

  // 高级设置参数 - 质量范围
  setupMinMaxInputs(
    "massMinInput", "massMaxInput", 500, 1500, 0.001, 1e6,
    (v) => Math.round(v * 1000) / 1000
  );

  // 高级设置参数 - 速度范围
  setupMinMaxInputs(
    "speedMinInput", "speedMaxInput", 0.5, 1.3, 0, 1000,
    (v) => v.toFixed(2)
  );

  // 位置范围
  document.getElementById("posRangeInput").addEventListener("change", function () {
    const val = parseNumber(this.value, 200, 1, 10000);
    this.value = Math.round(val);
  });

  // 引力常数
  document.getElementById("gravityInput").addEventListener("change", function () {
    if (State.simulationTime !== 0) {
      this.value = Math.round(State.G);
      return;
    }
    const val = parseNumber(this.value, 500, 1, 100000);
    State.G = val;
    this.value = Math.round(val);
  });

  // 时间步长
  document.getElementById("dtInput").addEventListener("change", function () {
    if (State.simulationTime !== 0) {
      this.value = State.dt;
      return;
    }
    const val = parseNumber(this.value, 0.01, 0.001, 0.1);
    State.dt = val;
    this.value = val.toFixed(3);
  });

  // 软化因子
  document.getElementById("softeningInput").addEventListener("change", function () {
    if (State.simulationTime !== 0) {
      this.value = Math.round(State.softening);
      return;
    }
    const val = parseNumber(this.value, 20, 0, 200);
    State.softening = val;
    this.value = Math.round(val);
  });

  // 显示选项
  velocityToggle.addEventListener("click", function () {
    State.showVelocity = !State.showVelocity;
    this.classList.toggle("active", State.showVelocity);
  });

  document.getElementById("bodyNameToggle").addEventListener("click", function () {
    State.showBodyNames = !State.showBodyNames;
    this.classList.toggle("active", State.showBodyNames);
  });

  trailToggle.addEventListener("click", function () {
    State.showTrail = !State.showTrail;
    this.classList.toggle("active", State.showTrail);
    updateTrailControlsVisibility();
  });

  const trailRadios = document.querySelectorAll('input[name="trailMode"]');
  trailRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      State.trailMode = this.value;
      updateTrailControlsVisibility();
    });
  });

  document.getElementById("trailDurationInput").addEventListener("change", function () {
    const val = parseNumber(this.value, 10, 1, 10000);
    State.trailDuration = val;
    this.value = Math.round(val);
  });

  // 天体属性编辑
  document.getElementById("bodyNameInput").addEventListener("change", function () {
    const body = State.bodies[State.selectedBodyIndex];
    if (!body) return;
    const val = this.value.trim() || body.name;
    body.name = val;
    this.value = val;
    renderBodyList();
    saveInitialBodies();
  });

  document.getElementById("colorRandomBtn").addEventListener("click", function () {
    const body = State.bodies[State.selectedBodyIndex];
    if (!body) return;
    body.color = randomColor();
    document.getElementById("bodyColor").value = body.color;
    renderBodyList();
    saveInitialBodies();
  });

  document.getElementById("bodyColor").addEventListener("input", function () {
    if (State.bodies[State.selectedBodyIndex]) {
      State.bodies[State.selectedBodyIndex].color = this.value;
      renderBodyList();
      saveInitialBodies();
    }
  });

  document.getElementById("bodyMassInput").addEventListener("change", function () {
    const body = State.bodies[State.selectedBodyIndex];
    if (!body) return;
    const val = parseNumber(this.value, 1000, 0.001, 1e6);
    body.mass = val;
    body.radius = getBodyRadius(val);
    this.value = Math.round(val * 1000) / 1000;
    saveInitialBodies();
  });

  document.getElementById("bodySpeedInput").addEventListener("change", function () {
    const body = State.bodies[State.selectedBodyIndex];
    if (!body) return;
    const val = parseNumber(this.value, 1, 0, 1000);
    const currentAngle = Math.atan2(body.vy, body.vx);
    body.vx = Math.cos(currentAngle) * val;
    body.vy = Math.sin(currentAngle) * val;
    this.value = val.toFixed(2);
    saveInitialBodies();
  });

  document.getElementById("bodyAngleInput").addEventListener("change", function () {
    const body = State.bodies[State.selectedBodyIndex];
    if (!body) return;
    const raw = parseFloat(this.value);
    if (isNaN(raw) || !isFinite(raw)) {
      const currentAngle =
        (Math.atan2(body.vy, body.vx) * 180) / Math.PI;
      this.value = Math.round(
        currentAngle < 0 ? currentAngle + 360 : currentAngle,
      );
      return;
    }
    let val = raw;
    while (val < 0) val += 360;
    while (val >= 360) val -= 360;
    const angle = (val * Math.PI) / 180;
    const currentSpeed = Math.sqrt(
      body.vx * body.vx + body.vy * body.vy,
    );
    body.vx = Math.cos(angle) * currentSpeed;
    body.vy = Math.sin(angle) * currentSpeed;
    this.value = Math.round(val);
    saveInitialBodies();
  });

  // Canvas鼠标事件
  canvas.addEventListener("mousedown", function (e) {
    const hit = getBodyAtMouse(e.clientX, e.clientY);
    if (hit >= 0) {
      State.dragStartX = e.clientX;
      State.dragStartY = e.clientY;
      handleBodyPress(hit);
      canvas.style.cursor = "grabbing";
    } else {
      handleBackgroundPress(e.clientX, e.clientY);
      canvas.style.cursor = "grabbing";
    }
  });

  canvas.addEventListener("mousemove", function (e) {
    if (!handleDragMove(e.clientX, e.clientY, 3)) {
      const hit = getBodyAtMouse(e.clientX, e.clientY);
      canvas.style.cursor = hit >= 0 ? "grab" : "grab";
    }
  });

  canvas.addEventListener("mouseup", function () {
    handleDragEnd();
    canvas.style.cursor = "grab";
  });

  canvas.addEventListener("mouseleave", function () {
    if (State.isDraggingBody && !State.isRunning) {
      saveInitialBodies();
    }
    State.isDraggingBody = false;
    State.draggedBodyIndex = -1;
    State.isPanning = false;
    canvas.style.cursor = "grab";
  });

  canvas.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      State.scale *= zoomFactor;
    },
    { passive: false },
  );

  // 触摸事件
  canvas.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const hit = getBodyAtMouse(touch.clientX, touch.clientY);
        if (hit >= 0) {
          State.dragStartX = touch.clientX;
          State.dragStartY = touch.clientY;
          handleBodyPress(hit);
        } else {
          handleBackgroundPress(touch.clientX, touch.clientY);
        }
      } else if (e.touches.length === 2) {
        State.isDraggingBody = false;
        State.isPanning = false;
        State.touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        State.touchStartScale = State.scale;
      }
    },
    { passive: true },
  );

  canvas.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY, 6);
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        State.scale = State.touchStartScale * (dist / State.touchStartDist);
      }
    },
    { passive: false },
  );

  canvas.addEventListener("touchend", function () {
    handleDragEnd();
  });

  // 窗口缩放
  window.addEventListener("resize", resize);

  // 左下角眼睛按钮 - 切换UI显示
  const toggleUiBtn = document.getElementById("toggleUiBtn");
  toggleUiBtn.addEventListener("click", function () {
    const hidden = document.body.classList.toggle("ui-hidden");
    toggleUiBtn.textContent = hidden ? "🙈" : "👁";
    if (hidden) {
      hideBodyDetailPopup();
      defocus();
      document.getElementById("settingsModal").classList.remove("active");
      document.getElementById("helpModal").classList.remove("active");
      renderBodyList();
    }
  });

  // 右下角帮助按钮 - 打开帮助弹窗
  const helpModal = document.getElementById("helpModal");
  document.getElementById("helpBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    helpModal.classList.add("active");
  });

  // 点击弹窗外关闭帮助弹窗
  helpModal.addEventListener("click", function (e) {
    if (e.target === helpModal) {
      helpModal.classList.remove("active");
    }
  });

  // 天体列表横向滚轮滚动
  const bodyList = document.getElementById("bodyList");
  bodyList.addEventListener("wheel", function (e) {
    e.preventDefault();
    this.scrollLeft += e.deltaY;
  }, { passive: false });

  // 点击弹窗外关闭详情弹窗
  const bodyDetailModal = document.getElementById("bodyDetailModal");
  bodyDetailModal.addEventListener("click", function (e) {
    if (e.target === bodyDetailModal) {
      hideBodyDetailPopup();
      State.selectedBodyIndex = -1;
      renderBodyList();
    }
  });

  // 设置弹窗
  const settingsModal = document.getElementById("settingsModal");
  document.getElementById("settingsBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    settingsModal.classList.add("active");
  });
  settingsModal.addEventListener("click", function (e) {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("active");
    }
  });
}

// 初始化
(function init() {
  State.canvas = document.getElementById("canvas");
  State.ctx = State.canvas.getContext("2d");

  resize();
  randomBodies();
  updateTrailControlsVisibility();
  bindEvents();
  animate();
})();
