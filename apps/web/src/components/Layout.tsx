import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { STRATEGIES } from '@ai-options/core';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="layout">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            <span className="brand-icon">Δ</span>
            <span className="brand-text">AI Options</span>
          </Link>
          {!isHome ? (
            <Link to="/" className="nav-link">
              ← All Calculators
            </Link>
          ) : (
            <span className="nav-badge">{STRATEGIES.length} Calculators</span>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="footer-inner">
          <p>AI Options — Professional options modeling tools</p>
        </div>
      </footer>
    </div>
  );
}
