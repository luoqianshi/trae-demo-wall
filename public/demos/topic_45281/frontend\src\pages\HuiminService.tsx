import React, { useState, useEffect } from "react";
import { Search, Calendar, CreditCard, Star, MapPin, Activity, User, Stethoscope, Pill, Hospital, CheckCircle, ChevronRight, X, Send, Loader2, Building, Clock, Phone, Syringe } from "lucide-react";
import type { Registration, Charge, Inpatient, Doctor, Patient, Department } from "@/lib/types";
import { registrationService, chargeService, inpatientService, doctorService, patientService, departmentService } from "@/lib/services";
import AnimatedPage from "@/components/ui/AnimatedPage";

const API = "/api";

const HuiminService: React.FC = () => {
  const [activeTab, setActiveTab] = useState("registration");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResult, setSearchResult] = useState<Patient | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const tabs = [
    { key: "registration", label: "挂号查询", icon: Calendar },
    { key: "payment", label: "缴费查询", icon: CreditCard },
    { key: "inpatient", label: "住院信息", icon: Hospital },
    { key: "evaluation", label: "满意度评价", icon: Star },
    { key: "tracking", label: "就诊追踪", icon: Activity },
  ];

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const patients = await patientService.getAll(searchKeyword);
      const found = Array.isArray(patients) ? patients.find(p =>
        p.name.includes(searchKeyword) || p.phone?.includes(searchKeyword) || p.hospitalId?.includes(searchKeyword)
      ) : null;
      setSearchResult(found || null);
    } catch (e) {
      console.error(e);
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">惠民服务</h1>
      </div>

      {/* 患者搜索 */}
      <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              placeholder="输入患者姓名、电话或医院ID查询..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute left-3 top-2.5 text-outline" size={18} />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            查询
          </button>
        </div>
        {searchResult && (
          <div className="mt-3 flex items-center gap-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{searchResult.name}</p>
              <p className="text-xs text-outline">
                {searchResult.gender} / {searchResult.age}岁
                {searchResult.phone && ` | ${searchResult.phone}`}
                {searchResult.hospitalId && ` | ID: ${searchResult.hospitalId}`}
              </p>
            </div>
            <span className="ml-auto text-xs text-outline">已选择该患者</span>
          </div>
        )}
        {hasSearched && searchKeyword && !searching && searchResult === null && (
          <p className="mt-2 text-sm text-red-400">未找到匹配的患者</p>
        )}
        {!hasSearched && !searchResult && (
          <p className="mt-2 text-sm text-outline flex items-center gap-1">
            <Search size={14} /> 请输入患者姓名、电话或医院ID，点击查询
          </p>
        )}
      </div>

      {/* 标签导航 */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent hover:text-on-surface-variant'
            }`}>
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "registration" && <RegistrationPanel searchResult={searchResult} />}
      {activeTab === "payment" && <PaymentPanel searchResult={searchResult} />}
      {activeTab === "inpatient" && <InpatientPanel searchResult={searchResult} />}
      {activeTab === "evaluation" && <EvaluationPanel searchResult={searchResult} />}
      {activeTab === "tracking" && <TrackingPanel searchResult={searchResult} />}
    </div>
  );
};

/* ========== 挂号查询 ========== */
const RegistrationPanel: React.FC<{ searchResult: Patient | null }> = ({ searchResult }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchResult) {
      setLoading(true);
      fetch(`/api/registrations?patientId=${searchResult.id}`)
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : (d.registrations || d.data || []);
          setRegistrations(list);
        })
        .catch(() => setRegistrations([]))
        .finally(() => setLoading(false));
    }
  }, [searchResult]);

  if (!searchResult) {
    return <div className="p-8 text-center text-outline"><Calendar size={48} className="mx-auto mb-3 opacity-30" /><p>请先查询选择患者</p></div>;
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-lg">挂号记录</h3>
        <span className="text-xs text-outline">{registrations.length} 条记录</span>
      </div>
      {registrations.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <Calendar size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无挂号记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant/10">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high text-xs font-label text-outline uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">科室</th>
                <th className="p-3 text-left">医生</th>
                <th className="p-3 text-left">挂号时间</th>
                <th className="p-3 text-left">费用</th>
                <th className="p-3 text-left">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {registrations.map((r, i) => (
                <tr key={r.id || i} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3">{r.dept || '-'}</td>
                  <td className="p-3 font-medium flex items-center gap-1">
                    <User size={14} className="text-primary" />
                    {r.doctorName || '-'}
                  </td>
                  <td className="p-3 text-xs">{r.regTime ? new Date(r.regTime).toLocaleString('zh-CN') : '-'}</td>
                  <td className="p-3 font-mono">¥{(r.regFee || 0).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded ${
                      r.regStatus === 'completed' ? 'bg-green-500/10 text-green-400' :
                      r.regStatus === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>{r.regStatus || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ========== 缴费查询 ========== */
const PaymentPanel: React.FC<{ searchResult: Patient | null }> = ({ searchResult }) => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchResult) {
      setLoading(true);
      fetch(`/api/charges?patientId=${searchResult.id}`)
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : (d.charges || d.data || []);
          setCharges(list);
        })
        .catch(() => setCharges([]))
        .finally(() => setLoading(false));
    }
  }, [searchResult]);

  if (!searchResult) {
    return <div className="p-8 text-center text-outline"><CreditCard size={48} className="mx-auto mb-3 opacity-30" /><p>请先查询选择患者</p></div>;
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  const totalFee = charges.reduce((s, c) => s + (c.totalFee || 0), 0);
  const paidAmount = charges.filter(c => c.status === 'paid').reduce((s, c) => s + (c.totalFee || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
          <div className="text-2xl font-bold text-primary">{charges.length}</div>
          <div className="text-xs text-outline mt-1">总缴费次数</div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
          <div className="text-2xl font-bold text-teal-400">¥{totalFee.toFixed(2)}</div>
          <div className="text-xs text-outline mt-1">总费用</div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
          <div className="text-2xl font-bold text-green-400">¥{paidAmount.toFixed(2)}</div>
          <div className="text-xs text-outline mt-1">已支付</div>
        </div>
      </div>
      {charges.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <CreditCard size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无缴费记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant/10">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high text-xs font-label text-outline uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">收费类型</th>
                <th className="p-3 text-left">金额</th>
                <th className="p-3 text-left">支付方式</th>
                <th className="p-3 text-left">收费时间</th>
                <th className="p-3 text-left">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {charges.map((c, i) => (
                <tr key={c.id || i} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3">{c.chargeType || '-'}</td>
                  <td className="p-3 font-mono">¥{(c.totalFee || 0).toFixed(2)}</td>
                  <td className="p-3">{c.paymentType || '-'}</td>
                  <td className="p-3 text-xs">{c.chargeTime ? new Date(c.chargeTime).toLocaleString('zh-CN') : '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded ${
                      c.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                      c.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>{c.status || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ========== 住院信息 ========== */
const InpatientPanel: React.FC<{ searchResult: Patient | null }> = ({ searchResult }) => {
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchResult) {
      setLoading(true);
      fetch(`/api/inpatients?patientId=${searchResult.id}`)
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : (d.items || d.inpatients || d.data || []);
          setInpatients(list);
        })
        .catch(() => setInpatients([]))
        .finally(() => setLoading(false));
    }
  }, [searchResult]);

  if (!searchResult) {
    return <div className="p-8 text-center text-outline"><Hospital size={48} className="mx-auto mb-3 opacity-30" /><p>请先查询选择患者</p></div>;
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="space-y-4">
      {inpatients.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <Hospital size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无住院记录</p>
        </div>
      ) : (
        inpatients.map((ip, i) => (
          <div key={ip.id || i} className="bg-surface-container-low rounded-lg border border-outline-variant/10 overflow-hidden">
            {/* 住院头部 */}
            <div className="bg-primary/5 p-4 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hospital size={20} className="text-primary" />
                <div>
                  <span className="font-bold text-sm">
                    住院记录 #{ip.inpatientNo || ip.id}
                  </span>
                  <span className={`ml-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded ${
                    ip.status === 'admitted' ? 'bg-blue-500/10 text-blue-400' :
                    ip.status === 'discharged' ? 'bg-green-500/10 text-green-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>{ip.status === 'admitted' ? '住院中' : ip.status === 'discharged' ? '已出院' : ip.status}</span>
                </div>
              </div>
            </div>

            {/* 住院位置信息 */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-outline" />
                <div>
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">科室</span>
                  <p className="text-sm font-medium">{ip.dept || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-outline" />
                <div>
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">床位</span>
                  <p className="text-sm font-medium">{ip.bedNo || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-outline" />
                <div>
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">主治医生</span>
                  <p className="text-sm font-medium">{ip.doctorName || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-outline" />
                <div>
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">入院时间</span>
                  <p className="text-sm font-medium">{ip.admissionDate ? new Date(ip.admissionDate).toLocaleString('zh-CN') : '-'}</p>
                </div>
              </div>
            </div>

            {/* 诊断和费用 */}
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {ip.diagnosis && (
                <div className="p-3 bg-surface-container-highest rounded">
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">诊断</span>
                  <p className="text-sm mt-1">{ip.diagnosis}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-surface-container-highest rounded">
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">押金</span>
                  <p className="text-sm mt-1 font-mono">¥{(ip.deposit || 0).toFixed(2)}</p>
                </div>
                <div className="p-3 bg-surface-container-highest rounded">
                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">总费用</span>
                  <p className="text-sm mt-1 font-mono">¥{(ip.totalFee || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* 出院信息 */}
            {ip.dischargeDate && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-green-500/5 rounded border border-green-500/20 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm">出院时间: {new Date(ip.dischargeDate).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

/* ========== 满意度评价 ========== */
const EvaluationPanel: React.FC<{ searchResult: Patient | null }> = ({ searchResult }) => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    evaluateType: '医生评价',
    targetId: 0,
    targetName: '',
    deptName: '',
    overallScore: 5,
    attitudeScore: 5,
    skillScore: 5,
    commentText: '',
    isAnonymous: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchResult) {
      setLoading(true);
      Promise.all([
        fetch(`/api/evaluations?type=&page=1&size=50`).then(r => r.json()),
        doctorService.getAll(),
        fetch(`/api/registrations?patientId=${searchResult.id}`).then(r => r.json()),
        fetch(`/api/inpatients?patientId=${searchResult.id}`).then(r => r.json()),
      ]).then(([evalsRes, docsRes, regsRes, inpsRes]) => {
        const evals = Array.isArray(evalsRes) ? evalsRes : (evalsRes.items || []);
        const filtered = evals.filter((e: any) => e.patientId === searchResult.id);
        setEvaluations(filtered);
        setDoctors(Array.isArray(docsRes) ? docsRes : []);
        const regs = Array.isArray(regsRes) ? regsRes : (regsRes.registrations || regsRes.data || []);
        setRegistrations(regs);
        const inps = Array.isArray(inpsRes) ? inpsRes : (inpsRes.items || inpsRes.inpatients || inpsRes.data || []);
        setInpatients(inps);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [searchResult]);

  const handleSubmit = async () => {
    if (!form.targetId || !form.targetName) return;
    setSubmitting(true);
    try {
      const body = {
        ...form,
        patientId: searchResult!.id,
        patientName: searchResult!.name,
        efficiencyScore: form.overallScore,
        environmentScore: form.overallScore,
      };
      await fetch(`/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setShowForm(false);
      setForm({ evaluateType: '医生评价', targetId: 0, targetName: '', deptName: '', overallScore: 5, attitudeScore: 5, skillScore: 5, commentText: '', isAnonymous: 0 });
      // 重新加载
      const res = await fetch(`/api/evaluations?type=&page=1&size=50`).then(r => r.json());
      const evals = Array.isArray(res) ? res : (res.items || []);
      setEvaluations(evals.filter((e: any) => e.patientId === searchResult!.id));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreStars = (score: number) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  if (!searchResult) {
    return <div className="p-8 text-center text-outline"><Star size={48} className="mx-auto mb-3 opacity-30" /><p>请先查询选择患者</p></div>;
  }

  const interactedDoctors = [
    ...registrations.map(r => ({ id: r.doctorId, name: r.doctorName, dept: r.dept, type: '医生' })),
    ...inpatients.map(ip => ({ id: ip.doctorId, name: ip.doctorName, dept: ip.dept, type: '医生' })),
  ].filter(d => d.id && d.name);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">我的评价</h3>
          <span className="text-xs text-outline">{evaluations.length} 条</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <Star size={16} /> 写评价
        </button>
      </div>

      {/* 评价统计 */}
      {evaluations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
            <div className="text-2xl font-bold text-yellow-500">{evaluations.length}</div>
            <div className="text-xs text-outline mt-1">总评价数</div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
            <div className="text-2xl font-bold text-yellow-500">
              {(evaluations.reduce((s, e) => s + (e.overallScore || 0), 0) / Math.max(evaluations.length, 1)).toFixed(1)}
            </div>
            <div className="text-xs text-outline mt-1">平均评分</div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
            <div className="text-lg font-bold text-yellow-500">{getScoreStars(5)}</div>
            <div className="text-xs text-outline mt-1">{evaluations.filter(e => e.overallScore === 5).length} 个五星</div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
            <div className="text-lg font-bold text-yellow-500">{getScoreStars(4)}</div>
            <div className="text-xs text-outline mt-1">{evaluations.filter(e => e.overallScore === 4).length} 个四星</div>
          </div>
        </div>
      )}

      {/* 评价列表 */}
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>
      ) : evaluations.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <Star size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无评价记录</p>
          <p className="text-xs mt-1">点击"写评价"对为您服务的医生进行评价</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((e, i) => (
            <div key={e.id || i} className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{e.targetName || '-'}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded">{e.evaluateType}</span>
                  {e.deptName && <span className="text-xs text-outline">{e.deptName}</span>}
                </div>
                <div className="text-yellow-500 text-sm">{getScoreStars(e.overallScore || 5)}</div>
              </div>
              {e.commentText && <p className="text-sm text-on-surface-variant mb-2">{e.commentText}</p>}
              <div className="flex items-center gap-3 text-[10px] text-outline">
                <span>{e.isAnonymous ? '匿名评价' : searchResult.name}</span>
                {e.createTime && <span>{new Date(e.createTime).toLocaleString('zh-CN')}</span>}
              </div>
              {e.replyText && (
                <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                  <span className="text-[10px] font-label text-outline">回复: </span>
                  {e.replyText}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 评价表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[520px] max-h-[90vh] overflow-auto space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><Star size={20} className="text-yellow-500" /> 写评价</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs font-label text-outline uppercase tracking-wider mb-1 block">评价对象</label>
              <select
                value={form.evaluateType}
                onChange={e => setForm(f => ({ ...f, evaluateType: e.target.value }))}
                className="w-full border rounded-lg p-2.5 text-sm"
              >
                <option value="医生评价">医生评价</option>
                <option value="护士评价">护士评价</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-label text-outline uppercase tracking-wider mb-1 block">选择{form.evaluateType === '医生评价' ? '医生' : '护士'}</label>
              <select
                value={form.targetId || ""}
                onChange={e => {
                  const selected = interactedDoctors.find(d => d.id === Number(e.target.value));
                  setForm(f => ({
                    ...f,
                    targetId: Number(e.target.value),
                    targetName: selected?.name || '',
                    deptName: selected?.dept || '',
                  }));
                }}
                className="w-full border rounded-lg p-2.5 text-sm"
              >
                <option value="">请选择</option>
                {interactedDoctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.dept})</option>
                ))}
              </select>
              {interactedDoctors.length === 0 && (
                <p className="text-xs text-red-400 mt-1">暂无已交互的医生记录，请先挂号就诊</p>
              )}
            </div>

            <div>
              <label className="text-xs font-label text-outline uppercase tracking-wider mb-1 block">总体评分</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, overallScore: s, attitudeScore: s, skillScore: s }))}
                    className={`text-2xl ${s <= form.overallScore ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}>
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-outline">{form.overallScore}分</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-label text-outline uppercase tracking-wider mb-1 block">评价内容</label>
              <textarea
                value={form.commentText}
                onChange={e => setForm(f => ({ ...f, commentText: e.target.value }))}
                placeholder="请描述您的就诊体验..."
                className="w-full border rounded-lg p-2.5 text-sm h-24 resize-none"
                maxLength={500}
              />
              <span className="text-[10px] text-outline">{form.commentText.length}/500</span>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="anonymous" checked={form.isAnonymous === 1}
                onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked ? 1 : 0 }))}
                className="rounded border-gray-300" />
              <label htmlFor="anonymous" className="text-sm text-outline">匿名评价</label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.targetId}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========== 就诊追踪 ========== */
const TrackingPanel: React.FC<{ searchResult: Patient | null }> = ({ searchResult }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchResult) {
      setLoading(true);
      Promise.all([
        fetch(`/api/registrations?patientId=${searchResult.id}`).then(r => r.json()),
        fetch(`/api/outpatient-medical-records?patientId=${searchResult.id}`).then(r => r.json()),
        fetch(`/api/prescriptions?patientId=${searchResult.id}`).then(r => r.json()),
        fetch(`/api/charges?patientId=${searchResult.id}`).then(r => r.json()),
        fetch(`/api/inpatients?patientId=${searchResult.id}`).then(r => r.json()),
      ]).then(([regsRes, mrsRes, prescsRes, chgsRes, inpsRes]) => {
        setRegistrations(Array.isArray(regsRes) ? regsRes : (regsRes.registrations || regsRes.data || []));
        setMedicalRecords(Array.isArray(mrsRes) ? mrsRes : (mrsRes.records || mrsRes.data || []));
        setPrescriptions(Array.isArray(prescsRes) ? prescsRes : (prescsRes.prescriptions || prescsRes.data || []));
        setCharges(Array.isArray(chgsRes) ? chgsRes : (chgsRes.charges || chgsRes.data || []));
        setInpatients(Array.isArray(inpsRes) ? inpsRes : (inpsRes.items || inpsRes.inpatients || inpsRes.data || []));
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [searchResult]);

  if (!searchResult) {
    return <div className="p-8 text-center text-outline"><Activity size={48} className="mx-auto mb-3 opacity-30" /><p>请先查询选择患者</p></div>;
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  const hasRegistered = registrations.length > 0;
  const hasDiagnosis = medicalRecords.length > 0;
  const hasPrescription = prescriptions.length > 0;
  const hasPaid = charges.some(c => c.status === 'paid');
  const hasAdmitted = inpatients.some(ip => ip.status === 'admitted');
  const hasDischarged = inpatients.some(ip => ip.status === 'discharged');

  const steps = [
    { label: '已挂号', done: hasRegistered, icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-500/10', desc: registrations.map(r => `${r.dept || ''} ${r.doctorName || ''}`).join('、') || '-' },
    { label: '已诊疗', done: hasDiagnosis, icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: `${medicalRecords.length} 次诊疗` },
    { label: '已开药', done: hasPrescription, icon: Pill, color: 'text-yellow-400', bg: 'bg-yellow-500/10', desc: `${prescriptions.length} 张处方` },
    { label: '已缴费', done: hasPaid, icon: CreditCard, color: 'text-teal-400', bg: 'bg-teal-500/10', desc: `¥${charges.filter(c => c.status === 'paid').reduce((s, c) => s + (c.totalFee || 0), 0).toFixed(2)}` },
    { label: '已住院', done: hasAdmitted, icon: Hospital, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: inpatients.filter(ip => ip.status === 'admitted').map(ip => `${ip.dept || ''} ${ip.bedNo || ''}`).join('、') || '-' },
    { label: '已出院', done: hasDischarged, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', desc: inpatients.filter(ip => ip.status === 'discharged').length > 0 ? '已完成治疗' : '-' },
  ];

  // 构建时间线
  const timeline: { time: Date; type: string; label: string; detail: string; doctor: string; icon: any; color: string }[] = [];
  registrations.forEach(r => {
    if (r.regTime) timeline.push({ time: new Date(r.regTime), type: 'registration', label: '挂号', detail: `${r.dept || ''} - ${r.doctorName || ''}`, doctor: r.doctorName || '-', icon: Calendar, color: 'text-orange-400 bg-orange-500/10' });
  });
  medicalRecords.forEach((mr: any) => {
    if (mr.visitDate || mr.createTime) {
      timeline.push({ time: new Date(mr.visitDate || mr.createTime), type: 'diagnosis', label: '诊疗', detail: mr.diagnosis || mr.chiefComplaint || '', doctor: mr.doctorName || '-', icon: Stethoscope, color: 'text-blue-400 bg-blue-500/10' });
    }
  });
  prescriptions.forEach((p: any) => {
    if (p.createTime || p.prescriptionDate) {
      timeline.push({ time: new Date(p.createTime || p.prescriptionDate), type: 'prescription', label: '开药', detail: `处方 #${p.id} - ¥${(p.totalPrice || p.totalAmount || 0).toFixed(2)}`, doctor: p.doctorName || '-', icon: Pill, color: 'text-yellow-400 bg-yellow-500/10' });
    }
  });
  charges.forEach(c => {
    if (c.chargeTime) timeline.push({ time: new Date(c.chargeTime), type: 'charge', label: '缴费', detail: `${c.chargeType || ''} - ¥${(c.totalFee || 0).toFixed(2)}`, doctor: '-', icon: CreditCard, color: 'text-teal-400 bg-teal-500/10' });
  });
  inpatients.forEach(ip => {
    if (ip.admissionDate) timeline.push({ time: new Date(ip.admissionDate), type: 'admission', label: '住院', detail: `${ip.dept || ''} - ${ip.bedNo || ''} 医生:${ip.doctorName || ''}`, doctor: ip.doctorName || '-', icon: Hospital, color: 'text-purple-400 bg-purple-500/10' });
    if (ip.dischargeDate) timeline.push({ time: new Date(ip.dischargeDate), type: 'discharge', label: '出院', detail: ip.dept || '', doctor: '-', icon: CheckCircle, color: 'text-green-400 bg-green-500/10' });
  });
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <div className="space-y-6">
      {/* 步骤追踪 */}
      <section className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/10">
        <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Activity size={16} /> 就诊步骤 / PATIENT STEPS
        </h4>
        <div className="flex flex-wrap gap-3">
          {steps.map((step, idx) => (
            <div key={step.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-full ${step.done ? step.bg : 'bg-outline-variant/5'} border ${step.done ? 'border-current/20' : 'border-outline-variant/10'}`}>
              <step.icon size={14} className={step.done ? step.color : 'text-outline'} />
              <span className={`text-xs font-bold uppercase tracking-tighter ${step.done ? step.color : 'text-outline'}`}>
                {step.label}
              </span>
              {idx < steps.length - 1 && <ChevronRight size={12} className="text-outline-variant" />}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-outline">
          当前状态: <span className="font-bold text-primary">
            {hasDischarged ? '已完成治疗' : hasAdmitted ? '住院中' : hasPaid ? '已缴费' : hasPrescription ? '已开药' : hasDiagnosis ? '诊疗中' : hasRegistered ? '已挂号' : '未就诊'}
          </span>
        </div>
      </section>

      {/* 时间线 */}
      <section className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/10">
        <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Activity size={16} /> 就诊时间线 / TIMELINE
        </h4>
        {timeline.length === 0 ? (
          <p className="text-sm text-outline p-4 bg-surface-container-highest rounded">暂无任何活动记录</p>
        ) : (
          <div className="space-y-0 relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-outline-variant/20"></div>
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-5 relative">
                <div className={`flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center z-10 ${item.color} border-2 border-surface-dim`}>
                  <item.icon size={16} />
                </div>
                <div className="flex-1 pt-1.5">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-sm uppercase tracking-tight">{item.label}</span>
                    <span className="text-[10px] font-label text-outline">{item.time.toLocaleString('zh-CN')}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{item.detail || '-'}</p>
                  {item.doctor !== '-' && (
                    <p className="text-[11px] font-label text-outline mt-0.5">
                      <User size={10} className="inline mr-1" />
                      医生: {item.doctor}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 住院位置信息 */}
      {inpatients.filter(ip => ip.status === 'admitted').length > 0 && (
        <section className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/10">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
            <MapPin size={16} /> 当前位置 / CURRENT LOCATION
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inpatients.filter(ip => ip.status === 'admitted').map((ip, i) => (
              <div key={i} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Hospital size={18} className="text-primary" />
                  <span className="font-bold text-sm">住院中</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-outline">科室</span>
                    <span className="font-medium">{ip.dept || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">床位</span>
                    <span className="font-medium">{ip.bedNo || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">主治医生</span>
                    <span className="font-medium">{ip.doctorName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">入院时间</span>
                    <span className="font-medium text-xs">{ip.admissionDate ? new Date(ip.admissionDate).toLocaleString('zh-CN') : '-'}</span>
                  </div>
                  {ip.diagnosis && (
                    <div className="flex justify-between">
                      <span className="text-outline">诊断</span>
                      <span className="font-medium text-right">{ip.diagnosis}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HuiminService;
