// src/components/Layout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Target, Users, Settings,
  LogOut, ChevronRight, Zap, Menu, X
} from 'lucide-react';
import './Layout.css';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/campaigns', icon: Target, label: 'Campaigns' },
  { to: '/leads', icon: Users, label: 'Lead Intelligence' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const usagePct = user ? Math.round((user.scrapes_used / user.scrapes_limit) * 100) : 0;

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''} ${mobileOpen ? 'layout--mobile-open' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="layout__overlay" onClick={() => setMobileOpen(false)} />}

      {/* Mobile header */}
      <header className="layout__mobile-header glass">
        <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)}>
          <Menu size={18} />
        </button>
        <span className="layout__logo-text">PROSPERA</span>
        <div style={{ width: 36 }} />
      </header>

      {/* Sidebar */}
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
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Icon size={18} />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          {/* Usage bar */}
          <div className="sidebar__usage">
            <div className="sidebar__usage-header">
              <span className="sidebar__usage-label">Monthly Scrapes</span>
              <span className="sidebar__usage-count">{user?.scrapes_used || 0} / {user?.scrapes_limit || 50}</span>
            </div>
            <div className="score-bar" style={{ marginTop: 6 }}>
              <div className="score-fill" style={{
                width: `${usagePct}%`,
                background: usagePct > 80 ? 'var(--crimson)' : usagePct > 50 ? 'var(--amber)' : 'var(--aurora)'
              }} />
            </div>
          </div>

          <div className="divider" />

          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-plan">{user?.plan?.toUpperCase()} PLAN</span>
            </div>
          </div>

          <button className="sidebar__link sidebar__link--logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span className="sidebar__label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="layout__main">
        <div className="layout__content z-content">
          {children}
        </div>
      </main>
    </div>
  );
}
