import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import countiesData from '../data/guangdong-counties.json';
import type {
  AiStatus,
  AiStatusResponse,
  MaterialIdentifyItem,
  MaterialIdentifyReply,
  MaterialIdentifyStatus,
  ReviewApiError,
  ReviewApiReply,
  ReviewApiRequest,
  ReviewApiResponse,
  ReviewItem,
  ReviewResult,
} from '../shared/api-types';
import {
  buildChecklistText,
  computeReadiness,
  DEMO_SCENARIOS,
  MATERIALS_WHITELIST,
  type DemoScenario,
} from '../shared/demo-flow';

// ====== 类型定义 ======
type ApplicantType = 'self' | 'family';
type LivingInGD = 'yes' | 'no';

interface CountyItem {
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  countyCode: string;
  countyName: string;
  countyType: string;
  isCountyLevelFallback: boolean;
  note: string;
}

interface CityGroup {
  cityCode: string;
  cityName: string;
  counties: CountyItem[];
}

interface ServiceItem {
  code: string;
  name: string;
  desc: string;
}

interface SituationForm {
  applicantType: ApplicantType | '';
  age: string;
  livingInGD: LivingInGD | '';
  notes: string;
}

/** 前端结果状态：AI 参与状态 + 提示 + 预审结果 */
interface ApiReviewState {
  status: AiStatus;
  message: string;
  review: ReviewResult;
}

/** 前端上传文件条目（含识别状态与建议） */
interface UploadFileItem {
  id: string;
  file: File;
  userLabel: string;
  suggestedMaterial: string;
  confidence: MaterialIdentifyItem['confidence'];
  status: MaterialIdentifyStatus;
  notes?: string;
}

type HealthState = 'checking' | 'ok' | 'error';

/** AI 配置状态展示状态 */
type AiConfigState =
  | { status: 'checking' }
  | { status: 'ok'; data: AiStatusResponse }
  | { status: 'error' };

// ====== 静态数据 ======
const SERVICES: ServiceItem[] = [
  { code: 'elderly-subsidy', name: '老年补贴申请材料预审', desc: '老年人补贴申请所需材料预审与整理' },
  { code: 'residence-permit', name: '居住证办理材料预审', desc: '居住证申领 / 签注材料预审' },
  { code: 'medical-reimburse', name: '医保报销材料整理', desc: '医疗费用报销材料核对与清单' },
];

// 材料白名单（来自 shared/demo-flow.ts，便于与演示场景/自检共用同一份）
const MATERIALS: string[] = [...MATERIALS_WHITELIST];

const STEPS = ['首页', '选择事项', '选择地区', '填写情况', '材料登记与结果'];
const TOTAL_STEPS = 5;

// 按地级市分组（从 JSON 派生，避免写死）
const COUNTY_LIST = countiesData as CountyItem[];
const CITY_GROUPS: CityGroup[] = (() => {
  const map = new Map<string, CityGroup>();
  for (const item of COUNTY_LIST) {
    let group = map.get(item.cityCode);
    if (!group) {
      group = { cityCode: item.cityCode, cityName: item.cityName, counties: [] };
      map.set(item.cityCode, group);
    }
    group.counties.push(item);
  }
  return Array.from(map.values());
})();

// AI 状态徽标文案
const AI_BADGE_TEXT: Record<AiStatus, string> = {
  success: 'AI 已参与预审',
  skipped: '未配置 API Key，显示本地规则结果',
  fallback: 'AI 调用失败，显示本地规则结果',
};

