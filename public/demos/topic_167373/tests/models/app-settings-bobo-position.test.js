/**
 * AppSettings boboPosition 字段测试 (V0.2.0-fix)
 *
 * 覆盖：
 *  - 默认为 null
 *  - 解析合法 {x, y}
 *  - 缺字段 / 非数字 / NaN / Infinity → null
 *  - fromObject 还原
 *  - toObject 序列化
 *  - 与其它 V0.2.0 字段（boboEnabled/boboBubbleCount/boboHasMet）共存
 *  - appSettingsRepository 持久化往返
 */

if (typeof wx === 'undefined') {
  global.wx = {
    _storage: {},
    getStorageSync(k) { return this._storage[k] !== undefined ? this._storage[k] : ''; },
    setStorageSync(k, v) { this._storage[k] = v; },
    removeStorageSync(k) { delete this._storage[k]; },
    clearStorageSync() { this._storage = {}; },
    getStorageInfoSync() { return { keys: Object.keys(this._storage), currentSize: 0, limitSize: 10240 } }
  };
}

const AppSettings = require('../../data/models/app-settings.js');
const appSettingsRepository = require('../../data/repositories/app-settings-repository.js');
const boboPos = require('../../utils/bobo-position.js');

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { console.log('  ✓ ' + name); passed++; }
  else { console.error('  ✗ ' + name); failed++; }
}

console.log('\n=== V0.2.0-fix AppSettings.boboPosition 字段测试 ===');

wx.clearStorageSync();

// ===== 1. 默认值 =====
const d1 = new AppSettings();
assert(d1.boboPosition === null, '默认 boboPosition = null');

const d2 = AppSettings.fromObject(null);
assert(d2.boboPosition === null, 'fromObject(null) → boboPosition = null');

const d3 = AppSettings.fromObject({});
assert(d3.boboPosition === null, 'fromObject({}) → boboPosition = null');

// ===== 2. 合法值解析 =====
const s1 = new AppSettings({ boboPosition: { x: 100, y: 200 } });
assert(s1.boboPosition && s1.boboPosition.x === 100 && s1.boboPosition.y === 200, '合法 {x:100, y:200}');

const s2 = new AppSettings({ boboPosition: { x: 0, y: 0 } });
assert(s2.boboPosition.x === 0 && s2.boboPosition.y === 0, '合法 (0, 0)');

const s3 = new AppSettings({ boboPosition: { x: 558.5, y: 862.3 } });
assert(s3.boboPosition.x === 558.5 && s3.boboPosition.y === 862.3, '小数坐标保留');

// 字符串数字 → 转 Number
const s4 = new AppSettings({ boboPosition: { x: '300', y: '400' } });
assert(s4.boboPosition.x === 300 && s4.boboPosition.y === 400, '字符串数字转 Number');

// ===== 3. 非法值降级 =====
const i1 = new AppSettings({ boboPosition: { x: NaN, y: 100 } });
assert(i1.boboPosition === null, 'x=NaN → null');

const i2 = new AppSettings({ boboPosition: { x: 100, y: Infinity } });
assert(i2.boboPosition === null, 'y=Infinity → null');

const i3 = new AppSettings({ boboPosition: { x: -Infinity, y: 0 } });
assert(i3.boboPosition === null, 'x=-Infinity → null');

// 注：Number(null) === 0 是合法坐标，所以 (null, null) 不视为非法
const i4 = new AppSettings({ boboPosition: { x: null, y: null } });
assert(i4.boboPosition && i4.boboPosition.x === 0 && i4.boboPosition.y === 0, 'x/y 都是 null → (0, 0)（Number(null)=0 视为合法坐标）');

const i5 = new AppSettings({ boboPosition: { x: undefined, y: undefined } });
assert(i5.boboPosition === null, 'x/y 都是 undefined → null');

const i6 = new AppSettings({ boboPosition: { x: 100 } });
assert(i6.boboPosition === null, '缺 y → null');

const i7 = new AppSettings({ boboPosition: 'foo' });
assert(i7.boboPosition === null, '字符串 → null');

const i8 = new AppSettings({ boboPosition: 42 });
assert(i8.boboPosition === null, '数字 → null');

