import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SharePayload, PathType, WordCount } from '../constants/types';

interface GenerateFlowState {
  entropy?: string; // base64-encoded extra entropy from finger/camera
  mnemonic: string;
  wordCount: WordCount;
  pathType: PathType;
  customPath?: string;
  addressCount: number;
  threshold: number;
  totalShares: number;
  name: string;
  pin?: string;
  passphrase?: string;
  metadata?: Record<string, string>;
  shares: SharePayload[];
  pdfUri?: string;
}

interface GenerateFlowContextValue {
  state: GenerateFlowState;
  update: (partial: Partial<GenerateFlowState>) => void;
  reset: () => void;
}

const initial: GenerateFlowState = {
  mnemonic: '',
  wordCount: 24,
  pathType: 'metamask',
  addressCount: 10,
  threshold: 3,
  totalShares: 5,
  name: '',
  shares: [],
};

const GenerateFlowContext = createContext<GenerateFlowContextValue | null>(null);

export function GenerateFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GenerateFlowState>(initial);

  const update = (partial: Partial<GenerateFlowState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  const reset = () => setState(initial);

  return (
    <GenerateFlowContext.Provider value={{ state, update, reset }}>
      {children}
    </GenerateFlowContext.Provider>
  );
}

export function useGenerateFlow() {
  const ctx = useContext(GenerateFlowContext);
  if (!ctx) throw new Error('useGenerateFlow must be used within GenerateFlowProvider');
  return ctx;
}
