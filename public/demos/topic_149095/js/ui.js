// UI界面管理模块 - 弹窗、控件、天体列表、天体管理

function updatePlayButton() {
  const playBtn = document.getElementById("playBtn");
  if (!playBtn) return;
  playBtn.textContent = State.isRunning ? "暂停" : "开始";
  playBtn.classList.toggle("primary", !State.isRunning);
}

function updateTrailControlsVisibility() {
  const modeRow = document.getElementById("trailModeRow");
  const durRow = document.getElementById("trailDurationRow");
  if (!State.showTrail) {
    modeRow.style.display = "none";
    durRow.style.display = "none";
  } else {
    modeRow.style.display = "";
    durRow.style.display = State.trailMode === "partial" ? "" : "none";
  }
}

function setControlsEnabled(enabled) {
  const inputs = [
    "bodyMassInput",
    "bodySpeedInput",
    "bodyAngleInput",
    "gravityInput",
    "dtInput",
    "softeningInput",
  ];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

function setupMinMaxInputs(minId, maxId, defaultMin, defaultMax, minLimit, maxLimit, formatter) {
  const minInput = document.getElementById(minId);
  const maxInput = document.getElementById(maxId);

  minInput.addEventListener("change", function () {
    const minVal = parseNumber(this.value, defaultMin, minLimit, maxLimit);
    const maxVal = parseNumber(maxInput.value, defaultMax, minLimit, maxLimit);
    this.value = formatter(Math.min(minVal, maxVal));
  });

  maxInput.addEventListener("change", function () {
    const minVal = parseNumber(minInput.value, defaultMin, minLimit, maxLimit);
    const maxVal = parseNumber(this.value, defaultMax, minLimit, maxLimit);
    this.value = formatter(Math.max(minVal, maxVal));
  });
}

function showBodyDetailModal() {
  const modal = document.getElementById("bodyDetailModal");
  const body = State.bodies[State.selectedBodyIndex];

  if (document.body.classList.contains("ui-hidden")) {
    return;
  }

  if (!body || State.simulationTime > 0) {
    modal.classList.remove("active");
    return;
  }

  modal.classList.add("active");
  setControlsEnabled(State.simulationTime === 0);

  document.getElementById("bodyNameInput").value = body.name;
  document.getElementById("bodyColor").value = body.color;
  document.getElementById("bodyMassInput").value = Math.round(body.mass);

  const speedVal = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
  document.getElementById("bodySpeedInput").value = speedVal.toFixed(2);

  let angle = (Math.atan2(body.vy, body.vx) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  document.getElementById("bodyAngleInput").value = Math.round(angle);

  renderBodyList();
}

function hideBodyDetailPopup() {
  document.getElementById("bodyDetailModal").classList.remove("active");
}

function updateBodyDetailPopup() {
  const modal = document.getElementById("bodyDetailModal");
  if (!modal.classList.contains("active")) return;
  showBodyDetailModal();
}

function renderBodyList() {
  const list = document.getElementById("bodyList");
  list.innerHTML = "";
  const canEdit = State.simulationTime === 0 && !State.isRunning;
  for (let i = 0; i < State.bodies.length; i++) {
    const item = document.createElement("div");
    item.className =
      "body-item" + (i === State.selectedBodyIndex ? " active" : "");
    const deleteBtnHtml =
      canEdit && State.bodies.length > 1
        ? `<div class="body-delete-btn" data-index="${i}">×</div>`
        : "";
    item.innerHTML = `
      ${deleteBtnHtml}
      <div class="body-color-dot" style="background:${State.bodies[i].color}"></div>
      <div class="body-item-name">${State.bodies[i].name}</div>
    `;
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("body-delete-btn")) return;
      e.stopPropagation();
      State.selectedBodyIndex = i;
      if (State.simulationTime > 0) {
        State.trackingBodyIndex = i;
      } else {
        State.trackingBodyIndex = -1;
        showBodyDetailModal();
      }
      renderBodyList();
    });
    const deleteBtn = item.querySelector(".body-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (State.simulationTime === 0) {
          deleteBody(i);
        }
      });
    }
    list.appendChild(item);
  }

  const addItem = document.createElement("div");
  addItem.className = "body-item body-add-item";
  addItem.innerHTML = '<div class="body-add-icon">+</div>';
  addItem.addEventListener("click", (e) => {
    e.stopPropagation();
    if (State.simulationTime === 0) {
      addBody();
    }
  });
  if (!canEdit) {
    addItem.classList.add("disabled");
  }
  list.appendChild(addItem);
}

function addBody() {
  const { massMin, massMax, speedMin, speedMax } = getRandomParams();

  const mass = massMin + Math.random() * (massMax - massMin);
  const speed = speedMin + Math.random() * (speedMax - speedMin);
  const velAngle = Math.random() * Math.PI * 2;

  const centerWorld = screenToWorld(State.centerX, State.centerY);

  State.bodyNameCounter++;
  const newBody = {
    name: "天体" + State.bodyNameCounter,
    x: centerWorld.x,
    y: centerWorld.y,
    vx: Math.cos(velAngle) * speed,
    vy: Math.sin(velAngle) * speed,
    mass: mass,
    radius: getBodyRadius(mass),
    color: randomColor(),
    trail: [],
  };

  State.bodies.push(newBody);
  if (State.simulationTime === 0) {
    saveInitialBodies();
  }
  State.selectedBodyIndex = -1;
  State.trackingBodyIndex = -1;
  renderBodyList();
  hideBodyDetailPopup();
}

function deleteBody(index) {
  if (State.bodies.length <= 1) return;
  State.bodies.splice(index, 1);
  if (State.simulationTime === 0) {
    saveInitialBodies();
  }

  const adjustIndex = (idx) => {
    if (idx === -1) return -1;
    if (idx >= State.bodies.length) return State.bodies.length - 1;
    if (idx > index) return idx - 1;
    return idx;
  };

  State.selectedBodyIndex = adjustIndex(State.selectedBodyIndex);
  State.trackingBodyIndex = adjustIndex(State.trackingBodyIndex);

  if (State.simulationTime > 0 && State.selectedBodyIndex >= 0) {
    State.trackingBodyIndex = State.selectedBodyIndex;
  }

  renderBodyList();
  updateBodyDetailPopup();
}

function saveInitialBodies() {
  State.initialBodies = State.bodies.map((b) => ({
    name: b.name,
    x: b.x,
    y: b.y,
    vx: b.vx,
    vy: b.vy,
    mass: b.mass,
    radius: b.radius,
    color: b.color,
    trail: [],
  }));
}
