/* ============================================
   WriteProof — 真实写作证据平台 · App Logic
   ============================================ */

/* ==================== 数据存储层 ==================== */
var store = {
  _ns: 'writeproof_',

  _get() { return JSON.parse(localStorage.getItem(this._ns + 'data') || 'null'); },
  _set(d) { localStorage.setItem(this._ns + 'data', JSON.stringify(d)); },

  reset() {
    localStorage.removeItem(this._ns + 'data');
    this.init();
  },

  init() {
    var d = this._get();
    if (!d) {
      d = this._seed();
      this._set(d);
    }
    return d;
  },

  _seed() {
    var now = Date.now();
    var T = function(n) { return new Date(now - n * 60000).toISOString(); };
    return {
      tasks: [
        {
          id: 't1',
          name: 'Grade 10 议论文写作',
          description: '请围绕"人工智能对教育的影响"这一话题，写一篇不少于300词的议论文。请阐述你的观点，并用具体例子支持你的论点。',
          duration: 30,
          inviteCode: 'AIEDU1',
          createdAt: T(120),
          status: 'active',
          students: [
            {
              id: 's1',
              name: '李明',
              status: 'submitted',
              content: 'Artificial intelligence is transforming education in profound ways. In my view, AI serves as a powerful tool that can personalize learning experiences for each student. For example, adaptive learning platforms can adjust difficulty levels based on individual performance, allowing students to learn at their own pace. However, we must also consider the challenges. One major concern is data privacy — schools need to ensure that student information is protected. Another issue is the digital divide; not all students have equal access to AI-powered tools. Despite these challenges, I believe the benefits outweigh the risks. AI can help teachers identify struggling students early and provide targeted support. It can also automate routine tasks, freeing up teachers to focus on meaningful interactions with students.',
              events: [
                { type: 'fullscreen_exit', timestamp: T(95), detail: '退出全屏模式' },
                { type: 'page_blur', timestamp: T(90), detail: '窗口失去焦点' },
                { type: 'fullscreen_exit', timestamp: T(85), detail: '退出全屏模式' },
                { type: 'tab_switch', timestamp: T(80), detail: '切换到其他标签页' },
                { type: 'paste_attempt', timestamp: T(75), detail: '尝试粘贴内容' }
              ],
              startTime: T(30),
              submitTime: T(2)
            },
            {
              id: 's2',
              name: '王芳',
              status: 'submitted',
              content: 'The role of AI in education is a topic of heated debate. On one hand, AI offers unprecedented opportunities for customization. Students can receive instant feedback on their work, and intelligent tutoring systems can provide explanations tailored to each learner\'s needs. On the other hand, there are legitimate concerns about over-reliance on technology. If students become too dependent on AI for answers, they may not develop critical thinking skills. Additionally, teachers worry that AI might replace rather than augment their role. I believe the key is finding the right balance. Schools should integrate AI as a supplementary tool while maintaining the human element of teaching. The goal should be to use AI to enhance, not replace, the educational experience.',
              events: [
                { type: 'page_blur', timestamp: T(88), detail: '窗口失去焦点' },
                { type: 'tab_switch', timestamp: T(70), detail: '切换到其他标签页' }
              ],
              startTime: T(29),
              submitTime: T(4)
            },
            {
              id: 's3',
              name: '张伟',
              status: 'writing',
              content: 'I think AI is changing how we learn. In my school, we use some AI tools for math practice and they help me understand difficult concepts. The computer can show me step-by-step solutions which is helpful. But sometimes I prefer asking my teacher because they can explain things in different ways until I understand. I think AI will not replace teachers because teaching is not just about giving information. Teachers also help us grow as people and learn values. So in the future, maybe AI and teachers can work together to help students learn better.',
              events: [
                { type: 'paste_attempt', timestamp: T(60), detail: '尝试粘贴内容' }
              ],
              startTime: T(28),
              submitTime: null
            }
          ]
        },
        {
          id: 't2',
          name: 'Grade 8 记叙文写作',
          description: '写一篇关于"一次难忘的经历"的记叙文。请描述发生了什么、你的感受以及这次经历对你的影响。不少于200词。',
          duration: 25,
          inviteCode: 'STORY2',
          createdAt: T(200),
          status: 'active',
          students: [
            {
              id: 's4',
              name: '赵雪',
              status: 'submitted',
              content: 'Last summer, I had an experience that I will never forget. My family and I visited a small village in the mountains. At first, I was not happy about going because I thought it would be boring without internet or video games. However, during our stay, I discovered something unexpected. The villagers were incredibly kind and welcoming. They taught me how to plant rice in the fields, which was much harder than it looks. I also learned to cook traditional dishes using fresh ingredients from their garden. The most memorable moment was when we sat around a campfire at night, listening to stories told by the village elders. These stories were passed down through generations and contained wisdom about life and nature. This experience changed my perspective on what truly matters in life. It taught me to appreciate simple joys and human connections rather than material things.',
              events: [],
              startTime: T(55),
              submitTime: T(24)
            },
            {
              id: 's5',
              name: '刘洋',
              status: 'submitted',
              content: 'My most unforgettable experience happened during a school camping trip. We were hiking in the forest when suddenly the weather changed. Dark clouds gathered and it started raining heavily. Our group got separated from the main team and we had to find our way back using a map and compass. At first, I was scared and wanted to give up. But our team leader, Sarah, encouraged us to stay calm and work together. We used the map to identify landmarks and slowly made our way back to the campsite. The hike took us three hours instead of the planned one hour. When we finally arrived, everyone cheered. That day taught me the importance of teamwork and staying calm under pressure. I realized that challenges can be opportunities to discover our inner strength. This experience made me more confident in facing difficult situations.',
              events: [
                { type: 'tab_switch', timestamp: T(45), detail: '切换到其他标签页' },
                { type: 'page_blur', timestamp: T(40), detail: '窗口失去焦点' },
                { type: 'fullscreen_exit', timestamp: T(38), detail: '退出全屏模式' },
                { type: 'tab_switch', timestamp: T(30), detail: '切换到其他标签页' },
                { type: 'paste_attempt', timestamp: T(28), detail: '尝试粘贴内容' }
              ],
              startTime: T(55),
              submitTime: T(26)
            }
          ]
        }
      ]
    };
  },

  getData() { return this._get() || this.init(); },
  saveData(d) { this._set(d); },

  getTasks() { return this.getData().tasks; },

  getTask(id) {
    var t = this.getData().tasks;
    for (var i = 0; i < t.length; i++) if (t[i].id === id) return t[i];
    return null;
  },

  addTask(task) {
    var d = this.getData();
    d.tasks.push(task);
    this.saveData(d);
  },

  getStudent(taskId, studentId) {
    var task = this.getTask(taskId);
    if (!task) return null;
    for (var i = 0; i < task.students.length; i++)
      if (task.students[i].id === studentId) return task.students[i];
    return null;
  },

  addStudent(taskId, student) {
    var d = this.getData();
    for (var i = 0; i < d.tasks.length; i++) {
      if (d.tasks[i].id === taskId) {
        d.tasks[i].students.push(student);
        this.saveData(d);
        return true;
      }
    }
    return false;
  },

  updateStudent(taskId, studentId, updates) {
    var d = this.getData();
    for (var i = 0; i < d.tasks.length; i++) {
      if (d.tasks[i].id === taskId) {
        for (var j = 0; j < d.tasks[i].students.length; j++) {
          if (d.tasks[i].students[j].id === studentId) {
            for (var k in updates) d.tasks[i].students[j][k] = updates[k];
            this.saveData(d);
            return true;
          }
        }
      }
    }
    return false;
  },

  addEvent(taskId, studentId, event) {
    var d = this.getData();
    for (var i = 0; i < d.tasks.length; i++) {
      if (d.tasks[i].id === taskId) {
        for (var j = 0; j < d.tasks[i].students.length; j++) {
          if (d.tasks[i].students[j].id === studentId) {
            d.tasks[i].students[j].events.push(event);
            this.saveData(d);
            return true;
          }
        }
      }
    }
    return false;
  },

  findTaskByInviteCode(code) {
    var tasks = this.getData().tasks;
    for (var i = 0; i < tasks.length; i++)
      if (tasks[i].inviteCode.toUpperCase() === code.toUpperCase().trim() && tasks[i].status === 'active')
        return tasks[i];
    return null;
  },

  generateId() { return 'id_' + Math.random().toString(36).slice(2, 9); },

  generateInviteCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
};

