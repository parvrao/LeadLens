// src/pages/Leads.jsx
import { useEffect, useState, useCallback } from 'react';
import { leadsAPI, campaignsAPI } from '../api/client';
import {
  Search, Download, Brain, Mail, Trash2, MapPin, Phone, Globe, Star,
  RefreshCw, Filter, ChevronDown, Plus, Loader, X, CheckCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Leads.css';

// ── Scrape modal ────────────────────────────────────────────────
function ScrapeModal({ campaigns, onClose, onDone }) {
  const [form, setForm] = useState({ query: '', location: '', campaignId: '', maxResults: 20 });
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const startScrape = async (e) => {
    e.preventDefault();
    try {
      const res = await leadsAPI.scrape(form);
      setJobId(res.data.jobId);
      setPolling(true);
      toast.success('Scrape started! Monitoring progress...');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start scrape');
    }
  };

  useEffect(() => {
    if (!polling || !jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await leadsAPI.jobStatus(jobId);
        const job = res.data.job;
        setJobStatus(job);
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          if (job.status === 'completed') {
            toast.success(`Scraped ${job.results_count} leads!`);
            onDone();
            onClose();
          } else {
            toast.error('Scrape failed: ' + (job.error || 'Unknown error'));
          }
        }
      } catch { clearInterval(interval); setPolling(false); }
    }, 2500);
    return () => clearInterval(interval);
  }, [polling, jobId]);

  return (
    <div className="modal-overlay" onClick={!polling ? onClose : undefined}>
      <div className="modal-card glass-card animate-fade-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="modal-title">Scrape New Leads</h2>
          {!polling && <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>}
        </div>

        {!jobId ? (
          <form onSubmit={startScrape} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">Business Category *</label>
              <input className="input" required placeholder="e.g. dental clinics, restaurants, law firms"
                value={form.query} onChange={e => setForm(f => ({ ...f, query: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Location *</label>
              <input className="input" required placeholder="e.g. Austin, TX or London, UK"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="input-label">Assign to Campaign</label>
                <select className="input" value={form.campaignId} onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))}>
                  <option value="">None</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Max Results (50 max)</label>
                <input className="input" type="number" min={1} max={50}
                  value={form.maxResults} onChange={e => setForm(f => ({ ...f, maxResults: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div style={{ padding: 12, background: 'var(--aurora-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <p style={{ fontSize: 12, color: 'var(--aurora)', lineHeight: 1.5 }}>
                Prospera uses Google Places API to extract real business data. Set your API key in the backend .env file to get live results. Without it, demo data is returned for testing.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Search size={15} /> Start Scrape
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {polling ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>Prospecting in Progress</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  {jobStatus?.status === 'running' ? `Found ${jobStatus?.results_count || 0} leads so far...` : 'Starting up...'}
                </p>
                {jobStatus?.total > 0 && (
                  <div className="score-bar" style={{ height: 6, maxWidth: 300, margin: '0 auto' }}>
                    <div className="score-fill" style={{ width: `${Math.round((jobStatus.progress / jobStatus.total) * 100)}%`, background: 'var(--aurora)' }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <CheckCircle size={48} color="var(--jade)" style={{ marginBottom: 12 }} />
                <h3 style={{ color: 'var(--jade)' }}>Scrape Complete</h3>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lead row ─────────────────────────────────────────────────────
function LeadRow({ lead, onEnrich, onDelete, onStatusChange }) {
  const [enriching, setEnriching] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleEnrich = async (e) => {
    e.stopPropagation();
    setEnriching(true);
    try {
      const res = await leadsAPI.enrich(lead.id);
      toast.success('AI analysis complete!');
      onEnrich(res.data.lead);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  const scoreColor = (s) => s >= 70 ? 'var(--crimson)' : s >= 50 ? 'var(--amber)' : 'var(--jade)';
  const statusMap = { new: 'badge-aurora', contacted: 'badge-violet', replied: 'badge-jade', converted: 'badge-amber', disqualified: 'badge-crimson' };

  const painPoints = lead.pain_points ? JSON.parse(lead.pain_points) : [];

  return (
    <>
      <tr className={`lead-row ${expanded ? 'lead-row--expanded' : ''}`} onClick={() => setExpanded(e => !e)}>
        <td>
          <div className="lead-name">{lead.business_name}</div>
          <div className="lead-meta">{lead.city}{lead.city && lead.category ? ' · ' : ''}{lead.category}</div>
        </td>
        <td>
          <div className="lead-contact">
            {lead.phone && <span className="lead-contact-item"><Phone size={11} />{lead.phone}</span>}
            {lead.email && <span className="lead-contact-item" style={{ color: 'var(--jade)' }}><Mail size={11} />{lead.email}</span>}
            {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="lead-contact-item" onClick={e => e.stopPropagation()}><Globe size={11} />Website</a>}
          </div>
        </td>
        <td>
          {lead.google_rating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <Star size={12} fill="var(--amber)" color="var(--amber)" />
              {lead.google_rating} ({lead.review_count})
            </span>
          )}
        </td>
        <td>
          {lead.score > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="score-bar" style={{ width: 50 }}>
                <div className="score-fill" style={{ width: `${lead.score}%`, background: scoreColor(lead.score) }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: scoreColor(lead.score) }}>{lead.score}</span>
            </div>
          )}
        </td>
        <td>
          <select
            className="status-select"
            value={lead.status}
            onClick={e => e.stopPropagation()}
            onChange={e => onStatusChange(lead.id, e.target.value)}
          >
            {['new', 'contacted', 'replied', 'converted', 'disqualified'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </td>
        <td>
          <div style={{ display: 'flex', gap: 6 }}>
            {!lead.enriched_at && (
              <button className="btn btn-secondary btn-sm" onClick={handleEnrich} disabled={enriching}
                data-tooltip="AI Enrich">
                {enriching ? <Loader size={13} className="spin-icon" /> : <Brain size={13} />}
              </button>
            )}
            {lead.enriched_at && (
              <button className="btn btn-secondary btn-sm" onClick={handleEnrich} disabled={enriching}
                data-tooltip="Re-enrich">
                {enriching ? <Loader size={13} className="spin-icon" /> : <RefreshCw size={13} />}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)' }}
              onClick={e => { e.stopPropagation(); onDelete(lead.id); }} data-tooltip="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded row with AI analysis + email */}
      {expanded && (
        <tr className="lead-detail-row">
          <td colSpan={6}>
            <div className="lead-detail">
              {lead.ai_summary && (
                <div className="lead-detail-section">
                  <div className="lead-detail-label"><Brain size={13} /> AI Business Intelligence</div>
                  <p>{lead.ai_summary}</p>
                  {painPoints.length > 0 && (
                    <div className="pain-points">
                      {painPoints.map((p, i) => (
                        <span key={i} className="badge badge-crimson" style={{ fontWeight: 400, letterSpacing: 0 }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {lead.personalized_email && (
                <div className="lead-detail-section">
                  <div className="lead-detail-label"><Mail size={13} /> AI Personalized Email</div>
                  {lead.email_subject && <div className="email-subject">Subject: {lead.email_subject}</div>}
                  <pre className="email-body">{lead.personalized_email}</pre>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
                    onClick={() => { navigator.clipboard.writeText(`Subject: ${lead.email_subject}\n\n${lead.personalized_email}`); toast.success('Email copied!'); }}>
                    Copy Email
                  </button>
                </div>
              )}
              {!lead.enriched_at && (
                <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Click the Brain icon to run AI enrichment on this lead.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [showScrape, setShowScrape] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', campaignId: '' });
  const [page, setPage] = useState(1);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsAPI.list({ ...filters, page, limit: 50 });
      setLeads(res.data.leads);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { campaignsAPI.list().then(r => setCampaigns(r.data.campaigns)).catch(() => {}); }, []);

  const handleExport = async () => {
    try {
      const res = await leadsAPI.exportCSV({ campaignId: filters.campaignId });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'prospera_leads.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await leadsAPI.delete(id);
      setLeads(l => l.filter(x => x.id !== id));
      toast.success('Lead deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await leadsAPI.update(id, { status });
      setLeads(l => l.map(x => x.id === id ? { ...x, status } : x));
    } catch { toast.error('Status update failed'); }
  };

  const handleEnrich = (updated) => {
    setLeads(l => l.map(x => x.id === updated.id ? updated : x));
  };

  return (
    <div className="z-content leads-page">
      {/* Header */}
      <div className="page-header animate-fade-up">
        <div>
          <h1 className="page-title">Lead Intelligence</h1>
          <p className="page-sub">{total.toLocaleString()} leads in your database</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={15} /> Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowScrape(true)}><Plus size={15} /> Scrape Leads</button>
        </div>
      </div>

      {/* Filters */}
      <div className="leads-filters animate-fade-up-2">
        <div className="input-wrap" style={{ flex: 2, minWidth: 200 }}>
          <Search size={15} className="input-icon" />
          <input className="input input--icon" placeholder="Search business name, city, category..."
            value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
        </div>
        <select className="input" style={{ flex: 1, minWidth: 140 }}
          value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Statuses</option>
          {['new', 'contacted', 'replied', 'converted', 'disqualified'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" style={{ flex: 1, minWidth: 160 }}
          value={filters.campaignId} onChange={e => { setFilters(f => ({ ...f, campaignId: e.target.value })); setPage(1); }}>
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filters.search || filters.status || filters.campaignId) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ search: '', status: '', campaignId: '' }); setPage(1); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : leads.length === 0 ? (
        <div className="empty-state glass-card">
          <Search size={48} color="var(--text-muted)" />
          <h3>No leads found</h3>
          <p>Try adjusting your filters, or scrape new leads to populate your database.</p>
          <button className="btn btn-primary" onClick={() => setShowScrape(true)}>
            <Plus size={16} /> Scrape New Leads
          </button>
        </div>
      ) : (
        <div className="leads-table-wrap glass-card animate-fade-up-3">
          <table className="leads-table">
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
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onEnrich={handleEnrich}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showScrape && <ScrapeModal campaigns={campaigns} onClose={() => setShowScrape(false)} onDone={fetchLeads} />}
    </div>
  );
}
