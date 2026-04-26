/**
 * API Configuration
 * Points to Next.js backend on Vercel
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  (isDevelopment
    ? 'http://localhost:3000/api'  // Local dev: Next.js backend
    : 'https://promptoria.me/api')

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
  },
  devices: {
    register: `${API_BASE_URL}/devices/register`,
  },
  user: {
    profile: `${API_BASE_URL}/user/profile`,
    settings: `${API_BASE_URL}/user/settings`,
  },
  settings: {
    apiKeys: {
      get: `${API_BASE_URL}/settings/api-keys`,
      set: `${API_BASE_URL}/settings/api-keys`,
      delete: `${API_BASE_URL}/settings/api-keys`,
    },
  },
  favorites: {
    list: `${API_BASE_URL}/favorites`,
  },
  prompts: {
    list: `${API_BASE_URL}/prompts`,
    create: `${API_BASE_URL}/prompts`,
    detail: (id: string) => `${API_BASE_URL}/prompts/${id}`,
    get: (id: string) => `${API_BASE_URL}/prompts/${id}`,
    update: (id: string) => `${API_BASE_URL}/prompts/${id}`,
    delete: (id: string) => `${API_BASE_URL}/prompts/${id}`,
    clone: (id: string) => `${API_BASE_URL}/prompts/${id}/clone`,
    favorite: (id: string) => `${API_BASE_URL}/prompts/${id}/favorite`,
    rollback: (id: string) => `${API_BASE_URL}/prompts/${id}/rollback`,
    suggestions: (id: string) => `${API_BASE_URL}/prompts/${id}/suggestions`,
    validate: `${API_BASE_URL}/prompts/validate`,
    executeBatch: `${API_BASE_URL}/prompts/execute-batch`,
    versions: {
      compare: (id: string, v1: number, v2: number) => `${API_BASE_URL}/prompts/${id}/versions/compare?v1=${v1}&v2=${v2}`,
    },
    compositions: {
      list: (id: string) => `${API_BASE_URL}/prompts/${id}/compositions`,
      add: (id: string) => `${API_BASE_URL}/prompts/${id}/compositions`,
      reorder: (id: string) => `${API_BASE_URL}/prompts/${id}/compositions`,
      remove: (id: string, snippetId: string) => `${API_BASE_URL}/prompts/${id}/compositions/${snippetId}`,
    },
  },
  snippets: {
    list: `${API_BASE_URL}/snippets`,
    create: `${API_BASE_URL}/snippets`,
    get: (id: string) => `${API_BASE_URL}/snippets/${id}`,
    update: (id: string) => `${API_BASE_URL}/snippets/${id}`,
    delete: (id: string) => `${API_BASE_URL}/snippets/${id}`,
    compare: `${API_BASE_URL}/snippets/compare`,
  },
  categories: {
    list: `${API_BASE_URL}/categories`,
    create: `${API_BASE_URL}/categories`,
    get: (id: string) => `${API_BASE_URL}/categories/${id}`,
    update: (id: string) => `${API_BASE_URL}/categories/${id}`,
    delete: (id: string) => `${API_BASE_URL}/categories/${id}`,
    interactions: {
      list: `${API_BASE_URL}/categories/interactions`,
      create: `${API_BASE_URL}/categories/interactions`,
      get: (id: string) => `${API_BASE_URL}/categories/interactions/${id}`,
      update: (id: string) => `${API_BASE_URL}/categories/interactions/${id}`,
      delete: (id: string) => `${API_BASE_URL}/categories/interactions/${id}`,
    },
  },
  testRuns: {
    list: `${API_BASE_URL}/test-runs`,
    create: `${API_BASE_URL}/test-runs`,
    get: (id: string) => `${API_BASE_URL}/test-runs/${id}`,
    delete: (id: string) => `${API_BASE_URL}/test-runs/${id}`,
    execute: (id: string) => `${API_BASE_URL}/test-runs/${id}/execute`,
  },
  execute: {
    run: `${API_BASE_URL}/test-runs`,
    history: (promptVersionId: string) => `${API_BASE_URL}/test-runs?prompt_version_id=${promptVersionId}`,
  },
  dashboard: {
    stats: `${API_BASE_URL}/dashboard/stats`,
  },
  analytics: {
    usage: `${API_BASE_URL}/analytics/usage`,
  },
  stats: {
    comprehensive: `${API_BASE_URL}/stats/comprehensive`,
  },
  activity: `${API_BASE_URL}/activity`,
  search: `${API_BASE_URL}/search`,
  export: `${API_BASE_URL}/export`,
  import: `${API_BASE_URL}/import`,
  batch: {
    operations: `${API_BASE_URL}/batch/operations`,
  },
  sync: {
    changes: `${API_BASE_URL}/sync`,
    logs: `${API_BASE_URL}/sync-logs`,
  },
  health: `${API_BASE_URL}/health`,
  templates: `${API_BASE_URL}/templates`,
  quotas: {
    usage: `${API_BASE_URL}/quota`,
  },
  notes: {
    list: `${API_BASE_URL}/notes`,
    create: `${API_BASE_URL}/notes`,
  },
  modelPresets: {
    list: `${API_BASE_URL}/model-presets`,
    create: `${API_BASE_URL}/model-presets`,
  },
  maintenance: {
    cleanup: `${API_BASE_URL}/maintenance/cleanup`,
  },
  docs: {
    endpoints: `${API_BASE_URL}/docs/endpoints`,
  },
  models: `${API_BASE_URL}/models`,
  admin: {
    stats: `${API_BASE_URL}/admin/stats`,
    models: `${API_BASE_URL}/admin/models`,
    model: (id: string) => `${API_BASE_URL}/admin/models/${id}`,
    availableModels: `${API_BASE_URL}/admin/available-models`,
  },
}