/* ==================== 路由层 ==================== */
var router = {
  currentView: null,

  navigate(view, params) {
    // 强制关闭任何残留的弹窗和提示
    ui.hideModal();
    ui.hideAllToasts();
    var eventBar = document.getElementById('event-bar');
    var eventAlert = document.getElementById('event-alert');
    if (eventBar) eventBar.classList.remove('show');
    if (eventAlert) eventAlert.classList.remove('show');

    // 隐藏所有顶级视图
    var views = ['home', 'teacher', 'student-join', 'student-writing', 'student-submitted'];
    for (var i = 0; i < views.length; i++) {
      var el = document.getElementById('view-' + views[i]);
      if (el) el.style.display = 'none';
    }

    // 如果在教师端，隐藏内部子视图
    var teacherViews = ['teacher-dashboard', 'teacher-create', 'teacher-task', 'teacher-student'];
    for (var i = 0; i < teacherViews.length; i++) {
      var el = document.getElementById(teacherViews[i]);
      if (el) el.style.display = 'none';
    }

    // 存储参数
    this._params = params || {};

    switch (view) {
      case 'home':
        document.getElementById('view-home').style.display = '';
        break;

      case 'teacher':
      case 'teacher-dashboard':
        document.getElementById('view-teacher').style.display = '';
        document.getElementById('teacher-dashboard').style.display = '';
        this._activateSidebar('teacher-dashboard');
        teacherApp.renderDashboard();
        break;

      case 'teacher-create':
        document.getElementById('view-teacher').style.display = '';
        document.getElementById('teacher-create').style.display = '';
        this._activateSidebar('teacher-create');
        teacherApp.resetCreateForm();
        break;

      case 'teacher-task':
        document.getElementById('view-teacher').style.display = '';
        document.getElementById('teacher-task').style.display = '';
        this._activateSidebar('teacher-dashboard');
        teacherApp.renderTaskOverview(this._params.taskId);
        break;

      case 'teacher-student':
        document.getElementById('view-teacher').style.display = '';
        document.getElementById('teacher-student').style.display = '';
        this._activateSidebar('teacher-dashboard');
        teacherApp.renderStudentDetail(this._params.taskId, this._params.studentId);
        break;

      case 'student-join':
        document.getElementById('view-student-join').style.display = '';
        break;

      case 'student-writing':
        document.getElementById('view-student-writing').style.display = '';
        studentApp.startWritingSession();
        break;

      case 'student-submitted':
        document.getElementById('view-student-submitted').style.display = '';
        studentApp.showSubmittedInfo();
        break;

      default:
        document.getElementById('view-home').style.display = '';
    }

    this.currentView = view;
    window.scrollTo(0, 0);
  },

  _activateSidebar(viewId) {
    var links = document.querySelectorAll('#sidebar-nav a');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('active', links[i].dataset.view === viewId);
    }
  },

  getParam(key) { return this._params ? this._params[key] : null; }
};

