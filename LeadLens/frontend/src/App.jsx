import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Campaigns from './pages/Campaigns.jsx'
import CampaignDetail from './pages/CampaignDetail.jsx'
import Leads from './pages/Leads.jsx'
import HeatMap from './pages/HeatMap.jsx'
import Simulator from './pages/Simulator.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
          color: '#1a1a18', fontFamily: 'Inter, sans-serif', fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        },
        success: { iconTheme: { primary: '#1a9e6e', secondary: '#fff' } },
        error: { iconTheme: { primary: '#d63b3b', secondary: '#fff' } }
      }} />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
        <Route path="/campaigns/:id" element={<Layout><CampaignDetail /></Layout>} />
        <Route path="/leads" element={<Layout><Leads /></Layout>} />
        <Route path="/map" element={<Layout><HeatMap /></Layout>} />
        <Route path="/simulator" element={<Layout><Simulator /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
