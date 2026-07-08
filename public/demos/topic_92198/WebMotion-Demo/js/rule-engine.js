/**
 * RuleEngine.js — 设计规则执行引擎
 * 将 skills/rules/ 中的文档规则转化为运行时代码检查
 * 违反规则时输出警告，不阻止渲染
 */

const RuleEngine = (function() {
  'use strict';

  const rules = [];
  const builtInRuleIds = new Set(); // 记录内置规则 id，reset() 据此保留它们
  let enabled = true;
  let violationCount = 0;
  const maxViolationsPerFrame = 10;

  /**
   * 注册规则
   * @param {{ id: string, name: string, check: Function, severity: 'warn'|'error' }} rule
   */
  function register(rule) {
    if (rules.find(r => r.id === rule.id)) return;
    rules.push(rule);
  }

  /**
   * 移除规则
   */
  function unregister(ruleId) {
    const idx = rules.findIndex(r => r.id === ruleId);
    if (idx >= 0) rules.splice(idx, 1);
  }

  /**
   * 运行时验证
   */
  function validate(ctx, canvasWidth, canvasHeight) {
    if (!enabled) return [];
    violationCount = 0;
    const violations = [];

    for (const rule of rules) {
      if (violationCount >= maxViolationsPerFrame) break;
      try {
        const result = rule.check(ctx, canvasWidth, canvasHeight);
        if (result && result.violated) {
          violations.push({ id: rule.id, name: rule.name, severity: rule.severity || 'warn', detail: result.detail });
          violationCount++;
          if (rule.severity === 'error') {
            console.error('[RuleEngine]', rule.name, ':', result.detail);
          } else {
            console.warn('[RuleEngine]', rule.name, ':', result.detail);
          }
        }
      } catch (e) {
        console.warn('[RuleEngine] Rule', rule.id, 'threw:', e);
      }
    }

    return violations;
  }

  function enable() { enabled = true; }
  function disable() { enabled = false; }
  function isEnabled() { return enabled; }
  // 注意：clear() 会清空所有规则（含内置规则 safe-zone/particle-limit/suite-diversity），且无法恢复。
  // 如需保留内置规则，请使用 reset()。
  function clear() { rules.length = 0; violationCount = 0; }

  /**
   * 重置：仅移除自定义规则，保留内置规则（safe-zone/particle-limit/suite-diversity）
   */
  function reset() {
    for (let i = rules.length - 1; i >= 0; i--) {
      if (!builtInRuleIds.has(rules[i].id)) {
        rules.splice(i, 1);
      }
    }
    violationCount = 0;
  }

  // ═══════════════════════════════════════════
  // 内置规则
  // ═══════════════════════════════════════════

  // 安全区规则
  register({
    id: 'safe-zone',
    name: '安全区检查',
    severity: 'warn',
    check: (ctx, w, h) => {
      const sz = Typography.safeZone(w, h);
      // 检查 HUD 区域是否与 Title Safe 重叠
      const pw = 480, ph = 160;
      const margin = Math.round(w * 0.025);
      const hudRect = { x: margin, y: margin, w: pw, h: ph };
      const titleRect = sz.title;

      const ox = Math.max(hudRect.x, titleRect.x);
      const oy = Math.max(hudRect.y, titleRect.y);
      const ow = Math.min(hudRect.x + hudRect.w, titleRect.x + titleRect.w) - ox;
      const oh = Math.min(hudRect.y + hudRect.h, titleRect.y + titleRect.h) - oy;

      if (ow > 0 && oh > 0) {
        return {
          violated: true,
          detail: 'HUD 面板与 Title Safe 区域重叠 ' + (ow * oh) + 'px²，建议调整面板位置'
        };
      }
      return { violated: false };
    }
  });

  // 粒子数量限制
  register({
    id: 'particle-limit',
    name: '粒子数量限制',
    severity: 'warn',
    check: (ctx, w, h) => {
      // 通过检查 ElementRegistry 中注册的元素数量来判断
      if (typeof ElementRegistry !== 'undefined') {
        const elements = ElementRegistry.getElements();
        const particleCount = (elements || []).filter(e => e.type === 'particle').length;
        if (particleCount > 200) {
          return {
            violated: true,
            detail: '粒子数量 ' + particleCount + ' 超过上限 200，建议减少粒子数量以提升性能'
          };
        }
      }
      return { violated: false };
    }
  });

  // 套件多样性检查
  register({
    id: 'suite-diversity',
    name: '套件多样性',
    severity: 'warn',
    check: (ctx, w, h) => {
      if (typeof SceneManager === 'undefined') return { violated: false };
      const scenes = SceneManager.getScenes();
      if (scenes.length < 2) return { violated: false };

      // 检查每个场景是否使用了不同的套件
      const suitesUsed = new Set();
      for (const s of scenes) {
        if (s.code && s.code.includes('gsap')) suitesUsed.add('gsap');
        if (s.code && s.code.includes('d3')) suitesUsed.add('d3');
        if (s.code && s.code.includes('flubber')) suitesUsed.add('flubber');
        if (s.code && s.code.includes('p5')) suitesUsed.add('p5');
        if (s.code && s.code.includes('anime')) suitesUsed.add('anime');
        if (s.is3D) suitesUsed.add('three');
      }

      const minSuites = scenes.length >= 5 ? 3 : scenes.length >= 3 ? 2 : 1;
      if (suitesUsed.size < minSuites) {
        return {
          violated: true,
          detail: '套件多样性不足: 使用了 ' + suitesUsed.size + ' 种套件，但最少需要 ' + minSuites + ' 种'
        };
      }
      return { violated: false };
    }
  });

  // 记录内置规则 id（注册完成后快照），reset() 据此保留内置规则
  builtInRuleIds.add('safe-zone');
  builtInRuleIds.add('particle-limit');
  builtInRuleIds.add('suite-diversity');

  return { register, unregister, validate, enable, disable, isEnabled, clear, reset, rules };
})();