/* ==================== UI 工具 ==================== */
var ui = {
  showModal(title, msg, cb) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = msg;
    var btn = document.getElementById('modal-confirm-btn');
    btn.onclick = function() { ui.hideModal(); if (cb) cb(); };
    document.getElementById('modal-overlay').classList.add('show');
  },
  hideModal() {
    document.getElementById('modal-overlay').classList.remove('show');
  },

  showToast(msg, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);
    // Trigger reflow for animation
    toast.offsetHeight;
    toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 2500);
  },
  hideAllToasts() {
    var toasts = document.querySelectorAll('.toast');
    for (var i = 0; i < toasts.length; i++) {
      toasts[i].classList.remove('show');
    }
  },

  calculateTrustScore(events) {
    var count = (events || []).length;
    if (count === 0) return { level: 'high', label: '高', color: 'success', text: '写作过程完整，无异常中断' };
    if (count <= 2) return { level: 'medium', label: '中', color: 'warning', text: '有少量行为记录，建议综合评估' };
    return { level: 'low', label: '低', color: 'danger', text: '多次行为记录，需谨慎参考' };
  },

  formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  },

  formatDuration(ms) {
    var totalSec = Math.floor(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return m + '分' + s + '秒';
  },

  formatTimestamp(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },

  countChars(text) {
    if (!text) return 0;
    var cleaned = text.replace(/\s/g, '');
    return cleaned.length;
  },

  getEventLabel(type) {
    var map = {
      fullscreen_exit: 'event_fullscreen_exit',
      page_blur: 'event_page_blur',
      tab_switch: 'event_tab_switch',
      paste_attempt: 'event_paste_attempt'
    };
    return t(map[type]) || type;
  },

  getEventClass(type) {
    var classes = {
      fullscreen_exit: 'event-exit',
      page_blur: 'event-blur',
      tab_switch: 'event-tab',
      paste_attempt: 'event-paste'
    };
    return classes[type] || '';
  },

  getEventIcon(type) {
    var icons = {
      fullscreen_exit: '\u26A0',
      page_blur: '\u{1F440}',
      tab_switch: '\u{1F310}',
      paste_attempt: '\u{1F4CB}'
    };
    return icons[type] || '\u2022';
  }
};

