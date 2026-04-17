import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { aiAPI } from '../api/client.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  Search, Brain, Mail, Target, TrendingUp, ChevronRight, Zap,
  Users, Star, Globe, Phone, ArrowRight, Calculator, Check, X,
  MapPin, Download, Shield, Clock, BarChart2, Building
} from 'lucide-react'
import './Home.css'

const FUNNEL_COLORS = ['#1a56db','#6d28d9','#057a55','#b45309']

const FEATURES = [
  {
    icon: Search,
    color: '#1a56db',
    bg: 'rgba(26,86,219,0.07)',
    title: 'Real-Time Business Scraping',
    desc: 'Pull live data from Google Maps — phone numbers, websites, ratings, and reviews — for any business category in any city worldwide. No stale databases.'
  },
  {
    icon: Brain,
    color: '#6d28d9',
    bg: 'rgba(109,40,217,0.07)',
    title: 'Gemini AI Pain Point Analysis',
    desc: 'Our AI reads up to 50 real customer reviews per business and surfaces the exact frustrations you can solve — giving you leverage before you write a single word.'
  },
  {
    icon: Mail,
    color: '#057a55',
    bg: 'rgba(5,122,85,0.07)',
    title: 'Hyper-Personalized Cold Emails',
    desc: 'Gemini writes a unique email for every single lead — referencing their specific rating, location, and pain points. Not a template. A genuine pitch that converts.'
  },
  {
    icon: MapPin,
    color: '#b45309',
    bg: 'rgba(180,83,9,0.07)',
    title: 'Territory Heat Map',
    desc: 'Visualize where your best prospects are concentrated. Switch between heat density and pin mode. Filter by campaign, status, or AI score to find your next move.'
  },
  {
    icon: BarChart2,
    color: '#1a56db',
    bg: 'rgba(26,86,219,0.07)',
    title: 'Pipeline CRM Tracking',
    desc: 'Track every lead from New to Contacted to Converted. Organize by campaign, filter by status, update with one click. Export to CSV anytime.'
  },
  {
    icon: Calculator,
    color: '#6d28d9',
    bg: 'rgba(109,40,217,0.07)',
    title: 'ROI Simulator',
    desc: 'Model your revenue potential before you scrape a single lead. Adjust leads per month, open rates, close rates, and deal value to see your projected return.'
  },
]

const WHO_FOR = [
  { icon: Building, title: 'B2B Sales Teams', desc: 'Find decision-makers at local businesses and reach them with context-aware outreach that feels human.' },
  { icon: Target, title: 'Marketing Agencies', desc: 'Identify businesses that need SEO, ads, or social media services — and arrive knowing their exact pain points.' },
  { icon: Globe, title: 'SaaS Companies', desc: 'Target niche verticals with precision. Every email references the prospect\'s real situation, not a generic pitch.' },
  { icon: Phone, title: 'Local Service Providers', desc: 'Build your local network, find partnership opportunities, and generate referrals with AI-assisted outreach.' },
]

const COMPARISON = [
  { feature: 'Data Source', prospera: 'Google Maps live data', manual: 'Manual searching' },
  { feature: 'Speed', prospera: '50 leads in under 2 minutes', manual: '1 lead per 5 minutes' },
  { feature: 'Email Writing', prospera: 'AI personalized per lead', manual: 'Copy-paste templates' },
  { feature: 'Pain Point Research', prospera: 'Gemini AI reads reviews', manual: 'Hours of research' },
  { feature: 'Data Freshness', prospera: 'Real-time from Google', manual: 'Often weeks out of date' },
  { feature: 'Cost', prospera: 'Free to start', manual: 'High labor cost' },
]

const FAQS = [
  { q: 'Does Prospera require a Google Places API key?', a: 'No API key is needed to get started. Without one, Prospera returns realistic demo data so you can test the full workflow. Add a Google Places API key in your backend environment to get live business data from any city worldwide.' },
  { q: 'How does the AI email personalization work?', a: 'Gemini AI reads real customer reviews for each business, identifies specific pain points, then writes a cold email that references those findings alongside your offer. Every email is unique — generated fresh for each lead.' },
  { q: 'Can I export my leads?', a: 'Yes. Export any set of leads to CSV from the Lead Intelligence page or from any individual Campaign page. The export includes all data fields: contact info, AI scores, generated emails, and status.' },
  { q: 'What is the AI Score?', a: 'Every lead gets scored 1 to 100 by Gemini AI based on sentiment analysis of their reviews, star rating, review volume, and industry signals. Higher scores indicate businesses that are more likely to be receptive to outreach.' },
  { q: 'How does the Territory Heat Map work?', a: 'Leads with coordinates (from the Google Places API) are plotted on a live map. Heat Map mode shows density weighted by AI score. Pin Map mode shows individual businesses color-coded by pipeline status.' },
]

