import { create } from 'zustand';
import { LearningRecord, mockLearningRecords, mockGrowthData } from '../utils/mockData';

interface RecordStore {
  records: LearningRecord[];
  growthData: typeof mockGrowthData;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  addRecord: (record: Omit<LearningRecord, 'id'>) => void;
}

export const useRecordStore = create<RecordStore>((set) => ({
  records: mockLearningRecords,
  growthData: mockGrowthData,
  selectedStudentId: null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  addRecord: (record) =>
    set((state) => ({
      records: [...state.records, { ...record, id: Math.random().toString(36).substring(2, 9) }],
    })),
}));