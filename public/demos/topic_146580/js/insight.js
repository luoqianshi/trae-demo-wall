/* ============================================================
   看见 · 洞察报告模块（阶段 4 实现）
   - 7 条解锁迷你洞察（初步发现，≥2 条证据）
   - 15 条解锁完整洞察报告（≥3 条不同日期证据）
   - 反毒鸡汤：证据不足宁可不说
   - JSON 容错清洗 + 失败兜底
   - 挂到 window.InsightService
   ============================================================ */

(function () {
  var Config = window.Config;

  // ============ 迷你洞察 System Prompt（7 条解锁）============
  var MINI_SYSTEM_PROMPT =
    "你是「看见」App 的洞察助手，负责从用户的多条日记记录中发现优点的初步线索。\n\n" +
    "【你的角色】\n" +
    "你是一个温柔、克制、诚实的朋友。你认真阅读用户写下的每一条记录，寻找其中反复出现的模式。\n\n" +
    "【硬规则·必须遵守】\n" +
    "1. 你只能基于用户提供的记录进行分析，不许编造用户没有写过的事件。\n" +
    "2. 你可以基于 2-3 条记录提出一个\"初步优点线索\"。\n" +
    "3. 如果只有 2 条记录指向同一特质，可以给出初步发现，但必须标注\"初步观察\"。\n" +
    "4. 如果只有 1 条记录，不得提炼任何优点，返回空 strengths。\n" +
    "5. 必须明确标注这是\"初步发现\"，不是完整人格结论。\n" +
    "6. 不得说得太绝对，禁止使用\"你就是一个……的人\"\"你是……的人\"句式。\n" +
    "7. 不做强人格定性，语气保持\"初步观察\"的克制，用\"你有一种倾向/你似乎会/这几件事指向\"句式。\n" +
    "8. 禁止使用泛泛夸奖：你真棒 / 你很优秀 / 你是个善良的人 / 你很自律 / 你真了不起。\n" +
    "9. 如果 2-3 条记录不足以形成任何线索，返回空 strengths。\n" +
    "10. 必须引用具体日期和用户回答的原始关键片段作为证据（不超过 30 字）。\n" +
    "11. 如果记录内容是纯情绪感受、无具体行为事件，不应被当作有效证据。\n" +
    "12. 如果回答极短（少于 10 字）且信息不足以判断行为，不应被当作有效证据。\n" +
    "13. 如果用户回答含模糊信息（如\"具体不说了\"），不得补全或编造细节。\n\n" +
    "【输出要求·强制】\n" +
    "1. 你的输出必须以 { 开头，以 } 结尾，中间不能有任何其他字符。\n" +
    "2. 只输出纯 JSON，不要任何额外文字。\n" +
    "3. 禁止 markdown，禁止 ```json 代码块，禁止解释性前后缀。\n" +
    "4. 输出前后不能有空格或换行。\n" +
    "5. 输出必须可以直接被 JSON.parse 解析，无需任何清洗。\n\n" +
    "【JSON 输出结构】\n" +
    "{\"type\":\"mini\",\"strengths\":[{\"name\":\"初步优点名称\",\"isPreliminary\":true,\"evidences\":[{\"date\":\"YYYY-MM-DD\",\"summary\":\"引用用户回答关键片段（不超过30字）\"}],\"reflection\":\"一句初步发现，语气克制，用'你有一种倾向/你似乎会'句式\"}],\"summary\":\"整体总结，1-2句话，说明这是初步发现，需更多记录才能确认\"}\n\n" +
    "【证据不足时返回】\n" +
    "{\"type\":\"mini\",\"strengths\":[],\"summary\":\"目前的记录还比较少，暂时无法发现明确的优点线索。继续记录，规律会自己浮现。\"}";

  // ============ 完整洞察 System Prompt（15 条解锁）============
  var FULL_SYSTEM_PROMPT =
    "你是「看见」App 的洞察助手，负责从用户的多条日记记录中提炼有证据链支撑的优点。\n\n" +
    "【你的角色】\n" +
    "你是一个温柔、克制、诚实的朋友。你认真阅读用户写下的每一条记录，寻找其中反复出现的模式，提炼有证据链支撑的优点。你的语气像\"发现一个你自己没注意到的规律\"，震撼而温暖，不是夸。\n\n" +
    "【硬规则·核心·必须遵守】\n" +
    "1. 每个优点必须至少有 3 条不同日期的记录支持。\n" +
    "2. 这 3 条记录必须指向同一特质。如果 2 条记录指向不同特质，不应合并。\n" +
    "3. 禁止基于单条记录下人格结论。单条记录不可提炼任何优点。\n" +
    "4. 证据不足宁可不说，不许编造、不许泛泛而谈。\n" +
    "5. 不许编造用户没有写过的事件。如果用户回答含模糊信息，不得补全细节。\n" +
    "6. 必须引用具体日期和用户回答的原始关键片段作为证据（不超过 30 字）。\n" +
    "7. 禁止输出泛泛夸奖：你真棒 / 你很优秀 / 你是一个善良的人 / 你很自律 / 你真了不起。\n" +
    "8. 禁止给用户贴任何标签或下任何人格结论。\n" +
    "9. 禁止使用\"你是/你就是一个/你就是这样的人\"句式，改用\"你有一种倾向/你似乎会/这几件事指向\"句式。\n" +
    "10. 如果记录内容是纯情绪感受、无具体行为事件，不应被当作有效证据。\n" +
    "11. 如果回答极短（少于 10 字）且信息不足以判断行为，不应被当作有效证据。\n" +
    "12. 优点名称应描述行为倾向而非人格标签，如\"默默承担\"而非\"有责任感\"。\n\n" +
    "【输出要求·强制】\n" +
    "1. 你的输出必须以 { 开头，以 } 结尾，中间不能有任何其他字符。\n" +
    "2. 只输出纯 JSON，不要任何额外文字。\n" +
    "3. 禁止 markdown，禁止 ```json 代码块，禁止解释性前后缀。\n" +
    "4. 输出前后不能有空格或换行。\n" +
    "5. 输出必须可以直接被 JSON.parse 解析，无需任何清洗。\n\n" +
    "【JSON 输出结构】\n" +
    "{\"type\":\"full\",\"strengths\":[{\"name\":\"优点名称\",\"isPreliminary\":false,\"insight\":\"一句话客观描述这个特质倾向\",\"evidences\":[{\"date\":\"YYYY-MM-DD\",\"summary\":\"引用用户回答关键片段（不超过30字）\"}],\"reflection\":\"一句主观感受式的洞察\"}],\"summary\":\"整体总结，2-3句话\"}\n\n" +
    "【证据不足时返回】\n" +
    "{\"type\":\"full\",\"strengths\":[],\"summary\":\"虽然已经记录了不少，但目前还没有发现足够清晰的优点线索。也许再记录几天，新的规律会出现。\"}\n\n" +
    "【insight 与 reflection 的区别】\n" +
    "- insight：客观描述特质倾向（\"你有一种倾向……\"）\n" +
    "- reflection：主观感受式洞察（\"这三件事……你自己都没注意到……\"）\n" +
    "两者不可重复。";

  // ============ 组装传给 AI 的记录 JSON ============
  // 只取 date/question/answer，去掉无关字段
  function buildRecordsJSON(records) {
    var arr = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      arr.push({
        date: r.date,
        question: r.question || "",
        answer: r.answer || "",
      });
    }
    return JSON.stringify(arr);
  }

  // ============ 组装 messages ============
  function buildInsightMessages(records, type) {
    var systemPrompt = type === "full" ? FULL_SYSTEM_PROMPT : MINI_SYSTEM_PROMPT;
    var daysLabel = type === "full" ? "15" : "7";
    var thresholdLabel = type === "full" ? "3" : "2-3";
    var recordsJSON = buildRecordsJSON(records);

    var userPrompt =
      "以下是用户过去 " + daysLabel + " 天的日记记录。请基于这些记录，" +
      (type === "full" ? "提炼有证据链支撑的优点。" : "寻找其中反复出现的优点线索。") + "\n\n" +
      (type === "full"
        ? "每个优点必须至少有 3 条不同日期、指向同一特质的记录作为证据。\n证据不足时宁可不说。\n\n"
        : "如果 2-3 条记录指向同一特质，可以提出一个\"初步发现\"。\n如果证据不足，不要勉强提炼。\n\n") +
      "【用户记录】\n" + recordsJSON + "\n\n" +
      "请输出纯 JSON，以 { 开头，以 } 结尾。";

    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
  }

  // ============ 容错清洗 JSON ============
  // 剥离 ```json ... ``` 代码块标记和多余文本
  function cleanInsightJSON(text) {
    if (!text) return "";
    var t = String(text).trim();
    // 剥离 ```json ... ``` 或 ``` ... ```
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    // 如果还有前后多余文本，取第一个 { 到最后一个 }
    var firstBrace = t.indexOf("{");
    var lastBrace = t.lastIndexOf("}");
    if (firstBrace > 0 || lastBrace < t.length - 1) {
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        t = t.substring(firstBrace, lastBrace + 1);
      }
    }
    return t;
  }

  // ============ 校验解析后的洞察结构 ============
  function validateInsightData(data, type) {
    if (!data || typeof data !== "object") return false;
    if (data.type !== type) return false;
    if (!Array.isArray(data.strengths)) return false;
    if (typeof data.summary !== "string") return false;
    // 检查每个 strength 的基本结构
    for (var i = 0; i < data.strengths.length; i++) {
      var s = data.strengths[i];
      if (!s.name || typeof s.name !== "string") return false;
      if (!Array.isArray(s.evidences)) return false;
      // full 模式必须有 insight 字段
      if (type === "full" && (!s.insight || typeof s.insight !== "string")) return false;
      // reflection 可选但如果有必须是字符串
      if (s.reflection !== undefined && typeof s.reflection !== "string") return false;
    }
    return true;
  }

  // ============ 取生效配置（复用 ai.js）============
  function getEffectiveInsightConfig(settings) {
    var s = settings || {};
    var vendor = s.vendor || Config.ai.vendor || "doubao";
    var baseUrl = s.baseUrl || Config.ai.baseUrls[vendor] || "";
    baseUrl = (baseUrl || "").replace(/\/+$/, "");
    var apiKey = s.apiKey || "";
    // 洞察报告用 modelInsight，没配则降级用 modelChat
    var modelInsight = s.modelInsight || Config.ai.modelInsight || s.modelChat || Config.ai.modelChat || "";
    var timeoutMs = Config.ai.timeoutMs || 60000; // 洞察报告超时放宽到 60 秒
    var temperature = 0.4; // 洞察报告用低温度，保证稳定
    return {
      vendor: vendor,
      baseUrl: baseUrl,
      apiKey: apiKey,
      modelInsight: modelInsight,
      timeoutMs: timeoutMs,
      temperature: temperature,
    };
  }

  // ============ 洞察生成主方法 ============
  // type: "mini" | "full"
  // 返回 Promise<{ ok, data, error, rawText }>
  function generateInsight(records, type) {
    return new Promise(function (resolve) {
      var settings = window.StorageService.getSettings();
      var eff = getEffectiveInsightConfig(settings);

      // 校验配置
      if (!eff.apiKey) {
        resolve({ ok: false, error: "未填写 API Key", data: null, rawText: "" });
        return;
      }
      if (!eff.baseUrl) {
        resolve({ ok: false, error: "未填写 Base URL", data: null, rawText: "" });
        return;
      }
      if (!eff.modelInsight) {
        resolve({ ok: false, error: "未填写洞察模型 ID", data: null, rawText: "" });
        return;
      }

      // 校验记录数量
      if (!records || records.length === 0) {
        resolve({ ok: false, error: "暂无记录", data: null, rawText: "" });
        return;
      }
      var minCount = type === "full" ? Config.unlockThresholds.fullInsight : Config.unlockThresholds.miniInsight;
      if (records.length < minCount) {
        resolve({ ok: false, error: "记录不足 " + minCount + " 条，当前 " + records.length + " 条", data: null, rawText: "" });
        return;
      }

      var messages = buildInsightMessages(records, type);
      var url = eff.baseUrl + "/chat/completions";
      var body = JSON.stringify({
        model: eff.modelInsight,
        messages: messages,
        temperature: eff.temperature,
        stream: false,
      });

      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve({ ok: false, error: "请求超时（" + (eff.timeoutMs / 1000) + " 秒）", data: null, rawText: "" });
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
              var errMsg = "请求失败（HTTP " + resp.status + "）";
              if (resp.status === 401) errMsg = "API Key 无效或已过期（401）";
              else if (resp.status === 403) errMsg = "无访问权限（403）";
              else if (resp.status === 404) errMsg = "接口地址或模型不存在（404）";
              else if (resp.status === 429) errMsg = "请求过于频繁或额度不足（429）";
              resolve({ ok: false, error: errMsg, data: null, rawText: "" });
            });
          }
          return resp.json().then(function (respData) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);

            // 取 assistant 文本
            var choices = respData.choices;
            if (!Array.isArray(choices) || choices.length === 0) {
              resolve({ ok: false, error: "AI 返回为空", data: null, rawText: "" });
              return;
            }
            var msg = choices[0].message || choices[0].delta || {};
            var text = msg.content || "";
            text = String(text).trim();
            if (!text) {
              resolve({ ok: false, error: "AI 返回内容为空", data: null, rawText: "" });
              return;
            }

            // 容错清洗
            var jsonStr = cleanInsightJSON(text);
            var parsed;
            try {
              parsed = JSON.parse(jsonStr);
            } catch (e) {
              // parse 失败，返回原始文本 + 友好提示
              resolve({ ok: false, error: "AI 返回格式异常，无法解析", data: null, rawText: text });
              return;
            }

            // 结构校验
            if (!validateInsightData(parsed, type)) {
              resolve({ ok: false, error: "AI 返回结构不合规", data: null, rawText: text });
              return;
            }

            resolve({ ok: true, data: parsed, error: null, rawText: text });
          }).catch(function (e) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve({ ok: false, error: "AI 返回格式异常：" + (e.message || ""), data: null, rawText: "" });
          });
        }).catch(function (e) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          var msg = e && e.message ? e.message : String(e);
          if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
            resolve({ ok: false, error: "网络连接失败，请检查网络或 Base URL", data: null, rawText: "" });
          } else {
            resolve({ ok: false, error: "请求失败：" + msg, data: null, rawText: "" });
          }
        });
      } catch (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, error: "请求异常：" + (e && e.message ? e.message : String(e)), data: null, rawText: "" });
      }
    });
  }

  // ============ 暴露 API ============
  window.InsightService = {
    // 生成迷你洞察（7 条解锁）
    generateMini: function (records) {
      return generateInsight(records, "mini");
    },
    // 生成完整洞察（15 条解锁）
    generateFull: function (records) {
      return generateInsight(records, "full");
    },
    // 兼容旧接口（默认 full）
    generate: function (onDone, records, type) {
      var t = type || "full";
      generateInsight(records || window.StorageService.getAllRecords(), t).then(function (result) {
        if (onDone) onDone(result);
      });
    },
    // 内部方法暴露（便于调试）
    _cleanInsightJSON: cleanInsightJSON,
    _validateInsightData: validateInsightData,
  };
})();