export default function Home() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    aiAPI.stats().then(r => setStats(r.data.stats)).catch(() => setStats(null)).finally(() => setLoading(false))
  }, [])

  const hasData = stats && stats.totalLeads > 0
  const funnelData = hasData ? [
    { name: 'Scraped', value: stats.totalLeads },
    { name: 'Enriched', value: stats.enrichedLeads },
    { name: 'Contacted', value: stats.contacted },
    { name: 'Converted', value: stats.converted },
  ] : []

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <section className="hero fade-up">
        <div className="hero-eyebrow">
          <div className="hero-dot" />
          <span>Powered by Gemini AI · Google Maps Data · 200+ Countries</span>
        </div>
        <h1 className="hero-title">
          The smarter way to find<br />
          <em>B2B leads that actually convert</em>
        </h1>
        <p className="hero-sub">
          Prospera scrapes any business category from Google Maps, uses Gemini AI to analyze customer reviews and identify pain points, then writes a personalized cold email for every single lead — automatically.
        </p>
        <div className="hero-actions">
          <Link to="/leads" className="btn btn-primary btn-xl">
            <Search size={17} /> Start Scraping Free
          </Link>
          <Link to="/simulator" className="btn btn-secondary btn-lg">
            <Calculator size={16} /> Calculate Your ROI
          </Link>
        </div>
        <div className="hero-trust">
          {['No credit card required', 'Free 50 leads included', 'Setup in 2 minutes'].map(t => (
            <div key={t} className="trust-item">
              <Check size={13} color="var(--green)" strokeWidth={2.5} />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live pipeline (if data exists) or pipeline preview ── */}
      {!loading && (
        <section className="fade-up-2">
          {hasData ? (
            <div className="pipeline-live card">
              <div className="section-header" style={{ marginBottom:20 }}>
                <h2 className="section-title">Your Live Pipeline</h2>
                <span className="badge badge-green">● Live</span>
              </div>
              <div className="kpi-grid" style={{ marginBottom:24 }}>
                {[
                  { label:'Total Leads', value:stats.totalLeads, color:'var(--blue)', bg:'var(--blue-dim)', icon:Users },
                  { label:'AI Enriched', value:stats.enrichedLeads, color:'var(--purple)', bg:'var(--purple-dim)', icon:Brain },
                  { label:'With Emails', value:stats.withEmails, color:'var(--green)', bg:'var(--green-dim)', icon:Mail },
                  { label:'Avg AI Score', value:stats.avgScore?`${Math.round(stats.avgScore)}/100`:'—', color:'var(--amber)', bg:'var(--amber-dim)', icon:Star },
                  { label:'Contacted', value:stats.contacted, color:'var(--blue)', bg:'var(--blue-dim)', icon:TrendingUp },
                  { label:'Campaigns', value:stats.activeCampaigns, color:'var(--green)', bg:'var(--green-dim)', icon:Target },
                ].map(({ label, value, color, bg, icon:Icon }) => (
                  <div key={label} className="kpi-card">
                    <div className="kpi-icon" style={{ background:bg }}><Icon size={16} color={color} /></div>
                    <div className="kpi-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
                    <div className="kpi-label">{label}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={funnelData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill:'#a1a1aa', fontSize:12, fontFamily:'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#a1a1aa', fontSize:12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, fontFamily:'DM Sans', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }} labelStyle={{ color:'#18181b', fontWeight:600 }} cursor={{ fill:'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="value" radius={[5,5,0,0]}>
                    {funnelData.map((_,i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="pipeline-preview card">
              <div className="pipeline-preview-inner">
                <div className="pipeline-preview-text">
                  <span className="badge badge-blue" style={{ marginBottom:12 }}>Pipeline Visualization</span>
                  <h2 className="section-title">Your funnel, visualized in real time</h2>
                  <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.7, margin:'10px 0 20px' }}>
                    Once you scrape your first leads, Prospera shows your full pipeline — total leads, enriched count, contacted, and conversions — with a live bar chart that updates as you work.
                  </p>
                  <Link to="/leads" className="btn btn-primary"><Search size={15} /> Scrape your first leads</Link>
                </div>
                <div className="pipeline-preview-chart">
                  {[
                    { label:'Scraped', value:248, color:'#1a56db', pct:100 },
                    { label:'AI Enriched', value:201, color:'#6d28d9', pct:81 },
                    { label:'Contacted', value:89, color:'#057a55', pct:36 },
                    { label:'Converted', value:14, color:'#b45309', pct:6 },
                  ].map(({ label, value, color, pct }) => (
                    <div key={label} className="preview-bar-row">
                      <span className="preview-bar-label">{label}</span>
                      <div className="preview-bar-track">
                        <div className="preview-bar-fill" style={{ width:`${pct}%`, background:color }} />
                      </div>
                      <span className="preview-bar-value" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── How It Works ── */}
      <section className="fade-up-2">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">How It Works</p>
            <h2 className="section-title">From search to signed deal in 4 steps</h2>
          </div>
        </div>
        <div className="steps-grid">
          {[
            { n:'1', icon:Search, color:'#1a56db', bg:'rgba(26,86,219,0.07)', title:'Search any category + city', desc:'Type "dental clinics" and "Austin, TX". Prospera pulls every matching business from Google Maps with full contact data and reviews.' },
            { n:'2', icon:Brain, color:'#6d28d9', bg:'rgba(109,40,217,0.07)', title:'AI analyzes their reviews', desc:'Gemini reads up to 50 real customer reviews per business and identifies the exact pain points you can reference in your pitch.' },
            { n:'3', icon:Mail, color:'#057a55', bg:'rgba(5,122,85,0.07)', title:'Personalized email generated', desc:'A unique cold email is written for each business — not a template, but a specific message that references their real situation and rating.' },
            { n:'4', icon:TrendingUp, color:'#b45309', bg:'rgba(180,83,9,0.07)', title:'Track and close in your CRM', desc:'Update status, filter by score, view on the territory map, export to CSV. Your pipeline is always one click away.' },
          ].map(({ n, icon:Icon, color, bg, title, desc }) => (
            <div key={n} className="step-card card">
              <div className="step-number">{n}</div>
              <div className="step-icon" style={{ background:bg }}><Icon size={20} color={color} /></div>
              <h3 className="step-title">{title}</h3>
              <p className="step-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="fade-up-3">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Features</p>
            <h2 className="section-title">Everything you need. Nothing you don't.</h2>
          </div>
        </div>
        <div className="features-grid">
          {FEATURES.map(({ icon:Icon, color, bg, title, desc }) => (
            <div key={title} className="feature-card card">
              <div className="feature-icon" style={{ background:bg }}><Icon size={20} color={color} /></div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who Is It For ── */}
      <section className="fade-up-3">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Who Is Prospera For</p>
            <h2 className="section-title">Built for anyone who sells to local businesses</h2>
          </div>
        </div>
        <div className="who-grid">
          {WHO_FOR.map(({ icon:Icon, title, desc }) => (
            <div key={title} className="who-card card">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:'var(--blue-dim)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={17} color="var(--blue)" />
                </div>
                <h3 className="who-title">{title}</h3>
              </div>
              <p className="who-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="fade-up-3">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Why Prospera</p>
            <h2 className="section-title">Prospera vs. Manual Lead Generation</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table comparison-table">
            <thead>
              <tr>
                <th style={{ width:'30%' }}>Feature</th>
                <th style={{ color:'var(--blue)' }}>✦ Prospera AI</th>
                <th>Manual Searching</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ feature, prospera, manual }) => (
                <tr key={feature} style={{ cursor:'default' }}>
                  <td style={{ fontWeight:500, color:'var(--ink)' }}>{feature}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Check size={14} color="var(--green)" strokeWidth={2.5} />
                      <span style={{ color:'var(--ink)' }}>{prospera}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <X size={14} color="var(--ink-3)" strokeWidth={2} />
                      <span style={{ color:'var(--ink-2)' }}>{manual}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Integrations / Sources ── */}
      <section className="fade-up-3">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Data Sources &amp; Integrations</p>
            <h2 className="section-title">Connected to the best data in the world</h2>
          </div>
        </div>
        <div className="integrations-grid">
          {[
            { name:'Google Maps', detail:'Live business data, reviews, coordinates', color:'#4285F4', initial:'G' },
            { name:'Gemini AI', detail:'Pain point analysis, email generation', color:'#8E75B2', initial:'AI' },
            { name:'Hunter.io', detail:'Email finder by company domain', color:'#F36A1B', initial:'H' },
            { name:'Google Places API', detail:'Structured business profiles + ratings', color:'#34A853', initial:'P' },
          ].map(({ name, detail, color, initial }) => (
            <div key={name} className="integration-card card">
              <div className="integration-logo" style={{ background:color }}>
                <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{initial}</span>
              </div>
              <div>
                <div className="integration-name">{name}</div>
                <div className="integration-detail">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="fade-up-3">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Frequently Asked Questions</p>
            <h2 className="section-title">Everything you need to know</h2>
          </div>
        </div>
        <div className="faq-list card">
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className="faq-question">
                <span>{q}</span>
                <div className="faq-chevron">{openFaq === i ? '−' : '+'}</div>
              </div>
              {openFaq === i && <div className="faq-answer">{a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section fade-up-3">
        <div className="cta-inner card">
          <div className="cta-badge"><Zap size={12} fill="var(--blue)" color="var(--blue)" /> Free to Get Started</div>
          <h2 className="cta-title">Ready to fill your pipeline?</h2>
          <p className="cta-sub">
            Scrape your first 50 leads for free — no credit card, no setup. Pick a business type, pick a city, and Prospera does the rest.
          </p>
          <div className="cta-actions">
            <Link to="/leads" className="btn btn-primary btn-xl"><Search size={17} /> Start Scraping Free <ChevronRight size={16} /></Link>
            <Link to="/simulator" className="btn btn-secondary btn-lg"><Calculator size={15} /> Calculate My ROI</Link>
          </div>
          <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap', marginTop:16 }}>
            {['50 free leads', 'No credit card', 'Live in 2 minutes', 'CSV export included'].map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--ink-2)' }}>
                <Check size={13} color="var(--green)" strokeWidth={2.5} />{t}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
