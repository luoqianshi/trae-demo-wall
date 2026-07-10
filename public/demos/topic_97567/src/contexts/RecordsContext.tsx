'use client';

import React, { createContext, useContext } from 'react';
import { useRecords } from '@/hooks/useRecords';

type RecordsContextValue = ReturnType<typeof useRecords>;

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function useRecordsContext(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) {
    throw new Error('useRecordsContext must be used within RecordsProvider');
  }
  return ctx;
}

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const recordsValue = useRecords();

  return (
    <RecordsContext.Provider value={recordsValue}>
      {children}
    </RecordsContext.Provider>
  );
}
