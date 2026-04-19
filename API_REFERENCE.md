# Promptoria API Reference

## Overview

Complete REST API for prompt management, testing, and analytics. All endpoints except signup, login, and health require JWT authentication via `Authorization: Bearer <token>` header.

**Base URL:** `https://promptoria-dev.vercel.app/api/`

## Authentication

### Public Endpoints (No Auth Required)
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /health` - Health check

### Protected Endpoints
All other endpoints require a valid JWT token in the Authorization header.

## Endpoints by Category

### User Management

#### Profile
- `GET /user/profile` - Get authenticated user profile
- `GET /user/settings` - Get user settings and preferences
- `PUT /user/settings` - Update user settings

#### API Keys
- `GET /settings/api-keys` - Check if API key is configured
- `PUT /settings/api-keys` - Set or update Anthropic API key
- `DELETE /settings/api-keys` - Remove API key

### Workspace Management

- `GET /workspaces` - Get workspace details with resource counts
- `PUT /workspaces` - Update workspace name or slug

### Prompt Management

#### CRUD Operations
- `GET /prompts` - List all prompts in workspace
- `POST /prompts` - Create new prompt
- `GET /prompts/[id]` - Get prompt details with versions
- `PUT /prompts/[id]` - Update prompt (creates new version if template changes)
- `DELETE /prompts/[id]` - Delete prompt

#### Advanced Operations
- `POST /prompts/[id]/clone` - Clone prompt with latest version
- `POST /prompts/[id]/favorite` - Mark as favorite
- `DELETE /prompts/[id]/favorite` - Unmark as favorite
- `POST /prompts/[id]/rollback` - Rollback to previous version
- `GET /prompts/[id]/suggestions` - Get AI suggestions for improvement
- `POST /prompts/validate` - Validate template syntax
- `POST /prompts/execute-batch` - Execute multiple prompts in parallel

#### Versions
- `GET /prompts/[id]/versions/compare?v1=1&v2=2` - Compare versions with diffs

#### Compositions (Snippets in Prompts)
- `GET /prompts/[id]/compositions` - List snippets in prompt
- `POST /prompts/[id]/compositions` - Add snippet to prompt
- `PUT /prompts/[id]/compositions` - Reorder snippets
- `DELETE /prompts/[id]/compositions/[snippet_id]` - Remove snippet

### Snippets

- `GET /snippets` - List all snippets
- `POST /snippets` - Create snippet
- `GET /snippets/[id]` - Get snippet details
- `PUT /snippets/[id]` - Update snippet
- `DELETE /snippets/[id]` - Delete snippet
- `POST /snippets/compare` - Compare multiple snippets

### Categories & Interactions

#### Interaction Types
- `GET /categories/interactions` - List interaction types
- `POST /categories/interactions` - Create interaction type
- `GET /categories/interactions/[id]` - Get interaction type
- `PUT /categories/interactions/[id]` - Update interaction type
- `DELETE /categories/interactions/[id]` - Delete interaction type

#### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category
- `GET /categories/[id]` - Get category
- `PUT /categories/[id]` - Update category
- `DELETE /categories/[id]` - Delete category

### Testing & Execution

- `GET /test-runs` - List test runs
- `POST /test-runs` - Create test run (no execution)
- `GET /test-runs/[id]` - Get test run details
- `DELETE /test-runs/[id]` - Delete test run
- `POST /test-runs/[id]/execute` - Execute test run against Claude API

### Analytics & Statistics

- `GET /analytics/usage?days=30` - Detailed usage metrics by prompt
- `GET /stats/comprehensive` - Workspace health score and metrics
- `GET /dashboard/stats` - Dashboard overview statistics
- `GET /activity?limit=50&offset=0` - Activity log with filtering

### Search & Export

- `GET /search?q=search_term&type=all` - Search prompts, snippets, categories
- `GET /export?format=json&type=all` - Export workspace data
- `POST /import` - Import prompts, snippets, categories from JSON

### Utilities

- `GET /health` - Database connectivity check
- `POST /batch/operations` - Bulk delete/update multiple resources
- `GET /sync?timestamp=<ISO8601>` - Get changes since timestamp
- `GET /sync-logs?limit=50&offset=0` - List all changes with pagination
- `DELETE /sync-logs` - Clean up old logs
- `POST /maintenance/cleanup` - Remove old test runs and logs

### Templates & Presets

- `GET /templates?category=qa` - List built-in and custom templates
- `POST /templates` - Create custom template
- `GET /model-presets` - List saved model configurations
- `POST /model-presets` - Save model configuration preset

### Usage & Quotas

- `GET /quotas/usage?period=month` - Current usage and limits

### Notes & Documentation

- `GET /notes?entity_type=prompt&entity_id=...` - Get notes attached to resources
- `POST /notes` - Attach note to prompt or snippet

### API Discovery

- `GET /docs/endpoints` - List all available endpoints

## Example Requests

### Create and Run a Prompt

```bash
# 1. Create prompt
curl -X POST https://promptoria-dev.vercel.app/api/prompts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Prompt",
    "description": "Test prompt",
    "model": "claude-3-haiku-20240307",
    "versions": [{
      "version_number": 1,
      "template_body": "Answer this question: {input}"
    }]
  }'

# 2. Create test run
curl -X POST https://promptoria-dev.vercel.app/api/test-runs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_version_id": "VERSION_ID",
    "test_case_input": "What is 2+2?"
  }'

# 3. Execute test run
curl -X POST https://promptoria-dev.vercel.app/api/test-runs/TEST_RUN_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Batch Operations

```bash
curl -X POST https://promptoria-dev.vercel.app/api/batch/operations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "id": "op1",
        "action": "delete",
        "entity_type": "snippet",
        "entity_id": "SNIPPET_ID"
      },
      {
        "id": "op2",
        "action": "update",
        "entity_type": "prompt",
        "entity_id": "PROMPT_ID",
        "data": {
          "name": "Updated Name"
        }
      }
    ]
  }'
```

## Response Format

All responses are JSON. Successful responses return the resource or data. Errors return:

```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## Rate Limiting

Standard tier: 1000 API calls per day, 100 test executions per day

## Pagination

List endpoints support `limit` and `offset` parameters:
```
GET /sync-logs?limit=50&offset=100
```

## Filtering

Many list endpoints support filters:
- `?q=search_term` - Text search
- `?entity_type=prompt` - Filter by entity type
- `?action=create` - Filter by action
- `?days=30` - Time range filter

## Offline-First Sync

The `/sync` endpoint supports timestamp-based change detection for offline-first architectures:

```bash
curl "https://promptoria-dev.vercel.app/api/sync?timestamp=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Returns all changes created after the specified timestamp.
