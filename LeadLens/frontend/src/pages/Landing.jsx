// src/pages/Landing.jsx
import { Link } from 'react-router-dom';
import { Zap, Target, Brain, Map, Mail, TrendingUp, ChevronRight, Star, Shield, Globe } from 'lucide-react';
import './Landing.css';

const FEATURES = [
  { icon: Target, title: 'Precision Targeting', desc: 'Search 200+ countries. Extract every business in any category with 30+ data fields per record.', color: 'var(--aurora)' },
  { icon: Brain, title: 'Gemini Pain Point Intelligence', desc: 'AI reads real customer reviews and surfaces the exact frustrations you can solve — before you write a single word.', color: 'var(--violet)' },
  { icon: Mail, title: 'Hyper-Personal Cold Email', desc: 'Each email references specific details about that business. No templates. No merge tags. Genuine personalization at scale.', color: 'var(--jade)' },
  { icon: Map, title: 'GPS Territory CRM', desc: 'Visual map view of every lead. Route your day. Claim territories. Track each prospect from cold to closed.', color: 'var(--amber)' },
  { icon: TrendingUp, title: 'AI Opportunity Scoring', desc: 'Every business gets an outreach score 1 to 100 based on sentiment analysis, rating data, and industry signals.', color: 'var(--aurora)' },
  { icon: Shield, title: 'Inbox-First Delivery', desc: 'Emails sent sequentially with smart delays and personalized subject lines. No spam folders. No bulk flags.', color: 'var(--jade)' },
];

const STATS = [
  { value: '200+', label: 'Countries Covered' },
  { value: '30+', label: 'Data Fields Per Lead' },
  { value: '10x', label: 'Better Than Templates' },
  { value: '< 5min', label: 'From Search to Email' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing__nav glass">
        <div className="landing__nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--aurora), var(--violet))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} fill="currentColor" color="var(--void)" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--text-primary)' }}>PROSPERA</span>
          </div>
          <div className="landing__nav-links">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero z-content">
        <div className="landing__hero-badge badge badge-aurora animate-fade-up">
          <Zap size={11} fill="currentColor" /> Powered by Gemini AI
        </div>

        <h1 className="landing__hero-title animate-fade-up-2">
          Find Every Prospect.<br />
          <em>Know Their Pain.</em><br />
          Close the Deal.
        </h1>

        <p className="landing__hero-sub animate-fade-up-3">
          Prospera scrapes any business category across 200+ countries, uses Gemini AI to analyze real customer reviews for pain points, and writes a unique cold email for each lead — all in under 5 minutes.
        </p>

        <div className="landing__hero-actions animate-fade-up-3">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Prospecting Free <ChevronRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="landing__stats animate-fade-up-3">
          {STATS.map(s => (
            <div key={s.label} className="landing__stat glass-card">
              <span className="landing__stat-value">{s.value}</span>
              <span className="landing__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing__features z-content">
        <div className="landing__section-header">
          <span className="badge badge-aurora">Features</span>
          <h2 className="landing__section-title">Everything MapLeads can do.<br /><em>Plus what it can't.</em></h2>
          <p className="landing__section-sub">One person replaced an entire sales team. You're next.</p>
        </div>

        <div className="landing__features-grid">
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <div key={title} className="landing__feature-card glass-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="landing__feature-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={20} color={color} />
              </div>
              <h3 className="landing__feature-title">{title}</h3>
              <p className="landing__feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta z-content">
        <div className="landing__cta-card glass-card">
          <div className="landing__cta-glow" />
          <Star size={32} color="var(--amber)" />
          <h2 className="landing__cta-title">No subscriptions. No sales team. No excuses.</h2>
          <p className="landing__cta-sub">Prospera gives solo operators and lean teams the intelligence that used to require a full research department. Your first 50 leads are free.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started — It Is Free <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer z-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prospera © 2025 — AI Lead Intelligence Platform</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ fontSize: 12, color: 'var(--aurora)', textDecoration: 'none' }}>Get Started</Link>
        </div>
      </footer>
    </div>
  );
}
