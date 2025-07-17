# Project Restructuring Plan

## Overview
This document outlines the steps to restructure the Next.js application by:
1. Grouping `admin` and `dashboard` folders into an unrouted `(dashboard)` group
2. Renaming the student dashboard from `dashboard` to `student` and updating all related endpoints
3. Grouping `login` and `signup` folders into an unrouted `(auth)` group

## Current Structure Analysis

### Frontend Routes
- `/src/app/admin/` - Admin dashboard page
- `/src/app/dashboard/` - Student dashboard page
- `/src/app/login/` - Login page
- `/src/app/signup/` - Signup page

### API Routes
- `/src/app/api/dashboard/` - Dashboard-related API endpoints
  - `/api/dashboard/route.ts`
  - `/api/dashboard/stats/`
  - `/api/dashboard/student-stats/`
- `/src/app/api/auth/` - Authentication API endpoints
- Other API routes: admin, enrollments, mentorship, platforms, submissions, tasks, transactions, users, wallet

### Key Files to Update
- `src/middleware.ts` - Route protection and redirects
- `src/app/dashboard/page.tsx` - Student dashboard component
- `src/app/admin/page.tsx` - Admin dashboard component
- `src/app/login/page.tsx` - Login page (redirects to `/dashboard`)
- `src/app/signup/page.tsx` - Signup page (redirects to `/login`)

## Implementation Steps

### Step 1: Create Route Groups Structure
**Status: ✅ Completed**

1.1. Create the `(dashboard)` route group directory
1.2. Create the `(auth)` route group directory
1.3. Move `admin` folder into `(dashboard)` group
1.4. Move `dashboard` folder into `(dashboard)` group and rename to `student`
1.5. Move `login` and `signup` folders into `(auth)` group

**Recheck Note**: After this step, verify that all folders are correctly moved and the new structure is:
- `src/app/(dashboard)/admin/`
- `src/app/(dashboard)/student/`
- `src/app/(auth)/login/`
- `src/app/(auth)/signup/`

### Step 2: Update API Routes Structure
**Status: ✅ Completed**

2.1. Rename `/src/app/api/dashboard/` to `/src/app/api/student/`
2.2. Update all API route handlers in the renamed directory
2.3. Verify all API endpoints are accessible at new paths:
   - `/api/student/route.ts`
   - `/api/student/stats/`
   - `/api/student/student-stats/` (or rename to just `/api/student/stats/`)

**Recheck Note**: After this step, test all API endpoints to ensure they respond correctly at their new paths.

### Step 3: Update Middleware Configuration
**Status: ✅ Completed**

3.1. Update `src/middleware.ts` to reflect new route structure:
   - Change `/dashboard` references to `/student`
   - Update `protectedRoutes` array
   - Update redirect logic
   - Ensure `(dashboard)` and `(auth)` groups work correctly

**Recheck Note**: After this step, test authentication flows and route protection to ensure users are redirected correctly.

### Step 4: Update Frontend Components - Student Dashboard
**Status: ✅ Completed**

4.1. Update `src/app/(dashboard)/student/page.tsx`:
   - Update all API calls from `/api/dashboard/` to `/api/student/`
   - Update any internal route references
   - Update redirect logic if any

**Recheck Note**: After this step, test the student dashboard to ensure all data loads correctly and all API calls work.

### Step 5: Update Frontend Components - Admin Dashboard
**Status: ✅ Completed**

5.1. Update `src/app/(dashboard)/admin/page.tsx`:
   - Check for any references to `/dashboard` routes and update to `/student`
   - Verify admin-specific functionality remains intact

**Recheck Note**: After this step, test the admin dashboard to ensure all functionality works correctly.

### Step 6: Update Authentication Pages
**Status: ✅ Completed**

6.1. Update `src/app/(auth)/login/page.tsx`:
   - Change default `callbackUrl` from `/dashboard` to `/student`
   - Update redirect logic for admin users (should still go to `/admin`)

6.2. Update `src/app/(auth)/signup/page.tsx`:
   - Update redirect after successful signup from `/login` to new auth route
   - Verify the redirect path is correct

**Recheck Note**: After this step, test the complete authentication flow: signup → login → appropriate dashboard.

### Step 7: Search and Update All Route References
**Status: ✅ Completed**

7.1. Search the entire codebase for hardcoded route references:
   - Search for `/dashboard` and update to `/student`
   - Search for `/api/dashboard` and update to `/api/student`
   - Check for any other route references that need updating

7.2. Update any configuration files, constants, or utility functions

**Recheck Note**: After this step, perform a comprehensive search to ensure no old route references remain.

### Step 8: Final Testing and Validation
**Status: ✅ Completed**

8.1. Test all user flows:
   - New user signup → login → student dashboard
   - Admin login → admin dashboard
   - Route protection and redirects
   - All API endpoints functionality

8.2. Test route groups:
   - Verify `(dashboard)` group works correctly
   - Verify `(auth)` group works correctly
   - Ensure URLs are clean (no group names in URLs)

8.3. Test all dashboard features:
   - Student dashboard data loading
   - Admin dashboard functionality
   - Navigation between different sections

**Recheck Note**: After this step, perform end-to-end testing to ensure the entire application works correctly with the new structure.

## Route Mapping Changes

### Before Restructuring
```
/login → /src/app/login/page.tsx
/signup → /src/app/signup/page.tsx
/dashboard → /src/app/dashboard/page.tsx
/admin → /src/app/admin/page.tsx
/api/dashboard/* → /src/app/api/dashboard/*
```

### After Restructuring
```
/login → /src/app/(auth)/login/page.tsx
/signup → /src/app/(auth)/signup/page.tsx
/student → /src/app/(dashboard)/student/page.tsx
/admin → /src/app/(dashboard)/admin/page.tsx
/api/student/* → /src/app/api/student/*
```

## Important Notes

1. **Route Groups**: Folders wrapped in parentheses `()` are route groups in Next.js 13+ and don't affect the URL structure
2. **API Routes**: API routes need to be updated separately as they don't follow the same grouping rules
3. **Middleware**: Must be updated to handle the new route structure
4. **Testing**: Each step requires thorough testing before proceeding to the next
5. **Rollback Plan**: Keep backup of original structure in case rollback is needed

## Success Criteria

- [x] All routes work correctly with new structure
- [x] Authentication flows work properly
- [x] Student dashboard accessible at `/student`
- [x] Admin dashboard accessible at `/admin`
- [x] Login/signup accessible at `/login` and `/signup`
- [x] All API endpoints work with new paths
- [x] No broken links or references
- [x] Route protection works correctly
- [x] Clean URLs (no group names visible)

---

**Next Step**: Begin with Step 1 - Create Route Groups Structure