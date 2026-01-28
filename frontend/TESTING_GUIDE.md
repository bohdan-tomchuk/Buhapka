# API Client Refactoring - Testing Guide

## Overview

This guide walks through testing the refactored API client to verify all critical bugs are fixed and the cookie-based authentication works correctly.

## Prerequisites

1. Start the application:
   ```bash
   docker compose up
   ```

2. Verify services are running:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Test Scenarios

### 1. ✅ Body Serialization - JSON (Bug Fix)

**Test:** Create expense without receipt file

1. Navigate to http://localhost:3000
2. Login with credentials (create account if needed)
3. Click "Create Expense" or go to expenses page
4. Fill out expense form WITHOUT uploading a receipt:
   - Description: "Test JSON serialization"
   - Amount: 100
   - Category: PARTS
   - Source: CASH
   - Currency: UAH
5. Click "Create Expense"
6. Open DevTools → Network tab
7. Find the POST request to `/api/expenses`
8. Check Request Payload - should show proper JSON:
   ```json
   {
     "description": "Test JSON serialization",
     "amount": 100,
     "category": "PARTS",
     "source": "CASH",
     "currency": "UAH"
   }
   ```

**Expected:** ✅ Expense created successfully, not `[object Object]`

**Verification:** Check backend logs for successful expense creation:
```bash
docker compose logs backend | grep -i "POST /api/expenses"
```

---

### 2. ✅ Body Serialization - FormData (Bug Fix)

**Test:** Create expense with receipt file

1. Go to expenses page
2. Click "Create Expense"
3. Fill out form WITH file upload:
   - Description: "Test FormData serialization"
   - Amount: 200
   - Category: TOOLS
   - Source: FUND_ACCOUNT
   - Currency: USD
   - Receipt: Upload any image/PDF file
4. Click "Create Expense"
5. Open DevTools → Network tab
6. Find the POST request to `/api/expenses`
7. Check Request Headers:
   - `Content-Type` should be `multipart/form-data; boundary=...`
   - Should NOT be `application/json`
8. Check Request Payload:
   - Should show FormData with fields and file

**Expected:** ✅ Expense created with receipt attached

**Verification:**
```bash
# Check backend logs
docker compose logs backend | grep -i "receipt"

# Check uploaded file exists
docker exec buhapka-backend ls -la /app/uploads
```

---

### 3. ✅ Config Key Mismatch (Bug Fix)

**Test:** API client initializes without errors

1. Open browser console (F12)
2. Navigate to http://localhost:3000
3. Check console for errors

**Expected:** ✅ No errors about `config.public.apiBase` or undefined

**What was fixed:**
- OLD: `config.public.apiBase` → `undefined` → runtime error
- NEW: `config.public.apiBaseUrl` → `http://backend:3001` → works

---

### 4. ✅ Report API Integration (Critical Fix)

**Test:** Generate PDF report using API client

1. Go to http://localhost:3000/reports
2. Select date range (e.g., last month)
3. Click "Generate Report"
4. Open DevTools → Network tab
5. Find POST request to `/api/reports/pdf`
6. Check Request Headers:
   - Should have `Cookie: access_token=...` (authentication)
   - Should have `Content-Type: application/json`
7. Check Response:
   - Type should be `application/pdf` or `blob`
   - Size should be > 0

**Expected:** ✅ PDF downloads automatically

**What was fixed:**
- OLD: Used raw `fetch()` → no auth headers, no token refresh, inconsistent errors
- NEW: Uses `useApi()` → automatic auth, token refresh, consistent error handling

---

### 5. ✅ Cookie-Based Authentication (Architecture Fix)

**Test:** Login sets httpOnly cookies

1. Logout if logged in
2. Navigate to http://localhost:3000/login
3. Open DevTools → Application tab → Cookies
4. Clear all cookies for `localhost:3000`
5. Login with valid credentials
6. Check Cookies section - should see:
   - `access_token` (httpOnly: ✓, expires: 15min)
   - `refresh_token` (httpOnly: ✓, expires: 7 days)

