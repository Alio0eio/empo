# I-Hire MVP Implementation Plan

**Project:** I-Hire AI Interviewer  
**Target:** Production-Ready MVP  
**Timeline:** 4-6 Weeks  
**Status:** Planning Phase

---

## Overview

This document provides a detailed, step-by-step implementation plan to transform the current I-Hire codebase into a production-ready MVP. The plan is organized by priority, with clear tasks for both frontend and backend development.

---

## Phase 1: Critical Cleanup & Foundation (Week 1)

### 🎯 Goal: Remove blockers and establish solid foundation

---

### Backend Tasks

#### Task 1.1: Clean Up Test/Debug Routes
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours

**Actions:**
1. Audit all test routes in `app/api/test-*`
2. Remove unnecessary test routes:
   - `/api/test-basic`
   - `/api/test-db-connection`
   - `/api/test-db-schema`
   - `/api/test-table-exists`
   - `/api/test-table-structure`
   - `/api/test-simple-query`
   - `/api/test-all-tables`
   - `/api/test-chat-tables`
   - `/api/test-check-connections`
   - `/api/test-insert-debug`
   - `/api/test-insert-connection`
   - `/api/test-json`
   - `/api/test-send-request-simulation`
   - `/api/test-session-save`
   - `/api/test-user`
   - `/api/test-user-profile`
   - `/api/test-video-evaluation`
   - `/api/test-evaluation`
   - `/api/test-evaluation-simple`
3. Keep but protect essential debug routes:
   - Move to `/api/admin/debug/*` with admin authentication
   - Add rate limiting
   - Add logging

**Files to Modify:**
- Delete: `app/api/test-*/route.js` (15+ files)
- Create: `app/api/admin/debug/` directory
- Update: `middleware.js` to protect admin routes

**Acceptance Criteria:**
- ✅ All test routes removed or protected
- ✅ No test routes accessible in production
- ✅ Admin routes require authentication

---

#### Task 1.2: Implement Centralized Error Handling
**Priority:** 🔴 Critical  
**Estimated Time:** 6 hours

**Actions:**
1. Create error handling utility:
   ```javascript
   // utils/errorHandler.js
   export class AppError extends Error {
     constructor(message, statusCode, code) {
       super(message);
       this.statusCode = statusCode;
       this.code = code;
     }
   }
   
   export function errorHandler(err, req, res) {
     // Standardized error response
   }
   ```

2. Create error response middleware:
   ```javascript
   // middleware/errorMiddleware.js
   export function withErrorHandling(handler) {
     return async (req, res) => {
       try {
         return await handler(req, res);
       } catch (error) {
         return errorHandler(error, req, res);
       }
     };
   }
   ```

3. Update all API routes to use error handler

**Files to Create:**
- `utils/errorHandler.js`
- `middleware/errorMiddleware.js`
- `utils/errorCodes.js` (standard error codes)

**Files to Modify:**
- All files in `app/api/**/route.js` (wrap handlers)

**Acceptance Criteria:**
- ✅ Consistent error format across all APIs
- ✅ Proper HTTP status codes
- ✅ Error logging implemented
- ✅ User-friendly error messages

---

#### Task 1.3: Add Input Validation Middleware
**Priority:** 🔴 Critical  
**Estimated Time:** 8 hours

**Actions:**
1. Install validation library:
   ```bash
   npm install zod
   ```

2. Create validation schemas:
   ```javascript
   // utils/validators/schemas.js
   import { z } from 'zod';
   
   export const cvAnalyzeSchema = z.object({
     cvText: z.string().min(10).max(50000),
     userId: z.string().min(1),
     originalFileName: z.string().optional(),
   });
   
   export const jobRecommendationSchema = z.object({
     userId: z.string().min(1),
     limit: z.number().int().min(1).max(100).optional(),
   });
   // ... more schemas
   ```

3. Create validation middleware:
   ```javascript
   // middleware/validate.js
   export function validate(schema) {
     return (req, res, next) => {
       // Validate request body/query/params
     };
   }
   ```

4. Apply validation to all API routes

**Files to Create:**
- `utils/validators/schemas.js`
- `middleware/validate.js`

