var courseData = require('../../utils/course-data.js');

Page({
  data: {
    grades: [],
    terms: [],
    subjects: [],
    selectedGrade: null,
    selectedTerm: null,
    selectedSubject: null,
    canStart: false
  },

  onLoad: function () {
    var that = this;

    // 已有选择的回访用户直接跳过选年级
    if (getApp().autoGoHome()) {
      return;
    }

    // 加载年级列表
    courseData.getGrades().then(function (grades) {
      that.setData({ grades: grades });
      // 尝试从 storage 回填上次选择
      that._restoreSelection();
    }).catch(function (err) {
      console.error('加载年级失败', err);
    });
  },

  /** 从 storage 恢复上次选择 */
  _restoreSelection: function () {
    var that = this;
    try {
      var saved = wx.getStorageSync('lastSelection');
      if (!saved || !saved.gradeId) return;

      var grades = that.data.grades;
      var matchedGrade = null;
      for (var i = 0; i < grades.length; i++) {
        if (grades[i].id === saved.gradeId) {
          matchedGrade = grades[i];
          break;
        }
      }
      if (!matchedGrade) return;

      // 回填年级
      that.setData({ selectedGrade: matchedGrade });

      // 加载并回填学期
      courseData.getTerms(saved.gradeId).then(function (terms) {
        that.setData({ terms: terms });
        var matchedTerm = null;
        if (saved.termId) {
          for (var j = 0; j < terms.length; j++) {
            if (terms[j].id === saved.termId) {
              matchedTerm = terms[j];
              break;
            }
          }
        }
        var term = matchedTerm || (terms.length > 0 ? terms[0] : null);
        if (term) {
          that.setData({ selectedTerm: term });

          // 加载并回填学科
          courseData.getSubjects(saved.gradeId, term.id).then(function (subjects) {
            that.setData({ subjects: subjects });
            var matchedSubject = null;
            if (saved.subjectId) {
              for (var k = 0; k < subjects.length; k++) {
                if (subjects[k].id === saved.subjectId) {
                  matchedSubject = subjects[k];
                  break;
                }
              }
            }
            var subject = matchedSubject || (subjects.length > 0 ? subjects[0] : null);
            if (subject) {
              that.setData({ selectedSubject: subject });
            }
            that._updateCanStart();
          });
        }
      });
    } catch (e) {
      // storage 读取失败，忽略
    }
  },

  /** 选择年级 */
  selectGrade: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var grade = { id: id, name: name };
    var that = this;

    this.setData({
      selectedGrade: grade,
      selectedTerm: null,
      selectedSubject: null,
      subjects: []
    });

    // 加载该年级的学期列表，默认选中第一个（上册）
    courseData.getTerms(id).then(function (terms) {
      that.setData({ terms: terms });
      if (terms.length > 0) {
        // 默认选上册
        that.selectTerm({ currentTarget: { dataset: { id: terms[0].id, name: terms[0].name } } });
      }
    });

    that._saveSelection();
  },

  /** 选择学期 */
  selectTerm: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var term = { id: id, name: name };
    var that = this;

    this.setData({
      selectedTerm: term,
      selectedSubject: null
    });

    // 加载该学期的学科列表，默认选中第一个（语文）
    var gradeId = this.data.selectedGrade.id;
    courseData.getSubjects(gradeId, id).then(function (subjects) {
      that.setData({ subjects: subjects });
      if (subjects.length > 0) {
        // 默认选语文
        that.selectSubject({ currentTarget: { dataset: { id: subjects[0].id, name: subjects[0].name } } });
      }
    });

    that._saveSelection();
  },

  /** 选择学科 */
  selectSubject: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    this.setData({
      selectedSubject: { id: id, name: name }
    });
    this._updateCanStart();
    this._saveSelection();
  },

  /** 更新开始按钮状态 */
  _updateCanStart: function () {
    var canStart = !!(
      this.data.selectedGrade &&
      this.data.selectedTerm &&
      this.data.selectedSubject
    );
    this.setData({ canStart: canStart });
  },

  /** 保存选择到 storage */
  _saveSelection: function () {
    var grade = this.data.selectedGrade;
    var term = this.data.selectedTerm;
    var subject = this.data.selectedSubject;
    if (!grade) return;
    try {
      wx.setStorageSync('lastSelection', {
        gradeId: grade.id,
        termId: term ? term.id : '',
        subjectId: subject ? subject.id : ''
      });
    } catch (e) {
      // storage 写入失败，忽略
    }
  },

  /** 开始学习 */
  startLearning: function () {
    if (!this.data.canStart) return;
    var grade = this.data.selectedGrade;
    var term = this.data.selectedTerm;
    var subject = this.data.selectedSubject;

    // home 是 tabBar 页面，不能用 navigateTo 带参跳转
    // 通过 globalData 传递参数，home 页 onShow 时读取
    getApp().globalData.selection = {
      gradeId: grade.id,
      termId: term.id,
      subjectId: subject.id
    };

    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});