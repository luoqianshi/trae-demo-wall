/**
 * banban-icons.js — 伴伴行为图标映射系统
 * 基于 Tabler Icons (4800+ MIT-licensed SVG icons)
 * CDN: https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css
 * 
 * 用法:
 *   1. HTML头部引入: <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet">
 *   2. <script src="banban-icons.js"></script>
 *   3. BanbanIcon.get('work')  →  '<i class="ti ti-briefcase"></i>'
 *   4. BanbanIcon.render(container, 'study')  →  自动填充图标
 */

// ================================================================
//  Tabler Icons Webfont CDN URL
// ================================================================
const TABLER_ICONS_CDN = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css';

// ================================================================
//  行为图标映射表 — 每种行为对应一个 Tabler Icon
// ================================================================

const ICON_MAP = {

  // ---- 任务大类（5种核心分类）----
  work:           { icon: 'briefcase',         label: '工作', color: '#2E6EF0' },
  study:          { icon: 'book-2',             label: '学习', color: '#45B073' },
  life:           { icon: 'home-heart',         label: '生活', color: '#F57D38' },
  team:           { icon: 'users-group',         label: '团队', color: '#638CB8' },
  exercise:       { icon: 'barbell',            label: '运动', color: '#734DE5' },

  // ---- 活动类型（今日时间线 4色分类）----
  research:       { icon: 'telescope',          label: '研究/分析', color: '#1F9C91' },
  design:         { icon: 'palette',            label: '设计/创作', color: '#336EEB' },
  communication:  { icon: 'messages',            label: '沟通/讨论', color: '#F0631A' },
  documentation:  { icon: 'file-text',          label: '文档/整理', color: '#8045D1' },
  coding:         { icon: 'code',               label: '编程/开发', color: '#2E6EF0' },
  reading:        { icon: 'book-open',          label: '阅读/学习', color: '#45B073' },
  writing:        { icon: 'writing',            label: '写作/输出', color: '#8045D1' },
  thinking:       { icon: 'bulb',               label: '思考/规划', color: '#F59E0B' },
  meeting:        { icon: 'presentation',       label: '会议/汇报', color: '#638CB8' },
  rest:           { icon: 'coffee',             label: '休息/恢复', color: '#94A3B8' },

  // ---- 周规划三分类 ----
  strategy:       { icon: 'target-arrow',      label: '策略与规划', color: '#614DC7' },
  execution:      { icon: 'settings-cog',      label: '执行与项目', color: '#599438' },
  recovery:       { icon: 'spa',                label: '恢复与个人', color: '#2E8CA3' },

  // ---- 任务状态 ----
  status_backlog:    { icon: 'circle-dashed',     label: '待安排' },
  status_planning:   { icon: 'clipboard-list',     label: '计划中' },
  status_progress:   { icon: 'progress',           label: '进行中' },
  status_clarified:  { icon: 'circle-check',       label: '已澄清' },
  status_done:       { icon: 'circle-check-filled', label: '已完成' },
  status_archived:   { icon: 'archive',            label: '已归档' },
  status_daily:      { icon: 'calendar-event',     label: '日常' },

  // ---- 导航 ----
  nav_canvas:     { icon: 'layout-grid',        label: '画板' },
  nav_plan:       { icon: 'calendar-week',      label: '规划' },
  nav_compass:    { icon: 'compass',            label: '今日' },
  nav_timeline:   { icon: 'timeline',           label: '时间线' },
  nav_review:     { icon: 'notebook',           label: '复盘' },
  nav_insight:    { icon: 'chart-dots-3',       label: '洞察' },
  nav_settings:   { icon: 'settings',           label: '设置' },
  nav_grid:       { icon: 'apps',               label: '功能总览' },
  nav_help:       { icon: 'help-circle',        label: '帮助反馈' },
  nav_home:       { icon: 'home',               label: '首页' },
  nav_profile:    { icon: 'user',               label: '个人中心' },
  nav_search:     { icon: 'search',             label: '搜索' },

  // ---- 页面操作 ----
  action_search:     { icon: 'search',          label: '搜索' },
  action_add:        { icon: 'plus',            label: '新建' },
  action_connect:    { icon: 'share-2',          label: '连接' },
  action_group:      { icon: 'squares',          label: '分组' },
  action_sticky:     { icon: 'note',             label: '便签' },
  action_zoom_in:    { icon: 'zoom-in',          label: '放大' },
  action_zoom_out:   { icon: 'zoom-out',         label: '缩小' },
  action_organize:   { icon: 'align-box-left-top', label: '整理' },
  action_undo:       { icon: 'arrow-back-up',   label: '撤销' },
  action_redo:       { icon: 'arrow-forward-up',  label: '重做' },
  action_share:      { icon: 'share',            label: '分享' },
  action_export:     { icon: 'download',         label: '导出' },
  action_generate:   { icon: 'sparkles',         label: '生成' },
  action_refresh:    { icon: 'refresh',          label: '刷新' },
  action_edit:       { icon: 'edit',             label: '编辑' },
  action_delete:     { icon: 'trash',            label: '删除' },
  action_close:      { icon: 'x',               label: '关闭' },
  action_filter:     { icon: 'filter',           label: '筛选' },
  action_sort:       { icon: 'arrows-sort',     label: '排序' },
  action_more:       { icon: 'dots-vertical',   label: '更多' },
  action_expand:     { icon: 'chevron-down',    label: '展开' },
  action_collapse:   { icon: 'chevron-up',      label: '收起' },
  action_prev:       { icon: 'chevron-left',    label: '上一个' },
  action_next:       { icon: 'chevron-right',   label: '下一个' },
  action_send:       { icon: 'arrow-right',     label: '发送' },
  action_focus:      { icon: 'target',          label: '开始专注' },

  // ---- 心情/情绪 ----
  mood_tired:        { icon: 'mood-tired',      label: '疲惫' },
  mood_chaotic:      { icon: 'mood-confuzed',   label: '有点乱' },
  mood_okay:         { icon: 'mood-smile',      label: '还不错' },
  mood_fulfilled:    { icon: 'mood-happy',      label: '充实' },

  // ---- 时间/周期 ----
  time_morning:      { icon: 'sunrise',         label: '早晨' },
  time_day:          { icon: 'sun',             label: '白天' },
  time_evening:      { icon: 'sunset',          label: '傍晚' },
  time_night:        { icon: 'moon-stars',      label: '夜晚' },
  time_clock:        { icon: 'clock',           label: '时间' },
  time_calendar:     { icon: 'calendar',        label: '日历' },
  time_timer:        { icon: 'hourglass',       label: '计时' },
  time_stopwatch:    { icon: 'stopwatch',       label: '秒表' },

  // ---- 统计/数据 ----
  stat_tasks:        { icon: 'checklist',       label: '任务完成' },
  stat_focus:        { icon: 'focus-2',         label: '专注时长' },
  stat_rate:        { icon: 'chart-pie',        label: '完成率' },
  stat_heatmap:      { icon: 'grid-dots',       label: '热力图' },
  stat_trend:        { icon: 'chart-line',      label: '趋势' },
  stat_chart:        { icon: 'chart-bar',       label: '图表' },

  // ---- 画布/节点 ----
  canvas_node:       { icon: 'square-rounded',  label: '节点' },
  canvas_idea:       { icon: 'bulb-filled',     label: '想法' },
  canvas_task:       { icon: 'checkbox',        label: '任务' },
  canvas_question:   { icon: 'help-octagon',    label: '疑问' },
  canvas_goal:       { icon: 'target',          label: '目标' },
  canvas_milestone:  { icon: 'flag',            label: '里程碑' },
  canvas_sticky:     { icon: 'sticky-note',     label: '便签' },

  // ---- AI/伴伴 ----
  ai_chat:           { icon: 'message-circle',  label: '对话' },
  ai_suggest:        { icon: 'bulb',            label: '建议' },
  ai_analyze:        { icon: 'brain',           label: '分析' },
  ai_sparkle:        { icon: 'sparkles',         label: 'AI生成' },
  ai_thinking:       { icon: 'thought',         label: '思考中' },
  ai_online:         { icon: 'circle-dot',      label: '在线' },

  // ---- 文件/附件 ----
  file_doc:          { icon: 'file-text',       label: '文档' },
  file_image:        { icon: 'photo',           label: '图片' },
  file_link:         { icon: 'link',            label: '链接' },
  file_code:         { icon: 'source-code',     label: '代码' },
  file_pdf:          { icon: 'file-type-pdf',   label: 'PDF' },
  file_video:        { icon: 'video',           label: '视频' },
  file_audio:        { icon: 'microphone',      label: '音频' },
  file_zip:          { icon: 'zip',             label: '压缩包' },
  file_folder:       { icon: 'folder',          label: '文件夹' },
  file_upload:       { icon: 'upload',          label: '上传' },
  file_download:     { icon: 'download',        label: '下载' },

  // ---- 截图/证据 ----
  screenshot:        { icon: 'screenshot',      label: '截图' },
  evidence:          { icon: 'clipboard-check', label: '证据' },
  shred:             { icon: 'trash-x',         label: '粉碎' },

  // ---- 设置/偏好 ----
  set_general:       { icon: 'settings',        label: '通用设置' },
  set_privacy:       { icon: 'shield-lock',     label: '隐私设置' },
  set_notification:  { icon: 'bell-ringing',    label: '通知设置' },
  set_appearance:    { icon: 'palette',         label: '外观设置' },
  set_account:       { icon: 'user-cog',        label: '账户设置' },
  set_ai:            { icon: 'robot',           label: 'AI设置' },
  set_data:          { icon: 'database',        label: '数据管理' },
  set_about:         { icon: 'info-circle',     label: '关于' },

  // ---- 社交/互动 ----
  like:              { icon: 'thumb-up',        label: '点赞' },
  comment:           { icon: 'message',         label: '评论' },
  share:             { icon: 'share-3',         label: '分享' },
  follow:            { icon: 'user-plus',       label: '关注' },
  bookmark:          { icon: 'bookmark',        label: '书签' },
  reply:             { icon: 'arrow-back',      label: '回复' },
  mention:           { icon: 'at',              label: '提及' },

  // ---- 电商/商业 ----
  cart:              { icon: 'shopping-cart',   label: '购物车' },
  wallet:            { icon: 'wallet',          label: '钱包' },
  credit_card:       { icon: 'credit-card',     label: '信用卡' },
  gift:              { icon: 'gift',            label: '礼物' },
  discount:          { icon: 'discount',        label: '折扣' },
  receipt:           { icon: 'receipt',         label: '收据' },
  coin:              { icon: 'coin',            label: '金币' },

  // ---- 设备/硬件 ----
  device_phone:      { icon: 'device-mobile',   label: '手机' },
  device_laptop:     { icon: 'device-laptop',   label: '笔记本' },
  device_tablet:     { icon: 'device-tablet',   label: '平板' },
  device_desktop:    { icon: 'device-desktop',  label: '台式机' },
  device_watch:      { icon: 'device-watch',    label: '手表' },
  device_tv:         { icon: 'device-tv',       label: '电视' },
  headphone:         { icon: 'headphones',      label: '耳机' },
  camera:            { icon: 'camera',          label: '相机' },

  // ---- 天气/自然 ----
  weather_sun:       { icon: 'sun',             label: '晴天' },
  weather_cloud:     { icon: 'cloud',           label: '多云' },
  weather_rain:      { icon: 'cloud-rain',      label: '雨天' },
  weather_snow:      { icon: 'cloud-snow',      label: '雪天' },
  weather_storm:     { icon: 'cloud-storm',     label: '暴风雨' },
  weather_wind:      { icon: 'wind',            label: '大风' },
  temperature:       { icon: 'temperature',     label: '温度' },
  location:          { icon: 'map-pin',         label: '位置' },

  // ---- 安全/保护 ----
  shield:            { icon: 'shield',          label: '安全' },
  lock:              { icon: 'lock',            label: '锁定' },
  unlock:            { icon: 'lock-open',       label: '解锁' },
  key:               { icon: 'key',             label: '密钥' },
  fingerprint:       { icon: 'fingerprint',     label: '指纹' },
  face_id:           { icon: 'face-id',         label: '面容ID' },
  verified:          { icon: 'shield-check',    label: '已验证' },

  // ---- 箭头/方向 ----
  arrow_up:          { icon: 'arrow-up',        label: '向上' },
  arrow_down:        { icon: 'arrow-down',      label: '向下' },
  arrow_left:        { icon: 'arrow-left',      label: '向左' },
  arrow_right:       { icon: 'arrow-right',     label: '向右' },
  arrow_top:         { icon: 'arrow-bar-to-up', label: '回到顶部' },
  arrow_bottom:      { icon: 'arrow-bar-to-down', label: '到底部' },
  refresh:           { icon: 'refresh',         label: '刷新' },
  sync:              { icon: 'refresh-alert',   label: '同步' },

  // ---- 编辑/书写 ----
  edit:              { icon: 'edit',            label: '编辑' },
  write:             { icon: 'pencil',          label: '书写' },
  erase:             { icon: 'eraser',          label: '橡皮擦' },
  cut:               { icon: 'cut',             label: '剪切' },
  copy:              { icon: 'copy',            label: '复制' },
  paste:             { icon: 'clipboard-paste', label: '粘贴' },
  undo:              { icon: 'arrow-back-up',   label: '撤销' },
  redo:              { icon: 'arrow-forward-up', label: '重做' },
  select:            { icon: 'cursor-text',     label: '选择' },

  // ---- 视图/布局 ----
  view_grid:         { icon: 'layout-grid',     label: '网格视图' },
  view_list:         { icon: 'list',            label: '列表视图' },
  view_board:        { icon: 'layout-kanban',   label: '看板视图' },
  view_calendar:     { icon: 'calendar',        label: '日历视图' },
  view_fullscreen:   { icon: 'maximize',        label: '全屏' },
  zoom_in:           { icon: 'zoom-in',         label: '放大' },
  zoom_out:          { icon: 'zoom-out',        label: '缩小' },

  // ---- 杂项 ----
  bell:              { icon: 'bell',            label: '通知' },
  tag:               { icon: 'tag',             label: '标签' },
  star:              { icon: 'star',            label: '收藏' },
  pin:               { icon: 'pin',             label: '固定' },
  eye:               { icon: 'eye',             label: '查看' },
  eye_off:           { icon: 'eye-off',         label: '隐藏' },
  keyboard:          { icon: 'keyboard',        label: '键盘' },
  mouse:             { icon: 'mouse',           label: '鼠标' },
  play:              { icon: 'player-play',     label: '播放' },
  pause:             { icon: 'player-pause',    label: '暂停' },
  stop:              { icon: 'player-stop',     label: '停止' },
  skip_next:         { icon: 'player-skip-forward', label: '下一个' },
  skip_prev:         { icon: 'player-skip-back', label: '上一个' },
  volume:            { icon: 'volume-2',        label: '音量' },
  mute:              { icon: 'volume-off',      label: '静音' },
  check:             { icon: 'check',           label: '确认' },
  x:                 { icon: 'x',               label: '关闭' },
  plus:              { icon: 'plus',            label: '添加' },
  minus:             { icon: 'minus',           label: '减少' },
  info:              { icon: 'info-circle',     label: '信息' },
  warning:           { icon: 'alert-triangle',  label: '警告' },
  error:             { icon: 'alert-circle',    label: '错误' },
  success:           { icon: 'circle-check',    label: '成功' },
  question:          { icon: 'help-circle',     label: '帮助' },
  loading:           { icon: 'loader-2',        label: '加载中' },
  empty:             { icon: 'mood-empty',      label: '空状态' },
  flag:              { icon: 'flag',            label: '标记' },
  trophy:            { icon: 'trophy',          label: '奖杯' },
  medal:             { icon: 'medal',           label: '奖章' },
  crown:             { icon: 'crown',           label: '皇冠' },
  rocket:            { icon: 'rocket',          label: '火箭' },
  gift_2:            { icon: 'gift-2',          label: '礼物' },
  music:             { icon: 'music',           label: '音乐' },
  heart:             { icon: 'heart',           label: '喜欢' },
  flame:             { icon: 'flame',           label: '火焰' },
  lightning:         { icon: 'bolt',            label: '闪电' },
};

