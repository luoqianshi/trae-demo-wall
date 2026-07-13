/* ============================================================
   看见 · 演示模式（阶段 5）
   - 预置 18 条记录，覆盖 6 个维度，每维度 3 条
   - 一键载入（自动备份当前数据，可退出恢复）
   - 退出演示模式（恢复备份）
   - 挂到 window.DemoService
   ============================================================ */

(function () {
  // ============ 预置演示数据（18 条，6 维度各 3 条）============
  // 日期从 2026-06-18 到 2026-07-05，共 18 天
  // 每条 answer 都是具体行为事件，能形成证据链
  var DEMO_RECORDS = [
    // 维度 1：默默承担（3 条）
    {
      date: "2026-06-18",
      question: "今天有没有哪件小事，你本可以不管，但还是管了？",
      answer: "办公室茶水间的水壶空了，本来不是我的事，但顺手烧了一壶新的，没声张。",
    },
    {
      date: "2026-06-24",
      question: "今天有没有哪个时刻，你看到需要处理的事，没有等别人就先动了？",
      answer: "会议室的椅子歪了一排，开会前我顺手摆正了，没人注意到。",
    },
    {
      date: "2026-07-02",
      question: "今天有没有哪件别人忽略的小事，你顺手处理了？",
      answer: "同事走的时候电脑没锁屏，我帮他锁上了，没告诉他。",
    },

    // 维度 2：善良利他（3 条）
    {
      date: "2026-06-19",
      question: "今天有谁因为你而轻松了一点？",
      answer: "新来的同事不知道打印机怎么用，我带他走了一遍流程，他明显松了口气。",
    },
    {
      date: "2026-06-25",
      question: "今天你有没有为别人多做了一步，哪怕很小？",
      answer: "帮室友带饭的时候，顺手把他常吃的酱也买了，他知道的时候挺意外。",
    },
    {
      date: "2026-07-03",
      question: "今天有没有谁因为你的存在，少了一点麻烦？",
      answer: "地铁上有人推婴儿车进不来，我帮忙抬了一下，那位妈妈少折腾了好一会。",
    },

    // 维度 3：自律坚持（3 条）
    {
      date: "2026-06-20",
      question: "今天你坚持做了一件不太想做、但知道该做的事吗？",
      answer: "本来想跳过今天的跑步，但最后还是换鞋出门了，跑了 3 公里就回来了。",
    },
    {
      date: "2026-06-26",
      question: "今天有没有哪件事，你本来想拖到明天，但还是今天做了？",
      answer: "周报本来想明天再写，但今天下班前硬逼自己写完了，回家路上轻松不少。",
    },
    {
      date: "2026-07-04",
      question: "今天有没有哪件该做的事，你本来可以糊弄，但认真做了？",
      answer: "整理客户资料的时候，本来可以随便填填，但还是逐条核对了联系方式。",
    },

    // 维度 4：边界感（3 条）
    {
      date: "2026-06-21",
      question: "今天你有没有忍住什么，或者拒绝了什么？",
      answer: "朋友约我周末去爬山，但我确实需要休息，就拒绝了。以前我会硬答应。",
    },
    {
      date: "2026-06-27",
      question: "今天有没有哪个时刻，你没有随大流，而是按自己的判断来了？",
      answer: "讨论方案的时候大家都在附和领导的意见，但我提了自己的顾虑，没有跟着点头。",
    },
    {
      date: "2026-07-05",
      question: "今天有没有哪个场合，你守住了自己的节奏，没被带跑？",
      answer: "同事催我快点交结果，但我坚持按自己的节奏把最后一步检查完才交。",
    },

    // 维度 5：认真专注（3 条）
    {
      date: "2026-06-22",
      question: "今天有没有哪个瞬间，你认真听完了别人没说完的话？",
      answer: "同事讲一个很长的背景，其他人都在看手机，我听完了，他后来跟我说谢谢。",
    },
    {
      date: "2026-06-28",
      question: "今天有没有什么事，你本可以糊弄过去，但选择了认真？",
      answer: "做会议纪要的时候，本来可以只记结论，但我把讨论过程也整理了，发出去后领导说很有用。",
    },
    {
      date: "2026-07-01",
      question: "今天你有没有在哪件小事上，多花了一点心思？",
      answer: "回复客户邮件的时候，把格式重新排了一下，语气也调得更柔和，没直接用模板。",
    },

    // 维度 6：温柔关怀（3 条）
    {
      date: "2026-06-23",
      question: "今天有没有哪个时刻，你对自己比平时更温柔一点？",
      answer: "早上起晚了，本来想骂自己，但忍住了，跟自己说昨晚睡太晚不怪你，慢慢来。",
    },
    {
      date: "2026-06-29",
      question: "今天你有没有允许自己慢一点，没有催自己？",
      answer: "今天状态不太好，本来想逼自己赶完一个文档，但最后选择先休息 20 分钟再开始。",
    },
    {
      date: "2026-06-30",
      question: "今天有没有哪个瞬间，你接纳了自己的某个小情绪？",
      answer: "中午莫名其妙有点低落，没有强行压下去，就在工位上发了一会呆，让它过去。",
    },
  ];

  // ============ 演示模式标记 + 数据快照 ============
  var DEMO_FLAG_KEY = "kanjian_demo_mode";      // 演示模式标记
  var DEMO_SNAPSHOT_KEY = "kanjian_demo_snapshot"; // 演示前的数据快照

  // ============ 检查是否处于演示模式 ============
  function isDemoMode() {
    try {
      return localStorage.getItem(DEMO_FLAG_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  // ============ 载入演示数据 ============
  // 返回 { ok, error }
  function loadDemo() {
    try {
      // 1. 先备份当前数据（settings 保留 apiKey 等敏感字段）
      var currentRecords = window.StorageService.getAllRecords();
      var currentSettings = window.StorageService.getSettings();
      var snapshot = {
        records: currentRecords,
        settings: currentSettings,
        snapshotAt: Date.now(),
      };

      // 2. 写入快照
      try {
        localStorage.setItem(DEMO_SNAPSHOT_KEY, JSON.stringify(snapshot));
      } catch (e) {
        console.warn("[Demo] 快照写入失败", e);
      }

      // 3. 载入预置记录（用 importData 的白名单逻辑不合适，直接写）
      var demoRecords = [];
      var now = Date.now();
      for (var i = 0; i < DEMO_RECORDS.length; i++) {
        var r = DEMO_RECORDS[i];
        demoRecords.push({
          id: "demo_" + i + "_" + now,
          date: r.date,
          question: r.question,
          answer: r.answer,
          createdAt: now - (DEMO_RECORDS.length - i) * 86400000,
          updatedAt: now - (DEMO_RECORDS.length - i) * 86400000,
          aiReply: "",
          aiReplyAt: null,
          aiReplyStatus: "idle",
          aiReplyError: "",
        });
      }
      // 按日期升序
      demoRecords.sort(function (a, b) {
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      });

      // 4. 写入记录（保留用户当前 settings，只覆盖 records）
      try {
        localStorage.setItem(window.Config.storageKeys.records, JSON.stringify(demoRecords));
      } catch (e) {
        return { ok: false, error: "写入演示数据失败" };
      }

      // 5. 设置演示模式标记
      try {
        localStorage.setItem(DEMO_FLAG_KEY, "1");
      } catch (e) {
        // 标记写入失败不影响功能，但退出时无法恢复
        console.warn("[Demo] 标记写入失败", e);
      }

      return { ok: true, error: null };
    } catch (e) {
      return { ok: false, error: "载入演示数据异常：" + (e.message || String(e)) };
    }
  }

  // ============ 退出演示模式 ============
  // 恢复快照数据
  function exitDemo() {
    try {
      // 1. 读取快照
      var snapshotRaw = null;
      try {
        snapshotRaw = localStorage.getItem(DEMO_SNAPSHOT_KEY);
      } catch (e) {
        // 读取失败
      }

      if (snapshotRaw) {
        try {
          var snapshot = JSON.parse(snapshotRaw);
          // 2. 恢复记录
          if (snapshot.records && Array.isArray(snapshot.records)) {
            localStorage.setItem(window.Config.storageKeys.records, JSON.stringify(snapshot.records));
          }
          // 3. 恢复设置（包括 apiKey）
          if (snapshot.settings && typeof snapshot.settings === "object") {
            localStorage.setItem(window.Config.storageKeys.settings, JSON.stringify(snapshot.settings));
          }
        } catch (e) {
          console.warn("[Demo] 快照恢复失败", e);
        }
      }

      // 4. 清除演示标记和快照
      try {
        localStorage.removeItem(DEMO_FLAG_KEY);
        localStorage.removeItem(DEMO_SNAPSHOT_KEY);
      } catch (e) {
        // 忽略
      }

      return { ok: true, error: null };
    } catch (e) {
      return { ok: false, error: "退出演示模式异常：" + (e.message || String(e)) };
    }
  }

  // ============ 获取演示记录数 ============
  function getDemoRecordCount() {
    return DEMO_RECORDS.length;
  }

  // ============ 暴露 API ============
  window.DemoService = {
    isDemoMode: isDemoMode,
    loadDemo: loadDemo,
    exitDemo: exitDemo,
    getDemoRecordCount: getDemoRecordCount,
  };
})();
