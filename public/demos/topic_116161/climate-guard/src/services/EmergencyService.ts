/**
 * 应急记录服务接口层 — 预留真实后端接入
 */

export interface EmergencyRecord {
  id: string;
  timestamp: string;
  mode: 'heat' | 'cold';
  symptoms: string[];
  adviceLevel: string;
  actionsTaken: string[];
  outcome?: string;
}

export interface EmergencyService {
  logEmergency(record: Omit<EmergencyRecord, 'id' | 'timestamp'>): EmergencyRecord;
  getHistory(): EmergencyRecord[];
  callEmergency(): void;
}

export class MockEmergencyService implements EmergencyService {
  private storageKey = 'cg_emergency_records';

  logEmergency(record: Omit<EmergencyRecord, 'id' | 'timestamp'>): EmergencyRecord {
    const newRecord: EmergencyRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    const history = this.getHistory();
    history.unshift(newRecord);
    localStorage.setItem(this.storageKey, JSON.stringify(history.slice(0, 50)));

    return newRecord;
  }

  getHistory(): EmergencyRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }

  callEmergency(): void {
    // 在真实应用中调用 120
    window.location.href = 'tel:120';
  }
}

export const emergencyService = new MockEmergencyService();
