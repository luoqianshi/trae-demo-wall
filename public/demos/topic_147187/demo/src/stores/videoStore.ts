import { create } from 'zustand';
import { Participant, mockParticipants } from '../utils/mockData';

interface VideoStore {
  participants: Participant[];
  currentClassroomId: string | null;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  setCurrentClassroomId: (id: string | null) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenSharing: () => void;
  toggleHandRaise: (participantId: string) => void;
  updateParticipant: (id: string, data: Partial<Participant>) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  participants: mockParticipants,
  currentClassroomId: null,
  isMuted: false,
  isCameraOn: true,
  isScreenSharing: false,
  setCurrentClassroomId: (id) => set({ currentClassroomId: id }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleCamera: () => set((state) => ({ isCameraOn: !state.isCameraOn })),
  toggleScreenSharing: () => set((state) => ({ isScreenSharing: !state.isScreenSharing })),
  toggleHandRaise: (participantId) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participantId
          ? { ...p, isHandRaised: !p.isHandRaised }
          : p
      ),
    })),
  updateParticipant: (id, data) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
}));