// ====== 主组件 ======
export default function App() {
  const [step, setStep] = useState(1);
  const [serviceCode, setServiceCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [countyCode, setCountyCode] = useState('');
  const [form, setForm] = useState<SituationForm>({
    applicantType: '',
    age: '',
    livingInGD: '',
    notes: '',
  });
  const [materials, setMaterials] = useState<string[]>([]);
  const [result, setResult] = useState<ApiReviewState | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>('checking');
  const [aiConfig, setAiConfig] = useState<AiConfigState>({ status: 'checking' });

  const countiesInCity = useMemo(() => {
    const g = CITY_GROUPS.find((c) => c.cityCode === cityCode);
    return g ? g.counties : [];
  }, [cityCode]);

  async function checkHealth() {
    setHealth('checking');
    try {
      const res = await fetch('/api/health');
      setHealth(res.ok ? 'ok' : 'error');
    } catch {
      setHealth('error');
    }
  }

  async function checkAiStatus() {
    setAiConfig({ status: 'checking' });
    try {
      const res = await fetch('/api/ai-status');
      if (!res.ok) {
        setAiConfig({ status: 'error' });
        return;
      }
      const data = (await res.json()) as AiStatusResponse;
      if (!data || typeof data.ok !== 'boolean') {
        setAiConfig({ status: 'error' });
        return;
      }
      setAiConfig({ status: 'ok', data });
    } catch {
      setAiConfig({ status: 'error' });
    }
  }

  useEffect(() => {
    void checkHealth();
    void checkAiStatus();
  }, []);

  function toggleMaterial(name: string) {
    setMaterials((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name],
    );
  }

  function selectCity(code: string) {
    setCityCode(code);
    setCountyCode('');
  }

  async function generateResult() {
    setLoading(true);
    setApiError(null);
    setResult(null);

    const county = COUNTY_LIST.find(
      (c) => c.countyCode === countyCode && c.cityCode === cityCode,
    );

    const body: ReviewApiRequest = {
      serviceCode,
      region: county
        ? {
            provinceName: county.provinceName,
            cityName: county.cityName,
            countyName: county.countyName,
          }
        : undefined,
      applicantType: form.applicantType || undefined,
      age: form.age === '' ? undefined : Number(form.age),
      livingInGD: form.livingInGD || undefined,
      materials,
    };

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ReviewApiReply;
      const okData = data as ReviewApiResponse;
      const errData = data as ReviewApiError;
      if (!okData.ok) {
        setApiError(errData.error ?? '预审请求失败');
      } else {
        setResult({
          status: okData.aiStatus,
          message: okData.aiMessage,
          review: okData.result,
        });
      }
    } catch (e) {
      setApiError(
        e instanceof Error ? e.message : '网络错误，请确认后端已启动',
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setServiceCode('');
    setCityCode('');
    setCountyCode('');
    setForm({ applicantType: '', age: '', livingInGD: '', notes: '' });
    setMaterials([]);
    setResult(null);
    setApiError(null);
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }
  function prev() {
    if (step > 1) setStep(step - 1);
  }

  /**
   * 一键演示：点击后自动填充 serviceCode / cityCode / countyCode /
   * applicantType / age / livingInGD / materials，并跳到第 5 步（材料登记与结果）。
   * 仍由用户在结果步骤点击"生成预审结果"触发 /api/review，不绕过正常流程。
   */
  function applyDemoScenario(s: DemoScenario) {
    setServiceCode(s.serviceCode);
    setCityCode(s.cityCode);
    setCountyCode(s.countyCode);
    setForm({
      applicantType: s.applicantType,
      age: String(s.age),
      livingInGD: s.livingInGD,
      notes: '',
    });
    setMaterials([...s.materials]);
    setResult(null);
    setApiError(null);
    setStep(5);
  }

  const canNext =
    step === 1 ||
    (step === 2 && serviceCode !== '') ||
    (step === 3 && cityCode !== '' && countyCode !== '') ||
    step === 4;

  // 结果页展示用上下文标签（从当前选择派生）
  const svc = SERVICES.find((s) => s.code === serviceCode);
  const county = COUNTY_LIST.find(
    (c) => c.countyCode === countyCode && c.cityCode === cityCode,
  );
  const applicantLabel =
    form.applicantType === 'self'
      ? '本人办理'
      : form.applicantType === 'family'
        ? '家属代办'
        : '未选择';

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">办事不跑空 CivicMate</h1>
        <p className="app__subtitle">AI 办事材料预审与陪办助手</p>
        <p className="app__stage">当前阶段：第 7 轮 · 本地演示闭环增强</p>
        <p className="app__notice">支持图片/PDF 上传与 AI 辅助识别（无 API Key 时仅保留用户标注，不影响预审）</p>
        <p className={`app__health app__health--${health}`}>
          后端状态：
          {health === 'checking' && '检测中…'}
          {health === 'ok' && '在线'}
          {health === 'error' && '离线（请启动后端）'}
        </p>
        <AiConfigBadge state={aiConfig} />
      </header>

      <StepIndicator current={step} />

      <section className="app__panel">
        {step === 1 && <HomeStep onApplyDemo={applyDemoScenario} />}
        {step === 2 && (
          <ServiceStep serviceCode={serviceCode} onSelect={setServiceCode} />
        )}
        {step === 3 && (
          <RegionStep
            cityCode={cityCode}
            countyCode={countyCode}
            countiesInCity={countiesInCity}
            onSelectCity={selectCity}
            onSelectCounty={setCountyCode}
          />
        )}
        {step === 4 && <FormStep form={form} onChange={setForm} />}
        {step === 5 && (
          <MaterialStep
            serviceCode={serviceCode}
            materials={materials}
            onToggle={toggleMaterial}
            result={result}
            loading={loading}
            apiError={apiError}
            serviceName={svc ? svc.name : '未选择'}
            regionLabel={
              county
                ? `${county.provinceName} / ${county.cityName} / ${county.countyName}`
                : '未选择'
            }
            applicantLabel={applicantLabel}
          />
        )}
      </section>

      <nav className="app__nav">
        {step > 1 && (
          <button className="btn btn--ghost" onClick={prev} disabled={loading}>
            上一步
          </button>
        )}
        {step < 5 && (
          <button className="btn btn--primary" onClick={next} disabled={!canNext || loading}>
            {step === 1 ? '开始' : '下一步'}
          </button>
        )}
        {step === 5 && !result && (
          <button
            className="btn btn--primary"
            onClick={generateResult}
            disabled={loading || !serviceCode}
          >
            {loading ? '预审中…' : '生成预审结果'}
          </button>
        )}
        {step === 5 && result && (
          <button className="btn btn--primary" onClick={reset}>
            重新开始
          </button>
        )}
      </nav>

      <footer className="app__footer">
        <span>第 7 轮 · 本地演示闭环增强 · 不代表官方审核通过</span>
      </footer>
    </main>
  );
}

// ====== AI 配置状态徽标（第 6-7 轮） ======
function AiConfigBadge({ state }: { state: AiConfigState }) {
  if (state.status === 'checking') {
    return <p className="app__aistatus">AI 配置检测中…</p>;
  }
  if (state.status === 'error') {
    return <p className="app__aistatus">AI 配置状态检查失败，不影响本地演示。</p>;
  }
  const { deepseek, ark } = state.data;
  // 演示文案：只展示能力可用性，不展示模型名 / baseUrl / key
  const dsLabel = deepseek.configured ? '预审增强可用' : '本地规则仍可演示';
  const arkLabel = ark.configured ? '图片识别可用' : '本地规则仍可演示';
  return (
    <p className="app__aistatus">
      DeepSeek：{dsLabel} ｜ Ark 视觉：{arkLabel}
    </p>
  );
}

// ====== 步骤指示器 ======
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="steps" role="list" aria-label="流程步骤">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const cls =
          n === current
            ? 'steps__item steps__item--active'
            : n < current
              ? 'steps__item steps__item--done'
              : 'steps__item';
        return (
          <div key={n} className={cls} role="listitem">
            <span className="steps__num">{n}</span>
            <span className="steps__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ====== 步骤 1：首页 ======
function HomeStep({
  onApplyDemo,
}: {
  onApplyDemo: (s: DemoScenario) => void;
}) {
  return (
    <div className="home">
      <h2 className="panel__title">欢迎使用 CivicMate</h2>
      <p className="panel__text">
        这是一个面向广东省办事场景的 AI 材料预审与陪办助手 Demo。完成以下几步即可生成材料预审结果：
      </p>
      <ul className="home__list">
        <li>选择办事事项</li>
        <li>选择广东地区（先选地级市，再选县级单位）</li>
        <li>填写用户情况</li>
        <li>登记材料并生成 AI 预审结果</li>
      </ul>
      <p className="panel__tip">
        提示：当前为第 7 轮，支持图片/PDF 材料上传与 AI 辅助识别、一键演示场景、复制/打印清单。图片识别优先使用 Ark 豆包视觉模型（需后端配置 ARK_API_KEY），文本预审/文本 fallback 使用 DeepSeek（需后端配置 DEEPSEEK_API_KEY）；未配置 Key 时仅保留用户手动标注，预审主流程不受影响。
      </p>

      <div className="demo">
        <p className="demo__title">一键演示场景（评委快速体验）</p>
        <p className="demo__hint">
          点击下方任一场景将自动填充事项/地区/情况/材料，并跳到第 5 步。仍需您点击"生成预审结果"触发预审。
        </p>
        <div className="demo__list">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="demo__entry"
              onClick={() => onApplyDemo(s)}
            >
              <span className="demo__entryTitle">{s.title}</span>
              <span className="demo__entryDesc">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====== 步骤 2：事项选择 ======
function ServiceStep({
  serviceCode,
  onSelect,
}: {
  serviceCode: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div>
      <h2 className="panel__title">选择办事事项</h2>
      <div className="cards">
        {SERVICES.map((s) => (
          <button
            key={s.code}
            type="button"
            className={`card ${serviceCode === s.code ? 'card--active' : ''}`}
            onClick={() => onSelect(s.code)}
          >
            <span className="card__name">{s.name}</span>
            <span className="card__desc">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ====== 步骤 3：地区选择（两级联动） ======
function RegionStep({
  cityCode,
  countyCode,
  countiesInCity,
  onSelectCity,
  onSelectCounty,
}: {
  cityCode: string;
  countyCode: string;
  countiesInCity: CountyItem[];
  onSelectCity: (code: string) => void;
  onSelectCounty: (code: string) => void;
}) {
  return (
    <div>
      <h2 className="panel__title">选择广东地区</h2>
      <p className="panel__tip">
        当前地区数据已完成第 2 轮联网核验，具体办事规则仍以官方窗口为准。
      </p>
      <div className="form">
        <div className="form__row">
          <label className="form__label" htmlFor="citySelect">
            地级市
          </label>
          <select
            id="citySelect"
            className="form__input"
            value={cityCode}
            onChange={(e) => onSelectCity(e.target.value)}
          >
            <option value="">请选择地级市</option>
            {CITY_GROUPS.map((c) => (
              <option key={c.cityCode} value={c.cityCode}>
                {c.cityName}
              </option>
            ))}
          </select>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="countySelect">
            县级单位
          </label>
          <select
            id="countySelect"
            className="form__input"
            value={countyCode}
            onChange={(e) => onSelectCounty(e.target.value)}
            disabled={cityCode === ''}
          >
            <option value="">
              {cityCode === '' ? '请先选择地级市' : '请选择县级单位'}
            </option>
            {countiesInCity.map((c) => (
              <option key={c.countyCode} value={c.countyCode}>
                {c.countyName}（{c.countyType}）
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ====== 步骤 4：用户情况表单 ======
function FormStep({
  form,
  onChange,
}: {
  form: SituationForm;
  onChange: (f: SituationForm) => void;
}) {
  function update<K extends keyof SituationForm>(key: K, value: SituationForm[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div>
      <h2 className="panel__title">填写用户情况</h2>
      <div className="form">
        <div className="form__row">
          <span className="form__label">办理人类型</span>
          <div className="form__radios">
            <label className="radio">
              <input
                type="radio"
                name="applicantType"
                checked={form.applicantType === 'self'}
                onChange={() => update('applicantType', 'self')}
              />
              <span>本人办理</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="applicantType"
                checked={form.applicantType === 'family'}
                onChange={() => update('applicantType', 'family')}
              />
              <span>家属代办</span>
            </label>
          </div>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="age">
            年龄
          </label>
          <input
            id="age"
            className="form__input"
            type="number"
            min={0}
            max={150}
            inputMode="numeric"
            value={form.age}
            onChange={(e) => update('age', e.target.value)}
            placeholder="请输入年龄"
          />
        </div>

        <div className="form__row">
          <span className="form__label">是否广东省内居住</span>
          <div className="form__radios">
            <label className="radio">
              <input
                type="radio"
                name="livingInGD"
                checked={form.livingInGD === 'yes'}
                onChange={() => update('livingInGD', 'yes')}
              />
              <span>是</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="livingInGD"
                checked={form.livingInGD === 'no'}
                onChange={() => update('livingInGD', 'no')}
              />
              <span>否</span>
            </label>
          </div>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="notes">
            备注说明
          </label>
          <textarea
            id="notes"
            className="form__textarea"
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="可补充说明办理人特殊情况（选填）"
          />
        </div>
      </div>
    </div>
  );
}

// ====== 步骤 5：材料登记 + 结果 ======
function MaterialStep({
  serviceCode,
  materials,
  onToggle,
  result,
  loading,
  apiError,
  serviceName,
  regionLabel,
  applicantLabel,
}: {
  serviceCode: string;
  materials: string[];
  onToggle: (name: string) => void;
  result: ApiReviewState | null;
  loading: boolean;
  apiError: string | null;
  serviceName: string;
  regionLabel: string;
  applicantLabel: string;
}) {
  return (
    <div>
      <h2 className="panel__title">材料登记</h2>
      <p className="panel__tip">勾选已具备的材料，或上传文件让 AI 辅助识别（上传非必填，识别失败不影响预审）。</p>
      <div className="materials">
        {MATERIALS.map((m) => (
          <label
            key={m}
            className={`material ${materials.includes(m) ? 'material--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={materials.includes(m)}
              onChange={() => onToggle(m)}
              disabled={loading}
            />
            <span>{m}</span>
          </label>
        ))}
      </div>

      <UploadArea
        serviceCode={serviceCode}
        materials={materials}
        onToggle={onToggle}
        disabled={loading}
      />

      {apiError && (
        <div className="result__risk" role="alert">
          <p className="result__blockTitle">请求失败</p>
          <ul className="result__plain">
            <li>{apiError}</li>
          </ul>
        </div>
      )}

      {result && (
        <ResultView
          result={result}
          serviceName={serviceName}
          regionLabel={regionLabel}
          applicantLabel={applicantLabel}
        />
      )}
    </div>
  );
}

// ====== 材料上传与识别区域（第 5-6 轮） ======
function UploadArea({
  serviceCode,
  materials,
  onToggle,
  disabled,
}: {
  serviceCode: string;
  materials: string[];
  onToggle: (name: string) => void;
  disabled: boolean;
}) {
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    // 限制最多 6 个（与后端一致），多余忽略
    const room = Math.max(0, 6 - files.length);
    const picked = Array.from(list).slice(0, room);
    if (picked.length < list.length) {
      setError(`最多上传 6 个文件，已忽略多余的 ${list.length - picked.length} 个。`);
    } else {
      setError(null);
    }
    const items: UploadFileItem[] = picked.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      userLabel: '',
      suggestedMaterial: '',
      confidence: 'unknown',
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...items]);
    e.target.value = '';
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function setLabel(id: string, label: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, userLabel: label } : f)),
    );
    // 同步勾选：只勾选不取消，避免误操作清空已有勾选
    if (label && !materials.includes(label)) onToggle(label);
  }

  function adoptSuggestion(id: string) {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const s = f.suggestedMaterial;
        if (s && !materials.includes(s)) onToggle(s);
        return { ...f, userLabel: s };
      }),
    );
  }

  async function identify() {
    if (files.length === 0 || !serviceCode) return;
    setIdentifying(true);
    setError(null);
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'identifying' as const })),
    );

    const fd = new FormData();
    files.forEach((f) => fd.append('files', f.file, f.file.name));
    fd.append('serviceCode', serviceCode);
    const labels: Record<string, string> = {};
    files.forEach((f) => {
      if (f.userLabel) labels[f.file.name] = f.userLabel;
    });
    if (Object.keys(labels).length > 0) {
      fd.append('userLabels', JSON.stringify(labels));
    }

    try {
      const res = await fetch('/api/identify-materials', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as MaterialIdentifyReply;
      if (!data.ok) {
        setError(data.error);
        setFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: 'failed' as const,
            notes: data.error,
          })),
        );
        return;
      }
      const byName = new Map<string, MaterialIdentifyItem>(
        data.items.map((i) => [i.fileName, i]),
      );
      setFiles((prev) =>
        prev.map((f) => {
          const r = byName.get(f.file.name);
          if (!r) {
            return { ...f, status: 'failed' as const, notes: '未返回识别结果' };
          }
          return {
            ...f,
            status: 'identified' as const,
            suggestedMaterial: r.suggestedMaterial ?? '',
            confidence: r.confidence,
            notes: r.notes,
          };
        }),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : '识别请求失败';
      setError(msg);
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'failed' as const, notes: msg })),
      );
    } finally {
      setIdentifying(false);
    }
  }

  return (
    <div className="upload">
      <p className="upload__title">上传材料文件（可选，用于 AI 辅助识别）</p>
      <p className="upload__privacy">
        图片材料优先发送至 Ark 豆包视觉模型识别，文本预审/fallback 使用 DeepSeek；未配置对应 Key 时仅基于文件名和用户标注辅助判断。本地服务端不长期保存文件。
      </p>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={onPick}
        disabled={disabled || identifying}
        className="upload__input"
      />
      {files.length > 0 && (
        <ul className="upload__list">
          {files.map((f) => (
            <UploadFileRow
              key={f.id}
              item={f}
              materials={materials}
              onRemove={removeFile}
              onSetLabel={setLabel}
              onAdopt={adoptSuggestion}
            />
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <button
          type="button"
          className="btn btn--ghost upload__action"
          onClick={identify}
          disabled={disabled || identifying || !serviceCode}
        >
          {identifying ? '识别中…' : 'AI 辅助识别材料'}
        </button>
      )}
      {!serviceCode && files.length > 0 && (
        <p className="upload__hint">请先在“选择事项”步骤选择事项，再进行识别。</p>
      )}
      {error && (
        <p className="upload__error" role="alert">
          识别失败：{error}（不影响生成预审结果）
        </p>
      )}
    </div>
  );
}

function UploadFileRow({
  item,
  materials,
  onRemove,
  onSetLabel,
  onAdopt,
}: {
  item: UploadFileItem;
  materials: string[];
  onRemove: (id: string) => void;
  onSetLabel: (id: string, label: string) => void;
  onAdopt: (id: string) => void;
}) {
  const statusText: Record<MaterialIdentifyStatus, string> = {
    pending: '待识别',
    identifying: '识别中',
    identified: '已识别',
    failed: '识别失败',
  };
  return (
    <li className="uploadRow">
      <div className="uploadRow__head">
        <span className="uploadRow__name" title={item.file.name}>
          {item.file.name}
        </span>
        <span className="uploadRow__size">{formatSize(item.file.size)}</span>
        <span className={`uploadRow__status uploadRow__status--${item.status}`}>
          {statusText[item.status]}
        </span>
        <button
          type="button"
          className="uploadRow__remove"
          onClick={() => onRemove(item.id)}
        >
          移除
        </button>
      </div>
      <div className="uploadRow__body">
        <div className="uploadRow__field">
          <span className="uploadRow__label">手动标注</span>
          <select
            className="form__input uploadRow__select"
            value={item.userLabel}
            onChange={(e) => onSetLabel(item.id, e.target.value)}
          >
            <option value="">未标注</option>
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        {item.suggestedMaterial && (
          <div className="uploadRow__suggestion">
            <span className="uploadRow__label">AI 建议：</span>
            <span className="uploadRow__suggested">{item.suggestedMaterial}</span>
            <span className="uploadRow__confidence">
              （置信度：{item.confidence}）
            </span>
            {item.userLabel !== item.suggestedMaterial && (
              <button
                type="button"
                className="uploadRow__adopt"
                onClick={() => onAdopt(item.id)}
              >
                采纳
              </button>
            )}
          </div>
        )}
        {item.notes && <p className="uploadRow__notes">{item.notes}</p>}
        {item.userLabel && materials.includes(item.userLabel) && (
          <p className="uploadRow__synced">已勾选材料：{item.userLabel}</p>
        )}
      </div>
    </li>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ====== 结果页：四块 + 风险提示 + 免责声明 ======
function ResultView({
  result,
  serviceName,
  regionLabel,
  applicantLabel,
}: {
  result: ApiReviewState;
  serviceName: string;
  regionLabel: string;
  applicantLabel: string;
}) {
  const { status, message, review } = result;
  const readiness = computeReadiness(review);
  const [copyHint, setCopyHint] = useState<{
    text: string;
    tone: 'ok' | 'error';
  } | null>(null);

  async function onCopy() {
    const text = buildChecklistText({
      serviceName,
      regionLabel,
      applicantLabel,
      review,
    });
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(text);
        setCopyHint({ text: '已复制到剪贴板', tone: 'ok' });
      } else {
        setCopyHint({
          text: '当前浏览器不支持剪贴板，请手动选择文本复制',
          tone: 'error',
        });
      }
    } catch {
      setCopyHint({
        text: '复制失败，请手动选择文本复制',
        tone: 'error',
      });
    }
  }

  function onPrint() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  return (
    <div className="result">
      <h3 className="result__title">预审结果</h3>
      <div className={`result__badge result__badge--${status}`}>
        {AI_BADGE_TEXT[status]}
      </div>
      <p className="result__aiMessage">{message}</p>

      <dl className="result__list">
        <div className="result__row">
          <dt>当前事项</dt>
          <dd>{serviceName}</dd>
        </div>
        <div className="result__row">
          <dt>当前地区</dt>
          <dd>{regionLabel}</dd>
        </div>
        <div className="result__row">
          <dt>办理人类型</dt>
          <dd>{applicantLabel}</dd>
        </div>
      </dl>

      <div
        className={`result__readiness ${
          readiness.missing > 0
            ? 'result__readiness--warn'
            : readiness.uncertain > 0
              ? 'result__readiness--warn'
              : 'result__readiness--ok'
        }`}
      >
        <p className="result__readinessLabel">
          办事准备度：{readiness.label}
        </p>
        <p className="result__readinessHint">{readiness.hint}</p>
        <p className="result__readinessCount">
          已具备 {readiness.ready} 项 · 缺失 {readiness.missing} 项 · 待确认{' '}
          {readiness.uncertain} 项
        </p>
      </div>

      <ResultBlock
        title="已具备材料"
        tone="ok"
        items={review.ready}
        emptyText="暂无已具备材料"
      />
      <ResultBlock
        title="缺失材料"
        tone="error"
        items={review.missing}
        emptyText="无缺失材料"
      />
      <ResultBlock
        title="待确认事项"
        tone="warn"
        items={review.uncertain}
        emptyText="无需额外确认"
      />

      <div className="result__block result__block--plain">
        <p className="result__blockTitle">老人友好清单</p>
        {review.plainChecklist.length > 0 ? (
          <ul className="result__plain">
            {review.plainChecklist.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <p className="result__empty">暂无清单</p>
        )}
      </div>

      {review.riskNotes.length > 0 && (
        <div className="result__risk">
          <p className="result__blockTitle">风险提示</p>
          <ul className="result__plain">
            {review.riskNotes.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result__actions">
        <button
          type="button"
          className="btn btn--ghost result__action"
          onClick={onCopy}
        >
          复制清单
        </button>
        <button
          type="button"
          className="btn btn--ghost result__action"
          onClick={onPrint}
        >
          打印页面
        </button>
      </div>
      {copyHint && (
        <p
          className={`result__actionHint result__actionHint--${copyHint.tone}`}
        >
          {copyHint.text}
        </p>
      )}

      <p className="result__disclaimer">免责声明：{review.disclaimer}</p>
      <p className="result__notice">
        本结果由 AI 与本地规则结合生成，仅供材料准备参考，不代表官方审核通过。正式办理请以办事机关要求为准。
      </p>
    </div>
  );
}

function ResultBlock({
  title,
  tone,
  items,
  emptyText,
}: {
  title: string;
  tone: 'ok' | 'error' | 'warn';
  items: ReviewItem[];
  emptyText: string;
}) {
  return (
    <div className={`result__block result__block--${tone}`}>
      <p className="result__blockTitle">{title}</p>
      {items.length > 0 ? (
        <ul className="result__items">
          {items.map((it, i) => (
            <li key={i}>
              <span className="result__itemName">{it.name}</span>
              {it.description && (
                <span className="result__itemDesc">{it.description}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="result__empty">{emptyText}</p>
      )}
    </div>
  );
}
