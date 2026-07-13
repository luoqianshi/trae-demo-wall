import { create } from 'zustand';
import type { CalendarNote } from '@/types';

interface CalendarStore {
  notes: CalendarNote[];
  addNote: (note: Omit<CalendarNote, 'id'>) => void;
  removeNote: (id: string) => void;
  getNotesByDate: (date: string) => CalendarNote[];
}

// 示例事项数据
const initialNotes: CalendarNote[] = [
  { id: '1', date: getDateString(0), title: '高数期中考试', type: 'exam', note: '9:00-11:00 教学楼A301' },
  { id: '2', date: getDateString(2), title: '英语作业截止', type: 'deadline', note: '提交作文' },
  { id: '3', date: getDateString(5), title: '社团活动', type: 'event', note: '下午2点体育馆集合' },
  { id: '4', date: getDateString(-3), title: '生日聚会', type: 'personal', note: '小美生日' },
  { id: '5', date: getDateString(7), title: '数据结构考试', type: 'exam' },
  { id: '6', date: getDateString(10), title: '看电影', type: 'personal', note: '和朋友约了新上映的电影' },
];

function getDateString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  notes: initialNotes,
  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, { ...note, id: Date.now().toString() }],
    })),
  removeNote: (id) =>
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
  getNotesByDate: (date) => get().notes.filter((n) => n.date === date),
}));

// 事项类型配置
export const NOTE_TYPE_CONFIG: Record<CalendarNote['type'], { label: string; color: string; dot: string; emoji: string }> = {
  exam: { label: '考试', color: 'bg-berry-rose/15 text-berry-rose border-berry-rose/30', dot: 'bg-berry-rose', emoji: '📝' },
  event: { label: '活动', color: 'bg-corgi-orange/15 text-corgi-dark border-corgi-orange/30', dot: 'bg-corgi-orange', emoji: '🎉' },
  deadline: { label: '截止', color: 'bg-purple-100 text-purple-500 border-purple-200', dot: 'bg-purple-400', emoji: '⏰' },
  personal: { label: '个人', color: 'bg-mint-fresh/15 text-mint-deep border-mint-fresh/30', dot: 'bg-mint-fresh', emoji: '📌' },
};
