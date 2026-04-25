# Promptoria Mobile Strategy

## From B2B Tool to Consumer 'Prompt Recipe Book' App

April 2026

---

## The Opportunity

- B2B limited to prompt engineers + AI PMs; Consumer targets 100M+ AI users
- "Prompt Recipe Book" reframing: Users want to save prompts they love
- Mobile-first removes friction: Open app, save prompt, offline-first

## Feature Set: Offline-First MVP

### Core Features

**1. Quick Prompt Capture**
- Add button: Title, description, content, category
- Camera: Snap text, extract via OCR
- Paste from clipboard: Auto-detect and save

**2. Organization (Offline, Local Storage)**
- Categories: Writing, Coding, Marketing, Q&A, Custom
- Favorites: Star for quick access
- Search: Full-text search (offline)
- Tags: Personal tagging (#marketing #urgent)

**3. Quick Test (Optional, Requires Internet)**
- Test button: Send to OpenAI or Claude API
- Response: Show output, cost estimate, copy
- User provides API key (stored securely in Keychain)

**4. Copy and Share**
- Long-press: Copy, Share, Export (JSON/Text)
- Share public recipe: Generate shareable link
- Import recipe: Paste link to add shared prompts

**5. Offline-First (Key Differentiator)**
- All prompts stored locally (SQLite/Realm)
- No internet needed for search, organize, copy
- Testing requires internet (API calls)

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Save, organize, search. No testing. Ads. |
| Pro | $0.99 | Remove ads, API testing, cloud backup |

**Why $0.99 works:**
- Impulse-buy price (not a "commitment")
- No subscription = lower churn
- You keep 70% ($0.70 per purchase)
- 100k purchases = $70k revenue (achievable)

## Year 1 Projections

| Metric | M1 | M6 | M12 |
|--------|-----|------|-------|
| Downloads | 5k | 80k | 200k |
| Pro purchases | 500 | 6k | 15k |
| Monthly revenue | $350 | $4.2k | $10.5k |
| Cumulative revenue | $350 | $12k | $45k |

## Go-to-Market

**Pre-Launch (Month 1)**
- Build waitlist: Landing page
- Create assets: App preview videos, screenshots
- App Store submission (2 weeks review)

**Launch Week (Month 2)**
- Product Hunt: Aim for top 5
- Twitter/TikTok: Daily content
- Press: Tech journalists, influencers
- Reddit: r/ChatGPT, r/MachineLearning

**Growth Phase (Months 3-6)**
- Community recipes: Users share, vote
- Blog: "Best ChatGPT Prompts for X"
- Referral: Users invite friends
- Partnerships: Communities

## Technical Stack

### Option A: React Native (Recommended)

**Why:** Shared codebase with Next.js web app, single team, faster iteration

- Framework: React Native + Expo
- Language: TypeScript
- State: Zustand or Redux Toolkit
- Database: SQLite (via expo-sqlite or op-sqlite)
- Sync: Existing `/api/sync` endpoint with timestamp-based change detection
- Auth: Existing JWT auth with refresh tokens
- API keys: iOS Keychain / Android Keystore via expo-secure-store

**Leverages existing backend:**
- `POST /api/auth/login`, `/signup`, `/refresh` — already built
- `POST /api/devices/register` — already built
- `GET /api/sync?lastSync=...` — already built
- Paginated endpoints (`skip`/`take`) — already built

### Option B: Native (Alternative)

- iOS: Swift + SwiftUI
- Android: Kotlin + Jetpack Compose
- Database: SQLite or Realm
- Faster per-platform performance, but 2x development cost

### Decision Criteria

| Factor | React Native | Native |
|--------|-------------|--------|
| Time to MVP | 3-4 months | 5-6 months |
| Team size | 1-2 devs | 2-3 devs |
| Code sharing with web | High (API layer, types) | None |
| Performance | Good enough | Best |
| Offline SQLite | op-sqlite / expo-sqlite | Native SQLite |
| OCR | expo-camera + ML Kit | Native Vision / ML Kit |
| Keychain | expo-secure-store | Native Keychain/Keystore |

**Recommendation: React Native + Expo** — faster time to market, TypeScript shared with web, existing team can contribute.

## Backend Readiness

The current Promptoria backend already supports mobile:

| Feature | Status |
|---------|--------|
| JWT Auth (login/signup/refresh) | Done |
| Device registration | Done |
| Timestamp-based sync | Done |
| Paginated endpoints | Done |
| CORS for cross-origin | Done |
| Export/Import (JSON) | Done |
| Quota tracking | Done |

## Next Steps

1. Validate demand: Survey 100 ChatGPT users ("Would you pay $0.99?")
2. Wireframe 5 core screens (see below)
3. Build React Native + Expo project
4. Implement offline-first local storage (SQLite)
5. Wire up sync with existing backend
6. App Store + Play Store submissions
7. Target: MVP in 3-4 months

---

## Wireframes: 5 Core Screens

### Screen 1: Home / Prompt Feed

```
┌─────────────────────────┐
│  🔍 Search prompts...    │
│                          │
│  ┌─────────────────────┐ │
│  │ ⭐ Blog Writer       │ │
│  │ Writes SEO blog...   │ │
│  │ #writing #seo        │ │
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ 📝 Code Reviewer     │ │
│  │ Reviews code for...  │ │
│  │ #coding #review      │ │
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ 🎯 Marketing Email   │ │
│  │ Cold email...        │ │
│  │ #marketing           │ │
│  └─────────────────────┘ │
│                          │
│         [＋]             │  ← FAB: Add prompt
├─────────────────────────┤
│ 🏠  🔍  ⭐  ⚙️          │  ← Tab bar
└─────────────────────────┘
```

**Key elements:** Search bar, prompt cards (title + preview + tags), floating add button, tab bar

### Screen 2: Add / Edit Prompt

```
┌─────────────────────────┐
│  ← Back        Save     │
│                          │
│  Title                   │
│  ┌─────────────────────┐ │
│  │ Blog Writer          │ │
│  └─────────────────────┘ │
│                          │
│  Category                │
│  ┌─────────────────────┐ │
│  │ Writing       ▼     │ │
│  └─────────────────────┘ │
│                          │
│  Prompt Content          │
│  ┌─────────────────────┐ │
│  │ You are an expert    │ │
│  │ blog writer...       │ │
│  │                      │ │
│  │                      │ │
│  └─────────────────────┘ │
│                          │
│  Tags                    │
│  [#writing] [#seo] [+]  │
│                          │
│  ┌──────────┐ ┌────────┐ │
│  │ 📷 Scan  │ │📋 Paste│ │  ← OCR / Clipboard
│  └──────────┘ └────────┘ │
└─────────────────────────┘
```

**Key elements:** Title, category dropdown, content textarea, tag chips, OCR + Paste shortcuts

### Screen 3: Prompt Detail

```
┌─────────────────────────┐
│  ← Back    ⋯ (Share)    │
│                          │
│  Blog Writer        ⭐  │
│  #writing #seo          │
│                          │
│  ┌─────────────────────┐ │
│  │ You are an expert    │ │
│  │ blog writer who      │ │
│  │ creates engaging...  │ │
│  │                      │ │
│  │ [Tap to copy]        │ │
│  └─────────────────────┘ │
│                          │
│  ┌─────────────────────┐ │
│  │ ▶ Test this prompt  │ │  ← Opens Test screen
│  └─────────────────────┘ │
│                          │
│  Variables detected:     │
│  • {{topic}} ┌────────┐ │
│  │            │ AI     │ │
│  │            └────────┘ │
│  • {{tone}}  ┌────────┐ │
│  │            │ casual │ │
│  │            └────────┘ │
│                          │
│  ┌──────────┐ ┌────────┐ │
│  │ ✏️ Edit  │ │🗑 Delete│ │
│  └──────────┘ └────────┘ │
└─────────────────────────┘
```

**Key elements:** Read-only content with copy, variable inputs, test button, edit/delete actions

### Screen 4: Test Runner

```
┌─────────────────────────┐
│  ← Back        ▶ Run    │
│                          │
│  Model                   │
│  ┌─────────────────────┐ │
│  │ Claude 3 Haiku  ▼  │ │
│  └─────────────────────┘ │
│                          │
│  ┌─────────────────────┐ │
│  │ Response:            │ │
│  │                      │ │
│  │ Here is your blog    │ │
│  │ post about AI in     │ │
│  │ education...         │ │
│  │                      │ │
│  └─────────────────────┘ │
│                          │
│  ┌──────────┐ ┌────────┐ │
│  │ 📋 Copy  │ │🔄 Retry│ │
│  └──────────┘ └────────┘ │
│                          │
│  245 tokens · $0.002    │
│  1.2s                    │
└─────────────────────────┘
```

**Key elements:** Model selector, response area, copy/retry, token count + cost

### Screen 5: Settings / Profile

```
┌─────────────────────────┐
│  Settings                │
│                          │
│  Account                 │
│  ┌─────────────────────┐ │
│  │ user@email.com       │ │
│  │ Logged in            │ │
│  └─────────────────────┘ │
│                          │
│  API Keys                │
│  ┌─────────────────────┐ │
│  │ Anthropic: sk-ant…   │ │
│  │ OpenAI:    (none)    │ │
│  └─────────────────────┘ │
│                          │
│  Cloud Sync              │
│  ┌─────────────────────┐ │
│  │ Last synced: 2m ago  │ │
│  │ [Sync Now]           │ │
│  └─────────────────────┘ │
│                          │
│  Pro                     │
│  ┌─────────────────────┐ │
│  │ ✅ Pro — No Ads     │ │
│  │ Restore Purchases    │ │
│  └─────────────────────┘ │
│                          │
│  [Log Out]               │
└─────────────────────────┘
```

**Key elements:** Account info, API key management, cloud sync status, Pro upgrade/restore, logout

---

## Conclusion

Prompt Recipe Book is a consumer play. Billions of AI users. Real problem. Simple solution. Mobile app, $0.99, offline-first, community sharing.

You're not building for prompt engineers. You're building for humans who use AI. That's everyone now.