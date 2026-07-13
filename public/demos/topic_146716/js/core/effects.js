/**
 * Effects Module
 * 特效系统 - 从game.js提取
 * 负责粒子、浮动文字、伤害数字、爆炸等视觉效果
 */

// ============================================================
// EffectsSystem 主对象
// ============================================================
const EffectsSystem = {
  // 场景引用
  scene: null,
  camera: null,
  
  // 粒子池
  particlePool: [],
  particleMeshes: [],
  maxParticles: 100,
  particlePoolInitialized: false,
  
  // 特效数组
  floatingTexts: [],
  damageNumbers: [],
  particles: [],
  
  // 初始化标志
  initialized: false,
  
  // 初始化
  init(scene, camera) {
    if (this.initialized) {
      console.log('[EffectsSystem] Already initialized');
      return;
    }
    
    try {
      this.scene = scene;
      this.camera = camera;
      this.cleanup();
      
      // 延迟初始化粒子池，确保scene已准备好
      setTimeout(() => {
        this.initParticlePool();
      }, 0);
      
      this.initialized = true;
      console.log('[EffectsSystem] Initialized');
    } catch (e) {
      console.error('[EffectsSystem] Initialization failed:', e);
    }
  },
  
  // 初始化粒子池
  initParticlePool() {
    if (!this.scene) {
      console.warn('[EffectsSystem] Cannot init particle pool: scene not ready');
      return;
    }
    
    try {
      // 清理旧的粒子池
      this.clearParticlePool();
      
      this.particlePool = [];
      this.particleMeshes = [];
      
      // 共享几何体和材质以提高性能
      const sharedGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const sharedMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 1
      });
      
      for (let i = 0; i < this.maxParticles; i++) {
        const mesh = new THREE.Mesh(sharedGeometry, sharedMaterial.clone());
        mesh.visible = false;
        mesh.position.set(0, -1000, 0); // 初始位置放在远处
        this.scene.add(mesh);
        
        this.particleMeshes.push(mesh);
        this.particlePool.push({
          mesh: mesh,
          active: false,
          life: 0,
          velocity: new THREE.Vector3()
        });
      }
      
      this.particlePoolInitialized = true;
      console.log(`[EffectsSystem] Particle pool initialized with ${this.maxParticles} particles`);
    } catch (e) {
      console.error('[EffectsSystem] Failed to init particle pool:', e);
    }
  },
  
  // 清理粒子池
  clearParticlePool() {
    for (const mesh of this.particleMeshes) {
      if (mesh && mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh && mesh.material) {
        mesh.material.dispose();
      }
    }
    this.particleMeshes = [];
    this.particlePool = [];
    this.particlePoolInitialized = false;
  },
  
  // 获取空闲粒子
  getParticle() {
    if (!this.particlePoolInitialized) return null;
    
    for (const p of this.particlePool) {
      if (!p.active) {
        p.active = true;
        p.life = 1.0;
        p.mesh.visible = true;
        p.velocity.set(0, 0, 0);
        return p;
      }
    }
    return null;
  },
  
  // 返回粒子到池
  returnParticle(p) {
    if (!p) return;
    p.active = false;
    p.mesh.visible = false;
    p.mesh.position.set(0, -1000, 0); // 移到远处
    p.velocity.set(0, 0, 0);
  },
  
  // 创建爆炸效果
  createExplosion(position, options = {}) {
    if (!this.particlePoolInitialized) {
      console.warn('[EffectsSystem] Particle pool not ready');
      return;
    }
    
    const count = options.count || 10;
    const color = options.color || 0xff6600;
    const size = options.size || 0.2;
    
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;
      
      try {
        p.mesh.position.copy(position);
        p.mesh.material.color.setHex(color);
        p.mesh.scale.setScalar(size);
        p.mesh.material.opacity = 1;
        
        // 随机速度
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        p.velocity.set(
          Math.cos(angle) * speed,
          2 + Math.random() * 3,
          Math.sin(angle) * speed
        );
        
        this.particles.push({
          type: 'explosion',
          particle: p,
          life: 1.0,
          maxLife: 1.0
        });
      } catch (e) {
        console.error('[EffectsSystem] Error creating explosion particle:', e);
        this.returnParticle(p);
      }
    }
  },
  
  // 创建击中效果
  createHitEffect(position, options = {}) {
    if (!this.particlePoolInitialized) return;
    
    const count = options.count || 5;
    const color = options.color || 0xffff00;
    
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;
      
      try {
        p.mesh.position.copy(position);
        p.mesh.material.color.setHex(color);
        p.mesh.scale.setScalar(0.05);
        p.mesh.material.opacity = 1;
        
        // 向外扩散
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        p.velocity.set(
          Math.cos(angle) * speed,
          Math.random() * 2,
          Math.sin(angle) * speed
        );
        
        this.particles.push({
          type: 'hit',
          particle: p,
          life: 0.5,
          maxLife: 0.5
        });
      } catch (e) {
        this.returnParticle(p);
      }
    }
  },
  
  // 创建枪口闪光
  createMuzzleFlash(position, direction) {
    if (!this.scene) return;
    
    try {
      const light = new THREE.PointLight(0xffff00, 1, 5);
      light.position.copy(position);
      this.scene.add(light);
      
      // 短暂显示后移除
      setTimeout(() => {
        if (light.parent) light.parent.remove(light);
      }, 50);
      
      // 添加闪光粒子
      if (this.particlePoolInitialized) {
        const p = this.getParticle();
        if (p) {
          p.mesh.position.copy(position);
          p.mesh.material.color.setHex(0xffffaa);
          p.mesh.scale.setScalar(0.3);
          p.velocity.copy(direction).multiplyScalar(0.5);
          
          this.particles.push({
            type: 'flash',
            particle: p,
            life: 0.1,
            maxLife: 0.1
          });
        }
      }
    } catch (e) {
      console.error('[EffectsSystem] Error creating muzzle flash:', e);
    }
  },
  
  // 创建浮动文字
  createFloatingText(text, position, color = '#ffffff') {
    try {
      const div = document.createElement('div');
      div.textContent = text;
      div.style.cssText = `
        position: absolute;
        color: ${color};
        font-size: 16px;
        font-family: monospace;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        pointer-events: none;
        z-index: 1000;
        transition: opacity 0.5s;
      `;
      document.body.appendChild(div);
      
      this.floatingTexts.push({
        element: div,
        position: position.clone(),
        velocity: new THREE.Vector3(0, 1, 0),
        life: 1.0,
        maxLife: 1.0
      });
    } catch (e) {
      console.error('[EffectsSystem] Error creating floating text:', e);
    }
  },
  
  // 创建伤害数字
  createDamageNumber(damage, position, isCrit = false) {
    const text = isCrit ? `${damage}!` : `${damage}`;
    const color = isCrit ? '#ff0000' : '#ffff00';
    this.createFloatingText(text, position, color);
  },
  
  // 创建治疗数字
  createHealNumber(amount, position) {
    this.createFloatingText(`+${amount}`, position, '#00ff00');
  },
  
  // 创建冲击波
  createShockwave(position, options = {}) {
    if (!this.scene) return;
    
    try {
      const color = options.color || 0xffffff;
      const maxRadius = options.radius || 5;
      const duration = options.duration || 0.5;
      
      const geometry = new THREE.RingGeometry(0.1, 0.3, 32);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
      
      this.particles.push({
        type: 'shockwave',
        mesh: mesh,
        life: duration,
        maxLife: duration,
        maxRadius: maxRadius,
        isMesh: true
      });
    } catch (e) {
      console.error('[EffectsSystem] Error creating shockwave:', e);
    }
  },
  
  // 创建闪电效果
  createLightning(start, end, options = {}) {
    if (!this.scene) return;
    
    try {
      const color = options.color || 0x88ccff;
      const segments = 10;
      
      const points = [];
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const step = direction.clone().divideScalar(segments);
      
      for (let i = 0; i <= segments; i++) {
        const pos = start.clone().add(step.clone().multiplyScalar(i));
        // 添加随机偏移
        pos.x += (Math.random() - 0.5) * length * 0.1;
        pos.y += (Math.random() - 0.5) * length * 0.1;
        pos.z += (Math.random() - 0.5) * length * 0.1;
        points.push(pos);
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      
      this.particles.push({
        type: 'lightning',
        mesh: line,
        life: 0.1,
        maxLife: 0.1,
        isMesh: true
      });
    } catch (e) {
      console.error('[EffectsSystem] Error creating lightning:', e);
    }
  },
  
  // 更新粒子
  updateParticles(dt) {
    if (!this.particlePoolInitialized) return;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      
      if (p.life <= 0) {
        this.removeParticle(p, i);
        continue;
      }
      
      const progress = 1 - (p.life / p.maxLife);
      
      try {
        switch (p.type) {
          case 'explosion':
          case 'hit':
          case 'flash':
            // 更新粒子池中的粒子
            if (p.particle) {
              p.particle.mesh.position.addScaledVector(p.particle.velocity, dt);
              p.particle.velocity.y -= 5 * dt; // 重力
              p.particle.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
            }
            break;
            
          case 'shockwave':
            // 扩大冲击波
            if (p.mesh) {
              const scale = 1 + progress * (p.maxRadius / 0.3);
              p.mesh.scale.setScalar(scale);
              p.mesh.material.opacity = Math.max(0, (1 - progress) * 0.8);
            }
            break;
            
          case 'lightning':
            // 闪电快速消失
            if (p.mesh) {
              p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
            }
            break;
        }
      } catch (e) {
        console.error('[EffectsSystem] Error updating particle:', e);
        this.removeParticle(p, i);
      }
    }
  },
  
  // 更新浮动文字
  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      
      if (ft.life <= 0) {
        if (ft.element && ft.element.parentNode) {
          ft.element.parentNode.removeChild(ft.element);
        }
        this.floatingTexts.splice(i, 1);
        continue;
      }
      
      try {
        // 更新位置
        ft.position.addScaledVector(ft.velocity, dt);
        ft.velocity.y += 2 * dt; // 向上加速
        
        // 更新DOM位置
        if (ft.element) {
          const screenPos = this.worldToScreen(ft.position);
          ft.element.style.left = screenPos.x + 'px';
          ft.element.style.top = screenPos.y + 'px';
          ft.element.style.opacity = Math.max(0, ft.life / ft.maxLife);
        }
      } catch (e) {
        console.error('[EffectsSystem] Error updating floating text:', e);
        if (ft.element && ft.element.parentNode) {
          ft.element.parentNode.removeChild(ft.element);
        }
        this.floatingTexts.splice(i, 1);
      }
    }
  },
  
  // 世界坐标转屏幕坐标
  worldToScreen(position) {
    if (!this.camera) return { x: 0, y: 0 };
    
    try {
      const vector = position.clone();
      vector.project(this.camera);
      
      return {
        x: (vector.x + 1) / 2 * window.innerWidth,
        y: (-vector.y + 1) / 2 * window.innerHeight
      };
    } catch (e) {
      return { x: 0, y: 0 };
    }
  },
  
  // 移除粒子
  removeParticle(p, index) {
    try {
      switch (p.type) {
        case 'explosion':
        case 'hit':
        case 'flash':
          if (p.particle) {
            this.returnParticle(p.particle);
          }
          break;
          
        case 'shockwave':
        case 'lightning':
          if (p.mesh) {
            if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
          }
          break;
      }
    } catch (e) {
      console.error('[EffectsSystem] Error removing particle:', e);
    }
    
    if (index >= 0 && index < this.particles.length) {
      this.particles.splice(index, 1);
    }
  },
  
  // 更新（每帧调用）
  update(dt) {
    if (!this.initialized) return;
    
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
  },
  
  // 清理
  cleanup() {
    // 清理粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.removeParticle(this.particles[i], i);
    }
    this.particles = [];
    
    // 清理浮动文字
    for (const ft of this.floatingTexts) {
      if (ft.element && ft.element.parentNode) {
        ft.element.parentNode.removeChild(ft.element);
      }
    }
    this.floatingTexts = [];
    
    // 清理粒子池
    this.clearParticlePool();
    
    this.initialized = false;
    console.log('[EffectsSystem] Cleaned up');
  }
};

// 导出到全局
window.EffectsSystem = EffectsSystem;