// ===== 4. fromObject 还原 =====
const raw1 = { boboPosition: { x: 50, y: 60 } };
const obj1 = AppSettings.fromObject(raw1);
assert(obj1.boboPosition.x === 50 && obj1.boboPosition.y === 60, 'fromObject 还原 boboPosition');

const raw2 = { boboPosition: null };
const obj2 = AppSettings.fromObject(raw2);
assert(obj2.boboPosition === null, 'fromObject({boboPosition: null}) → null');

const raw3 = { boboPosition: { x: 'foo', y: 'bar' } };
const obj3 = AppSettings.fromObject(raw3);
assert(obj3.boboPosition === null, 'fromObject 非数字 → null');

// ===== 5. toObject 序列化 =====
const s5 = new AppSettings({ boboPosition: { x: 300, y: 400 } });
const ser = s5.toObject();
assert(ser.boboPosition && ser.boboPosition.x === 300 && ser.boboPosition.y === 400, 'toObject 序列化 boboPosition');

const s6 = new AppSettings();
const ser2 = s6.toObject();
assert(ser2.boboPosition === null, 'toObject 序列化 null');

// 往返
const s7 = new AppSettings({ boboPosition: { x: 12, y: 34 } });
const round = AppSettings.fromObject(s7.toObject());
assert(round.boboPosition.x === 12 && round.boboPosition.y === 34, 'toObject→fromObject 往返一致');

// ===== 6. 与 V0.2.0 其它字段共存 =====
const s8 = new AppSettings({
  boboEnabled: false,
  boboBubbleCount: 0,
  boboHasMet: true,
  boboPosition: { x: 200, y: 300 }
});
assert(s8.boboEnabled === false, 'boboEnabled 共存');
assert(s8.boboBubbleCount === 0, 'boboBubbleCount=0 共存（不被 falsy 替换）');
assert(s8.boboHasMet === true, 'boboHasMet 共存');
assert(s8.boboPosition.x === 200 && s8.boboPosition.y === 300, 'boboPosition 共存');

// ===== 7. repository 持久化往返 =====
wx.clearStorageSync();
const r1 = appSettingsRepository.getSettings();
assert(r1.boboPosition === null, '仓库默认 boboPosition=null');

// 保存新位置
r1.boboPosition = { x: 123, y: 456 };
appSettingsRepository.saveSettings(r1);

const r2 = appSettingsRepository.getSettings();
assert(r2.boboPosition && r2.boboPosition.x === 123 && r2.boboPosition.y === 456, '保存后能读取 boboPosition');

// 校验：冷启动读出（getSettings 内部用 AppSettings.fromObject 还原）
const raw4 = r2.toObject();
wx.setStorageSync('pt_app_settings', raw4);
const r3 = appSettingsRepository.getSettings();
assert(r3.boboPosition.x === 123 && r3.boboPosition.y === 456, '冷启动 getSettings 还原 boboPosition');

// 模拟"无 boboPosition 字段"的老数据：手动改 storage 后 getSettings
wx.setStorageSync('pt_app_settings', { id: 1, boboEnabled: true });
const r4 = appSettingsRepository.getSettings();
assert(r4.boboPosition === null, '老数据（无 boboPosition 字段）→ null');

// ===== 8. 联动：bobo-position.js 工具能正确解析模型字段 =====
// 先把 boboPosition 重新写回 storage（上面 r4 把 storage 改成无 boboPosition）
wx.setStorageSync('pt_app_settings', r2.toObject());
const r5 = appSettingsRepository.getSettings();
const parsed = boboPos.parseBoboPosition(r5.boboPosition);
assert(parsed && parsed.x === 123 && parsed.y === 456, 'utils/bobo-position 解析 boboPosition 成功');

// 把 storage 改成 boboPosition=null 后再读
wx.setStorageSync('pt_app_settings', Object.assign({}, r2.toObject(), { boboPosition: null }));
const r6 = appSettingsRepository.getSettings();
const parsedNull = boboPos.parseBoboPosition(r6.boboPosition);
assert(parsedNull === null, 'utils/bobo-position 解析 null → null');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
