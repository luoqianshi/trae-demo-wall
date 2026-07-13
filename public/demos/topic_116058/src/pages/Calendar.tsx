import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, CalendarDays, Clock } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import SoftButton from '@/components/common/SoftButton';
import { useCalendarStore, NOTE_TYPE_CONFIG } from '@/store/calendarStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { cn } from '@/lib/utils';
import type { CalendarNote } from '@/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar() {
  const { notes, addNote, removeNote, getNotesByDate } = useCalendarStore();
  const { generateDailySchedule } = useScheduleStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', type: 'exam' as CalendarNote['type'], note: '' });

  const getFreeSlotsForDate = (dateStr: string) => {
    const schedule = generateDailySchedule(dateStr);
    const sorted = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const freeSlots: { startTime: string; endTime: string; duration: number }[] = [];
    let lastEnd = '00:00';

    for (const item of sorted) {
      if (item.startTime > lastEnd) {
        const [sh, sm] = lastEnd.split(':').map(Number);
        const [eh, em] = item.startTime.split(':').map(Number);
        freeSlots.push({
          startTime: lastEnd,
          endTime: item.startTime,
          duration: (eh * 60 + em) - (sh * 60 + sm),
        });
      }
      lastEnd = item.endTime;
    }

    if (lastEnd < '24:00') {
      const [sh, sm] = lastEnd.split(':').map(Number);
      freeSlots.push({
        startTime: lastEnd,
        endTime: '24:00',
        duration: (24 * 60) - (sh * 60 + sm),
      });
    }

    return freeSlots;
  };

  const getTotalFreeMinutes = (dateStr: string) => {
    return getFreeSlotsForDate(dateStr).reduce((sum, slot) => sum + slot.duration, 0);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 当月天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 当月第一天是星期几
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  // 上个月天数
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleAddNote = () => {
    if (!newNote.title.trim() || !selectedDate) return;
    addNote({
      date: selectedDate,
      title: newNote.title.trim(),
      type: newNote.type,
      note: newNote.note.trim() || undefined,
    });
    setNewNote({ title: '', type: 'exam', note: '' });
    setShowAddNote(false);
  };

  // 生成日历网格
  const calendarDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  // 上月填充
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    calendarDays.push({
      day,
      isCurrentMonth: false,
      dateStr: formatDate(prevDate),
    });
  }
  // 当月
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      dateStr: formatDate(new Date(year, month, day)),
    });
  }
  // 下月填充到42格
  const remaining = 42 - calendarDays.length;
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarDays.push({
      day,
      isCurrentMonth: false,
      dateStr: formatDate(nextDate),
    });
  }

  const selectedNotes = selectedDate ? getNotesByDate(selectedDate) : [];
  const selectedFreeSlots = selectedDate ? getFreeSlotsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader
        title="日历"
        subtitle="查看和管理重要事项"
      />

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-4 bg-warm-light rounded-2xl px-4 py-3 shadow-soft border-2 border-corgi-yellow/20">
          <button onClick={prevMonth} className="btn-press w-9 h-9 rounded-full bg-corgi-yellow/20 flex items-center justify-center text-corgi-dark hover:bg-corgi-yellow/40 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-display text-xl text-text-primary">{year}年{month + 1}月</p>
            <p className="text-xs text-text-secondary">共 {notes.filter(n => n.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} 个事项</p>
          </div>
          <button onClick={nextMonth} className="btn-press w-9 h-9 rounded-full bg-corgi-yellow/20 flex items-center justify-center text-corgi-dark hover:bg-corgi-yellow/40 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 日历网格 */}
        <div className="bg-warm-light rounded-puffy shadow-puffy border-2 border-corgi-yellow/20 overflow-hidden mb-4">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-0">
            {weekDays.map((day, i) => (
              <div key={day} className={cn(
                'text-center py-2 text-xs font-bold border-b-2 border-corgi-yellow/15',
                i === 0 || i === 6 ? 'text-berry-rose' : 'text-text-secondary'
              )}>
                {day}
              </div>
            ))}
          </div>
          {/* 日期 */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((d, i) => {
              const dayNotes = notes.filter(n => n.date === d.dateStr);
              const isToday = d.dateStr === todayStr;
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(d.dateStr)}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center gap-0.5 border border-corgi-yellow/10 transition-all relative',
                    !d.isCurrentMonth && 'opacity-30',
                    isSelected && 'bg-corgi-orange/15 ring-2 ring-corgi-orange ring-inset',
                    isToday && !isSelected && 'bg-corgi-yellow/20'
                  )}
                >
                  <span className={cn(
                    'text-sm font-bold',
                    isToday ? 'text-corgi-orange' : d.isCurrentMonth ? 'text-text-primary' : 'text-text-light',
                    (i % 7 === 0 || i % 7 === 6) && d.isCurrentMonth && !isToday && 'text-berry-rose/70'
                  )}>
                    {d.day}
                  </span>
                  {/* 事项标记点 */}
                  {(dayNotes.length > 0 || getTotalFreeMinutes(d.dateStr) > 0) && (
                    <div className="flex gap-0.5 absolute bottom-1">
                      {dayNotes.slice(0, 3).map((n) => (
                        <div key={`note-${n.id}`} className={cn('w-1.5 h-1.5 rounded-full', NOTE_TYPE_CONFIG[n.type].dot)} />
                      ))}
                      {getTotalFreeMinutes(d.dateStr) > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-mint-fresh" title={`空闲 ${Math.round(getTotalFreeMinutes(d.dateStr) / 60)}小时`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 选中日期的事项 */}
        {selectedDate && (
      <div className="bg-warm-light rounded-puffy shadow-soft border-2 border-corgi-yellow/20 p-4 mb-4 animate-pop-in">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={20} className="text-corgi-orange" />
          <h3 className="font-bold text-text-primary">{formatDateDisplay(selectedDate)}</h3>
          <span className="text-xs text-mint-deep bg-mint-fresh/15 px-2 py-1 rounded-full font-bold">
            空闲 {Math.round(getTotalFreeMinutes(selectedDate) / 60)}小时
          </span>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="ml-auto btn-press w-8 h-8 rounded-full bg-corgi-orange/20 text-corgi-dark flex items-center justify-center hover:bg-corgi-orange/30 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* 空闲时段 */}
        {selectedFreeSlots.length > 0 && selectedFreeSlots.some(s => s.duration > 30) && (
          <div className="mb-4 p-3 bg-mint-fresh/10 rounded-2xl border border-mint-fresh/30">
            <div className="flex items-center gap-1 mb-2">
              <Clock size={14} className="text-mint-deep" />
              <h4 className="text-xs font-bold text-mint-deep">今日空闲时段</h4>
            </div>
            <div className="space-y-1">
              {selectedFreeSlots
                .filter(s => s.duration > 30)
                .map((slot, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-warm-cream/60 rounded-lg px-2 py-1.5">
                    <span className="font-bold text-text-primary">{slot.startTime} - {slot.endTime}</span>
                    <span className="text-mint-deep">{Math.round(slot.duration / 60)}小时{slot.duration % 60 > 0 ? `${slot.duration % 60}分` : ''}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 添加事项表单 */}
            {showAddNote && (
              <div className="mb-4 p-3 bg-warm-cream/60 rounded-2xl border-2 border-corgi-yellow/20 animate-pop-in">
                <input
                  type="text"
                  placeholder="事项标题（如：高数考试）"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-warm-light border-2 border-corgi-yellow/30 text-text-primary outline-none focus:border-corgi-orange text-sm mb-2"
                />
                <div className="flex gap-2 mb-2">
                  {(Object.keys(NOTE_TYPE_CONFIG) as CalendarNote['type'][]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewNote({ ...newNote, type })}
                      className={cn(
                        'btn-press px-2 py-1 rounded-full text-xs font-bold border transition-colors',
                        newNote.type === type ? NOTE_TYPE_CONFIG[type].color : 'bg-warm-light text-text-light border-gray-200'
                      )}
                    >
                      {NOTE_TYPE_CONFIG[type].emoji} {NOTE_TYPE_CONFIG[type].label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="备注（选填）"
                  value={newNote.note}
                  onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-warm-light border-2 border-corgi-yellow/30 text-text-primary outline-none focus:border-corgi-orange text-sm mb-2"
                />
                <div className="flex gap-2">
                  <SoftButton variant="secondary" size="sm" className="flex-1" onClick={() => setShowAddNote(false)}>
                    取消
                  </SoftButton>
                  <SoftButton variant="accent" size="sm" className="flex-1" onClick={handleAddNote}>
                    添加
                  </SoftButton>
                </div>
              </div>
            )}

            {/* 事项列表 */}
            {selectedNotes.length > 0 ? (
              <div className="space-y-2">
                {selectedNotes.map((note) => {
                  const config = NOTE_TYPE_CONFIG[note.type];
                  return (
                    <div key={note.id} className="group flex items-start gap-3 p-3 rounded-2xl bg-warm-cream/60 border border-corgi-yellow/20">
                      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 border', config.color)}>
                        {config.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-primary text-sm">{note.title}</p>
                        {note.note && <p className="text-xs text-text-secondary mt-0.5">{note.note}</p>}
                        <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border', config.color)}>
                          {config.label}
                        </span>
                      </div>
                      <button
                        onClick={() => removeNote(note.id)}
                        className="btn-press w-7 h-7 rounded-full flex items-center justify-center text-text-light hover:text-berry-rose hover:bg-berry-pink/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-text-light text-sm">这天还没有事项～</p>
                <p className="text-xs text-text-light mt-1">点击 + 添加重要事项</p>
              </div>
            )}
          </div>
        )}

        {/* 图例 */}
        <div className="flex flex-wrap items-center gap-3 bg-warm-light rounded-2xl px-4 py-3 shadow-soft border-2 border-corgi-yellow/20">
          <span className="text-xs text-text-secondary font-bold">图例：</span>
          {(Object.keys(NOTE_TYPE_CONFIG) as CalendarNote['type'][]).map((type) => {
            const config = NOTE_TYPE_CONFIG[type];
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn('w-2.5 h-2.5 rounded-full', config.dot)} />
                <span className="text-xs text-text-secondary">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 添加事项弹窗关闭浮层 */}
      {showAddNote && (
        <div className="fixed inset-0 z-30" onClick={() => setShowAddNote(false)} />
      )}
    </div>
  );
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  return `${Number(m)}月${Number(d)}日 周${weekDay}`;
}
