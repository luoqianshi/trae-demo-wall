/**
 * notifications.js · 浏览器原生通知（简化实现）
 * 仅页面打开时生效；关闭页面则任务清除
 */
import { state } from './state.js';

let reminderTimer = null;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const r = await Notification.requestPermission();
    return r === 'granted';
  } catch { return false; }
}

export function cancelReminder() {
  if (reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
}

/** 计划下次到点提醒（time = "HH:mm"） */
export function scheduleReminder(time) {
  cancelReminder();
  if (!time || !state.settings.remindOn) return;
  const [hh, mm] = time.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return;

  const now = new Date();
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const ms = next - now;

  reminderTimer = setTimeout(() => {
    fire();
    // 下一天再来
    scheduleReminder(time);
  }, ms);
}

function fire() {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('HEAL CARD · 工位回血', {
        body: '该回血啦～来抽一张卡，做个 30 秒的小事吧 ✨',
        icon: 'assets/favicon.svg',
      });
    }
  } catch {}
}
