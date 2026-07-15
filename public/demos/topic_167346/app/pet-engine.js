/**
 * pet-engine.js · 宠物养成状态机
 *
 * 消费 firmware/protocol.md v1.0 事件，按 assets/pet/animations.md v0.1 状态机权威：
 *   - §1.1 4 态 pet_state ∈ {greet, happy, thirsty, idle}
 *   - §1.3 STATE_PRIORITY: abnormal > thirsty > satisfied > happy > greet > idle
 *   - §2.1 迁移矩阵（从 event × pet_state → 目标态）
 *   - §2.2 satisfied = happy 的内部变体（substate 字段）
 *   - §2.3 satisfied ≥ 5s 驻留后回落规则
 *   - §5.2 pre-react 4×4 适用矩阵
 *
 * 数值系统：
 *   - drink → storage.addDrink(delta_ml) → 检查 today_total ≥ 1500 && !milestone_fired
 *     → 若首次达标 → substate = satisfied + 触发 milestone hook
 *   - refill → storage.addRefill(added_ml)
 *
 * 时序常量（本 v0.2 内嵌，后续可提到 config）：
 *   GREET_HOLD_MS   3000  greet 3s 后自动 → idle
 *   IDLE_TIMEOUT_MS 60*60*1000  60min 无 drink → thirsty（PRD F-APP-4）
 *   SATISFIED_MS   5000  satisfied 单帧驻留 ≥ 5s
 *   MILESTONE_ML   1500  达标阈值（PRD F-E2E-1 + AC v1.1 §5.1）
 *
 * 事件驱动，不做 tick 轮询（内部只在 greet/satisfied/idle_timeout 用 setTimeout）
 */

export const MILESTONE_ML = 1500;
const GREET_HOLD_MS = 3000;
const SATISFIED_HOLD_MS = 5000;
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const SATISFIED_RECENT_DRINK_MS = 3 * 60 * 1000; // §2.3 回落"最近 3min 内有 drink"

/**
 * 内嵌 mock replay 用的 CUP_ABSENT_S · 生产走 protocol cup_removed
 * 本轮验收 6 要求 cup_lifted 长离切 thirsty；protocol 明示 cup_removed 才是"长离"事件
 * cup_lifted 只是抬起中间态，此处 pet-engine 消费 cup_removed 语义更精确
 */

export class PetEngine {
  constructor({ storage, onStateChange, onFxTrigger, onSay } = {}) {
    this.storage = storage;
    this.onStateChange = onStateChange || (() => {});
    this.onFxTrigger = onFxTrigger || (() => {});
    this.onSay = onSay || (() => {});

    this.pet_state = 'idle';
    this.substate = 'default'; // 'default' | 'satisfied'
    this.lastDrinkAt = null;
    this.satisfiedEntryAt = null;

    this._greetTimer = null;
    this._satisfiedTimer = null;
    this._idleTimeoutTimer = null;
    // P51 修复：达标时排队等 happy/default 6 帧播完后再进 satisfied（先欢呼再驻留）
    this._pendingMilestone = false;

    this._scheduleIdleTimeout();
  }

  /** 当前完整快照 */
  snapshot() {
    const s = this.storage ? this.storage.snapshot : {};
    return {
      pet_state: this.pet_state,
      substate: this.substate,
      today_total_ml: s.today_total_ml || 0,
      today_refill_ml: s.today_refill_ml || 0,
      milestone_fired_today: !!s.milestone_fired_today,
      lastDrinkAt: this.lastDrinkAt,
    };
  }

  /**
   * 处理一个 protocol 事件
   * @param {object} event {type, ...}
   */
  handle(event) {
    if (!event || !event.type) return;
    // 每次外部事件到来时检查跨零点（不依赖后台定时器，"应用醒来"时能发现）
    if (this.storage && this.storage.checkMidnight()) {
      this._forceIdle('midnight_rollover');
    }

    switch (event.type) {
      case 'drink':          return this._onDrink(event);
      case 'refill':         return this._onRefill(event);
      case 'cup_placed':     return this._onCupPlaced(event);
      case 'cup_removed':    return this._onCupRemoved(event);
      case 'cup_lifted':     return this._onCupLifted(event);
      case 'cup_changed':    return this._onCupChanged(event);
      case 'no_drink':       return this._onNoDrink(event);
      case 'abnormal':
      case 'error':          return this._onAbnormal(event);
      // state_transition / weight / heartbeat / calibration_* / tare_updated / recovery_done / instruction / system
      // 这些事件在 M2c 步 2 只做数据同步，不驱动 pet_state
      default:               return;
    }
  }

  // ============================================================
  // 事件处理
  // ============================================================