**Expected:** ✅ Both cookies present with httpOnly flag set

**Important:** httpOnly cookies are NOT accessible via JavaScript (`document.cookie` won't show them)

---

### 6. ✅ Automatic Token Refresh

**Test:** Access token refresh happens automatically

**Method 1: Wait for expiration**
1. Login successfully
2. Note the access token expiry (Max-Age: 900 = 15 minutes)
3. Wait 15 minutes
4. Navigate to expenses or any protected page
5. Open DevTools → Network tab
6. Should see automatic POST to `/api/auth/refresh`
7. New access_token cookie set
8. Original request succeeds

**Method 2: Manual deletion** (faster)
1. Login successfully
2. Go to DevTools → Application → Cookies
3. Delete the `access_token` cookie (keep `refresh_token`)
4. Navigate to expenses page
5. Watch Network tab:
   - First request to `/api/expenses` → 401
   - Automatic POST to `/api/auth/refresh` → 200
   - Retry `/api/expenses` → 200 with data

**Expected:** ✅ Seamless refresh, no login prompt, data loads

---

### 7. ✅ Race Condition Prevention

**Test:** Multiple simultaneous requests don't cause duplicate refreshes

1. Login successfully
2. Delete `access_token` cookie (keep `refresh_token`)
3. Open browser console
4. Paste and run this code:
   ```javascript
   // Make 5 simultaneous requests when token is expired
   Promise.all([
     fetch('http://localhost:3001/api/expenses', { credentials: 'include' }),
     fetch('http://localhost:3001/api/expenses', { credentials: 'include' }),
     fetch('http://localhost:3001/api/expenses', { credentials: 'include' }),
     fetch('http://localhost:3001/api/expenses', { credentials: 'include' }),
     fetch('http://localhost:3001/api/expenses', { credentials: 'include' })
   ]).then(responses => {
     console.log('All requests completed:', responses.map(r => r.status));
   });
   ```
5. Check Network tab

**Expected:** ✅ Only ONE POST to `/api/auth/refresh`, all 5 requests succeed

**What was fixed:**
- OLD: 5 simultaneous 401s → 5 refresh attempts → race conditions
- NEW: 5 simultaneous 401s → 1 refresh, 4 queued → all succeed after refresh

---

### 8. ✅ FormData Content-Type Handling

**Test:** FormData doesn't get wrong Content-Type

1. Create expense with receipt (see test #2)
2. Open Network tab → POST `/api/expenses`
3. Check Request Headers

**Expected:**
- ✅ `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...`
- ❌ NOT `Content-Type: application/json` (this would break file upload)

**What was fixed:**
- OLD: Always set `Content-Type: application/json` → conflicts with FormData boundary
- NEW: Detect FormData, let browser set Content-Type with boundary

---

### 9. ✅ Error Handling - Status Codes

**Test:** Different error codes show appropriate messages

**401 Unauthorized:**
1. Logout
2. Try to access http://localhost:3000/expenses directly
3. Should redirect to login

**422 Validation Error:**
1. Try to create expense with invalid data (e.g., negative amount)
2. Should show validation error toast

**500 Server Error:**
1. Stop backend: `docker stop buhapka-backend`
2. Try any operation
3. Should show server error toast
4. Restart backend: `docker start buhapka-backend`

**Network Error:**
1. In DevTools → Network tab, set throttling to "Offline"
2. Try any operation
3. Should show "Network error. Please check your internet connection."
4. Set throttling back to "No throttling"

**Expected:** ✅ User-friendly error messages in toast notifications

---

### 10. ✅ Logout Functionality

**Test:** Logout clears cookies and redirects

1. Login successfully
2. Verify cookies are present (DevTools → Application → Cookies)
3. Click logout button
4. Check cookies - should be cleared
5. Try to access protected page (e.g., /expenses)
6. Should redirect to /login

**Expected:** ✅ Cookies cleared, redirected to login

---

## Backend Verification

### Check CORS Configuration

```bash
# View backend main.ts
docker exec buhapka-backend cat /app/src/main.ts | grep -A 3 "enableCors"
```

**Expected:**
```typescript
app.enableCors({
  origin: true,
  credentials: true, // ✅ Required for cookies
});
```

### Check Auth Controller

```bash
# View auth controller login method
docker exec buhapka-backend cat /app/src/auth/auth.controller.ts | grep -A 15 "@Post('login')"
```

**Expected:** Sets httpOnly cookies for `access_token` and `refresh_token`

### Check Backend Logs

```bash
# Watch backend logs in real-time
docker compose logs -f backend

# Filter for errors
docker compose logs backend | grep -i error

# Check authentication logs
docker compose logs backend | grep -i "auth"
```

---

## Performance Checks

### 1. Request Count

**Scenario:** Navigate to expenses page
**Expected:** Minimal requests
- 1x GET `/api/expenses` (data)
- 0x refresh (if token valid)

**Scenario:** Navigate to expenses with expired token
**Expected:**
- 1x GET `/api/expenses` → 401
- 1x POST `/api/auth/refresh` → 200
- 1x GET `/api/expenses` (retry) → 200

### 2. Response Times

Check Network tab → Timing
- Auth requests: < 100ms
- Data requests: < 200ms
- Token refresh: < 150ms

---

## Debugging Tips

### View Cookie Details

```javascript
// Run in browser console
document.cookie // Won't show httpOnly cookies (by design)

// Check in DevTools instead:
// Application tab → Cookies → http://localhost:3000
```

### Monitor API Calls

```javascript
// Log all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args[0], args[1]);
  return originalFetch.apply(this, args);
};
```

### Check Pinia Store State

```javascript
// Run in browser console (with Vue DevTools)
$nuxt.$pinia.state.value.user
```

### View Network Errors

DevTools → Network tab → Right-click request → Copy as cURL
Paste in terminal to debug

---

## Success Criteria

All tests should pass with:
- ✅ No `[object Object]` in request bodies
- ✅ No config initialization errors
- ✅ Reports generate and download successfully
- ✅ httpOnly cookies set on login
- ✅ Automatic token refresh without user action
- ✅ No duplicate refresh requests
- ✅ FormData uploads work correctly
- ✅ User-friendly error messages
- ✅ Logout clears cookies
- ✅ No TypeScript errors in console

---

## Known Issues & Limitations

### No User Profile Endpoint
The backend doesn't have a `/me` endpoint to fetch user profile. The frontend only tracks authentication state (logged in/out), not user details.

**Workaround:** Use `checkAuth()` to verify cookie validity by making a test request to a protected endpoint (`/api/expenses`).

**Future Enhancement:** Add `/api/auth/me` endpoint to backend that returns user profile.

### SameSite Cookie Setting
Backend sets cookies with `sameSite: 'strict'`. This is secure but may cause issues if frontend and backend are on different domains/ports in some environments.

**Current:** Works fine with Docker Compose (frontend proxies through backend)

---

## Rollback Plan

If issues are found, the previous implementation can be restored:

```bash
# Restore from git
git checkout HEAD~1 frontend/src/shared/api/
git checkout HEAD~1 frontend/src/entities/*/api/
git checkout HEAD~1 frontend/src/entities/user/model/store.ts
git checkout HEAD~1 frontend/src/app/middleware/auth.ts

# Restart frontend
docker compose restart frontend
```

---

## Additional Resources

- **API Client Docs:** `frontend/src/shared/api/base.ts`
- **Type Definitions:** `frontend/src/shared/api/types.ts`
- **Refactor Summary:** `frontend/API_CLIENT_REFACTOR.md`
- **Project Docs:** `CLAUDE.md`

---

## Report Issues

If you encounter any issues during testing:

1. Check browser console for errors
2. Check Network tab for failed requests
3. Check backend logs: `docker compose logs backend`
4. Verify cookies in DevTools → Application
5. Document steps to reproduce
6. Create issue with error messages and screenshots