**Files to Modify:**
- All API route handlers

**Acceptance Criteria:**
- ✅ All API inputs validated
- ✅ Clear validation error messages
- ✅ Type-safe validation

---

#### Task 1.4: Implement Rate Limiting
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours

**Actions:**
1. Install rate limiting library:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. Create rate limiter:
   ```javascript
   // utils/rateLimiter.js
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   
   export const rateLimiter = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, "10 s"),
   });
   ```

3. Create rate limit middleware:
   ```javascript
   // middleware/rateLimit.js
   export async function rateLimit(req) {
     const identifier = req.headers.get("x-forwarded-for") || "anonymous";
     const { success } = await rateLimiter.limit(identifier);
     if (!success) throw new AppError("Rate limit exceeded", 429);
   }
   ```

4. Apply to sensitive routes (CV analysis, job matching, etc.)

**Files to Create:**
- `utils/rateLimiter.js`
- `middleware/rateLimit.js`

**Files to Modify:**
- Critical API routes

**Acceptance Criteria:**
- ✅ Rate limiting on sensitive endpoints
- ✅ Configurable limits per endpoint
- ✅ Proper error responses

---

#### Task 1.5: Database Index Optimization
**Priority:** 🟡 High  
**Estimated Time:** 3 hours

**Actions:**
1. Analyze query patterns
2. Create migration for indexes:
   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_userprofile_userid ON "UserProfile"("userId");
   CREATE INDEX idx_userprofile_email ON "UserProfile"("email");
   CREATE INDEX idx_useranswer_mockid ON "userAnswer"("mockId");
   CREATE INDEX idx_useranswer_sessionid ON "userAnswer"("sessionId");
   CREATE INDEX idx_jobrecommendation_userid ON "JobRecommendation"("userId");
   CREATE INDEX idx_chatmessages_conversationid ON "ChatMessages"("conversationId");
   CREATE INDEX idx_chatmessages_createdat ON "ChatMessages"("createdAt");
   ```

3. Run migration

**Files to Create:**
- `drizzle/migrations/add_indexes.sql`
- `drizzle/migrations/XXXX_add_indexes.ts`

**Acceptance Criteria:**
- ✅ Indexes added for all frequently queried fields
- ✅ Query performance improved
- ✅ Migration tested

---

### Frontend Tasks

#### Task 1.6: Add Error Boundaries
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours

**Actions:**
1. Create error boundary component:
   ```javascript
   // components/ErrorBoundary.jsx
   import React from 'react';
   
   export class ErrorBoundary extends React.Component {
     // Standard React error boundary
   }
   ```

2. Wrap main app sections:
   - Dashboard layout
   - Job seeker pages
   - Interview components

**Files to Create:**
- `components/ErrorBoundary.jsx`
- `components/ErrorFallback.jsx`

**Files to Modify:**
- `app/layout.js`
- `app/dashboard/layout.jsx`
- `app/job-seeker/page.jsx`

**Acceptance Criteria:**
- ✅ Error boundaries on all major sections
- ✅ User-friendly error messages
- ✅ Error reporting to logging service

---

#### Task 1.7: Implement Loading States
**Priority:** 🟡 High  
**Estimated Time:** 6 hours

**Actions:**
1. Create loading component library:
   ```javascript
   // components/ui/loading.jsx
   export function LoadingSpinner() { }
   export function LoadingSkeleton() { }
   export function LoadingOverlay() { }
   ```

2. Add loading states to:
   - CV upload/analysis
   - Job recommendations
   - Interview creation
   - Chat messages
   - Profile updates

**Files to Create:**
- `components/ui/loading.jsx`
- `hooks/useLoading.jsx`

**Files to Modify:**
- All async operation components

**Acceptance Criteria:**
- ✅ Loading states on all async operations
- ✅ Consistent loading UI
- ✅ Skeleton screens for better UX

---

#### Task 1.8: Add Input Sanitization
**Priority:** 🔴 Critical  
**Estimated Time:** 3 hours

**Actions:**
1. Install sanitization library:
   ```bash
   npm install dompurify
   ```

2. Create sanitization utility:
   ```javascript
   // utils/sanitize.js
   import DOMPurify from 'dompurify';
   
   export function sanitizeInput(input) {
     return DOMPurify.sanitize(input);
   }
   ```

3. Apply to user inputs (chat, profile, etc.)

**Files to Create:**
- `utils/sanitize.js`

**Files to Modify:**
- Chat components
- Profile forms
- Job posting forms

**Acceptance Criteria:**
- ✅ All user inputs sanitized
- ✅ XSS protection implemented
- ✅ No breaking of valid content

---

## Phase 2: Performance & Optimization (Week 2)

### 🎯 Goal: Optimize performance and user experience

---

### Backend Tasks

#### Task 2.1: Implement API Response Caching
**Priority:** 🟡 High  
**Estimated Time:** 6 hours

**Actions:**
1. Install caching library:
   ```bash
   npm install @vercel/kv
   ```

2. Create cache utility:
   ```javascript
   // utils/cache.js
   import { kv } from '@vercel/kv';
   
   export async function getCached(key, fetcher, ttl = 3600) {
     const cached = await kv.get(key);
     if (cached) return cached;
     const data = await fetcher();
     await kv.setex(key, ttl, JSON.stringify(data));
     return data;
   }
   ```

3. Add caching to:
   - Job recommendations (5 min TTL)
   - Job details (10 min TTL)
   - User profiles (1 min TTL)

**Files to Create:**
- `utils/cache.js`

**Files to Modify:**
- `app/api/job-recommendations/route.js`
- `app/api/job-details/route.js`
- `app/api/user-profile/route.js`

**Acceptance Criteria:**
- ✅ Caching implemented for expensive operations
- ✅ Cache invalidation on updates
- ✅ Performance improvement measurable

---

#### Task 2.2: Optimize Database Queries
**Priority:** 🟡 High  
**Estimated Time:** 8 hours

**Actions:**
1. Review slow queries
2. Add query optimization:
   - Use select() to limit fields
   - Add proper joins
   - Implement pagination
   - Add query result caching

3. Optimize specific queries:
   - Job recommendations query
   - Interview list queries
   - Chat message queries

**Files to Modify:**
- All API routes with database queries

**Acceptance Criteria:**
- ✅ Query response times < 200ms
- ✅ Proper pagination implemented
- ✅ No N+1 query problems

---

#### Task 2.3: Migrate File Storage to Cloud
**Priority:** 🔴 Critical  
**Estimated Time:** 8 hours

**Actions:**
1. Set up cloud storage (Vercel Blob or AWS S3):
   ```bash
   npm install @vercel/blob
   ```

2. Create file upload service:
   ```javascript
   // utils/fileStorage.js
   import { put } from '@vercel/blob';
   
   export async function uploadFile(file, path) {
     const blob = await put(path, file, {
       access: 'public',
     });
     return blob.url;
   }
   ```

3. Update file upload endpoints:
   - CV upload
   - Profile photo upload
   - Interview recordings (if storing)

4. Migrate existing files (if any)

**Files to Create:**
- `utils/fileStorage.js`
- `scripts/migrateFiles.js`

**Files to Modify:**
- `app/api/cv-analyze/route.js`
- `app/api/profile-photo/route.js`

**Acceptance Criteria:**
- ✅ All files stored in cloud
- ✅ CDN URLs for file access
- ✅ File cleanup on deletion

---

### Frontend Tasks

#### Task 2.4: Implement Code Splitting
**Priority:** 🟡 High  
**Estimated Time:** 6 hours

**Actions:**
1. Use dynamic imports for heavy components:
   ```javascript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <LoadingSkeleton />,
   });
   ```

2. Split routes:
   - Dashboard pages
   - Interview components
   - Chat components
   - Job matching components

3. Lazy load ML models:
   - Face-api.js models
   - Job matcher model

**Files to Modify:**
- `app/dashboard/**/page.jsx`
- `app/job-seeker/**/page.jsx`
- `app/interview/**/page.jsx`

**Acceptance Criteria:**
- ✅ Initial bundle size reduced by 40%+
- ✅ Route-based code splitting
- ✅ Lazy loading for heavy components

---

#### Task 2.5: Optimize Images
**Priority:** 🟡 High  
**Estimated Time:** 4 hours

**Actions:**
1. Replace all `<img>` with Next.js `<Image>`
2. Add image optimization:
   - Proper sizing
   - Lazy loading
   - WebP format
   - Responsive images

3. Optimize profile photos
4. Optimize logo and assets

**Files to Modify:**
- All components using images
- `components/UserAvatar.jsx`
- Landing page components

**Acceptance Criteria:**
- ✅ All images use Next.js Image
- ✅ Proper image sizing
- ✅ Lazy loading implemented
- ✅ Reduced image load times

---

#### Task 2.6: Add Memoization
**Priority:** 🟢 Medium  
**Estimated Time:** 4 hours

**Actions:**
1. Add React.memo to expensive components:
   - Interview list items
   - Job recommendation cards
   - Chat message components

2. Use useMemo for expensive calculations:
   - Job matching scores
   - Filtered lists
   - Sorted data

3. Use useCallback for event handlers:
   - Form submissions
   - API calls
   - Event handlers

**Files to Modify:**
- `app/dashboard/_components/InterviewList.jsx`
- `app/job-seeker/_components/JobRecommendations.jsx`
- `app/dashboard/chat/**/*.jsx`

**Acceptance Criteria:**
- ✅ Reduced re-renders
- ✅ Improved performance metrics
- ✅ Smooth scrolling and interactions

---

## Phase 3: Security Hardening (Week 3)

### 🎯 Goal: Secure the application for production

---

### Backend Tasks

#### Task 3.1: Implement CSRF Protection
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours

**Actions:**
1. Install CSRF library:
   ```bash
   npm install csrf
   ```

2. Create CSRF middleware:
   ```javascript
   // middleware/csrf.js
   import csrf from 'csrf';
   
   export function csrfProtection(req, res, next) {
     // Verify CSRF token
   }
   ```

3. Add CSRF tokens to forms

**Files to Create:**
- `middleware/csrf.js`

**Files to Modify:**
- All POST/PUT/DELETE API routes
- All forms in frontend

**Acceptance Criteria:**
- ✅ CSRF protection on all state-changing operations
- ✅ Tokens generated and validated
- ✅ No breaking of legitimate requests

---

#### Task 3.2: Secure File Uploads
**Priority:** 🔴 Critical  
**Estimated Time:** 6 hours

**Actions:**
1. Add file validation:
   - File type checking (magic numbers)
   - File size limits
   - Virus scanning (optional, future)

2. Update file upload endpoints:
   ```javascript
   // Validate file
   const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
   const maxSize = 10 * 1024 * 1024; // 10MB
   
   if (!allowedTypes.includes(file.mimetype)) {
     throw new AppError('Invalid file type', 400);
   }
   if (file.size > maxSize) {
     throw new AppError('File too large', 400);
   }
   ```

**Files to Modify:**
- `app/api/cv-analyze/route.js`
- `app/api/profile-photo/route.js`

**Acceptance Criteria:**
- ✅ File type validation
- ✅ File size limits enforced
- ✅ Secure file storage

---

#### Task 3.3: Review Environment Variables
**Priority:** 🔴 Critical  
**Estimated Time:** 2 hours

**Actions:**
1. Audit all environment variable usage
2. Ensure no secrets in client code
3. Create `.env.example` file:
   ```env
   # Database
   NEXT_PUBLIC_DRIZZLE_DB_URL=
   
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   
   # AI Services
   NEXT_PUBLIC_OPENAI_API_KEY=
   
   # Storage
   BLOB_READ_WRITE_TOKEN=
   
   # Rate Limiting
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```

4. Document all required variables

**Files to Create:**
- `.env.example`
- `docs/ENVIRONMENT_VARIABLES.md`

**Files to Review:**
- All files using `process.env`

**Acceptance Criteria:**
- ✅ No secrets in client code
- ✅ All variables documented
- ✅ `.env.example` complete

---

#### Task 3.4: Add Request Logging
**Priority:** 🟡 High  
**Estimated Time:** 4 hours

**Actions:**
1. Install logging library:
   ```bash
   npm install pino pino-pretty
   ```

2. Create logger:
   ```javascript
   // utils/logger.js
   import pino from 'pino';
   
   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
   });
   ```

3. Add logging to API routes:
   - Request logging
   - Error logging
   - Performance logging

**Files to Create:**
- `utils/logger.js`

**Files to Modify:**
- All API routes

**Acceptance Criteria:**
- ✅ Structured logging implemented
- ✅ Error logs include context
- ✅ Performance metrics logged

---

### Frontend Tasks

#### Task 3.5: Add Security Headers
**Priority:** 🟡 High  
**Estimated Time:** 2 hours

**Actions:**
1. Update `next.config.mjs`:
   ```javascript
   const securityHeaders = [
     {
       key: 'X-DNS-Prefetch-Control',
       value: 'on'
     },
     {
       key: 'Strict-Transport-Security',
       value: 'max-age=63072000; includeSubDomains; preload'
     },
     {
       key: 'X-Frame-Options',
       value: 'SAMEORIGIN'
     },
     {
       key: 'X-Content-Type-Options',
       value: 'nosniff'
     },
     {
       key: 'X-XSS-Protection',
       value: '1; mode=block'
     },
     {
       key: 'Referrer-Policy',
       value: 'origin-when-cross-origin'
     }
   ];
   ```

**Files to Modify:**
- `next.config.mjs`

**Acceptance Criteria:**
- ✅ Security headers configured
- ✅ Headers verified in production

---

## Phase 4: Feature Completion (Week 4)

### 🎯 Goal: Complete missing critical features

---

### Backend Tasks

#### Task 4.1: Fix Job Matcher Model Loading
**Priority:** 🟡 High  
**Estimated Time:** 8 hours

**Actions:**
1. Investigate model loading issues
2. Options:
   - Use client-side model loading
   - Use external API for model inference
   - Optimize server-side loading
   - Use edge functions

3. Implement solution:
   ```javascript
   // Option: Use edge function for model inference
   // utils/jobMatcherEdge.js
   export async function matchJobsEdge(candidate, jobs) {
     // Use edge-compatible model loading
   }
   ```

**Files to Modify:**
- `utils/jobMatcherModel.js`
- `app/api/job-recommendations/route.js`

**Acceptance Criteria:**
- ✅ Model loads reliably
- ✅ Recommendations work consistently
- ✅ Fallback still works

---

#### Task 4.2: Implement Job Editing
**Priority:** 🟡 High  
**Estimated Time:** 4 hours

**Actions:**
1. Create job update endpoint:
   ```javascript
   // app/api/job-details/[jobId]/route.js
   export async function PUT(req, { params }) {
     // Update job details
   }
   ```

2. Add validation
3. Add authorization (only creator can edit)

**Files to Modify:**
- `app/api/job-details/[jobId]/route.js`

**Files to Create:**
- `app/dashboard/post-job/edit/[jobId]/page.jsx`

**Acceptance Criteria:**
- ✅ Jobs can be edited
- ✅ Only authorized users can edit
- ✅ Validation works

---

#### Task 4.3: Add Interview Analytics
**Priority:** 🟢 Medium  
**Estimated Time:** 6 hours

**Actions:**
1. Create analytics endpoints:
   ```javascript
   // app/api/interviews/analytics/route.js
   export async function GET(req) {
     // Return interview statistics
   }
   ```

2. Calculate metrics:
   - Total interviews
   - Average scores
   - Completion rates
   - Cheating detection stats

**Files to Create:**
- `app/api/interviews/analytics/route.js`

**Files to Modify:**
- `app/dashboard/page.jsx` (add analytics display)

**Acceptance Criteria:**
- ✅ Analytics endpoint works
- ✅ Dashboard shows analytics
- ✅ Data is accurate

---

### Frontend Tasks

#### Task 4.4: Complete Chat Real-time Updates
**Priority:** 🟡 High  
**Estimated Time:** 8 hours

**Actions:**
1. Implement polling or WebSocket:
   ```javascript
   // Option 1: Polling
   useEffect(() => {
     const interval = setInterval(() => {
       fetchMessages();
     }, 2000);
     return () => clearInterval(interval);
   }, []);
   
   // Option 2: WebSocket (better)
   const ws = new WebSocket(WS_URL);
   ws.onmessage = (event) => {
     const message = JSON.parse(event.data);
     setMessages(prev => [...prev, message]);
   };
   ```

2. Add message notifications
3. Add typing indicators (optional)

**Files to Modify:**
- `app/dashboard/chat/page.jsx`
- `app/job-seeker/chat/page.jsx`

**Files to Create:**
- `utils/websocket.js` (if using WebSocket)
- `hooks/useChat.jsx`

**Acceptance Criteria:**
- ✅ Real-time message updates
- ✅ Notifications work
- ✅ Good performance

---

#### Task 4.5: Improve Interview UI/UX
**Priority:** 🟡 High  
**Estimated Time:** 6 hours

**Actions:**
1. Add progress indicators
2. Improve video recording UI
3. Add retry functionality
4. Improve feedback display
5. Add keyboard shortcuts

**Files to Modify:**
- `app/dashboard/video-interview/**/*.jsx`
- `app/interview/**/*.jsx`

**Acceptance Criteria:**
- ✅ Better user experience
- ✅ Clear progress indication
- ✅ Intuitive controls

---

#### Task 4.6: Add Search & Filtering
**Priority:** 🟢 Medium  
**Estimated Time:** 6 hours

**Actions:**
1. Add job search:
   ```javascript
   // app/api/jobs/search/route.js
   export async function GET(req) {
     const { q, category, location } = req.query;
     // Search jobs
   }
   ```

2. Add filtering UI
3. Add sorting options

**Files to Create:**
- `app/api/jobs/search/route.js`
- `components/JobSearch.jsx`
- `components/JobFilters.jsx`

**Files to Modify:**
- `app/job-seeker/page.jsx`

**Acceptance Criteria:**
- ✅ Search works accurately
- ✅ Filters apply correctly
- ✅ Good performance

---

## Phase 5: Testing & Documentation (Week 5)

### 🎯 Goal: Add testing and documentation

---

### Backend Tasks

#### Task 5.1: Add API Tests
**Priority:** 🟡 High  
**Estimated Time:** 12 hours

**Actions:**
1. Set up testing framework:
   ```bash
   npm install --save-dev jest @testing-library/jest-environment-jsdom
   ```

2. Create test utilities:
   ```javascript
   // tests/utils/testHelpers.js
   export async function createTestUser() { }
   export async function cleanupTestData() { }
   ```

3. Write tests for critical APIs:
   - User profile APIs
   - CV analysis API
   - Job recommendations API
   - Interview evaluation API

**Files to Create:**
- `tests/setup.js`
- `tests/utils/testHelpers.js`
- `tests/api/user-profile.test.js`
- `tests/api/cv-analyze.test.js`
- `tests/api/job-recommendations.test.js`

**Acceptance Criteria:**
- ✅ Test framework set up
- ✅ Critical APIs have tests
- ✅ Tests pass consistently

---

#### Task 5.2: Create API Documentation
**Priority:** 🟡 High  
**Estimated Time:** 8 hours

**Actions:**
1. Set up API documentation:
   ```bash
   npm install swagger-ui-react swagger-jsdoc
   ```

2. Add JSDoc comments to API routes
3. Generate OpenAPI spec
4. Create API documentation page

**Files to Create:**
- `app/api-docs/page.jsx`
- `docs/API.md`

**Files to Modify:**
- All API routes (add JSDoc)

**Acceptance Criteria:**
- ✅ API documentation complete
- ✅ Interactive docs available
- ✅ Examples provided

---

### Frontend Tasks

#### Task 5.3: Add Component Tests
**Priority:** 🟢 Medium  
**Estimated Time:** 10 hours

**Actions:**
1. Set up React Testing Library
2. Write tests for critical components:
   - CV upload component
   - Interview components
   - Job recommendation components

**Files to Create:**
- `tests/components/CVUpload.test.jsx`
- `tests/components/InterviewCard.test.jsx`

**Acceptance Criteria:**
- ✅ Critical components tested
- ✅ Tests cover main use cases
- ✅ Tests are maintainable

---

#### Task 5.4: Create User Documentation
**Priority:** 🟢 Medium  
**Estimated Time:** 6 hours

**Actions:**
1. Create user guides:
   - Getting started guide
   - How to upload CV
   - How to take interviews
   - How to post jobs

2. Add help tooltips in UI
3. Create FAQ page

**Files to Create:**
- `docs/USER_GUIDE.md`
- `app/help/page.jsx`
- `app/faq/page.jsx`

**Acceptance Criteria:**
- ✅ User documentation complete
- ✅ Help accessible in app
- ✅ Clear instructions

---

## Phase 6: Monitoring & Deployment (Week 6)

### 🎯 Goal: Set up monitoring and prepare for production

---

### Backend Tasks

#### Task 6.1: Set Up Error Tracking
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours

**Actions:**
1. Set up Sentry:
   ```bash
   npm install @sentry/nextjs
   ```

2. Configure Sentry:
   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
   });
   ```

