# Phase 1 UAT Test Plan

## Overview
Phase 1 implements JWT-based authentication and offline-first sync for the Promptoria mobile app using Next.js API routes, Prisma ORM, and PostgreSQL.

## Environment Setup
- **Backend**: Next.js 14 with API routes (/app/api/*)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (Bearer token) with bcrypt password hashing
- **Sync Protocol**: Timestamp-based change detection with SyncLog model

## Test Scenarios

### 1. Authentication Flows

#### 1.1 User Registration (POST /api/auth/signup)
- [ ] New user can register with email and password (min 8 chars)
- [ ] Validation rejects weak passwords (< 8 chars)
- [ ] Validation rejects invalid email formats
- [ ] Duplicate email registration is rejected (409 conflict)
- [ ] Response includes access_token, user data, and settings
- [ ] New users get default workspace created
- [ ] New users get default settings (gruvbox-dark theme, claude-3-haiku model, 0.7 temperature, 500 max tokens)

#### 1.2 User Login (POST /api/auth/login)
- [ ] User can login with registered email and password
- [ ] Incorrect password returns 401
- [ ] Non-existent email returns 401
- [ ] Response includes valid JWT access token
- [ ] Response includes user data and settings

#### 1.3 Token Management
- [ ] JWT tokens verify correctly with verifyAccessToken
- [ ] Invalid tokens are rejected at API endpoints
- [ ] Expired tokens are rejected (if expiry implemented)
- [ ] Bearer token extraction requires "Bearer" prefix

### 2. Protected Endpoints

#### 2.1 Sync Endpoint (GET /api/sync)
- [ ] Requires Authorization header with Bearer token
- [ ] Returns 401 if token missing or invalid
- [ ] Requires lastSync query parameter (ISO 8601 format)
- [ ] Returns 400 if lastSync format invalid
- [ ] Returns 404 if user workspace not found
- [ ] Returns 200 with synced_at timestamp on success
- [ ] Returns changes array with action, entityType, entityId, data
- [ ] Returns conflicts array (empty for Phase 1)
- [ ] Changes are properly filtered by workspace
- [ ] Changes are properly filtered by timestamp (> lastSync)
- [ ] Changes are ordered by changedAt ascending
- [ ] Pagination limit of 100 changes per request

### 3. Data Models

#### 3.1 User Model
- [ ] Email field is unique and required
- [ ] Password is hashed with bcrypt
- [ ] createdAt and updatedAt timestamps
- [ ] Has one userSettings record (created on signup)
- [ ] Has one workspace record (created on signup)

#### 3.2 UserSettings Model
- [ ] theme field (default: 'gruvbox-dark')
- [ ] suggestionsEnabled boolean (default: true)
- [ ] defaultModel (default: 'claude-3-haiku')
- [ ] defaultTemperature (default: 0.7)
- [ ] defaultMaxTokens (default: 500)

#### 3.3 Workspace Model
- [ ] name field (default: 'Default Workspace')
- [ ] slug field (default: 'default')
- [ ] userId foreign key
- [ ] Has many syncLog records

#### 3.4 SyncLog Model
- [ ] Tracks changes: create, update, delete actions
- [ ] Stores entity type (prompt, snippet, etc.)
- [ ] Stores entity ID reference
- [ ] Stores change data as JSON
- [ ] changedAt timestamp for filtering
- [ ] workspaceId for workspace isolation

### 4. Error Handling

#### 4.1 HTTP Status Codes
- [ ] 200: Success with data
- [ ] 201: Resource created (signup)
- [ ] 400: Invalid input/parameters
- [ ] 401: Authentication failed/missing
- [ ] 404: Resource not found
- [ ] 409: Conflict (duplicate email)
- [ ] 500: Server error with error message

#### 4.2 Error Messages
- [ ] Errors returned in JSON format: { error: "message" }
- [ ] Error messages are user-friendly but informative
- [ ] Sensitive information not exposed in errors

### 5. Integration Testing

#### 5.1 Full Auth Flow
1. Register new user
2. Receive access token
3. Use token to access protected endpoint
4. Verify user data persisted correctly

#### 5.2 Sync Workflow
1. Authenticate user
2. Get initial sync with early timestamp
3. Verify all changes returned
4. Get subsequent sync with recent timestamp
5. Verify only new changes returned
6. Verify pagination works (request with offset)

### 6. Database Validation

#### 6.1 Prisma Migrations
- [ ] All migration files run without error
- [ ] Database schema matches models (User, UserSettings, Workspace, Device, SyncLog)
- [ ] Foreign key relationships are intact
- [ ] Indexes are created as expected

#### 6.2 Data Integrity
- [ ] Cascade deletes work correctly
- [ ] Unique constraints enforced
- [ ] NOT NULL constraints enforced
- [ ] Default values applied correctly

### 7. Performance Testing

#### 7.1 Response Times
- [ ] Signup completes in < 200ms
- [ ] Login completes in < 150ms
- [ ] Sync request completes in < 300ms (with 100 changes)

#### 7.2 Query Efficiency
- [ ] Sync queries use indexes properly
- [ ] No N+1 queries
- [ ] Pagination is efficient

### 8. Security

#### 8.1 Password Security
- [ ] Passwords are hashed with bcrypt
- [ ] Passwords are never returned in responses
- [ ] Password minimum length enforced (8 chars)

#### 8.2 Token Security
- [ ] JWT tokens contain userId and email
- [ ] Tokens are signed and verified
- [ ] Tokens are rejected if tampered with

#### 8.3 Data Isolation
- [ ] Users can only access their own workspace
- [ ] Users can only see their own sync changes
- [ ] Users cannot see other users' data

## UAT Sign-Off

- [ ] All test scenarios passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Ready for deployment

**UAT Tester**: ______________________
**Date**: ______________________
**Notes**: ___________________________________________________________
