import { Link } from 'react-router-dom';
import { getGroupedStrategies } from '@ai-options/core';
import './HomePage.css';

export function HomePage() {
  const groups = getGroupedStrategies();

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
