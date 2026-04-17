import { useEffect, useState, useCallback } from 'react'
import { leadsAPI, campaignsAPI } from '../api/client.js'
import {
  Search, Download, Brain, Mail, Trash2, Star, Plus,
  X, Loader, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Globe, Phone
} from 'lucide-react'
import toast from 'react-hot-toast'
import './Leads.css'

/* ── Scrape Modal ─────────────────────────────── */
function ScrapeModal({ campaigns, onClose, onDone }) {
  const [f, setF] = useState({ query:'', location:'', campaignId:'', maxResults:20 })
  const [jobId, setJobId] = useState(null)
  const [job, setJob] = useState(null)

  const start = async (e) => {
    e.preventDefault()
    try {
      const res = await leadsAPI.scrape(f)
      setJobId(res.data.jobId)
      toast.success('Scraping started...')
    } catch(err) {
      toast.error(err.response?.data?.error || 'Failed to start')
    }
  }

  useEffect(() => {
    if (!jobId) return
    const t = setInterval(async () => {
      try {
        const res = await leadsAPI.job(jobId)
        setJob(res.data.job)
        if (res.data.job.status === 'completed') {
          clearInterval(t)
          toast.success(`Done! Found ${res.data.job.results_count} leads.`)
          setTimeout(() => { onDone(); onClose() }, 1200)
        } else if (res.data.job.status === 'failed') {
          clearInterval(t)
          toast.error('Scrape failed: ' + res.data.job.error)
        }
      } catch { clearInterval(t) }
    }, 2500)
    return () => clearInterval(t)
  }, [jobId])

  return (
    <div className="modal-overlay" onClick={!jobId ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h2 className="modal-title">Scrape New Leads</h2>
          {!jobId && <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16}/></button>}
        </div>

        {!jobId ? (
          <>
            <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:20, lineHeight:1.6 }}>
              Enter a business type and city. Prospera will pull matching businesses from Google Maps with phone, website, rating, and reviews.
            </p>
            <form onSubmit={start} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="input-label">Business Category *</label>
                <input className="input" required placeholder="e.g. dental clinics, restaurants, law firms"
                  value={f.query} onChange={e => setF(p=>({...p,query:e.target.value}))} />
              </div>
              <div>
                <label className="input-label">City / Location *</label>
                <input className="input" required placeholder="e.g. Austin, TX or London, UK"
                  value={f.location} onChange={e => setF(p=>({...p,location:e.target.value}))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">Assign to Campaign</label>
                  <select className="input" value={f.campaignId} onChange={e => setF(p=>({...p,campaignId:e.target.value}))}>
                    <option value="">None</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Max Results (50 max)</label>
                  <input className="input" type="number" min={1} max={50}
                    value={f.maxResults} onChange={e => setF(p=>({...p,maxResults:parseInt(e.target.value)||20}))} />
                </div>
              </div>
              <div style={{ background:'var(--cyan-dim)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'var(--cyan)', lineHeight:1.6 }}>
                Requires a Google Places API key in the backend .env file for live data. Without it, realistic demo data is returned so you can test the full workflow.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex:1 }}>
                  <Search size={15} /> Start Scrape
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            {job?.status === 'completed' ? (
              <>
                <CheckCircle size={52} color="var(--green)" style={{ marginBottom:12 }} />
                <h3 style={{ fontSize:18, color:'var(--green)' }}>Scrape Complete!</h3>
                <p style={{ color:'var(--text-2)', marginTop:6 }}>Found {job.results_count} leads</p>
              </>
            ) : (
              <>
                <div className="spinner" style={{ width:40, height:40, margin:'0 auto 16px' }} />
                <h3 style={{ fontSize:17, marginBottom:6 }}>Scraping in progress...</h3>
                <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:16 }}>
                  {job?.results_count || 0} leads found so far
                </p>
                {job?.total > 0 && (
                  <div className="score-bar" style={{ maxWidth:240, margin:'0 auto', height:6 }}>
                    <div className="score-fill" style={{ width:`${Math.round((job.progress/job.total)*100)}%`, background:'var(--cyan)' }} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Lead row ─────────────────────────────────── */
function LeadRow({ lead, onEnrich, onDelete, onStatus }) {
  const [exp, setExp] = useState(false)
  const [enriching, setEnriching] = useState(false)

  const enrich = async (e) => {
    e.stopPropagation()
    setEnriching(true)
    try {
      const res = await leadsAPI.enrich(lead.id)
      toast.success('AI analysis done!')
      onEnrich(res.data.lead)
    } catch(err) {
      toast.error(err.response?.data?.error || 'Enrichment failed')
    } finally { setEnriching(false) }
  }

  const scoreColor = s => s >= 70 ? 'var(--red)' : s >= 50 ? 'var(--orange)' : 'var(--green)'
  const painPoints = lead.pain_points ? JSON.parse(lead.pain_points) : []

  return (
    <>
      <tr onClick={() => setExp(e=>!e)} className="lead-row">
        <td>
          <div className="lead-name">{lead.business_name}</div>
          <div className="lead-sub">{lead.city}{lead.city&&lead.category?' · ':''}{lead.category}</div>
        </td>
        <td>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {lead.email && <span className="contact-item" style={{ color:'var(--green)' }}><Mail size={11}/>{lead.email}</span>}
            {lead.phone && <span className="contact-item"><Phone size={11}/>{lead.phone}</span>}
            {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="contact-item" onClick={e=>e.stopPropagation()}><Globe size={11}/>Website</a>}
          </div>
        </td>
        <td>
          {lead.google_rating > 0 && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
              <Star size={12} fill="var(--orange)" color="var(--orange)" />
              {lead.google_rating} <span style={{ color:'var(--text-3)', fontSize:11 }}>({lead.review_count})</span>
            </span>
          )}
        </td>
        <td>
          {lead.score > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className="score-bar" style={{ width:48 }}>
                <div className="score-fill" style={{ width:`${lead.score}%`, background:scoreColor(lead.score) }} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:scoreColor(lead.score) }}>{lead.score}</span>
            </div>
          )}
        </td>
        <td>
          <select className="status-select" value={lead.status} onClick={e=>e.stopPropagation()}
            onChange={e => onStatus(lead.id, e.target.value)}>
            {['new','contacted','replied','converted','disqualified'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-secondary btn-icon" onClick={enrich} disabled={enriching}
              title={lead.enriched_at ? 'Re-enrich with AI' : 'Enrich with AI'}>
              {enriching ? <Loader size={13} className="spin-anim" /> : lead.enriched_at ? <RefreshCw size={13}/> : <Brain size={13}/>}
            </button>
            <button className="btn btn-ghost btn-icon" style={{ color:'var(--red)' }}
              onClick={e=>{e.stopPropagation();onDelete(lead.id)}} title="Delete">
              <Trash2 size={13}/>
            </button>
            <span style={{ color:'var(--text-3)', marginLeft:2 }}>
              {exp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </span>
          </div>
        </td>
      </tr>
      {exp && (
        <tr className="detail-row">
          <td colSpan={6}>
            <div className="detail-body">
              {lead.ai_summary && (
                <div className="detail-section">
                  <div className="detail-label"><Brain size={12}/> AI Business Intelligence</div>
                  <p>{lead.ai_summary}</p>
                  {painPoints.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                      {painPoints.map((p,i)=><span key={i} className="badge badge-red" style={{ fontWeight:400 }}>{p}</span>)}
                    </div>
                  )}
                </div>
              )}
              {lead.personalized_email && (
                <div className="detail-section">
                  <div className="detail-label"><Mail size={12}/> AI Personalized Email</div>
                  {lead.email_subject && <div className="email-subject">Subject: {lead.email_subject}</div>}
                  <pre className="email-body">{lead.personalized_email}</pre>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop:8 }}
                    onClick={() => { navigator.clipboard.writeText(`Subject: ${lead.email_subject}\n\n${lead.personalized_email}`); toast.success('Copied!') }}>
                    Copy Email
                  </button>
                </div>
              )}
              {!lead.enriched_at && (
                <p style={{ fontSize:13, color:'var(--text-3)', padding:'4px 0' }}>
                  Click the Brain icon to run Gemini AI analysis on this lead.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Main Page ────────────────────────────────── */
export default function Leads() {
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [scrapeModal, setScrapeModal] = useState(false)
  const [filters, setFilters] = useState({ search:'', status:'', campaignId:'' })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsAPI.list({ ...filters, limit:100 })
      setLeads(res.data.leads)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load leads') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { campaignsAPI.list().then(r=>setCampaigns(r.data.campaigns)).catch(()=>{}) }, [])

  const exportCSV = async () => {
    try {
      const res = await leadsAPI.exportCSV({})
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href=url; a.download='prospera_leads.csv'; a.click()
      toast.success('Exported!')
    } catch { toast.error('Export failed') }
  }

  const del = async (id) => {
    if (!confirm('Delete this lead?')) return
    await leadsAPI.delete(id).catch(()=>toast.error('Failed'))
    setLeads(l => l.filter(x=>x.id!==id))
    toast.success('Deleted')
  }

  const onStatus = async (id, status) => {
    await leadsAPI.update(id, { status }).catch(()=>{})
    setLeads(l => l.map(x => x.id===id ? {...x,status} : x))
  }

  const onEnrich = (updated) => setLeads(l => l.map(x => x.id===updated.id ? updated : x))

  const clearFilters = () => setFilters({ search:'', status:'', campaignId:'' })
  const hasFilters = filters.search || filters.status || filters.campaignId

  return (
    <div className="page">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Lead Intelligence</h1>
          <p className="page-sub">{total.toLocaleString()} leads in your database</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14}/> Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setScrapeModal(true)}><Plus size={14}/> Scrape Leads</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters fade-up-2">
        <div className="input-wrap" style={{ flex:2, minWidth:200 }}>
          <Search size={15} className="input-icon" />
          <input className="input input-padded" placeholder="Search business, city, category..."
            value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))} />
        </div>
        <select className="input" style={{ flex:1, minWidth:130 }}
          value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}>
          <option value="">All Statuses</option>
          {['new','contacted','replied','converted','disqualified'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" style={{ flex:1, minWidth:150 }}
          value={filters.campaignId} onChange={e=>setFilters(p=>({...p,campaignId:e.target.value}))}>
          <option value="">All Campaigns</option>
          {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={13}/> Clear</button>}
      </div>

      {/* Table or empty state */}
      {loading ? (
        <div style={{ padding:48, display:'flex', justifyContent:'center' }}><div className="spinner" style={{ width:32, height:32 }}/></div>
      ) : leads.length === 0 ? (
        <div className="card empty fade-up">
          <div className="empty-icon"><Search size={28} color="var(--text-3)"/></div>
          <h3>{hasFilters ? 'No leads match your filters' : 'No leads yet'}</h3>
          <p>{hasFilters ? 'Try clearing your filters.' : 'Click "Scrape Leads" to extract businesses from Google Maps. Set a business type and city to get started.'}</p>
          {!hasFilters && <button className="btn btn-primary" onClick={()=>setScrapeModal(true)}><Plus size={15}/> Scrape First Leads</button>}
        </div>
      ) : (
        <div className="table-wrap fade-up-3">
          <table className="table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>Rating</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <LeadRow key={lead.id} lead={lead} onEnrich={onEnrich} onDelete={del} onStatus={onStatus} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scrapeModal && <ScrapeModal campaigns={campaigns} onClose={()=>setScrapeModal(false)} onDone={fetch} />}
    </div>
  )
}
