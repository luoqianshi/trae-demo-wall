/**
 * 数字智能产教项目云平台 - 工作台快捷操作模块
 * 为企业/教师/学生三个工作台提供统一的快捷操作弹窗与表单提交
 */
(function() {
  'use strict';

  // 通用模态框容器（需在页面中放置 id="quickActionModal" 的容器）
  var modal = document.getElementById('quickActionModal');
  var modalTitle = document.getElementById('quickActionTitle');
  var modalBody = document.getElementById('quickActionBody');
  var closeBtn = document.getElementById('quickActionClose');

  function openModal() {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
  }

  // 将数据存入 localStorage（模拟后端持久化）
  function saveData(key, item) {
    var list = JSON.parse(localStorage.getItem('dtp_' + key) || '[]');
    item.id = Date.now().toString();
    item.createdAt = new Date().toISOString();
    list.push(item);
    localStorage.setItem('dtp_' + key, JSON.stringify(list));
  }

  function collectForm(form) {
    var data = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function(input) {
      if (input.type === 'file') {
        data[input.name] = input.files && input.files[0] ? input.files[0].name : '';
      } else {
        data[input.name] = input.value.trim();
      }
    });
    return data;
  }

  function buildField(field) {
    var html = '<div class="form-group">';
    html += '<label>' + field.label + (field.required ? ' <span style="color:#ef4444">*</span>' : '') + '</label>';
    if (field.type === 'select') {
      html += '<select name="' + field.name + '" ' + (field.required ? 'required' : '') + '>';
      field.options.forEach(function(opt) {
        html += '<option value="' + opt.value + '">' + opt.label + '</option>';
      });
      html += '</select>';
    } else if (field.type === 'textarea') {
      html += '<textarea name="' + field.name + '" rows="4" ' + (field.required ? 'required' : '') + ' placeholder="' + (field.placeholder || '') + '"></textarea>';
    } else if (field.type === 'file') {
      html += '<input type="file" name="' + field.name + '" ' + (field.required ? 'required' : '') + '>';
    } else {
      html += '<input type="' + (field.type || 'text') + '" name="' + field.name + '" ' + (field.required ? 'required' : '') + ' placeholder="' + (field.placeholder || '') + '">';
    }
    html += '</div>';
    return html;
  }

  var ACTION_CONFIG = {
    // 企业工作台
    enterprisePublishProject: {
      title: '发布项目需求',
      storageKey: 'enterpriseProjects',
      fields: [
        { name: 'name', label: '项目名称', required: true, placeholder: '例如：智能仓储管理系统' },
        { name: 'description', label: '需求描述', type: 'textarea', required: true, placeholder: '简要描述项目背景与目标' },
        { name: 'techStack', label: '技术栈', required: true, placeholder: '例如：Vue3 + SpringBoot + MySQL' },
        { name: 'teamSize', label: '团队规模', type: 'number', required: true, placeholder: '建议团队人数' },
        { name: 'deadline', label: '截止时间', type: 'date', required: true },
        { name: 'reward', label: '悬赏/学分', required: true, placeholder: '例如：8 学分' }
      ]
    },
    enterpriseUploadStandard: {
      title: '上传技术标准/资料',
      storageKey: 'enterpriseResources',
      fields: [
        { name: 'title', label: '资料名称', required: true },
        { name: 'type', label: '资料类型', type: 'select', required: true, options: [
          { value: 'standard', label: '技术标准' },
          { value: 'document', label: '项目文档' },
          { value: 'case', label: '行业案例' },
          { value: 'courseware', label: '课件教案' }
        ]},
        { name: 'course', label: '适用课程/项目', placeholder: '可选' },
        { name: 'file', label: '上传文件', type: 'file', required: true }
      ]
    },
    enterpriseBookLecture: {
      title: '预约线上讲座',
      storageKey: 'enterpriseLectures',
      fields: [
        { name: 'topic', label: '讲座主题', required: true },
        { name: 'time', label: '计划时间', type: 'datetime-local', required: true },
        { name: 'audience', label: '面向对象', placeholder: '例如：软件工程专业学生' },
        { name: 'form', label: '讲座形式', type: 'select', options: [
          { value: 'live', label: '直播' },
          { value: 'record', label: '录播' },
          { value: 'interaction', label: '互动答疑' }
        ]}
      ]
    },
    enterprisePortfolio: {
      title: '学生作品库',
      content: '<div class="empty-state"><div class="empty-state-icon">&#127912;</div><h4>优秀作品展示</h4><p>供应链可视化大屏、智能仓储系统、质量检测AI模型等作品已收录，企业可在线浏览并预约面试。</p></div>'
    },
    enterpriseResumes: {
      title: '接单学生简历',
      content: '<div class="empty-state"><div class="empty-state-icon">&#128100;</div><h4>人才简历库</h4><p>已收录 48 份学生简历，支持按技术栈、项目经验、能力雷达图筛选。</p></div>'
    },
    enterpriseInterview: {
      title: '预约远程面试/评审',
      storageKey: 'enterpriseInterviews',
      fields: [
        { name: 'type', label: '类型', type: 'select', options: [
          { value: 'interview', label: '视频面试' },
          { value: 'defense', label: '项目答辩' },
          { value: 'review', label: '成果评审' }
        ]},
        { name: 'topic', label: '主题', required: true },
        { name: 'participants', label: '参与人员', placeholder: '例如：3名学生' },
        { name: 'time', label: '时间', type: 'datetime-local', required: true }
      ]
    },

    // 教师工作台
    teacherPublishTask: {
      title: '发布项目任务',
      storageKey: 'teacherTasks',
      fields: [
        { name: 'name', label: '任务名称', required: true },
        { name: 'project', label: '关联项目', placeholder: '例如：智能仓储管理系统' },
        { name: 'className', label: '负责班级', required: true, placeholder: '例如：软件工程2101' },
        { name: 'deadline', label: '截止时间', type: 'date', required: true },
        { name: 'description', label: '任务说明', type: 'textarea', placeholder: '任务要求与提交规范' }
      ]
    },
    teacherTeamReview: {
      title: '团队组建审核',
      content: '<div class="content-card-body" style="padding:0"><table class="data-table"><thead><tr><th>团队</th><th>项目</th><th>成员构成</th><th>操作</th></tr></thead><tbody><tr><td>码农先锋队</td><td>智能仓储系统</td><td>软工2人+物联网2人+AI1人</td><td><button class="btn btn-primary" style="padding:0.35rem 0.75rem;font-size:0.8rem" onclick="this.textContent=\'已通过\';this.disabled=true">通过</button> <button class="btn btn-secondary" style="padding:0.35rem 0.75rem;font-size:0.8rem">驳回</button></td></tr><tr><td>AI视觉小组</td><td>质量检测模型</td><td>AI3人+软工1人</td><td><button class="btn btn-primary" style="padding:0.35rem 0.75rem;font-size:0.8rem" onclick="this.textContent=\'已通过\';this.disabled=true">通过</button> <button class="btn btn-secondary" style="padding:0.35rem 0.75rem;font-size:0.8rem">驳回</button></td></tr></tbody></table></div>'
    },
    teacherResourceLib: {
      title: '调用企业资源库',
      content: '<div class="content-card-body" style="padding:0"><table class="data-table"><thead><tr><th>资料名称</th><th>类型</th><th>来源</th><th>操作</th></tr></thead><tbody><tr><td>华为云开发技术规范V3.0</td><td><span class="badge badge-primary">技术标准</span></td><td>华为技术</td><td><a href="#">引用</a></td></tr><tr><td>制造业数字化转型案例集</td><td><span class="badge badge-success">行业案例</span></td><td>华为技术</td><td><a href="#">引用</a></td></tr></tbody></table></div>'
    },
    teacherGuidance: {
      title: '记录远程指导',
      storageKey: 'teacherGuidance',
      fields: [
        { name: 'team', label: '指导团队', required: true },
        { name: 'method', label: '指导方式', type: 'select', options: [
          { value: 'video', label: '视频会议' },
          { value: 'qa', label: '在线答疑' },
          { value: 'review', label: '代码评审' }
        ]},
        { name: 'content', label: '主要内容', type: 'textarea', required: true },
        { name: 'duration', label: '时长（分钟）', type: 'number', required: true }
      ]
    },
    teacherCreateExam: {
      title: '创建考试',
      storageKey: 'teacherExams',
      fields: [
        { name: 'name', label: '考试名称', required: true },
        { name: 'type', label: '考试类型', type: 'select', options: [
          { value: 'certification', label: '岗位认证' },
          { value: 'admission', label: '准入测评' },
          { value: 'stage', label: '阶段测试' }
        ]},
        { name: 'time', label: '考试时间', type: 'datetime-local', required: true },
        { name: 'duration', label: '考试时长（分钟）', type: 'number', required: true },
        { name: 'count', label: '参与人数', type: 'number' }
      ]
    },
    teacherCourseMap: {
      title: '课程图谱',
      content: '<div class="empty-state"><div class="empty-state-icon">&#127760;</div><h4>产业学院课程图谱</h4><p>课程体系结构、企业项目与知识点映射、跨专业课程关联关系可视化正在完善中。</p></div>'
    },

    // 学生工作台
    studentSubmitDeliverable: {
      title: '提交成果物',
      storageKey: 'studentSubmissions',
      fields: [
        { name: 'project', label: '所属项目', type: 'select', required: true, options: [
          { value: '智能仓储管理系统', label: '智能仓储管理系统' },
          { value: '质量检测AI模型', label: '质量检测AI模型' },
          { value: '企业官网重构', label: '企业官网重构' }
        ]},
        { name: 'type', label: '成果类型', type: 'select', options: [
          { value: 'code', label: '源代码' },
          { value: 'doc', label: '文档' },
          { value: 'design', label: '设计稿' },
          { value: 'model', label: '模型' }
        ]},
        { name: 'file', label: '上传成果文件', type: 'file', required: true },
        { name: 'note', label: '备注说明', type: 'textarea', placeholder: '版本说明、运行方式等' }
      ]
    },
    studentFormTeam: {
      title: '组建虚拟项目组',
      storageKey: 'studentTeams',
      fields: [
        { name: 'teamName', label: '团队名称', required: true },
        { name: 'project', label: '意向项目', placeholder: '例如：智能仓储管理系统' },
        { name: 'members', label: '成员学号（逗号分隔）', required: true, placeholder: '例如：2021001,2021002' },
        { name: 'role', label: '我的角色', type: 'select', options: [
          { value: 'leader', label: '队长' },
          { value: 'member', label: '成员' }
        ]}
      ]
    },
    studentTakeExam: {
      title: '参加考试',
      content: '<div class="content-card-body" style="padding:0"><table class="data-table"><thead><tr><th>考试名称</th><th>类型</th><th>时间</th><th>操作</th></tr></thead><tbody><tr><td>华为云开发认证考试</td><td><span class="badge badge-primary">岗位认证</span></td><td>2026-07-01 09:00</td><td><a href="#">进入考试</a></td></tr><tr><td>项目准入技术测评</td><td><span class="badge badge-success">准入测评</span></td><td>2026-06-28 14:00</td><td><a href="#">进入考试</a></td></tr></tbody></table></div>'
    },
    studentDiscussion: {
      title: '发起技术答疑',
      storageKey: 'studentDiscussions',
      fields: [
        { name: 'category', label: '分类', type: 'select', options: [
          { value: 'tech_qa', label: '项目技术答疑' },
          { value: 'team_recruit', label: '团队招募' },
          { value: 'mentor_qa', label: '企业导师答疑' },
          { value: 'experience', label: '经验分享' }
        ]},
        { name: 'title', label: '话题标题', required: true },
        { name: 'content', label: '详细描述', type: 'textarea', required: true }
      ]
    },
    studentResume: {
      title: '我的简历',
      storageKey: 'studentResumes',
      fields: [
        { name: 'major', label: '专业', required: true },
        { name: 'skills', label: '技能标签', placeholder: '例如：Java, Vue, Python' },
        { name: 'projects', label: '项目经历', type: 'textarea', placeholder: '简要描述参与的项目' },
        { name: 'certificate', label: '证书荣誉', type: 'textarea', placeholder: '获得的认证与奖项' }
      ]
    }
  };

  window.openQuickAction = function(key) {
    var config = ACTION_CONFIG[key];
    if (!config || !modal) {
      alert('该快捷操作暂未配置');
      return;
    }
    if (modalTitle) modalTitle.textContent = config.title;

    if (config.content) {
      modalBody.innerHTML = config.content;
    } else {
      var html = '<form id="quickActionForm">';
      config.fields.forEach(function(field) {
        html += buildField(field);
      });
      html += '<div class="modal-footer" style="margin-top:1.5rem"><button type="submit" class="btn btn-primary btn-submit">提交</button></div>';
      html += '</form>';
      modalBody.innerHTML = html;

      var form = document.getElementById('quickActionForm');
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = collectForm(form);
        saveData(config.storageKey, data);
        alert('【' + config.title + '】提交成功！');
        closeModal();
      });
    }
    openModal();
  };
})();
