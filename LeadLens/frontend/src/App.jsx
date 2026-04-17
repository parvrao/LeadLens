import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Campaigns from './pages/Campaigns.jsx'
import CampaignDetail from './pages/CampaignDetail.jsx'
import Leads from './pages/Leads.jsx'
import HeatMap from './pages/HeatMap.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px'
        },
        success: { iconTheme: { primary: '#00e5a0', secondary: '#000' } },
        error: { iconTheme: { primary: '#ff4d6d', secondary: '#000' } }
      }} />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
        <Route path="/campaigns/:id" element={<Layout><CampaignDetail /></Layout>} />
        <Route path="/leads" element={<Layout><Leads /></Layout>} />
        <Route path="/map" element={<Layout><HeatMap /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
