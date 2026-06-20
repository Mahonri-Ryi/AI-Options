import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  createTrialState,
  isPremiumAccess,
  isTrialActive,
  trialDaysRemaining,
  type TrialState,
} from '@ai-options/core';

interface TrialContextValue {
  isPremium: boolean;
  isTrial: boolean;
  daysRemaining: number;
  startTrial: () => void;
}

const TrialContext = createContext<TrialContextValue | null>(null);

let storedTrial: TrialState | null = null;

export function TrialProvider({ children }: { children: ReactNode }) {
  const [trialState, setTrialState] = useState<TrialState | null>(() => storedTrial);

  const startTrial = useCallback(() => {
    const state = createTrialState();
    storedTrial = state;
    setTrialState(state);
  }, []);

  const value = useMemo<TrialContextValue>(() => {
    const isTrial = isTrialActive(trialState);
    return {
      isPremium: isPremiumAccess(trialState),
      isTrial,
      daysRemaining: trialDaysRemaining(trialState),
      startTrial,
    };
  }, [trialState, startTrial]);

  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>;
}

export function useTrial(): TrialContextValue {
  const ctx = useContext(TrialContext);
  if (!ctx) {
    throw new Error('useTrial must be used within TrialProvider');
  }
  return ctx;
}
