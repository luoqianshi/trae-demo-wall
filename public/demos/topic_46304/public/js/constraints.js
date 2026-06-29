/* ============================================================
 * Constraints - 写作约束系统
 * 对标 Reference-php includes/constraints/ 目录
 * 三模块：ConstraintConfig + ConstraintState + PostWriteValidator
 * ============================================================ */

// ============================================================
// ConstraintConfig - 约束配置
// 对标 Reference-php includes/constraints/ConstraintConfig.php
// ============================================================
const ConstraintConfig = {

  // 默认约束配置 — 对标 Reference-php getConstraintDefaults() 第 166-190 行
  DEFAULTS: {
    enabled: true,                   // 启用约束框架
    strictMode: false,               // 严格模式（P0 拦截，阻止章节落盘）
    maxCoincidences: 5,              // 巧合数上限（每章）
    maxSameConflict: 1,              // 同类冲突上限（每章）
    foreshadowingRecoveryMin: 70,    // 伏笔回收率下限（%）
    maxNewInfoPerCh: 2,              // 每章新信息上限
    minBufferRelease: 2,             // 高潮后缓冲释放章数
    cooldownAfterClimax: 1,          // 高潮后冷却章数
    maxBannedWordUsage: 15,          // 禁用词使用上限
    bannedWords: '绝境,反杀,真相,背水,逆袭', // 禁用词列表
  },

  // 从 store 加载约束配置
  load(novel){
    if(!novel) return { ...this.DEFAULTS };
    // 优先从 novel.constraintConfig 读取，其次从 store.constraintConfig
    const config = novel.constraintConfig || store.constraintConfig || { ...this.DEFAULTS };
    return { ...this.DEFAULTS, ...config };
  },

  // 保存约束配置到 novel
  save(novel, constraints){
    novel.constraintConfig = { ...constraints };
  },

  // 是否严格模式
  isStrictMode(novel){
    const config = this.load(novel);
    return config.strictMode === true;
  },

  // 获取禁用词列表
  getBannedWords(novel){
    const config = this.load(novel);
    if(!config.bannedWords) return [];
    return config.bannedWords.split(/[,，]/).map(w => w.trim()).filter(Boolean);
  },
};

