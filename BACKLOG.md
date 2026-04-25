# Promptoria Backlog

Prioritized list of remaining work. Completed items have been moved to `FEATURES.md`.

---

## Tier 1: Incomplete Features (finish what's started)

### Connect History page to real API
- [ ] Replace hardcoded mock data in `/history` page with calls to `GET /api/test-runs`
- [ ] Add pagination, filtering by prompt, date range picker

### Favorites persistence
- [ ] Add `Favorite` model to Prisma schema (user_id, prompt_id, created_at)
- [ ] Wire up `POST/DELETE /api/prompts/[id]/favorite` to create/delete Favorite records
- [ ] Add favorites list endpoint `GET /api/prompts?favorited=true`
- [ ] Add favorite toggle UI to prompt cards and detail page

### Cost calculation in test results
- [ ] Use pricing data from `/api/models` to calculate cost per test run
- [ ] Display input cost, output cost, and total cost in test run results
- [ ] Add cost aggregation to analytics/usage endpoint

### Tag suggestions UI
- [ ] Surface `GET /api/prompts/[id]/tags-suggestions` in prompt edit form
- [ ] Show suggested tags as clickable chips below the tag input

## Tier 2: Polish & Gaps

### UX
- [ ] Breadcrumb navigation across pages
- [ ] Copy-to-clipboard buttons globally (not just test runner)
- [ ] Keyboard shortcuts (Cmd+K for search, Cmd+S for save)
- [ ] Empty state illustrations (currently text-only)
- [ ] Loading skeleton states for async data
- [ ] Error boundaries for route-level error handling

### Snippet Organization
- [ ] Snippet folders/collections (`folder_id` field exists in schema, no model or UI)
- [ ] Snippet tags and filtering
- [ ] Snippet search across name + content + description

### Variable Handling
- [ ] Inline variable editing in composition UI
- [ ] Variable collision detection across composed snippets
- [ ] Auto-merge variables from snippets into test runner

### Pagination & Performance
- [ ] Add pagination to prompt list, snippet list, and test runs list
- [ ] Optimize N+1 queries in API endpoints
- [ ] Add database indexes for common queries

## Tier 3: New Features

### Prompt Templates Library
- [ ] Pre-built prompt templates as starting points
- [ ] Template seeding in database
- [ ] "Create from template" flow

### A/B Testing
- [ ] A/B testing framework between prompt versions
- [ ] Statistical comparison of test results
- [ ] Batch testing with multiple variable sets

### Enhanced Test Runner
- [ ] Response storage linked to prompts
- [ ] Response library for comparative analysis
- [ ] File attachments on prompts

### Collaboration
- [ ] Shared workspaces with team members
- [ ] Comments/annotations on prompts
- [ ] User mentions and notifications
- [ ] Role-based access control (owner, editor, viewer)

### Integrations
- [ ] Webhook support for automation
- [ ] OpenAI provider integration (currently Ollama + Anthropic only)
- [ ] Swagger/OpenAPI documentation endpoint

### Mobile
- [ ] React Native mobile app (iOS/Android)
- [ ] Offline sync capability
- [ ] Mobile-optimized responsive layouts

## Tier 4: Infrastructure & Quality

### Testing
- [ ] Unit tests for auth, API routes, and components
- [ ] E2E tests for full user workflows
- [ ] Test coverage target: 80%+

### Code Quality
- [ ] Input validation layer (Zod)
- [ ] Consistent error handling across all endpoints
- [ ] Remove unused dependencies
- [ ] TypeScript strict mode

### Production Readiness
- [ ] Rate limiting (per IP/user)
- [ ] Structured audit logging (beyond SyncLog)
- [ ] Database backup strategy
- [ ] Error tracking (Sentry)
- [ ] Redis caching
- [ ] CI/CD pipeline
- [ ] Refresh tokens and token expiry handling

### Developer Experience
- [ ] CLI tool for Promptoria
- [ ] VS Code extension