/* ============================================================
 * API 层 - LLM 调用 + 模拟生成（重构版）
 *
 * 改进点（对标参考项目 ai.php）：
 *   1. 支持 System/User 双消息（分层 Prompt）
 *   2. 模型重试回退（失败后重试，指数退避）
 *   3. temperature 动态参数（由章节类型决定）
 *   4. max_tokens 估算（根据目标字数）
 *   5. 保留原有流式 SSE 和模拟模式
 * ============================================================ */

// 模拟生成器（无 API Key 时演示完整流程）
const MockGen = {
  async generate(prompt, blockId, isNovel, ctx){
    let content = '';
    if(blockId==='worldview') content = this.worldview(ctx);
    else if(blockId==='characters') content = this.characters(ctx);
    else if(blockId.startsWith('storyOutline-act')) content = this.storyOutlineAct(blockId, ctx);
    else if(blockId.startsWith('volumeOutline-vol')) content = this.volumeOutlineSingle(blockId, ctx);
    else if(blockId.startsWith('outline-batch')) content = this.outlineBatch(blockId, ctx);
    else if(blockId==='outline') content = this.outline(ctx);
    else if(blockId.startsWith('syn')) content = this.synopsis(blockId, ctx);
    else if(blockId.startsWith('chap')) content = this.chapter(blockId, ctx);
    else if(blockId==='continue') content = this.chapter('continue', ctx);
    else content = '（模拟内容）';

    // 逐字流式输出，通过 Vue 响应式数据驱动渲染
    let full = '';
    for(let i=0;i<content.length;i++){
      if(ctx && ctx.abortFlag) break;
      full += content[i];
      // 通过 Engine 更新 block.content，Vue 自动渲染
      Engine.updateBlockContent(blockId, full);
      // 每 3-5 字一停顿，模拟真实速度
      if(i % 3 === 0) await this.sleep(12 + Math.random()*20);
    }
    return full;
  },

  sleep(ms){ return new Promise(r=>setTimeout(r,ms)); },

  worldview(ctx){
    return `## 时代背景
故事发生在一个架空的大明王朝洪武年间，社会繁荣但暗流涌动。应天府作为都城，汇聚了天下商贾、文人、权贵，科举制度是寒门跃龙门的唯一通路。

## 核心设定
这个世界存在一种被称为"算道"的隐秘力量——通过极致的数学推演，可预判天时、账目、甚至战局。掌握算道者被称为"算师"，地位尊崇但极为稀少。主角凭借现代程序员的逻辑思维，能将算道推向前所未有的高度。

## 势力格局
朝堂之上，太子党与诸王党明争暗斗；江湖之中，算师协会"天算阁"垄断算道传承；商界则以"晋商联盟"把控南北贸易。三方势力围绕一部失传的《九章算经》残卷展开博弈。

## 核心冲突
主角穿越后一无所有，必须在三个月内通过算师考核获得身份，同时躲避天算阁对其"异术"的追查，并利用现代知识在商战中积累第一桶金，为后续改变历史埋下伏笔。`;
  },

  characters(ctx){
    return `### 李明远（主角）
- **身份**：穿越者，原互联网公司后端工程师，现为应天府无名小卒
- **性格**：理性冷静、善于复盘、外圆内方。表面随和，内心有现代人的底线
- **外貌**：二十六七岁，身形清瘦，眉目清秀
- **动机**：在这个时代站稳脚跟，弄清穿越真相
- **与主角关系**：本人

### 沈婉清
- **身份**：天算阁阁主之女，天赋算师，女扮男装行走江湖
- **性格**：聪慧孤傲、外冷内热、有强烈的求知欲
- **动机**：寻找《九章算经》全本，证明女子亦可登算道巅峰
- **与主角关系**：亦敌亦友，潜在感情线

### 周德海
- **身份**：晋商联盟在应天府的掌柜，老谋深算的商人
- **性格**：圆滑世故、唯利是图、但重承诺
- **动机**：垄断漕运生意，打压新兴商号
- **与主角关系**：初期合作后期对手`;
  },

  storyOutline(ctx){
    return `## 三幕结构
- 第一幕（开篇，约占30%）：李明远穿越到明朝应天府，一无所有。通过现代数学知识在集市一鸣惊人，引起天算阁注意。第一个转折：报名算师考核，遭遇天算阁刁难。
- 第二幕（发展，约占50%）：李明远与周德海合作开设商号，用现代商业思维颠覆传统。中点反转：沈婉清发现李明远的算法与《九章算经》残卷暗合，两人结盟。危机加深：天算阁阁主亲自出手试探。
- 第三幕（高潮与结局，约占20%）：多方势力决战，李明远用现代知识改写历史惨剧。伏笔收束：穿越真相揭示，算道与时空的联系。结局：李明远做出选择。

## 关键转折点
1. 第2章：算师考核中暴露"异术"
2. 第4章：沈婉清发现算法暗合残卷
3. 第6章：天算阁阁主亲自出手
4. 第8章：多方势力决战

## 角色弧线
李明远：从迷茫穿越者成长为改变历史的算道宗师，内心始终在现代理性与古代情感间挣扎。
沈婉清：从孤傲天才到愿意信任他人，最终与李明远携手开创新算道。
周德海：从唯利是图的商人到被李明远的人格魅力折服，成为可靠盟友。

## 伏笔布局
1. 《九章算经》残卷（埋设第1章，回收第8章）
2. 李明远的穿越真相（埋设第1章，回收第9章）
3. 天算阁阁主的秘密（埋设第3章，回收第7章）`;
  },

  // mock：故事纲分幕
  storyOutlineAct(blockId, ctx){
    const actNum = parseInt(blockId.replace('storyOutline-act', ''));
    const acts = [
      `## 第一幕（开篇，约占30%）
- 主角穿越，一无所有，在集市以速算一鸣惊人
- 第一个转折：报名算师考核，遭遇天算阁刁难
- 角色弧线：从迷茫到找到立足点
- 结尾悬念：天算阁的人暗中盯上了他`,
      `## 第二幕（发展，约占50%）
- 与周德海合作开设商号，用现代商业思维颠覆传统
- 中点反转：沈婉清发现算法暗合残卷，两人结盟
- 危机加深：天算阁阁主亲自出手试探
- 角色弧线：从求生到主动布局
- 结尾悬念：危机全面降临`,
      `## 第三幕（高潮与结局，约占20%）
- 多方势力决战，用现代知识改写历史惨剧
- 伏笔收束：穿越真相揭示，算道与时空的联系
- 角色弧线：做出最终选择
- 结尾：在两个世界间找到平衡`,
    ];
    return acts[actNum - 1] || '（模拟内容）';
  },

  // mock：卷大纲单卷
  volumeOutlineSingle(blockId, ctx){
    const volNum = parseInt(blockId.replace('volumeOutline-vol', ''));
    return `## 第${volNum}卷
- **卷主题**：第${volNum}卷的核心主题
- **关键事件**：事件A、事件B、事件C
- **角色聚焦**：主角的成长与蜕变
- **核心冲突**：本卷的主要矛盾
- **冲突解决**：部分解决，留下伏笔
- **卷目标**：主角达到新的阶段`;
  },

  // mock：章节细纲分批
  outlineBatch(blockId, ctx){
    const batchNum = parseInt(blockId.replace('outline-batch', ''));
    const n = ctx.novelConfig;
    const startCh = batchNum * 10 + 1;
    const endCh = Math.min(startCh + 9, n.chapterCount);
    let text = `**第${startCh}-${endCh}章细纲**\n\n`;
    const plots = [
      {t:'穿越应天',s:'主角穿越后在集市以速算一鸣惊人',oh:'穿越者的迷茫',eh:'引起天算阁注意',kc:'现代知识 vs 古代生存'},
      {t:'算师考核',s:'报名算师考核，遭遇刁难但惊险过关',oh:'考场紧张',eh:'身份被怀疑',kc:'身份暴露危机'},
      {t:'商海初战',s:'与周德海合作开设商号，赚得第一桶金',oh:'开张热闹',eh:'暗流涌动',kc:'商业博弈'},
      {t:'暗流涌动',s:'天算阁派人调查，沈婉清发现算法暗合残卷',oh:'暗中试探',eh:'残卷线索浮现',kc:'信任与背叛'},
      {t:'风起天算',s:'天算阁阁主亲自出手试探，算道对决',oh:'对决紧张',eh:'危机降临',kc:'算道对决'},
      {t:'破局之战',s:'赵王党围剿，利用信息差翻盘',oh:'围剿紧迫',eh:'连环局启动',kc:'生死存亡'},
      {t:'残卷之谜',s:'残卷现世，揭示穿越真相的一角',oh:'残卷震撼',eh:'真相一角',kc:'真相与抉择'},
      {t:'抉择时刻',s:'多方势力决战，改写历史惨剧',oh:'决战惨烈',eh:'十字路口',kc:'改写历史'},
      {t:'新的序章',s:'做出选择，开创新算道',oh:'新算道诞生',eh:'新时代开启',kc:'传承与创新'},
      {t:'终章·归途',s:'真相大白，在两个世界间找到平衡',oh:'释然',eh:'希望与悬念',kc:'最终归宿'},
    ];
    for(let i = 0; i < 10 && startCh + i <= endCh; i++){
      const p = plots[(startCh + i - 1) % plots.length];
      text += `第${startCh + i}章 ${p.t}\n${p.s}\n开头钩子：${p.oh}\n结尾钩子：${p.eh}\n关键冲突：${p.kc}\n\n`;
    }
    return text;
  },

  // mock：章节简介
  synopsis(blockId, ctx){
    const chapIdx = parseInt(blockId.replace('syn-', ''));
    return `第${chapIdx + 1}章简介：本章主要事件发展概述，包含冲突引入和悬念设置。`;
  },

  outline(ctx){
    const n = ctx.novelConfig;
    const count = n.chapterCount;
    const plots = [
      {t:'穿越应天',s:'李明远熬夜改bug后猝死，醒来发现自己躺在明朝应天府的破庙里。他迅速评估处境，决定用现代知识谋生，在集市上以"速算"一鸣惊人，引起天算阁注意。',oh:'穿越者的迷茫与求生欲',eh:'天算阁的人暗中盯上了他',kc:'现代知识 vs 古代生存'},
      {t:'算师考核',s:'沈婉清女扮男装暗中观察李明远，试探其算道来历。李明远为获取合法身份报名算师考核，却在考场遭遇天算阁设下的刁难，凭借现代数学思维惊险过关。',oh:'考场的紧张氛围',eh:'沈婉清对他的身份产生怀疑',kc:'身份暴露的危机'},
      {t:'商海初战',s:'李明远与周德海合作开设"明远商号"，用复式记账法和供应链思维颠覆传统商道。周德海表面扶持，暗中设局，李明远识破后反将一军，赚得第一桶金。',oh:'商号开张的热闹',eh:'周德海暗中设局的阴谋',kc:'商业博弈'},
      {t:'暗流涌动',s:'陈守正察觉李明远的"异术"，派人暗中调查。沈婉清发现李明远使用的算法与《九章算经》残卷暗合，两人从对手转为盟友，共同追查残卷下落。',oh:'暗中的调查与试探',eh:'残卷线索浮现',kc:'信任与背叛'},
      {t:'风起天算',s:'天算阁阁主亲自出手试探李明远，一场算道对决在所难免。李明远以现代博弈论破局，震惊四座，却也彻底暴露了自己的"不合常理"，危机全面降临。',oh:'算道对决的紧张',eh:'危机全面降临',kc:'算道对决'},
      {t:'破局之战',s:'赵王党借天算阁之手围剿李明远，沈婉清舍身相救。李明远利用信息差和现代金融思维，在商战与朝堂博弈中布下连环局，一举翻盘。',oh:'围剿的紧迫感',eh:'连环局启动',kc:'生死存亡'},
      {t:'残卷之谜',s:'《九章算经》残卷现世，揭示穿越真相的一角。李明远发现算道与时空的隐秘联系，回家的线索浮现，却也面临是否留下的抉择。',oh:'残卷现世的震撼',eh:'穿越真相的一角',kc:'真相与抉择'},
      {t:'抉择时刻',s:'多方势力决战，李明远用现代知识改写了一场本该发生的历史惨剧。他站在十字路口：是回归现代，还是留下？',oh:'决战的惨烈',eh:'十字路口的抉择',kc:'改写历史'},
      {t:'新的序章',s:'李明远做出选择，与沈婉清携手开创"新算道"，将现代科学思维融入这个时代。',oh:'新算道的诞生',eh:'新时代的开启',kc:'传承与创新'},
      {t:'终章·归途',s:'真相大白，穿越之谜解开。李明远在两个世界间找到平衡，故事在希望与悬念中落幕。',oh:'真相大白的释然',eh:'希望与悬念并存',kc:'最终的归宿'},
    ];
    let text = `**书名：《算道大明》**\n\n`;
    for(let i=0;i<count;i++){
      const p = plots[i] || plots[i % plots.length];
      text += `第${i+1}章 ${p.t}\n${p.s}\n开头钩子：${p.oh}\n结尾钩子：${p.eh}\n关键冲突：${p.kc}\n\n`;
    }
    return text;
  },

  chapter(blockId, ctx){
    const n = ctx.novelConfig;
    let idx = 0;
    if(blockId.startsWith('chap')) idx = parseInt(blockId.slice(4)) || 0;
    const chapters = [
      `李明远睁开眼的时候，入目是一片斑驳的梁柱和缭绕的香灰味。\n\n他挣扎着坐起身，脑袋像被人塞进了一团浆糊。最后的记忆停留在工位上——凌晨三点，他正在调试一个死锁的并发模块，胸口突然一紧，然后……就是这里。\n\n"这是哪儿？"他的声音在空旷的破庙里回荡。\n\n门外传来吆喝声，他踉跄着走出去，刺目的阳光让他眯起了眼。然后他看见了——青砖黛瓦，长街市井，挑担的货郎，骑马的官差，还有远处巍峨的城楼。\n\n应天府。\n\n李明远愣在原地足足三分钟。作为一个程序员，他第一反应不是恐慌，而是开始评估"系统状态"：身份未知，资产为零，人脉为零，语言……勉强能通。这是地狱开局，但并非死局。\n\n他的目光落在街角一家算盘铺子上。掌柜正对着一本厚厚的账册愁眉不展，算盘珠子拨得噼啪作响，却怎么也算不平。\n\n李明远走了过去。`,
      `算师考核设在应天府学宫的明伦堂。\n\n李明远混在考生队伍里，打量着周围。来应考的多是三十上下的中年人，青衫方巾，一脸肃穆。他这个"年轻人"显得格外扎眼。\n\n"哪来的黄口小儿，也敢来考算师？"旁边一个胖子嗤笑。\n\n李明远没搭理他。他在观察考场布局——这比他参加过的任何技术面试都正式。\n\n主考官是天算阁的三长老，须发皆白，目光如炬。他扫了李明远一眼，眉头微皱："本次考核共三题，限时一个时辰。"\n\n题目写在木牌上抬了出来：今有粮草三万七千石，自A运至B，水路日行三百里耗损百分之一，陆路日行二百里耗损百分之三，求最优路线。\n\n周围考生纷纷埋头拨算盘。李明远却提笔在草纸上画起了图——这不是算术题，这是运筹学。`,
      `"明远商号"的招牌在应天府东市挂起来那天，周德海亲自来剪彩。\n\n"李老弟，老夫看好你。"周德海笑得满脸褶子，"这复式记账法，当真是闻所未闻，妙不可言。"\n\n李明远拱手回礼，心里却清楚——这老狐狸的每一句夸赞，都带着算计。\n\n合作第一个月，明远商号的账目清晰得让同行侧目。复式记账让每一笔进出都有迹可循，供应链的思路让库存周转快了三倍。周德海起初确实尝到了甜头。\n\n但李明远很快发现了不对劲。周德海介绍的几个"大主顾"，付款总是拖延，货物却提得飞快。这是典型的现金流陷阱——用他的货压他自己的资金链。\n\n"想用现代商战的老套路对付我？"李明远在灯下冷笑，提笔写下三个字：反将一军。`,
    ];
    if(idx < chapters.length) return chapters[idx];
    return `第${idx+1}章\n\n（模拟模式生成内容有限，配置真实 API 可获得完整的 AI 生成正文。李明远的故事还在继续，他在这个时代的每一步都走得惊心动魄。现代知识与古老规则的碰撞，正在改写这个世界的轨迹。）`;
  },

  // ===== 创意工坊 Mock 数据 =====
  // 字段与 store.novelConfig 完全对应
  workshop(idea){
    return {
      title: '逆天改命：我的修仙外挂能看见气运',
      genre: '玄幻修仙',
      style: '热血爽文',
      styleVector: { style:'concise', pacing:'fast', emotion:'passionate', intellect:'balanced' },
      referenceAuthor: '',
      protagonist: {
        name: '陈长安',
        personality: '沉稳务实，不轻易暴露实力，善于用逻辑思维分析问题',
        goal: '在大宗门内站稳脚跟，逐步揭开穿越真相',
        conflict: '旁系弟子身份与气运面板秘密的矛盾',
      },
      worldSetting: '天玄大陆，以灵气修炼为核心，分为凡人界和修仙界。修仙界由七大仙宗统治，境界划分：练气、筑基、金丹、元婴、化神、渡劫、大乘。各大仙宗之间表面和平，暗中争夺气运节点。世间存在"天命者"概念，每个大时代会诞生受天道眷顾的天命之人。',
      plotMode: 'linear',
      endingStyle: 'open',
      extraSettings: '金手指：气运面板，能看到周围人事物的气运值，随修为提升解锁改运能力。重要配角：苏墨白（天剑宗内门首席弟子）、柳如烟（药王谷传人）。',
      targetReader: 'young_male',
      coverColor: '#1a5276',
      chapterCount: 10,
      wordCount: 2000,
      volumeStructure: 'single',
      volumes: [],
    };
  },
};

