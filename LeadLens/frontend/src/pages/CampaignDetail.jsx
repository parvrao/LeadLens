import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { campaignsAPI, leadsAPI } from '../api/client.js'
import { ArrowLeft, Brain, Download, Search, Star, Mail, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrichingAll, setEnrichingAll] = useState(false)

  const load = async () => {
    try {
      const [cr, lr] = await Promise.all([campaignsAPI.get(id), leadsAPI.list({ campaignId: id, limit: 100 })])
      setCampaign(cr.data.campaign)
      setStats(cr.data.stats)
      setLeads(lr.data.leads)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const enrichAll = async () => {
    const unenriched = leads.filter(l => !l.enriched_at)
    if (!unenriched.length) { toast('All leads already enriched!'); return }
    setEnrichingAll(true)
    toast(`Enriching ${unenriched.length} leads with Gemini AI...`)
    let done = 0
    for (const lead of unenriched) {
      try { await leadsAPI.enrich(lead.id); done++ } catch {}
      await new Promise(r => setTimeout(r, 1500))
    }
    toast.success(`Enriched ${done} leads!`)
    load(); setEnrichingAll(false)
  }

  const exportCSV = async () => {
    try {
      const res = await leadsAPI.exportCSV({ campaignId: id })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href=url; a.download=`${campaign.name}_leads.csv`; a.click()
    } catch { toast.error('Export failed') }
  }

  if (loading) return <div style={{ padding:48, display:'flex', justifyContent:'center' }}><div className="spinner" style={{ width:32, height:32 }}/></div>
  if (!campaign) return <div style={{ padding:32 }}>Campaign not found</div>

  return (
    <div className="page">
      <Link to="/campaigns" style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-3)', textDecoration:'none', fontSize:13, width:'fit-content' }}>
        <ArrowLeft size={14}/> Back to Campaigns
      </Link>

      <div className="page-header fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="page-title" style={{ marginBottom:0 }}>{campaign.name}</h1>
            <span className={`badge ${campaign.status==='active' ? 'badge-green' : 'badge-gray'}`}>{campaign.status}</span>
          </div>
          {campaign.target_industry && (
            <p style={{ fontSize:12, color:'var(--cyan)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {campaign.target_industry}{campaign.target_location ? ` · ${campaign.target_location}` : ''}
            </p>
          )}
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14}/> Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={enrichAll} disabled={enrichingAll}>
            {enrichingAll ? <><div className="spinner"/>Enriching...</> : <><Brain size={14}/> Enrich All</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid fade-up-2">
        {[
          { label:'Total', value:stats?.total||0, color:'var(--cyan)' },
          { label:'New', value:stats?.new_leads||0, color:'var(--cyan)' },
          { label:'Contacted', value:stats?.contacted||0, color:'var(--purple)' },
          { label:'Replied', value:stats?.replied||0, color:'var(--green)' },
          { label:'Converted', value:stats?.converted||0, color:'var(--orange)' },
          { label:'Avg Score', value:stats?.avg_score?Math.round(stats.avg_score):0, color:'var(--red)', suffix:'/100' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-value" style={{ color, fontSize:26 }}>{value}{suffix||''}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Offer */}
      {campaign.offer_description && (
        <div className="card fade-up-2" style={{ padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--cyan)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
            Campaign Offer — Gemini AI writes emails based on this
          </div>
          <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.65 }}>{campaign.offer_description}</p>
        </div>
      )}

      {/* Leads table */}
      <div>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Leads in this Campaign</h3>
        {leads.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon"><Users size={28} color="var(--text-3)"/></div>
            <h3>No leads yet</h3>
            <p>Scrape leads and assign them to this campaign, or go to Lead Intelligence and filter by this campaign.</p>
            <Link to="/leads" className="btn btn-primary btn-sm"><Search size={14}/> Go to Leads</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Rating</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th>Email Ready</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} style={{ cursor:'default' }}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:14 }}>{l.business_name}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>{l.city}</div>
                    </td>
                    <td style={{ fontSize:12, color:'var(--green)' }}>{l.email || <span style={{ color:'var(--text-3)' }}>Not found</span>}</td>
                    <td>
                      {l.google_rating > 0 && (
                        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
                          <Star size={12} fill="var(--orange)" color="var(--orange)" />{l.google_rating}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize:13, fontWeight:700, color: l.score>=70?'var(--red)':l.score>=50?'var(--orange)':'var(--green)' }}>
                        {l.score > 0 ? l.score : '—'}
                      </span>
                    </td>
                    <td><span className="badge badge-gray" style={{ textTransform:'capitalize' }}>{l.status}</span></td>
                    <td>
                      {l.personalized_email
                        ? <span className="badge badge-green"><Mail size={10}/> Ready</span>
                        : <span className="badge badge-gray">Pending</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
