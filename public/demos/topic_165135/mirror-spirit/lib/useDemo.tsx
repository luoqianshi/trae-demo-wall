import { useState, createContext, useContext, ReactNode } from "react";
import { demoData, DemoDayData } from "./demoData";

interface DemoContextType {
  isDemoMode: boolean;
  currentDay: number;
  demoData: DemoDayData;
  setDemoDay: (day: number) => void;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);

  const setDemoDay = (day: number) => {
    if (demoData[day]) {
      setCurrentDay(day);
    }
  };

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    if (!isDemoMode) {
      setCurrentDay(1);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        currentDay,
        demoData: demoData[currentDay] || demoData[1],
        setDemoDay,
        toggleDemoMode,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
