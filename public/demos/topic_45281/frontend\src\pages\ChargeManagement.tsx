import React, { useState, useEffect } from "react";
import { CreditCard, Search, CheckCircle, RotateCcw, Eye, Loader2, FileText, AlertCircle, AlertTriangle, Receipt, Plus, Landmark, History, RefreshCw, ChevronRight, Hourglass, User, Hash } from "lucide-react";
import { prescriptionService, chargeService, patientService, doctorWorkstationService, registrationService, prescriptionExaminationService, surgeryService, auditLogService } from "@/lib/services";
import type { Prescription, Charge, Patient, Surgery, Registration } from "@/lib/types";
import PaymentMethodSelector from "@/components/ui/PaymentMethodSelector";
import type { PaymentType } from "@/components/ui/PaymentMethodSelector";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedPage from "@/components/ui/AnimatedPage";

const PAYMENT_LABELS: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '银行卡',
  insurance: '医保',
};

const getPaymentLabel = (type?: string) => PAYMENT_LABELS[type || ''] || type || '-';

const ChargeManagement: React.FC = () => {
  const { user } = useAuth();
  const operatorName = user?.name || '操作员';
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [examinations, setExaminations] = useState<any[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [showChargeDialog, setShowChargeDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [processing, setProcessing] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const patientsRes = await fetch("/api/patients?size=99999");
      const patientsJson = await patientsRes.json();
      const [prescData, chargeData, regData, examData, surgeryData] = await Promise.all([
        prescriptionService.getAll(),
        chargeService.getAll(),
        registrationService.getAll(),
        prescriptionExaminationService.getAll(),
        surgeryService.getAll()
      ]);
      setPrescriptions(prescData);
      setCharges(chargeData);
      setPatients(patientsJson.patients || []);
      setRegistrations(regData || []);
      setExaminations(examData || []);
      setSurgeries(surgeryData || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await auditLogService.getAll({ moduleName: '收费结算', limit: 30 });
      setAuditLogs(res.logs || []);
    } catch (error) {
      console.error('加载审计日志失败:', error);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending' || p.status === 'unpaid');
  const paidPrescriptions = prescriptions.filter(p => p.status === 'paid' || p.status === 'distributed');

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || '未知';
  };

  const getPatientInfo = (patientId: number) => {
    return patients.find(p => p.id === patientId);
  };

  const getRegistration = (registrationId: number) => {
    return registrations.find(r => r.id === registrationId);
  };

  const getChargeByPrescription = (prescriptionId: number) => {
    return charges.find(c => c.relateId === prescriptionId && c.chargeType === 'prescription');
  };

  const getRegFee = (registrationId: number) => {
    const reg = registrations.find(r => r.id === registrationId);
    return reg?.regFee || 0;
  };

  const getExamFee = (prescriptionId: number) => {
    const examItems = examinations.filter(e => e.prescriptionId === prescriptionId);
    return examItems.reduce((sum, item) => sum + (item.totalPrice || item.price || 0), 0);
  };

  const getSurgeryFee = (patientId: number) => {
    const patientSurgeries = surgeries.filter(s => s.patientId === patientId && s.status === 'scheduled');
    return patientSurgeries.reduce((sum, s) => sum + (s.surgeryFee || 0) + (s.anesthesiaFee || 0), 0);
  };

  const getPatientSurgeries = (patientId: number) => {
    return surgeries.filter(s => s.patientId === patientId && s.status === 'scheduled');
  };

  const getPrescriptionFee = (prescriptionId: number) => {
    const presc = prescriptions.find(p => p.id === prescriptionId);
    return presc?.totalPrice || 0;
  };

  const getTotalFee = (prescription: Prescription) => {
    const regFee = getRegFee(prescription.registrationId);
    const prescFee = getPrescriptionFee(prescription.id);
    const examFee = getExamFee(prescription.id);
    const surgeryFee = getSurgeryFee(prescription.patientId);
    return regFee + prescFee + examFee + surgeryFee;
  };

  const handleCharge = async () => {
    if (!selectedPrescription) return;
    
    setProcessing(true);
    try {
      const regFee = getRegFee(selectedPrescription.registrationId);
      const prescFee = getPrescriptionFee(selectedPrescription.id);
      const examFee = getExamFee(selectedPrescription.id);
      const surgeryFee = getSurgeryFee(selectedPrescription.patientId);
      const totalFee = regFee + prescFee + examFee + surgeryFee;

      const items: any[] = [];
      if (regFee > 0) {
        items.push({
          itemType: 'registration',
          relateId: selectedPrescription.registrationId,
          itemName: '挂号费',
          quantity: 1,
          unitPrice: regFee,
          totalPrice: regFee
        });
      }
      if (prescFee > 0) {
        items.push({
          itemType: 'prescription',
          relateId: selectedPrescription.id,
          itemName: '药品费',
          quantity: 1,
          unitPrice: prescFee,
          totalPrice: prescFee
        });
      }
      const examItems = examinations.filter(e => e.prescriptionId === selectedPrescription.id);
      for (const exam of examItems) {
        if (exam.status !== 'completed' && exam.status !== 'paid') {
          items.push({
            itemType: 'examination',
            relateId: exam.id,
            itemName: exam.examinationName || '检查费',
            quantity: exam.quantity || 1,
            unitPrice: exam.price || exam.unitPrice || 0,
            totalPrice: exam.totalPrice || exam.price || 0
          });
        }
      }

      const patientSurgeries = getPatientSurgeries(selectedPrescription.patientId);
      for (const surgery of patientSurgeries) {
        if (surgery.surgeryFee && surgery.surgeryFee > 0) {
          items.push({
            itemType: 'surgery',
            relateId: surgery.id,
            itemName: `${surgery.surgeryName || '手术费'}`,
            quantity: 1,
            unitPrice: surgery.surgeryFee,
            totalPrice: surgery.surgeryFee
          });
        }
        if (surgery.anesthesiaFee && surgery.anesthesiaFee > 0) {
          items.push({
            itemType: 'surgery',
            relateId: surgery.id,
            itemName: `${surgery.surgeryName || ''}麻醉费`,
            quantity: 1,
            unitPrice: surgery.anesthesiaFee,
            totalPrice: surgery.anesthesiaFee
          });
        }
      }

      await chargeService.add({
        patientId: selectedPrescription.patientId,
        chargeType: 'prescription',
        relateId: selectedPrescription.id,
        totalFee: totalFee,
        paymentType: paymentType,
        operator: operatorName,
        status: 'paid',
        items
      });
      
      alert('收费成功！');
      loadData();
      setShowChargeDialog(false);
      setSelectedPrescription(null);
    } catch (error) {
      console.error('收费失败:', error);
      alert('收费失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedCharge) {
      alert('无收费记录，无法退费');
      return;
    }
    
    setProcessing(true);
    try {
      await chargeService.refund(selectedCharge.id, operatorName);
      alert('退费成功！');
      loadData();
      setShowRefundDialog(false);
      setSelectedCharge(null);
    } catch (error) {
      console.error('退费失败:', error);
      alert('退费失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleVoid = async () => {
    if (!selectedPrescription) return;
    
    setProcessing(true);
    try {
      await doctorWorkstationService.voidPrescription(selectedPrescription.id);
      alert('处方已作废！');
      loadData();
      setShowVoidDialog(false);
      setSelectedPrescription(null);
      setSelectedCharge(null);
    } catch (error) {
      console.error('作废失败:', error);
      alert('作废失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPending = pendingPrescriptions.filter(p => {
    const patientName = getPatientName(p.patientId);
    const reg = getRegistration(p.registrationId);
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.id.toString().includes(searchTerm) ||
           (reg && reg.id.toString().includes(searchTerm));
  });

  const filteredPaid = paidPrescriptions.filter(p => {
    const patientName = getPatientName(p.patientId);
    const reg = getRegistration(p.registrationId);
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.id.toString().includes(searchTerm) ||
           (reg && reg.id.toString().includes(searchTerm));
  });

  const totalDailyCollections = charges
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.totalFee, 0);

  const totalPendingClaims = pendingPrescriptions.reduce((sum, p) => sum + getTotalFee(p), 0);

  const recentCharges = charges
    .filter(c => c.status === 'paid')
    .sort((a, b) => new Date(b.chargeTime || 0).getTime() - new Date(a.chargeTime || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">收费管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">基于挂号ID收费 · 处方结算 · 退费管理</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-card rounded-lg border border-border px-4 py-2.5 flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground">今日收款</span>
            <span className="text-lg font-bold text-tertiary">¥ {totalDailyCollections.toFixed(2)}</span>
          </div>
          <div className="bg-card rounded-lg border border-border px-4 py-2.5 flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground">待收款</span>
            <span className="text-lg font-bold text-primary">¥ {totalPendingClaims.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                待收费处方
              </h2>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索患者/处方/挂号ID..."
                  className="bg-muted border border-transparent rounded-md pl-8 pr-3 py-1.5 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all w-56"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPending.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto text-muted-foreground mb-3 opacity-50" size={40} />
                    <p className="text-sm text-muted-foreground">暂无待收费处方</p>
                  </div>
                ) : (
                  filteredPending.map((presc) => {
                    const patient = getPatientInfo(presc.patientId);
                    const totalFee = getTotalFee(presc);
                    const isAbnormal = totalFee === 0;
                    const reg = getRegistration(presc.registrationId);
                    return (
                      <div key={presc.id} className="flex items-center justify-between p-4 rounded-md border border-border hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isAbnormal ? 'bg-warning/10' : 'bg-muted'}`}>
                            {isAbnormal ? (
                              <AlertTriangle className="text-warning" size={18} />
                            ) : (
                              <Hourglass className="text-muted-foreground" size={18} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-card-foreground">{getPatientName(presc.patientId)}</h3>
                              {reg && (
                                <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  挂号 #{reg.id}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              处方 #{presc.id} · {reg?.dept || '-'} · {presc.doctorName || '门诊'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="block text-[10px] text-muted-foreground">创建时间</span>
                            <span className="text-xs text-card-foreground">{presc.createTime?.split('T')[0] || '-'}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-muted-foreground">应收金额</span>
                            <span className={`text-lg font-bold ${isAbnormal ? 'text-warning' : 'text-primary'}`}>
                              {isAbnormal ? '¥ 0.00' : `¥ ${totalFee.toFixed(2)}`}
                            </span>
                          </div>
                          {isAbnormal ? (
                            <button 
                              onClick={() => {
                                setSelectedPrescription(presc);
                                setShowVoidDialog(true);
                              }}
                              className="px-4 py-2 bg-warning/10 text-warning text-xs font-medium rounded-md hover:bg-warning/20 transition-colors"
                            >
                              作废处方
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedPrescription(presc);
                                setShowChargeDialog(true);
                              }}
                              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
                            >
                              处理收费
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              已完成交易
            </h2>

            <div className="space-y-2">
              {filteredPaid.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto text-muted-foreground mb-3 opacity-50" size={40} />
                  <p className="text-sm text-muted-foreground">暂无已收费处方</p>
                </div>
              ) : (
                filteredPaid.map((presc) => {
                  const charge = getChargeByPrescription(presc.id);
                  const displayFee = charge?.totalFee || getTotalFee(presc);
                  const isAbnormal = displayFee === 0;
                  const reg = getRegistration(presc.registrationId);
                  return (
                    <div key={presc.id} className="flex items-center justify-between p-4 rounded-md border border-border hover:border-success/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-success/10 rounded-md flex items-center justify-center">
                          <CheckCircle className="text-success" size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-card-foreground">{getPatientName(presc.patientId)}</h3>
                            {reg && (
                              <span className="text-[10px] font-mono text-success bg-success/10 px-1.5 py-0.5 rounded">
                                挂号 #{reg.id}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            处方 #{presc.id} · {getPaymentLabel(charge?.paymentType)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="block text-[10px] text-muted-foreground">收费时间</span>
                          <span className="text-xs text-card-foreground">{charge?.chargeTime?.split('T')[0] || presc.createTime?.split('T')[0] || '-'}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-muted-foreground">实收金额</span>
                          <span className="text-lg font-bold text-success">
                            ¥ {displayFee.toFixed(2)}
                          </span>
                        </div>
                        {!isAbnormal && charge && (
                          <button 
                            onClick={() => {
                              setSelectedCharge(charge);
                              setShowRefundDialog(true);
                            }}
                            className="px-4 py-2 border border-warning/30 text-warning text-xs font-medium rounded-md hover:bg-warning/10 transition-colors"
                          >
                            退费
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-bold text-card-foreground mb-4 flex items-center justify-between">
              快捷操作
              <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
            </h2>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors flex items-center gap-3">
                <Plus className="text-primary" size={16} />
                <span className="text-xs font-medium text-card-foreground">存款资金</span>
              </button>
              <button className="w-full text-left p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors flex items-center gap-3">
                <Landmark className="text-tertiary" size={16} />
                <span className="text-xs font-medium text-card-foreground">生成报表</span>
              </button>
              <button
                onClick={() => {
                  const next = !showAuditPanel;
                  setShowAuditPanel(next);
                  if (next) void loadAuditLogs();
                }}
                className="w-full text-left p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
              >
                <History className="text-warning" size={16} />
                <span className="text-xs font-medium text-card-foreground">审计日志</span>
              </button>
            </div>
          </div>

          {showAuditPanel && (
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-card-foreground">收费审计日志</h2>
                <button onClick={loadAuditLogs} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
                  {auditLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                </button>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {auditLoading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">正在加载审计日志...</div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">暂无审计记录</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="rounded-md border border-border px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-card-foreground">{log.action === 'charge_refund' ? '退费' : log.action === 'charge_pay' ? '收费' : log.action}</span>
                        <span className="text-muted-foreground">{log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '-'}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">{log.summary || '-'}</div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{log.operatorName || '系统'} · 患者ID {log.patientId || '-'}</span>
                        <span>{log.success ? '成功' : '失败'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-card-foreground">最近交易</h2>
              <RefreshCw className="text-muted-foreground cursor-pointer hover:text-primary transition-colors" size={14} />
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {recentCharges.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto text-muted-foreground mb-2 opacity-50" size={28} />
                  <p className="text-xs text-muted-foreground">暂无交易记录</p>
                </div>
              ) : (
                recentCharges.map((charge, index) => (
                  <div key={charge.id || index} className="p-3 rounded-md border border-border hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-muted-foreground">TRX-{charge.id?.toString().padStart(5, '0')}</span>
                        <p className="text-xs font-medium text-card-foreground mt-0.5">
                          {getPatientName(charge.patientId)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{getPaymentLabel(charge.paymentType)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-success">+¥ {charge.totalFee.toFixed(2)}</span>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {charge.chargeTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || '--:--'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCharge(charge);
                        setShowRefundDialog(true);
                      }}
                      className="mt-2 text-[9px] text-warning font-medium hover:underline"
                    >
                      退费
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showChargeDialog && selectedPrescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-lg border border-border w-[520px] max-w-full">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                  <CreditCard className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-card-foreground">处理支付</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">挂号 #{selectedPrescription.registrationId} · 处方 #{selectedPrescription.id}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-primary-container/20 rounded-md border-l-2 border-primary">
                <p className="text-[10px] text-muted-foreground">目标患者</p>
                <p className="text-sm font-bold text-card-foreground mt-0.5">{getPatientName(selectedPrescription.patientId)}</p>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-md border-l-2 border-tertiary">
                <p className="text-[10px] text-muted-foreground">应收金额</p>
                <p className="text-2xl font-bold text-tertiary mt-0.5">¥ {getTotalFee(selectedPrescription).toFixed(2)}</p>
                <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
                  <p>挂号费: ¥{getRegFee(selectedPrescription.registrationId).toFixed(2)}</p>
                  <p>药品费: ¥{getPrescriptionFee(selectedPrescription.id).toFixed(2)}</p>
                  <p>检查费: ¥{getExamFee(selectedPrescription.id).toFixed(2)}</p>
                  {getSurgeryFee(selectedPrescription.patientId) > 0 && (
                    <p>手术费: ¥{getSurgeryFee(selectedPrescription.patientId).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">支付方式</label>
                <PaymentMethodSelector
                  value={paymentType}
                  onChange={(value) => setPaymentType(value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-border space-y-2">
              <button
                onClick={handleCharge}
                disabled={processing}
                className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && <Loader2 className="animate-spin" size={14} />}
                {processing ? '处理中...' : '授权支付'}
              </button>
              <button
                onClick={() => {
                  setShowChargeDialog(false);
                  setSelectedPrescription(null);
                }}
                className="w-full py-2.5 border border-border text-card-foreground text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showVoidDialog && selectedPrescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-lg border border-border w-[480px] max-w-full">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/10 rounded-md flex items-center justify-center">
                  <AlertTriangle className="text-warning" size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-card-foreground">作废处方</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">此操作不可撤销</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-warning/5 p-4 rounded-md border border-warning/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">患者姓名</span>
                  <span className="text-sm font-bold text-card-foreground">{getPatientName(selectedPrescription.patientId)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">处方编号</span>
                  <span className="text-xs font-mono text-primary">RX-{selectedPrescription.id.toString().padStart(5, '0')}</span>
                </div>
                <div className="border-t border-warning/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">处方金额</span>
                    <span className="text-xl font-bold text-warning">¥ 0.00</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                该处方金额异常，确定要作废吗？
              </p>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowVoidDialog(false);
                  setSelectedPrescription(null);
                  setSelectedCharge(null);
                }}
                className="flex-1 py-2.5 border border-border text-card-foreground text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleVoid}
                disabled={processing}
                className="flex-1 py-2.5 bg-warning text-warning-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && <Loader2 className="animate-spin" size={14} />}
                {processing ? '处理中...' : '确认作废'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundDialog && selectedCharge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-lg border border-border w-[480px] max-w-full">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/10 rounded-md flex items-center justify-center">
                  <RotateCcw className="text-warning" size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-card-foreground">退费处理</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">退款将原路返回</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-warning/5 p-4 rounded-md border border-warning/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">收费记录号</span>
                  <span className="text-xs font-mono text-primary">TRX-{selectedCharge.id?.toString().padStart(5, '0')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">患者姓名</span>
                  <span className="text-sm font-bold text-card-foreground">{getPatientName(selectedCharge.patientId)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">支付方式</span>
                  <span className="text-xs text-card-foreground">
                    {getPaymentLabel(selectedCharge.paymentType)}
                  </span>
                </div>
                <div className="border-t border-warning/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">退款金额</span>
                    <span className="text-xl font-bold text-warning">-¥ {selectedCharge.totalFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowRefundDialog(false);
                  setSelectedCharge(null);
                }}
                className="flex-1 py-2.5 border border-border text-card-foreground text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={processing}
                className="flex-1 py-2.5 bg-warning text-warning-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && <Loader2 className="animate-spin" size={14} />}
                {processing ? '处理中...' : '确认退费'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargeManagement;
