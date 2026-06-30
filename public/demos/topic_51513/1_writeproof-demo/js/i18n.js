/* ============================================
   WriteProof — i18n Dictionary & Lang Module
   ============================================ */

var i18nData = {
  'zh-CN': {
    app_name: 'WriteProof',
    confirm: '确认',
    cancel: '取消',
    back: '返回',
    submit: '提交',
    create: '创建',
    export: '导出',
    home_hero_label: '可信写作证据平台',
    home_tagline: '帮助学校获得<strong>可信的学生写作证据</strong>',
    home_subtitle: '在 AI 普及的当下，学校需要一种方式采集真实的学生写作样本。WriteProof 为评估与诊断提供可靠基础。',
    home_visual_teacher: '教师端 · 任务管理',
    home_visual_student: '学生端 · 专注写作',
    home_value_collect: '真实采集',
    home_value_collect_desc: '受控写作环境，<br>减少外部工具干扰',
    home_value_record: '过程记录',
    home_value_record_desc: '完整保留写作行为<br>与中断事件',
    home_value_diagnose: '诊断基础',
    home_value_diagnose_desc: '可信原始数据支撑<br>AI 辅助分析',
    home_cta_teacher: '查看教师端演示',
    home_cta_student: '体验学生端写作',
    home_hint_teacher: '教师端 · 创建任务，查看证据',
    home_hint_student: '学生端 · 加入任务，完成写作',
    home_footer: 'WriteProof v1.0 Demo — TRAE AI 创造力大赛',
    nav_workspace: '教师工作台',
    nav_tasks: '任务列表',
    nav_create: '创建任务',
    nav_back_home: '返回首页',
    teacher_tasks_title: '任务列表',
    teacher_tasks_desc: '管理所有写作任务，查看学生提交情况',
    teacher_create_title: '创建写作任务',
    teacher_create_desc: '设置任务参数，系统将自动生成邀请码',
    task_name_label: '任务名称',
    task_name_placeholder: '如：Grade 10 议论文写作',
    task_desc_label: '任务说明 / 写作提示',
    task_desc_placeholder: '学生将在写作界面看到这段文字作为提示...',
    task_duration_label: '写作时长（分钟）',
    task_invite_label: '邀请码',
    task_invite_placeholder: '自动生成或自定义',
    task_invite_hint: '留空将自动生成 6 位邀请码',
    btn_create_task: '创建任务',
    btn_cancel: '取消',
    status_active: '进行中',
    status_submitted: '已提交',
    status_writing: '写作中',
    table_name: '学生姓名',
    table_status: '状态',
    table_trust: '可信指数',
    table_events: '行为记录',
    table_duration: '写作时长',
    table_chars: '字数',
    table_action: '操作',
    view_detail: '查看详情',
    no_students: '暂无学生加入此任务',
    writing_detail: '写作详情',
    task_label: '任务：',
    invite_label: '邀请码：',
    writing_content: '写作原文',
    event_timeline: '事件时间线',
    no_events: '写作过程中未记录到行为中断事件',
    ai_summary: '分析摘要',
    ai_summary_footer: '本摘要由系统基于统计数据自动生成，仅用于辅助评估参考，不参与学生写作内容分析。',
    trust_label_prefix: '可信指数：',
    unit_minute: '分钟',
    trust_high: '高',
    trust_medium: '中',
    trust_low: '低',
    trust_high_desc: '写作过程完整，无异常中断',
    trust_medium_desc: '有少量行为记录，建议综合评估',
    trust_low_desc: '多次行为记录，需谨慎参考',
    stat_total: '总学生数',
    stat_submitted: '已提交',
    stat_writing: '写作中',
    stat_events: '总行为记录',
    stat_chars: '总字符数',
    stat_duration: '写作时长',
    stat_exit: '退出全屏',
    no_tasks: '还没有写作任务',
    no_tasks_desc: '创建第一个任务，开始收集学生写作证据',
    export_evidence: '导出证据',
    export_task_evidence: '导出证据',
    reset_demo: '重置 Demo 数据',
    reset_confirm: '确定要重置所有 Demo 数据吗？所有新增的任务和写作记录将被清除，恢复到初始演示状态。',
    reset_success: 'Demo 数据已重置',
    export_student_msg: '已导出 "{name}" 的可信写作证据（可信指数：{trust}）',
    export_task_msg: '已导出任务 "{name}" 的 {count} 份学生写作证据',
    join_title: '加入写作任务',
    join_desc: '输入教师提供的邀请码和你的姓名',
    code_label: '邀请码',
    code_placeholder: '如：ABC123',
    name_label: '你的姓名',
    name_placeholder: '输入姓名用于教师识别',
    btn_enter: '进入写作',
    writing_placeholder: '在此输入你的写作内容...',
    btn_fullscreen: '全屏',
    btn_submit_writing: '提交写作',
    monitor_running: '监控运行中',
    submit_modal_title: '确认提交',
    submit_modal_msg: '提交后写作内容将被锁定，教师将收到你的原始写作证据。确定现在提交吗？',
    submitted_title: '提交成功',
    submitted_desc: '你的写作内容已被安全保存，教师将可以查看你的原始写作记录。',
    submitted_chars: '写作字数：{count} 字符',
    submitted_stats: '写作时长：{duration} · 行为记录：{events} 次',
    time_up: '时间到！写作已自动提交。',
    invalid_code: '邀请码无效或任务已关闭，请确认后重试。',
    enter_code: '请输入邀请码',
    enter_name: '请输入你的姓名',
    duplicate_name: '姓名"{name}"已存在于该任务中，是否继续？如非本人请修改姓名。',
    task_created: '任务创建成功！\n邀请码：{code}',
    event_fullscreen_exit: '退出全屏',
    event_page_blur: '页面失焦',
    event_tab_switch: '标签页切换',
    event_paste_attempt: '粘贴尝试',
    event_recorded_prefix: '系统已记录：',
    ai_in_task: '在 {duration} 分钟的写作任务中',
    ai_time_used: '，实际用时约 {min} 分钟',
    ai_chars_count: '，完成文本共 {count} 个字符',
    ai_speed: '写作速度 {desc}（约 {speed} 字符/分钟）',
    ai_speed_slow: '偏慢',
    ai_speed_normal: '适中',
    ai_speed_fast: '较快',
    ai_no_events: '写作过程未记录到行为中断事件，写作环境保持稳定，<strong>可信指数高</strong>。',
    ai_has_events: '写作过程中共记录 {count} 次行为事件（{events}）。',
    ai_trust_medium: '中断程度较轻，样本仍具有参考价值。',
    ai_trust_low: '多次行为记录，建议结合时间线进行综合判断。',
    modal_default_title: '确认',
    modal_default_msg: '确定要执行此操作吗？',
    lang_switch: 'EN',
    lang_name: '中文'
  },
  'en': {
    app_name: 'WriteProof',
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    submit: 'Submit',
    create: 'Create',
    export: 'Export',
    home_hero_label: 'Credible Writing Evidence Platform',
    home_tagline: 'Help schools obtain <strong>credible student writing evidence</strong>',
    home_subtitle: 'In an AI-powered world, schools need a way to collect authentic student writing samples. WriteProof provides a reliable foundation for assessment and diagnosis.',
    home_visual_teacher: 'Teacher · Task Management',
    home_visual_student: 'Student · Focused Writing',
    home_value_collect: 'Authentic Collection',
    home_value_collect_desc: 'Controlled writing environment with reduced external tool interference',
    home_value_record: 'Process Recording',
    home_value_record_desc: 'Complete preservation of writing behavior and interruption events',
    home_value_diagnose: 'Diagnosis Foundation',
    home_value_diagnose_desc: 'Credible raw data to support AI-assisted analysis',
    home_cta_teacher: 'View Teacher Demo',
    home_cta_student: 'Try Student Writing',
    home_hint_teacher: 'Teacher · Create tasks, view evidence',
    home_hint_student: 'Student · Join task, complete writing',
    home_footer: 'WriteProof v1.0 Demo — TRAE AI Creativity Contest',
    nav_workspace: 'Teacher Workspace',
    nav_tasks: 'Tasks',
    nav_create: 'Create Task',
    nav_back_home: 'Back to Home',
    teacher_tasks_title: 'Tasks',
    teacher_tasks_desc: 'Manage all writing tasks and view student submissions',
    teacher_create_title: 'Create Writing Task',
    teacher_create_desc: 'Set task parameters; the system will auto-generate an invite code',
    task_name_label: 'Task Name',
    task_name_placeholder: 'e.g., Grade 10 Argumentative Essay',
    task_desc_label: 'Instructions / Writing Prompt',
    task_desc_placeholder: 'Students will see this text as the writing prompt...',
    task_duration_label: 'Duration (minutes)',
    task_invite_label: 'Invite Code',
    task_invite_placeholder: 'Auto-generate or custom',
    task_invite_hint: 'Leave blank to auto-generate a 6-digit code',
    btn_create_task: 'Create Task',
    btn_cancel: 'Cancel',
    status_active: 'Active',
    status_submitted: 'Submitted',
    status_writing: 'Writing',
    table_name: 'Student',
    table_status: 'Status',
    table_trust: 'Trust Score',
    table_events: 'Behavior Log',
    table_duration: 'Duration',
    table_chars: 'Chars',
    table_action: 'Action',
    view_detail: 'View Detail',
    no_students: 'No students have joined this task yet',
    writing_detail: 'Writing Detail',
    task_label: 'Task: ',
    invite_label: 'Code: ',
    writing_content: 'Original Writing',
    event_timeline: 'Event Timeline',
    no_events: 'No behavior interruption events were recorded during writing',
    ai_summary: 'Analysis Summary',
    ai_summary_footer: 'This summary is auto-generated based on statistical data for reference only and does not analyze student writing content.',
    trust_label_prefix: 'Trust: ',
    unit_minute: 'min',
    trust_high: 'High',
    trust_medium: 'Med',
    trust_low: 'Low',
    trust_high_desc: 'Writing process intact, no interruptions',
    trust_medium_desc: 'Minor behavior logs, evaluate comprehensively',
    trust_low_desc: 'Multiple behavior logs, use with caution',
    stat_total: 'Total Students',
    stat_submitted: 'Submitted',
    stat_writing: 'Writing',
    stat_events: 'Total Logs',
    stat_chars: 'Characters',
    stat_duration: 'Duration',
    stat_exit: 'Fullscreen Exit',
    no_tasks: 'No writing tasks yet',
    no_tasks_desc: 'Create your first task to start collecting writing evidence',
    export_evidence: 'Export Evidence',
    export_task_evidence: 'Export Evidence',
    reset_demo: 'Reset Demo Data',
    reset_confirm: 'Reset all demo data? All new tasks and writing records will be cleared and restored to the initial demo state.',
    reset_success: 'Demo data has been reset',
    export_student_msg: 'Exported evidence for "{name}" (Trust Score: {trust})',
    export_task_msg: 'Exported {count} student evidence for task "{name}"',
    join_title: 'Join Writing Task',
    join_desc: 'Enter the invite code from your teacher and your name',
    code_label: 'Invite Code',
    code_placeholder: 'e.g., ABC123',
    name_label: 'Your Name',
    name_placeholder: 'Enter your name for teacher identification',
    btn_enter: 'Start Writing',
    writing_placeholder: 'Type your writing here...',
    btn_fullscreen: 'Fullscreen',
    btn_submit_writing: 'Submit Writing',
    monitor_running: 'Monitoring Active',
    submit_modal_title: 'Confirm Submission',
    submit_modal_msg: 'After submission, your writing will be locked. The teacher will receive your original writing evidence. Submit now?',
    submitted_title: 'Submission Successful',
    submitted_desc: 'Your writing has been securely saved. The teacher can now view your original writing record.',
    submitted_chars: 'Character Count: {count}',
    submitted_stats: 'Duration: {duration} · Behavior Logs: {events}',
    time_up: "Time's up! Writing auto-submitted.",
    invalid_code: 'Invalid invite code or task closed. Please check and try again.',
    enter_code: 'Please enter invite code',
    enter_name: 'Please enter your name',
    duplicate_name: 'Name "{name}" already exists in this task. Continue? If not you, please change your name.',
    task_created: 'Task created!\nInvite Code: {code}',
    event_fullscreen_exit: 'Fullscreen Exit',
    event_page_blur: 'Page Blur',
    event_tab_switch: 'Tab Switch',
    event_paste_attempt: 'Paste Attempt',
    event_recorded_prefix: 'System recorded: ',
    ai_in_task: 'In a {duration}-minute writing task',
    ai_time_used: ', spent approximately {min} minutes',
    ai_chars_count: ', completed {count} characters',
    ai_speed: 'Writing speed {desc} (approx. {speed} chars/min)',
    ai_speed_slow: 'slow',
    ai_speed_normal: 'moderate',
    ai_speed_fast: 'fast',
    ai_no_events: 'No behavior interruption events recorded. Writing environment remained stable. <strong>High trust score</strong>.',
    ai_has_events: 'Recorded {count} behavior events ({events}).',
    ai_trust_medium: 'Minor interruptions; sample still valuable.',
    ai_trust_low: 'Multiple behavior logs; review timeline for judgment.',
    modal_default_title: 'Confirm',
    modal_default_msg: 'Are you sure you want to proceed?',
    lang_switch: '中文',
    lang_name: 'English'
  }
};

