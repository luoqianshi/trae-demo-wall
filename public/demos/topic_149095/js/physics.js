// 物理引擎 - 引力计算和运动更新

function calculateForces() {
  for (let i = 0; i < State.bodies.length; i++) {
    State.bodies[i].ax = 0;
    State.bodies[i].ay = 0;
  }

  for (let i = 0; i < State.bodies.length; i++) {
    for (let j = i + 1; j < State.bodies.length; j++) {
      const dx = State.bodies[j].x - State.bodies[i].x;
      const dy = State.bodies[j].y - State.bodies[i].y;
      const distSq = dx * dx + dy * dy + State.softening * State.softening;
      const dist = Math.sqrt(distSq);
      const force = (State.G * State.bodies[i].mass * State.bodies[j].mass) / distSq;

      const fx = (force * dx) / dist;
      const fy = (force * dy) / dist;

      State.bodies[i].ax += fx / State.bodies[i].mass;
      State.bodies[i].ay += fy / State.bodies[i].mass;
      State.bodies[j].ax -= fx / State.bodies[j].mass;
      State.bodies[j].ay -= fy / State.bodies[j].mass;
    }
  }
}

function updatePhysics() {
  calculateForces();

  for (const body of State.bodies) {
    body.vx += body.ax * State.dt;
    body.vy += body.ay * State.dt;
    body.x += body.vx * State.dt;
    body.y += body.vy * State.dt;

    body.trail.push({ x: body.x, y: body.y, t: State.simulationTime });
  }

  State.simulationTime += State.dt;
}
