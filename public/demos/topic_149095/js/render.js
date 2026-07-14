// 渲染模块 - Canvas绘制所有视觉元素

function screenToWorld(sx, sy) {
  return {
    x: (sx - State.centerX) / State.scale - State.offsetX,
    y: (sy - State.centerY) / State.scale - State.offsetY,
  };
}

function worldToScreen(x, y) {
  return {
    x: State.centerX + (x + State.offsetX) * State.scale,
    y: State.centerY + (y + State.offsetY) * State.scale,
  };
}

function getBodyAtMouse(mx, my) {
  const world = screenToWorld(mx, my);
  for (let i = State.bodies.length - 1; i >= 0; i--) {
    const b = State.bodies[i];
    const dx = world.x - b.x;
    const dy = world.y - b.y;
    const hitRadius = Math.max(b.radius, 15 / State.scale);
    if (dx * dx + dy * dy < hitRadius * hitRadius) {
      return i;
    }
  }
  return -1;
}

function generateStars() {
  State.stars = [];
  const count = Math.floor((State.width * State.height) / 3000);
  for (let i = 0; i < count; i++) {
    State.stars.push({
      x: Math.random() * State.width,
      y: Math.random() * State.height,
      size: Math.random() * 1.5 + 0.3,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
}

function drawStars() {
  for (const star of State.stars) {
    State.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    State.ctx.beginPath();
    State.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    State.ctx.fill();
  }
}

function drawTrails() {
  if (!State.showTrail) return;

  for (const body of State.bodies) {
    if (body.trail.length < 2) continue;

    let startIdx = 0;
    if (State.trailMode === "partial") {
      const cutoffTime = State.simulationTime - State.trailDuration;
      while (
        startIdx < body.trail.length &&
        body.trail[startIdx].t < cutoffTime
      ) {
        startIdx++;
      }
      if (startIdx > 0) startIdx--;
    }

    const visibleCount = body.trail.length - startIdx;
    if (visibleCount < 2) continue;

    for (let i = startIdx + 1; i < body.trail.length; i++) {
      const localIdx = i - startIdx;
      let alpha;
      if (State.trailMode === "full") {
        alpha = 0.7;
      } else {
        alpha = localIdx / visibleCount;
      }
      const p1 = worldToScreen(body.trail[i - 1].x, body.trail[i - 1].y);
      const p2 = worldToScreen(body.trail[i].x, body.trail[i].y);

      State.ctx.strokeStyle =
        body.color +
        Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0");
      State.ctx.lineWidth = State.trailMode === "full" ? 1.5 : alpha * 2 + 0.5;
      State.ctx.beginPath();
      State.ctx.moveTo(p1.x, p1.y);
      State.ctx.lineTo(p2.x, p2.y);
      State.ctx.stroke();
    }
  }
}

function drawBodies() {
  for (let i = 0; i < State.bodies.length; i++) {
    const body = State.bodies[i];
    const pos = worldToScreen(body.x, body.y);
    const r = body.radius * State.scale;

    if (i === State.selectedBodyIndex) {
      State.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      State.ctx.lineWidth = 2;
      State.ctx.setLineDash([4, 4]);
      State.ctx.beginPath();
      State.ctx.arc(pos.x, pos.y, r * 2, 0, Math.PI * 2);
      State.ctx.stroke();
      State.ctx.setLineDash([]);
    }

    const gradient = State.ctx.createRadialGradient(
      pos.x,
      pos.y,
      0,
      pos.x,
      pos.y,
      r * 3,
    );
    gradient.addColorStop(0, body.color);
    gradient.addColorStop(0.3, body.color + "aa");
    gradient.addColorStop(1, body.color + "00");

    State.ctx.fillStyle = gradient;
    State.ctx.beginPath();
    State.ctx.arc(pos.x, pos.y, r * 3, 0, Math.PI * 2);
    State.ctx.fill();

    State.ctx.fillStyle = body.color;
    State.ctx.beginPath();
    State.ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    State.ctx.fill();

    State.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    State.ctx.beginPath();
    State.ctx.arc(pos.x - r * 0.3, pos.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    State.ctx.fill();
  }

  if (State.showBodyNames) {
    State.ctx.font = "12px sans-serif";
    State.ctx.textAlign = "center";
    State.ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (const body of State.bodies) {
      const pos = worldToScreen(body.x, body.y);
      const r = body.radius * State.scale;
      State.ctx.fillText(body.name, pos.x, pos.y - r - 8);
    }
  }

  if (State.showVelocity) {
    for (const body of State.bodies) {
      const pos = worldToScreen(body.x, body.y);
      const angle = Math.atan2(body.vy, body.vx);
      const arrowLen = 30;

      const endX = pos.x + Math.cos(angle) * arrowLen;
      const endY = pos.y + Math.sin(angle) * arrowLen;

      State.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      State.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      State.ctx.lineWidth = 2;

      State.ctx.beginPath();
      State.ctx.moveTo(pos.x, pos.y);
      State.ctx.lineTo(endX, endY);
      State.ctx.stroke();

      const headLen = 8;
      const headAngle = Math.PI / 6;
      State.ctx.beginPath();
      State.ctx.moveTo(endX, endY);
      State.ctx.lineTo(
        endX - headLen * Math.cos(angle - headAngle),
        endY - headLen * Math.sin(angle - headAngle),
      );
      State.ctx.lineTo(
        endX - headLen * Math.cos(angle + headAngle),
        endY - headLen * Math.sin(angle + headAngle),
      );
      State.ctx.closePath();
      State.ctx.fill();
    }
  }
}