/* ==================== 教师端逻辑 ==================== */
var teacherApp = {
  createTask() {
    var name = document.getElementById('task-name').value.trim();
    var desc = document.getElementById('task-desc').value.trim();
    var duration = parseInt(document.getElementById('task-duration').value) || 30;
    var inviteCode = document.getElementById('task-invite').value.trim().toUpperCase();

    if (!name) { alert('请输入任务名称'); return; }
    if (!inviteCode) { inviteCode = store.generateInviteCode(); }

    var task = {
      id: store.generateId(),
      name: name,
      description: desc,
      duration: duration,
      inviteCode: inviteCode,
      createdAt: new Date().toISOString(),
      status: 'active',
      students: []
    };

    store.addTask(task);
    alert('任务创建成功！\n邀请码：' + inviteCode);
    router.navigate('teacher-dashboard');
  },

  resetCreateForm() {
    document.getElementById('task-name').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-duration').value = '30';
    document.getElementById('task-invite').value = '';
  },

  renderDashboard() {
    var container = document.getElementById('teacher-dashboard-body');
    var tasks = store.getTasks();

    if (!tasks || tasks.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">&#x1F4DD;</div>' +
          '<h3>' + t('no_tasks') + '</h3>' +
          '<p>' + t('no_tasks_desc') + '</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < tasks.length; i++) {
      var taskItem = tasks[i];
      var submittedCount = 0;
      var totalStudents = taskItem.students.length;
      for (var j = 0; j < taskItem.students.length; j++) {
        if (taskItem.students[j].status === 'submitted') submittedCount++;
      }

      html +=
        '<div class="task-card mb-2" onclick="router.navigate(\'teacher-task\', {taskId:\'' + taskItem.id + '\'})">' +
          '<div class="flex-between">' +
            '<div>' +
              '<div class="task-card-title">' + taskItem.name + '</div>' +
              '<div class="task-card-meta">' +
                '<span class="invite-code">' + taskItem.inviteCode + '</span>' +
                '<span class="dot-sep">&#x2022;</span>' +
                '<span>' + taskItem.duration + ' ' + t('unit_minute') + '</span>' +
                '<span class="dot-sep">&#x2022;</span>' +
                '<span>' + (new Date(taskItem.createdAt)).toLocaleDateString() + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="task-card-stat">' +
              '<div class="stat-num">' + submittedCount + '<span style="font-size:0.85rem;color:var(--muted);font-weight:500;">/' + totalStudents + '</span></div>' +
              '<div class="stat-caption">' + t('status_submitted') + '</div>' +
            '</div>' +
          '</div>' +
          (taskItem.description ?
            '<div class="task-card-desc">' +
              taskItem.description.slice(0, 80) + (taskItem.description.length > 80 ? '...' : '') +
            '</div>' : '') +
        '</div>';
    }
    container.innerHTML = html;
  },

  renderTaskOverview(taskId) {
    var task = store.getTask(taskId);
    if (!task) { router.navigate('teacher-dashboard'); return; }

    // Header
    document.getElementById('task-header').innerHTML =
      '<div class="flex-between">' +
        '<div>' +
          '<h2>' + task.name + '</h2>' +
          '<p>邀请码：<strong>' + task.inviteCode + '</strong> &middot; ' + task.duration + '分钟 &middot; ' +
            (new Date(task.createdAt)).toLocaleDateString('zh-CN') +
            ' &middot; <span class="badge badge-success">进行中</span></p>' +
        '</div>' +
        '<div style="display:flex;gap:0.5rem;">' +
          '<button class="btn btn-secondary btn-sm" onclick="teacherApp.exportTaskEvidence(\'' + taskId + '\')">导出证据</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="router.navigate(\'teacher-dashboard\')">返回</button>' +
        '</div>' +
      '</div>';

    // Stats
    var students = task.students;
    var total = students.length;
    var submitted = 0;
    var totalEvents = 0;
    var writingNow = 0;
    for (var i = 0; i < students.length; i++) {
      if (students[i].status === 'submitted') submitted++;
      else writingNow++;
      totalEvents += (students[i].events || []).length;
    }
    document.getElementById('task-stats').innerHTML =
      '<div class="card stat-card"><div class="stat-value accent">' + total + '</div><div class="stat-label">' + t('stat_total') + '</div></div>' +
      '<div class="card stat-card"><div class="stat-value success">' + submitted + '</div><div class="stat-label">' + t('stat_submitted') + '</div></div>' +
      '<div class="card stat-card"><div class="stat-value warning">' + writingNow + '</div><div class="stat-label">' + t('stat_writing') + '</div></div>' +
      '<div class="card stat-card"><div class="stat-value">' + totalEvents + '</div><div class="stat-label">' + t('stat_events') + '</div></div>';

    // Student table
    var tbody = document.getElementById('task-student-table');
    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="padding:2rem;">暂无学生加入此任务</td></tr>';
      return;
    }

    var rows = '';
    for (var i = 0; i < students.length; i++) {
      var s = students[i];
      var eventCount = (s.events || []).length;
      var duration = '';
      var charCount = 0;
      var statusBadge = '';

      if (s.status === 'submitted') {
        charCount = ui.countChars(s.content);
        if (s.submitTime && s.startTime) {
          duration = ui.formatDuration(new Date(s.submitTime).getTime() - new Date(s.startTime).getTime());
        }
        statusBadge = '<span class="badge badge-success">' + t('status_submitted') + '</span>';
      } else {
        statusBadge = '<span class="badge badge-warning">' + t('status_writing') + '</span>';
      }

      var eventBadge = eventCount > 0
        ? '<span class="badge ' + (eventCount >= 3 ? 'badge-danger' : 'badge-warning') + '">' + eventCount + ' 次</span>'
        : '<span class="text-muted">0</span>';

      var trust = ui.calculateTrustScore(s.events);
      var trustBadge = '<span class="badge badge-' + trust.color + '">' + trust.label + '</span>';

      rows +=
        '<tr>' +
          '<td><strong>' + s.name + '</strong></td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' + trustBadge + '</td>' +
          '<td>' + eventBadge + '</td>' +
          '<td>' + (duration || '--') + '</td>' +
          '<td>' + (charCount || '--') + '</td>' +
          '<td style="text-align:right;">' +
            '<button class="btn btn-sm btn-secondary" onclick="router.navigate(\'teacher-student\', {taskId:\'' + taskId + '\',studentId:\'' + s.id + '\'})">查看详情</button>' +
          '</td>' +
        '</tr>';
    }
    tbody.innerHTML = rows;
  },

  renderStudentDetail(taskId, studentId) {
    var task = store.getTask(taskId);
    var student = store.getStudent(taskId, studentId);
    if (!task || !student) { router.navigate('teacher-dashboard'); return; }

    // Header
    document.getElementById('student-detail-header').innerHTML =
      '<div class="flex-between">' +
        '<div>' +
          '<h2>' + student.name + ' — 写作详情</h2>' +
          '<p>任务：' + task.name + ' &middot; 邀请码：' + task.inviteCode + '</p>' +
        '</div>' +
        '<div style="display:flex;gap:0.5rem;">' +
          '<button class="btn btn-secondary btn-sm" onclick="teacherApp.exportEvidence(\'' + taskId + '\',\'' + studentId + '\')">导出证据</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="router.navigate(\'teacher-task\', {taskId:\'' + taskId + '\'})">返回</button>' +
        '</div>' +
      '</div>';

    // Stats
    var events = student.events || [];
    var charCount = ui.countChars(student.content);
    var durationMs = (student.submitTime && student.startTime)
      ? new Date(student.submitTime).getTime() - new Date(student.startTime).getTime()
      : 0;
    var durationStr = durationMs ? ui.formatDuration(durationMs) : '--';
    var eventCounts = { fullscreen_exit: 0, page_blur: 0, tab_switch: 0, paste_attempt: 0 };
    for (var i = 0; i < events.length; i++) {
      if (eventCounts[events[i].type] !== undefined) eventCounts[events[i].type]++;
    }

    var trust = ui.calculateTrustScore(events);

    document.getElementById('student-stats').innerHTML =
      '<div class="card stat-card"><div class="stat-value">' + durationStr + '</div><div class="stat-label">写作时长</div></div>' +
      '<div class="card stat-card"><div class="stat-value accent">' + charCount + '</div><div class="stat-label">总字符数</div></div>' +
      '<div class="card stat-card"><div class="stat-value ' + (events.length > 0 ? 'warning' : 'success') + '">' + events.length + '</div><div class="stat-label">行为记录</div></div>' +
      '<div class="card stat-card"><div class="stat-value badge-' + trust.color + '" style="font-size:1.4rem;">' + trust.label + '</div><div class="stat-label">可信指数</div></div>';

    // AI Summary
    document.getElementById('student-ai-summary').innerHTML =
      '<div class="ai-header">' +
        '<div class="ai-icon">&#x2211;</div>' +
        '<h4>' + t('ai_summary') + '</h4>' +
        '<span class="badge badge-' + trust.color + '" style="margin-left:auto;">' + t('trust_label_prefix') + trust.label + '</span>' +
      '</div>' +
      '<div class="ai-body">' +
        this._generateAISummary(student, task) +
      '</div>';

    // Writing content
    document.getElementById('student-writing-content').textContent = student.content || '（暂无内容）';

    // Timeline
    var timeline = document.getElementById('student-timeline');
    if (!events || events.length === 0) {
      timeline.innerHTML = '<div class="text-muted" style="padding:1rem 0;font-size:0.85rem;">写作过程中未记录到行为中断事件</div>';
    } else {
      var tlHtml = '';
      // Sort by timestamp
      events.sort(function(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        tlHtml +=
          '<div class="timeline-item ' + ui.getEventClass(e.type) + '">' +
            '<div class="event-time">' + ui.formatTimestamp(e.timestamp) + '</div>' +
            '<div class="event-label">' + ui.getEventIcon(e.type) + ' ' + ui.getEventLabel(e.type) + '</div>' +
            '<div class="event-detail">' + (e.detail || '') + '</div>' +
          '</div>';
      }
      timeline.innerHTML = tlHtml;
    }
  },

  _generateAISummary(student, task) {
    var events = student.events || [];
    var charCount = ui.countChars(student.content);
    var durationMs = (student.submitTime && student.startTime)
      ? new Date(student.submitTime).getTime() - new Date(student.startTime).getTime()
      : 0;
    var durationMin = durationMs ? Math.round(durationMs / 60000) : 0;

    var items = [];

    // Basic info
    var infoLine = t('ai_in_task', { duration: task.duration });
    if (durationMin > 0) infoLine += t('ai_time_used', { min: durationMin });
    if (charCount > 0) infoLine += t('ai_chars_count', { count: charCount });
    infoLine += '.';
    items.push(infoLine);

    // Writing speed
    if (durationMin > 0 && charCount > 0) {
      var speed = Math.round(charCount / durationMin);
      var speedDesc = t(speed < 15 ? 'ai_speed_slow' : (speed < 30 ? 'ai_speed_normal' : 'ai_speed_fast'));
      items.push(t('ai_speed', { desc: speedDesc, speed: speed }));
    }

    // Event analysis
    if (events.length === 0) {
      items.push(t('ai_no_events'));
    } else {
      var exitCount = 0, blurCount = 0, tabCount = 0, pasteCount = 0;
      for (var i = 0; i < events.length; i++) {
        if (events[i].type === 'fullscreen_exit') exitCount++;
        else if (events[i].type === 'page_blur') blurCount++;
        else if (events[i].type === 'tab_switch') tabCount++;
        else if (events[i].type === 'paste_attempt') pasteCount++;
      }

      var eventParts = [];
      if (exitCount > 0) eventParts.push(t('event_fullscreen_exit') + ' ' + exitCount);
      if (blurCount > 0) eventParts.push(t('event_page_blur') + ' ' + blurCount);
      if (tabCount > 0) eventParts.push(t('event_tab_switch') + ' ' + tabCount);
      if (pasteCount > 0) eventParts.push(t('event_paste_attempt') + ' ' + pasteCount);

      var trust = ui.calculateTrustScore(events);
      var eventLine = t('ai_has_events', { count: events.length, events: eventParts.join(', ') });
      if (trust.level === 'medium') eventLine += ' ' + t('ai_trust_medium');
      else if (trust.level === 'low') eventLine += ' ' + t('ai_trust_low');
      items.push(eventLine);
    }

    var html = '<ul style="margin:0;padding-left:1.2rem;">';
    for (var i = 0; i < items.length; i++) {
      html += '<li style="margin-bottom:0.35rem;">' + items[i] + '</li>';
    }
    html += '</ul>';
    html += '<div class="ai-footer">' + t('ai_summary_footer') + '</div>';

    return html;
  },

  exportEvidence(taskId, studentId) {
    var task = store.getTask(taskId);
    var student = store.getStudent(taskId, studentId);
    if (!task || !student) return;
    var trust = ui.calculateTrustScore(student.events);
    ui.showToast('已导出 "' + student.name + '" 的可信写作证据（可信指数：' + trust.label + '）', 'success');
  },

  exportTaskEvidence(taskId) {
    var task = store.getTask(taskId);
    if (!task) return;
    var submitted = 0;
    for (var i = 0; i < task.students.length; i++) {
      if (task.students[i].status === 'submitted') submitted++;
    }
    ui.showToast('已导出任务 "' + task.name + '" 的 ' + submitted + ' 份学生写作证据', 'success');
  },

  resetDemo() {
    if (!confirm('确定要重置所有 Demo 数据吗？所有新增的任务和写作记录将被清除，恢复到初始演示状态。')) return;
    store.reset();
    ui.showToast('Demo 数据已重置', 'success');
    router.navigate('teacher-dashboard');
  }
};