3. Add error boundaries
4. Add performance monitoring

**Files to Create:**
- `sentry.client.config.js`
- `sentry.server.config.js`
- `sentry.edge.config.js`

**Acceptance Criteria:**
- ✅ Error tracking configured
- ✅ Errors reported to Sentry
- ✅ Performance monitoring active

---

#### Task 6.2: Set Up Analytics
**Priority:** 🟡 High  
**Estimated Time:** 4 hours

**Actions:**
1. Set up analytics (Vercel Analytics or custom):
   ```bash
   npm install @vercel/analytics
   ```

2. Add event tracking:
   - User signups
   - CV uploads
   - Interview completions
   - Job applications

**Files to Modify:**
- `app/layout.js`
- Key user action components

**Acceptance Criteria:**
- ✅ Analytics configured
- ✅ Key events tracked
- ✅ Dashboard shows metrics

---

#### Task 6.3: Create Deployment Checklist
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours

**Actions:**
1. Create deployment checklist:
   ```markdown
   ## Pre-Deployment Checklist
   
   ### Environment Variables
   - [ ] All environment variables set in Vercel
   - [ ] Database URL configured
   - [ ] API keys configured
   - [ ] No secrets in code
   
   ### Database
   - [ ] Migrations run
   - [ ] Indexes created
   - [ ] Backup strategy in place
   
   ### Security
   - [ ] Rate limiting configured
   - [ ] CSRF protection enabled
   - [ ] Security headers set
   - [ ] File upload validation
   
   ### Performance
   - [ ] Caching configured
   - [ ] CDN setup
   - [ ] Image optimization
   - [ ] Code splitting
   
   ### Monitoring
   - [ ] Error tracking configured
   - [ ] Analytics configured
   - [ ] Logging configured
   - [ ] Alerts set up
   ```