var lang = {
  _key: 'writeproof_lang',

  get() {
    var saved = localStorage.getItem(this._key);
    return (saved === 'en' || saved === 'zh-CN') ? saved : 'zh-CN';
  },

  set(code) {
    localStorage.setItem(this._key, code);
    document.documentElement.lang = (code === 'en') ? 'en' : 'zh-CN';
    this.refresh();
  },

  toggle() {
    var next = this.get() === 'zh-CN' ? 'en' : 'zh-CN';
    this.set(next);
    return next;
  },

  refresh() {
    var code = this.get();
    // Update all data-i18n elements
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].dataset.i18n;
      if (!key) continue;
      var text = this._resolve(key, code);
      if (text !== null) {
        if (els[i].tagName === 'INPUT' || els[i].tagName === 'TEXTAREA') {
          els[i].placeholder = text;
        } else if (key.indexOf('_label') > -1 && els[i].tagName === 'LABEL') {
          els[i].textContent = text;
        } else {
          els[i].innerHTML = text;
        }
      }
    }
    // Update data-i18n-placeholder elements
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var i = 0; i < phEls.length; i++) {
      var key = phEls[i].dataset.i18nPlaceholder;
      if (!key) continue;
      var text = this._resolve(key, code);
      if (text !== null) phEls[i].placeholder = text;
    }
    // Update lang switch button text
    var switchers = document.querySelectorAll('[data-lang-switch]');
    for (var i = 0; i < switchers.length; i++) {
      switchers[i].textContent = this._resolve('lang_switch', code);
    }
    // Re-render current view if applicable
    if (typeof router !== 'undefined') {
      if (router.currentView === 'teacher-dashboard') {
        teacherApp.renderDashboard();
      } else if (router.currentView === 'teacher-task') {
        teacherApp.renderTaskOverview(router._params.taskId);
      } else if (router.currentView === 'teacher-student') {
        teacherApp.renderStudentDetail(router._params.taskId, router._params.studentId);
      }
    }
  },

  _resolve(key, code) {
    var dict = i18nData[code] || i18nData['zh-CN'];
    return dict[key] !== undefined ? dict[key] : null;
  }
};

function t(key, vars) {
  var code = lang.get();
  var dict = i18nData[code] || i18nData['zh-CN'];
  var text = dict[key];
  if (text === undefined) return key;
  if (vars) {
    for (var k in vars) {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    }
  }
  return text;
}