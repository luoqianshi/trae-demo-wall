import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2, X, FileText, User, Stethoscope, Activity, DollarSign, FolderTree, Package, Group, Building, Receipt, ChevronRight, ChevronLeft, CheckCircle, Eye, Calendar, ClipboardList, Pill, CreditCard, Hospital, Syringe } from "lucide-react";
import {
  drugService, patientService, doctorService, departmentService, examinationService,
  inventoryLogService, registrationService, chargeService, prescriptionService, inpatientService,
  medicalRecordService, prescriptionItemService
} from "@/lib/services";
import type { Drug, Patient, Doctor, Department, Examination, InventoryLog, Registration, Charge, Prescription, Inpatient, MedicalRecord, PrescriptionItem } from "@/lib/types";

const InfoMaintenance: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fees, setFees] = useState<Examination[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState("drugs");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("pharmaceuticals");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [jumpPage, setJumpPage] = useState(1);

  const handleJump = (totalPages: number) => {
    const target = Math.max(1, Math.min(totalPages, jumpPage));
    setPage(target);
    setJumpPage(target);
  };
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formType, setFormType] = useState("");

  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [patientPrescriptionItems, setPatientPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [patientRegistrations, setPatientRegistrations] = useState<Registration[]>([]);
  const [patientCharges, setPatientCharges] = useState<Charge[]>([]);
  const [patientInpatients, setPatientInpatients] = useState<Inpatient[]>([]);
  
  const [drugForm, setDrugForm] = useState({ name: '', spec: '', unit: '', price: '', stock: '' });
  const [patientForm, setPatientForm] = useState({ name: '', gender: '男', age: '', birthDate: '', phone: '', idCard: '', address: '', occupation: '', maritalStatus: '未婚', insuranceType: '自费', medicalInsuranceNo: '', contractUnit: '', emergencyContact: '', emergencyPhone: '', allergyHistory: '', hospitalId: '' });
  const [doctorForm, setDoctorForm] = useState({ name: '', gender: '男', age: '', phone: '', dept: '', title: '', workNo: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [feeForm, setFeeForm] = useState({ name: '', category: 'lab', price: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [drugsRes, patientsRes, doctorsRes, deptsRes, feesRes, logsRes, regsRes, chargesRes, prescsRes, inpatientsRes] = await Promise.all([
        drugService.getAll(),
        patientService.getAll(),
        doctorService.getAll(),
        departmentService.getAll(),
        examinationService.getAll(),
        inventoryLogService.getAll(),
        registrationService.getAll(),
        chargeService.getAll(),
        prescriptionService.getAll(),
        inpatientService.getAll(),
      ]);
      setDrugs(drugsRes);
      setPatients(patientsRes);
      setDoctors(doctorsRes);
      setDepartments(deptsRes);
      setFees(feesRes);
      setInventoryLogs(logsRes);
      setRegistrations(regsRes);
      setCharges(chargesRes);
      setPrescriptions(prescsRes);
      setInpatients(inpatientsRes);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAdd = (type: string) => {
    setFormType(type);
    setEditingItem(null);
    if (type === 'drug') setDrugForm({ name: '', spec: '', unit: '', price: '', stock: '' });
    if (type === 'patient') setPatientForm({ name: '', gender: '男', age: '', birthDate: '', phone: '', idCard: '', address: '', occupation: '', maritalStatus: '未婚', insuranceType: '自费', medicalInsuranceNo: '', contractUnit: '', emergencyContact: '', emergencyPhone: '', allergyHistory: '', hospitalId: '' });
    if (type === 'doctor') setDoctorForm({ name: '', gender: '男', age: '', phone: '', dept: '', title: '', workNo: '' });
    if (type === 'dept') setDeptForm({ name: '', description: '' });
    if (type === 'fee') setFeeForm({ name: '', category: 'lab', price: '' });
    setDialogOpen(true);
  };

  const handleEdit = (type: string, item: any) => {
    setFormType(type);
    setEditingItem(item);
    if (type === 'drug') setDrugForm({ name: item.name, spec: item.spec, unit: item.unit, price: String(item.price), stock: String(item.stock) });
    if (type === 'patient') setPatientForm({ name: item.name, gender: item.gender, age: String(item.age), birthDate: item.birthDate || '', phone: item.phone || '', idCard: item.idCard || '', address: item.address || '', occupation: item.occupation || '', maritalStatus: item.maritalStatus || '未婚', insuranceType: item.insuranceType || '自费', medicalInsuranceNo: item.medicalInsuranceNo || '', contractUnit: item.contractUnit || '', emergencyContact: item.emergencyContact || '', emergencyPhone: item.emergencyPhone || '', allergyHistory: item.allergyHistory || '', hospitalId: item.hospitalId || '' });
    if (type === 'doctor') setDoctorForm({ name: item.name, gender: item.gender, age: String(item.age), phone: item.phone || '', dept: item.dept, title: item.title, workNo: item.workNo || '' });
    if (type === 'dept') setDeptForm({ name: item.name, description: item.description || '' });
    if (type === 'fee') setFeeForm({ name: item.name, category: item.category, price: String(item.price) });
    setDialogOpen(true);
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      if (type === 'drug') await drugService.delete(id);
      if (type === 'patient') await patientService.delete(id);
      if (type === 'doctor') await doctorService.delete(id);
      if (type === 'dept') await departmentService.delete(id);
      if (type === 'fee') await examinationService.delete(id);
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formType === 'drug') {
        const data = { ...drugForm, price: parseFloat(drugForm.price), stock: parseInt(drugForm.stock) };
        if (editingItem) await drugService.update(editingItem.id, data);
        else await drugService.add(data);
      }
      if (formType === 'patient') {
        const data = {
          name: patientForm.name,
          gender: patientForm.gender,
          age: parseInt(patientForm.age) || 0,
          birthDate: patientForm.birthDate || undefined,
          phone: patientForm.phone,
          id_card: patientForm.idCard,
          address: patientForm.address || undefined,
          occupation: patientForm.occupation || undefined,
          maritalStatus: patientForm.maritalStatus || undefined,
          insuranceType: patientForm.insuranceType || undefined,
          medicalInsuranceNo: patientForm.medicalInsuranceNo || undefined,
          contractUnit: patientForm.contractUnit || undefined,
          emergencyContact: patientForm.emergencyContact || undefined,
          emergencyPhone: patientForm.emergencyPhone || undefined,
          allergy_history: patientForm.allergyHistory || undefined,
          hospitalId: patientForm.hospitalId || undefined,
        };
        if (editingItem) await patientService.update(editingItem.id, data);
        else await patientService.add(data);
      }
      if (formType === 'doctor') {
        const data = { ...doctorForm, age: parseInt(doctorForm.age) };
        if (editingItem) await doctorService.update(editingItem.id, data);
        else await doctorService.add(data);
      }
      if (formType === 'dept') {
        if (editingItem) await departmentService.update(editingItem.id, deptForm);
        else await departmentService.add(deptForm);
      }
      if (formType === 'fee') {
        const data = { ...feeForm, price: parseFloat(feeForm.price), category: feeForm.category as 'lab' | 'image' };
        if (editingItem) await examinationService.update(editingItem.id, data);
        else await examinationService.add(data);
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  const filterData = (data: any[]) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: '已耗尽', color: 'error', animate: false };
    if (stock < 100) return { label: '危急', color: 'secondary', animate: true };
    return { label: '正常', color: 'tertiary', animate: false };
  };

  const getPatientStatus = (patientId: number) => {
    const patientInpatients = inpatients.filter(ip => ip.patientId === patientId);
    const discharged = patientInpatients.find(ip => ip.status === 'discharged');
    if (discharged) return { label: '已出院', color: 'text-purple-400 bg-purple-500/10' };
    const admitted = patientInpatients.find(ip => ip.status === 'admitted');
    if (admitted) return { label: '已住院', color: 'text-blue-400 bg-blue-500/10' };
    const dispensed = prescriptions.find(p => p.patientId === patientId && p.status === 'dispensed');
    if (dispensed) return { label: '已发药', color: 'text-green-400 bg-green-500/10' };
    const paid = charges.find(c => c.patientId === patientId && c.status === 'paid');
    if (paid) return { label: '已缴费', color: 'text-teal-400 bg-teal-500/10' };
    const diagnosed = prescriptions.find(p => p.patientId === patientId && p.status === 'active');
    if (diagnosed) return { label: '诊疗中', color: 'text-yellow-400 bg-yellow-500/10' };
    const registered = registrations.find(r => r.patientId === patientId);
    if (registered) return { label: '已挂号', color: 'text-orange-400 bg-orange-500/10' };
    return { label: '未就诊', color: 'text-slate-400 bg-slate-500/10' };
  };

  const isPatientCompleted = (patientId: number) => {
    const patientInpatients = inpatients.filter(ip => ip.patientId === patientId);
    const discharged = patientInpatients.find(ip => ip.status === 'discharged');
    if (discharged) return true;
    const dispensed = prescriptions.find(p => p.patientId === patientId && p.status === 'dispensed');
    if (dispensed) return true;
    return false;
  };

  const loadPatientDetails = async (patient: Patient) => {
    setDetailPatient(patient);
    setDetailLoading(true);
    try {
      const [records, prescs, regs, chgs, inps] = await Promise.all([
        medicalRecordService.getByPatientId(patient.id),
        fetch(`/api/prescriptions?patientId=${patient.id}`).then(r => r.json()),
        fetch(`/api/registrations?patientId=${patient.id}`).then(r => r.json()),
        fetch(`/api/charges?patientId=${patient.id}`).then(r => r.json()),
        fetch(`/api/inpatients?patientId=${patient.id}`).then(r => r.json()),
      ]);
      setPatientMedicalRecords(Array.isArray(records) ? records : []);
      const prescList = Array.isArray(prescs) ? prescs : (prescs.prescriptions || prescs.data || []);
      setPatientPrescriptions(prescList);
      const regList = Array.isArray(regs) ? regs : (regs.registrations || regs.data || []);
      setPatientRegistrations(regList);
      const chgList = Array.isArray(chgs) ? chgs : (chgs.charges || chgs.data || []);
      setPatientCharges(chgList);
      const inpList = Array.isArray(inps) ? inps : (inps.items || inps.inpatients || inps.data || []);
      setPatientInpatients(inpList);

      if (prescList.length > 0) {
        const allItems = await Promise.all(
          prescList.map((p: Prescription) =>
            prescriptionItemService.getByPrescriptionId(p.id).catch(() => [])
          )
        );
        setPatientPrescriptionItems(allItems.flat());
      } else {
        setPatientPrescriptionItems([]);
      }
    } catch (error) {
      console.error('加载患者详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closePatientDetail = () => {
    setDetailPatient(null);
    setPatientMedicalRecords([]);
    setPatientPrescriptions([]);
    setPatientPrescriptionItems([]);
    setPatientRegistrations([]);
    setPatientCharges([]);
    setPatientInpatients([]);
  };

  const categories = [
    { id: 'drugs', label: '药品 / DRUG MGMT', icon: Package, count: drugs.length },
    { id: 'patients', label: '患者 / PATIENTS', icon: Group, count: patients.length },
    { id: 'doctors', label: '医生 / DOCTORS', icon: User, count: doctors.length },
    { id: 'departments', label: '科室 / DEPARTMENTS', icon: Building, count: departments.length },
    { id: 'fees', label: '收费 / FEES', icon: Receipt, count: fees.length },
    { id: 'inventoryLogs', label: '库存日志 / INVENTORY LOGS', icon: FileText, count: inventoryLogs.length },
  ];

  const renderDataTable = () => {
    let data: any[] = [];
    let columns: { key: string; header: string }[] = [];
    let type = '';

    switch (activeTab) {
      case 'drugs':
        data = filterData(drugs);
        columns = [
          { key: 'id', header: 'ID / 系统ID' },
          { key: 'name', header: 'NAME / 名称' },
          { key: 'spec', header: 'SPEC / 规格' },
          { key: 'stock', header: 'STOCK / 库存' },
          { key: 'status', header: 'STATUS / 状态' },
        ];
        type = 'drug';
        break;
      case 'patients':
        data = filterData(patients);
        columns = [
          { key: 'hospitalId', header: '医院ID' },
          { key: 'name', header: '姓名' },
          { key: 'gender', header: '性别' },
          { key: 'age', header: '年龄' },
          { key: 'phone', header: '联系电话' },
          { key: 'insuranceType', header: '医保类型' },
          { key: 'status', header: '状态' },
        ];
        type = 'patient';
        break;
      case 'doctors':
        data = filterData(doctors);
        columns = [
          { key: 'id', header: '医生ID' },
          { key: 'name', header: '姓名' },
          { key: 'dept', header: '科室' },
          { key: 'title', header: '职称' },
          { key: 'workNo', header: '工号' },
        ];
        type = 'doctor';
        break;
      case 'departments':
        data = filterData(departments);
        columns = [
          { key: 'id', header: '科室ID' },
          { key: 'name', header: '科室名称' },
          { key: 'description', header: '描述' },
        ];
        type = 'dept';
        break;
      case 'fees':
        data = filterData(fees);
        columns = [
          { key: 'id', header: '日志ID' },
          { key: 'drugId', header: '药品ID' },
          { key: 'changeType', header: '类型' },
          { key: 'changeNum', header: '数量' },
          { key: 'operator', header: '操作人' },
        ];
        type = 'fee';
        break;
      case 'inventoryLogs':
        data = inventoryLogs;
        columns = [
          { key: 'id', header: '日志ID' },
          { key: 'drugId', header: '药品ID' },
          { key: 'changeType', header: '类型' },
          { key: 'changeNum', header: '变化量' },
          { key: 'beforeStock', header: '变动前' },
          { key: 'afterStock', header: '变动后' },
          { key: 'operator', header: '操作人' },
          { key: 'reason', header: '原因' },
          { key: 'changeTime', header: '时间' },
        ];
        type = 'inventoryLog';
        break;
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const pagedData = data.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="glass-panel overflow-hidden border border-outline-variant/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container text-xs font-label text-slate-500 uppercase tracking-widest">
              {columns.map(col => (
                <th key={col.key} className="p-4 border-b border-outline-variant/20">{col.header}</th>
              ))}
              <th className="p-4 border-b border-outline-variant/20 text-right">操作 / ACTION</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-12 text-center">
                  <Loader2 className="animate-spin text-primary-container mx-auto" size={32} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-12 text-center text-outline">
                  <Activity className="mx-auto mb-4 opacity-50" size={48} />
                  <p className="font-headline uppercase tracking-widest">暂无数据</p>
                </td>
              </tr>
            ) : (
              pagedData.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-surface-container-high transition-colors group">
                  {columns.map(col => (
                    <td key={col.key} className="p-4">
                      {col.key === 'id' ? (
                        <span className="font-label text-primary/70">ID-{String(item[col.key] || i + 1).padStart(3, '0')}</span>
                      ) : col.key === 'hospitalId' ? (
                        <span className="font-mono text-primary text-xs bg-primary/5 px-2 py-0.5 rounded">{item[col.key] || '-'}</span>
                      ) : col.key === 'stock' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-label">{item[col.key]?.toLocaleString() || 0} 单位</span>
                          <div className="w-16 h-1 bg-surface-container-highest flex">
                            <div 
                              className={`h-full ${item[col.key] < 100 ? 'bg-secondary-container' : 'bg-tertiary-fixed-dim'}`} 
                              style={{ width: `${Math.min((item[col.key] / 1000) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : col.key === 'status' && type === 'drug' ? (
                        <span className={`inline-block px-2 py-0.5 ${
                          getStockStatus(item.stock).color === 'tertiary' ? 'bg-tertiary-container/10 text-tertiary' :
                          getStockStatus(item.stock).color === 'secondary' ? 'bg-secondary-container/10 text-secondary' :
                          'bg-outline-variant/10 text-slate-500'
                        } text-[10px] font-bold uppercase tracking-tighter`}>
                          {getStockStatus(item.stock).label}
                        </span>
                      ) : col.key === 'status' && type === 'patient' ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${getPatientStatus(item.id).color}`}>
                          {getPatientStatus(item.id).label}
                        </span>
                      ) : col.key === 'price' ? (
                        <span className="font-mono text-tertiary">¥{item[col.key]?.toFixed(2) || '0.00'}</span>
                      ) : col.key === 'category' ? (
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                          item[col.key] === 'lab' ? 'bg-primary-container/10 text-primary' : 'bg-tertiary-container/10 text-tertiary'
                        }`}>
                          {item[col.key] === 'lab' ? '检验' : '影像'}
                        </span>
                      ) : col.key === 'changeType' ? (
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                          item[col.key] === 'in' ? 'bg-green-500/10 text-green-400' :
                          item[col.key] === 'out' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {item[col.key] === 'in' ? '入库' : item[col.key] === 'out' ? '出库' : '调整'}
                        </span>
                      ) : col.key === 'changeTime' ? (
                        <span className="text-xs">{item[col.key] ? new Date(item[col.key]).toLocaleString('zh-CN') : '-'}</span>
                      ) : (
                        item[col.key] || '-'
                      )}
                    </td>
                  ))}
                  <td className="p-4 text-right space-x-2">
                    {type !== 'inventoryLog' && (
                      <>
                        <button 
                          onClick={() => handleEdit(type, item)} 
                          className="p-2 hover:text-primary transition-colors"
                          title="编辑"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(type, item.id)} 
                          className="p-2 hover:text-secondary-container transition-colors"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                        {type === 'patient' && (
                          <button 
                            onClick={() => loadPatientDetails(item)} 
                            className="p-2 hover:text-blue-400 transition-colors"
                            title="查看详情"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {type === 'patient' && isPatientCompleted(item.id) && (
                          <button 
                            onClick={() => {
                              if (window.confirm(`确认患者「${item.name}」治疗成功，将删除该患者档案？`)) {
                                patientService.delete(item.id).then(() => loadData());
                              }
                            }} 
                            className="p-2 text-green-500 hover:text-green-400 transition-colors"
                            title="治疗成功 删除患者"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalItems > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container border-t border-outline-variant/10">
            <span className="text-xs text-outline font-mono">
              共 {totalItems} 条，第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1 text-[10px] bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors">
                首页
              </button>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="px-2 py-1 bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1 mx-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={e => setJumpPage(Number(e.target.value))}
                  onKeyDown={e => { if (e.key === 'Enter') handleJump(totalPages); }}
                  className="w-12 px-1 py-1 text-[10px] text-center bg-surface-container-high border border-outline-variant/20 rounded focus:ring-1 focus:ring-primary outline-none"
                />
                <span className="text-[10px] text-outline">/{totalPages}</span>
                <button onClick={() => handleJump(totalPages)}
                  className="px-2 py-1 text-[10px] bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                  跳转
                </button>
              </div>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="px-2 py-1 bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
                className="px-2 py-1 text-[10px] bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors">
                末页
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    if (formType === 'drug') return (
      <div className="space-y-4">
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">药品名称</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={drugForm.name} onChange={e => setDrugForm({...drugForm, name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">规格</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={drugForm.spec} onChange={e => setDrugForm({...drugForm, spec: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">单位</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={drugForm.unit} onChange={e => setDrugForm({...drugForm, unit: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">价格</label><input type="number" className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={drugForm.price} onChange={e => setDrugForm({...drugForm, price: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">库存</label><input type="number" className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={drugForm.stock} onChange={e => setDrugForm({...drugForm, stock: e.target.value})} /></div>
        </div>
      </div>
    );
    if (formType === 'patient') return (
      <div className="space-y-4">
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">医院ID（自动生成）</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant text-sm py-2 px-1 text-muted-foreground" value={patientForm.hospitalId || '(新建时自动生成)'} disabled /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">姓名</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">性别</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.gender} onChange={e => setPatientForm({...patientForm, gender: e.target.value})}><option value="男">男</option><option value="女">女</option></select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">年龄</label><input type="number" className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">出生日期</label><input type="date" className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.birthDate} onChange={e => setPatientForm({...patientForm, birthDate: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">婚姻状况</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.maritalStatus} onChange={e => setPatientForm({...patientForm, maritalStatus: e.target.value})}><option value="未婚">未婚</option><option value="已婚">已婚</option><option value="离异">离异</option><option value="丧偶">丧偶</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">电话</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">身份证号</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.idCard} onChange={e => setPatientForm({...patientForm, idCard: e.target.value})} /></div>
        </div>
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">地址</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.address} onChange={e => setPatientForm({...patientForm, address: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">职业</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.occupation} onChange={e => setPatientForm({...patientForm, occupation: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">合同单位</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.contractUnit} onChange={e => setPatientForm({...patientForm, contractUnit: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">医保类型</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.insuranceType} onChange={e => setPatientForm({...patientForm, insuranceType: e.target.value})}><option value="自费">自费</option><option value="城镇职工医保">城镇职工医保</option><option value="城乡居民医保">城乡居民医保</option><option value="公费医疗">公费医疗</option><option value="商业保险">商业保险</option></select></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">医保号</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.medicalInsuranceNo} onChange={e => setPatientForm({...patientForm, medicalInsuranceNo: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">过敏史</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.allergyHistory} onChange={e => setPatientForm({...patientForm, allergyHistory: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">紧急联系人</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.emergencyContact} onChange={e => setPatientForm({...patientForm, emergencyContact: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">紧急联系电话</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={patientForm.emergencyPhone} onChange={e => setPatientForm({...patientForm, emergencyPhone: e.target.value})} /></div>
        </div>
      </div>
    );
    if (formType === 'doctor') return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">姓名</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">性别</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.gender} onChange={e => setDoctorForm({...doctorForm, gender: e.target.value})}><option value="男">男</option><option value="女">女</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">年龄</label><input type="number" className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.age} onChange={e => setDoctorForm({...doctorForm, age: e.target.value})} /></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">电话</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.phone} onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">科室</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.dept} onChange={e => setDoctorForm({...doctorForm, dept: e.target.value})}><option value="">请选择科室</option>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
          <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">职称</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.title} onChange={e => setDoctorForm({...doctorForm, title: e.target.value})}><option value="">请选择职称</option><option value="主任医师">主任医师</option><option value="副主任医师">副主任医师</option><option value="主治医师">主治医师</option><option value="住院医师">住院医师</option></select></div>
        </div>
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">工号 (留空自动生成)</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={doctorForm.workNo} onChange={e => setDoctorForm({...doctorForm, workNo: e.target.value})} placeholder="留空自动生成" /></div>
      </div>
    );
    if (formType === 'dept') return (
      <div className="space-y-4">
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">科室名称</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} /></div>
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">描述</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={deptForm.description} onChange={e => setDeptForm({...deptForm, description: e.target.value})} /></div>
      </div>
    );
    if (formType === 'fee') return (
      <div className="space-y-4">
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">项目名称</label><input className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={feeForm.name} onChange={e => setFeeForm({...feeForm, name: e.target.value})} /></div>
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">类别</label><select className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={feeForm.category} onChange={e => setFeeForm({...feeForm, category: e.target.value})}><option value="lab">检验</option><option value="image">影像</option></select></div>
        <div><label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">价格</label><input type="number" className="w-full mt-2 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm py-2 px-1" value={feeForm.price} onChange={e => setFeeForm({...feeForm, price: e.target.value})} /></div>
      </div>
    );
    return null;
  };

  const getFormTitle = () => {
    const titles: Record<string, string> = { drug: '药品 / DRUG', patient: '患者 / PATIENT', doctor: '医生 / DOCTOR', dept: '科室 / DEPT', fee: '收费 / FEE' };
    return (editingItem ? '编辑 / EDIT' : '新增 / ADD') + ' ' + titles[formType];
  };

  return (
    <div className="space-y-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline font-bold text-4xl text-primary tracking-tighter uppercase mb-2">维护 / MAINTENANCE</h1>
          <p className="font-body text-on-surface-variant max-w-xl">系统范围数据同步和记录管理 / MASTER DATA SYNC & RECORD MANAGEMENT</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              className="bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary-fixed-dim focus:ring-0 text-sm font-label w-64 py-2 pl-10 transition-all placeholder:text-slate-600" 
              placeholder="搜索主数据 / SEARCH MASTER DATA..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-2 text-slate-500" size={18} />
          </div>
          {activeTab !== 'inventoryLogs' && (
          <button 
            onClick={() => handleAdd(activeTab === 'drugs' ? 'drug' : activeTab === 'patients' ? 'patient' : activeTab === 'doctors' ? 'doctor' : activeTab === 'departments' ? 'dept' : 'fee')}
            className="motion-press bg-primary-container text-on-primary px-6 py-2 font-headline font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> 新增 / ADD
          </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 items-start">
        <section className="col-span-12 lg:col-span-3 glass-panel p-6 border-l border-primary/30">
          <h3 className="font-headline font-bold text-xs tracking-[0.2em] uppercase text-primary mb-6 flex items-center gap-2">
            <FolderTree size={16} />
            分类 / CATEGORIES
          </h3>
          <div className="space-y-4 font-label text-sm text-on-surface-variant">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div
                  onClick={() => { setActiveTab(cat.id); setPage(1); setJumpPage(1); }}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    activeTab === cat.id ? 'text-primary font-bold' : 'hover:text-primary'
                  }`}
                >
                  <ChevronRight size={16} />
                  <cat.icon size={16} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1 ${activeTab === cat.id ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-6 border-t border-outline-variant/20">
            <div className="p-4 bg-surface-container-low">
              <div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mb-2">数据库状态 / DB STATUS</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-on-surface">主数据库 / PRIMARY</span>
                    <span className="text-[10px] text-primary">92%</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-container to-primary-fixed-dim progress-flow" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-on-surface">备份数据库 / BACKUP</span>
                    <span className="text-[10px] text-tertiary">78%</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-tertiary-container to-tertiary-fixed-dim progress-flow" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-on-surface">日志存储 / LOGS</span>
                    <span className="text-[10px] text-secondary">45%</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary-container to-secondary-fixed-dim progress-flow" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-outline-variant/10">
                <span className="text-xs text-on-surface-variant">总存储 / TOTAL: 84.2 GB / 100 GB</span>
                <span className="text-[10px] px-2 py-1 bg-tertiary-container/20 text-tertiary font-bold uppercase">HEALTHY</span>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          <div className="flex border-b border-outline-variant/30">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveTab(cat.id); setPage(1); setJumpPage(1); }}
                className={`px-8 py-4 font-headline text-sm font-bold tracking-widest uppercase transition-colors ${
                  activeTab === cat.id
                    ? 'border-b-2 border-primary text-primary bg-primary/10'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {cat.label.replace('管理', '')}
              </button>
            ))}
          </div>
          {renderDataTable()}
          <div className="flex items-center justify-between font-label text-xs tracking-widest uppercase text-slate-500 px-2">
            <div className="flex items-center gap-4">
              <span>显示 / SHOWING 1-{Math.min(50, activeTab === 'drugs' ? drugs.length : activeTab === 'patients' ? patients.length : activeTab === 'doctors' ? doctors.length : activeTab === 'departments' ? departments.length : activeTab === 'fees' ? fees.length : inventoryLogs.length)} 条 / RECORDS</span>
            </div>
          </div>
        </section>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-dim/80 backdrop-blur-md px-4">
          <div className="glass-panel border border-primary/20 w-[500px] max-w-full">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h3 className="font-headline font-bold text-xl text-on-surface uppercase tracking-tight">{getFormTitle()}</h3>
              <button onClick={() => setDialogOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {renderForm()}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/20">
                <button type="button" onClick={() => setDialogOpen(false)} className="px-6 py-3 border border-outline-variant text-on-surface-variant font-label text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                  取消 / CANCEL
                </button>
                <button type="submit" className="motion-press bg-primary-container text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
                  保存 / SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-dim/80 backdrop-blur-md px-4 py-6">
          <div className="glass-panel border border-primary/20 w-[1000px] max-w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center sticky top-0 bg-surface-dim z-10">
              <h3 className="font-headline font-bold text-xl text-on-surface uppercase tracking-tight flex items-center gap-3">
                <User size={22} className="text-primary" />
                患者全链视图 / PATIENT FULL CHAIN VIEW
                <span className="text-sm font-label text-on-surface-variant">- {detailPatient.name}</span>
              </h3>
              <button onClick={closePatientDetail} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-8">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-primary-container" size={40} />
                </div>
              ) : (
                <>
                  {/* 患者状态摘要 / STATUS SUMMARY */}
                  <section className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/10">
                    <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity size={16} /> 当前状态 / CURRENT STATUS
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {(() => {
                        const hasRegistered = patientRegistrations.length > 0;
                        const hasDiagnosis = patientMedicalRecords.length > 0;
                        const hasPrescription = patientPrescriptions.length > 0;
                        const hasPaid = patientCharges.some(c => c.status === 'paid');
                        const hasDispensed = patientPrescriptions.some(p => p.status === 'dispensed');
                        const hasAdmitted = patientInpatients.some(ip => ip.status === 'admitted');
                        const hasDischarged = patientInpatients.some(ip => ip.status === 'discharged');
                        const steps = [
                          { label: '已挂号', done: hasRegistered, icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                          { label: '已诊疗', done: hasDiagnosis, icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                          { label: '已开药', done: hasPrescription, icon: Pill, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                          { label: '已缴费', done: hasPaid, icon: CreditCard, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                          { label: '已发药', done: hasDispensed, icon: Syringe, color: 'text-green-400', bg: 'bg-green-500/10' },
                          { label: '已住院', done: hasAdmitted, icon: Hospital, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                          { label: '已出院', done: hasDischarged, icon: CheckCircle, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                        ];
                        return steps.map((step, idx) => (
                          <div key={step.label} className={`flex items-center gap-2 px-3 py-2 rounded-full ${step.done ? step.bg : 'bg-outline-variant/5'} border ${step.done ? 'border-current/20' : 'border-outline-variant/10'}`}>
                            <step.icon size={14} className={step.done ? step.color : 'text-outline'} />
                            <span className={`text-xs font-bold uppercase tracking-tighter ${step.done ? step.color : 'text-outline'}`}>
                              {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                              <ChevronRight size={12} className="text-outline-variant" />
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </section>

                  {/* 患者基本信息 */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User size={16} /> 基本信息 / BASIC INFO
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-container-low rounded">
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">医院ID</span>
                        <p className="font-mono text-sm mt-1">{detailPatient.hospitalId || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">病历号</span>
                        <p className="font-mono text-sm mt-1">{detailPatient.medicalRecordNo || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">姓名</span>
                        <p className="font-body text-sm mt-1 font-bold">{detailPatient.name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">性别/年龄</span>
                        <p className="font-body text-sm mt-1">{detailPatient.gender} / {detailPatient.age}岁</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">电话</span>
                        <p className="font-body text-sm mt-1">{detailPatient.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">身份证号</span>
                        <p className="font-body text-sm mt-1">{detailPatient.idCard || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">医保类型</span>
                        <p className="font-body text-sm mt-1">{detailPatient.insuranceType || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">婚姻状况</span>
                        <p className="font-body text-sm mt-1">{detailPatient.maritalStatus || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">地址</span>
                        <p className="font-body text-sm mt-1">{detailPatient.address || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">职业</span>
                        <p className="font-body text-sm mt-1">{detailPatient.occupation || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-label text-outline uppercase tracking-wider">过敏史</span>
                        <p className="font-body text-sm mt-1">{detailPatient.allergyHistory || '无'}</p>
                      </div>
                    </div>
                  </section>

                  {/* 全链时间线 / FULL CHAIN TIMELINE */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-primary-fixed-dim uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity size={16} /> 全链时间线 / FULL CHAIN TIMELINE
                    </h4>
                    {patientRegistrations.length === 0 && patientMedicalRecords.length === 0 && patientPrescriptions.length === 0 && patientCharges.length === 0 && patientInpatients.length === 0 ? (
                      <p className="text-sm text-outline p-4 bg-surface-container-low rounded">暂无任何活动记录</p>
                    ) : (
                      <div className="space-y-0 relative">
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-outline-variant/20"></div>
                        {(() => {
                          const timeline: { time: Date; type: string; label: string; detail: string; doctor: string; icon: any; color: string }[] = [];
                          patientRegistrations.forEach(r => {
                            if (r.regTime) {
                              timeline.push({ time: new Date(r.regTime), type: 'registration', label: '挂号', detail: `${r.dept || ''} - ${r.doctorName || ''}`, doctor: r.doctorName || '-', icon: Calendar, color: 'text-orange-400 bg-orange-500/10' });
                            }
                          });
                          patientMedicalRecords.forEach(mr => {
                            if (mr.createTime) {
                              timeline.push({ time: new Date(mr.createTime), type: 'diagnosis', label: '诊疗', detail: mr.diagnosis || mr.chiefComplaint || '', doctor: mr.doctorName || '-', icon: Stethoscope, color: 'text-blue-400 bg-blue-500/10' });
                            }
                          });
                          patientPrescriptions.forEach(p => {
                            if (p.createTime) {
                              timeline.push({ time: new Date(p.createTime), type: 'prescription', label: '开药', detail: `处方 #${p.id} - ¥${(p.totalPrice || 0).toFixed(2)}`, doctor: p.doctorName || '-', icon: Pill, color: 'text-yellow-400 bg-yellow-500/10' });
                            }
                          });
                          patientCharges.forEach(c => {
                            if (c.chargeTime) {
                              timeline.push({ time: new Date(c.chargeTime), type: 'charge', label: '缴费', detail: `${c.chargeType || ''} - ¥${(c.totalFee || 0).toFixed(2)} (${c.paymentType || ''})`, doctor: '-', icon: CreditCard, color: 'text-teal-400 bg-teal-500/10' });
                            }
                          });
                          patientInpatients.forEach(ip => {
                            if (ip.admissionDate) {
                              timeline.push({ time: new Date(ip.admissionDate), type: 'admission', label: '住院', detail: `${ip.dept || ''} - ${ip.bedNo || ''}`, doctor: '-', icon: Hospital, color: 'text-purple-400 bg-purple-500/10' });
                            }
                            if (ip.dischargeDate) {
                              timeline.push({ time: new Date(ip.dischargeDate), type: 'discharge', label: '出院', detail: ip.dept || '', doctor: '-', icon: CheckCircle, color: 'text-slate-400 bg-slate-500/10' });
                            }
                          });
                          timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
                          return timeline.map((item, idx) => (
                            <div key={idx} className="flex gap-4 pb-5 relative">
                              <div className={`flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center z-10 ${item.color} border-2 border-surface-dim`}>
                                <item.icon size={16} />
                              </div>
                              <div className="flex-1 pt-1.5">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-headline font-bold text-sm uppercase tracking-tight">{item.label}</span>
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
                          ));
                        })()}
                      </div>
                    )}
                  </section>

                  {/* 挂号记录 */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Calendar size={16} /> 挂号记录 / REGISTRATIONS
                    </h4>
                    {patientRegistrations.length === 0 ? (
                      <p className="text-sm text-outline p-4 bg-surface-container-low rounded">暂无挂号记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-surface-container-high text-[10px] font-label text-outline uppercase tracking-wider">
                              <th className="p-2">科室</th>
                              <th className="p-2">医生</th>
                              <th className="p-2">挂号时间</th>
                              <th className="p-2">费用</th>
                              <th className="p-2">状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {patientRegistrations.map((r, i) => (
                              <tr key={r.id || i} className="hover:bg-surface-container-high">
                                <td className="p-2">{r.dept || '-'}</td>
                                <td className="p-2 font-medium">{r.doctorName || '-'}</td>
                                <td className="p-2 text-xs">{r.regTime ? new Date(r.regTime).toLocaleString('zh-CN') : '-'}</td>
                                <td className="p-2 font-mono">¥{(r.regFee || 0).toFixed(2)}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
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
                  </section>

                  {/* 病历记录 */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ClipboardList size={16} /> 病历记录 / MEDICAL RECORDS
                    </h4>
                    {patientMedicalRecords.length === 0 ? (
                      <p className="text-sm text-outline p-4 bg-surface-container-low rounded">暂无病历记录</p>
                    ) : (
                      <div className="space-y-3">
                        {patientMedicalRecords.map((mr, i) => (
                          <div key={mr.id || i} className="p-4 bg-surface-container-low rounded border border-outline-variant/10">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-label text-outline uppercase tracking-wider">
                                创建时间: {mr.createTime ? new Date(mr.createTime).toLocaleString('zh-CN') : '-'}
                                {mr.doctorName && <span className="ml-3">医生: {mr.doctorName}</span>}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {mr.chiefComplaint && (
                                <div className="col-span-2">
                                  <span className="text-[10px] font-label text-outline">主诉</span>
                                  <p className="mt-0.5">{mr.chiefComplaint}</p>
                                </div>
                              )}
                              {mr.diagnosis && (
                                <div className="col-span-2">
                                  <span className="text-[10px] font-label text-outline">诊断</span>
                                  <p className="mt-0.5 font-bold text-primary">{mr.diagnosis}</p>
                                </div>
                              )}
                              {mr.presentIllness && (
                                <div className="col-span-2">
                                  <span className="text-[10px] font-label text-outline">现病史</span>
                                  <p className="mt-0.5">{mr.presentIllness}</p>
                                </div>
                              )}
                              {mr.treatmentPlan && (
                                <div className="col-span-2">
                                  <span className="text-[10px] font-label text-outline">治疗方案</span>
                                  <p className="mt-0.5">{mr.treatmentPlan}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* 处方与药品信息 */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Pill size={16} /> 处方与药品 / PRESCRIPTIONS & DRUGS
                    </h4>
                    {patientPrescriptions.length === 0 ? (
                      <p className="text-sm text-outline p-4 bg-surface-container-low rounded">暂无处方记录</p>
                    ) : (
                      <div className="space-y-4">
                        {patientPrescriptions.map((p, i) => {
                          const items = patientPrescriptionItems.filter(item => item.prescriptionId === p.id);
                          return (
                            <div key={p.id || i} className="p-4 bg-surface-container-low rounded border border-outline-variant/10">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-label text-outline uppercase tracking-wider">
                                    处方 #{p.id} | {p.createTime ? new Date(p.createTime).toLocaleString('zh-CN') : '-'}
                                  </span>
                                  {p.doctorName && <span className="text-[10px] font-label text-outline">医生: {p.doctorName}</span>}
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                                    p.status === 'dispensed' ? 'bg-green-500/10 text-green-400' :
                                    p.status === 'active' ? 'bg-yellow-500/10 text-yellow-400' :
                                    p.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                    'bg-slate-500/10 text-slate-400'
                                  }`}>{p.status || '-'}</span>
                                </div>
                                <span className="font-mono text-sm text-tertiary">¥{(p.totalPrice || 0).toFixed(2)}</span>
                              </div>
                              {items.length > 0 && (
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="text-[10px] font-label text-outline uppercase tracking-wider">
                                      <th className="p-1">药品</th>
                                      <th className="p-1">规格</th>
                                      <th className="p-1">数量</th>
                                      <th className="p-1">单价</th>
                                      <th className="p-1">用法</th>
                                      <th className="p-1">天数</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-outline-variant/10">
                                    {items.map((item, j) => (
                                      <tr key={item.id || j}>
                                        <td className="p-1 font-medium">{item.drugName || `药品#${item.drugId}`}</td>
                                        <td className="p-1">{item.drugSpec || '-'}</td>
                                        <td className="p-1">{item.num}</td>
                                        <td className="p-1 font-mono">¥{(item.drugPrice || 0).toFixed(2)}</td>
                                        <td className="p-1">{item.usage || '-'}</td>
                                        <td className="p-1">{item.days || '-'}天</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* 收费记录 */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CreditCard size={16} /> 收费记录 / CHARGES
                    </h4>
                    {patientCharges.length === 0 ? (
                      <p className="text-sm text-outline p-4 bg-surface-container-low rounded">暂无收费记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-surface-container-high text-[10px] font-label text-outline uppercase tracking-wider">
                              <th className="p-2">收费类型</th>
                              <th className="p-2">金额</th>
                              <th className="p-2">支付方式</th>
                              <th className="p-2">收费时间</th>
                              <th className="p-2">状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {patientCharges.map((c, i) => (
                              <tr key={c.id || i} className="hover:bg-surface-container-high">
                                <td className="p-2">{c.chargeType || '-'}</td>
                                <td className="p-2 font-mono text-tertiary">¥{(c.totalFee || 0).toFixed(2)}</td>
                                <td className="p-2">{c.paymentType || '-'}</td>
                                <td className="p-2 text-xs">{c.chargeTime ? new Date(c.chargeTime).toLocaleString('zh-CN') : '-'}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                                    c.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                                    c.status === 'refunded' ? 'bg-red-500/10 text-red-400' :
                                    'bg-yellow-500/10 text-yellow-400'
                                  }`}>{c.status || '-'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* 住院记录 */}
                  <section>
                    <h4 className="font-headline font-bold text-sm text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Hospital size={16} /> 住院记录 / INPATIENT RECORDS
                    </h4>
                    {patientInpatients.length === 0 ? (
                      <p className="text-sm text-outline p-4 bg-surface-container-low rounded">暂无住院记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-surface-container-high text-[10px] font-label text-outline uppercase tracking-wider">
                              <th className="p-2">住院ID</th>
                              <th className="p-2">科室</th>
                              <th className="p-2">床位</th>
                              <th className="p-2">主治医生</th>
                              <th className="p-2">入院时间</th>
                              <th className="p-2">出院时间</th>
                              <th className="p-2">状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {patientInpatients.map((ip, i) => (
                              <tr key={ip.id || i} className="hover:bg-surface-container-high">
                                <td className="p-2 font-mono text-xs font-bold">{ip.inpatientNo || `IP${String(ip.id).padStart(6, '0')}`}</td>
                                <td className="p-2">{ip.dept || '-'}</td>
                                <td className="p-2">{ip.bedNo || '-'}</td>
                                <td className="p-2">
                                  <span className="flex items-center gap-1">
                                    <User size={12} className="text-primary" />
                                    {ip.doctorName || '-'}
                                  </span>
                                </td>
                                <td className="p-2 text-xs">{ip.admissionDate ? new Date(ip.admissionDate).toLocaleString('zh-CN') : '-'}</td>
                                <td className="p-2 text-xs">{ip.dischargeDate ? new Date(ip.dischargeDate).toLocaleString('zh-CN') : '-'}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                                    ip.status === 'discharged' ? 'bg-purple-500/10 text-purple-400' :
                                    ip.status === 'admitted' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-slate-500/10 text-slate-400'
                                  }`}>{ip.status === 'discharged' ? '已出院' : ip.status === 'admitted' ? '住院中' : ip.status || '-'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoMaintenance;