/* ==================== 学生端逻辑 ==================== */
var studentApp = {
  currentTaskId: null,
  currentStudentId: null,
  timerInterval: null,
  remainingSeconds: 0,
  fullscreenRequested: false,
  eventMonitoringStarted: false,

  joinTask() {
    var code = document.getElementById('join-code').value.trim().toUpperCase();
    var name = document.getElementById('join-name').value.trim();

    if (!code) { alert('请输入邀请码'); return; }
    if (!name) { alert('请输入你的姓名'); return; }

    var task = store.findTaskByInviteCode(code);
    if (!task) {
      alert('邀请码无效或任务已关闭，请确认后重试。');
      return;
    }

    // 检查是否重名
    for (var i = 0; i < task.students.length; i++) {
      if (task.students[i].name === name) {
        if (!confirm('姓名"' + name + '"已存在于该任务中，是否继续？如非本人请修改姓名。')) return;
      }
    }

    this.currentTaskId = task.id;
    this.currentStudentId = store.generateId();

    var student = {
      id: this.currentStudentId,
      name: name,
      status: 'writing',
      content: '',
      events: [],
      startTime: new Date().toISOString(),
      submitTime: null
    };

    store.addStudent(task.id, student);

    // 设置写作页面信息
    document.getElementById('writing-task-name').innerHTML = '<strong>' + task.name + '</strong>';
    document.getElementById('writing-student-name').textContent = '学生：' + name;
    document.getElementById('writing-prompt').textContent = task.description || '请根据任务要求开始写作。';
    document.getElementById('writing-textarea').value = '';
    document.getElementById('writing-textarea').disabled = false;

    // 设置计时器
    this.remainingSeconds = task.duration * 60;
    this.updateTimerDisplay();

    router.navigate('student-writing');
  },

  startWritingSession() {
    var textarea = document.getElementById('writing-textarea');
    textarea.focus();

    // 请求全屏
    this.requestFullscreen();

    // 启动计时器
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(this._tick.bind(this), 1000);

    // 启动事件监控（只启动一次）
    if (!this.eventMonitoringStarted) {
      this.startEventMonitoring();
      this.eventMonitoringStarted = true;
    }
  },

  _tick() {
    if (this.remainingSeconds <= 0) {
      clearInterval(this.timerInterval);
      this.autoSubmit();
      return;
    }
    this.remainingSeconds--;
    this.updateTimerDisplay();

    // 自动保存内容
    this.autoSaveContent();
  },

  updateTimerDisplay() {
    var el = document.getElementById('writing-timer');
    el.textContent = ui.formatTime(this.remainingSeconds);
    el.className = 'writing-timer';
    if (this.remainingSeconds <= 60) el.classList.add('danger');
    else if (this.remainingSeconds <= 300) el.classList.add('warning');
  },

  requestFullscreen() {
    var el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(function() {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
    this.fullscreenRequested = true;
  },

  toggleFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      this.requestFullscreen();
    }
  },

  autoSaveContent() {
    var content = document.getElementById('writing-textarea').value;
    store.updateStudent(this.currentTaskId, this.currentStudentId, { content: content });
  },

  /** 事件监控 */
  startEventMonitoring() {
    var self = this;

    // 1. 全屏变化
    document.addEventListener('fullscreenchange', function() {
      if (!document.fullscreenElement && self.currentViewIsActive()) {
        self.recordEvent('fullscreen_exit', '退出全屏模式');
        self.showEventBar('系统已记录：退出全屏模式');
      }
    });
    document.addEventListener('webkitfullscreenchange', function() {
      if (!document.webkitFullscreenElement && self.currentViewIsActive()) {
        self.recordEvent('fullscreen_exit', '退出全屏模式');
        self.showEventBar('系统已记录：退出全屏模式');
      }
    });

    // 2. 页面失焦
    window.addEventListener('blur', function() {
      if (self.currentViewIsActive()) {
        self.recordEvent('page_blur', '窗口失去焦点');
        self.showEventBar('系统已记录：页面失焦');
      }
    });

    // 3. 标签页切换
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && self.currentViewIsActive()) {
        self.recordEvent('tab_switch', '切换到其他标签页');
        self.showEventBar('系统已记录：标签页切换');
      }
    });

    // 4. 阻止粘贴
    var textarea = document.getElementById('writing-textarea');
    textarea.addEventListener('paste', function(e) {
      e.preventDefault();
      self.recordEvent('paste_attempt', '尝试粘贴内容');
      self.showEventAlert('系统已记录粘贴尝试，请独立完成写作');
    });
  },

  currentViewIsActive() {
    var el = document.getElementById('view-student-writing');
    return el && el.style.display !== 'none';
  },

  recordEvent(type, detail) {
    var event = {
      type: type,
      timestamp: new Date().toISOString(),
      detail: detail
    };
    store.addEvent(this.currentTaskId, this.currentStudentId, event);
  },

  showEventBar(msg) {
    var bar = document.getElementById('event-bar');
    document.getElementById('event-bar-msg').textContent = msg;
    bar.classList.add('show');
    // Auto-hide after 4s
    var self = this;
    if (this._eventBarTimer) clearTimeout(this._eventBarTimer);
    this._eventBarTimer = setTimeout(function() { bar.classList.remove('show'); }, 4000);
  },

  showEventAlert(msg) {
    var alert = document.getElementById('event-alert');
    document.getElementById('event-alert-msg').textContent = msg;
    alert.classList.add('show');
    if (this._eventAlertTimer) clearTimeout(this._eventAlertTimer);
    this._eventAlertTimer = setTimeout(function() { alert.classList.remove('show'); }, 3000);
  },

  submitWriting() {
    var self = this;
    ui.showModal('确认提交', '提交后写作内容将被锁定，教师将收到你的原始写作证据。确定现在提交吗？', function() {
      self._doSubmit();
    });
  },

  autoSubmit() {
    alert('时间到！写作已自动提交。');
    this._doSubmit();
  },

  _doSubmit() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    var content = document.getElementById('writing-textarea').value;

    store.updateStudent(this.currentTaskId, this.currentStudentId, {
      content: content,
      status: 'submitted',
      submitTime: new Date().toISOString()
    });

    document.getElementById('writing-textarea').disabled = true;

    // 退出全屏
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function() {});
    }

    router.navigate('student-submitted');
  },

  showSubmittedInfo() {
    var student = store.getStudent(this.currentTaskId, this.currentStudentId);
    if (!student) return;

    var charCount = ui.countChars(student.content);
    var events = student.events || [];
    var durationMs = student.submitTime && student.startTime
      ? new Date(student.submitTime).getTime() - new Date(student.startTime).getTime()
      : 0;
    var durationStr = durationMs ? ui.formatDuration(durationMs) : '--';

    document.getElementById('submitted-word-count').textContent = '\u270F\uFE0F 写作字数：' + charCount + ' 字符';
    document.getElementById('submitted-events').innerHTML =
      '\u{1F50D} 写作时长：' + durationStr + ' &middot; 异常事件：' + events.length + ' 次';
  }
};

/* ==================== 应用初始化 ==================== */
(function boot() {
  // 初始化数据
  store.init();

  // 初始化语言
  lang.refresh();

  // 默认路由到首页
  router.navigate('home');
})();