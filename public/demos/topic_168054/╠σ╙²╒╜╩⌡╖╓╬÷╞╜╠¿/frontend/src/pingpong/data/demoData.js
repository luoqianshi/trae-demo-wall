/**
 * 乒乓球演示模式模拟数据
 * 生成一场120秒比赛的完整分析数据
 * 包含2个球员的轨迹、3D球路轨迹（含抛物线弧度）、落点数据和统计报告
 * 使用固定随机种子保证每次生成的数据一致
 */

// 简单的伪随机数生成器（mulberry32）
function createRng(seed) {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = createRng(20240715)
const rand = (min, max) => min + rng() * (max - min)
const randInt = (min, max) => Math.floor(rand(min, max + 1))

// 比赛总时长：120秒
const duration = 120

/**
 * 生成球员移动轨迹
 * 乒乓球球员在球桌一侧来回移动，主要沿球桌宽度方向（y轴）移动
 * @param {string} side - 'left' 或 'right'
 * @param {number} dur - 比赛总时长
 * @param {number} pointCount - 采样点数量
 * @returns {Array} 轨迹点列表
 */
function generatePlayerTrajectory(side, dur, pointCount) {
  const points = []
  const cx = side === 'left' ? 22 : 78
  const cy = 50
  let x = cx
  let y = cy

  for (let i = 0; i < pointCount; i++) {
    const timestamp = (i / (pointCount - 1)) * dur
    const frame = i
    const oscY = Math.sin(i * 0.25) * 25 + Math.sin(i * 0.13) * 15
    const oscX = Math.cos(i * 0.18) * 8 + Math.sin(i * 0.09) * 5
    const noiseX = (rng() - 0.5) * 4
    const noiseY = (rng() - 0.5) * 6

    const targetX = cx + oscX + noiseX
    const targetY = cy + oscY + noiseY

    x = x * 0.6 + targetX * 0.4
    y = y * 0.6 + targetY * 0.4

    if (side === 'left') {
      x = Math.max(2, Math.min(45, x))
    } else {
      x = Math.max(55, Math.min(98, x))
    }
    y = Math.max(5, Math.min(95, y))

    points.push({
      frame,
      timestamp: Number(timestamp.toFixed(2)),
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    })
  }
  return points
}

/**
 * 生成3D球路轨迹
 * 球在球桌两侧之间来回弹跳，z轴为高度（0-30cm）
 * 包含抛物线弧度，模拟真实乒乓球飞行轨迹
 * @param {number} dur - 比赛总时长
 * @param {number} pointCount - 采样点数量
 * @returns {Array} 3D轨迹点列表
 */
function generateBall3DTrajectory(dur, pointCount) {
  const points = []
  let goingRight = true
  let rallyStart = 0
  const rallyDuration = 2.5

  for (let i = 0; i < pointCount; i++) {
    const timestamp = (i / (pointCount - 1)) * dur
    const frame = i
    const rallyTime = timestamp - rallyStart
    const rallyProgress = rallyTime / rallyDuration

    if (rallyProgress >= 1) {
      goingRight = !goingRight
      rallyStart = timestamp
    }

    const t = Math.min(1, (timestamp - rallyStart) / rallyDuration)
    const x = goingRight ? 20 + t * 60 : 80 - t * 60
    const y = 50 + Math.sin(i * 0.3) * 20 + (rng() - 0.5) * 8
    const maxHeight = rand(20, 30)
    const z = 4 * maxHeight * t * (1 - t)
    const speed = Math.abs(Math.sin(t * Math.PI)) * 15 + 2

    points.push({
      frame,
      timestamp: Number(timestamp.toFixed(2)),
      x: Number(x.toFixed(2)),
      y: Number(Math.max(5, Math.min(95, y)).toFixed(2)),
      z: Number(z.toFixed(2)),
      speed: Number(speed.toFixed(2)),
    })
  }
  return points
}

/**
 * 生成落点数据
 * @param {number} count - 落点数量
 * @returns {Array} 落点列表
 */
function generateLandingPoints(count) {
  const points = []
  let rallyId = 1
  for (let i = 0; i < count; i++) {
    const timestamp = (i / count) * duration
    const isLeftSide = rng() < 0.5
    const x = isLeftSide ? rand(5, 42) : rand(58, 95)
    const yRand = rng()
    let y, zone
    if (yRand < 0.3) {
      y = rand(10, 35)
      zone = 'left'
    } else if (yRand < 0.7) {
      y = rand(35, 65)
      zone = 'center'
    } else {
      y = rand(65, 90)
      zone = 'right'
    }

    points.push({
      frame: Math.floor((i / count) * 300),
      timestamp: Number(timestamp.toFixed(2)),
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      zone,
      rally_id: rallyId,
    })

    if (i % 5 === 4) rallyId++
  }
  return points
}

/**
 * 生成球员统计数据
 * @param {string} side - 'left' 或 'right'
 * @returns {Object} 统计数据
 */
function generatePlayerStats(side) {
  const isLeft = side === 'left'
  return {
    hit_count: isLeft ? 85 : 78,
    rally_count: 12,
    avg_rally_duration: 4.5,
    hit_frequency: isLeft ? 42.5 : 39.0,
    forehand_rate: isLeft ? 60.0 : 55.0,
    backhand_rate: isLeft ? 40.0 : 45.0,
    total_distance: isLeft ? 320.5 : 298.3,
    avg_speed: 0.8,
    max_speed: 2.5,
    near_table_rate: isLeft ? 75.0 : 70.0,
    mid_table_rate: isLeft ? 20.0 : 25.0,
    far_table_rate: isLeft ? 5.0 : 5.0,
    left_landing_rate: isLeft ? 30.0 : 35.0,
    center_landing_rate: isLeft ? 45.0 : 40.0,
    right_landing_rate: isLeft ? 25.0 : 25.0,
  }
}

// 生成2个球员的完整数据
const players = [
  {
    player_id: 1,
    team: 'left',
    trajectory: generatePlayerTrajectory('left', duration, 240),
    stats: generatePlayerStats('left'),
  },
  {
    player_id: 2,
    team: 'right',
    trajectory: generatePlayerTrajectory('right', duration, 240),
    stats: generatePlayerStats('right'),
  },
]

// 生成3D球路轨迹
const ball_3d = {
  trajectory: generateBall3DTrajectory(duration, 360),
}

// 生成落点数据（20个落点）
const landing_points = generateLandingPoints(20)

// 回合数据列表（共12个回合）
const rallies = [
  { rally_id: 1, start_time: 0, end_time: 8.5 },
  { rally_id: 2, start_time: 8.5, end_time: 16.2 },
  { rally_id: 3, start_time: 16.2, end_time: 25.0 },
  { rally_id: 4, start_time: 25.0, end_time: 32.8 },
  { rally_id: 5, start_time: 32.8, end_time: 40.5 },
  { rally_id: 6, start_time: 40.5, end_time: 48.0 },
  { rally_id: 7, start_time: 48.0, end_time: 56.3 },
  { rally_id: 8, start_time: 56.3, end_time: 64.0 },
  { rally_id: 9, start_time: 64.0, end_time: 72.5 },
  { rally_id: 10, start_time: 72.5, end_time: 80.0 },
  { rally_id: 11, start_time: 80.0, end_time: 88.5 },
  { rally_id: 12, start_time: 88.5, end_time: 96.0 },
]

// 全局统计数据
const stats = {
  avg_ball_speed: 7.5,
  max_ball_speed: 15.2,
  avg_net_height: 12.3,
  loop_rate: 40.0,
  drive_rate: 35.0,
  smash_rate: 25.0,
  line_change_count: 18,
  crossline_rate: 55.0,
  straightline_rate: 45.0,
}

// 战术分析报告
const report = `【乒乓球比赛分析报告】

比赛概述：本场为120秒模拟比赛，左侧选手（1号）对阵右侧选手（2号）。双方均为进攻型打法，比赛节奏较快，共进行12个回合，总击球次数163次。

选手整体表现：
左侧选手（1号）：击球85次，正手使用率60%，反手使用率40%，击球频率42.5次/分钟。跑动距离320.5米，近台使用率75%，以快攻结合弧圈球为主。落点分布以中路为主（45%），左路30%，右路25%。
右侧选手（2号）：击球78次，正手使用率55%，反手使用率45%，击球频率39.0次/分钟。跑动距离298.3米，近台使用率70%，打法偏向防守反击。落点分布中路40%，左路35%，右路25%。

技术分析：
1号选手以正手弧圈球为主要进攻手段（40%），快攻占35%，扣杀占25%。球路变化丰富，共18次变线，斜线率55%，直线率45%。平均球速7.5m/s，最高球速15.2m/s，过网高度平均12.3cm。
2号选手反手技术使用更多，防守反击特征明显。在相持阶段表现稳定，但进攻主动性不足。

回合分析：
最长回合持续6.8秒，共22板。平均回合时长4.5秒，平均每回合13.6板。1号选手在发球抢攻阶段表现突出，前3板得分率较高。2号选手在相持阶段稳定性更好，但缺乏有效得分手段。

落点分析：
1号选手的落点集中在对方中路和反手位，有效限制了2号选手的正手进攻。2号选手的落点较为分散，但在关键分上落点质量不够高。

改进建议：
1. 1号选手应继续保持正手进攻的侵略性，同时增加反手位的变化，提高战术多样性。
2. 2号选手需要加强正手进攻比例，提高发球抢攻的得分率。
3. 双方都应注意减少非受迫性失误，特别是在变线时的控制精度。
4. 1号选手可尝试更多短球和台内球技术，增加节奏变化。
5. 2号选手应加强步法移动，提高正手位的覆盖范围。`

export const demoData = {
  players,
  ball_3d,
  landing_points,
  rallies,
  stats,
  report,
  filtered_frames: 350,
  duration,
}
