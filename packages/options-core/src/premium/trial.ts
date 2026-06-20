import { TRIAL_DURATION_DAYS } from './catalog.js';

export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface TrialState {
  startedAt: number;
  expiresAt: number;
}

export function createTrialState(now = Date.now()): TrialState {
  return {
    startedAt: now,
    expiresAt: now + TRIAL_DURATION_MS,
  };
}

export function isTrialActive(state: TrialState | null | undefined, now = Date.now()): boolean {
  return state != null && now < state.expiresAt;
}

export function trialDaysRemaining(
  state: TrialState | null | undefined,
  now = Date.now(),
): number {
  if (!isTrialActive(state, now) || !state) return 0;
  return Math.ceil((state.expiresAt - now) / (24 * 60 * 60 * 1000));
}

export function isPremiumAccess(
  state: TrialState | null | undefined,
  premiumUnlocked = false,
  now = Date.now(),
): boolean {
  return premiumUnlocked || isTrialActive(state, now);
}
