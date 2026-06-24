import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserStore, useBabyStore, useSettingsStore } from '../store/index';
import { babyService } from '../services/babyService';
import { healthService } from '../services/healthService';
import { authService } from '../services/auth';
import { storage, STORAGE_KEYS } from '../utils/storage';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, updateProfile: storeUpdateProfile, logout: storeLogout } = useUserStore();
  const { baby: storeBaby, setBaby: setStoreBaby, updateBaby: updateStoreBaby } = useBabyStore();
  const { notifications: storeNotifications, toggleNotification: toggleStoreNotification } = useSettingsStore();

  const [activeSection, setActiveSection] = useState<'menu' | 'baby' | 'health' | 'settings'>('menu');
  const [isSaving, setIsSaving] = useState(false);

  // 宝宝信息状态
  const [babyName, setBabyName] = useState('');
  const [babyGender, setBabyGender] = useState<'男' | '女'>('男');
  const [babyBirth, setBabyBirth] = useState('');
  const [babyHeight, setBabyHeight] = useState('');
  const [babyWeight, setBabyWeight] = useState('');

  // 用户昵称状态
  const [nickName, setNickName] = useState('');

  // 通知设置状态
  const [notifications, setNotifications] = useState({
    feeding: true,
    sleep: true,
    vaccine: true,
    news: true,
  });

  // 健康记录状态
  const [checkups, setCheckups] = useState<Array<{
    id: string;
    date: string;
    checkupType: string;
    doctorNotes?: string;
  }>>([]);
  const [vaccinations, setVaccinations] = useState<Array<{
    id: string;
    vaccineName: string;
    type: string;
    scheduledDate: string;
    actualDate?: string;
    status: string;
  }>>([]);

  // 当前宝宝ID
  const [currentBabyId, setCurrentBabyId] = useState<string | null>(null);

  // ===== 新增：多宝宝列表状态 =====
  const [babiesList, setBabiesList] = useState<Array<{
    id: string;
    name: string;
    gender: 'male' | 'female';
    birthday?: string;
    avatar?: string;
  }>>([]);

  // ===== 新增：头像上传状态 =====
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 从Store初始化用户信息
  useEffect(() => {
    if (user) {
      setNickName(user.nickname || '未设置昵称');
    }
  }, [user]);

  // 初始化通知设置
  useEffect(() => {
    setNotifications(storeNotifications);
  }, [storeNotifications]);

  // 加载数据（后台静默，不阻塞页面）
  useEffect(() => {
    // 从Store初始化表单（Store已从localStorage恢复）
    if (storeBaby) {
      setBabyName(storeBaby.name || '');
      setBabyGender(storeBaby.gender || '男');
      setBabyBirth(storeBaby.birthDate || '');
      setCurrentBabyId(storeBaby.id);
      setBabyHeight(storeBaby.height ? String(storeBaby.height) : '');
      setBabyWeight(storeBaby.weight ? String(storeBaby.weight) : '');
    }

    // 后台尝试从API同步数据
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await loadBabyData();
      // 加载本地头像
      const savedAvatar = storage.get<string>('wdhr_avatar');
      if (savedAvatar) {
        setLocalAvatar(savedAvatar);
        // 同步到userStore
        storeUpdateProfile({ avatar: savedAvatar });
      }
    } catch (error) {
      console.error('后台加载数据失败（使用本地缓存）:', error);
    }
  };

  const loadBabyData = async () => {
    try {
      const babiesRes = await babyService.getBabies();
      if (babiesRes?.data && Array.isArray(babiesRes.data) && babiesRes.data.length > 0) {
        // 保存完整的宝宝列表用于切换
        setBabiesList(babiesRes.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          gender: b.gender,
          birthday: b.birthday,
          avatar: b.avatar,
        })));

        const firstBaby = babiesRes.data[0];
        setCurrentBabyId(firstBaby.id);

        // 更新表单状态
        setBabyName(firstBaby.name || '');
        setBabyGender(firstBaby.gender === 'male' ? '男' : '女');
        setBabyBirth(firstBaby.birthday || '');

        // 同步到store
        setStoreBaby({
          id: firstBaby.id,
          name: firstBaby.name,
          gender: firstBaby.gender === 'male' ? '男' : '女',
          birthDate: firstBaby.birthday,
        });

        // 加载健康记录
        loadHealthData(firstBaby.id);
      }
      // 如果没有宝宝数据，让用户在编辑页面新建（不报错）
    } catch (error) {
      console.error('加载宝宝信息失败:', error);
      // 如果有store数据，使用store数据作为fallback
      if (storeBaby?.id) {
        setBabyName(storeBaby.name || '');
        setBabyGender(storeBaby.gender || '男');
        setBabyBirth(storeBaby.birthDate || '');
        setCurrentBabyId(storeBaby.id);
      }
    }
  };

  // ===== 新增：切换当前宝宝 =====
  const handleSwitchBaby = (babyId: string) => {
    const baby = babiesList.find(b => b.id === babyId);
    if (!baby) return;

    setCurrentBabyId(babyId);
    setBabyName(baby.name || '');
    setBabyGender(baby.gender === 'male' ? '男' : '女');
    setBabyBirth(baby.birthday || '');

    // 同步到store
    setStoreBaby({
      id: baby.id,
      name: baby.name,
      gender: baby.gender === 'male' ? '男' : '女',
      birthDate: baby.birthday || '',
    });

    toast.success(`已切换到 ${baby.name}`);
    setActiveSection('menu');
  };

  // ===== 新增：添加新宝宝（打开表单） =====
  const handleAddNewBaby = () => {
    setCurrentBabyId(null); // 清空ID表示新建模式
    setBabyName('');
    setBabyGender('男');
    setBabyBirth('');
    setBabyHeight('');
    setBabyWeight('');
    setActiveSection('baby'); // 跳转到宝宝编辑页面
  };

  // ===== 新增：头像上传处理 =====
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setLocalAvatar(base64);

      // 存入localStorage
      storage.set('wdhr_avatar', base64);

      // 同步到userStore
      storeUpdateProfile({ avatar: base64 });

      toast.success('头像已更新 ✨');
      setShowAvatarOptions(false);
    };
    reader.onerror = () => {
      toast.error('读取图片失败，请重试');
    };
    reader.readAsDataURL(file);

    // 重置input以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 触发文件选择
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 隐藏原生input
  const renderHiddenFileInput = () => (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleAvatarUpload}
      className="hidden"
      capture="environment" // 移动端优先使用后置摄像头
    />
  );

  const loadHealthData = async (babyId: string) => {
    try {
      // 并行加载体检和疫苗记录
      const [checkupsRes, vaccinationsRes] = await Promise.all([
        healthService.getCheckups(babyId).catch(() => ({ data: null })),
        healthService.getVaccinations(babyId).catch(() => ({ data: null })),
      ]);

      if (checkupsRes?.data) setCheckups(checkupsRes.data);
      if (vaccinationsRes?.data) setVaccinations(vaccinationsRes.data);
    } catch (error) {
      console.error('加载健康记录失败:', error);
    }
  };

  const calculateAge = (birth: string) => {
    if (!birth) return '未设置生日';

    const birthDate = new Date(birth);
    const now = new Date();
    const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

    if (months < 0) return '出生日期无效';
    if (months >= 12) {
      return `${Math.floor(months / 12)}岁${months % 12}个月`;
    }
    return `${months}个月${now.getDate() - birthDate.getDate()}天`;
  };

  // 将体检和疫苗记录合并为统一格式用于显示
  const getHealthRecords = () => {
    const records: Array<{ date: string; type: string; content: string; doctor: string }> = [];

    // 添加体检记录
    checkups.forEach((checkup) => {
      records.push({
        date: checkup.date,
        type: '体检',
        content: checkup.doctorNotes || `${checkup.checkupType === 'routine' ? '常规' : checkup.checkupType === 'follow_up' ? '随访' : '专项'}体检`,
        doctor: '医生',
      });
    });

    // 添加疫苗记录
    vaccinations.forEach((vaccine) => {
      if (vaccine.actualDate || vaccine.status === 'completed') {
        records.push({
          date: vaccine.actualDate || vaccine.scheduledDate,
          type: '疫苗',
          content: `${vaccine.vaccineName}${vaccine.type === 'paid' ? '(自费)' : '(免费)'}`,
          doctor: '社区医院',
        });
      }
    });

    // 按日期排序（最新的在前）
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const healthRecords = getHealthRecords();

  const menuItems = [
    { icon: '👶', label: '宝宝信息', section: 'baby' as const, desc: '管理宝宝基本资料' },
    { icon: '🏥', label: '健康档案', section: 'health' as const, desc: '体检、疫苗、就诊记录' },
    { icon: '📚', label: '知识库', path: '/knowledge', desc: '科学育儿知识' },
    { icon: '📰', label: '安全动态', path: '/news', desc: '母婴安全资讯' },
    { icon: '⚙️', label: '设置', section: 'settings' as const, desc: '通知与偏好设置' },
    { icon: '❓', label: '帮助与反馈', path: '/', desc: '常见问题与建议' },
  ];

  // 保存宝宝信息（本地优先 + 后台API同步）
  const handleSaveBaby = async () => {
    if (!babyName.trim()) {
      toast.error('请输入宝宝昵称');
      return;
    }

    if (!babyBirth) {
      toast.error('请选择出生日期');
      return;
    }

    setIsSaving(true);
    try {
      const babyData = {
        name: babyName,
        gender: babyGender === '男' ? 'male' as const : 'female' as const,
        birthday: babyBirth,
        height: babyHeight ? parseFloat(babyHeight) : undefined,
        weight: babyWeight ? parseFloat(babyWeight) : undefined,
      };

      // ===== 本地优先：先写入localStorage（保证一定成功）=====
      const newId = currentBabyId || `baby_${Date.now()}`;
      const localBabyData = {
        id: newId,
        name: babyName,
        gender: babyGender,
        birthDate: babyBirth,
        height: babyHeight ? parseFloat(babyHeight) : undefined,
        weight: babyWeight ? parseFloat(babyWeight) : undefined,
      };

      // 保存到localStorage
      storage.set(STORAGE_KEYS.BABY, localBabyData);

      // 同步到Store
      updateStoreBaby(localBabyData);
      setCurrentBabyId(newId);

      // ===== 后台静默尝试API同步（不阻塞用户）=====
      try {
        if (currentBabyId) {
          await babyService.updateBaby(currentBabyId, babyData);
        } else {
          const createRes = await babyService.createBaby(babyData);
          if ((createRes as any)?.data?.id) {
            setCurrentBabyId((createRes as any).data.id);
          }
        }
      } catch (apiError) {
        console.log('API同步失败，数据已保存在本地:', apiError);
      }

      toast.success(currentBabyId ? '👶 宝宝信息已保存！' : '👶 宝宝信息已添加！');
      setActiveSection('menu');
    } catch (error) {
      console.error('保存宝宝信息失败:', error);
      toast.error(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 保存设置
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // 保存昵称到store和后端
      if (nickName !== user?.nickname) {
        storeUpdateProfile({ nickname: nickName });

        // TODO: 调用用户更新API（如果后端支持）
        // try {
        //   await api.put('/auth/profile', { nickname: nickName });
        // } catch (e) {
        //   console.warn('更新昵称到后端失败:', e);
        // }
      }

      // 通知设置已经通过store自动保存了

      toast.success('设置已保存！');
      setActiveSection('menu');
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error('保存设置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 切换通知设置
  const toggleNotification = (key: keyof typeof notifications) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    toggleStoreNotification(key); // 同步到store
  };

  // 退出登录
  const handleLogout = () => {
    try {
      authService.logout();
      toast.success('已退出登录');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('退出登录失败:', error);
      storeLogout();
      navigate('/login', { replace: true });
    }
  };

  // 清除本地缓存
  const handleClearCache = () => {
    if (!window.confirm('确定要清除所有本地数据吗？\n（包括记录、设置等，不会影响账号）')) return;
    try {
      storage.remove(STORAGE_KEYS.RECORDS);
      storage.remove(STORAGE_KEYS.BABY);
      storage.remove(STORAGE_KEYS.SETTINGS);
      setBabyName('');
      setBabyBirth('');
      setBabyHeight('');
      setBabyWeight('');
      setCurrentBabyId(null);
      setCheckups([]);
      setVaccinations([]);
      toast.success('缓存已清除');
    } catch {
      toast.error('清除失败，请重试');
    }
  };

  // 数据备份（导出JSON）
  const handleBackupData = () => {
    try {
      const backupData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        user: storage.get(STORAGE_KEYS.USER),
        baby: storage.get(STORAGE_KEYS.BABY),
        records: storage.get(STORAGE_KEYS.RECORDS),
        settings: storage.get(STORAGE_KEYS.SETTINGS),
      };
      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `吾滴孩儿_数据备份_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('📦 数据备份成功！');
    } catch {
      toast.error('备份失败，请重试');
    }
  };

  // 数据恢复（导入JSON）
  const handleRestoreData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !data.exportTime) {
          toast.error('无效的备份文件格式');
          return;
        }
        if (!window.confirm(`即将恢复 ${data.exportTime} 的备份数据，当前本地数据将被覆盖，确定继续？`)) return;

        if (data.user) storage.set(STORAGE_KEYS.USER, data.user);
        if (data.baby) { storage.set(STORAGE_KEYS.BABY, data.baby); setBabyName(data.baby.name || ''); }
        if (data.records) storage.set(STORAGE_KEYS.RECORDS, data.records);
        if (data.settings) storage.set(STORAGE_KEYS.SETTINGS, data.settings);

        toast.success('✅ 数据恢复成功！页面将刷新...');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error('文件解析失败，请检查文件格式');
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-6 py-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary">👤 我的</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {activeSection === 'menu' && (
          <>
            {/* User Info - 增强头像上传 */}
            <div className="card flex items-center space-x-4 relative">
              {renderHiddenFileInput()}

              {/* 头像区域 - 支持点击上传 */}
              <div className="relative">
                <div
                  onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-soft-blue to-soft-pink flex items-center justify-center text-3xl cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                >
                  {(localAvatar || user?.avatar) ? (
                    <img src={localAvatar || user?.avatar} alt="头像" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </div>

                {/* 头像选项弹窗 */}
                {showAvatarOptions && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAvatarOptions(false)}
                    ></div>
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-2 z-50 min-w-[140px] border border-cream">
                      <button
                        onClick={triggerFileInput}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-cream flex items-center gap-2 transition-colors"
                      >
                        📸 拍照
                      </button>
                      <button
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute('capture');
                          }
                          triggerFileInput();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-cream flex items-center gap-2 transition-colors"
                      >
                        🖼️ 从相册选择
                      </button>
                      <hr className="my-1 border-cream" />
                      <button
                        onClick={() => {
                          setShowAvatarOptions(false);
                          setLocalAvatar(null);
                          storage.remove('wdhr_avatar');
                          storeUpdateProfile({ avatar: undefined });
                          toast.success('头像已移除');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        🗑️ 移除头像
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary">{nickName || (isLoggedIn ? user?.nickname || '用户' : '未登录')}</h3>
                <p className="text-sm text-text-secondary">{isLoggedIn ? '点击头像更换' : '请先登录'}</p>
              </div>
              <span className="text-2xl text-text-secondary">›</span>
            </div>

            {/* Baby Info - 增强多宝宝切换 */}
            <div className="card bg-gradient-to-r from-soft-blue to-light-blue">
              {/* 多宝宝选择器 */}
              {babiesList.length > 1 && (
                <div className="mb-4 pb-4 border-b border-white/30">
                  <p className="text-xs text-white/80 mb-2 font-medium">切换宝宝</p>
                  <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                    {babiesList.map((baby) => (
                      <button
                        key={baby.id}
                        onClick={() => handleSwitchBaby(baby.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          currentBabyId === baby.id
                            ? 'bg-white/30 scale-105'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                          currentBabyId === baby.id ? 'border-white' : 'border-transparent'
                        }`}>
                          {baby.avatar ? (
                            <img src={baby.avatar} alt={baby.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/80 flex items-center justify-center text-xl">
                              {baby.gender === 'male' ? '👦' : '👧'}
                            </div>
                          )}
                        </div>
                        <span className={`text-[11px] font-medium ${
                          currentBabyId === baby.id ? 'text-white' : 'text-white/70'
                        }`}>
                          {baby.name.length > 4 ? baby.name.slice(0, 4) + '..' : baby.name}
                        </span>
                      </button>
                    ))}

                    {/* 添加按钮 */}
                    <button
                      onClick={handleAddNewBaby}
                      className="flex-shrink-0 w-[52px] h-[72px] rounded-xl border-2 border-dashed border-white/50 flex flex-col items-center justify-center gap-1 hover:border-white hover:bg-white/10 transition-all"
                    >
                      <span className="text-xl text-white/70">+</span>
                      <span className="text-[10px] text-white/60">添加</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl">
                  👶
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">宝宝：{babyName || '未设置'}</h3>
                  <p className="text-sm text-text-secondary">{babyGender} · {calculateAge(babyBirth)}</p>
                  <p className="text-xs text-text-light">身高{babyHeight || '--'}cm · 体重{babyWeight || '--'}kg</p>
                </div>
                <button onClick={() => setActiveSection('baby')} className="text-sm text-ice-blue">编辑</button>
              </div>

              {/* 单个宝宝时也显示添加按钮 */}
              {babiesList.length <= 1 && (
                <div className="mt-3 pt-3 border-t border-white/30">
                  <button
                    onClick={handleAddNewBaby}
                    className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <span>+</span> 添加另一个宝宝
                  </button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
              {menuItems.map((item, index) => {
                const content = (
                  <>
                    <span className="text-2xl mr-4">{item.icon}</span>
                    <div className="flex-1">
                      <span className="text-text-primary font-medium block">{item.label}</span>
                      <span className="text-xs text-text-light">{item.desc}</span>
                    </div>
                    <span className="text-2xl text-text-secondary">›</span>
                  </>
                );
                if (item.section) {
                  return (
                    <div
                      key={index}
                      onClick={() => setActiveSection(item.section!)}
                      className="flex items-center px-6 py-5 border-b border-cream last:border-b-0 hover:bg-cream transition-colors cursor-pointer"
                    >
                      {content}
                    </div>
                  );
                }
                return (
                  <Link
                    key={index}
                    to={item.path!}
                    className="flex items-center px-6 py-5 border-b border-cream last:border-b-0 hover:bg-cream transition-colors cursor-pointer"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>

            {/* 数据统计 — 从localStorage读取真实数据 */}
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">📈 我的数据</h2>
              {(() => {
                try {
                  const records = storage.get<Array<{ id: string; type: string }>>(STORAGE_KEYS.RECORDS) || [];
                  const feedingCount = records.filter(r => r.type === 'feeding').length;
                  const sleepCount = records.filter(r => r.type === 'sleep').length;
                  const diaperCount = records.filter(r => r.type === 'diaper').length;

                  // ===== 新增：同步状态和存储用量 =====
                  const totalRecords = records.length;
                  const lastSyncTime = storage.get<string>('wdhr_last_sync_time');
                  let syncStatusText = '从未';
                  if (lastSyncTime) {
                    const syncDate = new Date(lastSyncTime);
                    const now = new Date();
                    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / 60000);
                    if (diffMinutes < 1) syncStatusText = '刚刚';
                    else if (diffMinutes < 60) syncStatusText = `${diffMinutes}分钟前`;
                    else if (diffMinutes < 1440) syncStatusText = `${Math.floor(diffMinutes / 60)}小时前`;
                    else syncStatusText = syncDate.toLocaleDateString('zh-CN');
                  }

                  // 存储用量（使用storage.getUsageKB方法）
                  let usedKB = 0;
                  let totalKB = 5120; // 默认5MB限制
                  try {
                    // 尝试调用getUsageKB方法
                    if (typeof storage.getUsageKB === 'function') {
                      usedKB = storage.getUsageKB();
                    } else {
                      // fallback：简单估算
                      const allData = JSON.stringify(localStorage);
                      usedKB = Math.round(new Blob([allData]).size / 1024);
                    }
                  } catch {
                    const allData = JSON.stringify(localStorage);
                    usedKB = Math.round(new Blob([allData]).size / 1024);
                  }

                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-soft-pink rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-text-primary">{feedingCount}</p>
                          <p className="text-xs text-text-secondary">喂养记录</p>
                        </div>
                        <div className="bg-mint rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-text-primary">{sleepCount}</p>
                          <p className="text-xs text-text-secondary">睡眠记录</p>
                        </div>
                        <div className="bg-light-yellow rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-text-primary">{diaperCount}</p>
                          <p className="text-xs text-text-secondary">排便记录</p>
                        </div>
                      </div>

                      {/* ===== 新增：同步状态指示器 ===== */}
                      <div className="bg-gradient-to-r from-soft-blue/10 to-light-blue/10 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            🔄 同步状态
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            lastSyncTime ? 'bg-mint text-green-700' : 'bg-light-yellow text-orange-600'
                          }`}>
                            {lastSyncTime ? '已同步' : '仅本地'}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          本地已保存 {totalRecords} 条记录 · 上次同步: {syncStatusText}
                        </p>
                      </div>

                      {/* ===== 新增：存储用量显示 ===== */}
                      <div className="bg-cream rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            💾 存储空间
                          </span>
                          <span className="text-xs text-text-secondary">
                            已使用 {usedKB} KB / {(totalKB / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              (usedKB / totalKB) > 0.8 ? 'bg-red-400' :
                              (usedKB / totalKB) > 0.5 ? 'bg-yellow-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min((usedKB / totalKB) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className={`text-[10px] mt-1 ${
                          (usedKB / totalKB) > 0.8 ? 'text-red-500' : 'text-text-light'
                        }`}>
                          {(usedKB / totalKB) > 0.8 ? '⚠️ 存储空间不足，建议清理或备份数据' : '✅ 存储空间充足'}
                        </p>
                      </div>
                    </>
                  );
                } catch {
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-soft-pink rounded-2xl p-4 text-center"><p className="text-2xl font-bold">--</p><p className="text-xs text-text-secondary">喂养记录</p></div>
                      <div className="bg-mint rounded-2xl p-4 text-center"><p className="text-2xl font-bold">--</p><p className="text-xs text-text-secondary">睡眠记录</p></div>
                      <div className="bg-light-yellow rounded-2xl p-4 text-center"><p className="text-2xl font-bold">--</p><p className="text-xs text-text-secondary">排便记录</p></div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white rounded-2xl text-text-secondary shadow-lg hover:bg-soft-pink/20 transition-colors"
            >
              退出登录
            </button>
          </>
        )}

        {/* 宝宝信息编辑 */}
        {activeSection === 'baby' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <button onClick={() => setActiveSection('menu')} className="text-sm text-ice-blue mr-4">
                ‹ 返回
              </button>
              <h2 className="text-xl font-semibold text-text-primary">👶 宝宝信息</h2>
            </div>

            <div className="card space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-soft-blue to-soft-pink flex items-center justify-center text-5xl">
                  👶
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">宝宝昵称</label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">性别</label>
                <div className="grid grid-cols-2 gap-3">
                  {['男', '女'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setBabyGender(g as '男' | '女')}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        babyGender === g
                          ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                          : 'bg-cream text-text-secondary'
                      }`}
                    >
                      {g === '男' ? '👦' : '👧'} {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">出生日期</label>
                <input
                  type="date"
                  value={babyBirth}
                  onChange={(e) => setBabyBirth(e.target.value)}
                  className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">身高(cm)</label>
                  <input
                    type="number"
                    value={babyHeight}
                    onChange={(e) => setBabyHeight(e.target.value)}
                    className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">体重(kg)</label>
                  <input
                    type="number"
                    value={babyWeight}
                    onChange={(e) => setBabyWeight(e.target.value)}
                    className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-soft-blue rounded-2xl p-4">
                <p className="text-sm text-text-secondary">📅 宝宝月龄</p>
                <p className="text-lg font-bold text-text-primary">{calculateAge(babyBirth)}</p>
              </div>

              <button
                onClick={handleSaveBaby}
                disabled={isSaving}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存信息'}
              </button>
            </div>
          </div>
        )}

        {/* 健康档案 */}
        {activeSection === 'health' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <button onClick={() => setActiveSection('menu')} className="text-sm text-ice-blue mr-4">
                ‹ 返回
              </button>
              <h2 className="text-xl font-semibold text-text-primary">🏥 健康档案</h2>
            </div>

            {/* 健康概览 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">📊 健康概览</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-mint rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-text-primary">{checkups.length}</p>
                  <p className="text-xs text-text-secondary">体检次数</p>
                </div>
                <div className="bg-soft-blue rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-text-primary">{vaccinations.filter(v => v.status === 'completed').length}</p>
                  <p className="text-xs text-text-secondary">疫苗接种</p>
                </div>
                <div className="bg-soft-pink rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-text-primary">--</p>
                  <p className="text-xs text-text-secondary">就诊记录</p>
                </div>
              </div>
            </div>

            {/* 过敏信息 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-3">⚠️ 过敏信息</h3>
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm px-3 py-1 bg-soft-pink rounded-full text-text-secondary">暂无过敏信息</span>
                <button className="text-sm px-3 py-1 bg-cream rounded-full text-text-light border border-dashed border-ice-blue">
                  + 添加
                </button>
              </div>
            </div>

            {/* 健康记录时间线 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">📋 健康记录</h3>
              {healthRecords.length > 0 ? (
                <div className="space-y-3">
                  {healthRecords.map((record, index) => (
                    <div key={index} className="flex gap-4 pb-4 last:pb-0 relative">
                      {index < healthRecords.length - 1 && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-soft-blue"></div>
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10 ${
                        record.type === '体检' ? 'bg-ice-blue' : record.type === '疫苗' ? 'bg-green-400' : 'bg-soft-pink'
                      }`}>
                        {record.type === '体检' ? '🩺' : record.type === '疫苗' ? '💉' : '🏥'}
                      </div>
                      <div className="flex-1 bg-cream rounded-2xl p-4">
                        <div className="flex items-center mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full mr-2 ${
                            record.type === '体检' ? 'bg-soft-blue' : record.type === '疫苗' ? 'bg-mint' : 'bg-soft-pink'
                          }`}>
                            {record.type}
                          </span>
                          <span className="text-xs text-text-light">{record.date}</span>
                        </div>
                        <p className="text-sm text-text-primary mb-1">{record.content}</p>
                        <p className="text-xs text-text-secondary">👨‍⚕️ {record.doctor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-light">
                  <p className="text-4xl mb-3">📋</p>
                  <p>暂无健康记录</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                // TODO: 打开添加健康记录的模态框或页面
                toast('添加健康记录功能开发中...');
              }}
              className="btn btn-primary w-full"
            >
              + 添加健康记录
            </button>
          </div>
        )}

        {/* 设置 */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <button onClick={() => setActiveSection('menu')} className="text-sm text-ice-blue mr-4">
                ‹ 返回
              </button>
              <h2 className="text-xl font-semibold text-text-primary">⚙️ 设置</h2>
            </div>

            {/* 通知设置 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">🔔 通知设置</h3>
              <div className="space-y-4">
                {[
                  { key: 'feeding' as const, label: '喂养提醒', desc: '定时提醒喂养宝宝' },
                  { key: 'sleep' as const, label: '睡眠提醒', desc: '睡眠时间记录提醒' },
                  { key: 'vaccine' as const, label: '疫苗提醒', desc: '疫苗接种时间提醒' },
                  { key: 'news' as const, label: '安全动态', desc: '母婴安全新闻推送' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-text-primary font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-text-light">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(item.key)}
                      className={`w-12 h-7 rounded-full transition-all relative ${
                        notifications[item.key] ? 'bg-soft-blue' : 'bg-cream'
                      }`}
                    >
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                        notifications[item.key] ? 'left-6' : 'left-1'
                      }`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 个人信息 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">📝 个人信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">昵称</label>
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 其他设置 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">📱 其他</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-cream rounded-xl px-3">
                  <span className="text-text-primary text-sm">🌐 语言</span>
                  <span className="text-text-light text-sm">简体中文 ›</span>
                </div>
                <div onClick={handleBackupData} className="flex items-center justify-between py-2 cursor-pointer hover:bg-cream rounded-xl px-3 active:scale-[0.99]">
                  <span className="text-text-primary text-sm">💾 数据备份</span>
                  <span className="text-text-light text-sm">导出JSON ›</span>
                </div>
                <div onClick={handleRestoreData} className="flex items-center justify-between py-2 cursor-pointer hover:bg-cream rounded-xl px-3 active:scale-[0.99]">
                  <span className="text-text-primary text-sm">📂 数据恢复</span>
                  <span className="text-text-light text-sm">导入JSON ›</span>
                </div>
                <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-cream rounded-xl px-3">
                  <span className="text-text-primary text-sm">📂 关于我们</span>
                  <span className="text-text-light text-sm">v1.0.0 ›</span>
                </div>
                <div onClick={handleClearCache} className="flex items-center justify-between py-2 cursor-pointer hover:bg-cream rounded-xl px-3 active:scale-[0.99]">
                  <span className="text-text-primary text-sm">🗑️ 清除本地数据</span>
                  <span className="text-text-light text-sm">点击清除 ›</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存设置'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;