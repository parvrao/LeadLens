import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Zap, LayoutDashboard, Target, Users, Map, Menu, Calculator } from 'lucide-react'
import './Layout.css'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Target, label: 'Campaigns' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/map', icon: Map, label: 'Territory Map' },
  { to: '/simulator', icon: Calculator, label: 'ROI Simulator' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="layout">
      {open && <div className="layout-overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={16} fill="currentColor" /></div>
          <span className="logo-text">LeadLens</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Icon size={16} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-tag">
            <Zap size={11} fill="var(--accent)" color="var(--accent)" />
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </aside>
      <header className="mobile-header">
        <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)}><Menu size={20} /></button>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="logo-icon" style={{ width:28, height:28 }}><Zap size={14} fill="currentColor" /></div>
          <span className="logo-text">LeadLens</span>
        </div>
        <div style={{ width:36 }} />
      </header>
      <main className="main"><div className="main-inner">{children}</div></main>
    </div>
  )
}
