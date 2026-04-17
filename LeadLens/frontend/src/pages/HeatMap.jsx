import { useEffect, useState, useRef } from 'react'
import { leadsAPI, campaignsAPI } from '../api/client.js'
import { MapPin, Layers, Filter, RefreshCw, Info, Star, Users, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import './HeatMap.css'

/* ─────────────────────────────────────────────
   We load Leaflet + leaflet-heat via CDN at runtime
   so no extra npm install is needed.
───────────────────────────────────────────── */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

function loadLink(href) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'; l.href = href
  document.head.appendChild(l)
}

/* Score → heat intensity */
function scoreToIntensity(score) {
  return Math.max(0.1, Math.min(1.0, (score || 40) / 100))
}

/* Marker color by status */
function statusColor(status) {
  const map = {
    new: '#00d4ff',
    contacted: '#a78bfa',
    replied: '#00e5a0',
    converted: '#fbbf24',
    disqualified: '#ff4d6d'
  }
  return map[status] || '#00d4ff'
}

export default function HeatMap() {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const heatLayer = useRef(null)
  const markersLayer = useRef(null)

  const [leads, setLeads] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [mode, setMode] = useState('heat') // 'heat' | 'markers'
  const [filterCampaign, setFilterCampaign] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [stats, setStats] = useState({ total: 0, withCoords: 0, avgScore: 0 })

  /* ── Load data ───────────────────── */
  useEffect(() => {
    Promise.all([
      leadsAPI.list({ limit: 500 }),
      campaignsAPI.list()
    ]).then(([lr, cr]) => {
      setLeads(lr.data.leads)
      setCampaigns(cr.data.campaigns)
    }).catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false))
  }, [])

  /* ── Initialize map ──────────────── */
  useEffect(() => {
    if (loading || mapReady) return

    async function init() {
      try {
        loadLink('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
        await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
        await loadScript('https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js')

        if (!mapRef.current || leafletMap.current) return

        const L = window.L
        const map = L.map(mapRef.current, {
          center: [39.5, -98.35],
          zoom: 4,
          zoomControl: true,
          attributionControl: true
        })

        // Dark tile layer — looks sharp and professional
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map)

        leafletMap.current = map
        heatLayer.current = null
        markersLayer.current = L.layerGroup().addTo(map)
        setMapReady(true)
      } catch (err) {
        toast.error('Map failed to load: ' + err.message)
      }
    }

    init()
  }, [loading])

  /* ── Filter leads ─────────────────── */
  const filtered = leads.filter(l => {
    if (!l.lat || !l.lng) return false
    if (filterCampaign && l.campaign_id !== filterCampaign) return false
    if (filterStatus && l.status !== filterStatus) return false
    return true
  })

  /* ── Update stats ─────────────────── */
  useEffect(() => {
    const withCoords = leads.filter(l => l.lat && l.lng).length
    const avgScore = leads.length > 0
      ? Math.round(leads.filter(l => l.score > 0).reduce((a, b) => a + b.score, 0) / Math.max(1, leads.filter(l => l.score > 0).length))
      : 0
    setStats({ total: leads.length, withCoords, avgScore })
  }, [leads])

  /* ── Draw map layers ──────────────── */
  useEffect(() => {
    if (!mapReady || !leafletMap.current) return
    const L = window.L
    const map = leafletMap.current

    // Clear existing
    if (heatLayer.current) { map.removeLayer(heatLayer.current); heatLayer.current = null }
    markersLayer.current.clearLayers()

    if (filtered.length === 0) return

    if (mode === 'heat') {
      // Build heatmap points [lat, lng, intensity]
      const points = filtered.map(l => [
        l.lat, l.lng, scoreToIntensity(l.score)
      ])

      heatLayer.current = L.heatLayer(points, {
        radius: 35,
        blur: 20,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.0: '#93c5fd',
          0.3: '#8b5cf6',
          0.6: '#f59e0b',
          0.8: '#ef4444',
          1.0: '#dc2626'
        }
      }).addTo(map)

    } else {
      // Markers mode — one pin per lead
      filtered.forEach(lead => {
        const color = statusColor(lead.status)
        const score = lead.score || 0

        const icon = L.divIcon({
          html: `
            <div style="
              width:${score >= 70 ? 16 : 12}px;
              height:${score >= 70 ? 16 : 12}px;
              background:${color};
              border-radius:50%;
              border:2px solid rgba(255,255,255,0.6);
              box-shadow:0 0 ${score >= 70 ? 10 : 6}px ${color};
              cursor:pointer;
            "></div>
          `,
          className: '',
          iconSize: [score >= 70 ? 16 : 12, score >= 70 ? 16 : 12],
          iconAnchor: [score >= 70 ? 8 : 6, score >= 70 ? 8 : 6]
        })

        const marker = L.marker([lead.lat, lead.lng], { icon })
        marker.on('click', () => setSelectedLead(lead))
        marker.bindTooltip(`
          <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5">
            <strong>${lead.business_name}</strong><br/>
            ${lead.city || ''} ${lead.state || ''}<br/>
            Score: <strong style="color:${color}">${lead.score || 'N/A'}</strong>
          </div>
        `, { sticky: true, className: 'lead-tooltip' })
        markersLayer.current.addLayer(marker)
      })
    }

    // Auto-fit bounds to visible leads
    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(l => [l.lat, l.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }, [mapReady, filtered, mode])

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await leadsAPI.list({ limit: 500 })
      setLeads(res.data.leads)
      toast.success('Leads refreshed')
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="heatmap-page page">
      {/* Header */}
      <div className="page-header fade-up">
        <div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontStyle:'italic', marginBottom:3 }}>Territory Heat Map</h1>
          <p className="page-sub">Visualize lead density and opportunity scores across geographies.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refresh}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="hm-stats fade-up-2">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'var(--cyan)' },
          { label: 'Mapped Leads', value: stats.withCoords, icon: MapPin, color: 'var(--green)' },
          { label: 'Avg AI Score', value: stats.avgScore ? `${stats.avgScore}/100` : 'N/A', icon: Brain, color: 'var(--orange)' },
          { label: 'Showing', value: filtered.length, icon: Layers, color: 'var(--purple)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="hm-stat-card card">
            <div className="hm-stat-icon" style={{ background: `${color}18` }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div className="hm-stat-value" style={{ color }}>{value}</div>
              <div className="hm-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="hm-controls fade-up-2">
        {/* Mode toggle */}
        <div className="hm-toggle">
          <button className={`hm-toggle-btn ${mode === 'heat' ? 'active' : ''}`} onClick={() => setMode('heat')}>
            <Layers size={14} /> Heat Map
          </button>
          <button className={`hm-toggle-btn ${mode === 'markers' ? 'active' : ''}`} onClick={() => setMode('markers')}>
            <MapPin size={14} /> Pin Map
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <select className="input" style={{ minWidth: 160 }}
            value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
            <option value="">All Campaigns</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" style={{ minWidth: 140 }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['new', 'contacted', 'replied', 'converted', 'disqualified'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        {mode === 'heat' ? (
          <div className="hm-legend">
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Score:</span>
            {[
              { color: '#00d4ff', label: 'Low' },
              { color: '#7c3aed', label: 'Mid' },
              { color: '#f59e0b', label: 'High' },
              { color: '#ef4444', label: 'Hot' },
            ].map(({ color, label }) => (
              <div key={label} className="hm-legend-item">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="hm-legend">
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Status:</span>
            {[
              { color: '#00d4ff', label: 'New' },
              { color: '#a78bfa', label: 'Contacted' },
              { color: '#00e5a0', label: 'Replied' },
              { color: '#fbbf24', label: 'Converted' },
            ].map(({ color, label }) => (
              <div key={label} className="hm-legend-item">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="hm-map-wrap fade-up-3">
        {loading && (
          <div className="hm-map-loading">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Loading map data...</p>
          </div>
        )}

        {!loading && stats.withCoords === 0 && (
          <div className="hm-map-empty">
            <MapPin size={48} color="var(--text-3)" />
            <h3>No mapped leads yet</h3>
            <p>Scrape leads with a Google Places API key to get real coordinates. Leads need lat/lng data to appear on the map.</p>
            <div className="hm-info-box">
              <Info size={14} color="var(--cyan)" />
              <span>Demo data includes approximate coordinates. Real coordinates come from the Google Places API.</span>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className="hm-map"
          style={{ opacity: loading || stats.withCoords === 0 ? 0 : 1 }}
        />
      </div>

      {/* Lead detail drawer */}
      {selectedLead && (
        <div className="hm-drawer card fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selectedLead.business_name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{selectedLead.address}, {selectedLead.city} {selectedLead.state}</p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => setSelectedLead(null)}>✕</button>
          </div>

          <div className="hm-drawer-grid">
            {[
              { label: 'Category', value: selectedLead.category },
              { label: 'Phone', value: selectedLead.phone },
              { label: 'Email', value: selectedLead.email },
              { label: 'Rating', value: selectedLead.google_rating ? `${selectedLead.google_rating} ★ (${selectedLead.review_count} reviews)` : null },
              { label: 'AI Score', value: selectedLead.score ? `${selectedLead.score}/100` : null },
              { label: 'Status', value: selectedLead.status },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="hm-drawer-row">
                <span className="hm-drawer-label">{label}</span>
                <span className="hm-drawer-value">{value}</span>
              </div>
            ))}
          </div>

          {selectedLead.ai_summary && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                AI Summary
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{selectedLead.ai_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
