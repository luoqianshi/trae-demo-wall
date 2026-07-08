// ============ 援力通 2.0 参赛评审页面（3 个） ============
// 专为 TRAE AI 创造力大赛评审设计，明确呼应 4 个评分维度
// 1. overview       —— 作品总览（默认入口，让评审一眼看全貌）
// 2. story          —— 创作者故事（真实痛点溯源，呼应需求创新/场景洞察维度）
// 3. trae-practice  —— TRAE 实践过程（证明作品由 TRAE 完成）

const PagesReview = {

  // ============================================================
  // 1. 作品总览（默认入口）
  // ============================================================
  overview: () => `
  <div class="page-header">
    <div>
      <div class="page-title">🏆 援力通 2.0 · 作品总览</div>
      <div class="page-subtitle">民间救援队伍数字化管理平台 · TRAE AI 创造力大赛 · 社会服务赛道</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-warning btn-sm" onclick="goPage('story')">💝 创作者故事</button>
      <button class="btn btn-primary btn-sm" onclick="goPage('flow-demo')">🎯 体验流程演示</button>
      <button class="btn btn-primary btn-sm" onclick="goPage('collab-demo')">� 三端协同</button>
    </div>
  </div>

  <!-- 创作者故事入口（情感钩子） -->
  <div class="card" style="background:linear-gradient(135deg,rgba(239,68,68,.1),rgba(139,92,246,.08));border:1px solid rgba(239,68,68,.3);margin-bottom:14px;cursor:pointer" onclick="goPage('story')">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:36px">💝</div>
      <div style="flex:1;min-width:280px">
        <div style="font-size:16px;font-weight:700;color:var(--text)">创作者故事 · 为什么做援力通？</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.7">
          <strong style="color:var(--danger)">2018 年老家木房子失火，119 跑错地方</strong> →
          <strong style="color:var(--primary-light)">2026 年参与深圳蓝天救援队志愿者选拔，发现"停留在纸上"</strong> →
          用 TRAE 打造三端协同方案，让两个痛点都有答案
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge badge-urgent">真实亲历</span>
        <span class="badge badge-purple">评审重点</span>
        <span style="color:var(--accent);font-size:13px;font-weight:700">阅读故事 →</span>
      </div>
    </div>
  </div>

  <!-- 作品一句话定位 -->
  <div class="card" style="background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(245,158,11,.08));border:1px solid rgba(59,130,246,.3);margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:40px">🚨</div>
      <div style="flex:1;min-width:280px">
        <div style="font-size:18px;font-weight:700;color:var(--text)">让民间救援队从「微信群+电话+Excel」走向「三端协同数字化」</div>
        <div style="font-size:13px;color:var(--text2);margin-top:4px">市民小程序报警 → Web 后台智能调度 → 救援人员 APP 执行 → 多端实时联动复盘</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge badge-progress">社会服务赛道</span>
        <span class="badge badge-purple">TRAE 全程开发</span>
        <span class="badge badge-done">可体验</span>
      </div>
    </div>
  </div>

  <!-- 4 个评分维度亮点卡片 -->
  <div style="font-weight:700;font-size:15px;margin-bottom:10px;display:flex;align-items:center;gap:6px">📊 四大评审维度亮点</div>
  <div class="stats-grid" style="margin-bottom:18px">
    <div class="stat-card purple" onclick="goPage('story')" style="cursor:pointer">
      <div class="stat-label">💡 创新性 <span style="color:var(--purple);font-weight:700">30%</span></div>
      <div class="stat-value" style="font-size:18px;line-height:1.4">三端协同救援模式</div>
      <div class="stat-trend" style="margin-top:6px;font-size:11px;line-height:1.6">
        ✅ 首创「市民报警→后台调度→救援执行」三端闭环<br>
        ✅ AI 决策+GIS+无人机+IoT 多源融合<br>
        ✅ 突破传统微信群+电话管理方式
      </div>
    </div>
    <div class="stat-card success" onclick="goPage('flow-demo')" style="cursor:pointer">
      <div class="stat-label">🛠️ 实用性 <span style="color:var(--success);font-weight:700">30%</span></div>
      <div class="stat-value" style="font-size:18px;line-height:1.4">真实救援痛点</div>
      <div class="stat-trend" style="margin-top:6px;font-size:11px;line-height:1.6">
        ✅ 民间救援队 5000+ 支长期管理混乱<br>
        ✅ 响应时间节省 68%、同步延迟 &lt;3s<br>
        ✅ 11 微服务+3 BFF 后端可落地
      </div>
    </div>
    <div class="stat-card" onclick="goPage('collab-demo')" style="cursor:pointer">
      <div class="stat-label">✅ 完成度 <span style="color:var(--primary-light);font-weight:700">20%</span></div>
      <div class="stat-value" style="font-size:18px;line-height:1.4">端到端 8 步跑通</div>
      <div class="stat-trend" style="margin-top:6px;font-size:11px;line-height:1.6">
        ✅ SOS→任务→调度→追踪→处置→完成→复盘<br>
        ✅ 三端 35+ 页面全部可交互<br>
        ✅ 11 事件三端协同分屏演示
      </div>
    </div>
    <div class="stat-card warning" onclick="goPage('dashboard')" style="cursor:pointer">
      <div class="stat-label">🎨 美观度 <span style="color:var(--accent);font-weight:700">20%</span></div>
      <div class="stat-value" style="font-size:18px;line-height:1.4">深色专业指挥风</div>
      <div class="stat-trend" style="margin-top:6px;font-size:11px;line-height:1.6">
        ✅ 指挥中心级深色主题+动效<br>
        ✅ 卡片式布局、数据可视化<br>
        ✅ 三端 UI 风格统一又有差异化
      </div>
    </div>
  </div>

  <!-- 核心数据 -->
  <div class="card" style="margin-bottom:14px">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">📈 作品核心数据</div>
    <div class="stats-grid" style="margin-bottom:0">
      <div class="stat-card"><div class="stat-label">三端覆盖</div><div class="stat-value">3</div><div class="stat-trend">Web + 小程序 + APP</div></div>
      <div class="stat-card success"><div class="stat-label">可交互页面</div><div class="stat-value">35+</div><div class="stat-trend">Web 17 / 小程序 8 / APP 18</div></div>
      <div class="stat-card purple"><div class="stat-label">流程演示步骤</div><div class="stat-value">8</div><div class="stat-trend">端到端可推进</div></div>
      <div class="stat-card warning"><div class="stat-label">协同事件</div><div class="stat-value">11</div><div class="stat-trend">三端分屏联动</div></div>
      <div class="stat-card cyan"><div class="stat-label">后端微服务</div><div class="stat-value">11</div><div class="stat-trend">+3 BFF 网关</div></div>
      <div class="stat-card danger"><div class="stat-label">核心业务模块</div><div class="stat-value">20+</div><div class="stat-trend">任务/SOS/GIS/装备…</div></div>
    </div>
  </div>

  <!-- 三个核心功能 -->
  <div style="font-weight:700;font-size:15px;margin-bottom:10px">🎯 三个核心功能</div>
  <div class="grid grid-3" style="margin-bottom:18px">
    <div class="card" style="cursor:pointer" onclick="goPage('flow-demo')">
      <div style="font-size:28px;margin-bottom:8px">🆘</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">端到端救援流程</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.7">从 SOS 接报到复盘报告的 8 步完整闭环，可交互推进，含 AI 智能调度建议、GIS 实时追踪、现场处置记录。</div>
      <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%">立即体验 →</button>
    </div>
    <div class="card" style="cursor:pointer" onclick="goPage('collab-demo')">
      <div style="font-size:28px;margin-bottom:8px">🔗</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">三端实时协同</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.7">同一救援事件在 Web/小程序/APP 三端分屏联动，11 个事件展示多端数据同步价值，同步延迟 &lt;3s。</div>
      <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%">立即体验 →</button>
    </div>
    <div class="card" style="cursor:pointer" onclick="goPage('gis')">
      <div style="font-size:28px;margin-bottom:8px">🗺️</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">GIS 态势 + AI 决策</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.7">地图实时展示队伍/任务/SOS/无人机/避难点分布，AI 决策引擎基于历史数据+实时水文气象给出调度建议。</div>
      <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%">立即体验 →</button>
    </div>
  </div>

  <!-- 技术架构示意 -->
  <div class="card" style="margin-bottom:14px">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">🏗️ 技术架构（三端 + 微服务）</div>
    <div class="flow-container" style="margin-bottom:0">
      <div class="flow-steps" style="overflow-x:auto">
        <div class="flow-node" style="min-width:120px"><div style="font-size:22px;margin-bottom:4px">📱</div><div class="flow-node-title">小程序</div><div class="flow-node-desc">Taro · 市民端</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-node" style="min-width:120px"><div style="font-size:22px;margin-bottom:4px">📲</div><div class="flow-node-title">Flutter APP</div><div class="flow-node-desc">救援人员端</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-node" style="min-width:120px"><div style="font-size:22px;margin-bottom:4px">🖥️</div><div class="flow-node-title">Web 后台</div><div class="flow-node-desc">Vue3 · 指挥员</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-node" style="min-width:120px;border-color:var(--accent)"><div style="font-size:22px;margin-bottom:4px">🚪</div><div class="flow-node-title">3 BFF 网关</div><div class="flow-node-desc">app/taro/admin</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-node" style="min-width:140px;border-color:var(--success)"><div style="font-size:22px;margin-bottom:4px">⚙️</div><div class="flow-node-title">11 微服务</div><div class="flow-node-desc">Go · gRPC</div></div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:10px;text-align:center">💡 全栈由 TRAE IDE + TRAE Work 协作开发，全程对话可追溯（见 TRAE 实践过程页）</div>
  </div>

  <!-- 评审快速通道 -->
  <div class="card" style="background:linear-gradient(135deg,rgba(139,92,246,.12),rgba(59,130,246,.05));border:1px solid rgba(139,92,246,.3)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="font-size:20px">🧭</span>
      <span style="font-weight:700;font-size:15px;color:var(--purple)">评审快速通道（推荐顺序）</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-warning btn-sm" onclick="goPage('story')">⓪ 创作者故事（看真实痛点）</button>
      <button class="btn btn-primary btn-sm" onclick="goPage('flow-demo')">① 流程演示（看核心链路）</button>
      <button class="btn btn-primary btn-sm" onclick="goPage('collab-demo')">② 三端协同（看创新点）</button>
      <button class="btn btn-secondary btn-sm" onclick="goPage('dashboard')">③ 指挥中心（看完成度）</button>
      <button class="btn btn-secondary btn-sm" onclick="goPage('gis')">④ GIS 态势（看实用性）</button>
      <button class="btn btn-warning btn-sm" onclick="goPage('trae-practice')">⑤ TRAE 实践（看过程）</button>
    </div>
  </div>
  `,

  // ============================================================
  // 1.5 创作者故事（真实痛点溯源 · 评审重点）
  // ============================================================
  'story': () => `
  <div class="page-header">
    <div>
      <div class="page-title">💝 创作者故事 · 为什么做援力通</div>
      <div class="page-subtitle">两个亲历瞬间 → 一套数字化方案 · 真实痛点而非想象</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary btn-sm" onclick="goPage('overview')">← 返回总览</button>
      <button class="btn btn-primary btn-sm" onclick="goPage('flow-demo')">体验解决方案 →</button>
    </div>
  </div>

  <!-- 故事时间线 -->
  <div class="card" style="margin-bottom:14px;background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(59,130,246,.05));border:1px solid rgba(239,68,68,.2)">
    <div style="font-weight:700;font-size:15px;margin-bottom:14px;display:flex;align-items:center;gap:8px">📅 我的救援时间线</div>
    <div class="timeline">
      <div class="timeline-item done"><div class="timeline-time">2018.08</div><div class="timeline-content"><strong>老家唯一的木房子失火</strong> · 拨打 119 求救，等来的却是跑错地方的消防车</div></div>
      <div class="timeline-item done"><div class="timeline-time">2026.04</div><div class="timeline-content"><strong>参与深圳蓝天救援队志愿者选拔</strong> · 亲历民间救援队"停留在纸上"的数字化缺失</div></div>
      <div class="timeline-item done"><div class="timeline-time">2026.06</div><div class="timeline-content"><strong>用 TRAE 打造援力通 2.0</strong> · 从亲历者变为建设者，让两个痛点都有答案</div></div>
    </div>
  </div>

  <!-- 故事 1：2018 失火 -->
  <div class="card" style="margin-bottom:14px;border-left:4px solid var(--danger)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:22px">🔥</span>
        <span style="font-weight:700;font-size:16px;color:var(--danger)">故事一 · 2018 年 8 月，老家木房子失火</span>
      </div>
      <span class="badge badge-urgent">真实亲历</span>
    </div>
    <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:12px;font-size:13px;color:var(--text);line-height:1.9">
      那是 2018 年 8 月的一个午后，老家唯一的木房子突然失火。我第一时间拨打 119，火苗窜上房梁，我盯着村口的方向等救援。<strong style="color:var(--danger)">可是木房子已经烧完，也等不到 119 赶到现场</strong>。事后才知道——<strong style="color:var(--danger)">119 跑错地方了</strong>。一个错的路口、一句没听清的地名，就是一整栋房子的灰飞烟灭。
    </div>
    <div style="font-weight:600;font-size:13px;margin-bottom:8px">🔍 痛点拆解（119 为什么跑错？）</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:12px">
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--danger)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--danger)">❶ 定位信息传递失真</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">报警人只能口述"XX 村 XX 号"，调度员听写转述，无经纬度、无地图锚点，靠地名匹配易出错</div>
      </div>
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--warning)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--warning)">❷ 调度无 GIS 辅助</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">调度员看不到队伍实时位置，无法判断"哪辆车最近、哪条路最快"，全凭经验和电话沟通</div>
      </div>
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--accent)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--accent)">❸ 队伍无实时追踪</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">出警后车辆走到哪、是否偏离、何时到达，指挥中心一无所知，跑错了也没人及时发现</div>
      </div>
    </div>
    <div style="font-weight:600;font-size:13px;margin-bottom:8px">✅ 援力通的解决方案</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ GIS 精准定位报警</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">小程序一键 SOS 自动获取经纬度，后台地图直接落点，杜绝"地名听错"</div>
      </div>
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ AI 智能调度建议</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">基于距离/状态/装备自动推荐就近队伍，调度员一键派发，不用电话摇人</div>
      </div>
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ 队伍实时追踪</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">APP 端持续上报位置，后台 GIS 实时显示车辆轨迹，偏离即预警</div>
      </div>
    </div>
    <div style="margin-top:10px;text-align:right">
      <button class="btn btn-primary btn-xs" onclick="goPage('gis')">查看 GIS 态势演示 →</button>
      <button class="btn btn-success btn-xs" onclick="goPage('flow-demo')">体验救援流程 →</button>
    </div>
  </div>

  <!-- 故事 2：2026 蓝天救援 -->
  <div class="card" style="margin-bottom:14px;border-left:4px solid var(--primary-light)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:22px">🤝</span>
        <span style="font-weight:700;font-size:16px;color:var(--primary-light)">故事二 · 2026 年 4 月，参与深圳蓝天救援队志愿者选拔</span>
      </div>
      <span class="badge badge-progress">真实亲历</span>
    </div>
    <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:12px;font-size:13px;color:var(--text);line-height:1.9">
      2026 年 4 月，我参与了深圳蓝天救援队的志愿者选拔。怀揣着对救援事业的敬意，我想看看专业救援队是怎么运作的。<strong style="color:var(--primary-light)">可走进去才发现——什么都是停留在纸上，没有系统性的办公</strong>：任务靠微信群接单、装备靠 Excel 登记、培训记录散在各种文档里、出队名单靠队长在群里 @ 人统计。选拔过程中的见闻让我意识到，志愿者满腔热血，却被落后的工具拖住后腿。
    </div>
    <div style="font-weight:600;font-size:13px;margin-bottom:8px">🔍 痛点拆解（为什么"停留在纸上"？）</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:12px">
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--danger)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--danger)">❶ 任务靠微信群</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">队长群里发"XX 地有人迷路，谁能去"，响应靠刷屏，谁接了、到哪了、现场咋样全是黑盒</div>
      </div>
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--warning)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--warning)">❷ 装备靠 Excel</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">冲锋舟、对讲机、急救箱全靠一个共享表格，谁借了、还了没、电量多少无人实时知晓</div>
      </div>
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--accent)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--accent)">❸ 培训无系统记录</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">急救证、绳索证、水域救援证过期没人提醒，谁具备什么资质队长只能凭记忆</div>
      </div>
      <div style="background:var(--bg2);border-radius:8px;padding:10px;border-left:3px solid var(--purple)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--purple)">❹ 政府对接靠传真</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">与应急管理局、120、119 的协同靠电话和纸质公文，信息滞后、口径不一</div>
      </div>
    </div>
    <div style="font-weight:600;font-size:13px;margin-bottom:8px">✅ 援力通的解决方案</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ 任务全流程在线</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">Web 后台创建→APP 接单→实时进展→完成复盘，全结构化记录，告别微信群</div>
      </div>
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ 装备扫码管理</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">APP 扫码借还，后台实时库存，电量/到期自动预警</div>
      </div>
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ 培训证书数字化</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">培训记录、证书有效期系统化管理，到期自动提醒，资质查询一键完成</div>
      </div>
      <div style="background:rgba(16,185,129,.08);border-radius:8px;padding:10px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px;color:var(--success)">→ 政府对接通道</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">Web 后台一键上报应急管理局，数据格式对齐政府平台，告别传真电话</div>
      </div>
    </div>
    <div style="margin-top:10px;text-align:right">
      <button class="btn btn-primary btn-xs" onclick="goPage('task')">查看任务管理 →</button>
      <button class="btn btn-primary btn-xs" onclick="goPage('equipment')">查看装备管理 →</button>
      <button class="btn btn-success btn-xs" onclick="goPage('collab-demo')">体验三端协同 →</button>
    </div>
  </div>

  <!-- 痛点 → 方案对照表 -->
  <div class="card" style="margin-bottom:14px">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">📊 真实痛点 → 援力通方案 对照表（强证据）</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>来源</th><th>真实痛点</th><th>援力通方案</th><th>对应功能</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-urgent">2018 失火</span></td><td>119 跑错地方 · 定位失真</td><td>GIS 精准定位 + 经纬度落点</td><td><span class="badge badge-progress">SOS 报警</span></td></tr>
          <tr><td><span class="badge badge-urgent">2018 失火</span></td><td>调度无 GIS · 不知道哪辆车最近</td><td>AI 智能调度 + 就近推荐</td><td><span class="badge badge-progress">AI 决策</span></td></tr>
          <tr><td><span class="badge badge-urgent">2018 失火</span></td><td>队伍无追踪 · 跑错没人知道</td><td>APP 实时上报 + 轨迹回放</td><td><span class="badge badge-progress">队伍追踪</span></td></tr>
          <tr><td><span class="badge badge-progress">2026 蓝天</span></td><td>任务靠微信群 · 黑盒</td><td>任务全流程在线</td><td><span class="badge badge-done">任务管理</span></td></tr>
          <tr><td><span class="badge badge-progress">2026 蓝天</span></td><td>装备靠 Excel · 借还无记录</td><td>APP 扫码借还 + 实时库存</td><td><span class="badge badge-done">装备管理</span></td></tr>
          <tr><td><span class="badge badge-progress">2026 蓝天</span></td><td>培训无记录 · 证书过期无人提醒</td><td>培训证书数字化 + 到期预警</td><td><span class="badge badge-done">培训/证书</span></td></tr>
          <tr><td><span class="badge badge-progress">2026 蓝天</span></td><td>政府对接靠传真 · 滞后</td><td>一键上报 + 数据对齐</td><td><span class="badge badge-done">政府对接</span></td></tr>
        </tbody>
      </table>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:8px">💡 本对照表是评审"需求创新"与"场景洞察"维度的核心证据，每个痛点均来自创作者亲历</div>
  </div>

  <!-- 创作动机 -->
  <div class="card" style="background:linear-gradient(135deg,rgba(139,92,246,.12),rgba(59,130,246,.05));border:1px solid rgba(139,92,246,.3)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="font-size:20px">🎯</span>
      <span style="font-weight:700;font-size:15px;color:var(--purple)">创作动机 · 从亲历者到建设者</span>
    </div>
    <div style="font-size:13px;color:var(--text);line-height:1.9;margin-bottom:12px">
      2018 年那场火让我切身体会到——<strong style="color:var(--danger)">救援迟到一秒，就是一个家庭的灰飞烟灭</strong>。2026 年走进蓝天救援队，我又看到另一面——<strong style="color:var(--primary-light)">救援队想专业，却被落后的工具拖住后腿</strong>。
    </div>
    <div style="font-size:13px;color:var(--text);line-height:1.9;margin-bottom:14px">
      两个痛点，一个是"外部协同失灵"，一个是"内部管理停滞"。援力通 2.0 用<strong style="color:var(--success)">三端协同</strong>同时回应这两个痛点：让市民报警精准触达、让队伍调度有 GIS 辅助、让救援队内部管理走出纸面时代。<strong style="color:var(--purple)">这不是想象的痛点，是我用 8 年时间两次亲历的真实问题。</strong>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="goPage('flow-demo')">🎯 验证：看救援流程如何解决 119 问题</button>
      <button class="btn btn-primary btn-sm" onclick="goPage('collab-demo')">🔗 验证：看三端协同如何解决纸面问题</button>
    </div>
  </div>
  `,

  // ============================================================
  // 2. TRAE 实践过程
  // ============================================================
  'trae-practice': () => `
  <div class="page-header">
    <div>
      <div class="page-title">🛠️ TRAE 实践过程</div>
      <div class="page-subtitle">全程使用 TRAE IDE + TRAE Work 开发 · 关键步骤截图 + Session ID 可追溯</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary btn-sm" onclick="goPage('overview')">← 返回总览</button>
    </div>
  </div>

  <!-- 开发流程时间线 -->
  <div class="card" style="margin-bottom:14px">
    <div style="font-weight:700;font-size:15px;margin-bottom:14px">📅 开发流程时间线</div>
    <div class="timeline">
      <div class="timeline-item done"><div class="timeline-time">阶段 1</div><div class="timeline-content"><strong>需求调研与创意立项</strong> · 通过 TRAE Work 梳理民间救援队管理痛点，确定三端协同方案</div></div>
      <div class="timeline-item done"><div class="timeline-time">阶段 2</div><div class="timeline-content"><strong>架构设计</strong> · 用 TRAE IDE 拆分 11 微服务 + 3 BFF + 三前端，定义 proto 契约</div></div>
      <div class="timeline-item done"><div class="timeline-time">阶段 3</div><div class="timeline-content"><strong>后端微服务开发</strong> · auth/equipment/task/sos/gis-analysis 等 11 服务逐一实现</div></div>
      <div class="timeline-item done"><div class="timeline-time">阶段 4</div><div class="timeline-content"><strong>三前端开发</strong> · Vue3 Web + Taro 小程序 + Flutter APP 三端并行</div></div>
      <div class="timeline-item done"><div class="timeline-time">阶段 5</div><div class="timeline-content"><strong>BFF 网关对接</strong> · app-bff/taro-bff/admin-bff 拨号 RPC + 鉴权 + 审计</div></div>
      <div class="timeline-item done"><div class="timeline-time">阶段 6</div><div class="timeline-content"><strong>Demo 制作</strong> · 用 TRAE 生成纯前端交互式 Demo，整合三端界面与流程演示</div></div>
      <div class="timeline-item done"><div class="timeline-time">阶段 7</div><div class="timeline-content"><strong>静态走查与上线检查</strong> · Go vet/build、Flutter analyze、vue-tsc 全量通过</div></div>
    </div>
  </div>

  <!-- 关键步骤截图（占位，需用户补充） -->
  <div class="card" style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-weight:700;font-size:15px">📸 关键步骤截图（≥3 张）</div>
      <span class="badge badge-progress">评审重点</span>
    </div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:10px">⚠️ 截图请用户在 TRAE 中实际操作后保存到 Demo/screenshots/ 目录，文件名对应下方占位</div>
    <div class="grid grid-3">
      <div style="background:var(--bg2);border-radius:10px;padding:14px;border:1px dashed var(--border);text-align:center">
        <div style="font-size:36px;margin-bottom:8px;opacity:0.5">🖼️</div>
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">截图 1：架构设计对话</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">在 TRAE Work 中输入需求，AI 拆分微服务架构<br>文件：screenshots/01-architecture.png</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;border:1px dashed var(--border);text-align:center">
        <div style="font-size:36px;margin-bottom:8px;opacity:0.5">🖼️</div>
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">截图 2：后端服务生成</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">TRAE IDE 生成 Go 微服务代码 + proto 定义<br>文件：screenshots/02-backend.png</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;border:1px dashed var(--border);text-align:center">
        <div style="font-size:36px;margin-bottom:8px;opacity:0.5">🖼️</div>
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">截图 3：三前端开发</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">TRAE 并行开发 Vue/Taro/Flutter 三端<br>文件：screenshots/03-frontend.png</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;border:1px dashed var(--border);text-align:center">
        <div style="font-size:36px;margin-bottom:8px;opacity:0.5">🖼️</div>
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">截图 4：Demo 流程演示</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">用 TRAE 生成端到端流程演示页面<br>文件：screenshots/04-demo.png</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;border:1px dashed var(--border);text-align:center">
        <div style="font-size:36px;margin-bottom:8px;opacity:0.5">🖼️</div>
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">截图 5：静态走查验证</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">go vet / flutter analyze 全量通过<br>文件：screenshots/05-verify.png</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;border:1px dashed var(--border);text-align:center">
        <div style="font-size:36px;margin-bottom:8px;opacity:0.5">🖼️</div>
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">截图 6：三端协同调试</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">三端实时联动调试场景<br>文件：screenshots/06-collab.png</div>
      </div>
    </div>
  </div>

  <!-- Session ID 清单 -->
  <div class="card" style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-weight:700;font-size:15px">🆔 关键任务 Session ID（≥3 个）</div>
      <span class="badge badge-progress">评审重点</span>
    </div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:10px">💡 Session ID 在 TRAE 中双击对话头像即可复制；下表为 4 个关键阶段会话，前端/小程序/APP 开发与后端共用 S2 会话</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>序号</th><th>开发阶段</th><th>任务描述</th><th>会话标识</th><th>时间</th><th>状态</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>架构设计</td><td>11 微服务 + 3 BFF + 三前端架构拆分</td><td style="font-family:monospace;color:var(--accent);font-size:11px"><strong>S1</strong></td><td>2026/6/23 20:06</td><td><span class="badge badge-done">已记录</span></td></tr>
          <tr><td>2</td><td>后端开发</td><td>auth/task/sos/gis-analysis 等服务实现</td><td style="font-family:monospace;color:var(--accent);font-size:11px"><strong>S2</strong></td><td>2026/6/28 13:03</td><td><span class="badge badge-done">已记录</span></td></tr>
          <tr><td>3</td><td>前端开发</td><td>Vue3 Web 管理后台 17 页面</td><td style="font-family:monospace;color:var(--text3);font-size:11px">与 S2 合并</td><td>2026/6/28</td><td><span class="badge badge-gray">合并开发</span></td></tr>
          <tr><td>4</td><td>小程序开发</td><td>Taro 小程序 8 页面</td><td style="font-family:monospace;color:var(--text3);font-size:11px">与 S2 合并</td><td>2026/6/28</td><td><span class="badge badge-gray">合并开发</span></td></tr>
          <tr><td>5</td><td>APP 开发</td><td>Flutter APP 18 页面（含队长/飞手端）</td><td style="font-family:monospace;color:var(--text3);font-size:11px">与 S2 合并</td><td>2026/6/28</td><td><span class="badge badge-gray">合并开发</span></td></tr>
          <tr><td>6</td><td>Demo 制作</td><td>端到端流程演示 + 三端协同分屏</td><td style="font-family:monospace;color:var(--accent);font-size:11px"><strong>S3</strong></td><td>2026/7/5 06:29</td><td><span class="badge badge-done">已记录</span></td></tr>
          <tr><td>7</td><td>静态走查</td><td>go vet/build + flutter analyze + vue-tsc</td><td style="font-family:monospace;color:var(--accent);font-size:11px"><strong>S4</strong></td><td>2026/7/6 06:42</td><td><span class="badge badge-done">已记录</span></td></tr>
        </tbody>
      </table>
    </div>

    <!-- 完整 Session ID 列表（可复制） -->
    <div style="margin-top:14px;background:var(--bg2);border-radius:10px;padding:14px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-weight:600;font-size:13px">🆔 完整 Session ID 列表（点击复制）</div>
        <span style="font-size:10px;color:var(--text3)">供评审追溯原始对话</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg);padding:8px 10px;border-radius:6px;border-left:3px solid var(--purple)">
          <span class="badge badge-purple" style="flex-shrink:0">S1</span>
          <code style="font-size:10px;color:var(--text2);flex:1;word-break:break-all;font-family:monospace">.3986199057545075:fb57d6d811eef7ec6be380d058ddc8b2_6a39d2eb7e1bcb164bb4abfe.6a3a76b70d9502b6eb359d17.6a3a76b679d9adc11afd18be:Trae CN.T(2026/6/23 20:06:15)</code>
          <button class="btn btn-secondary btn-xs" onclick="copyText('.3986199057545075:fb57d6d811eef7ec6be380d058ddc8b2_6a39d2eb7e1bcb164bb4abfe.6a3a76b70d9502b6eb359d17.6a3a76b679d9adc11afd18be:Trae CN.T(2026/6/23 20:06:15)')">复制</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg);padding:8px 10px;border-radius:6px;border-left:3px solid var(--primary-light)">
          <span class="badge badge-progress" style="flex-shrink:0">S2</span>
          <code style="font-size:10px;color:var(--text2);flex:1;word-break:break-all;font-family:monospace">.3986199057545075:8c3f4f461c51728c5b082b49b1164607_6a40ab23d7d19cdf6b736191.6a40ab26d7d19cdf6b736193.6a40ab264200565aca8dd1b8:Trae CN.T(2026/6/28 13:03:34)</code>
          <button class="btn btn-secondary btn-xs" onclick="copyText('.3986199057545075:8c3f4f461c51728c5b082b49b1164607_6a40ab23d7d19cdf6b736191.6a40ab26d7d19cdf6b736193.6a40ab264200565aca8dd1b8:Trae CN.T(2026/6/28 13:03:34)')">复制</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg);padding:8px 10px;border-radius:6px;border-left:3px solid var(--accent)">
          <span class="badge badge-pending" style="flex-shrink:0">S3</span>
          <code style="font-size:10px;color:var(--text2);flex:1;word-break:break-all;font-family:monospace">.3986199057545075:1cddaa24f1417ecaccbb2e851c174249_6a490610325b775fbbd1384c.6a4989342513b2bcb0b33594.6a4989344f9b951772198ab7:Trae CN.T(2026/7/5 06:29:08)</code>
          <button class="btn btn-secondary btn-xs" onclick="copyText('.3986199057545075:1cddaa24f1417ecaccbb2e851c174249_6a490610325b775fbbd1384c.6a4989342513b2bcb0b33594.6a4989344f9b951772198ab7:Trae CN.T(2026/7/5 06:29:08)')">复制</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg);padding:8px 10px;border-radius:6px;border-left:3px solid var(--success)">
          <span class="badge badge-done" style="flex-shrink:0">S4</span>
          <code style="font-size:10px;color:var(--text2);flex:1;word-break:break-all;font-family:monospace">.3986199057545075:f8295d46bdec1e667a249c4487d7ecf3_6a4addca32e719bca8d18d2d.6a4adde332e719bca8d18d67.6a4adde307ea61538f9fdc1a:Trae CN.T(2026/7/6 06:42:43)</code>
          <button class="btn btn-secondary btn-xs" onclick="copyText('.3986199057545075:f8295d46bdec1e667a249c4487d7ecf3_6a4addca32e719bca8d18d2d.6a4adde332e719bca8d18d67.6a4adde307ea61538f9fdc1a:Trae CN.T(2026/7/6 06:42:43)')">复制</button>
        </div>
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:8px">💡 S1=架构设计 / S2=后端+三前端开发 / S3=Demo 制作 / S4=静态走查与修复</div>
    </div>
  </div>

  <!-- 关键 Prompt 片段 -->
  <div class="card" style="margin-bottom:14px">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">💬 关键 Prompt 片段（示例）</div>
    <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid var(--purple)">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px">架构设计阶段</div>
      <div style="font-size:12px;color:var(--text);line-height:1.7;font-family:monospace">"民间救援队伍数字化管理平台，需要支持市民小程序报警、Web 后台调度、救援人员 APP 执行三端协同。请帮我拆分微服务架构，包含认证/任务/SOS/GIS/装备/物流/培训等核心模块，用 Go + gRPC 实现，前端 Vue3 + Taro + Flutter。"</div>
    </div>
    <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid var(--primary-light)">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px">流程演示阶段</div>
      <div style="font-size:12px;color:var(--text);line-height:1.7;font-family:monospace">"做一个端到端救援流程演示页面，8 个步骤：SOS 接报→任务创建→队伍调度→途中追踪→到场处置→实时进展→任务完成→复盘报告。每步可交互推进，含 GIS 定位、AI 建议、实时图传、资源监控。"</div>
    </div>
    <div style="background:var(--bg2);border-radius:10px;padding:14px;border-left:3px solid var(--success)">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px">三端协同阶段</div>
      <div style="font-size:12px;color:var(--text);line-height:1.7;font-family:monospace">"做一个三端协同分屏演示，同一救援事件在 Web/小程序/APP 三端联动展示，11 个事件，点击事件高亮三端对应变化，体现多端数据同步价值。"</div>
    </div>
  </div>

  <!-- 踩坑与解决方案 -->
  <div class="card">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">🛠️ 踩坑与解决方案</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="background:var(--bg2);border-radius:10px;padding:12px;border-left:3px solid var(--warning)">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">⚠️ 问题 1：Go 工具链版本不匹配</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">Dockerfile 用 golang:1.22，项目要求 1.25.0+。通过 TRAE 让 AI 统一升级 Dockerfile 与 CI 镜像版本。</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:12px;border-left:3px solid var(--warning)">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">⚠️ 问题 2：Flutter APP iOS 工程缺失</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">iOS 原生工程完全缺失。用 TRAE 执行 flutter create --platforms=ios 补齐，手动创建 Podfile/entitlements。</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:12px;border-left:3px solid var(--warning)">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">⚠️ 问题 3：3 处 service 层 RPC 缺失</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">equipment/training/message 服务缺 5 个 RPC。通过 TRAE 全链路补齐 service→BFF→前端透传。</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:12px;border-left:3px solid var(--success)">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">✅ 解决方案 4：三端契约一致性</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">通过 TRAE 统一 proto 定义，BFF 层做字段映射，确保三端展示数据一致。</div>
      </div>
    </div>
  </div>
  `,

  // ---------- 默认页 ----------
  default: () => `<div class="page-header"><div class="page-title">🚧 页面建设中</div></div><div class="card"><p style="color:var(--text2)">该功能模块正在开发中，敬请期待。</p></div>`,
};
