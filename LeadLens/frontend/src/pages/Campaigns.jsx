import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { campaignsAPI } from '../api/client.js'
import { Plus, Target, Users, TrendingUp, Trash2, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import './Campaigns.css'

function NewModal({ onClose, onCreate }) {
  const [f, setF] = useState({ name:'', offerDescription:'', targetIndustry:'', targetLocation:'' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name || !f.offerDescription) { toast.error('Name and offer are required'); return }
    setLoading(true)
    try {
      const res = await campaignsAPI.create(f)
      toast.success('Campaign created!')
      onCreate(res.data.campaign)
      onClose()
    } catch(err) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 className="modal-title"><em>New Campaign</em></h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:20, lineHeight:1.6 }}>
          A campaign groups leads by offer. Gemini AI uses your offer description to write personalized emails for every lead you add.
        </p>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="input-label">Campaign Name *</label>
            <input className="input" required placeholder="e.g. NYC Dental Clinics Q1"
              value={f.name} onChange={e => setF(p=>({...p,name:e.target.value}))} />
          </div>
          <div>
            <label className="input-label">Your Offer — AI uses this to write emails *</label>
            <textarea className="input" required rows={3} style={{ resize:'vertical', minHeight:80 }}
              placeholder="e.g. We help dental clinics reduce no-shows by 40% with automated appointment reminders."
              value={f.offerDescription} onChange={e => setF(p=>({...p,offerDescription:e.target.value}))} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="input-label">Industry</label>
              <input className="input" placeholder="e.g. dental clinics"
                value={f.targetIndustry} onChange={e => setF(p=>({...p,targetIndustry:e.target.value}))} />
            </div>
            <div>
              <label className="input-label">Location</label>
              <input className="input" placeholder="e.g. New York, NY"
                value={f.targetLocation} onChange={e => setF(p=>({...p,targetLocation:e.target.value}))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <><div className="spinner" />Creating...</> : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    campaignsAPI.list()
      .then(r => setCampaigns(r.data.campaigns))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false))
  }, [])

  const del = async (id, e) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Delete this campaign?')) return
    await campaignsAPI.delete(id).catch(() => toast.error('Delete failed'))
    setCampaigns(c => c.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="page">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-sub">Group your leads by offer and let AI write emails automatically.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="camp-grid">{[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:180 }} />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="card empty fade-up">
          <div className="empty-icon"><Target size={28} color="var(--text-3)" /></div>
          <h3>No campaigns yet</h3>
          <p>Create a campaign to organize your leads and give Gemini AI the context it needs to write personalized emails for each prospect.</p>
          <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Create First Campaign</button>
        </div>
      ) : (
        <div className="camp-grid fade-up-2">
          {campaigns.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`} className="camp-card card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div className="camp-icon"><Target size={18} color="var(--cyan)" /></div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span className={`badge ${c.status==='active' ? 'badge-green' : 'badge-gray'}`}>{c.status}</span>
                  <button className="btn btn-ghost btn-icon" style={{ color:'var(--red)', width:28, height:28 }} onClick={e=>del(c.id,e)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <h3 className="camp-name">{c.name}</h3>
              {c.target_industry && <p className="camp-meta">{c.target_industry}{c.target_location ? ` · ${c.target_location}` : ''}</p>}
              {c.offer_description && <p className="camp-offer">{c.offer_description.slice(0,110)}{c.offer_description.length>110?'...':''}</p>}
              <div className="camp-stats">
                <span><Users size={12} /> {c.leads_count||0} leads</span>
                <span><TrendingUp size={12} /> {c.contacted_count||0} contacted</span>
                <ChevronRight size={14} style={{ marginLeft:'auto', color:'var(--text-3)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {modal && <NewModal onClose={() => setModal(false)} onCreate={c => setCampaigns(p=>[c,...p])} />}
    </div>
  )
}
