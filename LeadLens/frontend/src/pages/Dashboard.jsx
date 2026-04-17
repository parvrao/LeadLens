import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Mail, Target, Zap, ChevronRight, Brain, Star } from 'lucide-react';
import './Dashboard.css';

const FUNNEL_COLORS = ['var(--aurora)', 'var(--violet)', 'var(--jade)', 'var(--amber)'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.stats()
      .then(res => setStats(res.data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const funnelData = stats ? [
    { name: 'Total', value: stats.totalLeads },
    { name: 'Contacted', value: stats.contacted },
    { name: 'Replied', value: stats.replied },
    { name: 'Converted', value: stats.converted },
  ] : [];

  if (loading) return (
    <div className="dashboard__loading">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass-card loading-shimmer" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  );

  return (
    <div className="dashboard z-content">
      <div className="dashboard__header animate-fade-up">
        <div>
          <h1 className="dashboard__title">Command Center</h1>
          <p className="dashboard__sub">Your AI lead intelligence pipeline at a glance.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/campaigns" className="btn btn-primary btn-sm">
            <Target size={15} /> New Campaign
          </Link>
          <Link to="/leads" className="btn btn-secondary btn-sm">
            <Users size={15} /> View Leads
          </Link>
        </div>
      </div>

      <div className="dashboard__kpi-grid animate-fade-up-2">
        {[
          { label: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'var(--aurora)', bg: 'var(--aurora-dim)' },
          { label: 'AI Enriched', value: stats?.enrichedLeads || 0, icon: Brain, color: 'var(--violet)', bg: 'var(--violet-dim)' },
          { label: 'With Emails', value: stats?.withEmails || 0, icon: Mail, color: 'var(--jade)', bg: 'var(--jade-dim)' },
          { label: 'Avg AI Score', value: stats?.avgScore ? Math.round(stats.avgScore) : 0, icon: Star, color: 'var(--amber)', bg: 'var(--amber-dim)', suffix: '/100' },
          { label: 'Contacted', value: stats?.contacted || 0, icon: TrendingUp, color: 'var(--aurora)', bg: 'var(--aurora-dim)' },
          { label: 'Active Campaigns', value: stats?.activeCampaigns || 0, icon: Target, color: 'var(--jade)', bg: 'var(--jade-dim)' },
        ].map(({ label, value, icon: Icon, color, bg, suffix }) => (
          <div key={label} className="glass-card dashboard__kpi">
            <div className="dashboard__kpi-icon" style={{ background: bg, border: `1px solid ${color}25` }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div className="dashboard__kpi-value">{value.toLocaleString()}{suffix || ''}</div>
              <div className="dashboard__kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__charts animate-fade-up-3">
        <div className="glass-card dashboard__chart-card">
          <div className="dashboard__chart-header">
            <h3 className="dashboard__chart-title">Sales Pipeline Funnel</h3>
            <span className="badge badge-aurora"><Zap size={10} fill="currentColor" /> Live</span>
          </div>
          {stats?.totalLeads > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Syne' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Syne' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,31,58,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontFamily: 'Syne' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {funnelData.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard__empty-chart">
              <Target size={32} color="var(--text-muted)" />
              <p>No pipeline data yet. Start a campaign to see your funnel.</p>
              <Link to="/campaigns" className="btn btn-primary btn-sm">Start Campaign</Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="dashboard__chart-title" style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { to: '/campaigns', label: 'Create a new campaign', color: 'var(--aurora)' },
                { to: '/leads', label: 'Browse all leads', color: 'var(--jade)' },
                { to: '/leads', label: 'Scrape new leads', color: 'var(--violet)' },
              ].map(({ to, label, color }) => (
                <Link key={label} to={to} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--glass-1)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13,
                  transition: 'all 0.2s', fontWeight: 500
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {label} <ChevronRight size={14} />
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="dashboard__chart-title" style={{ marginBottom: 8 }}>Powered By</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {['Gemini 1.5 Flash AI', 'Google Places API', 'Hunter.io Email Finder'].map(name => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Zap size={12} color="var(--aurora)" fill="var(--aurora)" /> {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
