# Promptoria Backlog

Prioritized list of work items planned for development.

## Status Summary

**Phase 1: Backend Migration** ✅ COMPLETE
- JWT authentication system
- User workspaces
- Prompt CRUD endpoints (`/api/prompts/*`)
- Snippet CRUD endpoints (`/api/snippets/*`)
- Version history with rollback
- SyncLog tracking for all changes
- Database: Prisma + PostgreSQL

**Phase 2: Frontend Integration** 🟡 IN PROGRESS
- Workbench page with prompt editing
- Snippet library management
- Version history viewer with diffs
- Category system (backend ✓, frontend ❌)
- Variable set management
- Toast notifications & save feedback

**Phase 3: Core Features** 🟠 NOT STARTED
- Snippet composition/picker enhancement (click-to-insert works, needs composition UI)
- Test runner (backend needs re-enabling)
- Categories endpoint to fetch with prompts
- Advanced snippet features (search, folders, tags)

**Total MVP Completion:** ~65%

## Priority 1: Critical Blockers 🔴

### Library Categories — Data Endpoint
- [ ] Create `GET /api/categories` endpoint returning categories with associated prompts
- [ ] Fix library page category display (currently shows 0 prompts despite correct backend saves)
- [ ] Add pagination/filtering for category queries
- **Blocks:** Library feature completion, category-based organization
- **Estimated: 2-3 hours**

### Snippet Picker Composition (MVP)
- [x] Snippet CRUD backend (`/api/snippets/*`) — **COMPLETE**
- [x] Basic snippet panel in workbench — **COMPLETE** (click-to-insert)
- [ ] Search/filter input for snippets
- [ ] Composition tracking (know which snippets inserted, in what order)
- [ ] Reorder/remove controls for inserted snippets
- [ ] Drag-and-drop insertion (replace click-to-append)
- **Blocks:** Advanced snippet features, composability
- **Estimated: 2-3 days**

### Test Runner Backend
- [ ] Re-enable test execution (currently shows "Coming soon")
- [ ] OpenAI/Claude API integration
- [ ] Local model execution fallback
- [ ] Token counter and cost estimation
- [ ] Response viewer UI
- **Blocks:** Prompt testing/validation workflows
- **Estimated: 2-3 days**

## Priority 2: Snippet Picker Enhancements 🟠

### Template Variable Handling
- [ ] Inline editing for `{variable}` names within snippets
- [ ] Variable collision detection (same var name across snippets)
- [ ] Auto-merge of variables from composed snippets
- [ ] Live preview of compiled prompt with variable substitution
- **Estimated: 1-2 days**

### Snippet Organization
- [ ] Snippet folders/collections (backend: `folder_id` field exists)
- [ ] Tags and filtering by tag
- [ ] Favorites/starred snippets
- [ ] Search across snippet name + content + description
- **Estimated: 1-2 days**

## Priority 3: Core UX Improvements 🟡

- [x] Toast notifications for actions — **COMPLETE**
- [x] Save status indicators — **COMPLETE**
- [x] Character-level diff viewer — **COMPLETE**
- [ ] Breadcrumb navigation
- [ ] Copy-to-clipboard buttons for code blocks
- [ ] Keyboard shortcuts (Cmd+K for search, Cmd+S for save, etc.)
- [ ] Empty state illustrations
- [ ] Loading states for async operations
- [ ] Dark mode Polish

## Priority 4: Version History & History Page 🟢

- [x] Version list view — **COMPLETE**
- [x] Diff viewer (character-level) — **COMPLETE**
- [x] Version comparison UI — **COMPLETE**
- [x] Rollback to previous version — **COMPLETE**
- [ ] History page dedicated view (separate from workbench)
- [ ] Branch/tag system for versions
- [ ] Version pinning/locking

## Priority 5: Feature Expansion 🔵

- [ ] Bulk operations (batch save, batch delete)
- [ ] Export prompts as JSON/Markdown/PDF
- [ ] Import snippets/prompts from file
- [ ] Prompt templates library (reusable starting points)
- [ ] Favorites/starred prompts
- [ ] Smart suggestions using version history
- [ ] Prompt cloning/forking

## Priority 6: Infrastructure 🟣

- [x] Authentication system (JWT-based) — **COMPLETE**
- [x] User workspaces — **COMPLETE**
- [ ] Database backup strategy
- [ ] API rate limiting
- [ ] Error tracking (Sentry)
- [ ] Analytics integration
- [ ] Performance monitoring
- [ ] Caching strategy (Redis/Edge Cache)

## Priority 7: Advanced Features 💜

- [ ] **Prompt Attachments & Response Storage**
  - [ ] Support file attachments on prompts (images, documents, data files)
  - [ ] Store LLM responses/outputs with prompts for historical context
  - [ ] Use stored responses as context for improvement suggestions
  - [ ] Build response library for A/B testing and comparative analysis
  - **Estimated: 3-4 days**

- [ ] Mobile app support
  - [ ] React Native mobile app (iOS/Android)
  - [ ] Offline sync capability
  - [ ] Mobile-optimized UI

- [ ] Collaborative features
  - [ ] Real-time collaborative editing
  - [ ] Comments/annotations on prompts
  - [ ] Activity log/audit trail
  - [ ] User mentions and @notifications

- [ ] Advanced organization
  - [ ] Snippet versioning
  - [ ] Custom workspaces/teams
  - [ ] Permission/role management
  - [ ] Organization-level settings

## Nice-to-Have (Future) 🌟

- [ ] Plugin/extension system
- [ ] Custom prompt DSL/language
- [ ] AI-powered prompt optimization
- [ ] A/B testing framework built-in
- [ ] Prompt analytics dashboard
- [ ] Integration with LLM APIs (OpenAI, Anthropic, etc.)
- [ ] Webhook support for automation
- [ ] Dark theme variants per user preference
- [ ] Full offline mode with sync

## Technical Debt / Quality

### Testing
- [ ] Add proper error boundaries
- [ ] Write unit tests (auth, API routes, components)
- [ ] Write E2E tests (full user workflows)
- [ ] Test coverage target: 80%+

### Code Quality
- [ ] Remove unused dependencies (check package.json)
- [ ] Optimize bundle size
- [ ] Add input validation layer (Zod/Yup)
- [ ] Improve TypeScript strictness (tsconfig)
- [ ] Consistent error handling across all endpoints

### Documentation
- [ ] Document all API endpoints (OpenAPI/Swagger)
- [ ] Add inline code comments for complex logic
- [ ] Create developer setup guide
- [ ] Architecture decision records (ADRs)
- [ ] Database schema documentation

### Performance
- [ ] Query optimization (N+1 queries, missing indexes)
- [ ] Implement query result caching (Prisma cache, Redis)
- [ ] Code split React components
- [ ] Image optimization
- [ ] Database connection pooling
