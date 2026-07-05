import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";

interface UserStore {
  role: Role;
  name: string;
  setRole: (role: Role) => void;
  setName: (name: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      role: "student",
      name: "小明同学",
      setRole: (role) => set({ role }),
      setName: (name) => set({ name }),
    }),
    {
      name: "ai-homework:user",
    },
  ),
);
