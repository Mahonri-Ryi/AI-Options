import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTrial } from '../hooks/useTrial';
import './PremiumGate.css';

interface PremiumGateProps {
  children: ReactNode;
  featureName: string;
}

export function PremiumGate({ children, featureName }: PremiumGateProps) {
  const { isPremium, isTrial, daysRemaining, startTrial } = useTrial();

  if (isPremium) {
    return (
      <>
        {isTrial ? (
          <div className="trial-banner">
            <span>
              Free trial active — <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>{' '}
              remaining
            </span>
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <div className="premium-gate card">
      <div className="premium-gate-icon">★</div>
      <h2 className="premium-gate-title">{featureName}</h2>
      <p className="premium-gate-desc">
        Start a free 7-day trial to unlock all premium tools — Option Modeler, IV Screener, Income
        Analyzers, Roll Analyzer, and Trade Logger.
      </p>
      <button type="button" className="btn-primary premium-gate-btn" onClick={startTrial}>
        Start Free Trial →
      </button>
      <Link to="/" className="premium-gate-link">
        ← Back to calculators
      </Link>
    </div>
  );
}
