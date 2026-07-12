/**
 * 设置页
 *
 * 展示学习年级、学期切换、学习进度统计、成就徽章、版本信息。
 * 引用 Progress 和 Checkin 显示统计信息，引用 Achievements 显示徽章。
 */

var Progress = require('../../utils/progress');
var Checkin = require('../../utils/checkin');
var Achievements = require('../../utils/achievements');
var CourseData = require('../../utils/course-data');

var GRADE_NAMES = { 'g1': '一年级', 'g2': '二年级', 'g3': '三年级' };
var TERM_NAMES = { 't1': '上册', 't2': '下册' };

Page({
  data: {
    currentGradeName: '一年级',
    currentGradeId: 'g1',
    currentTermName: '上册',
    currentTermId: 't1',

    stats: {
      totalLessons: 0,
      completedLessons: 0,
      streak: 0
    },

    achievements: []
  },

  onShow: function () {
    this.loadCurrentSelection();
    this.loadStats();
    this.loadAchievements();
  },

  /** 读取当前选中的年级和学期 */
  loadCurrentSelection: function () {
    var app = getApp();
    var sel = app.globalData.selection || {};
    var gradeId = sel.gradeId || 'g1';
    var termId = sel.termId || 't1';
    this.setData({
      currentGradeId: gradeId,
      currentGradeName: GRADE_NAMES[gradeId] || '一年级',
      currentTermId: termId,
      currentTermName: TERM_NAMES[termId] || '上册'
    });
  },

  /** 加载学习统计 */
  loadStats: function () {
    var that = this;
    var allProgress = Progress.getAll();
    var completedLessons = 0;
    var totalLessons = 0;

    for (var key in allProgress) {
      if (allProgress[key] && allProgress[key].state) {
        totalLessons++;
        if (allProgress[key].state === 'completed') {
          completedLessons++;
        }
      }
    }

    var checkinStatus = Checkin.getTodayStatus();

    that.setData({
      stats: {
        totalLessons: totalLessons,
        completedLessons: completedLessons,
        streak: checkinStatus.streak
      }
    });
  },

  /** 加载成就徽章 */
  loadAchievements: function () {
    var that = this;
    var allProgress = Progress.getAll();
    var checkinStatus = Checkin.getTodayStatus();

    CourseData.load().then(function (data) {
      var totalLessons = 0;
      (data.grades || []).forEach(function (grade) {
        (grade.terms || []).forEach(function (term) {
          (term.subjects || []).forEach(function (subject) {
            (subject.units || []).forEach(function (unit) {
              totalLessons += (unit.lessons || []).length;
            });
          });
        });
      });

      var starCount = 0;
      for (var key in allProgress) {
        if (allProgress[key] && allProgress[key].state === 'completed') {
          starCount++;
        }
      }

      var enhancedProgress = {};
      for (var k in allProgress) {
        enhancedProgress[k] = allProgress[k];
      }

      var result = Achievements.check(enhancedProgress, checkinStatus, { starCount: starCount });
      that.setData({
        achievements: result.all
      });
    });
  },

  /** 切换年级 */
  onChangeGrade: function () {
    var that = this;
    wx.showActionSheet({
      itemList: ['一年级', '二年级', '三年级'],
      success: function (res) {
        var gradeIds = ['g1', 'g2', 'g3'];
        var gradeId = gradeIds[res.tapIndex];
        var app = getApp();
        var sel = app.globalData.selection || {};
        sel.gradeId = gradeId;
        sel.termId = sel.termId || 't1';
        sel.subjectId = sel.subjectId || 'chinese';
        app.globalData.selection = sel;
        that.setData({
          currentGradeId: gradeId,
          currentGradeName: GRADE_NAMES[gradeId] || '一年级'
        });
        wx.showToast({ title: '已切换到' + GRADE_NAMES[gradeId], icon: 'success' });
      }
    });
  },

  /** 切换学期 */
  onChangeTerm: function () {
    var that = this;
    wx.showActionSheet({
      itemList: ['上册', '下册'],
      success: function (res) {
        var termIds = ['t1', 't2'];
        var termId = termIds[res.tapIndex];
        var app = getApp();
        var sel = app.globalData.selection || {};
        sel.termId = termId;
        sel.gradeId = sel.gradeId || 'g1';
        sel.subjectId = sel.subjectId || 'chinese';
        app.globalData.selection = sel;
        that.setData({
          currentTermId: termId,
          currentTermName: TERM_NAMES[termId] || '上册'
        });
        wx.showToast({ title: '已切换到' + TERM_NAMES[termId], icon: 'success' });
      }
    });
  },

  /** 重置学习进度 */
  onResetProgress: function () {
    var that = this;
    wx.showModal({
      title: '确认重置',
      content: '重置后将清除所有学习进度和打卡记录，确定要重置吗？',
      confirmColor: '#FF5252',
      success: function (res) {
        if (res.confirm) {
          try {
            wx.removeStorageSync('psa:progress');
            wx.removeStorageSync('psa:checkin');
            wx.removeStorageSync('psa:achievements');
          } catch (e) {}
          that.loadStats();
          that.loadAchievements();
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  /** 查看隐私协议 */
  onShowPrivacy: function () {
    wx.showModal({
      title: '隐私协议',
      content: '本小程序为本地离线工具，不收集任何个人信息，不联网，不上传任何数据。所有学习进度和打卡记录仅存储在您设备本地，不会传输给任何第三方。本小程序不使用任何隐私接口（不获取位置、不读取通讯录、不拍照录音）。如您有任何疑问，可通过公众号联系开发者。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /** 查看用户协议 */
  onShowAgreement: function () {
    wx.showModal({
      title: '用户协议',
      content: '1. 本小程序为小学语文助学工具，仅供个人学习使用。\n2. 所有课程数据已打包在本地，无需网络即可使用。\n3. 学习进度数据仅存储在设备本地，请勿清除小程序数据以免丢失进度。\n4. 禁止将本小程序用于任何商业用途。\n5. 使用过程中如遇问题，可通过公众号联系开发者。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
