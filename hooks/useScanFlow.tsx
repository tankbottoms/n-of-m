import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SharePayload, PathType, WordCount, DerivedAddress } from '../constants/types';

interface ScanFlowState {
  shares: SharePayload[];
  recoveredMnemonic?: string;
  name?: string;
  pathType?: PathType;
  wordCount?: WordCount;
  derivationPath?: string;
  addresses?: DerivedAddress[];
  hasPIN?: boolean;
  hasPassphrase?: boolean;
}

interface ScanFlowContextValue {
  state: ScanFlowState;
  update: (partial: Partial<ScanFlowState>) => void;
  reset: () => void;
}

const ScanFlowContext = createContext<ScanFlowContextValue | null>(null);

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScanFlowState>({ shares: [] });

  const update = useCallback((partial: Partial<ScanFlowState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => setState({ shares: [] }), []);

  return (
    <ScanFlowContext.Provider value={{ state, update, reset }}>
      {children}
    </ScanFlowContext.Provider>
  );
}

export function useScanFlow() {
  const ctx = useContext(ScanFlowContext);
  if (!ctx) throw new Error('useScanFlow must be used within ScanFlowProvider');
  return ctx;
}