2. Create deployment script
3. Document deployment process

**Files to Create:**
- `docs/DEPLOYMENT.md`
- `scripts/deploy.sh`
- `.github/workflows/deploy.yml` (optional)

**Acceptance Criteria:**
- ✅ Deployment checklist complete
- ✅ Deployment process documented
- ✅ Can deploy reliably

---

### Frontend Tasks

#### Task 6.4: Add Performance Monitoring
**Priority:** 🟡 High  
**Estimated Time:** 3 hours

**Actions:**
1. Add Web Vitals tracking
2. Monitor Core Web Vitals:
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

3. Set up performance dashboard

**Files to Modify:**
- `app/layout.js`
- `next.config.mjs`

**Acceptance Criteria:**
- ✅ Performance metrics tracked
- ✅ Dashboard shows metrics
- ✅ Alerts for performance issues

---

#### Task 6.5: Final UI Polish
**Priority:** 🟢 Medium  
**Estimated Time:** 8 hours

**Actions:**
1. Review all pages for consistency
2. Fix UI bugs
3. Improve mobile responsiveness
4. Add loading skeletons
5. Improve error messages
6. Add tooltips and help text

**Files to Modify:**
- All frontend components

**Acceptance Criteria:**
- ✅ Consistent UI across app
- ✅ Mobile-friendly
- ✅ Good UX