  _onDrink(evt) {
    const delta = Number.isFinite(evt.delta_ml) ? evt.delta_ml : 0;
    if (delta > 0 && this.storage) this.storage.addDrink(delta);

    this.lastDrinkAt = Date.now();
    this._scheduleIdleTimeout(); // 重置 60min 静默计时

    // 达标检查（§2.2 语义：首次跨过 1500ml → satisfied 变体，milestone_fired_today = true）
    const snap = this.storage ? this.storage.snapshot : { today_total_ml: 0, milestone_fired_today: false };
    const justHitMilestone =
      snap.today_total_ml >= MILESTONE_ML && !snap.milestone_fired_today;

    if (justHitMilestone) {
      if (this.storage) this.storage.markMilestone();
      // P51 修复：先切 happy/default 播欢呼 6 帧一次性 · 播完由 onSpriteLoopEnd 进 satisfied
      this._pendingMilestone = true;
      this._transition('happy', 'default');
      this.onFxTrigger('drink_bubble', { delta_ml: delta });
      this.onSay('happy');
    } else if (this.substate === 'satisfied') {
      // satisfied 期收到 drink → 保持 satisfied（§5.2 补充规则：不切帧、不 pre-react）
      // 但仍要显示 +Xml 气泡（数字气泡从皇冠上方弹出，§3.4）
      this.onFxTrigger('drink_bubble', { delta_ml: delta, above_crown: true });
      this.onSay('satisfied');
    } else {
      // 普通 drink：从任何态切 happy（§2.1 迁移矩阵）
      this._transition('happy', 'default');
      this.onFxTrigger('drink_bubble', { delta_ml: delta });
      this.onSay('happy');
    }
  }

  _onRefill(evt) {
    const added = Number.isFinite(evt.added_ml) ? evt.added_ml : 0;
    if (added > 0 && this.storage) this.storage.addRefill(added);

    // §2.1 特殊规则：
    //   idle/happy → happy + 爱心叠加
    //   thirsty → 强制 → happy（回应 tick 3 Q-APP-7）
    //   satisfied → 保持 satisfied + 爱心
    if (this.substate === 'satisfied') {
      this.onFxTrigger('refill_heart');
      return;
    }
    if (this.pet_state === 'thirsty' || this.pet_state === 'idle' || this.pet_state === 'happy' || this.pet_state === 'greet') {
      this._transition('happy', 'default');
    }
    this.onFxTrigger('refill_heart');
  }

  _onCupPlaced(evt) {
    // §2.1: idle/thirsty → greet；happy → greet（P50 修复：cup_placed 视为新交互 · 打断 happy 播放 · 语义"用户放回杯子，重新问候"）
    // satisfied 保持
    if (this.substate === 'satisfied') {
      this.onFxTrigger('cup_sign', { symbol: '!' });
      return;
    }
    if (this.pet_state === 'idle' || this.pet_state === 'thirsty' || this.pet_state === 'happy') {
      this._pendingMilestone = false; // P51: 打断 happy 也清 pending
      this._transition('greet', 'default');
    }
    this.onFxTrigger('cup_sign', { symbol: '!' });
    this.onSay('greet');
    this._scheduleGreetFallback();
  }

  _onCupRemoved(evt) {
    // §2.1: happy/satisfied/greet → idle（cup_removed 是长离）
    // idle/thirsty 保持
    if (this.substate === 'satisfied') {
      this._exitSatisfied();
      this._transition('idle', 'default');
      return;
    }
    if (this.pet_state === 'happy' || this.pet_state === 'greet') {
      this._pendingMilestone = false; // P51: 中途 remove 清 pending
      this._transition('idle', 'default');
    }
  }

  _onCupLifted(evt) {
    // §2.1 中 cup_lifted 未单独出现——由 spec §2 状态流保证：cup_lifted 只是过渡态
    // 保留钩子，Demo 阶段不改 pet_state
    this.onFxTrigger('cup_lift');
  }

  _onCupChanged(evt) {
    // §2.1: 各态均保持（不切 pet_state），叠加 "?"
    this.onFxTrigger('cup_sign', { symbol: '?' });
  }

  _onNoDrink(evt) {
    // AC v1.1 & animations 契约：no_drink 不入 today_total、宠物无 happy 反馈
    // 保持当前 pet_state 不变（应答 AC v1.1 §5.2 直签承诺）
  }

  _onAbnormal(evt) {
    // §1.3: abnormal 弹窗态，不改 pet_state（保持当前 sprite）
    this.onFxTrigger('abnormal', { message: evt.message || evt.reason });
  }

  /**
   * P50 修复：一次性 sprite 动画（loop=false · 如 greet/happy 6 帧）播完末帧后由 renderer 触发回落。
   *
   * 契约（本 tick 新增 · 需 DS 在 animations.md 下一版落地）：
   *   greet/default 播完 → 保持 greet（由 _greetTimer 3s 后 → idle 兜底 · animations §2.1 已定）
   *   happy/default 播完（且非 satisfied · 无 pending milestone）→ 立即 → idle
   *   happy/default 播完 + _pendingMilestone=true（P51） → 进 satisfied 变体驻留
   *   happy/satisfied → 由 _satisfiedTimer 管 5s 驻留 · 忽略本回调（satisfied sheet loop=true 也不会触发）
   *   其他态（idle/thirsty 循环态 loop=true）不会触发本回调
   */
  onSpriteLoopEnd({ state, substate }) {
    if (state === 'happy' && substate !== 'satisfied' && this.substate !== 'satisfied') {
      if (this.pet_state === 'happy') {
        // P51 修复：happy/default 播完 · 若刚跨达标线则进 satisfied · 否则回 idle
        if (this._pendingMilestone) {
          this._pendingMilestone = false;
          this._enterSatisfied();
          this.onFxTrigger('milestone_particles');
          this.onSay('satisfied');
        } else {
          this._transition('idle', 'default');
        }
      }
    }
    // greet 由 _scheduleGreetFallback 定时器负责，不在此重复
  }

