// src/pages/CampaignDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { campaignsAPI, leadsAPI } from '../api/client';
import { ArrowLeft, Users, Brain, Mail, TrendingUp, Download, Search, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import './Campaigns.css';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrichingAll, setEnrichingAll] = useState(false);

  const fetchAll = async () => {
    try {
      const [campRes, leadsRes] = await Promise.all([
        campaignsAPI.get(id),
        leadsAPI.list({ campaignId: id, limit: 100 })
      ]);
      setCampaign(campRes.data.campaign);
      setStats(campRes.data.stats);
      setLeads(leadsRes.data.leads);
    } catch { toast.error('Failed to load campaign'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleEnrichAll = async () => {
    const unenriched = leads.filter(l => !l.enriched_at);
    if (!unenriched.length) { toast('All leads are already enriched!'); return; }
    setEnrichingAll(true);
    toast(`Enriching ${unenriched.length} leads with Gemini AI. This may take a moment...`);
    let done = 0;
    for (const lead of unenriched) {
      try {
        await leadsAPI.enrich(lead.id);
        done++;
      } catch { /* continue */ }
    }
    toast.success(`Enriched ${done} leads!`);
    fetchAll();
    setEnrichingAll(false);
  };

  const handleExport = async () => {
    try {
      const res = await leadsAPI.exportCSV({ campaignId: id });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${campaign.name}_leads.csv`; a.click();
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="z-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <Link to="/campaigns" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, width: 'fit-content' }}
        className="animate-fade-up">
        <ArrowLeft size={14} /> Campaigns
      </Link>

      {/* Header */}
      <div className="page-header animate-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{campaign.name}</h1>
            <span className="badge badge-jade">{campaign.status}</span>
          </div>
          {campaign.target_industry && (
            <p style={{ fontSize: 12, color: 'var(--aurora)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {campaign.target_industry} · {campaign.target_location}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={14} /> Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={handleEnrichAll} disabled={enrichingAll}>
            {enrichingAll ? <><div className="spinner" />Enriching...</> : <><Brain size={14} /> Enrich All with AI</>}
          </button>
          <Link to="/leads" state={{ campaignId: id }} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Leads
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard__kpi-grid animate-fade-up-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {[
          { label: 'Total Leads', value: stats?.total || 0, color: 'var(--aurora)' },
          { label: 'New', value: stats?.new_leads || 0, color: 'var(--aurora)' },
          { label: 'Contacted', value: stats?.contacted || 0, color: 'var(--violet)' },
          { label: 'Replied', value: stats?.replied || 0, color: 'var(--jade)' },
          { label: 'Converted', value: stats?.converted || 0, color: 'var(--amber)' },
          { label: 'Avg AI Score', value: stats?.avg_score ? Math.round(stats.avg_score) : 0, color: 'var(--crimson)', suffix: '/100' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color, marginBottom: 4 }}>{value}{suffix || ''}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Offer card */}
      {campaign.offer_description && (
        <div className="glass-card animate-fade-up-3" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--aurora)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Campaign Offer (used by Gemini AI for email personalization)
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{campaign.offer_description}</p>
        </div>
      )}

      {/* Leads mini-table */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
          Leads in this Campaign
        </h3>
        {leads.length === 0 ? (
          <div className="empty-state glass-card">
            <Users size={40} color="var(--text-muted)" />
            <h3>No leads yet</h3>
            <p>Scrape leads from the Lead Intelligence page and assign them to this campaign.</p>
            <Link to="/leads" className="btn btn-primary btn-sm"><Search size={14} /> Find Leads</Link>
          </div>
        ) : (
          <div className="leads-table-wrap glass-card">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Rating</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th>Email Ready</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="lead-row" style={{ cursor: 'default' }}>
                    <td>
                      <div className="lead-name">{lead.business_name}</div>
                      <div className="lead-meta">{lead.city}</div>
                    </td>
                    <td>
                      <div className="lead-contact">
                        {lead.email && <span className="lead-contact-item" style={{ color: 'var(--jade)' }}><Mail size={11} />{lead.email}</span>}
                        {!lead.email && lead.phone && <span className="lead-contact-item"><span>📞</span>{lead.phone}</span>}
                      </div>
                    </td>
                    <td>
                      {lead.google_rating && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <Star size={12} fill="var(--amber)" color="var(--amber)" />{lead.google_rating}
                      </span>}
                    </td>
                    <td>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: lead.score >= 70 ? 'var(--crimson)' : lead.score >= 50 ? 'var(--amber)' : 'var(--jade)' }}>
                        {lead.score > 0 ? lead.score : '—'}
                      </span>
                    </td>
                    <td><span className="badge" style={{ background: 'var(--glass-2)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', textTransform: 'capitalize' }}>{lead.status}</span></td>
                    <td>
                      {lead.personalized_email
                        ? <span className="badge badge-jade">Ready</span>
                        : lead.enriched_at
                        ? <span className="badge badge-amber">No Offer Match</span>
                        : <span className="badge" style={{ background: 'var(--glass-2)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>Not Enriched</span>
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
  );
}