---

## Summary & Next Steps

### Implementation Summary

**Total Estimated Time:** 180-200 hours (4-6 weeks with 1 developer)

**Phase Breakdown:**
- **Phase 1 (Week 1):** Critical cleanup - 40 hours
- **Phase 2 (Week 2):** Performance optimization - 35 hours
- **Phase 3 (Week 3):** Security hardening - 25 hours
- **Phase 4 (Week 4):** Feature completion - 35 hours
- **Phase 5 (Week 5):** Testing & documentation - 30 hours
- **Phase 6 (Week 6):** Monitoring & deployment - 20 hours

### Priority Order

**🔴 Critical (Must Have):**
1. Clean up test routes
2. Error handling
3. Input validation
4. Rate limiting
5. File storage migration
6. Security hardening
7. Error tracking

**🟡 High (Should Have):**
1. Performance optimization
2. Database optimization
3. Code splitting
4. Caching
5. Analytics
6. API documentation

**🟢 Medium (Nice to Have):**
1. Testing infrastructure
2. Component tests
3. User documentation
4. UI polish

### Quick Wins (Can Do First)

1. **Remove test routes** (4 hours) - Immediate cleanup
2. **Add error boundaries** (4 hours) - Better error handling
3. **Implement loading states** (6 hours) - Better UX
4. **Add input validation** (8 hours) - Security improvement
5. **Optimize images** (4 hours) - Performance boost

