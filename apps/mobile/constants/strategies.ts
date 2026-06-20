import { getGroupedStrategies as getGroupedFromCore } from '@ai-options/core';

export const getGroupedStrategies = getGroupedFromCore;

export const ROUTE_BY_STRATEGY: Record<string, string> = {
  'long-call': '/calculator/long-call',
  'long-put': '/calculator/long-put',
  'short-call': '/calculator/short-call',
  'short-put': '/calculator/short-put',
  'bull-call-spread': '/calculator/bull-call-spread',
  'bull-put-spread': '/calculator/bull-put-spread',
  'bear-put-spread': '/calculator/bear-put-spread',
  'bear-call-spread': '/calculator/bear-call-spread',
  'covered-call': '/calculator/covered-call',
  'cash-secured-put': '/calculator/cash-secured-put',
  pmcc: '/calculator/pmcc',
  straddle: '/calculator/straddle',
  strangle: '/calculator/strangle',
  'iron-condor': '/calculator/iron-condor',
  'iron-butterfly': '/calculator/iron-butterfly',
  'options-pricing': '/calculator/options-pricing',
  'implied-volatility': '/calculator/implied-volatility',
  'theta-decay': '/calculator/theta-decay',
  'expected-move': '/calculator/expected-move',
};
