import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

const http = axios.create({ baseURL: API, timeout: 30000 })

export const campaignsAPI = {
  list: () => http.get('/campaigns'),
  create: (d) => http.post('/campaigns', d),
  get: (id) => http.get(`/campaigns/${id}`),
  update: (id, d) => http.put(`/campaigns/${id}`, d),
  delete: (id) => http.delete(`/campaigns/${id}`)
}

export const leadsAPI = {
  list: (p) => http.get('/leads', { params: p }),
  scrape: (d) => http.post('/leads/scrape', d),
  job: (id) => http.get(`/leads/job/${id}`),
  enrich: (id) => http.post(`/leads/${id}/enrich`),
  update: (id, d) => http.put(`/leads/${id}`, d),
  delete: (id) => http.delete(`/leads/${id}`),
  exportCSV: (p) => http.get('/leads/export/csv', { params: p, responseType: 'blob' })
}

export const aiAPI = {
  stats: () => http.get('/ai/stats'),
  email: (d) => http.post('/ai/email', d)
}
