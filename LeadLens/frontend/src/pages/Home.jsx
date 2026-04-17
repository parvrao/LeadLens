import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { aiAPI } from '../api/client.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Search, Brain, Mail, Target, TrendingUp, ChevronRight, Zap, Users, Star, Globe, Phone, ArrowRight, Calculator } from 'lucide-react'
import './Home.css'

const FUNNEL_COLORS = ['#1d6ef5','#6b4fbb','#1a9e6e','#d4870a']

const HOW_IT_WORKS = [
  { step:'01', icon:Search, color:'var(--accent)', bg:'var(--accent-dim)', title:'Search any business category', desc:'Type "dental clinics" or "restaurants" and a city. Prospera pulls every matching business from Google Maps with name, address, phone, website, rating, and reviews.' },
  { step:'02', icon:Brain, color:'var(--purple)', bg:'var(--purple-dim)', title:'Gemini AI reads their reviews', desc:'Our AI reads up to 50 real customer reviews per business and identifies the exact pain points customers complain about — before you write a single word.' },
  { step:'03', icon:Mail, color:'var(--green)', bg:'var(--green-dim)', title:'Personalized email written for you', desc:'Gemini writes a unique cold email for each business referencing their specific situation and pain points. Not a template — a real, human-sounding email.' },
  { step:'04', icon:TrendingUp, color:'var(--amber)', bg:'var(--amber-dim)', title:'Track and close in your CRM', desc:'Every lead lives in your pipeline. Track status from New to Contacted to Converted. Export to CSV. Visualize territories on the heat map.' },
]

export default function Home() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    aiAPI.stats().then(r => setStats(r.data.stats)).catch(() => setStats(null)).finally(() => setLoading(false))
  }, [])

  const funnelData = stats ? [
    { name:'Total', value:stats.totalLeads||0 },
    { name:'Enriched', value:stats.enrichedLeads||0 },
    { name:'Contacted', value:stats.contacted||0 },
    { name:'Converted', value:stats.converted||0 },
  ] : []

  const hasData = stats && stats.totalLeads > 0

  return (
    <div className="home page">
      <div className="hero-banner fade-up">
        <div className="hero-badge"><Zap size={11} fill="var(--accent)" color="var(--accent)" /> AI-Powered Lead Generation</div>
        <h1 className="hero-title">Find business leads.<br /><span className="hero-highlight">Know their pain. Send the perfect email.</span></h1>
        <p className="hero-sub">Search any business category in any city. Prospera scrapes Google Maps for real businesses, uses Gemini AI to analyze customer reviews and find pain points, then writes a personalized cold email for every single lead automatically.</p>
        <div className="hero-actions">
          <Link to="/leads" className="btn btn-primary btn-lg"><Search size={16} /> Start Scraping Leads</Link>
          <Link to="/simulator" className="btn btn-secondary btn-lg"><Calculator size={16} /> ROI Simulator</Link>
        </div>
      </div>

      {!loading && (
        <div className="kpi-grid fade-up-2">
          {[
            { label:'Total Leads', value:stats?.totalLeads||0, icon:Users, color:'var(--accent)', bg:'var(--accent-dim)' },
            { label:'AI Enriched', value:stats?.enrichedLeads||0, icon:Brain, color:'var(--purple)', bg:'var(--purple-dim)' },
            { label:'With Emails', value:stats?.withEmails||0, icon:Mail, color:'var(--green)', bg:'var(--green-dim)' },
            { label:'Avg AI Score', value:stats?.avgScore?Math.round(stats.avgScore):0, icon:Star, color:'var(--amber)', bg:'var(--amber-dim)', suffix:'/100' },
            { label:'Contacted', value:stats?.contacted||0, icon:TrendingUp, color:'var(--accent)', bg:'var(--accent-dim)' },
            { label:'Campaigns', value:stats?.activeCampaigns||0, icon:Target, color:'var(--green)', bg:'var(--green-dim)' },
          ].map(({ label, value, icon:Icon, color, bg, suffix }) => (
            <div key={label} className="kpi-card">
              <div className="kpi-icon" style={{ background:bg }}><Icon size={17} color={color} /></div>
              <div className="kpi-value" style={{ color }}>{value.toLocaleString()}{suffix||''}</div>
              <div className="kpi-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {hasData ? (
        <div className="home-charts fade-up-3">
          <div className="card" style={{ padding:22, flex:2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2, color:'var(--ink)' }}>Sales Pipeline Funnel</h3>
                <p style={{ fontSize:12, color:'var(--ink-3)' }}>Leads through each stage</p>
              </div>
              <span className="badge badge-green">Live</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fill:'#888880', fontSize:12, fontFamily:'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#888880', fontSize:12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, fontFamily:'Inter', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }} labelStyle={{ color:'#1a1a18', fontWeight:600 }} itemStyle={{ color:'#4a4a46' }} cursor={{ fill:'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="value" radius={[5,5,0,0]}>
                  {funnelData.map((_,i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding:22, flex:1 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--ink)' }}>Quick Actions</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {[
                { to:'/leads', label:'Scrape new leads', icon:Search },
                { to:'/campaigns', label:'Create a campaign', icon:Target },
                { to:'/map', label:'View territory map', icon:Globe },
                { to:'/simulator', label:'Calculate ROI', icon:Calculator },
              ].map(({ to, label, icon:Icon }) => (
                <Link key={label} to={to} className="quick-action">
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}><Icon size={14} color="var(--accent)" /><span>{label}</span></div>
                  <ArrowRight size={13} color="var(--ink-4)" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-up-3">
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:5, color:'var(--ink)', letterSpacing:'-0.02em' }}>How Prospera Works</h2>
            <p style={{ fontSize:13, color:'var(--ink-2)' }}>4 steps from zero to personalized outreach at scale</p>
          </div>
          <div className="how-grid">
            {HOW_IT_WORKS.map(({ step, icon:Icon, color, bg, title, desc }) => (
              <div key={step} className="how-card card">
                <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:13 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--bg-4)', fontWeight:800, lineHeight:1 }}>{step}</span>
                </div>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:7, color:'var(--ink)' }}>{title}</h3>
                <p style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="cta-card card" style={{ background:'linear-gradient(135deg, var(--accent-dim), var(--green-dim))' }}>
            <div className="cta-inner">
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, marginBottom:5, color:'var(--ink)', letterSpacing:'-0.02em' }}>Ready to find your first leads?</h3>
                <p style={{ fontSize:13, color:'var(--ink-2)' }}>Pick a business type and city. Results in under 60 seconds.</p>
              </div>
              <Link to="/leads" className="btn btn-primary"><Search size={15} /> Scrape Leads Now <ChevronRight size={15} /></Link>
            </div>
          </div>
        </div>
      )}

      <div className="sources-row fade-up-3">
        <span style={{ fontSize:11, color:'var(--ink-4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>Data Sources</span>
        {[
          { icon:Globe, label:'Google Maps', color:'#4285F4' },
          { icon:Brain, label:'Gemini AI', color:'#6b4fbb' },
          { icon:Mail, label:'Hunter.io', color:'#1a9e6e' },
          { icon:Phone, label:'Direct Contacts', color:'#d4870a' },
        ].map(({ icon:Icon, label, color }) => (
          <div key={label} className="source-chip"><Icon size={13} color={color} /><span>{label}</span></div>
        ))}
      </div>
    </div>
  )
}
