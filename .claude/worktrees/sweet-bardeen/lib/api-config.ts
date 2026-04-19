/**
 * API Configuration
 * Points to Python FastAPI backend
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3100'  // Local development
  : (process.env.NEXT_PUBLIC_API_URL || '') // Production (set via environment variable)

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    signup: `${API_BASE_URL}/api/auth/signup`,
    logout: `${API_BASE_URL}/api/auth/logout`,
  },
  prompts: {
    list: `${API_BASE_URL}/api/prompts`,
    get: (id: string) => `${API_BASE_URL}/api/prompts/${id}`,
    detail: (id: string) => `${API_BASE_URL}/api/prompts/${id}`,
    create: `${API_BASE_URL}/api/prompts`,
    update: (id: string) => `${API_BASE_URL}/api/prompts/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/prompts/${id}`,
  },
  snippets: {
    list: `${API_BASE_URL}/api/snippets`,
    get: (id: string) => `${API_BASE_URL}/api/snippets/${id}`,
    create: `${API_BASE_URL}/api/snippets`,
    update: (id: string) => `${API_BASE_URL}/api/snippets/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/snippets/${id}`,
  },
  dashboard: {
    stats: `${API_BASE_URL}/api/dashboard/stats`,
  },
  settings: {
    get: `${API_BASE_URL}/api/settings`,
    update: `${API_BASE_URL}/api/settings`,
    setApiKey: `${API_BASE_URL}/api/settings/api-key`,
  },
  taxonomy: {
    interactionTypes: `${API_BASE_URL}/api/taxonomy/interaction-types`,
    categories: (typeId: string) => `${API_BASE_URL}/api/taxonomy/categories?typeId=${typeId}`,
  },
  suggestions: `${API_BASE_URL}/api/suggestions`,
  tags: `${API_BASE_URL}/api/suggestions/tags`,
  execute: {
    run: `${API_BASE_URL}/api/execute`,
    history: (promptVersionId: string) => `${API_BASE_URL}/api/execute/${promptVersionId}`,
  },
  models: `${API_BASE_URL}/api/models`,
}
