import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const evaluateHedge = (amount, originalIntention) =>
  api.post('/hedge/evaluate', { amount, originalIntention })

export const decideHedge = (eventId, decision) =>
  api.post('/hedge/decide', { eventId, decision })

export const getPortfolioState = () => api.get('/portfolio/state')

export const getHedgeEvents = () => api.get('/hedge/events')

export const getAlternatives = () => api.get('/hedge/alternatives')

export const useAlternative = (title) => api.post('/hedge/alternatives/use', null, { params: { title } })

export const getAlternativeRanking = () => api.get('/hedge/alternatives/ranking')

export default api
