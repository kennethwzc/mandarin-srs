# URGENT: User Registration & Data Loading Bug

## Bug Description
After creating a new account, confirming email, and logging in, the dashboard fails to load user data. The error "Tenant or user not found" appears, indicating that the user/tenant record is not being properly created or associated during the registration flow.

## Environment
- **Deployment**: Vercel Production
- **URL**: [Your production Vercel URL]
- **User Flow**: Registration → Email Confirmation → Login → Dashboard/Lessons
- **Browser**: [All browsers affected]
- **Database**: PostgreSQL (Neon)

## Steps to Reproduce
1. Navigate to registration page
2. Enter email and password
3. Click "Create Account"
4. Check email and click confirmation link
5. Log in with the same credentials
6. Navigate to dashboard
7. Observe "Failed to load dashboard data" error
8. Navigate to lessons page
9. Observe "Error Loading Lessons - Tenant or user not found"

## Expected Behavior
1. User creates account successfully
2. User confirms email
3. User logs in
4. Dashboard loads with user data (even if empty/default state)
5. Lessons page loads properly (even if no lessons yet)
6. If email already exists, show clear error message: "This email is already registered"

## Actual Behavior
1. User registration appears successful
2. Email confirmation works
3. Login succeeds (authentication works)
4. Dashboard shows: **"Failed to load dashboard data"**
5. Lessons page shows: **"Error Loading Lessons - An error occurred while loading lessons. Error Details: Tenant or user not found"**

## Error Messages/Console Logs
```
Error: Tenant or user not found
Location: Lessons page, Dashboard page
```

## Root Cause Analysis Needed
The error "Tenant or user not found" suggests:
1. **User record is created in auth system but NOT in application database**
2. **Tenant record is not being created during registration**
3. **User-tenant association is missing**
4. **Registration flow is incomplete** - it's only creating auth credentials but not the full user profile

## Files to Investigate

### Authentication & Registration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/app/api/auth/register/route.ts` - Registration endpoint
- `src/lib/auth.ts` - Auth utilities
- Any email confirmation handler files

### Database Schema
- `src/db/schema.ts` - Check users, tenants, and userTenants tables
- Migration files - Verify schema is correct

### User/Tenant Creation Logic
- Search for where users are created: `grep -r "INSERT INTO users" src/`
- Search for where tenants are created: `grep -r "INSERT INTO tenants" src/`
- Search for user-tenant associations
- Check if there's a signup webhook or callback that should trigger user creation

### Dashboard & Lessons Pages
- `src/app/dashboard/page.tsx` - Dashboard component
- `src/app/lessons/page.tsx` - Lessons component
- API routes these pages call (likely `/api/dashboard` or `/api/lessons`)

## Required Fixes

### 1. Complete Registration Flow
**Problem**: Registration only creates auth credentials, not application user/tenant records

**Fix Needed**:
```typescript
// In registration endpoint (e.g., src/app/api/auth/register/route.ts)
// After creating auth user, MUST also:

1. Create tenant record in database
2. Create user record in application database (not just auth)
3. Associate user with tenant in userTenants table
4. Set up default user preferences/settings
5. Return appropriate success/error responses
```

### 2. Add Error Handling for Existing Emails
**Problem**: No validation if email already exists

**Fix Needed**:
- Check if email exists BEFORE attempting to create account
- Return clear error message: "This email is already registered. Please log in or use password reset."
- HTTP status 409 (Conflict) for duplicate emails

### 3. Fix Data Loading After Login
**Problem**: Dashboard and lessons can't find user/tenant data

**Fix Needed**:
- Ensure API routes check for user existence properly
- If user doesn't exist in app DB but exists in auth, trigger user creation
- Add better error handling with specific error messages
- Consider adding a "first login" flow that ensures user data exists

### 4. Add Graceful Error Handling
**Fix Needed in UI**:
- Dashboard: Show helpful message if user data is missing
- Lessons: Show helpful message with action button (e.g., "Contact Support" or retry)
- Add logging to capture these errors for debugging

## Database Schema Check
Verify these tables exist and have proper relationships:
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  -- other fields
);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  -- other fields
);

-- User-Tenant association
CREATE TABLE user_tenants (
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  role TEXT,
  PRIMARY KEY (user_id, tenant_id)
);
```

## Vercel-Specific Checks
- [ ] Check Vercel function logs for registration API route
- [ ] Verify DATABASE_URL environment variable is set correctly
- [ ] Check if database connection works in serverless functions
- [ ] Verify email confirmation callback URL is correct for production domain
- [ ] Check if any middleware is blocking requests

## Testing Checklist After Fix
- [ ] New user can register with email/password
- [ ] User receives confirmation email
- [ ] User can confirm email successfully
- [ ] User can log in after confirmation
- [ ] Dashboard loads without errors
- [ ] Lessons page loads without errors
- [ ] Attempting to register with existing email shows clear error
- [ ] Error messages are user-friendly
- [ ] All user data is properly created and associated

---

## Instructions for Cursor

**PRIMARY OBJECTIVE**: Fix the incomplete user registration flow that's causing "Tenant or user not found" errors

**Steps to take**:

1. **Locate the registration endpoint** (`src/app/api/auth/register/route.ts` or similar)
   - Examine what happens when a user registers
   - Check if it creates BOTH auth credentials AND application database records

2. **Identify the missing pieces**:
   - Is a user record created in the users table?
   - Is a tenant created for the new user?
   - Is the user-tenant association created?

3. **Implement complete registration flow**:
   - Create tenant record (one per user or shared tenant logic)
   - Create user record with proper fields
   - Create user-tenant association
   - Add transaction handling (rollback if any step fails)
   - Add proper error handling

4. **Add email validation**:
   - Check if email exists before creating account
   - Return 409 status with clear message if duplicate

5. **Add safety checks in data loading**:
   - In dashboard/lessons API routes, handle missing user gracefully
   - Consider adding auto-repair logic (if auth user exists but app user doesn't, create it)

6. **Test the complete flow**:
   - Ensure new user registration creates all necessary records
   - Verify login works and data loads properly
   - Confirm error messages are clear and helpful

**Focus on**: The registration/signup flow and ensuring all database records are created properly when a new user signs up.
