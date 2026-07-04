import React, { useState, useEffect } from "react";
import {
  FileText,
  Archive,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  User,
  Calendar,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import { patientService, medicalRecordService, medicalRecordArchiveService } from "@/lib/services";
import type { Patient, MedicalRecord, MedicalRecordArchive } from "@/lib/types";

const MedicalRecordArchiveManagement: React.FC = () => {
  const [archives, setArchives] = useState<MedicalRecordArchive[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"list" | "archive" | "quality">("list");
  const [statusFilter, setStatusFilter] = useState<string>("全部");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<MedicalRecordArchive | null>(null);
  const [archiveForm, setArchiveForm] = useState({
    icdCode: "",
    icdName: "",
    qualityScore: 100,
  });

  const icdCodeSuggestions = [
    { code: "J18.901", name: "社区获得性肺炎" },
    { code: "I10.x00", name: "原发性高血压" },
    { code: "E11.900", name: "2型糖尿病" },
    { code: "J44.100", name: "慢性阻塞性肺疾病" },
    { code: "K29.500", name: "慢性胃炎" },
    { code: "I25.100", name: "冠状动脉粥样硬化性心脏病" },
    { code: "M79.300", name: "腰部劳损" },
    { code: "N39.000", name: "泌尿道感染" },
    { code: "A00.900", name: "霍乱" },
    { code: "J00.x00", name: "急性上呼吸道感染" },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const patientsRes = await fetch("/api/patients?size=99999");
      const patientsJson = await patientsRes.json();
      const [archivesData, recordsData] = await Promise.all([
        medicalRecordArchiveService.getAll(),
        medicalRecordService.getAll(),
      ]);
      setArchives(archivesData || []);
      setMedicalRecords(recordsData || []);
      setPatients(patientsJson.patients || []);
    } catch (error) {
      console.error("加载数据失败:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPatientNameById = (patientId: number) => patients.find((p) => p.id === patientId)?.name || "未知";

  const filteredArchives = archives.filter((archive) => {
    const matchesStatus = statusFilter === "全部" || archive.status === statusFilter;
    const matchesKeyword =
      !searchKeyword ||
      getPatientNameById(archive.patientId)?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      archive.icdCode?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      archive.icdName?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesStatus && matchesKeyword;
  });

  const pendingArchives = archives.filter((a) => a.status === "pending");
  const archivedArchives = archives.filter((a) => a.status === "archived");
  const completedArchives = archives.filter((a) => a.status === "completed");

  const unarchivedRecords = medicalRecords.filter((record) => {
    const hasArchive = archives.some((a) => a.recordId === record.id);
    return !hasArchive;
  });

  const handleArchiveRecord = async (recordId: number) => {
    try {
      await medicalRecordArchiveService.add({
        recordId,
        patientId: medicalRecords.find((r) => r.id === recordId)?.patientId || 0,
        patientName: patients.find((p) => p.id === medicalRecords.find((r) => r.id === recordId)?.patientId)?.name,
        icdCode: "",
        icdName: "",
       status: "pending",
      });
      alert("病案已提交归档");
      loadData();
    } catch (error) {
      console.error("提交归档失败:", error);
      alert("提交归档失败");
    }
  };

  const handleCompleteArchive = async () => {
    if (!selectedArchive) return;

    if (!archiveForm.icdCode || !archiveForm.icdName) {
      alert("请填写ICD编码和名称");
      return;
    }

    try {
      await medicalRecordArchiveService.archive(
        selectedArchive.id,
        archiveForm.icdCode,
        archiveForm.icdName,
        archiveForm.qualityScore
      );
      alert("病案归档完成");
      setShowArchiveModal(false);
      setSelectedArchive(null);
      setArchiveForm({ icdCode: "", icdName: "", qualityScore: 100 });
      loadData();
    } catch (error) {
      console.error("归档失败:", error);
      alert("归档失败");
    }
  };

  const handleUpdateArchiveStatus = async (archive: MedicalRecordArchive, status: "archived" | "completed") => {
    try {
      await medicalRecordArchiveService.update(archive.id, {status: status});
      alert("状态更新成功");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-tertiary/10 text-tertiary flex items-center gap-1"><Clock size={10} /> 待归档</span>;
      case "archived":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-primary/10 text-primary flex items-center gap-1"><Archive size={10} /> 已归档</span>;
      case "completed":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-secondary/10 text-secondary flex items-center gap-1"><CheckCircle size={10} /> 完成</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-dim">
      <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="text-secondary" size={20} />
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg text-on-surface">病案管理系统</h1>
              <p className="text-[10px] font-mono text-outline uppercase tracking-wider">Medical Record Archive</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">待归档</p>
              <p className="text-xl font-headline font-bold text-tertiary">{pendingArchives.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">已归档</p>
              <p className="text-xl font-headline font-bold text-primary">{archivedArchives.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">完成</p>
              <p className="text-xl font-headline font-bold text-secondary">{completedArchives.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-outline-variant/10 bg-surface">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "list" ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"
          }`}
        >
          <Archive size={14} className="inline mr-2" />
          归档列表
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "archive" ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"
          }`}
        >
          <FileText size={14} className="inline mr-2" />
          病历回收
        </button>
        <button
          onClick={() => setActiveTab("quality")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "quality" ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"
          }`}
        >
          <ClipboardCheck size={14} className="inline mr-2" />
          质量评分
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-primary-container" size={40} />
          </div>
        ) : (
          <>
            {activeTab === "list" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="搜索患者姓名、ICD编码或名称..."
                      className="w-full pl-10 pr-4 py-2 bg-surface-container border-none text-sm text-on-surface rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["全部", "pending", "archived", "completed"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 text-[10px] font-headline uppercase tracking-wider rounded transition-colors ${
                          statusFilter === status
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-outline hover:bg-surface-container-high"
                        }`}
                      >
                        {status === "全部"
                          ? "全部"
                          : status === "pending"
                          ? "待归档"
                          : status === "archived"
                          ? "已归档"
                          : "完成"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-high">
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者姓名</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">病历编号</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">ICD编码</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">ICD名称</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">质量评分</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">归档人</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">归档时间</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">状态</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArchives.map((archive) => (
                        <tr key={archive.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-headline text-primary">{getPatientNameById(archive.patientId)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-on-surface">MR{archive.recordId.toString().padStart(6, "0")}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-outline">{archive.icdCode || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline max-w-[150px] truncate block">{archive.icdName || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {archive.qualityScore ? (
                              <span className={`text-xs font-mono ${
                                archive.qualityScore >= 90 ? "text-secondary" :
                                archive.qualityScore >= 80 ? "text-primary" :
                                "text-tertiary"
                              }`}>
                                {archive.qualityScore}
                              </span>
                            ) : (
                              <span className="text-xs text-outline">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{archive.archiver || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-outline">{archive.archiveTime?.split(" ")[0] || "-"}</span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(archive.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {archive.status === "pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedArchive(archive);
                                    setArchiveForm({
                                      icdCode: archive.icdCode || "",
                                      icdName: archive.icdName || "",
                                      qualityScore: archive.qualityScore || 100,
                                    });
                                    setShowArchiveModal(true);
                                  }}
                                  className="px-2 py-1 text-[9px] font-headline uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                                >
                                  编码归档
                                </button>
                              )}
                              {archive.status === "archived" && (
                                <button
                                  onClick={() => handleUpdateArchiveStatus(archive, "completed")}
                                  className="px-2 py-1 text-[9px] font-headline uppercase bg-secondary/10 text-secondary hover:bg-secondary/20 rounded transition-colors"
                                >
                                  完成
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredArchives.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-xs text-outline">
                            暂无归档记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "archive" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">待回收病历</p>
                        <p className="text-2xl font-headline font-bold text-tertiary mt-1">{unarchivedRecords.length}</p>
                      </div>
                      <FileText className="text-tertiary/50" size={32} />
                    </div>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">已提交归档</p>
                        <p className="text-2xl font-headline font-bold text-primary mt-1">{pendingArchives.length}</p>
                      </div>
                      <Clock className="text-primary/50" size={32} />
                    </div>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">本月归档</p>
                        <p className="text-2xl font-headline font-bold text-secondary mt-1">{completedArchives.length}</p>
                      </div>
                      <CheckCircle className="text-secondary/50" size={32} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4">待回收病历</h3>
                  <div className="bg-surface-container rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-container-high">
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">病历编号</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者姓名</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">诊断</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">创建时间</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unarchivedRecords.map((record) => (
                          <tr key={record.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono text-primary">MR{record.id.toString().padStart(6, "0")}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-headline text-on-surface">{patients.find((p) => p.id === record.patientId)?.name || "-"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-outline max-w-[200px] truncate block">{record.diagnosis || "-"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono text-outline">{record.createTime?.split(" ")[0]}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleArchiveRecord(record.id)}
                                className="px-3 py-1 text-[9px] font-headline uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                              >
                                提交归档
                              </button>
                            </td>
                          </tr>
                        ))}
                        {unarchivedRecords.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-xs text-outline">
                              暂无待回收病历
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "quality" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4">病案质量评分统计</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">90-100分</p>
                          <p className="text-2xl font-headline font-bold text-secondary mt-1">
                            {archives.filter((a) => a.qualityScore && a.qualityScore >= 90).length}
                          </p>
                        </div>
                        <CheckCircle className="text-secondary/50" size={32} />
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">80-89分</p>
                          <p className="text-2xl font-headline font-bold text-primary mt-1">
                            {archives.filter((a) => a.qualityScore && a.qualityScore >= 80 && a.qualityScore < 90).length}
                          </p>
                        </div>
                        <ClipboardCheck className="text-primary/50" size={32} />
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">60-79分</p>
                          <p className="text-2xl font-headline font-bold text-tertiary mt-1">
                            {archives.filter((a) => a.qualityScore && a.qualityScore >= 60 && a.qualityScore < 80).length}
                          </p>
                        </div>
                        <AlertCircle className="text-tertiary/50" size={32} />
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">60分以下</p>
                          <p className="text-2xl font-headline font-bold text-outline mt-1">
                            {archives.filter((a) => a.qualityScore && a.qualityScore < 60).length}
                          </p>
                        </div>
                        <AlertCircle className="text-outline/50" size={32} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4">质量评分详情</h3>
                  <div className="bg-surface-container rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-container-high">
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者姓名</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">ICD编码</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">ICD名称</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">质量评分</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">归档人</th>
                          <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">归档时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archives
                          .filter((a) => a.qualityScore !== undefined && a.qualityScore !== null)
                          .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
                          .map((archive) => (
                            <tr key={archive.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                              <td className="px-4 py-3">
                                <span className="text-xs font-headline text-primary">{getPatientNameById(archive.patientId)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-outline">{archive.icdCode || "-"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-outline">{archive.icdName || "-"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        (archive.qualityScore || 0) >= 90
                                          ? "bg-secondary"
                                          : (archive.qualityScore || 0) >= 80
                                          ? "bg-primary"
                                          : (archive.qualityScore || 0) >= 60
                                          ? "bg-tertiary"
                                          : "bg-outline"
                                      }`}
                                      style={{ width: `${archive.qualityScore || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-xs font-mono ${
                                    (archive.qualityScore || 0) >= 90 ? "text-secondary" :
                                    (archive.qualityScore || 0) >= 80 ? "text-primary" :
                                    (archive.qualityScore || 0) >= 60 ? "text-tertiary" : "text-outline"
                                  }`}>
                                    {archive.qualityScore}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-outline">{archive.archiver || "-"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-outline">{archive.archiveTime?.split(" ")[0] || "-"}</span>
                              </td>
                            </tr>
                          ))}
                        {archives.filter((a) => a.qualityScore !== undefined && a.qualityScore !== null).length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-xs text-outline">
                              暂无评分记录
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showArchiveModal && selectedArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container rounded-lg w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6">ICD编码归档</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">患者姓名</label>
                <p className="text-sm font-headline text-on-surface">{getPatientNameById(selectedArchive.patientId)}</p>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">ICD编码</label>
                <input
                  type="text"
                  value={archiveForm.icdCode}
                  onChange={(e) => setArchiveForm({ ...archiveForm, icdCode: e.target.value })}
                  placeholder="请输入ICD编码"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
                <div className="mt-2 space-y-1">
                  {icdCodeSuggestions
                    .filter((s) => s.code.includes(archiveForm.icdCode) || s.name.includes(archiveForm.icdCode))
                    .slice(0, 3)
                    .map((suggestion) => (
                      <button
                        key={suggestion.code}
                        onClick={() => setArchiveForm({ ...archiveForm, icdCode: suggestion.code, icdName: suggestion.name })}
                        className="w-full text-left px-2 py-1 text-[10px] text-outline hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                      >
                        {suggestion.code} - {suggestion.name}
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">ICD名称</label>
                <input
                  type="text"
                  value={archiveForm.icdName}
                  onChange={(e) => setArchiveForm({ ...archiveForm, icdName: e.target.value })}
                  placeholder="请输入ICD名称"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">质量评分</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={archiveForm.qualityScore}
                    onChange={(e) => setArchiveForm({ ...archiveForm, qualityScore: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className={`text-sm font-mono ${
                    archiveForm.qualityScore >= 90 ? "text-secondary" :
                    archiveForm.qualityScore >= 80 ? "text-primary" :
                    archiveForm.qualityScore >= 60 ? "text-tertiary" : "text-outline"
                  }`}>
                    {archiveForm.qualityScore}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowArchiveModal(false);
                    setSelectedArchive(null);
                  }}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface font-headline text-xs uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCompleteArchive}
                  className="flex-1 px-4 py-3 bg-primary text-on-primary font-headline text-xs uppercase tracking-wider rounded hover:bg-primary/80 transition-colors"
                >
                  确认归档
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordArchiveManagement;
