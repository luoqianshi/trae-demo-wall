import { create } from 'zustand';

// 年级选项列表（按顺序）
export const GRADE_ORDER = [
  'middle-1', 'middle-2', 'middle-3',
] as const;

export type GradeId = typeof GRADE_ORDER[number];

export const GRADE_LABELS: Record<GradeId, string> = {
  'middle-1': '初中一年级',
  'middle-2': '初中二年级',
  'middle-3': '初中三年级',
};

export const GRADE_OPTIONS = GRADE_ORDER.map((id) => ({ id, label: GRADE_LABELS[id] }));

export type Semester = 'first' | 'second';
export const SEMESTER_LABELS: Record<Semester, string> = { first: '上册', second: '下册' };
export const SEMESTER_OPTIONS = [
  { id: 'first' as Semester, label: '上册' },
  { id: 'second' as Semester, label: '下册' },
];

interface UserProfile {
  nickname: string; // 用户昵称（系统内唯一，不可重复）
  phone: string;
  initialGrade: GradeId;
  enrollmentDate: string; // YYYY-MM-DD，首次设置的日期
  semester: Semester;
  onboardingCompleted: boolean; // 是否完成新手引导
  // 寒暑假模式日期范围（YYYY-MM-DD，undefined 表示尚未设置）
  summerVacationStart?: string;
  summerVacationEnd?: string;
  winterVacationStart?: string;
  winterVacationEnd?: string;
}

interface UserStore {
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
  getCurrentGrade: () => { grade: GradeId; label: string; semester: Semester };
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// ===== 昵称唯一性管理 =====
// 用 localStorage 维护系统内已注册的昵称集合，确保不重复
const NICKNAMES_KEY = 'time-master-nicknames';

// 读取已注册的昵称集合
function loadNicknames(): string[] {
  try {
    const raw = localStorage.getItem(NICKNAMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 注册一个昵称（加入集合，保证唯一）
function registerNickname(name: string) {
  try {
    const list = loadNicknames();
    if (!list.includes(name)) {
      list.push(name);
      localStorage.setItem(NICKNAMES_KEY, JSON.stringify(list));
    }
  } catch { /* ignore */ }
}

// 注销旧昵称（用户改昵称时，从集合中移除旧值，避免集合无限膨胀且阻塞用户改回旧昵称）
function unregisterNickname(name: string) {
  try {
    const list = loadNicknames();
    const next = list.filter((n) => n !== name);
    if (next.length !== list.length) {
      localStorage.setItem(NICKNAMES_KEY, JSON.stringify(next));
    }
  } catch { /* ignore */ }
}

// 检查昵称是否已被占用（排除当前用户自己的昵称）
export function isNicknameTaken(name: string, exclude?: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const list = loadNicknames();
  return list.some((n) => n === trimmed && n !== exclude);
}

// 从 localStorage 加载
function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('time-master-user');
    if (raw) {
      const parsed = JSON.parse(raw);
      // 迁移：老版本可能存有已删除的小学年级，回退为初中一年级
      const rawGrade = parsed.initialGrade;
      const migratedGrade: GradeId =
        rawGrade && (GRADE_ORDER as readonly string[]).includes(rawGrade)
          ? (rawGrade as GradeId)
          : 'middle-1';
      return {
        nickname: (() => {
          // 迁移：老版本用 userId（数字），新版本用 nickname（字符串）
          const migrated = parsed.nickname || (parsed.userId ? `用户${parsed.userId}` : '');
          // 迁移得到的昵称需注册到集合，保证与系统集合一致（避免新用户占用同一昵称）
          if (migrated) registerNickname(migrated);
          return migrated;
        })(),
        phone: parsed.phone || '',
        initialGrade: migratedGrade,
        enrollmentDate: parsed.enrollmentDate || '',
        semester: parsed.semester || 'first',
        onboardingCompleted: parsed.onboardingCompleted || false,
        // 寒暑假日期范围：未存储时为 undefined，表示尚未设置
        summerVacationStart: parsed.summerVacationStart,
        summerVacationEnd: parsed.summerVacationEnd,
        winterVacationStart: parsed.winterVacationStart,
        winterVacationEnd: parsed.winterVacationEnd,
      };
    }
  } catch { /* ignore */ }
  return { nickname: '', phone: '', initialGrade: 'middle-1', enrollmentDate: '', semester: 'first', onboardingCompleted: false };
}

function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem('time-master-user', JSON.stringify(profile));
  } catch { /* ignore */ }
}

// 计算当前年级：每年 9 月 1 日自动升级
function calcCurrentGrade(initialGrade: GradeId, enrollmentDate: string): { grade: GradeId; label: string } {
  if (!enrollmentDate) {
    return { grade: initialGrade, label: GRADE_LABELS[initialGrade] };
  }

  const initIdx = GRADE_ORDER.indexOf(initialGrade);
  if (initIdx === -1) return { grade: initialGrade, label: GRADE_LABELS[initialGrade] };

  const enroll = new Date(enrollmentDate);
  const now = new Date();

  // 计算经过的学年数：从入学年份开始，每年 9 月升一级
  // 入学年份 = enrollmentDate 的年份
  let yearsPassed = now.getFullYear() - enroll.getFullYear();

  // 如果当前日期在 9 月 1 日之前，且入学年份不是当前年份，则少算一年
  const currentMonth = now.getMonth() + 1; // 0-indexed
  const currentDay = now.getDate();

  if (currentMonth < 9 || (currentMonth === 9 && currentDay < 1)) {
    // 还没到 9 月 1 日，减少一年
    yearsPassed = Math.max(0, yearsPassed - 1);
  }

  const newIdx = Math.min(initIdx + yearsPassed, GRADE_ORDER.length - 1);
  const newGrade = GRADE_ORDER[newIdx];

  return { grade: newGrade, label: GRADE_LABELS[newGrade] };
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: loadProfile(),

  setProfile: (partial) => {
    set((state) => {
      const newProfile = { ...state.profile, ...partial };
      // 昵称变化时：先释放旧昵称，再注册新昵称，保证系统集合与当前用户一致
      if (partial.nickname && partial.nickname !== state.profile.nickname) {
        if (state.profile.nickname) unregisterNickname(state.profile.nickname);
        registerNickname(partial.nickname);
      }
      saveProfile(newProfile);
      return { profile: newProfile };
    });
  },

  getCurrentGrade: () => {
    const { profile } = get();
    const { grade, label } = calcCurrentGrade(profile.initialGrade, profile.enrollmentDate);
    return { grade, label, semester: profile.semester };
  },

  loadFromStorage: () => {
    set({ profile: loadProfile() });
  },

  saveToStorage: () => {
    saveProfile(get().profile);
  },
}));