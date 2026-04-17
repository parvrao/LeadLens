import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { Calculator, TrendingUp, DollarSign, Users, Mail, Target, ChevronRight, Zap } from 'lucide-react'
import './Simulator.css'

const INDUSTRIES = [
  { label:'Dental Clinics', avgDeal:3500, closeRate:8 },
  { label:'Law Firms', avgDeal:5000, closeRate:6 },
  { label:'Restaurants', avgDeal:1200, closeRate:12 },
  { label:'Real Estate Agencies', avgDeal:8000, closeRate:5 },
  { label:'Auto Repair Shops', avgDeal:900, closeRate:14 },
  { label:'Gyms and Fitness', avgDeal:1800, closeRate:10 },
  { label:'Accounting Firms', avgDeal:4000, closeRate:7 },
  { label:'Marketing Agencies', avgDeal:3000, closeRate:9 },
  { label:'Custom', avgDeal:2500, closeRate:8 },
]

function fmt(n) { return Math.round(n).toLocaleString() }
function fmtUSD(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K'
  return '$' + Math.round(n)
}

export default function Simulator() {
  const [industry, setIndustry] = useState(0)
  const [leadsPerMonth, setLeadsPerMonth] = useState(200)
  const [emailOpenRate, setEmailOpenRate] = useState(42)
  const [replyRate, setReplyRate] = useState(12)
  const [closeRate, setCloseRate] = useState(INDUSTRIES[0].closeRate)
  const [avgDeal, setAvgDeal] = useState(INDUSTRIES[0].avgDeal)
  const [months, setMonths] = useState(6)

  const handleIndustryChange = (i) => {
    setIndustry(i)
    if (i < INDUSTRIES.length - 1) {
      setCloseRate(INDUSTRIES[i].closeRate)
      setAvgDeal(INDUSTRIES[i].avgDeal)
    }
  }

  const calc = useMemo(() => {
    const emailsSent = leadsPerMonth
    const opens = Math.round(emailsSent * emailOpenRate / 100)
    const replies = Math.round(opens * replyRate / 100)
    const closes = Math.round(replies * closeRate / 100)
    const monthlyRevenue = closes * avgDeal
    const totalRevenue = monthlyRevenue * months

    const prospera_cost = 0
    const manual_hours_saved = leadsPerMonth * 0.25
    const manual_cost_saved = manual_hours_saved * 50
    const roi = totalRevenue > 0 ? Math.round(((totalRevenue - prospera_cost) / Math.max(1, prospera_cost)) * 100) : 0

    const monthlyData = Array.from({ length: months }, (_, i) => ({
      month: `M${i + 1}`,
      revenue: monthlyRevenue * (i + 1),
      leads: leadsPerMonth * (i + 1),
      closes: closes * (i + 1),
    }))

    const funnelData = [
      { stage: 'Leads Scraped', value: emailsSent, color: '#1d6ef5' },
      { stage: 'Emails Opened', value: opens, color: '#6b4fbb' },
      { stage: 'Replies', value: replies, color: '#1a9e6e' },
      { stage: 'Closed Deals', value: closes, color: '#d4870a' },
    ]

    return { emailsSent, opens, replies, closes, monthlyRevenue, totalRevenue, manual_hours_saved, manual_cost_saved, roi, monthlyData, funnelData }
  }, [leadsPerMonth, emailOpenRate, replyRate, closeRate, avgDeal, months])

  return (
    <div className="sim-page page">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">ROI Simulator</h1>
          <p className="page-sub">Estimate your revenue potential from AI-powered lead generation.</p>
        </div>
        <Link to="/leads" className="btn btn-primary btn-sm"><Zap size={14} /> Start Prospecting</Link>
      </div>

      <div className="sim-layout fade-up-2">
        {/* Controls panel */}
        <div className="sim-controls card">
          <h3 className="sim-section-title">Configure Your Scenario</h3>

          <div className="sim-field">
            <label className="input-label">Target Industry</label>
            <select className="input" value={industry} onChange={e => handleIndustryChange(parseInt(e.target.value))}>
              {INDUSTRIES.map((ind, i) => <option key={i} value={i}>{ind.label}</option>)}
            </select>
          </div>

          <div className="sim-field">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <label className="input-label" style={{ margin:0 }}>Leads Scraped Per Month</label>
              <span className="sim-val">{fmt(leadsPerMonth)}</span>
            </div>
            <input type="range" className="sim-slider" min={50} max={2000} step={50} value={leadsPerMonth}
              onChange={e => setLeadsPerMonth(parseInt(e.target.value))} />
            <div className="sim-range-labels"><span>50</span><span>2,000</span></div>
          </div>

          <div className="sim-field">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <label className="input-label" style={{ margin:0 }}>Email Open Rate</label>
              <span className="sim-val">{emailOpenRate}%</span>
            </div>
            <input type="range" className="sim-slider" min={10} max={80} step={1} value={emailOpenRate}
              onChange={e => setEmailOpenRate(parseInt(e.target.value))} />
            <div className="sim-range-labels"><span>10%</span><span>80%</span></div>
          </div>

          <div className="sim-field">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <label className="input-label" style={{ margin:0 }}>Reply Rate (of opens)</label>
              <span className="sim-val">{replyRate}%</span>
            </div>
            <input type="range" className="sim-slider" min={1} max={40} step={1} value={replyRate}
              onChange={e => setReplyRate(parseInt(e.target.value))} />
            <div className="sim-range-labels"><span>1%</span><span>40%</span></div>
          </div>

          <div className="sim-field">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <label className="input-label" style={{ margin:0 }}>Close Rate (of replies)</label>
              <span className="sim-val">{closeRate}%</span>
            </div>
            <input type="range" className="sim-slider" min={1} max={40} step={1} value={closeRate}
              onChange={e => setCloseRate(parseInt(e.target.value))} />
            <div className="sim-range-labels"><span>1%</span><span>40%</span></div>
          </div>

          <div className="sim-field">
            <label className="input-label">Average Deal Value (USD)</label>
            <input type="number" className="input" min={100} max={100000} step={100} value={avgDeal}
              onChange={e => setAvgDeal(parseInt(e.target.value) || 1000)} />
          </div>

          <div className="sim-field">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <label className="input-label" style={{ margin:0 }}>Projection Period</label>
              <span className="sim-val">{months} months</span>
            </div>
            <input type="range" className="sim-slider" min={1} max={24} step={1} value={months}
              onChange={e => setMonths(parseInt(e.target.value))} />
            <div className="sim-range-labels"><span>1 mo</span><span>24 mo</span></div>
          </div>
        </div>

        {/* Results panel */}
        <div className="sim-results">
          {/* Big number cards */}
          <div className="sim-kpi-grid">
            <div className="sim-kpi-card sim-kpi-primary">
              <div className="sim-kpi-icon" style={{ background:'rgba(29,110,245,0.12)' }}>
                <DollarSign size={20} color="#1d6ef5" />
              </div>
              <div className="sim-kpi-value">{fmtUSD(calc.totalRevenue)}</div>
              <div className="sim-kpi-label">Estimated {months}mo Revenue</div>
            </div>
            <div className="sim-kpi-card">
              <div className="sim-kpi-icon" style={{ background:'rgba(26,158,110,0.1)' }}>
                <TrendingUp size={18} color="#1a9e6e" />
              </div>
              <div className="sim-kpi-value" style={{ color:'#1a9e6e' }}>{fmtUSD(calc.monthlyRevenue)}</div>
              <div className="sim-kpi-label">Monthly Revenue</div>
            </div>
            <div className="sim-kpi-card">
              <div className="sim-kpi-icon" style={{ background:'rgba(212,135,10,0.1)' }}>
                <Target size={18} color="#d4870a" />
              </div>
              <div className="sim-kpi-value" style={{ color:'#d4870a' }}>{fmt(calc.closes)}</div>
              <div className="sim-kpi-label">Deals Closed / Month</div>
            </div>
            <div className="sim-kpi-card">
              <div className="sim-kpi-icon" style={{ background:'rgba(107,79,187,0.1)' }}>
                <Users size={18} color="#6b4fbb" />
              </div>
              <div className="sim-kpi-value" style={{ color:'#6b4fbb' }}>{fmt(calc.replies)}</div>
              <div className="sim-kpi-label">Replies / Month</div>
            </div>
          </div>

          {/* Monthly funnel */}
          <div className="card" style={{ padding:22 }}>
            <h4 className="sim-chart-title">Monthly Email Funnel</h4>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {calc.funnelData.map(({ stage, value, color }) => (
                <div key={stage} className="funnel-stage">
                  <div className="funnel-bar-wrap">
                    <div className="funnel-bar" style={{ height: Math.max(4, Math.round((value / calc.emailsSent) * 80)), background: color }} />
                  </div>
                  <div className="funnel-value" style={{ color }}>{fmt(value)}</div>
                  <div className="funnel-label">{stage}</div>
                </div>
              ))}
            </div>
            <div style={{ height:1, background:'var(--border)', margin:'14px 0' }} />
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              <div className="sim-stat"><span className="sim-stat-label">Open Rate</span><span className="sim-stat-val">{emailOpenRate}%</span></div>
              <div className="sim-stat"><span className="sim-stat-label">Reply Rate</span><span className="sim-stat-val">{replyRate}%</span></div>
              <div className="sim-stat"><span className="sim-stat-label">Close Rate</span><span className="sim-stat-val">{closeRate}%</span></div>
              <div className="sim-stat"><span className="sim-stat-label">Avg Deal</span><span className="sim-stat-val">{fmtUSD(avgDeal)}</span></div>
              <div className="sim-stat"><span className="sim-stat-label">Hours Saved / Mo</span><span className="sim-stat-val">{fmt(calc.manual_hours_saved)}h</span></div>
            </div>
          </div>

          {/* Revenue over time chart */}
          <div className="card" style={{ padding:22 }}>
            <h4 className="sim-chart-title">Cumulative Revenue Over {months} Months</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={calc.monthlyData} margin={{ top:5, right:10, bottom:5, left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fill:'#888880', fontSize:11, fontFamily:'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtUSD(v)} tick={{ fill:'#888880', fontSize:11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v, name) => [fmtUSD(v), name === 'revenue' ? 'Cumulative Revenue' : name]}
                  contentStyle={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, fontFamily:'Inter', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ color:'#1a1a18', fontWeight:600 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#1d6ef5" strokeWidth={2.5} dot={{ fill:'#1d6ef5', r:3, strokeWidth:0 }} activeDot={{ r:5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Savings callout */}
          <div className="sim-savings card">
            <div className="sim-savings-icon"><Zap size={20} fill="#1d6ef5" color="#1d6ef5" /></div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)', marginBottom:3 }}>
                Prospera saves {fmt(calc.manual_hours_saved)} hours of manual research per month
              </div>
              <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.55 }}>
                At $50/hr that is {fmtUSD(calc.manual_cost_saved)} in saved labor costs monthly — on top of the {fmtUSD(calc.monthlyRevenue)} in new revenue potential. No expensive subscriptions. No sales team required.
              </div>
            </div>
            <Link to="/leads" className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>
              Start Now <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