// ============================================================
// ConstraintState - 约束状态管理
// 对标 Reference-php includes/constraints/ConstraintStateDB.php
// 跟踪每章的约束状态：巧合数、新信息数、高潮冷却等
// ============================================================
const ConstraintState = {

  // 初始化小说的约束状态
  init(novel){
    if(!novel.constraintState){
      novel.constraintState = {
        chapterStates: [],    // 每章状态数组
        activeCooldown: 0,    // 当前高潮冷却剩余章数
        activeBuffer: 0,      // 当前缓冲释放剩余章数
        totalCoincidences: 0, // 全书巧合总数
        totalSameConflicts: {}, // 同类冲突记录 { type: count }
      };
    }
    return novel.constraintState;
  },

  // 获取指定章节的约束状态
  getChapterState(novel, chapIdx){
    this.init(novel);
    const states = novel.constraintState.chapterStates;
    if(!states[chapIdx]){
      states[chapIdx] = {
        coincidences: 0,
        newInfo: 0,
        conflicts: {},
        hasClimax: false,
        bannedWordCount: 0,
        violations: [],
      };
    }
    return states[chapIdx];
  },

  // 根据章节内容更新约束状态
  // 对标 Reference-php ConstraintStateUpdater::updateState()
  updateState(novel, chapIdx, chapterText){
    this.init(novel);
    const state = this.getChapterState(novel, chapIdx);
    const config = ConstraintConfig.load(novel);

    // 1. 巧合检测
    const coincidenceKeywords = ['巧合','恰巧','恰好','正好','意外','不料','谁知','谁知竟'];
    state.coincidences = 0;
    for(const kw of coincidenceKeywords){
      let idx = 0;
      while((idx = chapterText.indexOf(kw, idx)) !== -1){
        state.coincidences++;
        idx += kw.length;
      }
    }

    // 2. 新信息检测（角色/地点/设定的首次出现）
    const knownChars = (novel.characters || '').split(/[,，、\n]/).map(s => s.trim()).filter(Boolean);
    const knownLocations = novel.memory?.locations || [];
    state.newInfo = 0;
    // 检测新角色名（非已知角色名的名字）
    const charPattern = /[\u4e00-\u9fa5]{2,4}(?:道|说|笑|怒|惊|叹)/g;
    const matches = chapterText.match(charPattern) || [];
    const mentionedNames = new Set();
    for(const m of matches){
      const name = m.replace(/[道说笑怒惊叹]/, '');
      if(name.length >= 2 && !knownChars.includes(name) && !mentionedNames.has(name)){
        mentionedNames.add(name);
        state.newInfo++;
      }
    }

    // 3. 冲突类型统计
    state.conflicts = {};
    const conflictTypes = {
      physical: ['打','杀','战','斗','攻击','防御'],
      verbal: ['争吵','辩论','对峙','质问','指责'],
      internal: ['纠结','犹豫','矛盾','挣扎','抉择'],
      environmental: ['风暴','地震','塌方','洪水','干旱'],
    };
    for(const [type, keywords] of Object.entries(conflictTypes)){
      for(const kw of keywords){
        if(chapterText.includes(kw)){
          state.conflicts[type] = (state.conflicts[type] || 0) + 1;
        }
      }
    }

    // 4. 高潮检测
    const climaxKeywords = ['高潮','决战','终极','最后','巅峰','最高潮','大结局'];
    state.hasClimax = climaxKeywords.some(kw => chapterText.includes(kw));

    // 5. 禁用词统计
    const bannedWords = ConstraintConfig.getBannedWords(novel);
    state.bannedWordCount = 0;
    for(const bw of bannedWords){
      let idx = 0;
      while((idx = chapterText.indexOf(bw, idx)) !== -1){
        state.bannedWordCount++;
        idx += bw.length;
      }
    }

    // 6. 更新全局状态
    novel.constraintState.totalCoincidences += state.coincidences;

    // 同类冲突记录
    for(const [type, count] of Object.entries(state.conflicts)){
      novel.constraintState.totalSameConflicts[type] =
        (novel.constraintState.totalSameConflicts[type] || 0) + count;
    }

    // 高潮冷却/缓冲
    if(state.hasClimax){
      novel.constraintState.activeCooldown = config.cooldownAfterClimax;
      novel.constraintState.activeBuffer = config.minBufferRelease;
    } else {
      if(novel.constraintState.activeCooldown > 0) novel.constraintState.activeCooldown--;
      if(novel.constraintState.activeBuffer > 0) novel.constraintState.activeBuffer--;
    }

    return state;
  },

  // 获取当前生效的约束列表（供 PromptBuilder 注入）
  getActiveConstraints(novel, chapIdx){
    this.init(novel);
    const config = ConstraintConfig.load(novel);
    const active = [];

    if(!config.enabled) return active;

    // 高潮冷却约束
    if(novel.constraintState.activeCooldown > 0){
      active.push({
        type: 'cooldown',
        message: `本章处于高潮冷却期（剩余${novel.constraintState.activeCooldown}章），应降速处理后果而非立即推进新冲突`,
      });
    }

    // 缓冲释放约束
    if(novel.constraintState.activeBuffer > 0){
      active.push({
        type: 'buffer',
        message: `本章处于高潮后缓冲期（剩余${novel.constraintState.activeBuffer}章），应安排角色反应和情感沉淀`,
      });
    }

    // 巧合限制
    const coincidencesUsed = novel.constraintState.totalCoincidences;
    if(coincidencesUsed >= config.maxCoincidences * 0.8){
      active.push({
        type: 'coincidence_limit',
        message: `全书巧合数已达${coincidencesUsed}（上限${config.maxCoincidences}），本章应减少巧合推进`,
      });
    }

    // 禁用词约束
    const bannedWords = ConstraintConfig.getBannedWords(novel);
    if(bannedWords.length > 0){
      active.push({
        type: 'banned_words',
        message: `禁用词：${bannedWords.join('、')}，本章使用次数不得超过${config.maxBannedWordUsage}次`,
      });
    }

    // 新信息限制
    active.push({
      type: 'new_info_limit',
      message: `本章新信息（新角色/新设定）不超过${config.maxNewInfoPerCh}个`,
    });

    return active;
  },
};

