import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  createTrialState,
  isPremiumAccess,
  isTrialActive,
  trialDaysRemaining,
  type TrialState,
} from '@ai-options/core';

const TRIAL_STORAGE_KEY = 'ai-options-trial';

interface TrialContextValue {
  isPremium: boolean;
  isTrial: boolean;
  daysRemaining: number;
  startTrial: () => void;
}

const TrialContext = createContext<TrialContextValue | null>(null);

function loadTrialState(): TrialState | null {
  try {
    const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrialState;
  } catch {
    return null;
  }
}

function saveTrialState(state: TrialState): void {
  localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(state));
}

export function TrialProvider({ children }: { children: ReactNode }) {
  const [trialState, setTrialState] = useState<TrialState | null>(() => loadTrialState());

  const startTrial = useCallback(() => {
    const state = createTrialState();
    saveTrialState(state);
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
