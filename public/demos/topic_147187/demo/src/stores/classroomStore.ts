import { create } from 'zustand';
import { Classroom, mockClassrooms, generateId } from '../utils/mockData';

interface ClassroomStore {
  classrooms: Classroom[];
  currentClassroom: Classroom | null;
  setCurrentClassroom: (classroom: Classroom | null) => void;
  createClassroom: (data: Omit<Classroom, 'id'>) => void;
  updateClassroom: (id: string, data: Partial<Classroom>) => void;
}

export const useClassroomStore = create<ClassroomStore>((set) => ({
  classrooms: mockClassrooms,
  currentClassroom: null,
  setCurrentClassroom: (classroom) => set({ currentClassroom: classroom }),
  createClassroom: (data) =>
    set((state) => ({
      classrooms: [...state.classrooms, { ...data, id: generateId() }],
    })),
  updateClassroom: (id, data) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
}));