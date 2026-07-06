function createFlowPaths() {
  // Flow paths based on topology layout
  const flowDefs = [
    { from: 0, to: 1, color: 0x22cc88, speed: 0.6, label: 'PV→Inv' },   // Solar → Inverter
    { from: 1, to: 2, color: 0x2299dd, speed: 0.5, label: 'Inv→Bat' },  // Inverter → Battery
    { from: 1, to: 3, color: 0xddaa22, speed: 0.5, label: 'Inv→Load' }, // Inverter → Load
    { from: 2, to: 4, color: 0x2299dd, speed: 0.35, label: 'Bat→Grid' },// Battery → Grid
  ];

  flowDefs.forEach(def => {
    const fromPos = deviceNodes[def.from].group.position;
    const toPos = deviceNodes[def.to].group.position;
    const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
    mid.y += 1.8; // Gentle arc

    const curve = new THREE.CatmullRomCurve3([
      fromPos.clone().add(new THREE.Vector3(0, 0.5, 0)),
      mid,
      toPos.clone().add(new THREE.Vector3(0, 0.5, 0))
    ]);

    // Flow tube (thin translucent tube along path)
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.015, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: def.color, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    threeScene.add(tube);

    // Particles along curve (small glowing dots)
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);
    const offsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      offsets[i] = i / particleCount; // Evenly distributed
      const pt = curve.getPoint(offsets[i]);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: def.color, size: 0.08, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    threeScene.add(points);

    particleSystems.push({ points, geometry, offsets, curve, speed: def.speed, positions, tube });
  });
}
