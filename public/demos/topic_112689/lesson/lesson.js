/**
 * 课程详情页
 *
 * 从 URL 参数读取 grade/term/subject/unit/lesson，
 * 利用 CourseData 获取课程详情，渲染古诗（含拼音注音）、视频区和互动题目。
 * 答题后调用 CourseData.checkAnswer() 判定，标记进度并支持打卡。
 */

var CourseData = require('../../utils/course-data');
var Progress = require('../../utils/progress');
var Pinyin = require('../../utils/pinyin');
var Checkin = require('../../utils/checkin');
var TTS = require('../../utils/tts');

Page({
  data: {
    gradeId: '',
    termId: '',
    subjectId: '',
    unitId: '',
    lessonId: '',

    lessonNo: 1,
    lessonTitle: '',
    lessonType: 'regular',
    videoUrl: '',

    poemName: '',
    poemAuthor: '',
    poemDynasty: '',
    poemRawText: '',
    poemLines: [],

    interactions: [],

    allAnswered: false,
    isReciting: false,

    unitName: '',
    nextLesson: null
  },

  onLoad: function (options) {
    var gradeId = options.grade || '';
    var termId = options.term || '';
    var subjectId = options.subject || '';
    var unitId = options.unit || '';
    var lessonId = options.lesson || '';

    this.setData({
      gradeId: gradeId,
      termId: termId,
      subjectId: subjectId,
      unitId: unitId,
      lessonId: lessonId
    });

    // 标记为学习中
    Progress.set({
      gradeId: gradeId, termId: termId, subjectId: subjectId,
      unitId: unitId, lessonId: lessonId
    }, Progress.STATE.IN_PROGRESS);

    this.loadLesson();
  },

  /** 加载课程详情 */
  loadLesson: function () {
    var that = this;
    var d = this.data;

    CourseData.getLessonDetail(d.gradeId, d.termId, d.subjectId, d.unitId, d.lessonId)
      .then(function (detail) {
        if (!detail) {
          wx.showToast({ title: '课程数据加载失败', icon: 'none' });
          return;
        }

        var lesson = detail.lesson;
        var interactions = (lesson.interactions || []).map(function (q) {
          return {
            id: q.id,
            question: q.question,
            options: q.options,
            // 用 pinyin 模块渲染题目文字和选项（针对低年级全注音）
            renderedQuestion: Pinyin.renderWithPinyin(q.question, detail.grade.id),
            renderedOptions: q.options.map(function (opt) {
              return Pinyin.renderWithPinyin(opt, detail.grade.id);
            }),
            selectedIndex: -1,
            isCorrect: false,
            showResult: false,
            correctIndex: -1
          };
        });

        // 解析古诗行
        var poemLines = [];
        if (lesson.type === 'poem' && lesson.poem) {
          poemLines = that.parsePoemLines(lesson.poem, detail.grade.id);
        }

        var metaParts = [];
        if (lesson.dynasty) metaParts.push(lesson.dynasty);
        if (lesson.author) metaParts.push(lesson.author);
        var renderedMeta = metaParts.length
          ? Pinyin.renderWithPinyin(metaParts.join(' · '), detail.grade.id)
          : '';

        that.setData({
          lessonNo: lesson.no,
          lessonTitle: Pinyin.renderWithPinyin(lesson.title || '', detail.grade.id),
          lessonType: lesson.type,
          videoUrl: lesson.videoUrl || '',
          poemName: Pinyin.renderWithPinyin(lesson.title || '', detail.grade.id),
          poemMeta: renderedMeta,
          poemRawText: lesson.poem || '',
          poemDynasty: lesson.dynasty || '',
          poemAuthor: lesson.author || '',
          poemLines: poemLines,
          interactions: interactions,
          unitName: detail.unit.name,
          nextLesson: detail.nextLesson
        });
      })
      .catch(function (err) {
        wx.showToast({ title: '加载失败：' + err.message, icon: 'none' });
      });
  },

  /** 将古诗文本按标点拆分为行，用 ruby 标签渲染拼音 */
  parsePoemLines: function (poemText, gradeId) {
    var puncts = /[，。！？；：、]/;
    var text = poemText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var rawLines = text.split('\n').filter(function (l) { return l.trim(); });
    var lines = [];
    rawLines.forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;
      var buf = '';
      for (var i = 0; i < line.length; i++) {
        var ch = line.charAt(i);
        buf += ch;
        if (puncts.test(ch)) {
          if (buf.trim()) lines.push(buf.trim());
          buf = '';
        }
      }
      if (buf.trim()) lines.push(buf.trim());
    });
    return lines.map(function (line) {
      return {
        text: line,
        html: Pinyin.renderPoemLine(line, gradeId)
      };
    });
  },

  /** 点击选项 */
  onOptionTap: function (e) {
    var questionId = e.currentTarget.dataset.questionId;
    var answerIndex = e.currentTarget.dataset.answerIndex;
    var d = this.data;

    // 异步判定后更新
    var that = this;
    CourseData.checkAnswer(d.gradeId, d.termId, d.subjectId, d.unitId, d.lessonId, questionId, answerIndex)
      .then(function (result) {
        var updated = that.data.interactions.map(function (q) {
          if (q.id !== questionId) return q;
          if (q.selectedIndex >= 0) return q;
          return {
            id: q.id,
            question: q.question,
            options: q.options,
            renderedQuestion: q.renderedQuestion,
            renderedOptions: q.renderedOptions,
            selectedIndex: answerIndex,
            isCorrect: result.correct,
            showResult: true,
            correctIndex: result.answerIndex
          };
        });

        var allAnswered = updated.every(function (q) { return q.selectedIndex >= 0; });

        that.setData({
          interactions: updated,
          allAnswered: allAnswered
        });

        // 全部答完自动标记 completed
        if (allAnswered) {
          that.markCompleted();
        }
      });
  },

  /** 标记课程为已完成 */
  markCompleted: function () {
    var d = this.data;
    Progress.set({
      gradeId: d.gradeId, termId: d.termId, subjectId: d.subjectId,
      unitId: d.unitId, lessonId: d.lessonId
    }, Progress.STATE.COMPLETED);

    // 完成课程触发打卡
    Checkin.checkin();

    wx.showToast({ title: '课程完成！', icon: 'success' });
  },

  /** 点击"完成本期课程"按钮 */
  onComplete: function () {
    var d = this.data;

    TTS.stop();

    if (!d.allAnswered) {
      this.markCompleted();
    } else {
      this.markCompleted();
    }

    setTimeout(function () {
      wx.navigateBack();
    }, 800);
  },

  onUnload: function () {
    TTS.stop();
  },
  onHide: function () {
    TTS.stop();
    this.setData({ isReciting: false });
  },

  /** 朗读古诗 */
  onRecite: function () {
    var d = this.data;
    if (d.isReciting) {
      TTS.stop();
      this.setData({ isReciting: false });
      return;
    }
    var title = d.lessonTitle.replace(/<[^>]+>/g, '');
    var text = title + '。';
    if (d.poemDynasty) text += d.poemDynasty + '，';
    if (d.poemAuthor) text += d.poemAuthor + '。';
    if (d.poemRawText) text += d.poemRawText;

    var self = this;
    this.setData({ isReciting: true });
    wx.vibrateShort({ type: 'light' });

    TTS.speak(text, {
      onEnd: function () {
        self.setData({ isReciting: false });
      },
      onError: function () {
        self.setData({ isReciting: false });
        wx.showToast({ title: '朗读播放失败', icon: 'none' });
      }
    });
  }
});