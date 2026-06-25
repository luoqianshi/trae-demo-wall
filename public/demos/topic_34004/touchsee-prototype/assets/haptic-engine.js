// ============================================================
// TouchSee Haptic Engine — 触觉语法引擎核心逻辑
// ============================================================
(function (global) {
  'use strict';

  // ====== 1. 电机阵列布局 (20 点 LRA) ======
  // 坐标基于 viewBox 0 0 200 400
  const MOTOR_LAYOUT = [
    // 前面 (front) — 10 个电机
    { id: 'M01', region: 'left-front-shoulder',  side: 'front', x: 58,  y: 78,  label: '左前肩' },
    { id: 'M02', region: 'right-front-shoulder', side: 'front', x: 142, y: 78,  label: '右前肩' },
    { id: 'M03', region: 'front-chest-lu',       side: 'front', x: 72,  y: 135, label: '前胸左上' },
    { id: 'M04', region: 'front-chest-cu',       side: 'front', x: 100, y: 135, label: '前胸中上' },
    { id: 'M05', region: 'front-chest-ru',       side: 'front', x: 128, y: 135, label: '前胸右上' },
    { id: 'M06', region: 'front-chest-ld',       side: 'front', x: 72,  y: 195, label: '前胸左下' },
    { id: 'M07', region: 'front-chest-cd',       side: 'front', x: 100, y: 195, label: '前胸中下' },
    { id: 'M08', region: 'front-chest-rd',       side: 'front', x: 128, y: 195, label: '前胸右下' },
    { id: 'M09', region: 'left-front-waist',     side: 'front', x: 48,  y: 260, label: '左前腰' },
    { id: 'M10', region: 'right-front-waist',    side: 'front', x: 152, y: 260, label: '右前腰' },
    // 背面 (back) — 10 个电机
    { id: 'M11', region: 'left-back-shoulder',   side: 'back',  x: 58,  y: 78,  label: '左后肩' },
    { id: 'M12', region: 'right-back-shoulder',  side: 'back',  x: 142, y: 78,  label: '右后肩' },
    { id: 'M13', region: 'back-lu',              side: 'back',  x: 72,  y: 135, label: '后背左上' },
    { id: 'M14', region: 'back-cu',              side: 'back',  x: 100, y: 135, label: '后背中上' },
    { id: 'M15', region: 'back-ru',              side: 'back',  x: 128, y: 135, label: '后背右上' },
    { id: 'M16', region: 'back-ld',              side: 'back',  x: 72,  y: 195, label: '后背左下' },
    { id: 'M17', region: 'back-cd',              side: 'back',  x: 100, y: 195, label: '后背中下' },
    { id: 'M18', region: 'back-rd',              side: 'back',  x: 128, y: 195, label: '后背右下' },
    { id: 'M19', region: 'left-back-waist',      side: 'back',  x: 48,  y: 260, label: '左后腰' },
    { id: 'M20', region: 'right-back-waist',     side: 'back',  x: 152, y: 260, label: '右后腰' },
  ];

  // ====== 2. 方向 → 身体区域映射 ======
  // 返回 { front: [motorIds], back: [motorIds] }
  function mapDirection(azimuth, elevation) {
    var az = ((azimuth % 360) + 360) % 360; // normalize to 0-360
    if (az > 180) az -= 360; // normalize to -180~180

    var front = [];
    var back = [];

    // 俯仰角优先判断（上方/下方覆盖常规方向）
    if (elevation > 30) {
      // 上方/悬空 → 双肩
      front = ['M01', 'M02'];
      back = ['M11', 'M12'];
    } else if (elevation < -20) {
      // 下方/地面 → 下腰/腹部
      front = ['M06', 'M07', 'M08'];
      back = ['M16', 'M17', 'M18'];
    } else {
      // 常规水平方向
      if (az >= -15 && az <= 15) {
        // 正前方
        front = ['M04', 'M07'];
      } else if (az > -45 && az <= -15) {
        // 左前方
        front = ['M03', 'M06', 'M01'];
      } else if (az >= 15 && az < 45) {
        // 右前方
        front = ['M05', 'M08', 'M02'];
      } else if (az > -75 && az <= -45) {
        // 左侧
        front = ['M09'];
      } else if (az >= 45 && az < 75) {
        // 右侧
        front = ['M10'];
      } else if (az > -105 && az <= -75) {
        // 左后侧
        back = ['M13', 'M16'];
      } else if (az >= 75 && az < 105) {
        // 右后侧
        back = ['M15', 'M18'];
      } else if (az > -150 && az <= -105) {
        // 左后方
        back = ['M11', 'M19'];
      } else if (az >= 105 && az < 150) {
        // 右后方
        back = ['M12', 'M20'];
      } else {
        // 正后方 (±150~±180)
        back = ['M14', 'M17'];
      }
    }

    return { front: front, back: back, all: front.concat(back) };
  }

  // 获取方向文字描述
  function getDirectionLabel(azimuth, elevation) {
    if (elevation > 30) return '上方/悬空';
    if (elevation < -20) return '下方/地面';
    var az = ((azimuth % 360) + 360) % 360;
    if (az > 180) az -= 360;
    if (az >= -15 && az <= 15) return '正前方';
    if (az > -45 && az <= -15) return '左前方';
    if (az >= 15 && az < 45) return '右前方';
    if (az > -75 && az <= -45) return '左侧';
    if (az >= 45 && az < 75) return '右侧';
    if (az > -105 && az <= -75) return '左后侧';
    if (az >= 75 && az < 105) return '右后侧';
    if (az > -150 && az <= -105) return '左后方';
    if (az >= 105 && az < 150) return '右后方';
    return '正后方';
  }

  // ====== 3. 距离 → 频率/强度/颜色/声音映射 ======
  var DISTANCE_ZONES = [
    { min: 4.0, max: Infinity, label: '远距/感知',   freq: 2,  intensity: 0.30, color: '#3B82F6', colorName: '蓝', semantic: '知晓存在', soundTrigger: false, soundFreq: 0,    soundVolume: 0   },
    { min: 2.0, max: 4.0,      label: '中距/注意',   freq: 4,  intensity: 0.60, color: '#FBBF24', colorName: '黄', semantic: '留意靠近', soundTrigger: false, soundFreq: 0,    soundVolume: 0   },
    { min: 1.0, max: 2.0,      label: '近距/警示',   freq: 8,  intensity: 0.85, color: '#F97316', colorName: '橙', semantic: '准备避让', soundTrigger: true,  soundFreq: 600,  soundVolume: 0.3 },
    { min: 0.0, max: 1.0,      label: '危险/紧急',   freq: 16, intensity: 1.00, color: '#EF4444', colorName: '红', semantic: '立即停下', soundTrigger: true,  soundFreq: 1000, soundVolume: 0.6 },
  ];

  function mapDistance(distance) {
    for (var i = 0; i < DISTANCE_ZONES.length; i++) {
      var z = DISTANCE_ZONES[i];
      if (distance >= z.min && distance < z.max) {
        // 连续频率计算
        var freq = Math.max(2, Math.min(16, 2 + (4 - distance) * 3.5));
        var intensity = Math.max(0.3, Math.min(1, 1 - (distance - 0.5) / 4.5));
        return {
          zone: z,
          freq: Math.round(freq * 10) / 10,
          intensity: Math.round(intensity * 100) / 100,
          color: z.color,
          colorName: z.colorName,
          label: z.label,
          semantic: z.semantic,
          soundTrigger: z.soundTrigger,
          soundFreq: z.soundFreq,
          soundVolume: z.soundVolume,
        };
      }
    }
    // 默认远距
    return { zone: DISTANCE_ZONES[0], freq: 2, intensity: 0.3, color: '#3B82F6', colorName: '蓝', label: '远距/感知', semantic: '知晓存在', soundTrigger: false, soundFreq: 0, soundVolume: 0 };
  }

  // ====== 4. 障碍物类型 → 触觉节奏模式 ======
  var TYPE_PATTERNS = {
    person:    { label: '行人',   rhythm: '● ○ ● ○',   pattern: '规律中频脉冲', desc: '移动主体，持续关注',   priority: 3 },
    vehicle:   { label: '车辆',   rhythm: '▓ ▓ ▓ ▓',   pattern: '低频强震',     desc: '大型快速威胁',         priority: 5 },
    stairs:    { label: '台阶',   rhythm: '●●● ○ ●●●', pattern: '三连击',       desc: '暗示层级/上下',        priority: 2 },
    doorframe: { label: '门框',   rhythm: '○(左)(右)○', pattern: '两侧对称轻触', desc: '可通过的通道',         priority: 1 },
    overhead:  { label: '悬空物', rhythm: '●●(肩)●●',  pattern: '双肩高频',     desc: '注意头部',             priority: 4 },
    wall:      { label: '墙壁',   rhythm: '▓▓▓▓',      pattern: '区域持续低震', desc: '前方阻挡',             priority: 3 },
    pole:      { label: '柱子',   rhythm: '● ○○○ ●',  pattern: '单点强脉冲',   desc: '细窄障碍',             priority: 2 },
  };

  // ====== 5. 触觉引擎核心：解析障碍物列表 → 电机状态 ======
  // 输入: [{ azimuth, elevation, distance, type, confidence }]
  // 输出: Map<motorId, { freq, intensity, color, pattern, type, zone }>
  function resolveHaptics(obstacles) {
    var motorStates = {}; // motorId → state

    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      var dir = mapDirection(obs.azimuth, obs.elevation);
      var dist = mapDistance(obs.distance);
      var typePattern = TYPE_PATTERNS[obs.type] || TYPE_PATTERNS.person;

      var motorIds = dir.all;
      for (var j = 0; j < motorIds.length; j++) {
        var mid = motorIds[j];
        var existing = motorStates[mid];

        // 仲裁：同区域取最高优先级（类型 priority + 距离紧迫度）
        var currentPriority = typePattern.priority + (4 - Math.min(3, Math.floor(dist.zone.label === '危险/紧急' ? 0 : dist.zone.label === '近距/警示' ? 1 : dist.zone.label === '中距/注意' ? 2 : 3)));

        if (!existing || currentPriority >= existing._priority) {
          motorStates[mid] = {
            freq: dist.freq,
            intensity: dist.intensity,
            color: dist.color,
            pattern: typePattern.pattern,
            type: obs.type,
            typeLabel: typePattern.label,
            zone: dist.label,
            distance: obs.distance,
            azimuth: obs.azimuth,
            elevation: obs.elevation,
            _priority: currentPriority,
          };
        }
      }
    }

    // 清理内部字段
    var result = {};
    for (var key in motorStates) {
      var s = motorStates[key];
      delete s._priority;
      result[key] = s;
    }
    return result;
  }

  // ====== 6. SVG 人体模型生成 ======
  function createBodySVG(view, size) {
    size = size || 200;
    var motors = MOTOR_LAYOUT.filter(function (m) { return m.side === view; });

    var svgParts = [];
    svgParts.push('<svg class="body-svg" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg" style="width:' + size + 'px">');

    // 人体轮廓
    if (view === 'front') {
      // 头部
      svgParts.push('<circle class="body-fill" cx="100" cy="35" r="22"/>');
      // 颈部
      svgParts.push('<rect class="body-fill" x="92" y="55" width="16" height="15" rx="4"/>');
      // 躯干 (肩到腰)
      svgParts.push('<path class="body-fill" d="M 45,80 Q 40,75 50,72 L 75,68 Q 85,66 100,66 Q 115,66 125,68 L 150,72 Q 160,75 155,80 L 158,160 Q 160,220 155,270 L 145,290 Q 130,295 100,295 Q 70,295 55,290 L 45,270 Q 40,220 42,160 Z"/>');
      // 手臂
      svgParts.push('<path class="body-fill" d="M 45,80 Q 30,90 28,140 Q 26,200 30,250 L 38,255 Q 42,200 44,140 Q 46,95 52,82 Z"/>');
      svgParts.push('<path class="body-fill" d="M 155,80 Q 170,90 172,140 Q 174,200 170,250 L 162,255 Q 158,200 156,140 Q 154,95 148,82 Z"/>');
    } else {
      // 背面 — 头部
      svgParts.push('<circle class="body-fill" cx="100" cy="35" r="22"/>');
      // 颈部
      svgParts.push('<rect class="body-fill" x="92" y="55" width="16" height="15" rx="4"/>');
      // 躯干 (背面)
      svgParts.push('<path class="body-fill" d="M 45,80 Q 40,75 50,72 L 75,68 Q 85,66 100,66 Q 115,66 125,68 L 150,72 Q 160,75 155,80 L 158,160 Q 160,220 155,270 L 145,290 Q 130,295 100,295 Q 70,295 55,290 L 45,270 Q 40,220 42,160 Z"/>');
      // 手臂
      svgParts.push('<path class="body-fill" d="M 45,80 Q 30,90 28,140 Q 26,200 30,250 L 38,255 Q 42,200 44,140 Q 46,95 52,82 Z"/>');
      svgParts.push('<path class="body-fill" d="M 155,80 Q 170,90 172,140 Q 174,200 170,250 L 162,255 Q 158,200 156,140 Q 154,95 148,82 Z"/>');
      // 脊柱线
      svgParts.push('<line x1="100" y1="70" x2="100" y2="280" stroke="rgba(30,58,95,0.5)" stroke-width="1" stroke-dasharray="3,3"/>');
    }

    // 视图标签
    svgParts.push('<text class="body-view-label" x="100" y="380">' + (view === 'front' ? '正面视图' : '背面视图') + '</text>');

    // 电机节点
    for (var i = 0; i < motors.length; i++) {
      var m = motors[i];
      svgParts.push('<g class="motor-node" data-id="' + m.id + '" data-region="' + m.region + '" transform="translate(' + m.x + ',' + m.y + ')">');
      svgParts.push('<circle class="halo" r="12"/>');
      svgParts.push('<circle class="ripple" r="5"/>');
      svgParts.push('<circle class="core" r="4"/>');
      svgParts.push('<text class="motor-label" y="16">' + m.id + '</text>');
      svgParts.push('</g>');
    }

    svgParts.push('</svg>');
    return svgParts.join('');
  }

  // ====== 7. 更新电机状态到 DOM ======
  function updateMotorStates(container, motorStates, view) {
    var nodes = container.querySelectorAll('.motor-node');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var mid = node.getAttribute('data-id');
      var motor = MOTOR_LAYOUT.find(function (m) { return m.id === mid; });
      if (!motor || motor.side !== view) {
        node.classList.remove('active');
        continue;
      }
      var state = motorStates[mid];
      if (state) {
        node.classList.add('active');
        node.style.setProperty('--freq', (1000 / state.freq) + 'ms');
        node.style.setProperty('--intensity', state.intensity);
        node.style.setProperty('--color', state.color);
      } else {
        node.classList.remove('active');
        node.style.removeProperty('--freq');
        node.style.removeProperty('--intensity');
        node.style.removeProperty('--color');
      }
    }
  }

  // ====== 8. 清除所有电机状态 ======
  function clearAllMotors(container) {
    var nodes = container.querySelectorAll('.motor-node');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove('active');
      nodes[i].style.removeProperty('--freq');
      nodes[i].style.removeProperty('--intensity');
      nodes[i].style.removeProperty('--color');
    }
  }

  // ====== 9. 轨迹插值 ======
  function interpolateTrajectory(trajectory, t) {
    if (!trajectory || trajectory.length === 0) return null;
    if (t <= trajectory[0].t) return trajectory[0];
    if (t >= trajectory[trajectory.length - 1].t) return trajectory[trajectory.length - 1];

    for (var i = 0; i < trajectory.length - 1; i++) {
      var p1 = trajectory[i];
      var p2 = trajectory[i + 1];
      if (t >= p1.t && t <= p2.t) {
        var ratio = (t - p1.t) / (p2.t - p1.t);
        return {
          azimuth: p1.azimuth + (p2.azimuth - p1.azimuth) * ratio,
          elevation: p1.elevation + (p2.elevation - p1.elevation) * ratio,
          distance: p1.distance + (p2.distance - p1.distance) * ratio,
          confidence: p1.confidence + (p2.confidence - p1.confidence) * ratio,
        };
      }
    }
    return trajectory[trajectory.length - 1];
  }

  // ====== 导出 ======
  global.TouchSee = global.TouchSee || {};
  global.TouchSee.Engine = {
    MOTOR_LAYOUT: MOTOR_LAYOUT,
    DISTANCE_ZONES: DISTANCE_ZONES,
    TYPE_PATTERNS: TYPE_PATTERNS,
    mapDirection: mapDirection,
    getDirectionLabel: getDirectionLabel,
    mapDistance: mapDistance,
    resolveHaptics: resolveHaptics,
    createBodySVG: createBodySVG,
    updateMotorStates: updateMotorStates,
    clearAllMotors: clearAllMotors,
    interpolateTrajectory: interpolateTrajectory,
  };
})(window);
