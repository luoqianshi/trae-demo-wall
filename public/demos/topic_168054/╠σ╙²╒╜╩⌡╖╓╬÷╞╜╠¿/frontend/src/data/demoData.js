/**
 * 演示模式模拟数据
 * 生成一场45分钟比赛的完整分析数据，包含22个球员（11v11）的轨迹、统计和战术报告
 * 基于真实足球运动模式：球员围绕位置中心活动，有走/慢跑/冲刺区分，
 * 球轨迹模拟传球与运球，非随机游走
 */

// 简单的伪随机数生成器（mulberry32），保证每次生成的数据一致
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

const rng = createRng(20240615)
const rand = (min, max) => min + rng() * (max - min)
const randInt = (min, max) => Math.floor(rand(min, max + 1))

// 22名球员配置：11v11，4-3-3阵型
// 红队从左向右进攻，蓝队从右向左进攻
// cx/cy 为活动中心（球场坐标0-100），roamRadius 为常态游走半径
// role: gk(守门员) / def(后卫) / mid(中场) / fwd(前锋)
// 红队从左向右进攻（x增大），蓝队从右向左进攻（x减小）
// 后卫冲刺前插限制在本方2/3区域，中场和前锋可全场跑动
const playerConfigs = [
  // 红队（team_a）4-3-3阵型
  { id: 1,  team: 'team_a', position: '守门员',  cx: 5,  cy: 50, role: 'gk',  roamRadius: 5,  sprintChance: 0.02 },
  { id: 2,  team: 'team_a', position: '左后卫',  cx: 20, cy: 78, role: 'def', roamRadius: 22, sprintChance: 0.08 },
  { id: 3,  team: 'team_a', position: '中后卫',  cx: 18, cy: 58, role: 'def', roamRadius: 20, sprintChance: 0.07 },
  { id: 4,  team: 'team_a', position: '中后卫',  cx: 18, cy: 42, role: 'def', roamRadius: 20, sprintChance: 0.07 },
  { id: 5,  team: 'team_a', position: '右后卫',  cx: 20, cy: 22, role: 'def', roamRadius: 22, sprintChance: 0.08 },
  { id: 6,  team: 'team_a', position: '后腰',    cx: 35, cy: 50, role: 'mid', roamRadius: 28, sprintChance: 0.12 },
  { id: 7,  team: 'team_a', position: '左中场',  cx: 45, cy: 72, role: 'mid', roamRadius: 32, sprintChance: 0.14 },
  { id: 8,  team: 'team_a', position: '右中场',  cx: 45, cy: 28, role: 'mid', roamRadius: 32, sprintChance: 0.14 },
  { id: 9,  team: 'team_a', position: '左边锋',  cx: 65, cy: 78, role: 'fwd', roamRadius: 38, sprintChance: 0.18 },
  { id: 10, team: 'team_a', position: '中锋',    cx: 70, cy: 50, role: 'fwd', roamRadius: 35, sprintChance: 0.16 },
  { id: 11, team: 'team_a', position: '右边锋',  cx: 65, cy: 22, role: 'fwd', roamRadius: 38, sprintChance: 0.18 },
  // 蓝队（team_b）4-3-3阵型
  { id: 12, team: 'team_b', position: '守门员',  cx: 95, cy: 50, role: 'gk',  roamRadius: 5,  sprintChance: 0.02 },
  { id: 13, team: 'team_b', position: '左后卫',  cx: 80, cy: 78, role: 'def', roamRadius: 22, sprintChance: 0.08 },
  { id: 14, team: 'team_b', position: '中后卫',  cx: 82, cy: 58, role: 'def', roamRadius: 20, sprintChance: 0.07 },
  { id: 15, team: 'team_b', position: '中后卫',  cx: 82, cy: 42, role: 'def', roamRadius: 20, sprintChance: 0.07 },
  { id: 16, team: 'team_b', position: '右后卫',  cx: 80, cy: 22, role: 'def', roamRadius: 22, sprintChance: 0.08 },
  { id: 17, team: 'team_b', position: '后腰',    cx: 65, cy: 50, role: 'mid', roamRadius: 28, sprintChance: 0.12 },
  { id: 18, team: 'team_b', position: '左中场',  cx: 55, cy: 72, role: 'mid', roamRadius: 32, sprintChance: 0.14 },
  { id: 19, team: 'team_b', position: '右中场',  cx: 55, cy: 28, role: 'mid', roamRadius: 32, sprintChance: 0.14 },
  { id: 20, team: 'team_b', position: '左边锋',  cx: 35, cy: 78, role: 'fwd', roamRadius: 38, sprintChance: 0.18 },
  { id: 21, team: 'team_b', position: '中锋',    cx: 30, cy: 50, role: 'fwd', roamRadius: 35, sprintChance: 0.16 },
  { id: 22, team: 'team_b', position: '右边锋',  cx: 35, cy: 22, role: 'fwd', roamRadius: 38, sprintChance: 0.18 },
]

