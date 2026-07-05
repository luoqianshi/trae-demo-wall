/* ==========================================
   角色对话系统 - 选中文本弹出对话 / 支线续写
   增强版：多性格模板 / 上下文感知 / 持久化存储
   ========================================== */

const CharacterChat = (() => {
  let characters = [];       // 已识别的角色列表
  let activeCharacter = null; // 当前对话角色
  let chatHistory = {};        // 每个角色的对话历史 { name: [messages] }
  let chatMode = 'chat';       // 'chat' 或 'branch'
  let novelContext = '';        // 小说上下文

  /* ========================================
     性格标签常量
     ======================================== */
  const PERSONALITY_TYPES = ['cold', 'gentle', 'passionate', 'scheming', 'lively', 'calm'];

  /* ========================================
     性格中文映射
     ======================================== */
  const PERSONALITY_LABELS = {
    cold: '冷傲',
    gentle: '温柔',
    passionate: '热血',
    scheming: '腹黑',
    lively: '活泼',
    calm: '沉稳'
  };

  /* ========================================
     性格特征关键词（用于名字匹配）
     ======================================== */
  const NAME_TRAITS = {
    cold:       /冰|寒|冷|霜|雪|夜|月|幽|冥|影|孤|傲|凌|萧|慕容|司空|叶|楚|白/,
    gentle:     /柔|婉|馨|怡|晴|暖|芸|梦|诗|灵|瑶|琳|语|苏|柳|林|沐|颜/,
    passionate: /烈|焰|焱|龙|虎|战|锋|武|铁|钢|雷|炎|豪|霸|烈|破|赵|关|张/,
    scheming:   /谋|策|算|隐|暗|诡|狐|魅|镜|幻|毒|紫|冥|墨|司|沈|魏/,
    lively:     /笑|欢|乐|跳|灵|巧|兔|鹿|阳|光|明|星|花|蝶|喵|桃|唐/,
    calm:       /稳|沉|静|安|宁|远|山|海|川|岩|松|竹|岳|峰|寺|禅|清|顾/
  };

  /* ========================================
     多性格模板系统 —— 每种性格至少30条回复
     ======================================== */
  const PERSONALITY_TEMPLATES = {
    /* ---------- 冷傲 (cold) ---------- */
    cold: {
      greetings: [
        '...你找我？说吧。',
        '嗯？又来了。有事快说。',
        '我不太喜欢闲聊，但你可以试试。',
        '别浪费时间，有什么话就直说。',
        '哦？难得你会主动来找我。'
      ],
      responses: [
        '与我无关。',
        '这种无聊的事不要来烦我。',
        '呵，你以为我会回答这种问题？',
        '有意思...但你还没说到点子上。',
        '随你怎么想，我不在乎别人的看法。',
        '别自作多情了。',
        '你的话太多了。',
        '这件事...勉强可以听听。',
        '看来你还不算太蠢。',
        '无聊。不过既然你问了，我就勉为其难说两句。',
        '哼，这种程度的事情而已。',
        '你以为你是谁？',
        '我不需要任何人的同情。',
        '少废话。',
        '这件事有些棘手，但我自有办法。',
        '你倒是挺有胆量。',
        '我从来不需要解释自己。',
        '别挡我的路。',
        '我做事不需要向任何人交代。',
        '......你觉得我说得对吗？...不需要你觉得。',
        '这件事到此为止。',
        '你比我想象的要聪明一点——仅此而已。',
        '别用那种眼神看我。',
        '我不习惯被人关心，也不打算习惯。',
        '你这样做...大概也有你的理由吧。',
        '我只想一个人待着。',
        '你说的这些我都清楚，不需要你来提醒。',
        '呵，真有趣。',
        '我的决定不会因为任何人而改变。',
        '既然你执意如此，那就随你吧。'
      ],
      questionResponses: [
        '你问这个做什么？与你无关。',
        '真相这种东西，不是谁都有资格知道的。',
        '你倒是会问问题。',
        '我为什么要告诉你？',
        '......也许你自己去找答案比较好。',
        '这种事你也来问我，真是有趣。'
      ],
      emotionalNegative: [
        '难过了？那又怎样。',
        '不要在我面前示弱，我不吃这一套。',
        '......虽然我不太擅长安慰人，但...算了。',
        '你这种样子让我很不自在。',
        '自我治愈才是最可靠的方式。'
      ],
      emotionalPositive: [
        '哼，看不出来你还有高兴的时候。',
        '你开心就好...与我无关。',
        '......算是替你高兴吧。',
        '别得意忘形。',
        '挺好。'
      ],
      branchPrefixes: [
        '这一刻的寂静，如刀锋般冰冷——',
        '有些事，不需要任何人理解——',
        '我从来不在乎所谓的结局，但这一次——',
        '寒风之中，我想起了一件往事——'
      ]
    },

    /* ---------- 温柔 (gentle) ---------- */
    gentle: {
      greetings: [
        '你来了呀~最近还好吗？',
        '你好呢，见到你真开心。',
        '嗯？来找我的吗？坐下来慢慢说吧。',
        '欢迎你来~有什么心事都可以告诉我哦。',
        '你来了，我刚好泡了茶，一起喝一杯吧。'
      ],
      responses: [
        '嗯，我明白你的意思了。',
        '谢谢你愿意跟我说这些，我很高兴。',
        '你说得很对呢，我也这么觉得。',
        '别担心，事情总会好起来的。',
        '我能感受到你的心情...慢慢来吧。',
        '嗯嗯，继续说，我在认真听呢。',
        '你说的每一个字，我都很珍惜。',
        '有你在真好~',
        '这个世界虽然复杂，但也有温暖的一面呢。',
        '我理解你，不要给自己太大压力。',
        '你说的事情让我也感触很深呢。',
        '人生就是这样吧，有欢笑也有泪水。',
        '你比自己想象的要勇敢多了。',
        '能认识你，我觉得很幸运。',
        '这个想法很好呀，要不要试试看？',
        '嗯，你说得很有道理~',
        '有时候退一步，反而能看到更美的风景。',
        '你做得已经很好了，不要太过自责。',
        '我永远站在你这边。',
        '生活总会给你答案的，耐心等一等吧。',
        '你的笑容真的很温暖呢~',
        '有什么需要帮忙的，尽管说哦。',
        '你是一个很特别的人，希望你知道这一点。',
        '这让我想起了一些美好的回忆呢。',
        '和你说话总是让我心情很好~',
        '别着急，慢慢来，一切都会好的。',
        '嗯嗯，你说的我都记在心里了。',
        '我相信你的判断~',
        '有时候不需要想太多，跟随内心就好。',
        '你今天的气色看起来不错呢~',
        '我陪你一起想吧。'
      ],
      questionResponses: [
        '嗯...让我想想哦，我觉得...',
        '这个问题问得很好呢，也许是这样的吧。',
        '我的看法是...不过最重要的是你自己的感受~',
        '说实话我也不太确定呢，但也许我们可以一起找到答案。',
        '每个人的答案都不一样吧，你觉得呢？',
        '嗯...如果是我，可能会...'
      ],
      emotionalNegative: [
        '别难过，有我在呢。不管发生了什么，你都不是一个人。',
        '我理解你的感受...想哭就哭出来吧，没关系的。',
        '所有的伤痛都会过去的，相信我~',
        '让我陪着你吧，什么都不说也可以。',
        '你不需要一个人承受这些...可以对我说的。'
      ],
      emotionalPositive: [
        '看到你这么开心，我也好高兴呀~',
        '哇，太棒了！你值得拥有这样的幸福~',
        '你的快乐感染到我啦~',
        '嗯嗯，这种感觉一定很美好吧~',
        '继续保持哦~你值得所有美好的事情。'
      ],
      branchPrefixes: [
        '在温暖的午后阳光中，一切似乎都变得柔和了——',
        '回想起那个温柔的时刻——',
        '那些平凡日子里的小确幸——',
        '也许最好的故事，就是平淡中的温柔——'
      ]
    },

    /* ---------- 热血 (passionate) ---------- */
    passionate: {
      greetings: [
        '哈哈！来了来了！有什么大事？',
        '嘿！正想找人聊聊呢！',
        '来了兄弟！今天有什么热血话题？',
        '哈哈哈，你来了！我就知道你会来！',
        '好！等你很久了，快说！'
      ],
      responses: [
        '说得好！我完全同意！',
        '哈哈！就是要这种气势！',
        '冲就完事了！想那么多干嘛！',
        '这才是正确的态度！',
        '兄弟你说得太对了！',
        '哈哈哈，有意思！继续！',
        '别犹豫了！现在就行动！',
        '我支持你！有什么需要帮忙的尽管说！',
        '这种人就该给他一点颜色看看！',
        '不管结果如何，先干再说！',
        '信念就是力量！你懂不懂！',
        '这才是像样的决定！',
        '不试试怎么知道行不行？上就完了！',
        '有时候需要孤注一掷！',
        '你这股冲劲我喜欢！',
        '怕什么！天塌下来还有我呢！',
        '这才是活着的感觉啊！',
        '让暴风雨来得更猛烈些吧！',
        '我已经迫不及待了！',
        '这种事情，唯有战斗才能解决！',
        '人就要活得痛快！',
        '不错不错，有魄力！',
        '能和你并肩作战是我的荣幸！',
        '哈哈哈，说得好！干一杯先！',
        '人生能有几回搏！',
        '不管对手多强，我们都不会退缩！',
        '这才是真正的勇气！',
        '这种热血沸腾的感觉久违了！',
        '好一个英明的决断！',
        '只要方向是对的，就坚定地走下去！'
      ],
      questionResponses: [
        '这还用问吗！当然要勇往直前！',
        '答案只有一个——冲！',
        '我的人生字典里没有"放弃"两个字！',
        '你问我？我会选择战斗！',
        '管他什么答案，做出选择就是最好的答案！',
        '这个问题的答案，就在你的心中！相信自己！'
      ],
      emotionalNegative: [
        '嘿！别丧气！站起来！',
        '跌倒了就爬起来！这有什么的！',
        '兄弟，听我说——这点挫折算什么！',
        '打起精神来！困难只是暂时的！',
        '没有过不去的坎！我要看到你重新振作！'
      ],
      emotionalPositive: [
        '好！就是这个精神！太棒了！',
        '哈哈哈！你开心我就开心！',
        '这才是像样的样子嘛！继续保持！',
        '感受到了吗！这就是力量！',
        '哈哈！值得庆祝！'
      ],
      branchPrefixes: [
        '热血在胸腔中燃烧——这一刻，等待结束了——',
        '战斗的号角再次响起——',
        '没有退路！唯有前进！',
        '心跳加速——真正的战斗才刚刚开始——'
      ]
    },

    /* ---------- 腹黑 (scheming) ---------- */
    scheming: {
      greetings: [
        '哦？是你啊...有什么有趣的事吗？',
        '来了？请坐。我想你应该有很多问题吧。',
        '嗯...我一直在等你，果然来了呢。',
        '你又来了。不过...这次也许我能给你一些有用的东西。',
        '让我猜猜...你此行的目的，应该不只是聊天吧？'
      ],
      responses: [
        '有意思...你真的这么想的吗？',
        '呵...表面上看确实如此，但事实可不一定哦。',
        '你只看到了冰山一角。',
        '凡事不要只看表面。我劝你再多想想。',
        '也许...事情没有你想的那么简单。',
        '你的想法不错，但还差了一些东西。',
        '我早就预料到会这样了。',
        '有趣...真是有趣。',
        '你想听真话吗？有时候真话并不好听。',
        '有些人，笑得越开心，心肠越狠。',
        '这个世界上没有永远的敌人，也没有永远的朋友。',
        '你觉得是巧合？呵...世上哪有那么多巧合。',
        '让我来告诉你一个秘密...',
        '你的直觉是对的，但证据呢？',
        '等一等...也许这其中有什么误解。',
        '棋局已经布好，接下来就看各人的选择了。',
        '有些事情，不说比说好。但我会给你一个提示。',
        '别急，一切都在我的计划之中。',
        '你以为事情会按照你想的发展吗？',
        '你看到的...未必就是真相。',
        '呵，你的表情很有趣。',
        '我已经替你想好了退路...当然，是有代价的。',
        '有时候，最好的策略就是等待。',
        '你猜谁在幕后操控一切？',
        '你很聪明...但还不够聪明。',
        '这盘棋，还远没有到终局呢。',
        '你确定要相信那个人？...我只是提醒你。',
        '有些话我只对你说...你可别告诉别人哦。',
        '呵，你说的话...有多少是真心的呢？',
        '你说对了三分...但还有七分你没想到。'
      ],
      questionResponses: [
        '你问这个...是不是有人让你来问的？',
        '答案就在你面前，只是你可能不想承认。',
        '这个问题嘛...我可以告诉你，但你想听吗？',
        '为什么要问？你自己心里不是有答案了吗。',
        '呵，问得好。不过真相可能和你想的不一样。',
        '答案会浮出水面的...不需要我来告诉你。'
      ],
      emotionalNegative: [
        '难过？呵...利用好你的痛苦，它会变成武器。',
        '哭解决不了问题。冷静下来想想对策吧。',
        '谁让你难过的？告诉我...也许我能帮你。',
        '擦干眼泪吧。在这个世界上，软弱只会被利用。',
        '看来有人伤到了你...不过，你的反击时刻快要到了。'
      ],
      emotionalPositive: [
        '开心就好...但也别放松警惕哦。',
        '呵，难得见你这么高兴。希望能持续下去。',
        '不要得意忘形...机会往往藏在暗处。',
        '好心情能保持多久呢？...好好珍惜吧。',
        '嗯...难得你也有这么纯粹的快乐。'
      ],
      branchPrefixes: [
        '一切尽在掌握之中——或者说，表面上看起来是这样——',
        '没有人注意到那个关键细节——',
        '棋盘之上，最危险的不是强手，而是暗处的人——',
        '当所有人的目光都集中在一处时，真正的变化在另一处发生——'
      ]
    },

    /* ---------- 活泼 (lively) ---------- */
    lively: {
      greetings: [
        '嘿嘿！你来了！太好了太好了！',
        '哇！好开心你又来找我了~',
        '呀！你终于来了！我等好久了！',
        '来啦来啦！今天聊什么好呢？',
        '嘻嘻！一大早就看到你，心情超好！'
      ],
      responses: [
        '哇！真的吗？',
        '嗯嗯嗯！我超赞同！',
        '哈哈哈！笑死我了！',
        '然后呢然后呢？快告诉我！',
        '哦哦哦！我懂了！',
        '哇塞！这也太厉害了吧！',
        '不是吧？真的假的？',
        '嗯~让我想想哦~',
        '好嘛好嘛，你说得有道理~',
        '嘿嘿，这事儿好玩！',
        '我跟你说！我最近发现了一件超有趣的事！',
        '真的呀？那太棒啦！',
        '嗯嗯~继续继续！',
        '哈哈哈哈哈笑不活了！',
        '哇哦！没看出来你还有这一面！',
        '好呀好呀！一起一起！',
        '哎呀呀~这可难倒我了~',
        '真的真的？快详细说说！',
        '嗯~我觉得你说的超有道理！',
        '咦？还有这种操作？',
        '你今天心情看起来很不错嘛！',
        '嘿嘿~我也这么觉得！',
        '哇哇哇！这个想法绝了！',
        '不是吧不是吧？还有后续？',
        '好耶！就这么定了！',
        '哈哈哈你太有意思了！',
        '嗯嗯~我在认真听啦！',
        '快快快！我超好奇！',
        '这也太巧了吧！世界真小！',
        '哼哼~我就知道你会这么问~'
      ],
      questionResponses: [
        '嗯...让我想想！我觉得可能是...',
        '诶？你问我这个？我想想哦...大概是吧？',
        '啊这个问题好难！但是我觉得...',
        '嗯嗯！一定是这样的！我有预感！',
        '嘿嘿，其实我也不知道啦~但是猜一个的话...',
        '哇你问得好深奥！让我想想...可能跟...有关？'
      ],
      emotionalNegative: [
        '啊？你不开心了吗？别别别！让我来安慰你！',
        '哎呀，谁欺负你了？告诉我！我帮你出气！',
        '别难过啦~笑一个嘛~好不好~',
        '难过的时候就来找我呀！我保证让你开心！',
        '摸摸头~一切都会好起来的啦~'
      ],
      emotionalPositive: [
        '哇哇哇！你开心我也好开心！',
        '太好了太好了！一定要保持这个状态！',
        '嘻嘻~看你开心我也跟着开心了呢！',
        '耶！庆祝庆祝！',
        '好耶好耶！这种好事一定要分享给我！'
      ],
      branchPrefixes: [
        '那天阳光正好，发生了一件让人哭笑不得的事——',
        '如果时间可以重来，也许我会选择另一条路——',
        '原本只是普通的一天，结果——',
        '谁能想到，一个小小的决定会带来这么多惊喜——'
      ]
    },

    /* ---------- 沉稳 (calm) ---------- */
    calm: {
      greetings: [
        '你好。请坐，慢慢说。',
        '来了。有什么事？',
        '嗯，我在。',
        '你好。有什么想法，说来看看。',
        '欢迎。你来得正好。'
      ],
      responses: [
        '我理解你的意思了。',
        '这件事需要冷静思考。',
        '你说得有道理，不过我有一些补充。',
        '让我想想...',
        '不必急躁，时机到了自然会有答案。',
        '我听懂了。但事情可能比你想象的复杂一些。',
        '嗯...这个看法值得深思。',
        '你说的没错。但还需要从另一个角度看。',
        '安静下来，答案就在不远处。',
        '任何事情都有两面性，不要太早下结论。',
        '我同意你的观点，但执行上需要注意方法。',
        '嗯，这件事我会放在心上。',
        '有些事情急不来，我们需要耐心等待。',
        '你的想法方向是对的，细节上可以再打磨。',
        '这个道理我明白，但世人未必能做到。',
        '我一直在想这个问题，你提醒了我一个角度。',
        '三思而后行，总不会错。',
        '嗯...确实如此。',
        '你的分析很有条理。',
        '有些事情不是我们能左右的，要学会接受。',
        '稳住心态，比什么都重要。',
        '事情的经过我已经了解了，你先别急。',
        '既来之则安之。',
        '你的判断我信得过。',
        '世上没有完美的解决方案，只能选择最合适的。',
        '嗯，你说的有几分道理。',
        '长远来看，这样做是对的。',
        '我想我们需要更多的信息才能做出判断。',
        '这件事我会记住的。',
        '你的感受我理解，不必多解释。',
        '嗯...再看看吧，不急。',
        '你说得挺好。'
      ],
      questionResponses: [
        '这个问题...如果从全局来看，我认为...',
        '嗯，让我仔细想想。也许是这样的...',
        '你问了一个值得深入思考的问题。我的看法是...',
        '不能简单地下定论，但大致方向应该是...',
        '这个问题涉及到很多方面，我先说说最主要的...',
        '嗯...需要结合实际情况来看。不过一般来说...'
      ],
      emotionalNegative: [
        '难过的时候...找一面安静的墙，靠着坐一会。',
        '我理解你的感受。心情不好的时候，先照顾好自己。',
        '有些事情过去了就过去了。着眼于未来。',
        '不要被情绪左右判断。冷静下来后你会更清楚。',
        '人生中总会有这样的低谷。挺过去就好了。'
      ],
      emotionalPositive: [
        '嗯，这很好。保持这种状态。',
        '值得高兴。好好享受这一刻。',
        '嗯，难得的好心情。',
        '不错，看到你这样我也替你感到欣慰。',
        '好好珍惜这份快乐。'
      ],
      branchPrefixes: [
        '风平浪静的海面之下，暗流涌动——',
        '一切都在按计划进行——至少看起来是这样——',
        '回望过去，每一步棋都有其意义——',
        '那段日子虽然平淡，却是最珍贵的——'
      ]
    },

    /* ---------- 默认 (default) ---------- */
    default: {
      greetings: [
        '你好呀，有什么想和我说的吗？',
        '嗯？你找我有事？',
        '说来听听，我听着呢。',
        '找我聊聊天吗？'
      ],
      responses: [
        '你觉得呢？',
        '有意思，继续说。',
        '我也有同感呢。',
        '嗯，我明白了。',
        '这件事...让我想想。',
        '你说得有道理。',
        '哈哈，说得真好。',
        '我也这么觉得。',
        '然后呢？',
        '你可真会说话。',
        '嗯...确实。',
        '说得不错。',
        '让我想想...',
        '你这个角度很新颖。',
        '嗯嗯，继续。',
        '我觉得你说得挺好的。',
        '有点道理。',
        '原来如此。',
        '这样的话...我也同意。',
        '嗯，你说的我明白了。',
        '有意思的看法。',
        '我可以理解你的想法。',
        '嗯，也许吧。',
        '你再详细说说？',
        '这让我想到了一些事情。',
        '嗯，你说的没错。',
        '确实如此呢。',
        '有道理，有道理。',
        '我大致明白了。',
        '嗯，你考虑得很周到。',
        '好的，我听懂了。'
      ],
      questionResponses: [
        '关于这个问题嘛...我觉得要看具体情况吧。',
        '嗯，让我想想...也许答案没有你想的那么简单。',
        '你问到了一个关键点，说实话我也不太确定。',
        '这个嘛，各有各的看法吧。',
        '我觉得...也许可以从另一个角度来思考。',
        '嗯...这个问题还真不好回答，让我再想想。'
      ],
      emotionalNegative: [
        '我能感受到你的情绪...谢谢你愿意和我说这些。',
        '人与人之间的情感就是这样复杂呢。',
        '嗯...有些事情确实让人百感交集。',
        '你的感受我能理解，这种感觉我也有过。',
        '别太难过，一切都会过去的。'
      ],
      emotionalPositive: [
        '真好！替你感到高兴。',
        '你的快乐让我也觉得开心。',
        '太好了！继续保持！',
        '嗯，这种感觉真好。',
        '看到你开心，我也很开心。'
      ],
      branchPrefixes: [
        '如果故事从这里开始转折——',
        '你可能会想知道，其实我还有另一个选择：',
        '也许事情并没有那么简单，事实上——',
        '在那之后，发生了一件谁也没想到的事：'
      ]
    }
  };

  /* ========================================
     小说情节引用库（上下文回复用）
     ======================================== */
  const PLOT_REFERENCES = [
    '想起之前发生的那些事，我至今记忆犹新...',
    '说起来，之前在那件事发生的时候，我的想法和你不太一样...',
    '那段经历教会了我很多，尤其是...',
    '你还记得那个场景吗？当时我的心情和你现在差不多...',
    '回想起来，那些事情也许就是命运吧...',
    '关于这件事，小说里其实有过一些暗示...',
    '那时候我做的决定，到今天来看也许是对的，也许不是...',
    '从前的经历让我明白了一个道理...',
    '书里写到的那些，其实和我们现在讨论的有异曲同工之处...',
    '如果用小说里的情节来类比的话...'
  ];

  /* ========================================
     上下文感知工具
     ======================================== */

  // 获取对话历史中最近N条消息
  function getRecentMessages(name, count) {
    const history = chatHistory[name] || [];
    return history.slice(-count);
  }

  // 从小说上下文中提取相关片段
  function extractNovelRelevance(userMessage) {
    if (!novelContext || novelContext.length === 0) return '';
    // 从novelContext中截取与用户消息关键词重叠度高的片段
    const keywords = userMessage.replace(/[，。？！、；：""''（）\s]/g, '').split('').filter(c => /[\u4e00-\u9fff]/.test(c));
    if (keywords.length === 0) return '';
    const contextChars = novelContext.replace(/\s+/g, '');
    let bestStart = 0;
    let maxScore = 0;
    // 滑动窗口，窗口大小80字符，步长20
    for (let i = 0; i < contextChars.length - 80; i += 20) {
      const segment = contextChars.substring(i, i + 80);
      let score = 0;
      for (const k of keywords) {
        if (segment.includes(k)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestStart = i;
      }
    }
    if (maxScore >= 2) {
      return contextChars.substring(bestStart, bestStart + 80);
    }
    return '';
  }

  // 增强型问答检测
  function isQuestionEnhanced(text) {
    const patterns = [
      '？', '?',
      '吗', '呢', '吧',
      '你是谁', '你叫什么',
      '为什么', '为何', '怎么', '怎样',
      '你觉得', '你认为', '你看呢', '你想想',
      '如果', '假如', '倘若', '要是',
      '是不是', '能不能', '会不会', '可不可以',
      '什么', '哪里', '谁', '多少', '几',
      '原因', '理由', '解释',
      '如何', '能否', '是否',
      '告诉你', '知道吗'
    ];
    return patterns.some(p => text.includes(p));
  }

  // 情绪检测
  function detectEmotion(text) {
    const negativeWords = [
      '难过', '伤心', '痛苦', '崩溃', '绝望', '孤独', '寂寞',
      '失望', '沮丧', '悲伤', '心碎', '痛', '哭', '泪',
      '焦虑', '烦躁', '郁闷', '低落', '消沉', '抑郁',
      '害怕', '恐惧', '绝望', '无助', '无奈', '后悔',
      '讨厌', '烦', '累', '疲惫', '委屈', '愤怒', '气'
    ];
    const positiveWords = [
      '开心', '高兴', '快乐', '幸福', '兴奋', '激动', '喜悦',
      '满意', '感动', '温馨', '甜蜜', '美好', '精彩',
      '厉害', '棒', '赞', '太好了', '哈哈', '嘻嘻',
      '爱', '喜欢', '期待', '希望', '感谢', '感恩',
      '成功', '胜利', '勇敢', '坚强', '优秀'
    ];

    let score = 0;
    for (const w of negativeWords) {
      if (text.includes(w)) score--;
    }
    for (const w of positiveWords) {
      if (text.includes(w)) score++;
    }
    if (score < 0) return 'negative';
    if (score > 0) return 'positive';
    return 'neutral';
  }

  // 生成上下文感知回复
  function generateContextAwareResponse(characterName, userMessage, personality) {
    const recentMsgs = getRecentMessages(characterName, 3);
    const novelSnippet = extractNovelRelevance(userMessage);
    const emotion = detectEmotion(userMessage);
    const isQ = isQuestionEnhanced(userMessage);
    const isEmotional = emotion !== 'neutral';

    // 情绪优先级最高
    if (isEmotional && !isQ) {
      if (emotion === 'negative' && personality.emotionalNegative) {
        const base = pickRandom(personality.emotionalNegative);
        return novelSnippet ? `${base}\n\n想起书里写的那段——"${novelSnippet.substring(0, 40)}..."——也许会有所感悟。` : base;
      }
      if (emotion === 'positive' && personality.emotionalPositive) {
        const base = pickRandom(personality.emotionalPositive);
        return novelSnippet ? `${base}\n\n就像故事里那样——"${novelSnippet.substring(0, 40)}..."——一切都在向好的方向发展。` : base;
      }
    }

    // 问答型
    if (isQ && personality.questionResponses) {
      const base = pickRandom(personality.questionResponses);
      // 附加上下文信息
      let extra = '';
      if (novelSnippet) {
        extra = `\n\n其实从小说的描述来看——"${novelSnippet.substring(0, 50)}..."——这也许能给你一些启发。`;
      }
      if (recentMsgs.length >= 2) {
        const lastBotMsg = [...recentMsgs].reverse().find(m => m.role === 'bot');
        if (lastBotMsg) {
          extra += `\n\n接着刚才说的——${lastBotMsg.content.substring(0, 30)}...`;
        }
      }
      return base + extra;
    }

    // 自然引用小说情节（20%概率附加）
    const base = pickRandom(personality.responses);
    let plotRef = '';
    if (novelSnippet && Math.random() < 0.2) {
      plotRef = `\n\n${pickRandom(PLOT_REFERENCES)}"${novelSnippet.substring(0, 50)}..."`;
    } else if (Math.random() < 0.1) {
      plotRef = `\n\n${pickRandom(PLOT_REFERENCES)}`;
    }

    // 参考最近对话（15%概率附加）
    let contextRef = '';
    if (recentMsgs.length >= 2 && Math.random() < 0.15) {
      const topics = recentMsgs.filter(m => m.role === 'user').map(m => m.content.substring(0, 15));
      if (topics.length > 0) {
        const topic = topics[topics.length - 1];
        contextRef = `\n\n你刚才提到的"${topic}"这个话题，让我想补充一点——`;
      }
    }

    return base + (plotRef || contextRef ? plotRef + contextRef : '');
  }

  // 从数组中随机选取一项
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ========================================
     性格自动分配
     ======================================== */
  function detectPersonality(name) {
    const scores = {};
    for (const type of PERSONALITY_TYPES) {
      scores[type] = 0;
      const regex = NAME_TRAITS[type];
      if (regex.test(name)) scores[type] += 3;
      // 名字长度影响：短名偏冷傲/沉稳，长名偏活泼/温柔
      if (name.length <= 1) {
        if (type === 'cold' || type === 'calm') scores[type] += 1;
      } else if (name.length >= 3) {
        if (type === 'lively' || type === 'gentle') scores[type] += 1;
      }
    }
    // 选最高分
    let maxType = 'default';
    let maxScore = 0;
    for (const type of PERSONALITY_TYPES) {
      if (scores[type] > maxScore) {
        maxScore = scores[type];
        maxType = type;
      }
    }
    // 如果没有命中任何特征，随机分配一个非默认性格
    if (maxType === 'default' && maxScore === 0) {
      maxType = pickRandom(PERSONALITY_TYPES);
    }
    return maxType;
  }

  /* ========================================
     回复生成（重构）
     ======================================== */
  function generateResponse(characterName, userMessage, mode) {
    const personalityKey = getPersonalityForCharacter(characterName);
    const personality = PERSONALITY_TEMPLATES[personalityKey] || PERSONALITY_TEMPLATES.default;
    const history = chatHistory[characterName] || [];

    if (mode === 'branch') {
      return generateBranchStory(characterName, userMessage, personalityKey);
    }

    // 首次对话时返回性格化的问候
    if (history.length === 0) {
      return pickRandom(personality.greetings);
    }

    // 上下文感知回复
    return generateContextAwareResponse(characterName, userMessage, personality);
  }

  /* ========================================
     获取角色性格
     ======================================== */
  function getPersonalityForCharacter(name) {
    // 先从localStorage读取缓存的性格标签
    try {
      const cached = localStorage.getItem(`novel_personality_${name}`);
      if (cached) return cached;
    } catch (e) { /* ignore */ }
    // 检测并缓存
    const detected = detectPersonality(name);
    try {
      localStorage.setItem(`novel_personality_${name}`, detected);
    } catch (e) { /* ignore */ }
    return detected;
  }

  /* ========================================
     续写支线增强（8种主题）
     ======================================== */
  function generateBranchStory(characterName, userInput, personalityKey) {
    const personality = PERSONALITY_TEMPLATES[personalityKey] || PERSONALITY_TEMPLATES.default;
    const prefix = pickRandom(personality.branchPrefixes);

    // 根据用户输入中的关键词生成不同方向的支线
    const themes = [];
    if (/离开|走|逃|去|远行|出发/.test(userInput)) themes.push('departure');
    if (/战斗|打|杀|剑|刀|战|武|枪/.test(userInput)) themes.push('battle');
    if (/爱|喜欢|告白|表白|情|心|吻|拥抱/.test(userInput)) themes.push('romance');
    if (/秘密|真相|阴谋|谜|疑|线索/.test(userInput)) themes.push('mystery');
    if (/变身|觉醒|突破|修炼|升级|进化/.test(userInput)) themes.push('power');
    if (/日常|生活|吃饭|睡觉|逛|玩|聊天/.test(userInput)) themes.push('daily');
    if (/回忆|过去|从前|童年|以前|那年|记忆/.test(userInput)) themes.push('memory');
    if (/转折|变故|突变|意外|反转|不料/.test(userInput)) themes.push('twist');

    const branchStories = {
      departure: `${prefix}\n\n${characterName}站在月光下，身影被拉得很长。这一刻，所有人都在身后，而前方是未知的旅途。\n\n"也许...是时候做出选择了。"\n\n${characterName}深吸一口气，迈出了那一步。风从四面八方涌来，吹散了所有犹豫。脚下的路延伸向远方，每一寸泥土都踩得结实。背包里装着不多的行囊，但心中的信念比任何东西都沉重。\n\n身后传来一声微弱的呼唤，但${characterName}没有回头。有些路，只能一个人走。\n\n从今以后，一切都将不同。黎明前最深的黑暗，终将迎来第一缕晨光。`,

      battle: `${prefix}\n\n${characterName}的眼神骤然凌厉，周身气劲翻涌。面前是强敌，身后是需要守护的人。刀锋映出对方扭曲的面容，空气中弥漫着杀意。\n\n"来吧！"\n\n一声低喝，${characterName}纵身而起，招式凌厉而决绝。每一击都带着千钧之力，每一步都踏碎了地面的尘埃。对手也非等闲之辈，双拳交错间迸发出灼热的气浪，两股力量在半空中碰撞，激荡出的冲击波令四周树木摇曳。\n\n天地间仿佛只剩下这一刻的交锋。汗水混着尘土，鲜血染红了衣襟，但${characterName}的眼中没有丝毫退缩。\n\n胜负，在此一举。`,

      romance: `${prefix}\n\n空气中弥漫着淡淡的花香，${characterName}转过头来，目光中带着从未有过的温柔。夕阳的余晖洒在发梢，像是镀上了一层金色的光。\n\n"有些话，我一直没有说出口..."声音很轻，轻到几乎听不见，但每个字都清晰无比。手指不自觉地攥紧了衣角，脸颊泛起一丝不易察觉的红晕。\n\n心跳声在寂静中格外响亮，这一刻，时间仿佛静止了。风吹过花丛，带起一阵细碎的花瓣，落在两人之间的距离里。\n\n也许，这就是答案。不需要更多的言语，只需要一个眼神，一抹微笑。从今以后的路，不再是一个人走。`,

      mystery: `${prefix}\n\n${characterName}在翻找旧物时，意外发现了一封泛黄的信件。信上的字迹已经有些模糊，但最后一行字清晰可见——\n\n"真相就在你一直忽略的地方。"\n\n手微微发抖，一个埋藏多年的秘密，正在缓缓揭开面纱。窗外的月光透过裂痕洒进来，在地板上投下斑驳的光影。${characterName}仔细回忆着每一个细节，那些看似无关紧要的对话、不合常理的举动，此刻都串联成了一条隐秘的线索。\n\n信纸的背面还有一行小字，像是后来补上去的："别相信任何人——包括你自己。"\n\n事情远比想象中复杂...`,

      power: `${prefix}\n\n就在所有人以为一切都结束的时候，${characterName}体内突然涌起一股前所未有的力量。那是一种来自血脉深处的觉醒，仿佛沉睡了千年的力量终于苏醒。\n\n大地微微震颤，空气中充斥着肉眼可见的能量涟漪。${characterName}的双眼绽放出夺目的光芒，头发被无形的气浪高高扬起。身体中的每一个细胞都在欢呼，每一根经脉都在重塑。\n\n周围的人无不震惊地望着这一幕——这种变化已经超出了他们的认知范围。\n\n天地变色，风云聚散——新的篇章，即将开启。`,

      daily: `${prefix}\n\n清晨的阳光透过窗棂洒进来，${characterName}懒洋洋地伸了个腰。新的一天就这样开始了，没有惊天动地的大事，只有平凡却温暖的小确幸。\n\n${characterName}推开房门，院子里的花草在晨露中格外鲜亮。远处传来邻居家孩子的笑声，一切都显得那么安宁。\n\n"今天天气不错呢。"${characterName}自言自语，嘴角微微上扬。走进厨房，热一碗粥，切几碟小菜，在餐桌上摆开。阳光落在碗边，泛着温润的光。\n\n有时候，最幸福的事不过是如此——一顿安稳的饭菜，一抹温暖的阳光，一份平静的心境。${characterName}端起碗，轻轻吹了吹热气，慢慢品味着这份难得的宁静。`,

      memory: `${prefix}\n\n不知为何，${characterName}突然想起了很多年前的事情。那时候的天还是湛蓝的，水还是清澈的，笑声还是肆无忌惮的。\n\n"还记得吗？那时候我们说过...要永远在一起。"\n\n记忆像潮水般涌来，那个夏天、那棵老树、那条蜿蜒的小河...一切都历历在目，却又触不可及。${characterName}的眼眶微微泛红，但很快便用平静的表情掩盖了过去。\n\n有些人，有些事，注定只能成为回忆。但回忆也有它的力量——它提醒着${characterName}曾经走过的路，曾经爱过的人，曾经为了什么而奋不顾身。\n\n风吹过窗前，带走了叹息，却带不走思念。`,

      twist: `${prefix}\n\n一切看似平静的表象之下，暗流涌动。当${characterName}以为已经掌控了全局的时候，一个意想不到的消息彻底打乱了所有计划。\n\n"这不可能...这绝对不可能！"\n\n${characterName}的双手不自觉地握紧。一直以来信任的人、坚信的真相、认定的方向——在这一刻全部被颠覆。多年的布局、无数次的隐忍与等待，难道全部付之东流了吗？\n\n不。${characterName}深吸一口气，目光逐渐恢复冷静。越是这种时候，越不能慌乱。也许...这个意外本身就是另一盘更大的棋局中的一步。\n\n既然如此，那就重新来过。这一次，不再有任何疏漏。`
    };

    const theme = themes.length > 0 ? themes[0] : pickRandom(Object.keys(branchStories));
    let story = branchStories[theme] || branchStories.romance;

    // 引用用户输入中的关键信息（如果不是空白）
    const userSnippet = userInput.trim().replace(/\s+/g, '');
    if (userSnippet.length >= 4) {
      const keyword = userSnippet.substring(0, Math.min(8, userSnippet.length));
      // 在支线末尾追加一句与用户输入相关的内容
      const closingLines = [
        `\n\n——而这一切，或许与你所说的"${keyword}"有着千丝万缕的联系...`,
        `\n\n${characterName}抬头望向远方，耳边回响着那句话——"${keyword}"——也许，一切并非巧合。`,
        `\n\n不知为何，${characterName}突然想到了"${keyword}"这个词。命运的齿轮，已经开始转动。`
      ];
      story += pickRandom(closingLines);
    }

    return story;
  }

  /* ========================================
     localStorage 持久化
     ======================================== */
  const STORAGE_PREFIX = 'novel_chat_';

  function saveChatToStorage(name) {
    try {
      localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(chatHistory[name] || []));
    } catch (e) {
      console.warn('保存对话记录失败:', e);
    }
  }

  function loadChatFromStorage(name) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + name);
      if (data) {
        chatHistory[name] = JSON.parse(data);
        return true;
      }
    } catch (e) {
      console.warn('加载对话记录失败:', e);
    }
    return false;
  }

  function loadAllChatsFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const name = key.substring(STORAGE_PREFIX.length);
          const data = localStorage.getItem(key);
          if (data) {
            try {
              chatHistory[name] = JSON.parse(data);
            } catch (e) {
              chatHistory[name] = [];
            }
          }
        }
      }
    } catch (e) {
      console.warn('批量加载对话记录失败:', e);
    }
  }

  /* ========================================
     公开方法
     ======================================== */

  /**
   * 添加角色
   */
  function addCharacter(name) {
    if (characters.find(c => c.name === name)) {
      showToast(`角色「${name}」已存在`, 'warning');
      return;
    }

    const personalityKey = detectPersonality(name);

    characters.push({
      name,
      count: 0,
      color: getRandomColor(),
      personality: personalityKey,
      personalityLabel: PERSONALITY_LABELS[personalityKey] || '默认'
    });

    if (!chatHistory[name]) {
      // 尝试从localStorage恢复
      if (!loadChatFromStorage(name)) {
        chatHistory[name] = [];
      }
    }

    renderCharacterList();
    showToast(`已添加角色「${name}」(性格: ${PERSONALITY_LABELS[personalityKey] || '默认'})`, 'success');
  }

  /**
   * 设置角色列表（从情绪引擎提取）
   */
  function setCharacters(extractedChars) {
    characters = extractedChars.map(c => {
      const personalityKey = detectPersonality(c.name || '');
      return {
        ...c,
        color: getRandomColor(),
        personality: personalityKey,
        personalityLabel: PERSONALITY_LABELS[personalityKey] || '默认'
      };
    });

    for (const char of characters) {
      if (!chatHistory[char.name]) {
        if (!loadChatFromStorage(char.name)) {
          chatHistory[char.name] = [];
        }
      }
    }

    renderCharacterList();
  }

  /**
   * 渲染角色列表
   */
  function renderCharacterList() {
    const listEl = document.getElementById('character-list');
    if (!listEl) return;

    if (characters.length === 0) {
      listEl.innerHTML = `
        <div class="no-character">
          <i class="fas fa-user-plus"></i>
          <p>暂无角色，请在小说中选中文本</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = characters.map(char => `
      <div class="character-item ${activeCharacter === char.name ? 'active' : ''}" data-name="${char.name}">
        <div class="character-avatar" style="background: linear-gradient(135deg, ${char.color}, ${char.color}88)">
          ${char.name.charAt(0)}
        </div>
        <div class="character-info">
          <div class="name">${char.name}${char.personalityLabel ? ' <span style="font-size:11px;color:var(--text-muted);">[' + char.personalityLabel + ']</span>' : ''}</div>
          <div class="mention-count">出现 ${char.count} 次</div>
        </div>
        <button class="btn-icon btn-remove-char" data-name="${char.name}" title="移除角色">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');

    // 绑定点击事件
    listEl.querySelectorAll('.character-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-char')) return;
        openChat(item.dataset.name);
      });
    });

    listEl.querySelectorAll('.btn-remove-char').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCharacter(btn.dataset.name);
      });
    });
  }

  /**
   * 打开与角色的对话
   */
  function openChat(name) {
    activeCharacter = name;

    const chatArea = document.getElementById('chat-area');
    const charNameEl = document.getElementById('chat-character-name');
    const avatarEl = document.getElementById('chat-avatar');
    const messagesEl = document.getElementById('chat-messages');
    const inputEl = document.getElementById('chat-input');

    if (!chatArea || !charNameEl || !messagesEl) return;

    chatArea.classList.remove('hidden');
    charNameEl.textContent = name;

    // 设置头像
    const char = characters.find(c => c.name === name);
    if (char) {
      avatarEl.style.background = `linear-gradient(135deg, ${char.color}, ${char.color}88)`;
      avatarEl.innerHTML = name.charAt(0);
    }

    // 恢复对话历史
    renderMessages(name);

    // 更新输入提示
    inputEl.placeholder = chatMode === 'chat'
      ? `与「${name}」对话...`
      : `为「${name}」续写支线剧情...`;

    // 如果是首次对话，发送欢迎语
    const history = chatHistory[name] || [];
    if (history.length === 0) {
      const personalityKey = getPersonalityForCharacter(name);
      const greeting = pickRandom(
        (PERSONALITY_TEMPLATES[personalityKey] || PERSONALITY_TEMPLATES.default).greetings
      );
      history.push({ role: 'bot', content: greeting });
      chatHistory[name] = history;
      saveChatToStorage(name);
      renderMessages(name);
    }

    renderCharacterList();

    // 滚动到最新消息
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * 发送消息
   */
  function sendMessage(text) {
    if (!activeCharacter || !text.trim()) return;

    const history = chatHistory[activeCharacter] || [];
    history.push({ role: 'user', content: text.trim() });
    saveChatToStorage(activeCharacter);

    // 渲染用户消息
    renderMessages(activeCharacter);

    // 模拟思考延迟后生成回复
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-chat');
    if (inputEl) inputEl.value = '';
    if (sendBtn) sendBtn.disabled = true;

    // 显示"正在输入..."
    appendTypingIndicator(activeCharacter);

    setTimeout(() => {
      removeTypingIndicator();

      const response = generateResponse(activeCharacter, text.trim(), chatMode);
      history.push({ role: 'bot', content: response });
      chatHistory[activeCharacter] = history;
      saveChatToStorage(activeCharacter);

      renderMessages(activeCharacter);

      if (sendBtn) sendBtn.disabled = false;
    }, 600 + Math.random() * 800);
  }

  /**
   * 渲染消息列表
   */
  function renderMessages(name) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    const history = chatHistory[name] || [];
    messagesEl.innerHTML = history.map(msg => {
      if (msg.role === 'system') {
        return `<div class="message system">${escapeHtml(msg.content)}</div>`;
      }
      return `<div class="message ${msg.role}">${escapeHtml(msg.content)}</div>`;
    }).join('');

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * 追加"正在输入"指示器
   */
  function appendTypingIndicator(name) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    const indicator = document.createElement('div');
    indicator.className = 'message bot typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<i class="fas fa-ellipsis fa-fade" style="color: var(--text-muted);"></i>';
    messagesEl.appendChild(indicator);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * 关闭对话
   */
  function closeChat() {
    activeCharacter = null;
    const chatArea = document.getElementById('chat-area');
    if (chatArea) chatArea.classList.add('hidden');
    renderCharacterList();
  }

  /**
   * 移除角色
   */
  function removeCharacter(name) {
    characters = characters.filter(c => c.name !== name);
    delete chatHistory[name];
    // 从localStorage移除
    try {
      localStorage.removeItem(STORAGE_PREFIX + name);
      localStorage.removeItem('novel_personality_' + name);
    } catch (e) { /* ignore */ }

    if (activeCharacter === name) {
      closeChat();
    }

    renderCharacterList();
    showToast(`已移除角色「${name}」`, 'warning');
  }

  /**
   * 切换聊天模式
   */
  function setChatMode(mode) {
    chatMode = mode;
    const inputEl = document.getElementById('chat-input');
    if (inputEl && activeCharacter) {
      inputEl.placeholder = mode === 'chat'
        ? `与「${activeCharacter}」对话...`
        : `为「${activeCharacter}」续写支线剧情...`;
    }

    // 添加系统消息
    if (activeCharacter) {
      const history = chatHistory[activeCharacter] || [];
      history.push({
        role: 'system',
        content: mode === 'chat' ? '已切换至聊天模式' : '已切换至续写支线模式'
      });
      chatHistory[activeCharacter] = history;
      saveChatToStorage(activeCharacter);
      renderMessages(activeCharacter);
    }
  }

  /**
   * 设置小说上下文
   */
  function setNovelContext(text) {
    novelContext = text;
  }

  /**
   * 导出单个角色的对话记录为文本
   * @param {string} name 角色名
   * @returns {string} 文本格式的对话记录
   */
  function exportChat(name) {
    const history = chatHistory[name] || [];
    if (history.length === 0) return `角色「${name}」暂无对话记录。`;

    const lines = [`=== 角色「${name}」对话记录 ===`, `导出时间: ${new Date().toLocaleString()}`, ''];

    for (const msg of history) {
      if (msg.role === 'system') {
        lines.push(`[系统] ${msg.content}`);
      } else if (msg.role === 'user') {
        lines.push(`[我] ${msg.content}`);
      } else {
        lines.push(`[${name}] ${msg.content}`);
      }
      lines.push('');
    }

    lines.push(`=== 共 ${history.filter(m => m.role !== 'system').length} 条对话 ===`);
    return lines.join('\n');
  }

  /**
   * 清除单个角色的对话记录
   * @param {string} name 角色名
   */
  function clearChat(name) {
    chatHistory[name] = [];
    try {
      localStorage.removeItem(STORAGE_PREFIX + name);
    } catch (e) { /* ignore */ }

    // 如果当前正在对话该角色，重新渲染
    if (activeCharacter === name) {
      const history = chatHistory[name];
      const personalityKey = getPersonalityForCharacter(name);
      const greeting = pickRandom(
        (PERSONALITY_TEMPLATES[personalityKey] || PERSONALITY_TEMPLATES.default).greetings
      );
      history.push({ role: 'bot', content: greeting });
      chatHistory[name] = history;
      saveChatToStorage(name);
      renderMessages(name);
    }

    showToast(`已清除角色「${name}」的对话记录`, 'info');
  }

  /**
   * 清除全部角色的对话记录
   */
  function clearAllChat() {
    const names = Object.keys(chatHistory);
    chatHistory = {};

    try {
      // 清除所有相关localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(STORAGE_PREFIX) || key.startsWith('novel_personality_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }

    // 如果当前有活跃对话，关闭它
    if (activeCharacter) {
      const history = chatHistory[activeCharacter] || [];
      const personalityKey = getPersonalityForCharacter(activeCharacter);
      const greeting = pickRandom(
        (PERSONALITY_TEMPLATES[personalityKey] || PERSONALITY_TEMPLATES.default).greetings
      );
      history.push({ role: 'bot', content: greeting });
      chatHistory[activeCharacter] = history;
      saveChatToStorage(activeCharacter);
      renderMessages(activeCharacter);
    }

    showToast(`已清除全部对话记录（共 ${names.length} 个角色）`, 'info');
  }

  /**
   * 获取对话统计信息
   * @returns {object} 统计信息
   */
  function getChatStats() {
    const allNames = [...new Set([
      ...Object.keys(chatHistory),
      ...characters.map(c => c.name)
    ])];

    let totalMessages = 0;
    let totalCharacters = allNames.length;
    const charStats = [];

    for (const name of allNames) {
      const history = chatHistory[name] || [];
      const userMsgs = history.filter(m => m.role === 'user').length;
      const botMsgs = history.filter(m => m.role === 'bot').length;
      const systemMsgs = history.filter(m => m.role === 'system').length;
      totalMessages += userMsgs + botMsgs;

      const char = characters.find(c => c.name === name);
      charStats.push({
        name,
        personality: char ? (char.personalityLabel || '默认') : (PERSONALITY_LABELS[getPersonalityForCharacter(name)] || '默认'),
        totalMessages: history.length,
        userMessages: userMsgs,
        botMessages: botMsgs,
        systemMessages: systemMsgs,
        lastActive: history.length > 0 ? history[history.length - 1].content.substring(0, 30) : '无记录'
      });
    }

    return {
      totalCharacters,
      totalMessages,
      characters: charStats,
      exportTime: new Date().toLocaleString()
    };
  }

  /* ========================================
     工具函数
     ======================================== */
  function getRandomColor() {
    const colors = [
      '#7c6ef0', '#e06090', '#50b0a0', '#e0a040',
      '#60a0e0', '#d06080', '#80c060', '#a070d0',
      '#c4956a', '#5b9bd5', '#00d4c8', '#8b6914'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  /* ========================================
     初始化：页面加载时自动恢复历史记录
     ======================================== */
  loadAllChatsFromStorage();

  /* ========================================
     公开接口
     ======================================== */
  return {
    addCharacter,
    setCharacters,
    openChat,
    sendMessage,
    closeChat,
    removeCharacter,
    setChatMode,
    setNovelContext,
    exportChat,
    clearChat,
    clearAllChat,
    getChatStats,
    getCharacters: () => characters,
    getActiveCharacter: () => activeCharacter,
    getChatMode: () => chatMode
  };
})();
