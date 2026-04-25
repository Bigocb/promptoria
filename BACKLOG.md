# Promptoria Backlog

Prioritized list of remaining work. Completed items have been moved to `FEATURES.md`.

---

## Tier 1: Polish & UX

### Empty state guidance
- [ ] Dashboard: show helpful onboarding for new users (no prompts, no snippets)
- [ ] Library: suggest creating first prompt when empty
- [ ] Test runner: explain how to use test variables

### History page data
- [ ] Wire up `/history` page to real `GET /api/test-runs` data (currently mock)
- [ ] Add pagination, filtering by prompt, date range

### Favorites persistence
- [ ] Add `Favorite` model to Prisma schema (user_id, prompt_id, created_at)
- [ ] Wire up `POST/DELETE /api/prompts/[id]/favorite` to create/delete Favorite records
- [ ] Add favorites list endpoint `GET /api/prompts?favorited=true`
- [ ] Add favorite toggle UI to prompt cards and detail page

### Tag suggestions UI
- [ ] Surface `GET /api/prompts/[id]/tags-suggestions` in prompt edit form
- [ ] Show suggested tags as clickable chips below the tag input

## Tier 2: Security & Infrastructure

### Rate limiting
- [x] Auth endpoints rate limited (10 req / 15 min per IP)
- [ ] Rate limit on all API endpoints (100 req / min per user)
- [ ] Rate limit on test execution endpoints (10 req / min per user)

### Error tracking
- [ ] Add Sentry (or similar) for runtime error tracking
- [ ] Add source maps for production debugging

### Data protection
- [ ] Privacy policy page (`/privacy`)
- [ ] Terms of service page (`/terms`)
- [ ] CORS hardening (restrict origins more tightly)

## Tier 3: New Features

### Prompt Templates Library
- [ ] Pre-built prompt templates as starting points
- [ ] Template seeding in database
- [ ] "Create from template" flow

### A/B Testing
- [ ] A/B testing framework between prompt versions
- [ ] Statistical comparison of test results
- [ ] Batch testing with multiple variable sets

### Collaboration
- [ ] Shared workspaces with team members
- [ ] Comments/annotations on prompts
- [ ] Role-based access control (owner, editor, viewer)

### Email Integration
- [ ] SendGrid or Resend integration for password reset emails
- [ ] Email verification on signup
- [ ] Welcome email

## Tier 4: Mobile & Performance

### Mobile
- [ ] React Native mobile app (see `docs/MOBILE_STRATEGY.md`)
- [ ] Offline sync capability
- [ ] Mobile-optimized responsive layouts

### Performance
- [ ] Pagination on prompt/snippet/test-runs lists
- [ ] Optimize N+1 queries in API endpoints
- [ ] Database indexes for common queries
- [ ] Redis caching layer

### Code Quality
- [ ] Input validation layer (Zod)
- [ ] Consistent error handling across all endpoints
- [ ] TypeScript strict mode