/**
 * 根据活动中心坐标生成主区域名称
 */
function getMainZone(cx, cy) {
  if (cx < 10 || cx > 90) return '球门区'
  let vertical
  if (cx < 33) vertical = '防守'
  else if (cx < 66) vertical = '中场'
  else vertical = '进攻'
  let horizontal
  if (cy < 35) horizontal = '左路'
  else if (cy <= 65) horizontal = '中路'
  else horizontal = '右路'
  return vertical + horizontal
}

/**
 * 生成单个球员的轨迹
 * 模拟真实运动模式：大部分时间在活动中心附近慢跑，
 * 偶尔前插或回防（冲刺），有速度变化
 * 后卫限制在本方2/3区域，中场和前锋可全场跑动
 */
function generateTrajectory(config, duration, pointCount) {
  const points = []
  const { cx, cy, roamRadius, sprintChance, role, team } = config
  // 进攻方向：红队向右(x增大)，蓝队向左(x减小)
  const forwardDir = team === 'team_a' ? 1 : -1
  // 后卫前插限制线：红队后卫不超过 x=65，蓝队后卫不低于 x=35（约2/3线）
  const maxForwardX = role === 'def' ? (team === 'team_a' ? 65 : 35) : 99
  const minBackX = role === 'def' ? (team === 'team_a' ? 2 : 98) : 1

  let x = cx
  let y = cy
  // 当前运动目标
  let targetX = cx + (rng() - 0.5) * roamRadius
  let targetY = cy + (rng() - 0.5) * roamRadius
  let moveTimer = 0

  for (let i = 0; i < pointCount; i++) {
    const timestamp = (i / (pointCount - 1)) * duration
    const frame = i

    moveTimer--
    if (moveTimer <= 0) {
      const roll = rng()
      if (roll < sprintChance) {
        // 冲刺前插：朝进攻方向长距离跑动
        const sprintDist = rand(20, 45)
        targetX = cx + forwardDir * sprintDist + (rng() - 0.5) * 15
        targetY = cy + (rng() - 0.5) * roamRadius * 1.8
        moveTimer = randInt(6, 14)
      } else if (roll < sprintChance + 0.12) {
        // 回防/回撤：朝本方半场移动
        const backDist = rand(10, 25)
        targetX = cx - forwardDir * backDist + (rng() - 0.5) * 10
        targetY = cy + (rng() - 0.5) * roamRadius * 1.5
        moveTimer = randInt(8, 16)
      } else if (roll < sprintChance + 0.35) {
        // 中等跑动：大范围位置调整
        targetX = cx + (rng() - 0.5) * roamRadius * 2.2
        targetY = cy + (rng() - 0.5) * roamRadius * 2.2
        moveTimer = randInt(10, 22)
      } else {
        // 慢跑/走位
        targetX = cx + (rng() - 0.5) * roamRadius
        targetY = cy + (rng() - 0.5) * roamRadius
        moveTimer = randInt(12, 25)
      }

      // 后卫限制：不超2/3线
      if (role === 'def') {
        targetX = team === 'team_a'
          ? Math.min(maxForwardX, Math.max(minBackX, targetX))
          : Math.max(maxForwardX, Math.min(minBackX, targetX))
      }
      // 守门员限制在禁区附近
      if (role === 'gk') {
        targetX = team === 'team_a'
          ? Math.min(15, Math.max(1, targetX))
          : Math.max(85, Math.min(99, targetX))
      }
    }

    // 平滑移动到目标
    const dx = targetX - x
    const dy = targetY - y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const moveSpeed = Math.min(0.18, 0.05 + dist * 0.004)
    x += dx * moveSpeed
    y += dy * moveSpeed

    // 微小抖动
    x += (rng() - 0.5) * 0.4
    y += (rng() - 0.5) * 0.4

    // 限制范围
    x = Math.max(1, Math.min(99, x))
    y = Math.max(1, Math.min(99, y))

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
 * 生成足球轨迹
 * 模拟真实比赛：球在不同球员间传递，有传球（快速移动）和运球（跟随球员）阶段
 */
function generateBallTrajectory(duration, pointCount, players) {
  const points = []
  // 从中圈开球
  let x = 50
  let y = 50

  // 传球状态机
  let phase = 'pass' // 'pass'(传球中) / 'dribble'(运球中) / 'loose'(无人控制)
  let phaseTimer = 0
  let passTargetX = 0
  let passTargetY = 0
  let passStartX = 0
  let passStartY = 0
  let passProgress = 0
  let passDuration = 0
  let ballHolder = null

  // 选一个初始持球球员
  const homePlayers = players.filter(p => p.team === 'team_a')
  ballHolder = homePlayers[Math.floor(rng() * homePlayers.length)]

  for (let i = 0; i < pointCount; i++) {
    const timestamp = (i / (pointCount - 1)) * duration
    const frame = i

    phaseTimer--

    if (phase === 'dribble' && ballHolder) {
      // 运球：球跟随持球球员位置，稍微偏前
      const holderTraj = ballHolder.trajectory
      const trajIdx = Math.min(Math.floor((i / pointCount) * holderTraj.length), holderTraj.length - 1)
      const holderPos = holderTraj[trajIdx]
      const forwardDir = ballHolder.team === 'team_a' ? 1 : -1
      // 球在球员脚下前方一点
      const targetX = holderPos.x + forwardDir * 2
      const targetY = holderPos.y + (rng() - 0.5) * 3
      x = x * 0.6 + targetX * 0.4
      y = y * 0.6 + targetY * 0.4

      if (phaseTimer <= 0) {
        // 决定下一步：传球或丢失球权
        const roll = rng()
        if (roll < 0.6) {
          // 传球：选一个队友作为目标
          const teammates = players.filter(p => p.team === ballHolder.team && p.player_id !== ballHolder.player_id)
          const receiver = teammates[Math.floor(rng() * teammates.length)]
          const receiverTraj = receiver.trajectory
          const receiverIdx = Math.min(Math.floor((i / pointCount) * receiverTraj.length) + randInt(3, 8), receiverTraj.length - 1)
          const receiverPos = receiverTraj[Math.max(0, receiverIdx)]
          passStartX = x
          passStartY = y
          passTargetX = receiverPos.x + (rng() - 0.5) * 4
          passTargetY = receiverPos.y + (rng() - 0.5) * 4
          passProgress = 0
          passDuration = randInt(3, 7)
          phase = 'pass'
          ballHolder = receiver // 预计接球者
          phaseTimer = passDuration
        } else if (roll < 0.8) {
          // 被对方抢断
          const opponents = players.filter(p => p.team !== ballHolder.team)
          const interceptor = opponents[Math.floor(rng() * opponents.length)]
          ballHolder = interceptor
          phaseTimer = randInt(10, 20)
        } else {
          // 继续运球
          phaseTimer = randInt(10, 25)
        }
      }
    } else if (phase === 'pass') {
      // 传球：球从起点快速移动到目标点
      passProgress += 1 / Math.max(1, passDuration)
      if (passProgress >= 1) {
        passProgress = 1
        phase = 'dribble'
        phaseTimer = randInt(15, 35)
        x = passTargetX
        y = passTargetY
      } else {
        // 使用缓动函数让传球更自然（先快后慢）
        const t = passProgress
        const eased = t * (2 - t)
        x = passStartX + (passTargetX - passStartX) * eased
        y = passStartY + (passTargetY - passStartY) * eased
        // 加一点弧线感
        const midX = (passStartX + passTargetX) / 2
        const midY = (passStartY + passTargetY) / 2
        const perpX = -(passTargetY - passStartY)
        const perpY = (passTargetX - passStartX)
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1
        const arcHeight = 3 * Math.sin(t * Math.PI)
        x += (perpX / perpLen) * arcHeight * 0.3
        y += (perpY / perpLen) * arcHeight * 0.3
      }
    } else {
      // 无人控制状态（争抢中），球随机弹跳
      x += (rng() - 0.5) * 3
      y += (rng() - 0.5) * 3
      if (phaseTimer <= 0) {
        // 最近的人获得球权
        let minDist = Infinity
        let closest = null
        for (const p of players) {
          const traj = p.trajectory
          const idx = Math.min(Math.floor((i / pointCount) * traj.length), traj.length - 1)
          const pos = traj[idx]
          const d = (pos.x - x) ** 2 + (pos.y - y) ** 2
          if (d < minDist) {
            minDist = d
            closest = p
          }
        }
        ballHolder = closest
        phase = 'dribble'
        phaseTimer = randInt(10, 20)
      }
    }

    x = Math.max(1, Math.min(99, x))
    y = Math.max(1, Math.min(99, y))

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
 * 根据位置生成统计数据
 */
function generateStats(config) {
  const isGoalkeeper = config.position === '守门员'
  const isForward = ['左边锋', '中锋', '右边锋'].includes(config.position)
  const isMidfielder = ['后腰', '左中场', '右中场'].includes(config.position)
  const isDefender = ['左后卫', '中后卫', '右后卫'].includes(config.position)

  return {
    total_distance: isGoalkeeper ? rand(2200, 3200) : rand(7000, 10500),
    possession_rate: isGoalkeeper ? rand(2, 6) : isForward ? rand(10, 22) : isMidfielder ? rand(12, 20) : rand(6, 14),
    pass_count: isGoalkeeper ? randInt(10, 20) : isMidfielder ? randInt(35, 55) : isDefender ? randInt(25, 40) : randInt(15, 30),
    pass_success_rate: isGoalkeeper ? rand(82, 96) : isMidfielder ? rand(75, 92) : isDefender ? rand(70, 88) : rand(65, 85),
    shot_count: isGoalkeeper ? 0 : isForward ? randInt(3, 7) : isMidfielder ? randInt(1, 4) : randInt(0, 2),
    avg_speed: isGoalkeeper ? rand(1.0, 1.6) : isForward ? rand(2.0, 3.0) : isMidfielder ? rand(1.8, 2.6) : rand(1.5, 2.2),
    max_speed: isGoalkeeper ? rand(4, 5.5) : isForward ? rand(7, 10) : isMidfielder ? rand(6, 8.5) : rand(5.5, 7.5),
    main_zone: getMainZone(config.cx, config.cy),
  }
}

// 比赛总时长：45分钟 = 2700秒
const duration = 2700

// 生成22个球员的完整数据
const players = playerConfigs.map((config) => ({
  player_id: config.id,
  team: config.team,
  position: config.position,
  trajectory: generateTrajectory(config, duration, 240),
  stats: generateStats(config),
}))

// 生成足球轨迹（基于球员位置，模拟真实传球）
const ball = {
  trajectory: generateBallTrajectory(duration, 360, players),
}

// 战术分析报告
const report = `【战术分析报告】

比赛概述：本场为45分钟模拟比赛，红队（4-3-3阵型）对阵蓝队（4-3-3阵型），双方均为11人完整阵容。红队主场由左向右进攻，蓝队客场由右向左进攻。

球队整体表现：
红队控球率54%，整体偏向左路进攻，左路边锋9号表现活跃，多次突破蓝队右后卫16号的防守。中场核心6号（后腰）跑动距离达9.8km，覆盖面积大，是攻防转换枢纽。中锋10号在进攻中路创造了5次射门机会。
蓝队控球率46%，防守组织严密，4名后卫防线紧凑。蓝队反击主要通过右边锋22号的速度优势，在右路制造了多次威胁。中场17号（后腰）承担大量防守任务，跑动距离9.2km。

关键球员分析：
- 6号（红队·后腰）：跑动距离9.8km，持球率18.2%，传球48次成功率88%，全场跑动距离最高，攻防两端贡献突出。
- 10号（红队·中锋）：跑动距离8.5km，射门5次，持球率19.5%，前插跑动频繁，主要活动在进攻中路。
- 9号（红队·左边锋）：跑动距离8.8km，射门4次，持球率16.8%，左路突破犀利，多次制造角球机会。
- 17号（蓝队·后腰）：跑动距离9.2km，持球率17.5%，传球42次成功率85%，中场拦截能力强。
- 21号（蓝队·中锋）：跑动距离7.6km，射门3次，回撤参与组织，活动区域覆盖中场至前场。
- 22号（蓝队·右边锋）：跑动距离8.3km，射门3次，速度优势明显，最高速度达9.5m/s。

进攻分析：
红队进攻主要集中在左路（占42%），中路占35%，右路偏弱（占23%）。左后卫2号前插助攻频繁，与左中场7号、左边锋9号形成有效的左路进攻三角。中锋10号在中路的跑位拉扯了蓝队中后卫14号和15号的防线。
蓝队进攻以快速反击为主，主要通过右边锋22号的速度突破红队左路。但中锋21号回撤较深，导致前场接应点不足，进攻终结能力有限。

防守分析：
红队整体防线靠前，中后卫3号和4号防守稳健，拦截成功率高。但左后卫2号前插后身后空间较大，被蓝队22号多次利用。
蓝队中场拦截不足，后腰17号独自承担中场防守压力较大。建议加强中场防守密度，压缩红队中场组织空间。

改进建议：
1. 红队应加强右路进攻配合，提高右后卫5号和右边锋11号的前插参与度，平衡左右路进攻比例。
2. 红队需注意左路身后空间，左后卫2号前插时中后卫3号应加强左路补位。
3. 蓝队应提高前场压迫强度，减少中后场被动防守的压力。
4. 蓝队中锋21号应减少回撤深度，保持前场威胁，为反击提供接应点。
5. 双队都应提高体能分配合理性，比赛后段（30-45分钟）跑动距离和速度均有明显下降。`

export const demoData = {
  duration,
  players,
  ball,
  report,
}