// ================================================================
//  BanbanIcon 工具类
// ================================================================

const BanbanIcon = {

  /**
   * 获取图标的 HTML 字符串
   * @param {string} key - 行为键名 (如 'work', 'research', 'nav_compass')
   * @param {string} [extraClass] - 额外的 CSS 类名
   * @returns {string} HTML 字符串, 如 '<i class="ti ti-briefcase"></i>'
   */
  get(key, extraClass = '') {
    const item = ICON_MAP[key];
    if (!item) {
      console.warn(`[BanbanIcon] 未找到图标映射: "${key}"`);
      return `<i class="ti ti-circle ${extraClass}"></i>`;
    }
    const cls = extraClass ? ` ${extraClass}` : '';
    return `<i class="ti ti-${item.icon}${cls}"></i>`;
  },

  /**
   * 获取带颜色的图标（使用内联style）
   * @param {string} key - 行为键名
   * @param {number} [size] - 图标大小(px)
   * @returns {string} HTML 字符串
   */
  getColored(key, size = 20) {
    const item = ICON_MAP[key];
    if (!item) return this.get(key);
    const color = item.color || 'currentColor';
    return `<i class="ti ti-${item.icon}" style="font-size:${size}px;color:${color};"></i>`;
  },

  /**
   * 获取图标+文字组合
   * @param {string} key - 行为键名
   * @param {string} [text] - 显示文字（默认使用映射表中的label）
   * @returns {string} HTML, 如 '<i class="ti ti-briefcase"></i> <span>工作</span>'
   */
  getWithLabel(key, text) {
    const item = ICON_MAP[key];
    if (!item) return this.get(key);
    const label = text || item.label || '';
    return `${this.get(key)} <span>${label}</span>`;
  },

  /**
   * 获取带颜色圆角背景的图标徽章
   * @param {string} key - 行为键名
   * @returns {string} HTML, 带圆角背景色块+图标
   */
  getBadge(key) {
    const item = ICON_MAP[key];
    if (!item) return this.get(key);
    const color = item.color || '#757394';
    const bg = color + '15'; // 15% 透明度背景
    return `<span class="icon-badge" style="background:${bg};color:${color};"><i class="ti ti-${item.icon}"></i></span>`;
  },

  /**
   * 渲染图标到容器元素
   * @param {HTMLElement} container - 目标容器
   * @param {string} key - 行为键名
   */
  render(container, key) {
    if (!container) return;
    container.innerHTML = this.get(key);
  },

  /**
   * 为容器内所有 [data-icon] 属性的元素自动填充图标
   * 用法: <span data-icon="work"></span>
   */
  autoFill() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      const key = el.getAttribute('data-icon');
      const size = el.getAttribute('data-icon-size');
      const colored = el.hasAttribute('data-icon-colored');
      if (colored) {
        el.innerHTML = this.getColored(key, parseInt(size) || 20);
      } else {
        if (size) el.style.fontSize = size + 'px';
        el.innerHTML = this.get(key);
      }
    });
  },

  /**
   * 动态加载 Tabler Icons CSS
   * 在页面 head 中注入 CDN link
   */
  load() {
    if (document.getElementById('__tabler-icons-css')) return;
    const link = document.createElement('link');
    link.id = '__tabler-icons-css';
    link.rel = 'stylesheet';
    link.href = TABLER_ICONS_CDN;
    document.head.appendChild(link);
  },

  /**
   * 列出所有可用的图标映射
   * @returns {Object} 完整映射表
   */
  list() {
    return { ...ICON_MAP };
  },

  /**
   * 按关键词搜索图标
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的图标列表 [{key, icon, label, color}]
   */
  search(keyword) {
    const kw = keyword.toLowerCase();
    return Object.entries(ICON_MAP)
      .filter(([k, v]) =>
        k.toLowerCase().includes(kw) ||
        v.label.toLowerCase().includes(kw) ||
        v.icon.toLowerCase().includes(kw)
      )
      .map(([k, v]) => ({ key: k, ...v }));
  },

  /**
   * 注册自定义图标映射
   * @param {string} key - 键名
   * @param {Object} config - { icon, label, color }
   */
  register(key, config) {
    ICON_MAP[key] = config;
  },

  /**
   * 获取导航项的图标（兼容 figma-components.js 的 NAV_ITEMS）
   * @param {string} navId - 导航ID
   * @returns {string} 图标HTML
   */
  getNavIcon(navId) {
    const map = {
      canvas: 'nav_canvas',
      plan: 'nav_plan',
      compass: 'nav_compass',
      timeline: 'nav_timeline',
      review: 'nav_review',
      insight: 'nav_insight',
      settings: 'nav_settings',
      overview: 'nav_grid',
      help: 'nav_help',
      home: 'nav_home',
      profile: 'nav_profile',
      search: 'nav_search',
    };
    const key = map[navId] || navId;
    return this.get(key);
  },
};

// ================================================================
//  自动初始化
// ================================================================

// 1. 自动加载 Tabler Icons CSS
BanbanIcon.load();

// 2. DOMContentLoaded 后自动填充 data-icon 元素
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BanbanIcon.autoFill());
} else {
  BanbanIcon.autoFill();
}

// 全局暴露
window.BanbanIcon = BanbanIcon;