  // ============================================================
  // 状态迁移基元
  // ============================================================

  _transition(nextState, nextSubstate) {
    const from = this.pet_state;
    const fromSub = this.substate;
    if (from === nextState && fromSub === nextSubstate) return;

    // 清理与 from 相关的定时器
    if (from === 'greet' && this._greetTimer) {
      clearTimeout(this._greetTimer);
      this._greetTimer = null;
    }
    if (fromSub === 'satisfied' && this._satisfiedTimer) {
      clearTimeout(this._satisfiedTimer);
      this._satisfiedTimer = null;
    }

    this.pet_state = nextState;
    this.substate = nextSubstate;
    this.onStateChange({ from, fromSub, to: nextState, toSub: nextSubstate });
  }

  _forceIdle(reason) {
    // 跨零点等强制回落
    this._exitSatisfied();
    if (this._greetTimer) { clearTimeout(this._greetTimer); this._greetTimer = null; }
    this._transition('idle', 'default');
    this.onFxTrigger('force_idle', { reason });
  }

  _scheduleGreetFallback() {
    if (this._greetTimer) clearTimeout(this._greetTimer);
    this._greetTimer = setTimeout(() => {
      this._greetTimer = null;
      if (this.pet_state === 'greet') this._transition('idle', 'default');
    }, GREET_HOLD_MS);
  }

  _scheduleIdleTimeout() {
    if (this._idleTimeoutTimer) clearTimeout(this._idleTimeoutTimer);
    this._idleTimeoutTimer = setTimeout(() => {
      this._idleTimeoutTimer = null;
      // §2.1: idle/happy → thirsty（idle_timeout）
      const snap = this.storage ? this.storage.snapshot : { today_total_ml: 0 };
      if (snap.today_total_ml < MILESTONE_ML) {
        if (this.substate === 'satisfied') return; // satisfied 保持
        this._transition('thirsty', 'default');
      }
    }, IDLE_TIMEOUT_MS);
  }

  _enterSatisfied() {
    // P20 修复：先记录 from（切之前的态），避免 onStateChange 里的 from 与 to 都是 happy
    const fromState = this.pet_state;
    const fromSub = this.substate;
    this.substate = 'satisfied';
    this.satisfiedEntryAt = Date.now();
    this.pet_state = 'happy';
    // 达标态优先级 = satisfied（高于 happy），进入即刻抢占任何进行中的定时器：
    if (this._greetTimer) { clearTimeout(this._greetTimer); this._greetTimer = null; }
    this.onStateChange({ from: fromState, fromSub, to: 'happy', toSub: 'satisfied' });

    if (this._satisfiedTimer) clearTimeout(this._satisfiedTimer);
    this._satisfiedTimer = setTimeout(() => {
      this._satisfiedTimer = null;
      this._satisfiedFallback();
    }, SATISFIED_HOLD_MS);
  }

  _satisfiedFallback() {
    // §2.3 回落规则
    const now = Date.now();
    const drinkRecent = this.lastDrinkAt && (now - this.lastDrinkAt) <= SATISFIED_RECENT_DRINK_MS;
    const drinkStale = !this.lastDrinkAt || (now - this.lastDrinkAt) > IDLE_TIMEOUT_MS;

    if (drinkRecent) {
      this.substate = 'default';
      this.onStateChange({ from: 'happy', fromSub: 'satisfied', to: 'happy', toSub: 'default' });
    } else if (drinkStale) {
      this.substate = 'default';
      this._transition('thirsty', 'default');
    } else {
      this.substate = 'default';
      this._transition('idle', 'default');
    }
  }

  _exitSatisfied() {
    if (this._satisfiedTimer) { clearTimeout(this._satisfiedTimer); this._satisfiedTimer = null; }
    this.substate = 'default';
  }

  // ============================================================
  // 调试接口
  // ============================================================

  debugForceTransition(state, sub = 'default') {
    this._transition(state, sub);
  }

  debugForceSatisfied() {
    if (this.storage) this.storage.debugSet({ today_total_ml: 1500 });
    this._enterSatisfied();
    this.onFxTrigger('milestone_particles');
  }

  destroy() {
    if (this._greetTimer) clearTimeout(this._greetTimer);
    if (this._satisfiedTimer) clearTimeout(this._satisfiedTimer);
    if (this._idleTimeoutTimer) clearTimeout(this._idleTimeoutTimer);
  }
}
