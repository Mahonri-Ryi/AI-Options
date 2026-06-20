import { Link } from 'react-router-dom';
import { getGroupedStrategies, PREMIUM_FEATURES } from '@ai-options/core';
import { useTrial } from '../hooks/useTrial';
import './HomePage.css';
import '../components/PremiumGate.css';

export function HomePage() {
  const groups = getGroupedStrategies();
  const { isPremium, isTrial, daysRemaining, startTrial } = useTrial();

  return (
    <div className="page home">
      <section className="hero">
        <h1 className="hero-title">
          Model your options trades
          <span className="hero-accent"> before you trade</span>
        </h1>
        <p className="hero-subtitle">
          Visualize profit and loss for every major options strategy. Adjust inputs to see how
          stock price, volatility, and time affect your position — instantly, in your browser.
        </p>
      </section>

      {!isPremium ? (
        <section className="trial-cta card">
          <h2 className="trial-cta-title">Try premium tools free for 7 days</h2>
          <p className="trial-cta-desc">
            Unlock the Option Modeler, IV Screener, Income Analyzers, Roll Analyzer, and Trade
            Logger — no payment required.
          </p>
          <button type="button" className="btn-primary" onClick={startTrial}>
            Start Free Trial →
          </button>
        </section>
      ) : isTrial ? (
        <section className="trial-banner card" style={{ marginBottom: '2rem' }}>
          <span>
            Premium trial active — <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>{' '}
            remaining. All premium tools are unlocked.
          </span>
        </section>
      ) : null}

      <section className="category-section">
        <h2 className="section-label">Premium Tools</h2>
        <div className="calc-grid">
          {PREMIUM_FEATURES.map((feature) => (
            <Link key={feature.id} to={`/tools/${feature.id}`} className="calc-card card premium-card">
              <h3 className="calc-card-title">
                {feature.name}
                <span className="premium-badge">Premium</span>
              </h3>
              <p className="calc-card-desc">{feature.description}</p>
              <span className="calc-card-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.category} className="category-section">
          <h2 className="section-label">{group.label}</h2>
          <div className="calc-grid">
            {group.strategies.map((strategy) => (
              <Link
                key={strategy.id}
                to={`/calculator/${strategy.id}`}
                className="calc-card card"
              >
                <h3 className="calc-card-title">{strategy.name}</h3>
                <p className="calc-card-desc">{strategy.description}</p>
                <span className="calc-card-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
