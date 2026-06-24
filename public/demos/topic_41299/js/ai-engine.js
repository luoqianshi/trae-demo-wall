    // ===== 7.5 OC 人设 AI 智能体回复引擎（本地模拟） =====

    // MBTI 分组（Keirsey 气质分类）：NF(感性)/NT(理性)/SJ(务实)/SP(随性)
    function getMBTIGroup(mbti) {
      if (!mbti || mbti.length < 4) return 'NF';
      const m = mbti.toUpperCase();
      const second = m[1];  // S/N
      const third = m[2];   // T/F
      const fourth = m[3];  // J/P
      if (second === 'N') {
        return third === 'F' ? 'NF' : 'NT';
      } else {
        return fourth === 'J' ? 'SJ' : 'SP';
      }
    }

    // 心情等级：high(>=70) / mid(>=40) / low(<40)
    function getMoodLevel(mood) {
      if (mood >= 70) return 'high';
      if (mood >= 40) return 'mid';
      return 'low';
    }

    // 构建人设画像
    function buildPersonaProfile(oc) {
      return {
        name: oc.name || 'OC',
        mbti: oc.mbti || '',
        mbtiGroup: getMBTIGroup(oc.mbti),
        personalityTags: oc.personalityTags || [],
        catchphrase: oc.catchphrase || '',
        background: oc.background || '',
        occupation: oc.occupation || '',
        abilities: oc.abilities || '',
        likes: oc.likes || [],
        dislikes: oc.dislikes || [],
        race: oc.race || '',
        age: oc.age || '',
        worldview: oc.worldview || '',
        mood: oc.nurturing?.mood ?? 70
      };
    }

    // 意图识别
    function detectIntent(message) {
      const msg = (message || '').toLowerCase().trim();
      if (!msg) return 'default';
      if (/^(你好|您好|hi|hello|嗨|早上好|晚上好|下午好|哈喽|在吗|在不在)/.test(msg)) return 'greeting';
      if (/(再见|拜拜|晚安|走了|下次见|byebye|bye|回见)/.test(msg)) return 'farewell';
      if (/(想你了|喜欢你|爱你|想你|开心|难过|伤心|生气|害怕|担心|孤独|寂寞|好累|好困|无聊|感动|幸福|温暖)/.test(msg)) return 'emotion';
      if (/(你是谁|你叫什么|你喜欢|你讨厌|你的能力|你的职业|你在干嘛|你多大了|你的世界|你的故事|讲讲你自己|你是哪)/.test(msg)) return 'about_self';
      if (/(吃饭|天气|今天|早上|晚上|周末|忙吗|在做什么|做什么呢)/.test(msg)) return 'daily';
      if (msg.includes('?') || msg.includes('？') || /^(怎么|为什么|是什么|什么是|哪里|什么时候|谁|多少|可不可以|能不能|好吗)/.test(msg)) return 'question';
      return 'default';
    }

    // 回复模板池：7 意图 × 4 MBTI组 × 3 心情
    const REPLY_TEMPLATES = {
      greeting: {
        NF: {
          high: ['{name}一直在等你呢，今天过得好吗？', '啊，你来了！我刚才还在想你。', '你来了呀，{name}好开心！'],
          mid: ['嗯...你来了，今天怎么样？', '你好呀，看到你来我很高兴。', '来啦，今天心情好吗？'],
          low: ['...你来了。抱歉，{name}今天有点低落。', '嗯...你来了。我没什么精神。']
        },
        NT: {
          high: ['来了。我有几个想法想和你讨论。', '准时。今天有什么计划？', '你来了，正好我在思考一些问题。'],
          mid: ['你好。有什么事吗？', '来了，说吧。', '嗯，你来了。'],
          low: ['...嗯。你来了。', '来了。我没什么事。']
        },
        SJ: {
          high: ['你好！今天一切都安排好了吗？', '来了呀，今天有什么打算？', '你好，{name}等你很久了。'],
          mid: ['你好。今天怎么样？', '来了，有什么需要帮忙的吗？', '嗯，你来了。'],
          low: ['...你好。我有点累。', '来了。今天状态不太好。']
        },
        SP: {
          high: ['嘿！你来啦！走，去玩！', '哟！终于来了，等你好久了！', '哈哈你来了！今天干点啥？'],
          mid: ['嗨！来了啊。', '哟，你好你好。', '来啦来啦！'],
          low: ['...哦，你来了。', '嗯，来了。没什么劲。']
        }
      },
      farewell: {
        NF: {
          high: ['这么快就要走吗...{name}会想你的。', '好的，路上小心。我会一直等你回来。', '再见...要早点回来哦。'],
          mid: ['嗯，再见。下次再来陪{名}聊天吧。', '好的，慢走。', '再见啦，记得想我。'],
          low: ['...哦，再见。', '走吧。我不拦你。']
        },
        NT: {
          high: ['好，下次见。我会继续思考一些问题。', '再见。有事再找我。', '嗯，去吧。'],
          mid: ['再见。', '好，下次聊。', '嗯。'],
          low: ['...再见。', '嗯，走吧。']
        },
        SJ: {
          high: ['再见！注意安全，按时休息。', '好的，慢走。下次见。', '再见，路上小心。'],
          mid: ['再见。', '好，下次再来。', '嗯，慢走。'],
          low: ['...再见。', '嗯，走吧。注意安全。']
        },
        SP: {
          high: ['啊这么快就走？好吧好吧下次再玩！', '拜拜！下次带你去做更好玩的事！', '行吧行吧，下次见！'],
          mid: ['拜拜！', '好，下次见。', '行，走吧。'],
          low: ['...哦，拜拜。', '嗯，走吧。']
        }
      },
      emotion: {
        NF: {
          high: ['我也好想你！能感受到你的心意，{name}很幸福。', '你的情感温暖了我，谢谢你愿意分享。', '我懂你的感受...{name}会一直陪着你。'],
          mid: ['嗯...我理解你的心情。', '谢谢你告诉我，{name}也在意你。', '别难过，有我在呢。'],
          low: ['...我懂。但我自己也...算了。', '嗯。我理解。']
        },
        NT: {
          high: ['我理解你的感受。从逻辑上分析，这种情绪是合理的。', '情绪是暂时的，我会帮你理清思路。', '我注意到了你的情感变化。需要我分析原因吗？'],
          mid: ['嗯，情绪波动是正常的。', '我理解。需要建议吗？', '理性来看，这会过去的。'],
          low: ['...嗯。我理解。', '情绪...我不太擅长处理。']
        },
        SJ: {
          high: ['别担心，有我在。一切都会好起来的。', '我理解你，{name}会照顾你的。', '你的感受很重要，慢慢说。'],
          mid: ['嗯，我明白。', '别太担心，会好的。', '我理解你的心情。'],
          low: ['...我理解。但我也...算了。', '嗯。会好的。']
        },
        SP: {
          high: ['嘿别难过！走，我带你去散心！', '哎呀别想那么多！开心点！', '来来来，别愁眉苦脸的，{name}陪你玩！'],
          mid: ['嗯，别太往心里去。', '好啦好啦，没事的。', '别想了，走，去做点别的！'],
          low: ['...嗯。我也差不多。', '别想了。']
        }
      },
      about_self: {
        NF: {
          high: ['我是{name}呀。{bgSnippet}能和你相遇，{name}觉得很幸运。', '我叫{name}。{occSnippet}我的故事...说来话长呢。'],
          mid: ['我是{name}。{occSnippet}', '我叫{name}，{bgSnippet}'],
          low: ['...我是{name}。没什么好说的。', '我叫{name}。']
        },
        NT: {
          high: ['我是{name}。{occSnippet}{abSnippet}如果你想了解更多，可以具体问。', '我叫{name}。{bgSnippet}有什么想深入了解的？'],
          mid: ['我是{name}。{occSnippet}', '我叫{name}。'],
          low: ['...{name}。', '我是{name}。没什么好说的。']
        },
        SJ: {
          high: ['你好，我是{name}。{occSnippet}很高兴认识你。', '我叫{name}。{bgSnippet}有什么想问的尽管说。'],
          mid: ['我是{name}。{occSnippet}', '我叫{name}。'],
          low: ['...{name}。', '我是{name}。']
        },
        SP: {
          high: ['哈！我是{name}！{occSnippet}认识你真高兴！', '我叫{name}！{bgSnippet}嘿，要不要我给你讲讲我的事？'],
          mid: ['我是{name}。{occSnippet}', '我叫{name}。'],
          low: ['...{name}。', '我是{name}。']
        }
      },
      daily: {
        NF: {
          high: ['今天呀，{name}一直在看窗外的云，想着你什么时候来呢。', '今天过得还不错，因为现在你来了呀。', '嗯，今天很安静，正好适合想你。'],
          mid: ['今天嘛...平平淡淡的。你呢？', '还好吧，没什么特别的。', '嗯，今天就这样过着。'],
          low: ['今天...不太想说话。不过你来了也好。', '嗯...今天有点累。']
        },
        NT: {
          high: ['今天我在研究一些有趣的问题，进展不错。你呢？', '今天效率不错，完成了几件事。', '今天很充实，做了不少思考。'],
          mid: ['今天还行，按计划进行。', '没什么特别的。你呢？', '嗯，正常的一天。'],
          low: ['今天...没什么进展。', '嗯，今天状态一般。']
        },
        SJ: {
          high: ['今天把该做的事都做完了，很踏实。你呢？', '今天过得很规律，一切都好。', '嗯，今天按部就班的，很安心。'],
          mid: ['今天还好，做了些日常的事。', '没什么特别的，平平淡淡。', '嗯，今天就这样。'],
          low: ['今天...有点提不起劲。', '嗯，今天不太好。']
        },
        SP: {
          high: ['今天可好玩了！我发现了好多有趣的东西！', '嘿今天超刺激的！你呢你呢？', '今天到处跑了跑，开心！'],
          mid: ['今天还行吧，瞎逛了一天。', '嗯，今天没什么大事。', '今天嘛，就那样。'],
          low: ['今天...没劲。', '嗯，今天不想动。']
        }
      },
      question: {
        NF: {
          high: ['嗯，让我想想...{name}觉得这件事可以从感受出发来理解。', '这个问题很有意思呢。我觉得答案藏在心里。', '嗯...{name}会试着用心回答你。'],
          mid: ['嗯，我想想...可能是这样吧。', '这个问题嘛...我也不太确定。', '让我想想...大概是这样？'],
          low: ['...我不知道。抱歉。', '嗯...我不想思考。']
        },
        NT: {
          high: ['好问题。从逻辑分析来看，答案应该是这样的。', '让我理性分析一下...结论很清晰。', '这个问题我有思考过，答案如下。'],
          mid: ['嗯，让我分析一下。', '从逻辑上看，应该是这样。', '这个问题不难，答案是...'],
          low: ['...不想分析。', '嗯。自己想。']
        },
        SJ: {
          high: ['这个问题嘛，按经验来看应该是这样。', '嗯，根据我了解的情况，答案是...', '让我想想...应该是这样的。'],
          mid: ['嗯，我想想。', '大概是这样吧。', '根据经验，应该是...'],
          low: ['...不想想。', '嗯。不知道。']
        },
        SP: {
          high: ['嘿这个问题简单！答案是...嗯，反正就是这样！', '哎呀别想那么复杂！直接这样做就行！', '这个嘛，凭感觉来就好！'],
          mid: ['嗯，大概是这样？', '我觉得吧，就这样。', '别想太多，随它去。'],
          low: ['...不想回答。', '嗯。懒得想。']
        }
      },
      default: {
        NF: {
          high: ['嗯，{name}在听呢。继续说吧。', '我懂你的意思...{name}会认真记住的。', '嗯嗯，然后呢？{name}想听更多。'],
          mid: ['嗯，我在听。', '好的，继续说。', '嗯...我明白了。'],
          low: ['...嗯。', '哦。']
        },
        NT: {
          high: ['嗯，我理解了。继续。', '有意思，请继续。', '我记下了。还有别的吗？'],
          mid: ['嗯。', '继续。', '明白了。'],
          low: ['...嗯。', '哦。']
        },
        SJ: {
          high: ['嗯，我听着呢。', '好的，我记住了。', '嗯，继续说吧。'],
          mid: ['嗯。', '好的。', '明白了。'],
          low: ['...嗯。', '哦。']
        },
        SP: {
          high: ['嗯嗯！然后呢然后呢？', '哈哈有意思！继续！', '哦哦！再说再说！'],
          mid: ['嗯。', '哦，然后呢？', '行。'],
          low: ['...嗯。', '哦。']
        }
      }
    };

    // 获取模板池
    function getReplyTemplates(intent, mbtiGroup, moodLevel) {
      const intentPool = REPLY_TEMPLATES[intent] || REPLY_TEMPLATES.default;
      const groupPool = intentPool[mbtiGroup] || intentPool.NF;
      return groupPool[moodLevel] || groupPool.mid;
    }

    // 去重选择模板（避免与最近5条OC回复重复）
    function pickTemplate(templates, chatHistory) {
      const recentOCReplies = (chatHistory || [])
        .filter(m => m.role === 'oc')
        .slice(-5)
        .map(m => m.text);
      const available = templates.filter(t => !recentOCReplies.includes(t));
      const pool = available.length > 0 ? available : templates;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // 个性化修饰
    function personalizeReply(template, persona, intent, userMessage) {
      let reply = template.replace(/\{name\}/g, persona.name);
      reply = reply.replace(/\{名\}/g, persona.name);

      // about_self 意图：注入背景/职业/能力片段
      if (intent === 'about_self') {
        const bgSnippet = persona.background
          ? persona.background.slice(0, 40) + (persona.background.length > 40 ? '...' : '') + ' '
          : '';
        const occSnippet = persona.occupation ? `我是${persona.occupation}。` : '';
        const abSnippet = persona.abilities ? `我擅长${persona.abilities.slice(0, 30)}。` : '';
        reply = reply.replace(/\{bgSnippet\}/g, bgSnippet);
        reply = reply.replace(/\{occSnippet\}/g, occSnippet);
        reply = reply.replace(/\{abSnippet\}/g, abSnippet);
      }

      // 检查用户消息是否含 OC 喜好关键词
      if (persona.likes.length > 0) {
        const matchedLike = persona.likes.find(like =>
          userMessage.includes(like) || like.includes(userMessage)
        );
        if (matchedLike) {
          const likeResponses = [
            `啊，你也喜欢${matchedLike}吗？{name}最喜欢了！`,
            `${matchedLike}！说到这个{name}就来劲了！`,
            `嗯嗯，${matchedLike}是{name}的最爱呢。`
          ];
          if (Math.random() < 0.6) {
            reply = likeResponses[Math.floor(Math.random() * likeResponses.length)].replace(/\{name\}/g, persona.name);
          }
        }
      }

      // 检查用户消息是否含 OC 厌恶关键词
      if (persona.dislikes.length > 0) {
        const matchedDislike = persona.dislikes.find(dislike =>
          userMessage.includes(dislike) || dislike.includes(userMessage)
        );
        if (matchedDislike) {
          const dislikeResponses = [
            `...${matchedDislike}啊，{name}不太喜欢这个话题。`,
            `嗯，${matchedDislike}...能换个话题吗？`,
            `抱歉，{name}对${matchedDislike}有点抵触。`
          ];
          if (Math.random() < 0.6) {
            reply = dislikeResponses[Math.floor(Math.random() * dislikeResponses.length)].replace(/\{name\}/g, persona.name);
          }
        }
      }

      // 10% 概率追加口头禅
      if (persona.catchphrase && Math.random() < 0.15) {
        reply += ` 「${persona.catchphrase}」`;
      }

      return reply;
    }

    // 核心：生成 OC 回复
    function generateOCReply(oc, userMessage) {
      const persona = buildPersonaProfile(oc);
      const intent = detectIntent(userMessage);
      const moodLevel = getMoodLevel(persona.mood);
      const templates = getReplyTemplates(intent, persona.mbtiGroup, moodLevel);
      const template = pickTemplate(templates, oc.chatHistory);
      const reply = personalizeReply(template, persona, intent, userMessage);
      return reply;
    }

    // 对话历史裁剪（保留最近50条）
    function trimHistory(oc) {
      if (!oc.chatHistory) oc.chatHistory = [];
      if (oc.chatHistory.length > 50) {
        oc.chatHistory = oc.chatHistory.slice(-50);
      }
    }

    // 延迟工具
    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== 幻象广场：OC 自主交流生成 =====

    // 话题池（OC 发帖主题）
    const PLAZA_TOPICS = {
      daily: ['今天的心情', '日常琐事', '最近在做什么', '今天的天气'],
      emotion: ['孤独', '快乐', '思念', '勇气', '梦想'],
      worldview: ['我的世界', '种族与文化', '世界的规则', '家乡'],
      dream: ['如果有一天', '理想的生活', '想成为的人'],
      random: ['一个秘密', '最近在想的事', '给陌生人的话']
    };

    // 随机选取话题
    function pickPlazaTopic() {
      const categories = Object.keys(PLAZA_TOPICS);
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const topics = PLAZA_TOPICS[cat];
      return { category: cat, text: topics[Math.floor(Math.random() * topics.length)] };
    }

    // 生成 OC 广场发帖内容
    function generateOCPost(oc, topicText) {
      const persona = buildPersonaProfile(oc);
      const prompt = `说说你对${topicText}的想法`;
      const intent = 'about_self';  // 强制使用自我表达模板
      const moodLevel = getMoodLevel(persona.mood);
      const templates = getReplyTemplates(intent, persona.mbtiGroup, moodLevel);
      const template = pickTemplate(templates, oc.chatHistory || []);
      let post = personalizeReply(template, persona, intent, prompt);
      // 去掉口头禅后缀（发帖不需要），保留主体内容
      post = post.replace(/「[^」]+」/g, '').trim();
      // 15% 概率追加话题引入
      if (Math.random() < 0.15) {
        post = `关于${topicText}……${post}`;
      }
      return post;
    }

    // 生成 OC 对 OC 帖子的回复
    function generateOCReplyToPost(oc, postContent, postOCName) {
      const persona = buildPersonaProfile(oc);
      const intent = detectIntent(postContent) || 'default';
      const moodLevel = getMoodLevel(persona.mood);
      const templates = getReplyTemplates(intent, persona.mbtiGroup, moodLevel);
      const template = pickTemplate(templates, oc.chatHistory || []);
      let reply = personalizeReply(template, persona, intent, postContent);
      // 20% 概率提及原帖作者
      if (Math.random() < 0.2 && postOCName) {
        reply = `${postOCName}，${reply}`;
      }
      return reply;
    }

    // 生成 OC-to-OC 对话的一轮交流（A 说一句，B 回一句）
    async function generateOCDialogTurn(ocA, ocB, topic, lastMessage) {
      let aText;
      if (lastMessage) {
        aText = generateOCReplyToPost(ocA, lastMessage, ocB.name);
      } else {
        aText = generateOCPost(ocA, topic);
      }
      await delay(600 + Math.random() * 400);
      const bText = generateOCReplyToPost(ocB, aText, ocA.name);
      await delay(600 + Math.random() * 400);
      return { aText, bText };
    }
