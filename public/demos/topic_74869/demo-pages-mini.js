// ============ 微信小程序页面（12 个） ============
const PagesMini = {
  // ---------- 小程序首页 ----------
  'mini-home': () => phoneFrame('援力通 · 应急助手', `
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);margin:-12px -12px 12px;padding:18px 12px 14px;color:#fff">
      <div style="font-size:15px;font-weight:700">您好，市民用户 👋</div>
      <div style="font-size:11px;opacity:.9;margin-top:2px">所在地区：城南市 · 今日天气暴雨</div>
      <div style="background:rgba(255,255,255,.15);padding:8px;border-radius:8px;margin-top:8px;font-size:11px">⚠️ 暴雨橙色预警 · 注意防范内涝</div>
    </div>
    <div style="background:#ef4444;color:#fff;padding:14px;border-radius:10px;text-align:center;margin-bottom:10px;cursor:pointer" onclick="goPage('mini-sos')">
      <div style="font-size:28px">🆘</div>
      <div style="font-size:14px;font-weight:700;margin-top:3px">一键紧急求助</div>
      <div style="font-size:10px;opacity:.9;margin-top:2px">点击向救援队伍发送求助</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🛠️ 快捷服务</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-shelter')"><div style="font-size:20px">🏕️</div><div style="font-size:10px;color:var(--text2);margin-top:3px">避难场所</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-volunteer')"><div style="font-size:20px">🤝</div><div style="font-size:10px;color:var(--text2);margin-top:3px">志愿者</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-knowledge')"><div style="font-size:20px">📖</div><div style="font-size:10px;color:var(--text2);margin-top:3px">科普</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-phonebook')"><div style="font-size:20px">📞</div><div style="font-size:10px;color:var(--text2);margin-top:3px">电话簿</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-task')"><div style="font-size:20px">📋</div><div style="font-size:10px;color:var(--text2);margin-top:3px">我的任务</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-training')"><div style="font-size:20px">📚</div><div style="font-size:10px;color:var(--text2);margin-top:3px">培训</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-ai')"><div style="font-size:20px">🤖</div><div style="font-size:10px;color:var(--text2);margin-top:3px">AI 问答</div></div>
      <div style="background:var(--card);padding:10px 4px;border-radius:8px;text-align:center;cursor:pointer" onclick="goPage('mini-search')"><div style="font-size:20px">🔍</div><div style="font-size:10px;color:var(--text2);margin-top:3px">搜索</div></div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📢 最新公告</div>
    <div class="mini-card" onclick="toast('查看公告详情')">
      <div class="mini-title">⚠️ 暴雨预警 · 启动三级应急响应</div>
      <div class="mini-info">市应急管理局 · 14:00 · 重要</div>
    </div>
    <div class="mini-card" onclick="toast('查看公告详情')">
      <div class="mini-title">🏕️ 城西安置点已开放</div>
      <div class="mini-info">可容纳 200 人 · 提供食宿</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">📍 附近避难场所</div>
    <div class="mini-card" onclick="goPage('mini-shelter')">
      <div class="mini-title">🏫 城西小学避难点</div>
      <div class="mini-info">📍 距您 1.2km · 容量 200 人<br>🟢 开放中 · 有物资</div>
    </div>
  `, 0, ['首页','任务','SOS','我的']) + descPanel('小程序首页',
    '面向市民与志愿者的微信小程序首页，聚合一键求助、避难场所查询、志愿者招募、应急科普等高频功能。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>一键 SOS 紧急求助（定位 + 录音 + 拍照）</li><li>避难场所地图导航</li><li>实时预警公告推送</li><li>志愿者招募报名</li><li>应急科普知识库</li><li>AI 应急问答助手</li></ul></div>`),

  // ---------- 小程序 SOS 求助 ----------
  'mini-sos': () => phoneFrame('紧急求助', `
    <div style="background:#ef4444;color:#fff;padding:14px;border-radius:10px;text-align:center;margin-bottom:10px">
      <div style="font-size:36px">🆘</div>
      <div style="font-size:14px;font-weight:700;margin-top:5px">长按按钮发起求助</div>
      <div style="font-size:10px;opacity:.9;margin-top:3px">系统将自动获取您的位置</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📍 最近求助记录</div>
    ${renderSOSHistory()}
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">求助类型</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="submitSOS('人员落水')"><div style="font-size:22px">🌊</div><div style="font-size:11px;margin-top:3px">人员落水</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="submitSOS('人员迷路')"><div style="font-size:22px">🗺️</div><div style="font-size:11px;margin-top:3px">人员迷路</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="submitSOS('车辆事故')"><div style="font-size:22px">🚗</div><div style="font-size:11px;margin-top:3px">车辆事故</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="submitSOS('自然灾害')"><div style="font-size:22px">🌊</div><div style="font-size:11px;margin-top:3px">自然灾害</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="submitSOS('人员被困')"><div style="font-size:22px">🚪</div><div style="font-size:11px;margin-top:3px">人员被困</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="submitSOS('缺物资')"><div style="font-size:22px">📦</div><div style="font-size:11px;margin-top:3px">缺物资</div></div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📞 一键呼叫</div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('110'), '呼叫')"><div class="mini-title">🚓 110 报警</div><div class="mini-info">紧急报警电话</div></div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('119'), '呼叫')"><div class="mini-title">🚒 119 消防</div><div class="mini-info">火灾 / 救援</div></div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('120'), '呼叫')"><div class="mini-title">🚑 120 急救</div><div class="mini-info">医疗急救</div></div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">📍 我的位置</div>
    <div class="mini-card">
      <div class="mini-title">城南市城南街道</div>
      <div class="mini-info">📍 116.40, 39.98 · 精度 5m<br>⏰ 2026-07-04 16:42</div>
      <button class="mini-btn" onclick="toast('位置已自动获取')">刷新位置</button>
    </div>
    <button class="mini-btn danger" style="margin-top:10px" onclick="submitSOS()">🚨 发起紧急求助</button>
  `, 2, ['首页','任务','SOS','我的']) + descPanel('紧急求助',
    '市民一键发起 SOS 求助，自动获取位置、选择求助类型、可选拍照录音上传，同步推送至指挥中心和就近救援队伍。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>6 类求助场景选择</li><li>GPS 自动定位 + 手动修正</li><li>拍照 / 录音证据上传</li><li>一键拨打 110/119/120</li><li>求助进度实时推送</li><li>附近救援队伍显示</li></ul></div>`),

  // ---------- 小程序 科普知识 ----------
  'mini-knowledge': () => phoneFrame('应急科普', `
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">全部</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">洪水</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">地震</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">火灾</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">急救</button>
    </div>
    <div class="mini-card" onclick="toast('阅读科普文章')">
      <div style="font-size:24px">🌊</div>
      <div class="mini-title" style="margin-top:5px">洪水自救 10 招</div>
      <div class="mini-info">洪水来临时如何自救？本文总结了 10 个关键自救方法...</div>
      <div style="font-size:10px;color:var(--text3);margin-top:5px">📖 1.2k 阅读 · 👍 86</div>
    </div>
    <div class="mini-card" onclick="toast('阅读科普文章')">
      <div style="font-size:24px">🌡️</div>
      <div class="mini-title" style="margin-top:5px">地震应急避险指南</div>
      <div class="mini-info">地震发生时如何正确避险？黄金 12 秒该做什么...</div>
      <div style="font-size:10px;color:var(--text3);margin-top:5px">📖 2.3k 阅读 · 👍 156</div>
    </div>
    <div class="mini-card" onclick="toast('阅读科普文章')">
      <div style="font-size:24px">🔥</div>
      <div class="mini-title" style="margin-top:5px">火灾逃生与灭火器使用</div>
      <div class="mini-info">不同类型火灾的应对方法，灭火器正确使用图解...</div>
      <div style="font-size:10px;color:var(--text3);margin-top:5px">📖 980 阅读 · 👍 72</div>
    </div>
    <div class="mini-card" onclick="toast('阅读科普文章')">
      <div style="font-size:24px">🩹</div>
      <div class="mini-title" style="margin-top:5px">CPR 心肺复苏术</div>
      <div class="mini-info">心肺复苏的标准操作流程，关键时刻能救命...</div>
      <div style="font-size:10px;color:var(--text3);margin-top:5px">📖 1.5k 阅读 · 👍 102</div>
    </div>
    <div class="mini-card" onclick="toast('阅读科普文章')">
      <div style="font-size:24px">⚠️</div>
      <div class="mini-title" style="margin-top:5px">暴雨天气注意事项</div>
      <div class="mini-info">暴雨天气出行注意事项与防范措施...</div>
      <div style="font-size:10px;color:var(--text3);margin-top:5px">📖 620 阅读 · 👍 48</div>
    </div>
    <button class="mini-btn" onclick="goPage('mini-ai')">🤖 AI 问答求助</button>
  `, 2, ['首页','任务','SOS','我的']) + descPanel('应急科普',
    '系统化应急科普知识库，涵盖洪水、地震、火灾、急救等各类场景，配合图文与视频教程，提升公众应急能力。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>分类科普文章库</li><li>视频教程</li><li>急救操作图解</li><li>阅读量 / 点赞统计</li><li>AI 应急问答联动</li></ul></div>`),

  // ---------- 小程序 我的 ----------
  'mini-profile': () => phoneFrame('我的', `
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);margin:-12px -12px 12px;padding:18px 12px;color:#fff;text-align:center">
      <div style="width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:30px">👤</div>
      <div style="font-size:14px;font-weight:700">市民用户</div>
      <div style="font-size:11px;opacity:.9;margin-top:2px">城南市 · 注册志愿者</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;text-align:center">
      <div class="mini-card" style="padding:10px 4px"><div style="font-size:18px;font-weight:700;color:var(--primary-light)">3</div><div style="font-size:10px;color:var(--text2)">求助记录</div></div>
      <div class="mini-card" style="padding:10px 4px"><div style="font-size:18px;font-weight:700;color:var(--success)">2</div><div style="font-size:10px;color:var(--text2)">志愿任务</div></div>
      <div class="mini-card" style="padding:10px 4px"><div style="font-size:18px;font-weight:700;color:var(--accent)">5</div><div style="font-size:10px;color:var(--text2)">培训学时</div></div>
    </div>
    <div class="mini-card" onclick="goPage('mini-task')"><div class="mini-title">📋 我的任务</div><div class="mini-info">查看志愿任务记录</div></div>
    <div class="mini-card" onclick="goPage('mini-training')"><div class="mini-title">📚 我的培训</div><div class="mini-info">查看培训记录与证书</div></div>
    <div class="mini-card" onclick="goPage('mini-message')"><div class="mini-title">💬 消息通知</div><div class="mini-info">系统通知与求助进度</div></div>
    <div class="mini-card" onclick="toast('查看个人信息')"><div class="mini-title">📝 个人信息</div><div class="mini-info">实名认证 · 联系方式</div></div>
    <div class="mini-card" onclick="toast('设置')"><div class="mini-title">⚙️ 设置</div><div class="mini-info">隐私 · 通知 · 关于</div></div>
    <button class="mini-btn secondary" style="margin-top:10px">退出登录</button>
  `, 3, ['首页','任务','SOS','我的']) + descPanel('我的中心',
    '市民个人中心，聚合求助记录、志愿任务、培训学时、消息通知与个人设置。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>个人数据统计</li><li>求助 / 志愿任务记录</li><li>培训学时与证书</li><li>消息通知中心</li><li>实名认证</li><li>隐私设置</li></ul></div>`),

  // ---------- 小程序 避难场所 ----------
  'mini-shelter': () => phoneFrame('避难场所', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px">📍 附近 5 个避难场所</div>
    <div class="map-box" style="height:200px;margin-bottom:12px">
      <div class="map-bg"></div><div class="map-grid"></div>
      <div class="map-marker m-shelter" style="top:30%;left:25%">🏕️</div>
      <div class="map-marker m-shelter" style="top:60%;left:60%">🏕️</div>
      <div class="map-marker m-shelter" style="top:45%;left:80%">🏕️</div>
      <div class="map-info">📍 城南市</div>
    </div>
    <div class="mini-card" onclick="toast('开始导航')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🏫 城西小学避难点</div><div class="mini-info">📍 距您 1.2km · 容量 200 人<br>🟢 开放中 · 有物资 · 有医疗</div></div>
        <div style="color:var(--success);font-size:22px">→</div>
      </div>
      <button class="mini-btn" style="margin-top:8px" onclick="toast('已开始导航')">🧭 导航前往</button>
    </div>
    <div class="mini-card" onclick="toast('开始导航')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🏟️ 城南体育馆避难点</div><div class="mini-info">📍 距您 2.5km · 容量 500 人<br>🟢 开放中 · 有物资</div></div>
        <div style="color:var(--success);font-size:22px">→</div>
      </div>
      <button class="mini-btn" style="margin-top:8px" onclick="toast('已开始导航')">🧭 导航前往</button>
    </div>
    <div class="mini-card" onclick="toast('开始导航')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🏰 城北社区中心</div><div class="mini-info">📍 距您 3.8km · 容量 150 人<br>🟡 接近满员</div></div>
        <div style="color:var(--warning);font-size:22px">→</div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📌 避难提示</div>
      <div class="mini-info">• 携带身份证、药品、必需品<br>• 听从现场人员指挥<br>• 保持冷静，照看老人小孩</div>
    </div>
  `, 0, ['首页','任务','SOS','我的']) + descPanel('避难场所',
    '基于地理位置的避难场所查询与导航，展示场所容量、开放状态、物资情况，一键导航到达。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>附近避难点地图展示</li><li>实时容量 / 开放状态</li><li>物资 / 医疗资源标识</li><li>一键导航</li><li>避难注意事项</li></ul></div>`),

  // ---------- 小程序 志愿者招募 ----------
  'mini-volunteer': () => phoneFrame('志愿者招募', `
    <div style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px;border-radius:10px;margin-bottom:10px">
      <div style="font-size:14px;font-weight:700">🤝 加入志愿者</div>
      <div style="font-size:11px;opacity:.9;margin-top:3px">为救援贡献一份力量</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📢 招募中</div>
    <div class="mini-card">
      <div class="mini-title">🚒 救援志愿者</div>
      <div class="mini-info">📋 要求：身体健康 · 18-55 岁<br>⏰ 培训：2 天 · 周末<br>📍 城东救援基地</div>
      <button class="mini-btn" onclick="showModal('志愿者报名', Forms.volunteer(), '提交申请')">立即报名</button>
    </div>
    <div class="mini-card">
      <div class="mini-title">📦 物资搬运志愿者</div>
      <div class="mini-info">📋 要求：能搬运 20kg<br>⏰ 即时 · 4 小时<br>📍 中央仓库 → 城西安置点</div>
      <button class="mini-btn" onclick="showModal('志愿者报名', Forms.volunteer(), '提交申请')">立即报名</button>
    </div>
    <div class="mini-card">
      <div class="mini-title">⚕️ 医疗救护志愿者</div>
      <div class="mini-info">📋 要求：有医疗背景<br>⏰ 长期 · 排班制<br>📍 临时医院</div>
      <button class="mini-btn" onclick="showModal('志愿者报名', Forms.volunteer(), '提交申请')">立即报名</button>
    </div>
    <div class="mini-card">
      <div class="mini-title">📞 心理疏导志愿者</div>
      <div class="mini-info">📋 要求：心理咨询师证<br>⏰ 灵活 · 在线/线下<br>📍 灾民安置点</div>
      <button class="mini-btn" onclick="showModal('志愿者报名', Forms.volunteer(), '提交申请')">立即报名</button>
    </div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">🏆 志愿者权益</div>
    <div class="mini-card">
      <div class="mini-info">✓ 专业救援培训<br>✓ 志愿者证书<br>✓ 意外保险<br>✓ 服务时长认证</div>
    </div>
  `, 0, ['首页','任务','SOS','我的']) + descPanel('志愿者招募',
    '面向社会公众的志愿者招募通道，提供救援、物资搬运、医疗、心理疏导等多类岗位，在线报名 + 培训 + 派发。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>多类岗位招募</li><li>在线报名表单</li><li>志愿者培训</li><li>服务时长认证</li><li>志愿者证书颁发</li><li>意外保险保障</li></ul></div>`),

  // ---------- 小程序 我的任务 ----------
  'mini-task': () => phoneFrame('我的任务', `
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0;flex:1">进行中</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0;flex:1">已完成</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0;flex:1">全部</button>
    </div>
    ${renderTaskList()}
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">📊 任务统计</div>
    <div class="mini-card">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div><div style="font-size:18px;font-weight:700;color:var(--primary-light)">${DB.tasks.length}</div><div style="font-size:10px;color:var(--text2)">总任务</div></div>
        <div><div style="font-size:18px;font-weight:700;color:var(--success)">${DB.tasks.filter(t => t.status === 'done').length}</div><div style="font-size:10px;color:var(--text2)">已完成</div></div>
        <div><div style="font-size:18px;font-weight:700;color:var(--accent)">${DB.tasks.filter(t => t.status === 'progress').length}</div><div style="font-size:10px;color:var(--text2)">进行中</div></div>
      </div>
    </div>
  `, 1, ['首页','任务','SOS','我的']) + descPanel('我的任务',
    '志愿者任务管理，查看分配的任务、任务详情、进度反馈、服务时长统计。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>任务列表与状态</li><li>任务详情查看</li><li>进度反馈</li><li>服务时长统计</li><li>历史任务归档</li></ul></div>`),

  // ---------- 小程序 培训报名 ----------
  'mini-training': () => phoneFrame('培训报名', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📚 可报名培训</div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px">🏊 水域救援培训</strong><span class="badge badge-pending" style="font-size:9px">报名中</span></div>
      <div class="mini-info" style="margin-top:5px">📅 2026-07-10 09:00<br>📍 城南河道训练场<br>👨‍🏫 赵海洋 · 30/50 人</div>
      <button class="mini-btn" onclick="toast('报名成功')">立即报名</button>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px">🧗 山地搜救培训</strong><span class="badge badge-progress" style="font-size:9px">已满</span></div>
      <div class="mini-info" style="margin-top:5px">📅 2026-07-04<br>📍 北山训练基地<br>👨‍🏫 刘志强 · 20/20 人</div>
      <button class="mini-btn secondary" onclick="toast('已加入候补')">加入候补</button>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px">🩹 急救技能培训</strong><span class="badge badge-pending" style="font-size:9px">报名中</span></div>
      <div class="mini-info" style="margin-top:5px">📅 2026-07-12 14:00<br>📍 医疗培训室<br>👨‍🏫 陈医生 · 18/30 人</div>
      <button class="mini-btn" onclick="toast('报名成功')">立即报名</button>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px">🚁 无人机科普</strong><span class="badge badge-pending" style="font-size:9px">报名中</span></div>
      <div class="mini-info" style="margin-top:5px">📅 2026-07-15<br>📍 无人机训练场<br>👨‍🏫 王飞宇 · 8/15 人</div>
      <button class="mini-btn" onclick="toast('报名成功')">立即报名</button>
    </div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">📜 我的证书</div>
    <div class="mini-card" onclick="toast('查看证书')">
      <div style="display:flex;gap:10px;align-items:center">
        <div style="font-size:30px">📜</div>
        <div><div class="mini-title">急救技能合格证</div><div class="mini-info">颁发：2026-06-28 · 有效期 3 年</div></div>
      </div>
    </div>
  `, 0, ['首页','任务','SOS','我的']) + descPanel('培训报名',
    '市民与志愿者在线报名培训课程，查看培训记录与颁发的证书。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>培训课程列表</li><li>在线报名</li><li>候补机制</li><li>培训记录</li><li>证书查询</li></ul></div>`),

  // ---------- 小程序 消息中心 ----------
  'mini-message': () => phoneFrame('消息中心', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">全部</button>
        <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">未读</button>
        <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">公告</button>
        <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">任务</button>
      </div>
      <span class="badge badge-urgent" style="font-size:10px">未读 ${DB.messages.filter(m => m.status === 'unread').length}</span>
    </div>
    ${renderMessageList()}
  `, 0, ['首页','任务','SOS','我的']) + descPanel('消息中心',
    '聚合系统通知、求助进度、任务提醒、公告预警等多类消息，分类查看与未读标识。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>多类消息分类</li><li>未读 / 已读状态</li><li>求助进度实时推送</li><li>公告预警</li><li>任务提醒</li></ul></div>`),

  // ---------- 小程序 AI 应急问答 ----------
  'mini-ai': () => phoneFrame('AI 应急问答', `
    <div style="background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;padding:12px;border-radius:10px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px">🤖</div>
        <div><div style="font-size:13px;font-weight:700">AI 应急助手</div><div style="font-size:10px;opacity:.9">智能问答 · 应急指导 · 知识库</div></div>
      </div>
      <button class="mini-btn secondary" style="width:auto;padding:4px 8px;margin:0;font-size:10px" onclick="AI.clear('mini-ai')">🗑️</button>
    </div>
    ${AI.chatContainer('mini-ai', {compact:true, maxHeight:'440px'})}
  `, 0, ['首页','任务','SOS','我的']) + descPanel('AI 应急问答',
    '基于大模型的应急问答助手，覆盖 15 类灾害场景的自救指导，<strong>真实交互</strong>：输入问题或点击快捷问题即可获得 AI 回答，支持多轮对话。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>自然语言问答（真实交互）</li><li>15 类应急自救知识库</li><li>多轮对话（按页面隔离）</li><li>热门问题推荐</li><li>场景化建议</li></ul></div>`),

  // ---------- 小程序 全局搜索 ----------
  'mini-search': () => phoneFrame('全局搜索', `
    <div style="background:var(--card);border-radius:10px;padding:10px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">🔍</span>
      <input style="flex:1;background:transparent;border:none;color:var(--text);outline:none;font-size:13px" placeholder="搜索科普 / 任务 / 公告 / 避难点..." value="洪水">
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🔍 搜索结果（4 条）</div>
    <div class="mini-card" onclick="goPage('mini-knowledge')">
      <div class="mini-title">🌊 洪水自救 10 招</div>
      <div class="mini-info">📖 科普知识 · 1.2k 阅读</div>
    </div>
    <div class="mini-card" onclick="goPage('mini-shelter')">
      <div class="mini-title">🏕️ 洪水避难点</div>
      <div class="mini-info">📍 避难场所 · 城西小学</div>
    </div>
    <div class="mini-card" onclick="toast('查看公告')">
      <div class="mini-title">⚠️ 洪水预警</div>
      <div class="mini-info">📢 公告 · 暴雨橙色预警</div>
    </div>
    <div class="mini-card" onclick="goPage('mini-task')">
      <div class="mini-title">📦 洪水物资搬运任务</div>
      <div class="mini-info">📋 志愿任务 · 进行中</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">🔥 热门搜索</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">洪水自救</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">地震</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">急救</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">火灾</button>
      <button class="mini-btn secondary" style="width:auto;padding:5px 12px;margin:0">避难点</button>
    </div>
  `, 0, ['首页','任务','SOS','我的']) + descPanel('全局搜索',
    '全站内容搜索，覆盖科普文章、任务、公告、避难场所等多类资源，支持热门搜索推荐。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>关键词全文检索</li><li>多类型结果</li><li>热门搜索推荐</li><li>搜索历史</li><li>结果分类筛选</li></ul></div>`),

  // ---------- 小程序 应急电话簿 ----------
  'mini-phonebook': () => phoneFrame('应急电话簿', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🚨 紧急电话</div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('110'), '呼叫')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚓 110 报警</div><div class="mini-info">紧急报警 · 治安</div></div>
        <button class="btn btn-danger btn-sm">呼叫</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('119'), '呼叫')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚒 119 消防</div><div class="mini-info">火灾 · 救援</div></div>
        <button class="btn btn-danger btn-sm">呼叫</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('120'), '呼叫')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚑 120 急救</div><div class="mini-info">医疗急救</div></div>
        <button class="btn btn-danger btn-sm">呼叫</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('122'), '呼叫')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚧 122 交通</div><div class="mini-info">交通事故</div></div>
        <button class="btn btn-warning btn-sm">呼叫</button>
      </div>
    </div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">🏛️ 政府部门</div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('应急管理局'), '呼叫')">
      <div class="mini-title">🏛️ 应急管理局</div>
      <div class="mini-info">12350 · 应急投诉举报</div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('气象局'), '呼叫')">
      <div class="mini-title">🌧️ 气象局</div>
      <div class="mini-info">12121 · 天气查询</div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('水利局'), '呼叫')">
      <div class="mini-title">💧 水利局</div>
      <div class="mini-info">水文信息查询</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">📞 救援队伍</div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('救援一队'), '呼叫')">
      <div class="mini-title">🚒 救援一队</div>
      <div class="mini-info">城东救援基地</div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('救援二队'), '呼叫')">
      <div class="mini-title">🚒 救援二队</div>
      <div class="mini-info">城北救援基地</div>
    </div>
  `, 0, ['首页','任务','SOS','我的']) + descPanel('应急电话簿',
    '内置常用应急电话与对接单位联系方式，一键拨打，支持救援队伍直拨。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>紧急电话 110/119/120/122</li><li>政府部门电话</li><li>救援队伍直拨</li><li>一键拨打</li><li>通话记录</li></ul></div>`),
};

// ============ 小程序三端联动辅助函数 ============
// 状态文案 / 样式映射集中管理，避免魔法字符串散落各处
const SOS_LEVEL_TEXT = {1: '一级紧急', 2: '二级紧急', 3: '三级紧急'};
const SOS_STATUS_TEXT = {pending: '待响应', progress: '处理中', done: '已解决'};
const SOS_STATUS_BADGE = {pending: 'badge-urgent', progress: 'badge-progress', done: 'badge-done'};
const SOS_LEVEL_BORDER = {1: 'var(--danger)', 2: 'var(--warning)', 3: 'var(--primary-light)'};
const TASK_STATUS_TEXT = {pending: '待开始', progress: '进行中', done: '已完成'};
const TASK_STATUS_BADGE = {pending: 'badge-gray', progress: 'badge-progress', done: 'badge-done'};
const TASK_STATUS_BORDER = {pending: 'var(--text3)', progress: 'var(--primary-light)', done: 'var(--success)'};
const MSG_TYPE_ICON = {通知: '📢', 预警: '⚠️', 任务: '📋', 审批: '📝'};
const MSG_PRIORITY_BORDER = {urgent: 'var(--danger)', high: 'var(--warning)', normal: 'var(--primary-light)'};

// 渲染小程序端最近求助记录（最多 3 条，点击查看详情）
function renderSOSHistory() {
  const list = DB.sos.slice(0, 3);
  if (!list.length) return '<div class="mini-card"><div class="mini-info">暂无求助记录</div></div>';
  return list.map(s => {
    const border = SOS_LEVEL_BORDER[s.level] || 'var(--primary-light)';
    const badgeCls = SOS_STATUS_BADGE[s.status] || 'badge-gray';
    return `<div class="mini-card" style="border-left:3px solid ${border}" onclick="viewSOSDetail('${s.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:13px">${s.type}</strong>
        <span class="badge ${badgeCls}" style="font-size:9px">${SOS_STATUS_TEXT[s.status] || s.status}</span>
      </div>
      <div class="mini-info" style="margin-top:5px">📍 ${s.location} · 👥 ${s.count}人<br>⏰ ${s.time} · ${s.reporter}</div>
    </div>`;
  }).join('');
}

// 发起 SOS 求助：弹出表单，提交后经 actionFrom 写入 DB.sos 并记录跨端事件
function submitSOS(presetType) {
  // 预选求助类型，减少重复选择
  const formHtml = presetType
    ? Forms.createSOS().replace(`<option>${presetType}</option>`, `<option selected>${presetType}</option>`)
    : Forms.createSOS();
  showModal(`${presetType || '紧急求助'} · 信息填写`, formHtml, '立即发送', (formData) => {
    if (!formData || !formData.type || !formData.location) {
      toast('⚠️ 请填写求助类型和地点', 'error');
      return;
    }
    const sosData = {
      type: formData.type,
      level: Number(formData.level) || 2,
      status: 'pending',
      reporter: formData.reporter || '市民',
      phone: formData.phone || '138****0000',
      location: formData.location,
      lng: 116.35 + Math.random() * 0.15,
      lat: 39.88 + Math.random() * 0.10,
      time: new Date().toTimeString().slice(0, 5),
      desc: formData.desc || '小程序端发起',
      count: Number(formData.count) || 1,
    };
    Store.actionFrom('mini', 'sos', 'add', sosData);
    toast('🆘 求助已发送至指挥中心，请保持电话畅通');
    goPage('mini-sos');
  });
}

// 查看 SOS 求助详情
function viewSOSDetail(id) {
  const s = Store.get('sos', id);
  if (!s) { toast('求助记录不存在', 'error'); return; }
  showModal(`求助详情 · ${s.id}`, `
    <p><strong>类型：</strong>${s.type}</p>
    <p><strong>紧急程度：</strong>${SOS_LEVEL_TEXT[s.level] || '未知'}</p>
    <p><strong>状态：</strong>${SOS_STATUS_TEXT[s.status] || s.status}</p>
    <p><strong>求助人：</strong>${s.reporter}（${s.phone}）</p>
    <p><strong>地点：</strong>${s.location}</p>
    <p><strong>被困人数：</strong>${s.count}</p>
    <p><strong>时间：</strong>${s.time}</p>
    <p><strong>描述：</strong>${s.desc}</p>
  `, '关闭');
}

// 渲染小程序端任务列表（动态读取 DB.tasks，空列表显示占位）
function renderTaskList() {
  const list = Store.list('tasks');
  if (!list.length) return '<div class="mini-card" style="text-align:center"><div class="mini-info">📋 暂无任务</div></div>';
  return list.map(t => {
    const badgeCls = TASK_STATUS_BADGE[t.status] || 'badge-gray';
    const border = TASK_STATUS_BORDER[t.status] || 'var(--text3)';
    return `<div class="mini-card" style="border-left:3px solid ${border}" onclick="viewTaskDetail('${t.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:13px">${t.name}</strong>
        <span class="badge ${badgeCls}" style="font-size:9px">${TASK_STATUS_TEXT[t.status] || t.status}</span>
      </div>
      <div class="mini-info" style="margin-top:5px">🏷️ ${t.type} · 📍 ${t.location}<br>👥 ${t.team}（${t.members}人）· ⏰ ${t.createdAt}</div>
      <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${t.progress}%"></div></div>
      <div style="font-size:10px;color:var(--text3);margin-top:3px">进度 ${t.progress}%</div>
    </div>`;
  }).join('');
}

// 查看任务详情
function viewTaskDetail(id) {
  const t = Store.get('tasks', id);
  if (!t) { toast('任务不存在', 'error'); return; }
  showModal(`任务详情 · ${t.id}`, `
    <p><strong>任务名称：</strong>${t.name}</p>
    <p><strong>类型：</strong>${t.type}</p>
    <p><strong>状态：</strong>${TASK_STATUS_TEXT[t.status] || t.status}</p>
    <p><strong>负责队伍：</strong>${t.team}（队长 ${t.leader}，${t.members}人）</p>
    <p><strong>地点：</strong>${t.location}</p>
    <p><strong>进度：</strong>${t.progress}%</p>
    <p><strong>创建时间：</strong>${t.createdAt}</p>
    <p><strong>描述：</strong>${t.desc}</p>
  `, '关闭');
}

// 渲染小程序端消息列表（动态读取 DB.messages，未读用蓝色圆点标记）
function renderMessageList() {
  const list = Store.list('messages');
  if (!list.length) return '<div class="mini-card" style="text-align:center"><div class="mini-info">📭 暂无消息</div></div>';
  return list.map(m => {
    const icon = MSG_TYPE_ICON[m.type] || '📩';
    const border = MSG_PRIORITY_BORDER[m.priority] || 'var(--primary-light)';
    const dot = m.status === 'unread'
      ? '<span style="display:inline-block;width:8px;height:8px;background:var(--primary-light);border-radius:50%;margin-right:6px;vertical-align:middle"></span>'
      : '';
    return `<div class="mini-card" style="border-left:3px solid ${border}" onclick="openMessage('${m.id}')">
      <div class="mini-title">${dot}${icon} ${m.title}</div>
      <div class="mini-info">${m.from} · ${m.time}${m.status === 'unread' ? ' · 未读' : ''}</div>
    </div>`;
  }).join('');
}

// 打开消息：未读则标记已读并展示详情，随后刷新列表以同步未读数与蓝点
function openMessage(id) {
  const m = Store.get('messages', id);
  if (!m) return;
  if (m.status === 'unread') {
    Store.update('messages', id, {status: 'read'});
  }
  showModal(`消息详情 · ${m.id}`, `
    <p><strong>类型：</strong>${MSG_TYPE_ICON[m.type] || '📩'} ${m.type}</p>
    <p><strong>标题：</strong>${m.title}</p>
    <p><strong>来源：</strong>${m.from}</p>
    <p><strong>时间：</strong>${m.time}</p>
    <p><strong>优先级：</strong>${m.priority}</p>
    <p><strong>状态：</strong>${m.status === 'unread' ? '未读（已标记已读）' : '已读'}</p>
  `, '关闭');
  goPage('mini-message');
}
