// src/pages/Campaigns.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsAPI } from '../api/client';
import { Plus, Target, ChevronRight, Trash2, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './Campaigns.css';

function NewCampaignModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', offerDescription: '', targetIndustry: '', targetLocation: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await campaignsAPI.create(form);
      toast.success('Campaign created!');
      onCreate(res.data.campaign);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-card animate-fade-up" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New Campaign</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          A campaign groups your leads and gives Gemini AI context to write personalized outreach.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Campaign Name *</label>
            <input className="input" required placeholder="e.g. NYC Restaurants Q1"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Your Offer (AI uses this to write emails) *</label>
            <textarea className="input" required rows={3}
              placeholder="e.g. We help restaurants automate their reservation system, reducing no-shows by 40%."
              value={form.offerDescription} onChange={e => setForm(f => ({ ...f, offerDescription: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 80 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Target Industry</label>
              <input className="input" placeholder="e.g. restaurants"
                value={form.targetIndustry} onChange={e => setForm(f => ({ ...f, targetIndustry: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Target Location</label>
              <input className="input" placeholder="e.g. New York, NY"
                value={form.targetLocation} onChange={e => setForm(f => ({ ...f, targetLocation: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="input-label">Notes (optional)</label>
            <input className="input" placeholder="Any additional context..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <><div className="spinner" />Creating...</> : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    campaignsAPI.list()
      .then(res => setCampaigns(res.data.campaigns))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this campaign and all its leads?')) return;
    try {
      await campaignsAPI.delete(id);
      setCampaigns(c => c.filter(x => x.id !== id));
      toast.success('Campaign deleted');
    } catch { toast.error('Delete failed'); }
  };

  const statusColor = (s) => s === 'active' ? 'badge-jade' : s === 'paused' ? 'badge-amber' : 'badge-crimson';

  return (
    <div className="z-content">
      <div className="page-header animate-fade-up">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-sub">Organize your prospecting by offer, industry, or territory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="grid-auto" style={{ marginTop: 24 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="loading-shimmer" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state glass-card animate-fade-up">
          <Target size={48} color="var(--text-muted)" />
          <h3>No campaigns yet</h3>
          <p>Create your first campaign to start prospecting. Give AI context about your offer and it will personalize every email.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid-auto animate-fade-up-2" style={{ marginTop: 24 }}>
          {campaigns.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`} className="campaign-card glass-card">
              <div className="campaign-card__header">
                <div className="campaign-card__icon">
                  <Target size={18} color="var(--aurora)" />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${statusColor(c.status)}`}>{c.status}</span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', color: 'var(--crimson)' }}
                    onClick={(e) => handleDelete(c.id, e)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <h3 className="campaign-card__name">{c.name}</h3>
              {c.target_industry && <p className="campaign-card__industry">{c.target_industry} · {c.target_location}</p>}
              {c.offer_description && (
                <p className="campaign-card__offer">{c.offer_description.slice(0, 100)}{c.offer_description.length > 100 ? '...' : ''}</p>
              )}

              <div className="campaign-card__stats">
                <div className="campaign-card__stat">
                  <Users size={12} />
                  <span>{c.leads_count || 0} leads</span>
                </div>
                <div className="campaign-card__stat">
                  <TrendingUp size={12} />
                  <span>{c.contacted_count || 0} contacted</span>
                </div>
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} onCreate={c => setCampaigns(p => [c, ...p])} />}
    </div>
  );
}
