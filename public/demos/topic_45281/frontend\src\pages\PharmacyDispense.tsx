import React, { useState, useEffect } from "react";
import { Pill, Search, CheckCircle, Eye, Loader2, Package, AlertTriangle, FileText, User, Clock, QrCode, Hourglass, ShieldCheck, Hash } from "lucide-react";
import { pharmacyService, patientService, drugService, prescriptionReviewService, registrationService } from "@/lib/services";
import type { Prescription, PrescriptionItem, Patient, Drug, PrescriptionReview, Registration } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedPage from "@/components/ui/AnimatedPage";

const PharmacyDispense: React.FC = () => {
  const { user } = useAuth();
  const operatorName = user?.name || '药师';
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [stockCheck, setStockCheck] = useState<{ canDispense: boolean; insufficientDrugs?: string[] } | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'prepared' | 'dispensed'>('pending');
  const [reviewOpinion, setReviewOpinion] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [preparedCount, setPreparedCount] = useState(0);
  const [dispensedCount, setDispensedCount] = useState(0);
  const [operationMessage, setOperationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const patientsRes = await fetch("/api/patients?size=99999");
      const patientsJson = await patientsRes.json();
      const [drugData, regData] = await Promise.all([
        drugService.getAll(),
        registrationService.getAll(),
      ]);
      setPatients(patientsJson.patients || []);
      setDrugs(drugData);
      setRegistrations(regData || []);
      const [pendingData, preparedData, dispensedData] = await Promise.all([
        pharmacyService.getPendingPrescriptions(),
        pharmacyService.getPreparedPrescriptions(),
        pharmacyService.getDispensedPrescriptions(),
      ]);
      setPendingCount(pendingData.length);
      setPreparedCount(preparedData.length);
      setDispensedCount(dispensedData.length);
    };
    init();
  }, []);

  useEffect(() => {
    const loadPrescriptions = async () => {
      setLoading(true);
      try {
        let data;
        if (activeTab === 'pending' || activeTab === 'prepared') {
          data = activeTab === 'pending'
            ? await pharmacyService.getPendingPrescriptions()
            : await pharmacyService.getPreparedPrescriptions();
        } else {
          data = await pharmacyService.getDispensedPrescriptions();
        }
        setPrescriptions(data);
      } catch (error) {
        console.error("加载处方失败:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPrescriptions();
  }, [activeTab]);

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.name || "未知";
  };

  const getPatientInfo = (patientId: number) => {
    return patients.find((p) => p.id === patientId);
  };

  const getDrugInfo = (drugId: number) => {
    return drugs.find((d) => d.id === drugId);
  };

  const getRegistration = (registrationId: number) => {
    return registrations.find(r => r.id === registrationId);
  };

  const getDrugNames = (presc: Prescription) => {
    if (!presc.items || presc.items.length === 0) {
      return "点击查看药品";
    }
    return presc.items.map(item => item.drugName || `药品#${item.drugId}`).join("、");
  };

  const handleViewDetail = async (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setReviewStatus('pending');
    setReviewOpinion('');
    setOperationMessage(null);
    try {
      const [items, check, reviews] = await Promise.all([
        pharmacyService.getPrescriptionItems(prescription.id),
        pharmacyService.checkStock(prescription.id),
        prescriptionReviewService.getByPrescriptionId(prescription.id).catch(() => []),
      ]);
      setPrescriptionItems(items);
      setStockCheck(check);
      if (reviews && reviews.length > 0) {
        const latest = reviews[reviews.length - 1];
        setReviewStatus(latest.rectifyStatus === 'approved' ? 'approved' : 'rejected');
        setReviewOpinion(latest.reviewOpinion || '');
      }
      setShowDetailDialog(true);
    } catch (error) {
      console.error("加载处方明细失败:", error);
    }
  };

  const handleSubmitReview = async (status: 'approved' | 'rejected') => {
    if (!selectedPrescription) return;
    try {
      await prescriptionReviewService.add({
        prescriptionId: selectedPrescription.id,
        reviewType: 'manual',
        reviewer: operatorName,
        reviewOpinion: reviewOpinion || (status === 'approved' ? '审核通过' : '审核驳回'),
        rectifyStatus: status,
      });
      setReviewStatus(status);
      alert(status === 'approved' ? '处方审核通过，可以发药' : '处方已驳回');
    } catch (error) {
      console.error("提交审核失败:", error);
      alert("提交审核失败");
    }
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;

    if (reviewStatus === 'pending') {
      setOperationMessage({ type: 'error', text: '请先完成处方审核后再发药' });
      return;
    }
    if (reviewStatus === 'rejected') {
      setOperationMessage({ type: 'error', text: '该处方已被审核驳回，无法发药' });
      return;
    }

    if (stockCheck && !stockCheck.canDispense) {
      setOperationMessage({
        type: 'error',
        text: `库存不足：${stockCheck.insufficientDrugs?.join("、") || '请补货后重试'}`,
      });
      return;
    }

    setDispensing(true);
    try {
      const result = await pharmacyService.dispense(selectedPrescription.id, operatorName);
      const [pendingData, preparedData, dispensedData, drugData] = await Promise.all([
        pharmacyService.getPendingPrescriptions(),
        pharmacyService.getPreparedPrescriptions(),
        pharmacyService.getDispensedPrescriptions(),
        drugService.getAll(),
      ]);
      setPendingCount(pendingData.length);
      setPreparedCount(preparedData.length);
      setDispensedCount(dispensedData.length);
      setDrugs(drugData);
      setPrescriptions(
        activeTab === 'pending' ? pendingData : activeTab === 'prepared' ? preparedData : dispensedData
      );
      setOperationMessage({
        type: 'success',
        text: result.message || '发药成功，库存已自动扣减',
      });
      setShowDetailDialog(false);
      setSelectedPrescription(null);
      setPrescriptionItems([]);
      setStockCheck(null);
    } catch (error) {
      console.error("发药失败:", error);
      setOperationMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '发药失败，请重试',
      });
    } finally {
      setDispensing(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const patientName = getPatientName(p.patientId);
    const reg = getRegistration(p.registrationId);
    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm) ||
      (reg && reg.id.toString().includes(searchTerm))
    );
  });

  const totalAmount = filteredPrescriptions.reduce((sum, p) => sum + p.totalPrice, 0);

  const getPriorityDisplay = (presc: Prescription) => {
    const patient = getPatientInfo(presc.patientId);
    if (patient?.allergyHistory && patient.allergyHistory !== "无" && patient.allergyHistory !== "无过敏史") {
      return { label: "紧急", color: "secondary", pulse: true };
    }
    return { label: "常规", color: "tertiary", pulse: false };
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-dim">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-outline-variant/20 pb-6">
          <div>
            <h1 className="font-headline font-bold text-4xl text-primary tracking-tighter uppercase">药房 / PHARMACY</h1>
            <p className="text-on-surface-variant font-label text-sm mt-1 tracking-widest uppercase">基于挂号ID发药 · 已收费处方 · 库存管理</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-low px-4 py-2 border-l-2 border-primary-fixed-dim">
              <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">当前负载</span>
              <span className="text-xl font-headline font-semibold text-primary-fixed-dim">{filteredPrescriptions.length} 待处理</span>
            </div>
            <div className="bg-surface-container-low px-4 py-2 border-l-2 border-tertiary-fixed-dim">
              <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">冷链温度</span>
              <span className="text-xl font-headline font-semibold text-tertiary-fixed-dim">3.4°C COLD CHAIN</span>
            </div>
          </div>
        </header>

        {operationMessage && (
          <div
            className={`border px-4 py-3 text-sm font-label ${
              operationMessage.type === 'success'
                ? 'bg-tertiary-container/10 border-tertiary/30 text-tertiary'
                : 'bg-secondary-container/10 border-secondary/30 text-secondary'
            }`}
          >
            {operationMessage.text}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-7 space-y-6">
            <div className="flex items-center gap-4 bg-surface-container-low p-1">
              <button 
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-3 text-xs font-headline font-bold tracking-widest uppercase transition-all ${activeTab === 'pending' ? 'bg-primary-container text-on-primary' : 'text-slate-400 hover:bg-white/5'}`}
              >
                待发药 ({pendingCount})
              </button>
              <button 
                onClick={() => setActiveTab('prepared')}
                className={`flex-1 py-3 text-xs font-headline font-bold tracking-widest uppercase transition-all ${activeTab === 'prepared' ? 'bg-primary-container text-on-primary' : 'text-slate-400 hover:bg-white/5'}`}
              >
                已配药 ({preparedCount})
              </button>
              <button 
                onClick={() => setActiveTab('dispensed')}
                className={`flex-1 py-3 text-xs font-headline font-bold tracking-widest uppercase transition-all ${activeTab === 'dispensed' ? 'bg-primary-container text-on-primary' : 'text-slate-400 hover:bg-white/5'}`}
              >
                已发药 ({dispensedCount})
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索患者/处方号/挂号ID..."
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded pl-10 pr-4 py-2.5 text-xs focus:border-primary/50 focus:outline-none transition-all"
              />
            </div>

            <div className="bg-surface-container border border-outline-variant/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant/30">
                    <th className="px-6 py-4 text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">处方号</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">挂号ID</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">患者姓名</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">药品信息</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">开方医生</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">优先级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="motion-row" style={{ animationDelay: `${Math.min(i * 20, 120)}ms` }}>
                        <td className="px-6 py-5"><div className="h-3 w-20 motion-skeleton rounded-full" /></td>
                        <td className="px-6 py-5"><div className="h-5 w-14 motion-skeleton rounded-md" /></td>
                        <td className="px-6 py-5"><div className="h-3 w-24 motion-skeleton rounded-full" /></td>
                        <td className="px-6 py-5"><div className="h-3 w-40 motion-skeleton rounded-full" /></td>
                        <td className="px-6 py-5"><div className="h-3 w-20 motion-skeleton rounded-full" /></td>
                        <td className="px-6 py-5"><div className="h-3 w-16 motion-skeleton rounded-full" /></td>
                      </tr>
                    ))
                  ) : filteredPrescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-outline">
                        <Pill className="mx-auto mb-4 opacity-50" size={48} />
                        <p className="font-headline uppercase tracking-widest">暂无待发药处方</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPrescriptions.map((presc, index) => {
                      const priority = getPriorityDisplay(presc);
                      const isSelected = selectedPrescription?.id === presc.id;
                      const reg = getRegistration(presc.registrationId);
                      return (
                        <tr 
                          key={presc.id} 
                          onClick={() => handleViewDetail(presc)}
                          className={`motion-row cursor-pointer group transition-colors ${isSelected ? 'bg-primary-container/5 border-l-4 border-primary' : 'hover:bg-primary/5'}`}
                          style={{ animationDelay: `${Math.min(index * 20, 120)}ms` }}
                        >
                          <td className="px-6 py-5 font-label text-primary-fixed-dim font-bold">RX-{presc.id.toString().padStart(5, '0')}</td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              #{presc.registrationId}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-body font-semibold text-on-surface">{getPatientName(presc.patientId)}</div>
                            <div className="text-[10px] text-slate-500 font-label">PID: {presc.patientId.toString().padStart(3, '0')}</div>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant max-w-[200px]">
                            <div className="truncate" title={getDrugNames(presc)}>{getDrugNames(presc)}</div>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant">{presc.doctorName || "-"}</td>
                          <td className="px-6 py-5">
                            <span className={`inline-block w-2 h-2 rounded-full ${priority.color === 'secondary' ? 'bg-secondary' : 'bg-tertiary'}`}></span>
                            <span className={`text-[10px] font-headline font-bold uppercase ml-2 tracking-tighter ${priority.color === 'secondary' ? 'text-secondary' : 'text-tertiary'}`}>{priority.label}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-low p-4 border-t border-outline-variant/20">
                <span className="text-[10px] font-headline text-slate-500 uppercase">AVG DISPENSE TIME</span>
                <div className="text-2xl font-headline font-bold text-primary-fixed-dim">4.2 MIN</div>
              </div>
              <div className="bg-surface-container-low p-4 border-t border-outline-variant/20">
                <span className="text-[10px] font-headline text-slate-500 uppercase">库存检查</span>
                <div className="text-2xl font-headline font-bold text-tertiary">98.4%</div>
              </div>
              <div className="bg-surface-container-low p-4 border-t border-outline-variant/20">
                <span className="text-[10px] font-headline text-slate-500 uppercase">活跃警报 / ALERTS</span>
                <div className="text-2xl font-headline font-bold text-secondary">0{drugs.filter(d => d.stock < 100).length}</div>
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-5 space-y-6">
            <div className="motion-card bg-card rounded-xl border border-border p-6 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30"></div>
              
              {selectedPrescription ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-headline font-bold text-primary tracking-widest uppercase">当前审核</span>
                      <h2 className="text-2xl font-headline font-extrabold text-on-surface mt-1">
                        RX-{selectedPrescription.id.toString().padStart(5, '0')}: {getPatientName(selectedPrescription.patientId)}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          挂号 #{selectedPrescription.registrationId}
                        </span>
                        {getRegistration(selectedPrescription.registrationId) && (
                          <span className="text-[10px] text-slate-500">
                            {getRegistration(selectedPrescription.registrationId)?.dept}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center border border-outline-variant bg-surface-container-highest">
                      <QrCode className="text-primary-fixed-dim" size={24} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {prescriptionItems.map((item) => {
                      const drug = getDrugInfo(item.drugId);
                      const stockLevel = drug?.stock || 0;
                      const isLowStock = stockLevel < 10;
                      return (
                        <div key={item.id} className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
                          <div className="flex-1">
                            <h3 className="font-headline font-bold text-primary text-lg">{drug?.name || `药品#${item.drugId}`}</h3>
                            <p className="text-xs text-on-surface-variant font-label">剂量: {drug?.spec || '-'} | 数量: {item.num}</p>
                            <p className={`text-xs font-label mt-1 ${isLowStock ? 'text-error' : 'text-tertiary'}`}>
                              库存: {stockLevel} 单位
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`block text-[10px] font-label uppercase ${isLowStock ? 'text-error' : 'text-tertiary'}`}>
                              {isLowStock ? '库存不足' : '库存充足'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4 bg-surface-container-low p-4 border-l-2 border-primary/40">
                    <h4 className="text-[10px] font-headline font-bold text-primary tracking-widest uppercase mb-4">库存分配状态</h4>
                    {prescriptionItems.slice(0, 3).map((item) => {
                      const drug = getDrugInfo(item.drugId);
                      const stockLevel = drug?.stock || 0;
                      const maxStock = 1000;
                      const percentage = Math.min((stockLevel / maxStock) * 100, 100);
                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-label uppercase">
                            <span className="text-on-surface-variant">{drug?.name || `药品#${item.drugId}`}</span>
                            <span className={stockLevel < 100 ? 'text-secondary' : 'text-primary'}>{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-1 bg-surface-container-highest w-full">
                            <div 
                              className={`h-full ${stockLevel < 100 ? 'bg-secondary-container' : 'bg-primary'}`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {stockCheck && !stockCheck.canDispense && (
                    <div className="bg-secondary-container/10 p-4 border border-secondary/20 flex gap-3">
                      <AlertTriangle className="text-secondary shrink-0" size={20} />
                      <div>
                        <p className="text-xs font-bold text-secondary uppercase tracking-tight">系统警告: 库存不足</p>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed italic">
                          以下药品库存不足：{stockCheck.insufficientDrugs?.join("、")}
                        </p>
                      </div>
                    </div>
                  )}

                  {stockCheck && stockCheck.canDispense && (
                    <div className="bg-tertiary-container/10 p-4 border border-tertiary/20 flex gap-3">
                      <CheckCircle className="text-tertiary shrink-0" size={20} />
                      <div>
                        <p className="text-xs font-bold text-tertiary uppercase tracking-tight">库存检查通过</p>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed italic">
                          所有药品库存充足，可以发药
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 bg-surface-container-low p-4 border-l-2 border-primary/40">
                    <h4 className="text-[10px] font-headline font-bold text-primary tracking-widest uppercase mb-3 flex items-center gap-2">
                      <ShieldCheck size={14} />
                      处方审核 / PRESCRIPTION REVIEW
                    </h4>
                    {reviewStatus === 'pending' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-on-surface-variant">该处方尚未审核，请药师进行审核确认</p>
                        <textarea
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs resize-none"
                          rows={2}
                          placeholder="审核意见（可选）..."
                          value={reviewOpinion}
                          onChange={(e) => setReviewOpinion(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmitReview('approved')}
                            className="flex-1 bg-green-500/20 text-green-400 py-2 text-xs font-headline font-bold tracking-widest hover:bg-green-500/30 transition-all rounded"
                          >
                            ✓ 通过审核
                          </button>
                          <button
                            onClick={() => handleSubmitReview('rejected')}
                            className="flex-1 bg-red-500/20 text-red-400 py-2 text-xs font-headline font-bold tracking-widest hover:bg-red-500/30 transition-all rounded"
                          >
                            ✗ 驳回处方
                          </button>
                        </div>
                      </div>
                    ) : reviewStatus === 'approved' ? (
                      <div className="bg-green-500/10 p-3 border border-green-500/20 flex gap-2 items-start">
                        <ShieldCheck className="text-green-400 shrink-0" size={16} />
                        <div>
                          <p className="text-xs font-bold text-green-400">✓ 审核通过</p>
                          {reviewOpinion && <p className="text-[11px] text-green-400/70 mt-1">{reviewOpinion}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-500/10 p-3 border border-red-500/20 flex gap-2 items-start">
                        <AlertTriangle className="text-red-400 shrink-0" size={16} />
                        <div>
                          <p className="text-xs font-bold text-red-400">✗ 已驳回</p>
                          {reviewOpinion && <p className="text-[11px] text-red-400/70 mt-1">{reviewOpinion}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="relative">
                      <button 
                        onClick={handleDispense}
                        disabled={dispensing || (stockCheck && !stockCheck.canDispense)}
                        className="motion-press relative w-full bg-primary text-primary-foreground py-4 font-headline font-extrabold tracking-[0.12em] uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg"
                      >
                        {dispensing && <Loader2 className="animate-spin" size={18} />}
                        {dispensing ? "发药中..." : "确认发药"}
                      </button>
                    </div>
                    <button className="motion-press w-full border border-outline-variant text-on-surface-variant py-3 font-label text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors">
                      仅打印标签
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Pill className="mx-auto text-outline mb-4" size={48} />
                  <h3 className="font-headline text-lg text-outline uppercase tracking-widest">选择处方开始发药</h3>
                  <p className="text-sm text-outline/60 mt-2">从左侧列表中选择已收费处方进行审核发药</p>
                </div>
              )}
            </div>

            <div className="motion-card relative bg-surface-container overflow-hidden rounded-xl border border-border">
              <div className="w-full h-48 bg-gradient-to-br from-primary/5 to-tertiary/5 flex items-center justify-center">
                <Package className="text-primary/40 transition-colors" size={64} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <p className="text-[10px] font-label text-primary uppercase tracking-[0.3em]">模块-04 状态</p>
                <p className="text-lg font-headline font-bold">自动发药机已激活</p>
              </div>
              <div className="absolute top-4 right-4 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-tertiary"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 left-64 right-0 h-8 bg-surface-container-lowest border-t border-outline-variant/10 px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-tertiary rounded-full"></span>
            <span className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">数据库同步: 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary"></span>
            <span className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">机器人API: 正常</span>
          </div>
        </div>
        <div className="text-[9px] font-label text-slate-500 uppercase">
          最后刷新: <span className="text-on-surface">{new Date().toLocaleTimeString()}</span> | 操作员: SENTINEL-01
        </div>
      </footer>
    </div>
  );
};

export default PharmacyDispense;
