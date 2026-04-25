# Promptoria Phase Roadmap — PM/Marketing Review

**Current Status:** 82% MVP Complete | Phase 2-3 overlap (mostly done)  
**Last Updated:** April 20, 2026

---

## 📊 Phase Overview

| Phase | Status | Completion | Focus |
|-------|--------|------------|-------|
| **Phase 1** | ✅ Complete | 100% | Backend infrastructure, auth, CRUD |
| **Phase 2** | 🟡 In Progress | ~95% | Frontend UI, workbench, library |
| **Phase 3** | 🟢 Mostly Done | ~82% | Core features, composition, test runner |
| **Phase 4** | 🟠 Backlog | 0% | Enhanced organization & collaboration |
| **Phase 5** | 🔵 Backlog | 0% | Mobile & advanced features |

---

## ✅ Phase 1: Backend Migration (COMPLETE)

**Shipped & Live:**
- JWT authentication system
- User workspaces with isolation
- Prompt CRUD endpoints (`/api/prompts`, versions, rollback)
- Snippet CRUD endpoints (`/api/snippets`)
- Version history with character-level diffs
- SyncLog tracking (for offline-first support)
- PostgreSQL + Prisma ORM

**Time to deliver:** ~2 weeks (completed)

---

## 🟡 Phase 2: Frontend Integration (95% DONE)

**Shipped:**
- ✅ Workbench page with full prompt editing
- ✅ Snippet library management
- ✅ Version history viewer with diffs + rollback UI
- ✅ Category system (backend + frontend)
- ✅ Variable set management
- ✅ Toast notifications & save feedback
- ✅ Snippet search/filter
- ✅ Snippet composition builder with drag-drop
- ✅ Live preview (prompt + composed snippets)

**Outstanding:**
- Mobile layout fixes (JUST FIXED — in latest commit)
- Category assignment UI during prompt creation

**Estimated to finalize:** 1-2 days

---

## 🟢 Phase 3: Core Features (82% DONE)

### Completed ✅
- Snippet composition/picker (search, drag-drop, reorder)
- Library categories with uncategorized prompts
- Basic test runner UI (shows "Coming soon")

### High Priority (Blocking)
**Test Runner** (2-3 days)
- Re-enable test execution backend
- Claude/OpenAI API integration
- Token counting & cost estimation
- Response viewer UI
- **Business value:** Users can validate prompts before use
- **Blocks:** Testing workflows, quality validation

### Medium Priority (Nice to have)
**Advanced Snippet Features** (2-3 days)
- Variable collision detection across snippets
- Inline variable editing in composition
- Snippet folders/collections
- Snippet tags & filtering
- Favorites/starred snippets

---

## 🟠 Phase 4: Organization & Polish (BACKLOG)

### Quick Wins (1-2 days each)
- ✨ Copy-to-clipboard buttons (prompts, snippets)
- ✨ Keyboard shortcuts (Cmd+S save, Cmd+K search)
- ✨ Breadcrumb navigation
- ✨ Empty state illustrations
- ✨ Loading skeleton states

### Feature Expansion (3-5 days total)
- 📤 **Export prompts** (JSON/Markdown/PDF) — Good for sharing, compliance
- 📥 **Import snippets** from file — Bulk operations
- 📋 **Prompt templates library** — Reusable starting points
- ⭐ **Favorites/starred prompts** — Quick access
- 🔀 **Prompt cloning/forking** — Version branching

**Business value:** Improves usability, enables sharing, supports enterprise workflows

---

## 🔵 Phase 5: Mobile & Collaboration (FUTURE)

### High Strategic Value
**Collaborative Features** (1-2 weeks)
- Real-time collaborative editing
- Comments/annotations on prompts
- Activity log & audit trail
- User @mentions & notifications
- **Business model:** Team/enterprise tier

**Mobile App** (2-3 weeks)
- React Native (iOS/Android)
- Offline sync capability
- Mobile-optimized workbench
- **Business model:** Mobile subscription

**Prompt Attachments & Response Storage** (1 week)
- Attach images/documents to prompts
- Store LLM responses with prompts
- A/B testing framework
- Response library for comparison
- **Business value:** Research, benchmarking, compliance

---

## 💜 Phase 6: Advanced Features (FUTURE)

- AI-powered prompt optimization
- Prompt analytics dashboard
- Direct LLM API integrations
- Webhook support for automation
- Plugin/extension system

---

## 🎯 Recommended Next Work (For PM/Marketing)

### **THIS SPRINT (3-5 days)**
1. **Finalize Phase 2** (1-2 days)
   - Mobile layout cleanup (DONE TODAY)
   - Category assignment during creation
   - Polish any remaining UI bugs

2. **Test Runner MVP** (2-3 days) ⭐ **HIGHEST PRIORITY**
   - Enables users to validate prompts
   - Required for "production ready" positioning
   - Fast implementation (backend mostly done)

### **NEXT SPRINT (1 week)**
**Choose one of:**

**Option A: Maximum User Delight (UX focus)**
- Export/import prompts (2-3 days)
- Templates library (2-3 days)
- Copy buttons & keyboard shortcuts (1-2 days)
- **Why:** Quick features that improve usability, good for demo videos

**Option B: Enterprise Readiness (B2B focus)**
- Prompt attachments (2-3 days)
- Response storage (1-2 days)
- User management/roles (2-3 days)
- **Why:** Foundation for team/enterprise tier

**Option C: Mobile First (Growth focus)**
- Responsive UI polish (JUST DONE)
- React Native mobile app (1-2 weeks)
- **Why:** Tap growing mobile-first market

---

## 📈 Feature Prioritization Matrix

| Feature | Dev Time | User Impact | Business Value | Market Diff |
|---------|----------|-------------|-----------------|-------------|
| Test Runner | 2-3 days | 🟢 High | 🟢 High | 🟡 Medium |
| Export/Import | 2-3 days | 🟢 High | 🟡 Medium | 🟡 Medium |
| Templates | 2-3 days | 🟢 High | 🟡 Medium | 🟡 Medium |
| Mobile App | 2 weeks | 🟡 Medium | 🟢 High | 🟢 High |
| Collaboration | 1-2 weeks | 🟢 High | 🟢 High | 🟢 High |
| Attachments | 1 week | 🟡 Medium | 🟢 High | 🟢 High |
| A/B Testing | 3-4 days | 🟡 Medium | 🟢 High | 🟢 High |

---

## ✨ Current MVP Positioning

**What we're ready to market (82% complete):**
- ✅ Powerful prompt editing & versioning
- ✅ Snippet composition for reusable prompts
- ✅ Full version history with rollback
- ✅ Category/library organization
- ✅ Search & filtering

**What's missing for "production ready":**
- ❌ Ability to test prompts (Test Runner) — **BLOCKING**
- ❌ Easy way to share/export (Export feature)
- ❌ Templates for quick onboarding (Templates)

---

## 🚀 Deployment Timeline

**If we finish Phase 3 this sprint:**
- Week 1-2: Polish + Test Runner (2-3 days) → **Public Beta**
- Week 3-4: Export/Templates OR Mobile → **Public Release**
- Month 2: Collaboration OR A/B Testing → **Team Plan**
- Month 3: Enterprise features (roles, audit) → **Enterprise Plan**

**Rough timeline to "market ready":** 2-3 weeks (add Test Runner + Export)
