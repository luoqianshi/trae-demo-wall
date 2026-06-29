import React, { useState, useEffect } from "react";
import { 
  Building2, Plus, Search, Edit, Trash2, Loader2, X, 
  Users, Stethoscope, Calendar
} from "lucide-react";
import { departmentService, doctorService } from "@/lib/services";
import type { Department, Doctor } from "@/lib/types";

interface DepartmentStats {
  deptId: number;
  doctorCount: number;
  patientCount: number;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptsData, docsData] = await Promise.all([
        departmentService.getAll(),
        doctorService.getAll()
      ]);
      setDepartments(deptsData);
      setDoctors(docsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeptStats = (deptName: string) => {
    const doctorCount = doctors.filter(d => d.dept === deptName).length;
    return { doctorCount };
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (dept: Department) => {
    const stats = getDeptStats(dept.name);
    if (stats.doctorCount > 0) {
      alert(`该科室下有 ${stats.doctorCount} 名医生，无法删除。请先调整医生所属科室。`);
      return;
    }
    
    if (confirm(`确定要删除科室 "${dept.name}" 吗？`)) {
      try {
        await departmentService.delete(dept.id);
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      alert('请输入科室名称');
      return;
    }

    setSaving(true);
    try {
      const deptData = {
        name: deptForm.name.trim(),
        description: deptForm.description.trim() || undefined
      };
      
      if (editingDept) {
        const result = await departmentService.update(editingDept.id, deptData);
        if (result.success) {
          alert('保存成功！');
          setDialogOpen(false);
          loadData();
        } else {
          alert('保存失败，请重试');
        }
      } else {
        const result = await departmentService.add(deptData);
        if (result.success) {
          alert('添加成功！');
          setDialogOpen(false);
          loadData();
        } else {
          alert('添加失败，请重试');
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold font-headline text-on-surface tracking-tight mb-2">
            科室管理 / DEPT MGMT
          </h1>
          <p className="text-xs text-outline font-label uppercase tracking-widest">
            医院科室 · 医生配置 / HOSPITAL DEPT & DOCTOR CONFIG
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] transition-all"
        >
          <Plus size={18} /> 新增科室
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_var(--shadow-color)] flex flex-col flex-1 overflow-hidden">
        <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="搜索科室名称或简介..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-outline-variant/30 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-72 bg-surface-container-lowest transition-all"
            />
          </div>
          <span className="text-sm text-on-surface-variant font-medium">
            共 <span className="font-bold text-on-surface">{filteredDepartments.length}</span> 个科室
          </span>
        </div>

        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium border-b border-border">科室名称</th>
                  <th className="px-4 py-3 font-medium border-b border-border">科室简介</th>
                  <th className="px-4 py-3 font-medium border-b border-border text-center">医生人数</th>
                  <th className="px-4 py-3 font-medium border-b border-border">创建时间</th>
                  <th className="px-4 py-3 font-medium border-b border-border text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                      <Building2 className="mx-auto mb-2 text-muted-foreground/50" size={48} />
                      <p>暂无科室数据</p>
                      <button
                        onClick={handleAdd}
                        className="text-primary hover:underline mt-2 text-sm"
                      >
                        点击添加第一个科室
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => {
                    const stats = getDeptStats(dept.name);
                    return (
                      <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mr-3">
                              <Building2 size={20} />
                            </div>
                            <span className="font-medium text-foreground">{dept.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground max-w-md truncate">
                          {dept.description || '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            stats.doctorCount > 0 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Stethoscope size={12} className="mr-1" />
                            {stats.doctorCount} 人
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {dept.createTime ? new Date(dept.createTime).toLocaleDateString('zh-CN') : '-'}
                        </td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(dept)}
                            className="text-primary hover:text-primary/70 inline-flex items-center text-xs font-medium px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                          >
                            <Edit size={14} className="mr-1" /> 编辑
                          </button>
                          <button
                            onClick={() => handleDelete(dept)}
                            className="text-destructive hover:text-destructive/70 inline-flex items-center text-xs font-medium px-2 py-1 rounded hover:bg-destructive/5 transition-colors"
                          >
                            <Trash2 size={14} className="mr-1" /> 删除
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-[540px] overflow-hidden">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-tertiary"></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/30">
                      <Building2 size={28} className="text-on-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-on-surface tracking-tight">
                        {editingDept ? '编辑科室信息' : '新增科室'}
                      </h3>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {editingDept ? '修改科室基本信息' : '添加新的科室到系统中'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDialogOpen(false)} 
                    className="text-on-surface-variant hover:text-on-surface p-2 hover:bg-surface-container rounded-xl transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
                      科室名称 <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      className="w-full border border-outline-variant/30 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-low transition-all"
                      placeholder="请输入科室名称，如：内科、外科等"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
                      科室简介
                    </label>
                    <textarea
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                      className="w-full border border-outline-variant/30 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-low resize-none transition-all"
                      rows={4}
                      placeholder="请输入科室简介（选填）"
                    />
                  </div>

                  <div className="px-8 py-5 bg-surface-container-low/50 flex justify-end gap-4 -mx-8 -mb-8 mt-6">
                    <button
                      type="button"
                      onClick={() => setDialogOpen(false)}
                      className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !deptForm.name.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          保存中...
                        </>
                      ) : (
                        editingDept ? '保存' : '添加'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
