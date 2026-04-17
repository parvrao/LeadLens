import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Users, ChevronRight, Zap, Menu, X } from 'lucide-react';
import './Layout.css';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/campaigns', icon: Target, label: 'Campaigns' },
  { to: '/leads', icon: Users, label: 'Lead Intelligence' },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''} ${mobileOpen ? 'layout--mobile-open' : ''}`}>
      {mobileOpen && <div className="layout__overlay" onClick={() => setMobileOpen(false)} />}

      <header className="layout__mobile-header glass">
        <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)}>
          <Menu size={18} />
        </button>
        <span className="layout__logo-text">PROSPERA</span>
        <div style={{ width: 36 }} />
      </header>

      <aside className="layout__sidebar glass">
        <div className="sidebar__top">
          <button className="sidebar__collapse-btn" onClick={() => setCollapsed(c => !c)}>
            <ChevronRight size={14} className="collapse-icon" />
          </button>
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <Zap size={16} fill="currentColor" />
            </div>
            <span className="sidebar__brand-name">PROSPERA</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__brand" style={{ padding: '12px', opacity: 0.4 }}>
            <Zap size={14} fill="currentColor" color="var(--aurora)" />
            <span className="sidebar__label" style={{ fontSize: 11, color: 'var(--aurora)', fontWeight: 700, letterSpacing: '0.1em' }}>
              AI POWERED
            </span>
          </div>
        </div>
      </aside>

      <main className="layout__main">
        <div className="layout__content z-content">
          {children}
        </div>
      </main>
    </div>
  );
}
