/**
 * 用户服务接口层 — 预留真实后端接入
 * 
 * 可接入：
 * - 微信小程序用户系统
 * - 自建后端 (Supabase / Firebase / 自研)
 * - localStorage (当前 Mock)
 */

import type { UserSettings, CaredPerson } from '../types';
import { defaultUserSettings, defaultCaredPersons } from '../data/mockData';

const STORAGE_KEYS = {
  settings: 'cg_user_settings',
  caredPersons: 'cg_cared_persons',
};

export interface UserService {
  getSettings(): UserSettings;
  saveSettings(settings: UserSettings): void;
  getCaredPersons(): CaredPerson[];
  saveCaredPerson(person: CaredPerson): void;
  removeCaredPerson(id: string): void;
  checkSafe(id: string): void;
}

export class LocalUserService implements UserService {
  getSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.settings);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultUserSettings;
  }

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  getCaredPersons(): CaredPerson[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.caredPersons);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultCaredPersons;
  }

  saveCaredPerson(person: CaredPerson): void {
    const persons = this.getCaredPersons();
    const idx = persons.findIndex(p => p.id === person.id);
    if (idx >= 0) {
      persons[idx] = person;
    } else {
      persons.push(person);
    }
    localStorage.setItem(STORAGE_KEYS.caredPersons, JSON.stringify(persons));
  }

  removeCaredPerson(id: string): void {
    const persons = this.getCaredPersons().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.caredPersons, JSON.stringify(persons));
  }

  checkSafe(id: string): void {
    const now = new Date();
    const timeStr = `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const persons = this.getCaredPersons();
    const person = persons.find(p => p.id === id);
    if (person) {
      person.lastSafeCheck = timeStr;
      this.saveCaredPerson(person);
    }
  }
}

export const userService = new LocalUserService();
