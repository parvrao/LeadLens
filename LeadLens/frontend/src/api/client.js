import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export const campaignsAPI = {
  list: () => client.get('/campaigns'),
  create: (data) => client.post('/campaigns', data),
  get: (id) => client.get(`/campaigns/${id}`),
  update: (id, data) => client.put(`/campaigns/${id}`, data),
  delete: (id) => client.delete(`/campaigns/${id}`)
};

export const leadsAPI = {
  list: (params) => client.get('/leads', { params }),
  scrape: (data) => client.post('/leads/scrape', data),
  jobStatus: (jobId) => client.get(`/leads/job/${jobId}`),
  enrich: (id) => client.post(`/leads/${id}/enrich`),
  batchEmail: (data) => client.post('/leads/batch-email', data),
  update: (id, data) => client.put(`/leads/${id}`, data),
  delete: (id) => client.delete(`/leads/${id}`),
  exportCSV: (params) => client.get('/leads/export/csv', { params, responseType: 'blob' })
};

export const aiAPI = {
  analyze: (data) => client.post('/ai/analyze', data),
  generateEmail: (data) => client.post('/ai/email', data),
  stats: () => client.get('/ai/stats')
};

export default client;
