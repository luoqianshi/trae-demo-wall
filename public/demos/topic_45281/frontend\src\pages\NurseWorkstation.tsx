import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Heart,
  Droplets,
  Thermometer,
  Activity,
  Clock,
  Plus,
  Search,
  Loader2,
  FileText,
  User,
  ClipboardList,
} from "lucide-react";
import { patientService, inpatientService, nurseRecordService, bedService } from "@/lib/services";
import type { Patient, Inpatient, NurseRecord, Bed } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

const NurseWorkstation: React.FC = () => {
  const { user } = useAuth();
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [nurseRecords, setNurseRecords] = useState<NurseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedInpatient, setSelectedInpatient] = useState<Inpatient | null>(null);
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [vitalForm, setVitalForm] = useState({
    temperature: "",
    pulse: "",
    bloodPressure: "",
    respiration: "",
    oxygenSaturation: "",
    nursingNotes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [inpatientsData, bedsData, patientsData, recordsData] = await Promise.all([
        inpatientService.getAll(),
        bedService.getAll(),
        patientService.getAll(),
        nurseRecordService.getAll(),
      ]);
      setInpatients(inpatientsData || []);
      setBeds(bedsData || []);
      setPatients(patientsData || []);
      setNurseRecords(recordsData || []);
    } catch (error) {
      console.error("加载数据失败:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const admittedInpatients = inpatients.filter(ip => ip.status === "admitted");

  const getPatientInfo = (patientId: number) => {
    return patients.find(p => p.id === patientId);
  };

  const getLatestVitalSigns = (inpatientId: number) => {
    const records = nurseRecords
      .filter(r => r.inpatientId === inpatientId)
      .sort((a, b) => new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime());
    return records[0];
  };

  const handleAddVitalSigns = async () => {
    if (!selectedInpatient) {
      alert("请先选择患者");
      return;
    }

    try {
      await nurseRecordService.add({
        inpatientId: selectedInpatient.id,
        patientName: selectedInpatient.patientName,
        vitalSigns: {
          temperature: vitalForm.temperature ? Number(vitalForm.temperature) : undefined,
          pulse: vitalForm.pulse ? Number(vitalForm.pulse) : undefined,
          bloodPressure: vitalForm.bloodPressure || undefined,
          respiration: vitalForm.respiration ? Number(vitalForm.respiration) : undefined,
          oxygenSaturation: vitalForm.oxygenSaturation ? Number(vitalForm.oxygenSaturation) : undefined,
        },
        nursingNotes: vitalForm.nursingNotes,
        nurseId: user?.relateId || 0,
        nurseName: user?.name || "护士",
        recordTime: new Date().toISOString(),
      });

      alert("生命体征记录成功");
      setShowVitalModal(false);
      setVitalForm({
        temperature: "",
        pulse: "",
        bloodPressure: "",
        respiration: "",
        oxygenSaturation: "",
        nursingNotes: "",
      });
      loadData();
    } catch (error) {
      console.error("记录失败:", error);
      alert("记录失败");
    }
  };

  return (
    <div className="h-full flex overflow-hidden bg-surface-dim">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Stethoscope className="text-secondary" size={20} />
              </div>
              <div>
                <h1 className="font-headline font-bold text-lg text-on-surface">护士工作站</h1>
                <p className="text-[10px] font-mono text-outline uppercase tracking-wider">Nurse Workstation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-mono text-outline uppercase">护理患者</p>
                <p className="text-xl font-headline font-bold text-secondary">{admittedInpatients.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-outline-variant/10 bg-surface-container-low/30 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                <User size={14} />
                住院患者列表
              </h3>
              <div className="space-y-2">
                {admittedInpatients.map((inpatient) => {
                  const latestVital = getLatestVitalSigns(inpatient.id);
                  return (
                    <div
                      key={inpatient.id}
                      onClick={() => setSelectedInpatient(inpatient)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedInpatient?.id === inpatient.id
                          ? "bg-primary-container/30 border border-primary/30"
                          : "bg-surface-container hover:bg-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-headline text-on-surface">{inpatient.patientName}</span>
                        <span className="text-[9px] font-mono text-primary">{inpatient.bedNo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-outline">
                        <span>{inpatient.dept}</span>
                        <span>|</span>
                        <span>{inpatient.doctorName}</span>
                      </div>
                      {latestVital && (
                        <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[9px] text-outline">
                            <Thermometer size={10} />
                            {latestVital.vitalSigns.temperature || "-"}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-outline">
                            <Heart size={10} />
                            {latestVital.vitalSigns.pulse || "-"}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-outline">
                            <Activity size={10} />
                            {latestVital.vitalSigns.oxygenSaturation || "-"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {admittedInpatients.length === 0 && (
                  <div className="text-xs text-outline text-center py-8">暂无住院患者</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedInpatient ? (
              <>
                <div className="p-6 border-b border-outline-variant/10 bg-surface">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-headline font-bold text-lg text-on-surface">{selectedInpatient.patientName}</h2>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-outline">
                          {getPatientInfo(selectedInpatient.patientId)?.gender} | {getPatientInfo(selectedInpatient.patientId)?.age}岁
                        </span>
                        <span className="text-xs text-primary font-mono">{selectedInpatient.bedNo}</span>
                        <span className="text-xs text-outline">{selectedInpatient.dept}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVitalModal(true)}
                      className="px-4 py-2 bg-secondary text-on-secondary font-headline text-xs uppercase tracking-wider rounded hover:bg-secondary/80 transition-colors flex items-center gap-2"
                    >
                      <Plus size={14} />
                      记录生命体征
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="text-primary" size={16} />
                        <span className="text-[10px] font-headline uppercase text-outline">体温</span>
                      </div>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        {getLatestVitalSigns(selectedInpatient.id)?.vitalSigns.temperature || "-"}
                        <span className="text-xs text-outline ml-1">°C</span>
                      </p>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="text-secondary" size={16} />
                        <span className="text-[10px] font-headline uppercase text-outline">脉搏</span>
                      </div>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        {getLatestVitalSigns(selectedInpatient.id)?.vitalSigns.pulse || "-"}
                        <span className="text-xs text-outline ml-1">次/分</span>
                      </p>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-tertiary" size={16} />
                        <span className="text-[10px] font-headline uppercase text-outline">血压</span>
                      </div>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        {getLatestVitalSigns(selectedInpatient.id)?.vitalSigns.bloodPressure || "-"}
                        <span className="text-xs text-outline ml-1">mmHg</span>
                      </p>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="text-primary" size={16} />
                        <span className="text-[10px] font-headline uppercase text-outline">血氧</span>
                      </div>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        {getLatestVitalSigns(selectedInpatient.id)?.vitalSigns.oxygenSaturation || "-"}
                        <span className="text-xs text-outline ml-1">%</span>
                      </p>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-outline" size={16} />
                        <span className="text-[10px] font-headline uppercase text-outline">呼吸</span>
                      </div>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        {getLatestVitalSigns(selectedInpatient.id)?.vitalSigns.respiration || "-"}
                        <span className="text-xs text-outline ml-1">次/分</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                      <ClipboardList size={14} />
                      护理记录
                    </h3>
                    <div className="space-y-3">
                      {nurseRecords
                        .filter(r => r.inpatientId === selectedInpatient.id)
                        .sort((a, b) => new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime())
                        .map((record) => (
                          <div key={record.id} className="bg-surface-container p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono text-primary">{record.recordTime}</span>
                              <span className="text-[10px] font-headline text-outline">{record.nurseName}</span>
                            </div>
                            <p className="text-xs text-on-surface leading-relaxed">{record.nursingNotes}</p>
                            <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center gap-4 text-[9px] text-outline">
                              <span>体温: {record.vitalSigns.temperature || "-"}°C</span>
                              <span>脉搏: {record.vitalSigns.pulse || "-"}次/分</span>
                              <span>血压: {record.vitalSigns.bloodPressure || "-"}</span>
                              <span>血氧: {record.vitalSigns.oxygenSaturation || "-"}%</span>
                            </div>
                          </div>
                        ))}
                      {nurseRecords.filter(r => r.inpatientId === selectedInpatient.id).length === 0 && (
                        <div className="text-xs text-outline text-center py-8">暂无护理记录</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ClipboardList className="mx-auto text-outline mb-4" size={48} />
                  <h2 className="font-headline text-xl text-outline uppercase tracking-widest">选择患者查看信息</h2>
                  <p className="text-sm text-outline/60 mt-2">从左侧列表选择患者进行护理</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showVitalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container rounded-lg w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6">记录生命体征</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">体温 (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalForm.temperature}
                  onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                  placeholder="36.5"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">脉搏 (次/分)</label>
                <input
                  type="number"
                  value={vitalForm.pulse}
                  onChange={(e) => setVitalForm({ ...vitalForm, pulse: e.target.value })}
                  placeholder="72"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">血压 (mmHg)</label>
                <input
                  type="text"
                  value={vitalForm.bloodPressure}
                  onChange={(e) => setVitalForm({ ...vitalForm, bloodPressure: e.target.value })}
                  placeholder="120/80"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">呼吸 (次/分)</label>
                <input
                  type="number"
                  value={vitalForm.respiration}
                  onChange={(e) => setVitalForm({ ...vitalForm, respiration: e.target.value })}
                  placeholder="18"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">血氧饱和度 (%)</label>
                <input
                  type="number"
                  value={vitalForm.oxygenSaturation}
                  onChange={(e) => setVitalForm({ ...vitalForm, oxygenSaturation: e.target.value })}
                  placeholder="98"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">护理记录</label>
                <textarea
                  value={vitalForm.nursingNotes}
                  onChange={(e) => setVitalForm({ ...vitalForm, nursingNotes: e.target.value })}
                  placeholder="请输入护理记录..."
                  rows={3}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowVitalModal(false)}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface font-headline text-xs uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddVitalSigns}
                  className="flex-1 px-4 py-3 bg-secondary text-on-secondary font-headline text-xs uppercase tracking-wider rounded hover:bg-secondary/80 transition-colors"
                >
                  确认记录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseWorkstation;