// ============================================================
// PostWriteValidator - 写后验证器
// 对标 Reference-php includes/constraints/PostWriteValidator.php
// 写后检查章节是否违反约束，生成修复指令
// ============================================================
const PostWriteValidator = {

  // 验证章节内容
  // 返回 { has_p0, has_p1, p0_issues, p1_issues, all_issues }
  validate(novel, chapIdx, chapterText){
    const config = ConstraintConfig.load(novel);
    if(!config.enabled){
      return { has_p0: false, has_p1: false, p0_issues: [], p1_issues: [], all_issues: [] };
    }

    // 获取当前章节约束状态
    const state = ConstraintState.getChapterState(novel, chapIdx);
    const p0Issues = [];
    const p1Issues = [];

    // ===== P0 级违规（严重，严格模式下阻止落盘）=====

    // 1. 禁用词超限
    if(state.bannedWordCount > config.maxBannedWordUsage){
      const bannedWords = ConstraintConfig.getBannedWords(novel);
      p0Issues.push({
        level: 'P0',
        type: 'banned_word_overflow',
        issue_desc: `禁用词使用${state.bannedWordCount}次（上限${config.maxBannedWordUsage}），涉及词汇：${bannedWords.join('、')}`,
      });
    }

    // 2. 巧合数超限（单章）
    if(state.coincidences > config.maxCoincidences){
      p0Issues.push({
        level: 'P0',
        type: 'coincidence_overflow',
        issue_desc: `本章巧合${state.coincidences}次（上限${config.maxCoincidences}），过度依赖巧合推进剧情`,
      });
    }

    // 3. 同类冲突超限
    for(const [conflictType, count] of Object.entries(state.conflicts)){
      if(count > config.maxSameConflict){
        p1Issues.push({
          level: 'P1',
          type: 'same_conflict_overflow',
          issue_desc: `同类冲突"${conflictType}"出现${count}次（上限${config.maxSameConflict}），冲突类型过于单一`,
        });
      }
    }

    // ===== P1 级违规（警告，不阻止落盘）=====

    // 4. 高潮冷却期出现新高潮
    if(novel.constraintState?.activeCooldown > 0 && state.hasClimax){
      p1Issues.push({
        level: 'P1',
        type: 'climax_cooldown_violation',
        issue_desc: `高潮冷却期内出现新的高潮事件，建议降速处理后果`,
      });
    }

    // 5. 新信息超限
    if(state.newInfo > config.maxNewInfoPerCh){
      p1Issues.push({
        level: 'P1',
        type: 'new_info_overflow',
        issue_desc: `本章引入${state.newInfo}个新信息（上限${config.maxNewInfoPerCh}），认知负荷过大`,
      });
    }

    // 6. 伏笔回收率检查（在收束期）
    const progress = (chapIdx + 1) / (novel.chapterCount || 10);
    if(progress > 0.8 && novel.memory?.foreshadowing){
      const total = novel.memory.foreshadowing.length;
      const resolved = novel.memory.foreshadowing.filter(f => f.status === 'resolved').length;
      const recoveryRate = total > 0 ? Math.round(resolved / total * 100) : 100;
      if(recoveryRate < config.foreshadowingRecoveryMin){
        p1Issues.push({
          level: 'P1',
          type: 'foreshadowing_recovery_low',
          issue_desc: `收束期伏笔回收率${recoveryRate}%（下限${config.foreshadowingRecoveryMin}%），剩余${total - resolved}条未回收`,
        });
      }
    }

    const allIssues = [...p0Issues, ...p1Issues];

    return {
      has_p0: p0Issues.length > 0,
      has_p1: p1Issues.length > 0,
      p0_issues: p0Issues,
      p1_issues: p1Issues,
      all_issues: allIssues,
    };
  },

  // 根据违规生成修复指令
  // 对标 Reference-php PostWriteValidator::generateFixDirective()
  generateFixDirective(violations){
    if(!violations || violations.length === 0) return [];

    const directives = [];

    for(const v of violations){
      const msg = v.issue_desc || v.message || String(v);
      const type = v.type || 'unknown';

      // P0 级生成紧急指令
      if(v.level === 'P0'){
        directives.push({
          type: 'urgent',
          directive: `【约束违规-P0】${msg}。下一章必须修正此问题`,
          applyRange: 2,
        });
      } else {
        directives.push({
          type: 'quality',
          directive: `【约束建议-P1】${msg}`,
          applyRange: 3,
        });
      }
    }

    return directives;
  },
};

window.ConstraintConfig = ConstraintConfig;
window.ConstraintState = ConstraintState;
window.PostWriteValidator = PostWriteValidator;
