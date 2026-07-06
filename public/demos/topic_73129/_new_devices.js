function createDeviceNodes() {
  // Topology flow layout (not circular):
  // Solar(back-left) → Inverter(center) → Battery(back-right)
  //                  ↘ Load(front-right)
  // Battery → Grid(front-left)
  const nodeConfigs = [
    { name: '光伏阵列', color: 0x22cc88, pos: [-5, 0, -2.5], type: 'solar' },
    { name: '逆变器',   color: 0x2299dd, pos: [-1.5, 0, 0], type: 'inverter' },
    { name: '储能电池', color: 0x2299dd, pos: [2, 0, -2.5], type: 'battery' },
    { name: '负载',     color: 0xddaa22, pos: [2, 0, 2.5], type: 'load' },
    { name: '电网',     color: 0x2299dd, pos: [5.5, 0, 0], type: 'grid' },
  ];

  // Professional materials
  function metalMat(color) {
    return new THREE.MeshPhongMaterial({
      color: color, shininess: 120, specular: 0x556688,
      emissive: new THREE.Color(color).multiplyScalar(0.08),
      transparent: true, opacity: 0.95
    });
  }
  function darkMat() {
    return new THREE.MeshPhongMaterial({
      color: 0x151e30, shininess: 60, specular: 0x223344,
      emissive: 0x080e18, transparent: true, opacity: 0.95
    });
  }
  function accentMat(color, op) {
    return new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: op || 0.85,
      blending: THREE.AdditiveBlending
    });
  }
  function edgeGlow(geo, color, parent, pos) {
    const e = new THREE.EdgesGeometry(geo, 20);
    const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.6
    }));
    if (pos) l.position.copy(pos);
    parent.add(l);
    return l;
  }

  nodeConfigs.forEach((cfg, i) => {
    const group = new THREE.Group();
    group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    const C = cfg.color;

    // Common: base platform (thin hexagonal disc)
    const platGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.04, 32);
    const plat = new THREE.Mesh(platGeo, darkMat());
    plat.position.y = 0.02; group.add(plat);
    edgeGlow(platGeo, C, group, plat.position);

    // Subtle glow ring around base
    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.92, 0.98, 48),
      accentMat(C, 0.35)
    );
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.005;
    baseRing.name = 'baseRing';
    group.add(baseRing);

    // Ground glow disc
    const gDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 32),
      accentMat(C, 0.04)
    );
    gDisc.rotation.x = -Math.PI / 2;
    gDisc.position.y = 0.001;
    group.add(gDisc);

    switch (cfg.type) {
      case 'solar': {
        // Support arm
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.04, 0.7, 8),
          metalMat(0x3a4a5a)
        );
        arm.position.y = 0.39; group.add(arm);

        // Tilted panel
        const pg = new THREE.Group();
        pg.position.y = 0.8;
        pg.rotation.x = -0.3;
        group.add(pg);

        // Panel frame
        const frameGeo = new THREE.BoxGeometry(2.2, 0.04, 1.4);
        const frame = new THREE.Mesh(frameGeo, metalMat(0x2a3a4a));
        pg.add(frame);
        edgeGlow(frameGeo, C, pg, new THREE.Vector3());

        // Solar cells (6x3) with glass surface
        for (let cx = 0; cx < 6; cx++) {
          for (let cz = 0; cz < 3; cz++) {
            const cell = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.015, 0.4),
              new THREE.MeshPhongMaterial({
                color: 0x0a2050, shininess: 200, specular: 0x4466aa,
                emissive: 0x040a18, transparent: true, opacity: 0.9
              })
            );
            cell.position.set(-0.88 + cx * 0.36, 0.028, -0.42 + cz * 0.42);
            pg.add(cell);
          }
        }

        // Thin grid lines on panel
        for (let cx = -3; cx <= 3; cx++) {
          pg.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(cx * 0.36, 0.04, -0.65),
              new THREE.Vector3(cx * 0.36, 0.04, 0.65)
            ]),
            new THREE.LineBasicMaterial({ color: C, transparent: true, opacity: 0.2 })
          ));
        }

        // Sun icon (small golden sphere with glow)
        const sun = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 16),
          accentMat(0xffcc44, 0.9)
        );
        sun.position.set(0, 1.8, 0);
        sun.name = 'solarSun';
        group.add(sun);
        const sunGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 12, 12),
          accentMat(0xffcc44, 0.1)
        );
        sunGlow.position.copy(sun.position);
        group.add(sunGlow);
        break;
      }

      case 'inverter': {
        // Main body - sleek rectangular unit
        const bodyGeo = new THREE.BoxGeometry(0.9, 1.4, 0.5);
        const body = new THREE.Mesh(bodyGeo, metalMat(0x1a2035));
        body.position.y = 0.74; group.add(body);
        edgeGlow(bodyGeo, C, group, body.position);

        // Front display panel
        const display = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.22, 0.01),
          accentMat(0x002a10, 0.9)
        );
        display.position.set(0, 1.1, 0.26); group.add(display);

        // Display data lines
        for (let l = 0; l < 3; l++) {
          const ln = new THREE.Mesh(
            new THREE.BoxGeometry(0.5 - l * 0.08, 0.018, 0.005),
            accentMat(C, 0.8)
          );
          ln.position.set(-0.04, 1.15 - l * 0.055, 0.27);
          group.add(ln);
        }

        // Status LEDs (3 green dots)
        for (let l = 0; l < 3; l++) {
          const led = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 8),
            accentMat(0x22ff88, 1.0)
          );
          led.position.set(-0.15 + l * 0.15, 0.88, 0.26);
          led.name = 'invLed' + l;
          group.add(led);
        }

        // Ventilation slits
        for (let g = 0; g < 4; g++) {
          const slit = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.008, 0.005),
            metalMat(0x2a3545)
          );
          slit.position.set(0, 0.35 + g * 0.04, 0.26);
          group.add(slit);
        }

        // Top connection ports
        for (let p = -1; p <= 1; p += 2) {
          const port = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8),
            metalMat(0x445566)
          );
          port.position.set(p * 0.25, 1.47, 0);
          group.add(port);
        }
        break;
      }

      case 'battery': {
        // 3 stacked modules
        for (let i = 0; i < 3; i++) {
          const modGeo = new THREE.BoxGeometry(1.0, 0.32, 0.6);
          const mod = new THREE.Mesh(modGeo, metalMat(0x1a2540));
          mod.position.y = 0.24 + i * 0.36;
          group.add(mod);
          edgeGlow(modGeo, C, group, mod.position);

          // SOC bar on front
          const w = 0.6 * (i < 2 ? 0.85 : 0.4);
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(w, 0.04, 0.008),
            accentMat(i < 2 ? C : 0x445555, 0.7)
          );
          bar.position.set(-0.1, 0.24 + i * 0.36, 0.31);
          bar.name = i === 1 ? 'socFill' : '';
          group.add(bar);
        }

        // Terminals on top
        [[-0.2, 0xcc3333], [0.2, 0x333333]].forEach(([xo, c]) => {
          const t = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12),
            metalMat(c)
          );
          t.position.set(xo, 1.35, 0);
          group.add(t);
        });

        // Side SOC indicator
        const socBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 1.0, 0.03),
          accentMat(C, 0.5)
        );
        socBar.position.set(-0.53, 0.6, 0);
        group.add(socBar);

        // Top cover
        const topGeo = new THREE.BoxGeometry(1.05, 0.03, 0.65);
        const top = new THREE.Mesh(topGeo, metalMat(0x2a3545));
        top.position.y = 1.32; group.add(top);
        edgeGlow(topGeo, C, group, top.position);
        break;
      }

      case 'load': {
        // Modern building
        const bGeo = new THREE.BoxGeometry(1.0, 1.2, 0.85);
        const build = new THREE.Mesh(bGeo, metalMat(0x1a2540));
        build.position.y = 0.64; group.add(build);
        edgeGlow(bGeo, C, group, build.position);

        // Roof slab
        const roofGeo = new THREE.BoxGeometry(1.1, 0.04, 0.95);
        const roof = new THREE.Mesh(roofGeo, metalMat(0x2a3a4a));
        roof.position.y = 1.26; group.add(roof);
        edgeGlow(roofGeo, C, group, roof.position);

        // Windows (3 rows x 3 cols) - warm glow
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const lit = Math.random() > 0.2;
            const win = new THREE.Mesh(
              new THREE.BoxGeometry(0.18, 0.14, 0.015),
              accentMat(lit ? 0xddaa22 : 0x1a1a2a, lit ? 0.85 : 0.4)
            );
            win.position.set(-0.26 + c * 0.26, 0.3 + r * 0.32, 0.44);
            win.name = lit ? 'loadWin' : '';
            group.add(win);
          }
        }

        // Door
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.3, 0.015),
          metalMat(0x2a3545)
        );
        door.position.set(0, 0.19, 0.44);
        group.add(door);
        edgeGlow(new THREE.BoxGeometry(0.2, 0.3, 0.015), C, group, door.position);

        // Rooftop equipment
        const acUnit = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.15, 0.18),
          metalMat(0x3a4a5a)
        );
        acUnit.position.set(-0.25, 1.36, 0.2);
        group.add(acUnit);
        break;
      }

      case 'grid': {
        // Transmission tower - clean lattice
        const towerH = 2.4;
        const legMat = metalMat(0x3a4a5a);

        // 4 legs
        for (let leg = 0; leg < 4; leg++) {
          const a = (leg / 4) * Math.PI * 2 + Math.PI / 4;
          const pts = [];
          for (let s = 0; s <= 8; s++) {
            const t = s / 8;
            const r = 0.4 * (1 - t * 0.6);
            pts.push(new THREE.Vector3(Math.cos(a) * r, t * towerH, Math.sin(a) * r));
          }
          const curve = new THREE.CatmullRomCurve3(pts);
          group.add(new THREE.Mesh(
            new THREE.TubeGeometry(curve, 12, 0.02, 6, false), legMat
          ));
        }

        // Cross braces
        for (let s = 1; s < 8; s += 2) {
          const t = s / 8;
          const r = 0.4 * (1 - t * 0.6);
          const y = t * towerH;
          for (let a = 0; a < 4; a++) {
            const a1 = (a / 4) * Math.PI * 2 + Math.PI / 4;
            const a2 = ((a + 1) / 4) * Math.PI * 2 + Math.PI / 4;
            group.add(new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(Math.cos(a1) * r, y, Math.sin(a1) * r),
                new THREE.Vector3(Math.cos(a2) * r, y, Math.sin(a2) * r)
              ]),
              new THREE.LineBasicMaterial({ color: 0x4a5a6a, transparent: true, opacity: 0.5 })
            ));
          }
        }

        // Power arms
        const armY = towerH * 0.82;
        for (let arm = 0; arm < 3; arm++) {
          const a = (arm / 3) * Math.PI * 2;
          const al = 0.7;
          group.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, armY, 0),
              new THREE.Vector3(Math.cos(a) * al, armY + 0.05, Math.sin(a) * al)
            ]),
            new THREE.LineBasicMaterial({ color: 0x5a6a7a })
          ));
          // Insulator
          const ins = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.035, 0.1, 8),
            metalMat(0x887755)
          );
          ins.position.set(Math.cos(a) * al, armY - 0.05, Math.sin(a) * al);
          group.add(ins);
        }

        // Warning light
        const warn = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 10, 10),
          accentMat(0xff4466, 1.0)
        );
        warn.position.y = towerH + 0.1;
        warn.name = 'gridWarnLight';
        group.add(warn);

        // Bounding edge hint
        edgeGlow(new THREE.BoxGeometry(0.8, towerH, 0.8), C, group, new THREE.Vector3(0, towerH / 2, 0));
        break;
      }
    }

    threeScene.add(group);
    let mainMesh = null;
    group.traverse(child => { if (!mainMesh && child.isMesh) mainMesh = child; });
    deviceNodes.push({ group, mesh: mainMesh, config: cfg, angle: cfg.posAngle || 0, baseY: cfg.pos[1] });
  });
}
