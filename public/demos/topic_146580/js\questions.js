/* ============================================================
   看见 · 问题库（阶段 3 完整版）
   - 30 题，分 6 个优点维度
   - 每题"埋优点引子"——引导用户写出具体行为事件
   - 同一天用日期种子取同一题
   - 跨天尽量不连续重复维度
   ============================================================ */

(function () {
  // ============ 问题库（30 题，6 维度，每维度 5 个不同切入角度）============
  // 每题"埋优点引子"：引导用户写出具体行为事件，而非情绪感受
  // 同一维度内 5 题场景/对象/反差点不同，避免同质换说法
  var questions = [
    // 维度 1：默默承担 / 责任感（5 个场景：职责外 / 公共 / 推诿 / 细节 / 沉默）
    { id: "Q01", dimension: "默默承担", text: "今天有没有哪件本不属于你职责的事，你主动接了？" },
    { id: "Q02", dimension: "默默承担", text: "今天在公共场合，有没有看到需要处理的事，你没等别人就先动了？" },
    { id: "Q03", dimension: "默默承担", text: "今天有没有谁推诿或犹豫的事，你站出来扛了？" },
    { id: "Q04", dimension: "默默承担", text: "今天有没有哪个别人忽略的小问题，你顺手处理了？" },
    { id: "Q05", dimension: "默默承担", text: "今天有没有什么事，你默默做了没声张，也没人知道？" },

    // 维度 2：善良利他（5 个角度：陌生人 / 身边人 / 预判 / 代劳 / 让渡）
    { id: "Q06", dimension: "善良利他", text: "今天有没有为陌生人做了一件小事？" },
    { id: "Q07", dimension: "善良利他", text: "今天有没有为身边的人多走了一步？" },
    { id: "Q08", dimension: "善良利他", text: "今天有没有在别人开口前，就注意到了 ta 的需要？" },
    { id: "Q09", dimension: "善良利他", text: "今天有没有替别人挡掉了一点麻烦？" },
    { id: "Q10", dimension: "善良利他", text: "今天有没有把自己的什么——时间、方便或机会——让给了别人？" },

    // 维度 3：自律坚持（5 个对抗：拖延 / 惰性 / 放弃 / 糊弄 / 诱惑）
    { id: "Q11", dimension: "自律坚持", text: "今天有没有哪件事你想拖到明天，但还是今天做了？" },
    { id: "Q12", dimension: "自律坚持", text: "今天有没有哪个时刻你克服了“不想动”，还是动起来了？" },
    { id: "Q13", dimension: "自律坚持", text: "今天有没有在想放弃的时候，多坚持了一会？" },
    { id: "Q14", dimension: "自律坚持", text: "今天有没有哪件该做的事，你本可以糊弄，但认真做了？" },
    { id: "Q15", dimension: "自律坚持", text: "今天有没有忍住了什么诱惑或冲动，做了该做的？" },

    // 维度 4：边界感（5 个边界：言语 / 从众 / 拒绝 / 节奏 / 情绪）
    { id: "Q16", dimension: "边界感", text: "今天有没有在想说错话的边缘，忍住了？" },
    { id: "Q17", dimension: "边界感", text: "今天有没有哪个时刻，你没随大流，按自己判断来了？" },
    { id: "Q18", dimension: "边界感", text: "今天有没有什么事，你本可以答应，但选择了不答应？" },
    { id: "Q19", dimension: "边界感", text: "今天有没有守住自己的节奏，没被别人带跑？" },
    { id: "Q20", dimension: "边界感", text: "今天有没有在别人情绪上来时，没被带进去，稳住了自己？" },

    // 维度 5：认真专注（5 个角度：倾听 / 做事 / 细节 / 心思 / 超越）
    { id: "Q21", dimension: "认真专注", text: "今天有没有认真听完别人没说完的话？" },
    { id: "Q22", dimension: "认真专注", text: "今天有没有哪件事，你本可以糊弄过去，但选择了认真？" },
    { id: "Q23", dimension: "认真专注", text: "今天有没有把别人没在意的细节，留意到了？" },
    { id: "Q24", dimension: "认真专注", text: "今天有没有在哪件小事上，多花了一点心思？" },
    { id: "Q25", dimension: "认真专注", text: "今天有没有在哪件事上，做到了“不只是完成”？" },

    // 维度 6：温柔关怀（5 个角度：温柔 / 允许慢 / 接纳情绪 / 公道话 / 喘息空间）
    { id: "Q26", dimension: "温柔关怀", text: "今天有没有哪个时刻，你对自己比平时更温柔一点？" },
    { id: "Q27", dimension: "温柔关怀", text: "今天有没有允许自己慢一点，没有催自己？" },
    { id: "Q28", dimension: "温柔关怀", text: "今天有没有接纳了自己的某个小情绪，没和它较劲？" },
    { id: "Q29", dimension: "温柔关怀", text: "今天有没有对自己说了一句还算公道的话？" },
    { id: "Q30", dimension: "温柔关怀", text: "今天有没有给自己留了一点喘息的空间？" },
  ];

  // ============ 日期种子：同一天返回同一索引 ============
  function dateSeed(dateStr) {
    var sum = 0;
    for (var i = 0; i < dateStr.length; i++) {
      sum = (sum * 31 + dateStr.charCodeAt(i)) % 1000000007;
    }
    return sum;
  }

  // ============ 获取最近 N 天已记录的维度（用于跨维度轮换）============
  function getRecentDimensions(days) {
    if (!window.StorageService) return [];
    var records = window.StorageService.getAllRecords();
    if (!records || records.length === 0) return [];
    // 按日期倒序，取最近 days 天的维度
    var sorted = records.slice().sort(function (a, b) {
      return b.date < a.date ? -1 : (b.date > a.date ? 1 : 0);
    });
    var dims = [];
    for (var i = 0; i < Math.min(days, sorted.length); i++) {
      var q = sorted[i].question;
      // 找到这个问题对应的维度
      for (var j = 0; j < questions.length; j++) {
        if (questions[j].text === q) {
          dims.push(questions[j].dimension);
          break;
        }
      }
    }
    return dims;
  }

  // ============ 获取最近 N 天已记录的问题文本（用于 AI 生成时避免重复）============
  function getRecentQuestions(days) {
    if (!window.StorageService) return [];
    var records = window.StorageService.getAllRecords();
    if (!records || records.length === 0) return [];
    var sorted = records.slice().sort(function (a, b) {
      return b.date < a.date ? -1 : (b.date > a.date ? 1 : 0);
    });
    var qs = [];
    for (var i = 0; i < Math.min(days, sorted.length); i++) {
      if (sorted[i].question) qs.push(sorted[i].question);
    }
    return qs;
  }

  // ============ 根据日期取问题（带跨维度轮换）============
  function getQuestionByDate(dateStr) {
    if (!dateStr) dateStr = window.StorageService.todayStr();
    var seed = dateSeed(dateStr);

    // 获取最近 2 天已记录的维度，尽量避开
    var recentDims = getRecentDimensions(2);

    // 第一轮：从种子索引开始，找第一个不在 recentDims 的问题
    var startIdx = seed % questions.length;
    for (var offset = 0; offset < questions.length; offset++) {
      var idx = (startIdx + offset) % questions.length;
      var dim = questions[idx].dimension;
      if (recentDims.indexOf(dim) === -1) {
        return questions[idx].text;
      }
    }

    // 如果所有维度都和最近重复了（极少见），直接用种子索引
    return questions[startIdx].text;
  }

  // 获取今天的静态问题（同步，兜底用）
  function getTodayQuestion() {
    return getQuestionByDate(window.StorageService.todayStr());
  }

  // ============ 异步获取今天的问题（AI 优先 + 静态兜底）============
  // 返回 Promise<{ text, dimension, source }>
  // source: "ai-cache" | "ai" | "static" | "static-fallback"
  function getTodayQuestionAsync() {
    return new Promise(function (resolve) {
      var date = window.StorageService.todayStr();

      // 1. 先读当天 AI 缓存
      var cached = window.StorageService.getTodayAIQuestion();
      if (cached && cached.text) {
        resolve({ text: cached.text, dimension: cached.dimension || "", source: "ai-cache" });
        return;
      }

      // 2. 检查是否配了 Key
      var settings = window.StorageService.getSettings();
      var eff = window.AIService._getEffectiveConfig(settings);
      var valid = window.AIService._validateConfig(eff);

      if (!valid.ok) {
        // 没配 Key，直接用静态题
        resolve({ text: getQuestionByDate(date), dimension: "", source: "static" });
        return;
      }

      // 3. 配了 Key，调 AI 生成
      var recentQs = getRecentQuestions(30);
      var recentDims = getRecentDimensions(2);
      var allDims = getDimensions();
      var availDims = [];
      for (var i = 0; i < allDims.length; i++) {
        if (recentDims.indexOf(allDims[i]) === -1) availDims.push(allDims[i]);
      }
      if (availDims.length === 0) availDims = allDims;

      window.AIService.generateQuestion({
        recentQuestions: recentQs,
        recentDims: recentDims,
        availableDims: availDims,
        settings: settings,
      }).then(function (result) {
        if (result.ok && result.question) {
          window.StorageService.saveTodayAIQuestion(result.question, result.dimension);
          resolve({ text: result.question, dimension: result.dimension, source: "ai" });
        } else {
          resolve({ text: getQuestionByDate(date), dimension: "", source: "static-fallback" });
        }
      });
    });
  }

  // 获取全部问题
  function getAllQuestions() {
    return questions.slice();
  }

  // 获取全部维度
  function getDimensions() {
    var dims = [];
    for (var i = 0; i < questions.length; i++) {
      if (dims.indexOf(questions[i].dimension) === -1) {
        dims.push(questions[i].dimension);
      }
    }
    return dims;
  }

  window.Questions = {
    getTodayQuestion: getTodayQuestion,
    getTodayQuestionAsync: getTodayQuestionAsync,
    getQuestionByDate: getQuestionByDate,
    getAllQuestions: getAllQuestions,
    getDimensions: getDimensions,
  };
})();
