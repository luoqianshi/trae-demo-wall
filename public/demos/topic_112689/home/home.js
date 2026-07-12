/**
 * 伴学小程序 — 课程列表首页
 *
 * 展示课程单元列表、学习进度、每日打卡。
 * 从 URL 参数读取 grade/term/subject，降级到默认值 g1/t1/chinese。
 */

var CourseData = require('../../utils/course-data.js');
var Progress = require('../../utils/progress.js');
var Checkin = require('../../utils/checkin.js');
var Pinyin = require('../../utils/pinyin.js');

// 默认值
var DEFAULT_GRADE_ID = 'g1';
var DEFAULT_TERM_ID = 't1';
var DEFAULT_SUBJECT_ID = 'chinese';

// 单元图标映射
var UNIT_ICONS = {
  '识字': '📖',
  '汉语拼音': '🔤',
  '拼音': '🔤',
  '古诗': '📜'
};

function pickUnitIcon(unit) {
  return UNIT_ICONS[unit.title] || UNIT_ICONS[unit.name] || '📘';
}

Page({
  data: {
    loading: true,
    gradeId: DEFAULT_GRADE_ID,
    termId: DEFAULT_TERM_ID,
    subjectId: DEFAULT_SUBJECT_ID,
    gradeName: '',
    termName: '',
    subjectName: '',
    checkedIn: false,
    streak: 0,
    totalDays: 0,
    completedCount: 0,
    totalCount: 0,
    progressPercent: 0,
    units: []
  },

  onLoad: function (options) {
    var app = getApp();
    var sel = app.globalData.selection || {};
    var gradeId = options.grade || sel.gradeId || DEFAULT_GRADE_ID;
    var termId = options.term || sel.termId || DEFAULT_TERM_ID;
    var subjectId = options.subject || sel.subjectId || DEFAULT_SUBJECT_ID;

    app.globalData.selection = { gradeId: gradeId, termId: termId, subjectId: subjectId };

    this.setData({
      gradeId: gradeId,
      termId: termId,
      subjectId: subjectId
    });

    this.init();
  },

  onShow: function () {
    var app = getApp();
    var sel = app.globalData.selection;
    if (sel && (sel.gradeId !== this.data.gradeId ||
                sel.termId !== this.data.termId ||
                sel.subjectId !== this.data.subjectId)) {
      this.setData({
        gradeId: sel.gradeId,
        termId: sel.termId,
        subjectId: sel.subjectId
      });
      this.init();
      return;
    }
    this.renderCheckinCard();
    this.loadCourseList();
  },

  init: function () {
    this.renderCheckinCard();
    this.loadGradeLabel();
    this.loadCourseList();
  },

  /** 渲染打卡卡片（同步读取 localStorage） */
  renderCheckinCard: function () {
    var status = Checkin.getTodayStatus();
    this.setData({
      checkedIn: status.checkedIn,
      streak: status.streak,
      totalDays: status.totalDays
    });
  },

  /** 加载年级·学期·学科名称 */
  loadGradeLabel: function () {
    var that = this;
    var gradeId = this.data.gradeId;
    var termId = this.data.termId;
    var subjectId = this.data.subjectId;

    CourseData.getGrades().then(function (grades) {
      var g = find(grades, gradeId) || grades[0];
      if (!g) return;
      gradeId = g.id;
      return CourseData.getTerms(gradeId).then(function (terms) {
        var t = find(terms, termId) || terms[0];
        if (!t) return;
        termId = t.id;
        return CourseData.getSubjects(gradeId, termId).then(function (subjects) {
          var s = find(subjects, subjectId) || subjects[0];
          if (!s) return;
          that.setData({
            gradeId: gradeId,
            termId: termId,
            subjectId: s.id,
            gradeName: g.name,
            termName: t.name,
            subjectName: s.name
          });
        });
      });
    }).catch(function () {
      // 降级显示默认名
      that.setData({
        gradeName: '一年级',
        termName: '上册',
        subjectName: '语文'
      });
    });
  },

  /** 加载课程列表：按单元分组 + 各课进度 */
  loadCourseList: function () {
    var that = this;
    var gradeId = this.data.gradeId;
    var termId = this.data.termId;
    var subjectId = this.data.subjectId;

    this.setData({ loading: true });

    CourseData.getUnits(gradeId, termId, subjectId).then(function (units) {
      if (!units.length) {
        that.setData({ loading: false, units: [] });
        return;
      }

      // 串行加载每个单元的课程，保证渲染顺序
      var chain = Promise.resolve();
      var result = [];
      var total = 0;
      var completed = 0;

      units.forEach(function (unit, i) {
        chain = chain.then(function () {
          return CourseData.getLessons(gradeId, termId, subjectId, unit.id);
        }).then(function (lessons) {
          var lessonList = lessons.map(function (l) {
            var state = Progress.get({
              gradeId: gradeId,
              termId: termId,
              subjectId: subjectId,
              unitId: unit.id,
              lessonId: l.id
            });
            if (state === 'completed') completed++;
            total++;
            return {
              id: l.id,
              no: l.no,
              title: l.title,
              titlePinyin: Pinyin.renderWithPinyin(l.title, gradeId),
              type: l.type,
              state: state
            };
          });
          result.push({
            id: unit.id,
            name: unit.name,
            title: unit.title,
            titlePinyin: Pinyin.renderWithPinyin(unit.name + ' · ' + unit.title, gradeId),
            icon: pickUnitIcon(unit),
            lessons: lessonList
          });
        });
      });

      return chain.then(function () {
        var pct = total > 0 ? Math.round(completed / total * 100) : 0;
        that.setData({
          loading: false,
          units: result,
          completedCount: completed,
          totalCount: total,
          progressPercent: pct
        });
      });
    }).catch(function () {
      that.setData({ loading: false });
    });
  },

  /** 点击课程卡片 → 跳转课程页 */
  goLesson: function (e) {
    var dataset = e.currentTarget.dataset;
    wx.navigateTo({
      url: '../lesson/lesson?grade=' + encodeURIComponent(dataset.grade) +
        '&term=' + encodeURIComponent(dataset.term) +
        '&subject=' + encodeURIComponent(dataset.subject) +
        '&unit=' + encodeURIComponent(dataset.unit) +
        '&lesson=' + encodeURIComponent(dataset.lesson)
    });
  },

  /** 点击年级标签 → 跳回 index 页重选 */
  goIndex: function () {
    wx.navigateTo({
      url: '../index/index?grade=' + encodeURIComponent(this.data.gradeId)
    });
  }
});

/** 工具：在数组中按 id 查找 */
function find(list, id) {
  if (!list) return null;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}