### Risk Mitigation

**High Risk Areas:**
1. **Job Matcher Model:** May need alternative solution
2. **File Storage Migration:** Need to migrate existing files
3. **Database Performance:** May need query optimization
4. **Real-time Chat:** WebSocket implementation complexity

**Mitigation Strategies:**
- Have fallback solutions ready
- Test migrations in staging first
- Monitor performance closely
- Start with polling, upgrade to WebSocket later

### Success Metrics

**Technical Metrics:**
- ✅ Zero critical security vulnerabilities
- ✅ API response time < 200ms (p95)
- ✅ Error rate < 0.1%
- ✅ Test coverage > 60% for critical paths
- ✅ Lighthouse score > 90

**Business Metrics:**
- ✅ User signup completion rate > 80%
- ✅ CV upload success rate > 95%
- ✅ Interview completion rate > 70%
- ✅ Job match accuracy > 85%

### Next Steps

1. **Review this plan** with team
2. **Prioritize tasks** based on business needs
3. **Set up project management** (Jira, Linear, etc.)
4. **Create staging environment**
5. **Start with Phase 1** tasks
6. **Daily standups** to track progress
7. **Weekly reviews** to adjust plan

---

## Appendix: File Structure After Implementation

```
I-Hire-AI-Interviewer/
├── app/
│   ├── api/
│   │   ├── admin/              # Protected admin routes
│   │   │   └── debug/
│   │   ├── chat/
│   │   ├── cv-analyze/
│   │   ├── interviews/
│   │   ├── jobs/
│   │   └── user-profile/
│   ├── dashboard/
│   ├── job-seeker/
│   └── help/                   # New: Help pages
├── components/
│   ├── ErrorBoundary.jsx       # New
│   └── ui/
│       └── loading.jsx         # New
├── docs/                        # New: Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENT_VARIABLES.md
│   └── USER_GUIDE.md
├── middleware/
│   ├── csrf.js                 # New
│   ├── errorMiddleware.js      # New
│   ├── rateLimit.js            # New
│   └── validate.js             # New
├── scripts/
│   ├── deploy.sh               # New
│   └── migrateFiles.js         # New
├── tests/                       # New: Tests
│   ├── api/
│   ├── components/
│   └── utils/
├── utils/
│   ├── cache.js                # New
│   ├── errorHandler.js         # New
│   ├── fileStorage.js          # New
│   ├── logger.js               # New
│   ├── rateLimiter.js          # New
│   ├── sanitize.js             # New
│   └── validators/
│       └── schemas.js          # New
└── .github/
    └── workflows/
        └── deploy.yml          # New: CI/CD
```

---

**Document Prepared By:** Senior Full-Stack Startup Engineer & Technical Product Architect  
**Last Updated:** February 9, 2026  
**Status:** Ready for Implementation