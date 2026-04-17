import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { aiAPI } from '../api/client.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  Search, Brain, Mail, Target, TrendingUp,
  ChevronRight, Zap, Users, Star, Globe, Phone, ArrowRight
} from 'lucide-react'
import './Home.css'

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Search,
    color: 'var(--cyan)',
    bg: 'var(--cyan-dim)',
    title: 'Search Any Business Category',
    desc: 'Type "dental clinics" or "restaurants" and a city. Prospera pulls every matching business from Google Maps — name, address, phone, website, rating, and reviews.'
  },
  {
    step: '02',
    icon: Brain,
    color: 'var(--purple)',
    bg: 'var(--purple-dim)',
    title: 'Gemini AI Reads Their Reviews',
    desc: 'Our AI reads up to 50 real customer reviews per business and identifies the exact pain points customers complain about — before you write a single word.'
  },
  {
    step: '03',
    icon: Mail,
    color: 'var(--green)',
    bg: 'var(--green-dim)',
    title: 'Personalized Cold Email Written For You',
    desc: 'Gemini writes a unique cold email for each business referencing their specific situation, pain points, and how your offer solves it. Not a template — a real email.'
  },
  {
    step: '04',
    icon: TrendingUp,
    color: 'var(--orange)',
    bg: 'var(--orange-dim)',
    title: 'Track and Close in Your CRM',
    desc: 'Every lead lives in your pipeline. Track status from New to Contacted to Converted. Export to CSV anytime. Organize by campaign.'
  }
]

const FUNNEL_COLORS = ['var(--cyan)', 'var(--purple)', 'var(--green)', 'var(--orange)']

export default function Home() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    aiAPI.stats()
      .then(r => setStats(r.data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const funnelData = stats ? [
    { name: 'Total', value: stats.totalLeads || 0 },
    { name: 'Enriched', value: stats.enrichedLeads || 0 },
    { name: 'Contacted', value: stats.contacted || 0 },
    { name: 'Converted', value: stats.converted || 0 },
  ] : []

  const hasData = stats && stats.totalLeads > 0

  return (
    <div className="home page">

      {/* Hero banner — always visible, explains what this is */}
      <div className="hero-banner fade-up">
        <div className="hero-badge">
          <Zap size={12} fill="var(--cyan)" color="var(--cyan)" />
          AI-Powered Lead Generation
        </div>
        <h1 className="hero-title">
          Find business leads.<br />
          <span className="hero-highlight">Know their pain. Send the perfect email.</span>
        </h1>
        <p className="hero-sub">
          Search any business category in any city. Prospera scrapes Google Maps for real businesses, uses Gemini AI to analyze customer reviews and find pain points, then writes a personalized cold email for every single lead — automatically.
        </p>
        <div className="hero-actions">
          <Link to="/leads" className="btn btn-primary btn-lg">
            <Search size={17} /> Start Scraping Leads
          </Link>
          <Link to="/campaigns" className="btn btn-secondary btn-lg">
            <Target size={17} /> Create a Campaign
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="kpi-grid fade-up-2">
          {[
            { label: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'var(--cyan)', bg: 'var(--cyan-dim)' },
            { label: 'AI Enriched', value: stats?.enrichedLeads || 0, icon: Brain, color: 'var(--purple)', bg: 'var(--purple-dim)' },
            { label: 'With Emails', value: stats?.withEmails || 0, icon: Mail, color: 'var(--green)', bg: 'var(--green-dim)' },
            { label: 'Avg AI Score', value: stats?.avgScore ? Math.round(stats.avgScore) : 0, icon: Star, color: 'var(--orange)', bg: 'var(--orange-dim)', suffix: '/100' },
            { label: 'Contacted', value: stats?.contacted || 0, icon: TrendingUp, color: 'var(--cyan)', bg: 'var(--cyan-dim)' },
            { label: 'Campaigns', value: stats?.activeCampaigns || 0, icon: Target, color: 'var(--green)', bg: 'var(--green-dim)' },
          ].map(({ label, value, icon: Icon, color, bg, suffix }) => (
            <div key={label} className="kpi-card fade-up-2">
              <div className="kpi-icon" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div className="kpi-value" style={{ color }}>{value.toLocaleString()}{suffix || ''}</div>
              <div className="kpi-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline chart OR how it works — show chart if data exists, tutorial if not */}
      {hasData ? (
        <div className="home-charts fade-up-3">
          <div className="card" style={{ padding: 24, flex: 2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>Pipeline Funnel</h3>
                <p style={{ fontSize:13, color:'var(--text-2)' }}>Your leads through each stage</p>
              </div>
              <span className="badge badge-green">Live</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontFamily: 'Inter', fontSize: 13 }} labelStyle={{ color: '#fff', fontWeight: 600 }} itemStyle={{ color: 'rgba(255,255,255,0.7)' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {funnelData.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 24, flex: 1 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Quick Actions</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { to:'/leads', label:'Scrape new leads', icon: Search },
                { to:'/campaigns', label:'Create a campaign', icon: Target },
                { to:'/leads', label:'Browse all leads', icon: Users },
              ].map(({ to, label, icon: Icon }) => (
                <Link key={label} to={to} className="quick-action">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Icon size={15} color="var(--cyan)" />
                    <span>{label}</span>
                  </div>
                  <ArrowRight size={14} color="var(--text-3)" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* How it works — shown when no data yet */
        <div className="fade-up-3">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 6 }}>How Prospera Works</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>4 steps from zero to personalized outreach</p>
          </div>
          <div className="how-grid">
            {HOW_IT_WORKS.map(({ step, icon: Icon, color, bg, title, desc }) => (
              <div key={step} className="how-card card">
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--border-hover)', fontWeight:800, lineHeight:1 }}>{step}</span>
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="cta-card card">
            <div className="cta-inner">
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:6 }}>Ready to find your first leads?</h3>
                <p style={{ fontSize:14, color:'var(--text-2)' }}>Pick a business category and a city. We will do the rest.</p>
              </div>
              <Link to="/leads" className="btn btn-primary">
                <Search size={16} /> Scrape Leads Now <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sources section — always visible */}
      <div className="sources-row fade-up-3">
        <span style={{ fontSize:12, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>Data Sources</span>
        {[
          { icon: Globe, label: 'Google Maps', color: '#4285F4' },
          { icon: Brain, label: 'Gemini AI', color: '#8E75B2' },
          { icon: Mail, label: 'Hunter.io', color: '#00e5a0' },
          { icon: Phone, label: 'Direct Contacts', color: '#ff7f50' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="source-chip">
            <Icon size={14} color={color} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