// API 调用层
const Api = {
  // 最大重试次数
  MAX_RETRIES: 2,
  // 重试延迟基数（毫秒）
  RETRY_BASE_DELAY: 1000,
  // 流式静默超时（毫秒）— 超过此时间无数据则判定卡死
  // 为什么 90s：DeepSeek-Reasoner 等推理模型在"思考阶段"会长时间不输出 token
  // Reference-php 默认 120s，1M 上下文模型 600s
  SILENCE_TIMEOUT: 90000,
  // 上次 API 调用的 finish_reason — 供 Engine 检测截断
  lastFinishReason: null,

  // 任务类型参数预设 — 对标参考项目按任务类型分配 temperature/max_tokens
  // 为什么区分：创意写作需要高发散，结构化输出需要低随机
  TASK_TYPES: {
    creative:  { temperature: 0.85, topP: 0.9 },   // 正文创作：高发散
    outline:   { temperature: 0.75, topP: 0.85 },  // 大纲规划：中等发散
    structured:{ temperature: 0.3,  topP: 0.6 },   // 结构化输出：低随机
    title:     { temperature: 0.3,  topP: 0.6 },   // 标题生成：低随机
    summary:   { temperature: 0.3,  topP: 0.6 },   // 摘要压缩：低随机
  },

  // 解析模型列表 — 支持逗号分隔多模型回退
  // 对标参考项目 ModelFallback：主模型失败后自动切换备选
  getModelList(){
    const { model } = store.config;
    if(!model) return [];
    return model.split(',').map(m => m.trim()).filter(Boolean);
  },

  // 检测是否为 1M 上下文模型 — 模型名含 [1m] 标记
  is1MContextModel(modelName){
    return /\[1m\]/i.test(modelName || '');
  },

  // 流式生成（兼容旧接口 — 单条 prompt）
  async streamGenerate(prompt, blockId, ctx, options){
    this.lastFinishReason = null;
    if(store.mode==='mock'){
      return await MockGen.generate(prompt, blockId, false, ctx);
    }
    // 旧接口：无 system prompt，使用空字符串
    return await this.callApiWithRetry('', prompt, blockId, ctx, options || {});
  },

  // 流式生成（新接口 — System/User 双消息）
  // options.taskType: creative|outline|structured|title — 决定 temperature/topP
  // options.temperature: 覆盖任务类型默认值
  // options.maxTokens: 覆盖自动估算
  async streamGenerateWithSystem(systemPrompt, userPrompt, blockId, ctx, options){
    this.lastFinishReason = null;
    if(store.mode==='mock'){
      // 模拟模式忽略 system prompt，使用 user prompt
      return await MockGen.generate(userPrompt, blockId, false, ctx);
    }
    return await this.callApiWithRetry(systemPrompt, userPrompt, blockId, ctx, options || {});
  },

  // 带重试 + 多模型回退的 API 调用 — 对标参考项目 ModelFallback
  // 流程：遍历模型列表 → 每个模型重试 MAX_RETRIES 次 → 全部失败则抛出
  async callApiWithRetry(systemPrompt, userPrompt, blockId, ctx, options){
    const models = this.getModelList();
    if(models.length === 0) models.push(store.config.model || '');
    let lastError = null;

    for(let mi = 0; mi < models.length; mi++){
      const modelName = models[mi];
      for(let attempt = 0; attempt <= this.MAX_RETRIES; attempt++){
        try{
          if(attempt > 0){
            const delay = this.RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
            await this.sleep(delay);
            store.toast(`第${attempt}次重试...`, 'warn');
          }
          if(models.length > 1 && mi > 0){
            store.toast(`切换备选模型: ${modelName}`, 'warn');
          }
          return await this.callApi(systemPrompt, userPrompt, blockId, ctx, options, modelName);
        }catch(e){
          lastError = e;
          if(ctx.abortFlag) throw e;
          // 429 / 5xx 重试
          if(e.message && (e.message.includes('429') || /5\d\d/.test(e.message))){
            continue;
          }
          // 其他错误：尝试下一个模型
          break;
        }
      }
    }
    throw lastError || new Error('所有模型均调用失败');
  },

  sleep(ms){ return new Promise(r=>setTimeout(r,ms)); },

  // 核心 API 调用 — 增强版
  // 新增：任务类型参数、静默超时检测、字数修剪、1M 上下文支持
  async callApi(systemPrompt, userPrompt, blockId, ctx, options, modelName){
    const { base, key } = store.config;
    const model = modelName || store.config.model;
    ctx.abortCtrl = new AbortController();

    const url = base.replace(/\/$/,'') + '/chat/completions';

    // 构建消息列表（System/User 分层）
    const messages = [];
    if(systemPrompt && systemPrompt.trim()){
      messages.push({ role:'system', content: systemPrompt });
    }
    messages.push({ role:'user', content: userPrompt });

    // 任务类型参数：options.temperature 覆盖 > taskType 预设 > 默认值
    const taskType = options.taskType || 'creative';
    const taskParams = this.TASK_TYPES[taskType] || this.TASK_TYPES.creative;
    const temperature = options.temperature !== undefined ? options.temperature : taskParams.temperature;
    const topP = options.topP !== undefined ? options.topP : taskParams.topP;

    // max_tokens 估算 — 传入 taskType 以支持分块场景
    const maxTokens = options.maxTokens || this.estimateMaxTokens(userPrompt, taskType);

    // 检测思考模型：动态调整静默超时
    // 为什么：推理模型（DeepSeek-Reasoner 等）在思考阶段长时间不输出 token
    const isThinkingModel = /reasoner|thinking|think/i.test(model) || this.is1MContextModel(model);
    const silenceTimeout = isThinkingModel ? 300000 : this.SILENCE_TIMEOUT;

    // 请求体
    const body = {
      model,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens,
    };
    // top_p 仅在非 1 时发送（部分模型不支持）
    if(topP && topP < 1) body.top_p = topP;

    const res = await fetch(url, {
      method:'POST',
      signal: ctx.abortCtrl.signal,
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body: JSON.stringify(body),
    });

    if(!res.ok){
      const t = await res.text();
      throw new Error(`API ${res.status}: ${t.slice(0,200)}`);
    }

    // 流式读取 + 静默超时检测
    // 为什么加静默超时：部分模型在长上下文时会"卡住"不输出，
    // 无限等待会导致前端假死，超时后触发重试可恢复
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '', buf = '';
    let lastDataTime = Date.now();
    let finishReason = null;  // 捕获 finish_reason 用于截断检测

    while(true){
      // Promise.race 实现静默超时
      const readPromise = reader.read();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          if(Date.now() - lastDataTime > silenceTimeout){
            reject(new Error('流式输出静默超时'));
          }
        }, silenceTimeout);
      });

      let result;
      try{
        result = await Promise.race([readPromise, timeoutPromise]);
      }catch(e){
        // 静默超时：中止读取，返回已获取内容（可能不完整但优于空）
        try{ reader.cancel(); }catch(_){}
        if(full.length > 100){
          store.toast('流式输出超时，使用已获取内容', 'warn');
          break;
        }
        throw e;
      }

      const { done, value } = result;
      if(done) break;
      lastDataTime = Date.now();

      buf += decoder.decode(value, {stream:true});
      const lines = buf.split('\n');
      buf = lines.pop();
      for(const line of lines){
        const s = line.trim();
        if(!s || !s.startsWith('data:')) continue;
        const data = s.slice(5).trim();
        if(data==='[DONE]') continue;
        try{
          const json = JSON.parse(data);
          const choice = json.choices?.[0];
          const delta = choice?.delta?.content || '';
          if(delta){
            full += delta;
            Engine.updateBlockContent(blockId, full);
          }
          // 捕获 finish_reason
          if(choice?.finish_reason){
            finishReason = choice.finish_reason;
          }
        }catch(e){}
      }
    }

    // 截断检测：finish_reason === 'length' 表示模型输出被 max_tokens 截断
    this.lastFinishReason = finishReason;
    if(finishReason === 'length'){
      store.toast('输出被 max_tokens 截断，内容可能不完整', 'warn');
    }

    // 字数修剪：超出目标 150% 时在句子边界截断
    // 为什么修剪：部分模型忽略 max_tokens，输出远超目标字数
    const trimmed = this.truncateAtSentenceBoundary(full, userPrompt);
    if(trimmed !== full){
      Engine.updateBlockContent(blockId, trimmed);
      store.toast('内容已修剪至目标字数', 'warn');
    }
    return trimmed;
  },

  // 在句子边界截断 — 避免截断在词中间导致语义不完整
  truncateAtSentenceBoundary(content, prompt){
    const m = prompt?.match(/字数约\s*(\d+)\s*字/);
    if(!m) return content;
    const targetWords = parseInt(m[1]);
    const maxWords = targetWords * 1.5;
    if(content.length <= maxWords) return content;

    // 在 maxWords 附近找最近的句子结束符
    const sentenceEnd = /[。！？…\n]/;
    let cutPos = maxWords;
    // 向后找 100 字符内的句子边界
    for(let i = maxWords; i < Math.min(content.length, maxWords + 100); i++){
      if(sentenceEnd.test(content[i])){
        cutPos = i + 1;
        break;
      }
    }
    return content.slice(0, cutPos);
  },

  // max_tokens 估算
  // 为什么需要 taskType：章节细纲/故事纲等 prompt 不含"字数约 X 字"字样，
  // 旧逻辑回退到默认 1500 字 → max_tokens=2700 → 仅能输出 ~12 章细纲就被截断
  // 修复：无目标字数时按 taskType 估算
  estimateMaxTokens(prompt, taskType){
    // 优先：从 prompt 中提取目标字数
    const m = prompt.match(/字数约\s*(\d+)\s*字/);
    if(m){
      const targetWords = parseInt(m[1]);
      return Math.round(targetWords * 1.5 * 1.2);
    }
    // 兜底：按 taskType 估算
    // 章节细纲：尝试从 prompt 提取章数，每章 150 字
    if(taskType === 'outline'){
      const chapMatch = prompt.match(/共\s*(\d+)\s*章/);
      if(chapMatch){
        const chapCount = parseInt(chapMatch[1]);
        return Math.round(chapCount * 150 * 1.5 * 1.2);
      }
      return 4096;
    }
    if(taskType === 'storyOutline') return 8192;
    if(taskType === 'volumeOutline') return 4096;
    if(taskType === 'synopsis') return 2048;
    if(taskType === 'summary') return 500;
    // 默认（正文等）
    return 4096;
  },

  // 非流式调用 — 用于摘要、故事圣经、弧段压缩等结构化任务
  // 对标参考项目的非流式调用：低 temperature、短输出、无流式开销
  async callApiNonStream(prompt, options){
    const { base, key, model } = store.config;
    const models = this.getModelList();
    const useModel = models[0] || model;

    const taskType = options?.taskType || 'summary';
    const taskParams = this.TASK_TYPES[taskType] || this.TASK_TYPES.summary;
    const temperature = options?.temperature ?? taskParams.temperature;
    const maxTokens = options?.maxTokens || 500;

    const res = await fetch(base.replace(/\/$/,'')+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body: JSON.stringify({
        model: useModel,
        messages:[{role:'user', content: prompt}],
        stream: false,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if(!res.ok){
      const t = await res.text();
      throw new Error(`API ${res.status}: ${t.slice(0,200)}`);
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || '';
  },

  // 获取 AI 调用回调 — 供 MemoryEngine 的 AI 压缩功能使用
  // 返回一个 (prompt) => Promise<string> 函数，模拟模式返回空字符串触发降级
  getAiCallCallback(){
    if(store.mode !== 'api') return null;
    return async (prompt) => {
      try{
        return await this.callApiNonStream(prompt, { taskType: 'summary', maxTokens: 500 });
      }catch(e){
        console.warn('AI 回调失败，将降级', e);
        return '';
      }
    };
  },

  // 非流式调用（用于生成摘要）
  async generateSummary(content){
    if(store.mode==='mock') return content.slice(0,120);
    try{
      const prompt = PromptBuilder.buildSummaryPrompt(content);
      return await this.callApiNonStream(prompt, { taskType: 'summary', maxTokens: 200 });
    }catch(e){ return content.slice(0,120); }
  },

  // 测试连接
  async testConnection(base, key, model){
    const res = await fetch(`${base.replace(/\/$/,'')}/chat/completions`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body: JSON.stringify({ model, messages:[{role:'user',content:'你好'}], max_tokens:10, stream:false })
    });
    if(res.ok) return { ok:true };
    const t = await res.text();
    return { ok:false, error:`${res.status}: ${t.slice(0,120)}` };
  },

  // ===== P2-3: 章节润色 =====

  // 整章润色 — 调用 AI 对整章内容进行文学润色
  // options: { style: '文风'|'节奏'|'描写'|'对话', strength: '轻'|'中'|'重', preservePlot: true }
  async polishChapter(novel, chapIdx, content, options){
    if(store.mode === 'mock'){
      store.toast('模拟模式不支持润色，请配置真实 API', 'warn');
      return content;
    }
    options = options || {};
    const styleHint = this._polishStyleHint(options.style);
    const strengthHint = this._polishStrengthHint(options.strength);
    const plotHint = options.preservePlot !== false ? '保持原有剧情走向、人物关系和事件顺序不变，仅优化表达。' : '在保持核心剧情的基础上可适当调整细节。';

    const systemPrompt = `你是一位专业的小说编辑，擅长文学润色。
你的任务是润色小说章节内容，提升文学质量，同时严格保持原有剧情。`;

    const userPrompt = `请对以下小说章节内容进行润色。

【润色方向】${styleHint}
【润色力度】${strengthHint}
【约束】${plotHint}
${options.preservePlot !== false ? '禁止改变任何剧情走向、人物行为和对话含义。' : ''}

【待润色内容】
${content}

请直接输出润色后的完整内容，不要添加任何说明或标记。`;

    const ctx = { novelConfig: novel, abortFlag: false, abortCtrl: null };
    Object.defineProperty(ctx, 'abortFlag', { get: () => Engine.abortFlag, configurable: true });

    // 润色使用非流式调用，避免 UI 闪烁
    try{
      const polished = await this.callApiNonStream(userPrompt, {
        taskType: 'creative',
        temperature: 0.6,
        maxTokens: Math.min(8192, this.estimateMaxTokens(content) * 2),
      });
      // 如果返回内容太短（可能 AI 截断了），回退到原内容
      if(polished.length < content.length * 0.5){
        store.toast('润色结果异常，已保留原内容', 'warn');
        return content;
      }
      return polished;
    }catch(e){
      console.error('润色失败', e);
      store.toast('润色失败: ' + e.message, 'error');
      return content;
    }
  },

  // 选段润色 — 对选中段落进行润色
  async polishSelection(novel, chapIdx, selectedText, options){
    if(store.mode === 'mock'){
      store.toast('模拟模式不支持润色', 'warn');
      return selectedText;
    }
    options = options || {};
    const styleHint = this._polishStyleHint(options.style);
    const plotHint = '保持上下文衔接自然，仅润色选中的段落。';

    const userPrompt = `请润色以下小说选段。

【润色方向】${styleHint}
【约束】${plotHint}

【待润色选段】
${selectedText}

请直接输出润色后的内容，不要添加任何说明。`;

    try{
      const polished = await this.callApiNonStream(userPrompt, {
        taskType: 'creative',
        temperature: 0.6,
        maxTokens: Math.min(4096, this.estimateMaxTokens(selectedText) * 2),
      });
      if(polished.length < selectedText.length * 0.3){
        return selectedText;
      }
      return polished;
    }catch(e){
      console.error('选段润色失败', e);
      return selectedText;
    }
  },

  // 润色风格提示词
  _polishStyleHint(style){
    const hints = {
      '文风': '优化文字风格，使语言更加流畅优美，符合小说体裁。',
      '节奏': '调整叙事节奏，紧凑拖沓处加速，关键场景放缓强化。',
      '描写': '增强环境描写和感官描写，让场景更加生动立体。',
      '对话': '优化人物对话，使其更符合角色性格，增加对话张力。',
      '综合': '综合优化文风、节奏、描写和对话，全面提升文学质量。',
    };
    return hints[style] || hints['综合'];
  },

  // 润色力度提示词
  _polishStrengthHint(strength){
    const hints = {
      '轻': '轻度润色：仅修正明显问题，保持原文风格。',
      '中': '中度润色：优化表达，增强描写，但保持整体结构。',
      '重': '深度润色：大幅改写表达方式，提升文学性，但保持剧情不变。',
    };
    return hints[strength] || hints['中'];
  },
};

window.MockGen = MockGen;
window.Api = Api;
