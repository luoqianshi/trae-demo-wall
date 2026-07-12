var PinyinUtil = require('../../utils/pinyin.js');
var CourseData = require('../../utils/course-data.js');
var Progress = require('../../utils/progress.js');
var TTS = require('../../utils/tts.js');
var app = getApp();

var GRADE_CONFIG = {
  g1: { grade: '一年级', starColor: '#FFD700', starColorRGB: '255,215,0', bgColor1: '#0a0e27', bgColor2: '#050814' },
  g2: { grade: '二年级', starColor: '#A78BFA', starColorRGB: '167,139,250', bgColor1: '#0d0b2e', bgColor2: '#050814' }
};

var DEFAULT_GRADE = 'g1';
var DEFAULT_TERM = 't1';
var DEFAULT_SUBJECT = 'chinese';

var HEADER_HEIGHT_RPX = 150;

function generateBackgroundStars(count) {
  var arr = [];
  for (var i = 0; i < count; i++) {
    arr.push({
      x: Math.random(), y: Math.random(),
      size: 0.5 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.2 + Math.random() * 0.8,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
  return arr;
}

Page({
  data: {
    grade: '',
    gradeId: DEFAULT_GRADE,
    termId: DEFAULT_TERM,
    subjectId: DEFAULT_SUBJECT,
    gradeName: '',
    termName: '',
    selectedPoem: null,
    popupTitleHtml: '',
    popupAuthorHtml: '',
    popupPoemLines: [],
    showPopup: false,
    isPlaying: false,
    learnedCount: 0,
    totalCount: 0
  },

  ctx: null,
  canvasW: 0,
  canvasH: 0,
  headerH: 0,
  stars: [],
  bgStars: [],
  timer: null,
  popAnim: null,
  popProgress: 0,
  popDirection: 0,

  onLoad: function () {
    var self = this;
    var sel = (app.globalData && app.globalData.selection) || {};
    var gradeId = sel.gradeId || DEFAULT_GRADE;
    var termId = sel.termId || DEFAULT_TERM;
    var subjectId = sel.subjectId || DEFAULT_SUBJECT;

    var sysInfo = wx.getSystemInfoSync();
    this.canvasW = sysInfo.windowWidth;
    this.canvasH = sysInfo.windowHeight;
    this.headerH = Math.floor(HEADER_HEIGHT_RPX * sysInfo.windowWidth / 750);

    this.setData({
      grade: gradeId,
      gradeId: gradeId,
      termId: termId,
      subjectId: subjectId,
      gradeName: (GRADE_CONFIG[gradeId] || GRADE_CONFIG.g1).grade,
      termName: termId === 't2' ? '下册' : '上册'
    });

    this.bgStars = generateBackgroundStars(120);
    this.loadPoems(gradeId, termId, subjectId);
  },

  onReady: function () {
    var self = this;
    setTimeout(function () {
      self.ctx = wx.createCanvasContext('starryCanvas', self);
      self.startLoop();
    }, 200);
  },

  onShow: function () {
    var sel = (app.globalData && app.globalData.selection) || {};
    var gid = sel.gradeId || this.data.gradeId;
    var tid = sel.termId || this.data.termId;
    var sid = sel.subjectId || this.data.subjectId;
    if (gid !== this.data.gradeId || tid !== this.data.termId || sid !== this.data.subjectId) {
      this.setData({
        grade: gid,
        gradeId: gid,
        termId: tid,
        subjectId: sid,
        gradeName: (GRADE_CONFIG[gid] || GRADE_CONFIG.g1).grade,
        termName: tid === 't2' ? '下册' : '上册',
        showPopup: false,
        selectedPoem: null,
        popupPoemLines: []
      });
      this.stopAudio();
      this.loadPoems(gid, tid, sid);
    } else if (this.stars.length > 0) {
      this.syncProgress();
    }
    if (this.ctx) this.startLoop();
  },

  onUnload: function () {
    this.stopLoop();
    this.stopAudio();
  },
  onHide: function () {
    this.stopLoop();
    this.stopAudio();
  },

  loadPoems: function (gradeId, termId, subjectId) {
    var self = this;
    var cfg = GRADE_CONFIG[gradeId] || GRADE_CONFIG.g1;

    CourseData.getUnits(gradeId, termId, subjectId).then(function (units) {
      var poemLessons = [];
      var chain = Promise.resolve();
      units.forEach(function (unit) {
        chain = chain.then(function () {
          return CourseData.getLessons(gradeId, termId, subjectId, unit.id).then(function (lessons) {
            lessons.forEach(function (l) {
              if (l.type === 'poem') {
                poemLessons.push({
                  unitId: unit.id,
                  lessonId: l.id,
                  no: l.no,
                  title: l.title
                });
              }
            });
          });
        });
      });
      return chain.then(function () {
        return CourseData.load();
      }).then(function (data) {
        var fullPoems = [];
        poemLessons.forEach(function (pl) {
          var g = findGrade(data, gradeId);
          if (!g) return;
          var t = findTerm(g, termId);
          if (!t) return;
          var s = findSubject(t, subjectId);
          if (!s) return;
          var u = findUnit(s, pl.unitId);
          if (!u) return;
          var lesson = findLesson(u, pl.lessonId);
          if (!lesson) return;
          fullPoems.push({
            unitId: pl.unitId,
            lessonId: pl.lessonId,
            title: lesson.title,
            author: lesson.author || '',
            dynasty: lesson.dynasty || '',
            poem: lesson.poem || ''
          });
        });
        return fullPoems;
      });
    }).then(function (poems) {
      if (!poems || poems.length === 0) {
        poems = [{ unitId: 'u3', lessonId: 'l1', title: '画', author: '王维', dynasty: '唐', poem: '远看山有色，近听水无声。春去花还在，人来鸟不惊。' }];
      }
      self.layoutStars(poems, gradeId, termId, subjectId);
    }).catch(function () {
      var fallbackPoems = [
        { unitId: 'u3', lessonId: 'l1', title: '画', author: '王维', dynasty: '唐', poem: '远看山有色，近听水无声。春去花还在，人来鸟不惊。' },
        { unitId: 'u6', lessonId: 'l1', title: '咏鹅', author: '骆宾王', dynasty: '唐', poem: '鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。' }
      ];
      self.layoutStars(fallbackPoems, gradeId, termId, subjectId);
    });
  },

  layoutStars: function (poems, gradeId, termId, subjectId) {
    var self = this;
    var n = poems.length;
    var drawableTop = (this.headerH + 20) / this.canvasH;
    var drawableBottom = 0.88;
    var usableH = drawableBottom - drawableTop;

    var cols = n <= 4 ? 2 : (n <= 6 ? 3 : (n <= 9 ? 3 : 4));
    var rows = Math.ceil(n / cols);
    var cellW = 1.0 / cols;
    var cellH = usableH / rows;

    var stars = poems.map(function (p, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var baseX = cellW * (col + 0.5);
      var baseY = drawableTop + cellH * (row + 0.5);
      var jitterX = (Math.random() - 0.5) * cellW * 0.4;
      var jitterY = (Math.random() - 0.5) * cellH * 0.4;
      var x = Math.max(0.06, Math.min(0.94, baseX + jitterX));
      var y = Math.max(drawableTop + 0.03, Math.min(drawableBottom - 0.03, baseY + jitterY));

      var state = Progress.get({
        gradeId: gradeId, termId: termId, subjectId: subjectId,
        unitId: p.unitId, lessonId: p.lessonId
      });
      var learned = state === 'completed';
      return {
        id: p.lessonId,
        unitId: p.unitId,
        lessonId: p.lessonId,
        x: x, y: y,
        size: learned ? 16 : 13,
        brightness: learned ? 1.0 : 0.5,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        poem: p,
        learned: learned
      };
    });

    this.stars = stars;
    var learnedCount = 0;
    for (var i = 0; i < stars.length; i++) {
      if (stars[i].learned) learnedCount++;
    }
    this.setData({
      learnedCount: learnedCount,
      totalCount: stars.length
    });
  },

  syncProgress: function () {
    var gid = this.data.gradeId;
    var tid = this.data.termId;
    var sid = this.data.subjectId;
    var changed = false;
    var learnedCount = 0;
    for (var i = 0; i < this.stars.length; i++) {
      var st = this.stars[i];
      var state = Progress.get({
        gradeId: gid, termId: tid, subjectId: sid,
        unitId: st.unitId, lessonId: st.lessonId
      });
      var learned = state === 'completed';
      if (learned !== st.learned) {
        st.learned = learned;
        st.size = learned ? 16 : 13;
        st.brightness = learned ? 1.0 : 0.5;
        changed = true;
      }
      if (learned) learnedCount++;
    }
    if (changed || learnedCount !== this.data.learnedCount) {
      this.setData({ learnedCount: learnedCount });
    }
  },

  startLoop: function () {
    if (this.timer) return;
    var self = this;
    function tick() {
      self.timer = setTimeout(tick, 33);
      self.drawFrame();
    }
    tick();
  },

  stopLoop: function () {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  },

  drawFrame: function () {
    if (!this.ctx) return;
    var ctx = this.ctx;
    var w = this.canvasW;
    var h = this.canvasH;
    var cfg = GRADE_CONFIG[this.data.grade] || GRADE_CONFIG.g1;
    var now = Date.now() / 1000;

    var grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, cfg.bgColor1);
    grd.addColorStop(1, cfg.bgColor2);
    ctx.setFillStyle(grd);
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < this.bgStars.length; i++) {
      var s = this.bgStars[i];
      var br = s.brightness * (0.6 + 0.4 * Math.sin(now * s.twinkleSpeed + s.twinklePhase));
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
      ctx.setFillStyle('rgba(255,255,255,' + br.toFixed(2) + ')');
      ctx.fill();
    }

    for (var j = 0; j < this.stars.length; j++) {
      var st = this.stars[j];
      var px = st.x * w;
      var py = st.y * h;
      var starBr = st.brightness * (0.7 + 0.3 * Math.sin(now * st.twinkleSpeed + st.twinklePhase));

      var glowR = st.size * 4;
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.setFillStyle('rgba(' + cfg.starColorRGB + ',' + (starBr * 0.35).toFixed(2) + ')');
      ctx.fill();

      this.drawStarShape(ctx, px, py, 5, st.size, st.size * 0.4,
        'rgba(' + cfg.starColorRGB + ',' + starBr.toFixed(2) + ')');

      if (!st.learned) {
        ctx.beginPath();
        ctx.arc(px, py, st.size + 4, 0, Math.PI * 2);
        ctx.setStrokeStyle('rgba(255,255,255,0.3)');
        ctx.setLineWidth(1);
        ctx.stroke();
      }
    }

    if (this.popAnim && this.popProgress > 0) {
      var pop = this.popAnim;
      var alpha = Math.min(1, this.popProgress * 2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pop.fx, pop.fy, pop.radius, 0, Math.PI * 2);
      ctx.setFillStyle('rgba(255,220,100,' + (alpha * 0.5).toFixed(2) + ')');
      ctx.fill();
      ctx.restore();

      if (this.popDirection !== 0) {
        this.popProgress += this.popDirection * 0.12;
        if (this.popProgress > 1) { this.popProgress = 1; this.popDirection = 0; }
        if (this.popProgress < 0) { this.popProgress = 0; this.popDirection = 0; this.popAnim = null; }
      }
    }

    ctx.draw();
  },

  drawStarShape: function (ctx, cx, cy, spikes, outerR, innerR, color) {
    var rot = -Math.PI / 2;
    var step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    for (var i = 0; i < spikes; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    }
    ctx.closePath();
    ctx.setFillStyle(color);
    ctx.fill();
  },

  easeOutBack: function (x) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },

  onCanvasTap: function (e) {
    if (this.data.showPopup) return;
    var px = e.detail.x;
    var py = e.detail.y;
    if (typeof px === 'undefined' || typeof py === 'undefined') {
      if (e.touches && e.touches[0]) {
        px = e.touches[0].pageX;
        py = e.touches[0].pageY;
      } else if (e.changedTouches && e.changedTouches[0]) {
        px = e.changedTouches[0].pageX;
        py = e.changedTouches[0].pageY;
      }
    }
    if (typeof px === 'undefined' || typeof py === 'undefined') return;

    var hit = null;
    for (var i = this.stars.length - 1; i >= 0; i--) {
      var st = this.stars[i];
      var sx = st.x * this.canvasW;
      var sy = st.y * this.canvasH;
      var hitR = Math.max(st.size * 4, 56);
      var dx = px - sx;
      var dy = py - sy;
      if (dx * dx + dy * dy <= hitR * hitR) { hit = st; break; }
    }
    if (hit) {
      wx.vibrateShort({ type: 'light' });
      this.triggerPop(hit);
      this.showStarPopup(hit);
    }
  },

  triggerPop: function (star) {
    this.popAnim = {
      fx: star.x * this.canvasW,
      fy: star.y * this.canvasH,
      radius: 10
    };
    this.popProgress = 0;
    this.popDirection = 1;
    var anim = this.popAnim;
    var endR = Math.max(this.canvasW, this.canvasH) * 0.8;
    var steps = 18;
    var cur = 0;
    var startR = 10;
    var self = this;
    function expand() {
      cur++;
      var p = cur / steps;
      anim.radius = startR + (endR - startR) * self.easeOutBack(p);
      if (cur < steps) setTimeout(expand, 20);
    }
    expand();
  },

  showStarPopup: function (star) {
    var poem = star.poem;
    var titleHtml = PinyinUtil.renderWithPinyin(poem.title, this.data.grade);
    var authorHtml = '';
    if (poem.dynasty || poem.author) {
      var parts = [];
      if (poem.dynasty) parts.push(poem.dynasty);
      if (poem.author) parts.push(poem.author);
      authorHtml = '【' + PinyinUtil.renderWithPinyin(parts.join(' · '), this.data.grade) + '】';
    }
    var lines = this.splitPoemLines(poem.poem);
    var popupLines = [];
    for (var i = 0; i < lines.length; i++) {
      popupLines.push({
        html: PinyinUtil.renderPoemLine(lines[i], this.data.grade),
        text: lines[i]
      });
    }
    this.setData({
      selectedPoem: { poem: poem, star: star, learned: star.learned },
      popupTitleHtml: titleHtml,
      popupAuthorHtml: authorHtml,
      popupPoemLines: popupLines,
      showPopup: true
    });
  },

  splitPoemLines: function (poem) {
    if (!poem) return [];
    var text = poem.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var rawLines = text.split('\n');
    var result = [];
    var puncts = /[，。！？；：、]/;
    for (var ri = 0; ri < rawLines.length; ri++) {
      var raw = rawLines[ri].trim();
      if (!raw) continue;
      var buf = '';
      for (var i = 0; i < raw.length; i++) {
        var ch = raw.charAt(i);
        buf += ch;
        if (puncts.test(ch)) {
          if (buf.trim()) result.push(buf.trim());
          buf = '';
        }
      }
      if (buf.trim()) result.push(buf.trim());
    }
    return result;
  },

  hidePopup: function () {
    var self = this;
    this.setData({ showPopup: false });
    this.stopAudio();
    this.popAnim = this.popAnim || {
      fx: this.canvasW / 2,
      fy: this.canvasH / 2,
      radius: Math.max(this.canvasW, this.canvasH)
    };
    this.popDirection = -1;
    setTimeout(function () {
      self.setData({ selectedPoem: null, popupPoemLines: [], isPlaying: false });
    }, 400);
  },

  stopAudio: function () {
    TTS.stop();
    this.setData({ isPlaying: false });
  },

  recitePoem: function () {
    var selected = this.data.selectedPoem;
    if (!selected || !selected.poem) return;
    var poem = selected.poem;

    if (this.data.isPlaying) {
      this.stopAudio();
      return;
    }

    var self = this;
    var textToRead = poem.title + '。';
    if (poem.dynasty) textToRead += poem.dynasty + '，';
    if (poem.author) textToRead += poem.author + '。';
    textToRead += poem.poem;

    this.setData({ isPlaying: true });
    wx.vibrateShort({ type: 'light' });

    TTS.speak(textToRead, {
      onStart: function () {},
      onEnd: function () {
        self.setData({ isPlaying: false });
      },
      onError: function () {
        self.setData({ isPlaying: false });
        wx.showToast({ title: '朗读播放失败', icon: 'none' });
      }
    });
  },

  markAsLearned: function () {
    var selected = this.data.selectedPoem;
    if (!selected) return;
    var star = selected.star;
    if (!star) return;
    Progress.set({
      gradeId: this.data.gradeId,
      termId: this.data.termId,
      subjectId: this.data.subjectId,
      unitId: star.unitId,
      lessonId: star.lessonId
    }, Progress.STATE.COMPLETED);

    star.learned = true;
    star.size = 16;
    star.brightness = 1.0;

    var cnt = 0;
    for (var i = 0; i < this.stars.length; i++) {
      if (this.stars[i].learned) cnt++;
    }
    this.setData({ learnedCount: cnt });
    this.hidePopup();
    wx.showToast({ title: '🌟 已点亮！', icon: 'none' });
  }
});

function findGrade(data, gradeId) {
  if (!data || !data.grades) return null;
  for (var i = 0; i < data.grades.length; i++) {
    if (data.grades[i].id === gradeId) return data.grades[i];
  }
  return null;
}
function findTerm(grade, termId) {
  if (!grade || !grade.terms) return null;
  for (var i = 0; i < grade.terms.length; i++) {
    if (grade.terms[i].id === termId) return grade.terms[i];
  }
  return null;
}
function findSubject(term, subjectId) {
  if (!term || !term.subjects) return null;
  for (var i = 0; i < term.subjects.length; i++) {
    if (term.subjects[i].id === subjectId) return term.subjects[i];
  }
  return null;
}
function findUnit(subject, unitId) {
  if (!subject || !subject.units) return null;
  for (var i = 0; i < subject.units.length; i++) {
    if (subject.units[i].id === unitId) return subject.units[i];
  }
  return null;
}
function findLesson(unit, lessonId) {
  if (!unit || !unit.lessons) return null;
  for (var i = 0; i < unit.lessons.length; i++) {
    if (unit.lessons[i].id === lessonId) return unit.lessons[i];
  }
  return null;
}
