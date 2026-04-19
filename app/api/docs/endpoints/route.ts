import { NextRequest, NextResponse } from 'next/server'

const ENDPOINTS = [
  // Auth
  {
    path: '/api/auth/signup',
    method: 'POST',
    description: 'Register new user',
    auth: false,
  },
  {
    path: '/api/auth/login',
    method: 'POST',
    description: 'Login user',
    auth: false,
  },

  // User
  {
    path: '/api/user/profile',
    method: 'GET',
    description: 'Get authenticated user profile',
    auth: true,
  },
  {
    path: '/api/user/settings',
    method: 'GET',
    description: 'Get user settings',
    auth: true,
  },
  {
    path: '/api/user/settings',
    method: 'PUT',
    description: 'Update user settings',
    auth: true,
  },

  // Workspaces
  {
    path: '/api/workspaces',
    method: 'GET',
    description: 'Get workspace details',
    auth: true,
  },
  {
    path: '/api/workspaces',
    method: 'PUT',
    description: 'Update workspace',
    auth: true,
  },

  // Prompts
  {
    path: '/api/prompts',
    method: 'GET',
    description: 'List prompts',
    auth: true,
  },
  {
    path: '/api/prompts',
    method: 'POST',
    description: 'Create prompt',
    auth: true,
  },
  {
    path: '/api/prompts/[id]',
    method: 'GET',
    description: 'Get prompt details',
    auth: true,
  },
  {
    path: '/api/prompts/[id]',
    method: 'PUT',
    description: 'Update prompt',
    auth: true,
  },
  {
    path: '/api/prompts/[id]',
    method: 'DELETE',
    description: 'Delete prompt',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/clone',
    method: 'POST',
    description: 'Clone prompt',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/favorite',
    method: 'POST',
    description: 'Add to favorites',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/favorite',
    method: 'DELETE',
    description: 'Remove from favorites',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/rollback',
    method: 'POST',
    description: 'Rollback to previous version',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/suggestions',
    method: 'GET',
    description: 'Get AI suggestions for improvement',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/versions/compare',
    method: 'GET',
    description: 'Compare two versions',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/compositions',
    method: 'GET',
    description: 'List prompt compositions',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/compositions',
    method: 'POST',
    description: 'Add snippet to composition',
    auth: true,
  },
  {
    path: '/api/prompts/[id]/compositions',
    method: 'PUT',
    description: 'Reorder compositions',
    auth: true,
  },
  {
    path: '/api/prompts/validate',
    method: 'POST',
    description: 'Validate prompt template',
    auth: true,
  },
  {
    path: '/api/prompts/execute-batch',
    method: 'POST',
    description: 'Execute multiple prompts',
    auth: true,
  },

  // Test Runs
  {
    path: '/api/test-runs',
    method: 'GET',
    description: 'List test runs',
    auth: true,
  },
  {
    path: '/api/test-runs',
    method: 'POST',
    description: 'Create test run',
    auth: true,
  },
  {
    path: '/api/test-runs/[id]',
    method: 'GET',
    description: 'Get test run',
    auth: true,
  },
  {
    path: '/api/test-runs/[id]',
    method: 'DELETE',
    description: 'Delete test run',
    auth: true,
  },
  {
    path: '/api/test-runs/[id]/execute',
    method: 'POST',
    description: 'Execute test run',
    auth: true,
  },

  // Snippets
  {
    path: '/api/snippets',
    method: 'GET',
    description: 'List snippets',
    auth: true,
  },
  {
    path: '/api/snippets',
    method: 'POST',
    description: 'Create snippet',
    auth: true,
  },
  {
    path: '/api/snippets/[id]',
    method: 'GET',
    description: 'Get snippet',
    auth: true,
  },
  {
    path: '/api/snippets/[id]',
    method: 'PUT',
    description: 'Update snippet',
    auth: true,
  },
  {
    path: '/api/snippets/[id]',
    method: 'DELETE',
    description: 'Delete snippet',
    auth: true,
  },
  {
    path: '/api/snippets/compare',
    method: 'POST',
    description: 'Compare snippets',
    auth: true,
  },

  // Categories
  {
    path: '/api/categories',
    method: 'GET',
    description: 'List categories',
    auth: true,
  },
  {
    path: '/api/categories',
    method: 'POST',
    description: 'Create category',
    auth: true,
  },
  {
    path: '/api/categories/[id]',
    method: 'GET',
    description: 'Get category',
    auth: true,
  },
  {
    path: '/api/categories/[id]',
    method: 'PUT',
    description: 'Update category',
    auth: true,
  },
  {
    path: '/api/categories/[id]',
    method: 'DELETE',
    description: 'Delete category',
    auth: true,
  },

  // Interactions
  {
    path: '/api/categories/interactions',
    method: 'GET',
    description: 'List interaction types',
    auth: true,
  },
  {
    path: '/api/categories/interactions',
    method: 'POST',
    description: 'Create interaction type',
    auth: true,
  },
  {
    path: '/api/categories/interactions/[id]',
    method: 'GET',
    description: 'Get interaction type',
    auth: true,
  },
  {
    path: '/api/categories/interactions/[id]',
    method: 'PUT',
    description: 'Update interaction type',
    auth: true,
  },
  {
    path: '/api/categories/interactions/[id]',
    method: 'DELETE',
    description: 'Delete interaction type',
    auth: true,
  },

  // Analytics
  {
    path: '/api/analytics/usage',
    method: 'GET',
    description: 'Get usage analytics',
    auth: true,
  },
  {
    path: '/api/stats/comprehensive',
    method: 'GET',
    description: 'Get comprehensive workspace statistics',
    auth: true,
  },
  {
    path: '/api/dashboard/stats',
    method: 'GET',
    description: 'Get dashboard statistics',
    auth: true,
  },
  {
    path: '/api/activity',
    method: 'GET',
    description: 'Get activity log',
    auth: true,
  },

  // Utilities
  {
    path: '/api/search',
    method: 'GET',
    description: 'Search prompts, snippets, categories',
    auth: true,
  },
  {
    path: '/api/export',
    method: 'GET',
    description: 'Export workspace data',
    auth: true,
  },
  {
    path: '/api/import',
    method: 'POST',
    description: 'Import workspace data',
    auth: true,
  },
  {
    path: '/api/batch/operations',
    method: 'POST',
    description: 'Batch delete/update operations',
    auth: true,
  },
  {
    path: '/api/sync',
    method: 'GET',
    description: 'Get sync log changes',
    auth: true,
  },
  {
    path: '/api/sync-logs',
    method: 'GET',
    description: 'List sync logs',
    auth: true,
  },
  {
    path: '/api/sync-logs',
    method: 'DELETE',
    description: 'Clean up old sync logs',
    auth: true,
  },
  {
    path: '/api/health',
    method: 'GET',
    description: 'Health check',
    auth: false,
  },
  {
    path: '/api/settings/api-keys',
    method: 'GET',
    description: 'Get API key status',
    auth: true,
  },
  {
    path: '/api/settings/api-keys',
    method: 'PUT',
    description: 'Update API key',
    auth: true,
  },
  {
    path: '/api/settings/api-keys',
    method: 'DELETE',
    description: 'Delete API key',
    auth: true,
  },
  {
    path: '/api/templates',
    method: 'GET',
    description: 'List templates',
    auth: true,
  },
  {
    path: '/api/templates',
    method: 'POST',
    description: 'Create template',
    auth: true,
  },
  {
    path: '/api/quotas/usage',
    method: 'GET',
    description: 'Get usage quotas',
    auth: true,
  },
  {
    path: '/api/notes',
    method: 'GET',
    description: 'List notes',
    auth: true,
  },
  {
    path: '/api/notes',
    method: 'POST',
    description: 'Create note',
    auth: true,
  },
  {
    path: '/api/maintenance/cleanup',
    method: 'POST',
    description: 'Clean up old data',
    auth: true,
  },
  {
    path: '/api/model-presets',
    method: 'GET',
    description: 'List model presets',
    auth: true,
  },
  {
    path: '/api/model-presets',
    method: 'POST',
    description: 'Create model preset',
    auth: true,
  },
]

export async function GET(request: NextRequest) {
  const groupedByPath = ENDPOINTS.reduce(
    (acc, ep) => {
      const base = ep.path.split('?')[0]
      if (!acc[base]) {
        acc[base] = []
      }
      acc[base].push({ method: ep.method, description: ep.description, auth: ep.auth })
      return acc
    },
    {} as Record<string, any[]>
  )

  return NextResponse.json(
    {
      total_endpoints: ENDPOINTS.length,
      authenticated_endpoints: ENDPOINTS.filter((e) => e.auth).length,
      public_endpoints: ENDPOINTS.filter((e) => !e.auth).length,
      endpoints: groupedByPath,
    },
    { status: 200 }
  )
}
