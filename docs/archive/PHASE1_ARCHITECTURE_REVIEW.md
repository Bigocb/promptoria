# Phase 1 In-Depth Architecture Review
## Impact Analysis: Python FastAPI → Next.js API Routes

**Date**: April 18, 2026  
**Decision Point**: Before implementing Phase 1 backend work

---

## Current Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│ GitHub (main branch)                                     │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ↓                                  ↓
   ┌─────────────┐              ┌──────────────────────┐
   │   VERCEL    │              │      RENDER          │
   │ (Frontend)  │              │  (Python FastAPI)    │
   └─────────────┘              └──────────────────────┘
   
   https://                      https://promptoria-api.
   promptoria.                   onrender.com
   vercel.app
   
   ↓ API calls ────────────────────→ ↑ REST API
   ├─ /api/auth/login
   ├─ /api/prompts
   ├─ /api/snippets
   ├─ /api/settings
   └─ /api/execute
   
   Database: Render PostgreSQL (DATABASE_URL)
```

### Current Stack (Frontend)
- **Hosting**: Vercel (serverless)
- **Framework**: Next.js 14 (React pages, client-side)
- **API Client**: fetch() → hardcoded to Python backend at Render
- **Database**: None (calls Python backend only)
- **Auth**: JWT stored in localStorage, no backend state

### Current Stack (Backend)
- **Hosting**: Render (Python service)
- **Framework**: FastAPI (OpenAPI + Starlette)
- **Database**: PostgreSQL on Render (DATABASE_URL env var)
- **ORM**: SQLAlchemy
- **Auth**: JWT generation, user CRUD, password hashing (bcrypt)
- **Dependencies**: 29 Python packages (sqlalchemy, fastapi, pyjwt, bcrypt, etc.)

---

## Proposed Change: Shift API Logic to Next.js

### Why This Matters

**Currently**: 
- Frontend (Vercel) talks to Python Backend (Render)
- 2 separate deployments, 2 separate services
- Python backend handles auth, sync, prompts, snippets, etc.

**After Phase 1**:
- Frontend (Vercel) has BOTH pages AND API routes (`/app/api/*`)
- Next.js API routes become the primary backend
- Python backend still runs but becomes secondary/optional
- Mobile apps call Next.js API routes, not Python backend

### Impact Matrix

| Aspect | Current | After Phase 1 | Risk Level |
|--------|---------|---------------|-----------|
| **Frontend Host** | Vercel | Vercel (unchanged) | 🟢 None |
| **Backend Host** | Render Python | Vercel Next.js | 🔴 HIGH |
| **API Entry Point** | https://promptoria-api.onrender.com | https://promptoria.vercel.app/api | 🔴 HIGH |
| **Database** | PostgreSQL on Render | PostgreSQL on Render (via Vercel env var) | 🟡 Medium |
| **Authentication** | Python JWT generation | Next.js JWT generation | 🔴 HIGH |
| **CORS** | Render CORS_ORIGINS config | Vercel middleware (built-in) | 🟢 Low |
| **Environment Variables** | Render config panel | Vercel project settings | 🟡 Medium |
| **Mobile Apps** | Call Python backend | Call Next.js backend | 🟢 None (benefit) |
| **Deployment** | 2 services (Vercel + Render) | 1 service (Vercel only) | 🟡 Medium |

---

## Phase 1 Scope: Backend Preparation

### What Phase 1 Creates (in Next.js)

```
/app/api/
├── auth/
│   ├── login/route.ts         (POST - user login, JWT generation)
│   ├── signup/route.ts        (POST - user registration)
│   └── refresh/route.ts       (POST - JWT token refresh)
├── sync/
│   └── route.ts               (GET - timestamp-based sync for mobile)
├── middleware.ts              (JWT verification for protected routes)
└── db.ts                       (Prisma client singleton)

/lib/
├── jwt.ts                      (Token generation & verification)
├── auth.ts                     (authenticate_user, hash_password, etc.)
└── api-config.ts              (UPDATE: point to /api/* instead of localhost:3100)

/prisma/
├── schema.prisma              (UPDATE: add Device, SyncLog models)
└── migrations/                (NEW: migration for Device + SyncLog)
```

### What Phase 1 Does NOT Change

- Python backend stays deployed (for now)
- Frontend pages stay unchanged (still call `/api/*` after update)
- Database schema (Prisma) is additive only (no deletions)
- Existing prompts/snippets/settings data untouched

---

## Critical Risk Assessment

### 🔴 HIGH RISK: API Entry Point Change

**Issue**: 
- Currently: mobile/frontend call `https://promptoria-api.onrender.com/api/auth/login`
- After Phase 1: mobile/frontend call `https://promptoria.vercel.app/api/auth/login`
- Python backend auth endpoints still exist but may be unused

**Impact**:
- If Next.js auth routes have bugs, login breaks for frontend + mobile
- Both services must have compatible auth responses (token format, user object shape)
- Frontend's `lib/api-config.ts` hardcodes auth endpoints; updating it is necessary

**Mitigation**:
1. Parallel run both backends during transition
2. Implement comprehensive tests for Next.js auth routes
3. Use API_BASE_URL env var in api-config.ts (not hardcoded)
4. Start with read-only endpoints, then migrate write endpoints

### 🔴 HIGH RISK: JWT Token Compatibility

**Issue**:
- Python backend generates JWT with PyJWT library
- Next.js backend must generate identical token format
- If tokens differ, existing localStorage tokens won't work with new APIs

**Impact**:
- Users may be logged out after deploying Phase 1
- Mobile apps may reject tokens from old Python backend

**Mitigation**:
1. Match JWT algorithm (HS256), secret, expiration (7 days)
2. Use `jsonwebtoken` npm package for Node.js (same standard)
3. Test token interchange between Python and Node.js
4. Clear localStorage on first Next.js auth route call if needed

### 🔴 HIGH RISK: Database Connection from Vercel

**Issue**:
- Current: Python backend on Render accesses PostgreSQL directly
- After Phase 1: Next.js on Vercel also needs PostgreSQL access
- Render PostgreSQL may not be accessible from Vercel's IP range

**Impact**:
- Next.js API routes fail to connect to database
- Deployment succeeds but endpoints return 500 errors

**Mitigation**:
1. Confirm DATABASE_URL is set in Vercel environment
2. Test connection: Vercel can reach Render PostgreSQL
3. Use connection pooling in Prisma (`PrismaClient` is singleton)
4. May need Render Postgres Private URL or IP whitelist

### 🔴 HIGH RISK: Authentication Middleware in Next.js

**Issue**:
- Python backend has auth middleware on every endpoint (checks JWT)
- Next.js needs equivalent middleware for `/api/*` routes
- Missing or incorrect middleware = unauthenticated access to private data

**Impact**:
- Anyone can access prompts/snippets without login
- Data leakage, security vulnerability

**Mitigation**:
1. Implement `middleware.ts` at `/middleware.ts` (Next.js 13+)
2. OR: Add auth check at top of each protected route handler
3. Use `getToken()` from `next-auth` or decode JWT manually
4. Test: Call protected endpoint without token → 401 Unauthorized

### 🟡 MEDIUM RISK: Prisma Migrations on Vercel

**Issue**:
- Phase 1 adds Device + SyncLog models to `prisma/schema.prisma`
- Needs database migration before deployment
- Vercel doesn't auto-run migrations

**Impact**:
- Schema mismatch: code expects Device table, database doesn't have it
- Deployment succeeds, but API calls fail with "table not found"

**Mitigation**:
1. Run migration locally: `npx prisma migrate dev --name add_device_synclog`
2. Commit `prisma/migrations/*` to git
3. Add Vercel build hook: `npx prisma migrate deploy` before app starts
4. OR: Run migration manually from local environment before deploying

### 🟡 MEDIUM RISK: Environment Variable Management

**Issue**:
- Currently: Python backend env vars on Render dashboard
- After Phase 1: Next.js needs env vars on Vercel dashboard
- Easy to forget updating both, causing version mismatch

**Impact**:
- JWT_SECRET differs between services
- Database URL not set on Vercel
- API keys missing (Anthropic, OpenAI)

**Mitigation**:
1. Document all required env vars for Vercel (separate from Render)
2. Create checklist before deployment
3. Use GitHub Secrets to auto-sync env vars (optional)
4. Add console logging of env var presence (not values) for debugging

### 🟢 LOW RISK: CORS Configuration

**Issue**:
- Python backend hardcodes CORS origins in code + env var
- Vercel's Next.js handles CORS differently (middleware-based)

**Impact**:
- Minimal: both support same origins (localhost:3000, vercel.app)

**Mitigation**:
1. Next.js CORS is simpler (no separate config needed)
2. Just ensure API routes return proper headers

---

## Deployment Strategy: Phased Rollout

### Phase 1a: Prepare (Days 1-2)
1. Create Next.js API routes locally (no deployment yet)
2. Test JWT token generation matches Python backend
3. Test database connection from local Next.js
4. Run migrations locally to confirm schema works
5. **DO NOT deploy yet**

### Phase 1b: Test Parallel (Days 3-4)
1. Deploy Next.js API routes to Vercel (separate URL path or branch)
2. Keep Python backend running on Render
3. Update `lib/api-config.ts` to point to Vercel `/api/*` for testing
4. Run full auth flow test: signup → login → access protected endpoint
5. Verify token format matches, database reads/writes work

### Phase 1c: Cutover (Days 5-6)
1. Update `lib/api-config.ts` production config to use `/api/*`
2. Test on production Vercel URL before committing
3. Commit and deploy to Vercel
4. Monitor: check logs for errors, auth failures
5. Keep Python backend running as fallback
6. Frontend should now use Next.js auth endpoints

### Phase 1d: Cleanup (Days 7+)
1. Monitor for 1 week: no auth errors, no database issues
2. Once stable: can shut down Python backend (or keep as fallback)
3. Remove hardcoded localhost:3100 references from code
4. Update documentation

---

## Decision Checkpoint

Before agents start Phase 1 implementation, confirm:

1. **Vercel Database Access**: Can we confirm Vercel can reach Render PostgreSQL?
   - [ ] DATABASE_URL will be set in Vercel env
   - [ ] Render PostgreSQL is not IP-restricted

2. **JWT Compatibility**: Use `jsonwebtoken` npm package (same format as PyJWT)?
   - [ ] Yes, use standard HS256 JWT
   - [ ] Confirm 7-day expiration window

3. **Parallel Running**: Can Python backend + Next.js run simultaneously during transition?
   - [ ] Yes, both can coexist (different hosts)
   - [ ] Keep Python backend as fallback

4. **Auth Testing**: Who will test auth flow (signup → login → protected endpoint)?
   - [ ] Automated tests in Phase 1
   - [ ] Manual testing before production deploy

5. **Go-Live Timeline**: When should we cutover to Next.js auth?
   - [ ] Immediately after Phase 1 (days 1-2)
   - [ ] After 1 week of parallel testing (days 5-6)

---

## Success Criteria

Phase 1 is complete when:

✅ Next.js `/api/auth/login` works (returns valid JWT)  
✅ Next.js `/api/auth/signup` works (creates user, returns JWT)  
✅ JWT tokens can be decoded and verified  
✅ `/api/sync` endpoint returns changes since timestamp  
✅ Pagination works on `/api/prompts?page=1&limit=20`  
✅ Device model tracks iOS/Android instances  
✅ All routes have JWT authentication middleware  
✅ Tests pass: >80% coverage on auth + sync logic  
✅ Frontend can call `/api/*` instead of `localhost:3100`  
✅ Mobile apps ready to integrate with `/api/*` endpoints  

---

## Recommended Approach

**GO WITH**: 
- Next.js API routes (Phase 1 as planned)
- Parallel run (both backends coexist for 1-2 weeks)
- Test before cutover (verify auth compatibility)
- Phased rollout (1a prep → 1b test → 1c cutover → 1d cleanup)

**NOT**: 
- Don't delete Python backend immediately
- Don't skip JWT compatibility testing
- Don't forget Prisma migrations
- Don't deploy to Vercel without testing locally first

