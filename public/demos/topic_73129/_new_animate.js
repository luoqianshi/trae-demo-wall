function animateThree() {
  if (!threeRenderer || !threeScene || !threeCamera) {
    console.error('[3D animate] Missing renderer/scene/camera');
    return;
  }
  requestAnimationFrame(animateThree);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  try { threeControls.update(); } catch(e) {}

  // Subtle globe rotation (very slow, background element)
  if (globeMesh) {
    globeMesh.rotation.y += delta * 0.01;
  }

  // Energy hub - gentle breathing pulse only (no rotation)
  const hub = threeScene.getObjectByName('energyHub');
  if (hub) {
    hub.scale.setScalar(1 + Math.sin(elapsed * 1.2) * 0.05);
    hub.material.opacity = 0.5 + Math.sin(elapsed * 1.5) * 0.15;
  }
  const hubRing = threeScene.getObjectByName('hubRing');
  if (hubRing) {
    hubRing.material.opacity = 0.15 + Math.sin(elapsed * 1.0) * 0.08;
  }

  // Device nodes - subtle glow pulsing only (NO floating, NO rotation)
  deviceNodes.forEach((node, i) => {
    // Base ring gentle pulse
    const ring = node.group.getObjectByName('baseRing');
    if (ring) {
      ring.material.opacity = 0.25 + Math.sin(elapsed * 0.8 + i * 1.5) * 0.1;
    }

    // Type-specific subtle animations
    if (node.config.type === 'solar') {
      const sun = node.group.getObjectByName('solarSun');
      if (sun) {
        sun.material.opacity = 0.7 + Math.sin(elapsed * 2) * 0.2;
      }
    }
    if (node.config.type === 'load') {
      // Window flicker (very rare, subtle)
      const wins = [];
      node.group.traverse(c => { if (c.name === 'loadWin') wins.push(c); });
      wins.forEach((w, wi) => {
        if (Math.random() < 0.001) {
          w.material.opacity = w.material.opacity > 0.5 ? 0.3 : 0.85;
        }
      });
    }
    if (node.config.type === 'grid') {
      const wl = node.group.getObjectByName('gridWarnLight');
      if (wl) {
        wl.material.opacity = 0.6 + Math.sin(elapsed * 2.5) * 0.3;
      }
    }
    if (node.config.type === 'battery') {
      const fill = node.group.getObjectByName('socFill');
      if (fill) { fill.scale.x = D.soc / 100 + 0.3; }
    }
  });

  // Animate particles along curves (smooth flow)
  particleSystems.forEach(ps => {
    const posAttr = ps.geometry.attributes.position;
    for (let i = 0; i < ps.offsets.length; i++) {
      ps.offsets[i] += delta * ps.speed * 0.12;
      if (ps.offsets[i] > 1) ps.offsets[i] -= 1;
      const pt = ps.curve.getPoint(ps.offsets[i]);
      posAttr.array[i * 3] = pt.x;
      posAttr.array[i * 3 + 1] = pt.y;
      posAttr.array[i * 3 + 2] = pt.z;
    }
    posAttr.needsUpdate = true;
  });

  // Update labels
  updateLabels();

  try {
    threeRenderer.render(threeScene, threeCamera);
  } catch(e) {
    if (!window._3dRenderErrorLogged) {
      window._3dRenderErrorLogged = true;
      console.error('[3D] Render error:', e.message);
    }
  }
}
