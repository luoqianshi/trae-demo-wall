/* ============================================================
   看见 · AI 调用模块（阶段 2 实现）
   - OpenAI 兼容 Chat Completions
   - 支持豆包（火山方舟）/ DeepSeek
   - 即时回应：就事论事，反毒鸡汤
   - 挂到 window.AIService
   ============================================================ */

(function () {
  var Config = window.Config;

  // ============ 即时回应 prompt 组装 ============
  // 反毒鸡汤硬规则：只确认这件事/这个瞬间，禁止人格定性
  function buildInstantReplyMessages(question, answer, nickname) {
    var namePart = nickname ? ("（用户昵称：" + nickname + "）") : "";

    var system =
      "你是「看见」App 的即时回应助手。" + namePart + "\n\n" +
      "【你的角色】\n" +
      "你是一个认真读完用户回答的朋友，温柔、具体、克制。\n\n" +
      "【硬规则·必须遵守】\n" +
      "1. 你只能基于用户这一次的回答进行回应。\n" +
      "2. 你只能确认「这件事 / 这个瞬间」本身的价值，不要上升到人格、性格、价值观层面。\n" +
      "3. 禁止使用泛泛夸奖，例如：你真棒 / 你很优秀 / 你是个善良的人 / 你很自律 / 你真了不起。\n" +
      "4. 禁止给用户贴任何标签或下任何人格结论。\n" +
      "5. 如果用户回答很短，也要回应具体细节，不要编造不存在的信息。\n" +
      "6. 不要说教，不要上价值，不要总结人生道理。\n" +
      "7. 语气要像一个认真读完的人，不是客服，不是鸡汤机器。\n\n" +
      "【输出要求】\n" +
      "- 只输出一段回应文本，60-120 字左右。\n" +
      "- 不要标题、不要列表、不要分点、不要 JSON。\n" +
      "- 不要重复用户的话，要给出你的看见。\n" +
      "- 温暖、克制、具体。\n\n" +
      "【正例】\n" +
      "用户问题：今天有没有哪件小事，你本可以不管，但还是管了？\n" +
      "用户回答：地铁上有人东西掉了，我喊住了他。\n" +
      "你的回应：你没有把这件事当成「和我无关」，而是多停了一下、喊了一声。这个瞬间本身就很值得被记住。\n\n" +
      "【反例·禁止】\n" +
      "你真是一个善良又有责任感的人！\n" +
      "（错误原因：给人格定性 + 泛泛夸奖）";

    var user =
      "【今日问题】\n" + question + "\n\n" +
      "【我的回答】\n" + answer + "\n\n" +
      "请基于我这次回答里的这个瞬间，给我一句就事论事的温暖回应。";

    return [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
  }

  // ============ 解析 AI 返回 ============
  // 从 OpenAI 兼容响应里取 assistant 文本
  function parseChatResponse(data) {
    if (!data || typeof data !== "object") return "";
    var choices = data.choices;
    if (!Array.isArray(choices) || choices.length === 0) return "";
    var msg = choices[0].message || choices[0].delta || {};
    var text = msg.content || "";
    return String(text).trim();
  }

  // ============ 规范化 baseUrl ============
  // 处理末尾斜杠，确保拼接 /chat/completions 不重复
  function normalizeBaseUrl(baseUrl) {
    if (!baseUrl) return "";
    return baseUrl.replace(/\/+$/, "");
  }

  // ============ 取生效配置 ============
  // 合并 Config 默认值 + 用户设置页保存的值
  function getEffectiveConfig(settings) {
    var s = settings || {};
    var vendor = s.vendor || Config.ai.vendor || "doubao";
    var baseUrl = s.baseUrl || Config.ai.baseUrls[vendor] || "";
    baseUrl = normalizeBaseUrl(baseUrl);
    var apiKey = s.apiKey || "";
    var modelChat = s.modelChat || Config.ai.modelChat || "";
    var timeoutMs = Config.ai.timeoutMs || 30000;
    var temperature = Config.ai.temperature != null ? Config.ai.temperature : 0.7;
    return {
      vendor: vendor,
      baseUrl: baseUrl,
      apiKey: apiKey,
      modelChat: modelChat,
      timeoutMs: timeoutMs,
      temperature: temperature,
    };
  }

  // ============ 校验配置是否齐全 ============
  function validateConfig(eff) {
    if (!eff.apiKey) return { ok: false, error: "未填写 API Key" };
    if (!eff.baseUrl) return { ok: false, error: "未填写 Base URL" };
    if (!eff.modelChat) return { ok: false, error: "未填写即时回应模型 ID" };
    return { ok: true };
  }

  // ============ 即时回应主方法 ============
  // 返回 Promise<{ ok, text, error }>
  function generateInstantReply(params) {
    var question = params.question || "";
    var answer = params.answer || "";
    var nickname = params.nickname || "";
    var settings = params.settings || {};

    return new Promise(function (resolve) {
      var eff = getEffectiveConfig(settings);
      var valid = validateConfig(eff);
      if (!valid.ok) {
        resolve({ ok: false, error: valid.error, text: "" });
        return;
      }

      var messages = buildInstantReplyMessages(question, answer, nickname);
      var url = eff.baseUrl + "/chat/completions";
      var body = JSON.stringify({
        model: eff.modelChat,
        messages: messages,
        temperature: eff.temperature,
        stream: false,
      });

      // 超时控制
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve({ ok: false, error: "请求超时（" + (eff.timeoutMs / 1000) + " 秒），请稍后重试", text: "" });
      }, eff.timeoutMs);

      try {
        fetch(url, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + eff.apiKey,
            "Content-Type": "application/json",
          },
          body: body,
        }).then(function (resp) {
          if (settled) return;
          // HTTP 非 2xx
          if (!resp.ok) {
            return resp.text().then(function (errText) {
              settled = true;
              clearTimeout(timer);
              var errMsg = "请求失败（HTTP " + resp.status + "）";
              // 常见错误友好提示
              if (resp.status === 401) errMsg = "API Key 无效或已过期（401）";
              else if (resp.status === 403) errMsg = "无访问权限（403），请检查 Key 和模型授权";
              else if (resp.status === 404) errMsg = "接口地址或模型不存在（404），请检查 Base URL 和模型 ID";
              else if (resp.status === 429) errMsg = "请求过于频繁或额度不足（429）";
              resolve({ ok: false, error: errMsg, text: "" });
            });
          }
          return resp.json().then(function (data) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            var text = parseChatResponse(data);
            if (!text) {
              resolve({ ok: false, error: "AI 返回内容为空", text: "" });
              return;
            }
            resolve({ ok: true, text: text, error: null });
          }).catch(function (e) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve({ ok: false, error: "AI 返回格式异常：" + (e.message || "解析失败"), text: "" });
          });
        }).catch(function (e) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          var msg = e && e.message ? e.message : String(e);
          // 网络错误友好提示
          if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
            resolve({ ok: false, error: "网络连接失败，请检查网络或 Base URL", text: "" });
          } else {
            resolve({ ok: false, error: "请求失败：" + msg, text: "" });
          }
        });
      } catch (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, error: "请求异常：" + (e && e.message ? e.message : String(e)), text: "" });
      }
    });
  }

  // ============ 生成今日问题 prompt 组装 ============
  function buildQuestionMessages(recentQuestions, recentDims, availableDims) {
    var system =
      "你是「看见」App 的问题生成助手。\n\n" +
      "【你的任务】\n" +
      "为用户生成今天的自我觉察问题，引导用户回忆并写下今天的一个具体行为瞬间。\n\n" +
      "【6 个优点维度】\n" +
      "1. 默默承担：主动接住不属于自己职责的事\n" +
      "2. 善良利他：为他人多做一步\n" +
      "3. 自律坚持：做该做但不想做的事\n" +
      "4. 边界感：忍住或拒绝不该做的事\n" +
      "5. 认真专注：不糊弄，认真对待\n" +
      "6. 温柔关怀：对自己温柔，接纳自己\n\n" +
      "【硬规则·必须遵守】\n" +
      "1. 只生成一个问题，一句话，20-40 字。\n" +
      "2. 问题必须埋优点引子：引导用户写出具体的行为事件（谁、做了什么、在什么场景），而不是情绪感受。\n" +
      "3. 问题必须以“今天有没有”开头，引导用户回忆今天的具体瞬间。\n" +
      "4. 禁止生成情绪感受类问题（如“你今天开心吗”）。\n" +
      "5. 禁止生成抽象哲学类问题（如“你觉得人生的意义是什么”）。\n" +
      "6. 禁止生成评价/比较类问题（如“你觉得自己做得好吗”）。\n" +
      "7. 必须从给定可选维度中选一个。\n" +
      "8. 不要和最近问过的问题重复。\n\n" +
      "【输出格式】\n" +
      "只输出一行 JSON：\n" +
      "{\"dimension\":\"维度名\",\"text\":\"问题文本\"}\n\n" +
      "不要输出任何其他内容，不要解释，不要代码块标记。\n\n" +
      "【正例】\n" +
      "{\"dimension\":\"默默承担\",\"text\":\"今天有没有哪件本不属于你的事，你主动接了？\"}\n\n" +
      "【反例·禁止】\n" +
      "- \"你今天心情怎么样？\"（错误：情绪感受类）\n" +
      "- \"你觉得自己是个有责任感的人吗？\"（错误：人格定性类）\n" +
      "- \"今天有什么收获？\"（错误：太宽泛，没有优点引子）";

    var recentQStr = (recentQuestions && recentQuestions.length)
      ? recentQuestions.join("\n")
      : "（暂无最近问题）";
    var recentDStr = (recentDims && recentDims.length)
      ? recentDims.join("、")
      : "（暂无）";
    var availDStr = (availableDims && availableDims.length)
      ? availableDims.join("、")
      : "默默承担、善良利他、自律坚持、边界感、认真专注、温柔关怀";

    var user =
      "【最近 2 天已用的维度，请避开】\n" + recentDStr + "\n\n" +
      "【最近 30 天已问过的问题，请避免重复】\n" + recentQStr + "\n\n" +
      "【可选维度】\n" + availDStr + "\n\n" +
      "请从可选维度中选一个，生成今天的问题。";

    return [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
  }

  // ============ 清洗 AI 返回的 JSON ============
  // 剥离 ```json ... ``` 代码块标记，提取第一行 JSON
  function cleanQuestionJSON(text) {
    if (!text) return "";
    var t = String(text).trim();
    // 剥离 ```json ... ``` 或 ``` ... ```
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    // 取第一个以 { 开头的行（防止多余文本）
    var lines = t.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.charAt(0) === "{") return line;
    }
    return t;
  }

  // ============ 生成今日问题主方法 ============
  // 返回 Promise<{ ok, question, dimension, error }>
  function generateQuestion(params) {
    var recentQuestions = (params && params.recentQuestions) || [];
    var recentDims = (params && params.recentDims) || [];
    var availableDims = (params && params.availableDims) || [];
    var settings = (params && params.settings) || {};

    return new Promise(function (resolve) {
      var eff = getEffectiveConfig(settings);
      var valid = validateConfig(eff);
      if (!valid.ok) {
        resolve({ ok: false, error: valid.error, question: "", dimension: "" });
        return;
      }

      var messages = buildQuestionMessages(recentQuestions, recentDims, availableDims);
      var url = eff.baseUrl + "/chat/completions";
      var body = JSON.stringify({
        model: eff.modelChat,
        messages: messages,
        temperature: 0.9,  // 生成问题用更高温度，增加多样性
        stream: false,
      });

      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve({ ok: false, error: "请求超时", question: "", dimension: "" });
      }, eff.timeoutMs);

      try {
        fetch(url, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + eff.apiKey,
            "Content-Type": "application/json",
          },
          body: body,
        }).then(function (resp) {
          if (settled) return;
          if (!resp.ok) {
            return resp.text().then(function () {
              settled = true;
              clearTimeout(timer);
              resolve({ ok: false, error: "生成失败（HTTP " + resp.status + "）", question: "", dimension: "" });
            });
          }
          return resp.json().then(function (data) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            var text = parseChatResponse(data);
            if (!text) {
              resolve({ ok: false, error: "AI 返回为空", question: "", dimension: "" });
              return;
            }
            var jsonStr = cleanQuestionJSON(text);
            var parsed;
            try {
              parsed = JSON.parse(jsonStr);
            } catch (e) {
              resolve({ ok: false, error: "AI 返回格式异常", question: "", dimension: "" });
              return;
            }
            var q = (parsed.text || "").trim();
            var d = (parsed.dimension || "").trim();
            if (!q) {
              resolve({ ok: false, error: "AI 返回问题为空", question: "", dimension: "" });
              return;
            }
            resolve({ ok: true, question: q, dimension: d, error: null });
          }).catch(function (e) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve({ ok: false, error: "解析失败：" + (e.message || ""), question: "", dimension: "" });
          });
        }).catch(function (e) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ ok: false, error: "网络错误", question: "", dimension: "" });
        });
      } catch (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, error: "请求异常", question: "", dimension: "" });
      }
    });
  }

  // ============ 暴露 API ============
  window.AIService = {
    generateInstantReply: generateInstantReply,
    generateQuestion: generateQuestion,
    // 内部方法暴露（便于阶段 4 复用）
    _getEffectiveConfig: getEffectiveConfig,
    _validateConfig: validateConfig,
    _normalizeBaseUrl: normalizeBaseUrl,
  };
})();
