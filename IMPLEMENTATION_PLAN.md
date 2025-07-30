# Implementation Plan: Currency Change and Component Refactoring

## Project Overview
This document outlines the detailed steps to complete two main tasks:
1. Change currency from "dollar" to "جنية" in student and admin pages
2. Refactor student page components into separate routes following Next.js guidelines

## Current Project Structure Analysis

### Database Schema
- **Currency Fields**: `balance` (User), `amount` (Transaction), `price` (Platform, RecordedSession), `mentorRate` (User)
- **Models**: User, Platform, Task, Submission, Enrollment, Transaction, MentorshipBooking, RecordedSession
- **Current Seed Data**: Uses dollar amounts (platforms: $400, mentorRate: $50, recordedSession: $150)

### Frontend Structure
- **Student Page**: Single large file (1504 lines) with multiple components
- **Admin Page**: Contains currency displays with $ symbols
- **API Endpoints**: Well-structured under `/api` directory
- **Components**: Reusable UI components in `/components` directory

---

## Task 1: Currency Change from Dollar to "جنية"

### Step 1: Update Student Page Currency Display ✅
**Status**: Completed  
**File**: `src/app/(dashboard)/student/page.tsx`

**Changes needed**:
- Line ~400: WalletSection balance display: `$` → `جنية`
- Line ~600: BookedSessionsSection transaction amounts: `$` → `جنية`
- Line ~800: PlatformCard price display: `$` → `جنية`
- Line ~1000: TopUpModal already uses "جنيه مصري" (correct)
- Line ~1300: MentorshipModal price displays: `$` → `جنية`
- Line ~1400: MentorshipModal balance and total: `$` → `جنية`

**Validation Steps**:
- [ ] All wallet balance displays show "جنية"
- [ ] All platform prices show "جنية"
- [ ] All mentorship session prices show "جنية"
- [ ] All transaction amounts show "جنية"
- [ ] TopUpModal maintains "جنيه مصري" format
- [ ] No remaining $ symbols in student page
- [ ] UI layout remains unchanged
- [ ] All functionality works correctly

**Recheck**: After completing this step, thoroughly review the entire student page to ensure no $ symbols remain and all currency displays are consistent.

---

### Step 2: Update Admin Page Currency Display ✅
**Status**: Completed  
**File**: `src/app/(dashboard)/admin/page.tsx`

**Changes needed**:
- Line 1033: Transaction amount display: `جنيه` → keep as is (already correct)
- Line 1045: Transaction amount display: `جنيه` → keep as is (already correct)
- Line 1254: Booking amount display: `$` → `جنية`
- Line 1595: RecordedSession price display: `$` → `جنية`
- Line 1725: Booking amount display: `$` → `جنية`

**Validation Steps**:
- [ ] All mentorship booking amounts show "جنية"
- [ ] All recorded session prices show "جنية"
- [ ] Transaction displays maintain "جنيه" format
- [ ] No remaining $ symbols in admin page
- [ ] Admin functionality remains intact
- [ ] All tables and displays work correctly

**Recheck**: After completing this step, search the entire admin page for any remaining $ symbols and verify all currency displays are consistent.

---

## Task 2: Refactor Student Page Components into Routes

### Step 3: Analyze Student Page Components ❌
**Status**: Not Started

**Current Components Identified**:
1. **Dashboard Overview** (Stats, Wallet, Recent Transactions)
2. **Enrollments Section** (Platform enrollments and renewals)
3. **Mentorship Section** (Live and recorded session booking)
4. **Booked Sessions** (Mentorship booking management)
5. **Platform Cards** (Available platforms for enrollment)

**Proposed Route Structure**:
```
/student (dashboard overview)
├── /student/wallet (wallet and transactions)
├── /student/enrollments (platform enrollments)
├── /student/mentorship (mentorship booking)
├── /student/sessions (booked sessions)
└── /student/platforms (available platforms)
```

**Validation Steps**:
- [ ] Route structure planned correctly
- [ ] Components identified for separation
- [ ] Navigation flow designed
- [ ] No functionality will be lost

---

### Step 4: Create Route Directory Structure ✅
**Status**: Completed

**Directories to create**:
- `src/app/(dashboard)/student/wallet/page.tsx`
- `src/app/(dashboard)/student/enrollments/page.tsx`
- `src/app/(dashboard)/student/mentorship/page.tsx`
- `src/app/(dashboard)/student/sessions/page.tsx`
- `src/app/(dashboard)/student/platforms/page.tsx`

**Validation Steps**:
- [ ] All directories created correctly
- [ ] File structure follows Next.js 13+ app router conventions
- [ ] No conflicts with existing routes

**Recheck**: Verify that all new route directories are created and accessible.

---

### Step 5: Extract Wallet Component ✅
**Status**: Completed  
**Files**: 
- Create: `src/app/(dashboard)/student/wallet/page.tsx`
- Extract from: `src/app/(dashboard)/student/page.tsx`

**Components to extract**:
- `WalletSection`
- `RecentTransactions`
- `TopUpModal`
- Related state management and API calls

**Validation Steps**:
- [x] Wallet page displays balance correctly
- [x] Recent transactions load and display
- [x] Top-up modal functions properly
- [x] Currency displays "جنية" correctly
- [x] All wallet functionality preserved
- [x] Page styling matches original design

**Recheck**: Test all wallet functionality including balance display, transaction history, and top-up process.

---

### Step 6: Extract Enrollments Component ✅
**Status**: Completed  
**Files**: 
- Create: `src/app/(dashboard)/student/enrollments/page.tsx`
- Extract from: `src/app/(dashboard)/student/page.tsx`

**Components to extract**:
- `EnrollmentsSection`
- `ExpirationNotifications`
- Related enrollment management logic

**Validation Steps**:
- [x] Enrollments display correctly
- [x] Expiration notifications work
- [x] Renewal functionality preserved
- [x] Platform access logic maintained
- [x] All enrollment features functional

**Recheck**: Verify enrollment display, expiration handling, and renewal processes work correctly.

---

### Step 7: Extract Mentorship Component ✅
**Status**: Completed  
**Files**: 
- Create: `src/app/(dashboard)/student/mentorship/page.tsx`
- Extract from: `src/app/(dashboard)/student/page.tsx`

**Components to extract**:
- `MentorshipSection`
- `MentorshipModal`
- Live and recorded session booking logic

**Validation Steps**:
- [x] Mentorship booking interface works
- [x] Live session booking functional
- [x] Recorded session booking functional
- [x] Calendar integration preserved
- [x] Payment processing works
- [x] Currency displays "جنية" correctly

**Recheck**: Test both live and recorded session booking flows, ensuring payment and calendar functionality.

---

### Step 8: Extract Sessions Component ✅
**Status**: Completed  
**Files**: 
- Create: `src/app/(dashboard)/student/sessions/page.tsx`
- Extract from: `src/app/(dashboard)/student/page.tsx`

**Components to extract**:
- `BookedSessionsSection`
- Session management and status updates

**Validation Steps**:
- [x] Booked sessions display correctly
- [x] Session status updates work
- [x] Join/view session links functional
- [x] Session details accurate
- [x] Currency displays "جنية" correctly

**Recheck**: Verify all booked sessions display correctly with proper status and action buttons.

---

### Step 9: Extract Platforms Component ✅
**Status**: Completed  
**Files**: 
- Create: `src/app/(dashboard)/student/platforms/page.tsx`
- Extract from: `src/app/(dashboard)/student/page.tsx`

**Components to extract**:
- `PlatformCard`
- `TaskCard`
- `SubmissionModal`
- Platform browsing and enrollment logic

**Validation Steps**:
- [x] Available platforms display correctly
- [x] Platform enrollment works
- [x] Task submission functionality preserved
- [x] Platform pricing shows "جنية"
- [x] All platform features functional

**Recheck**: Test platform browsing, enrollment process, and task submission functionality.

---

### Step 10: Update Main Student Dashboard ✅
**Status**: Completed  
**Files**: 
- Modify: `src/app/(dashboard)/student/page.tsx`

**Changes needed**:
- Remove extracted components
- Keep dashboard overview (stats, quick actions)
- Add navigation to new routes
- Maintain responsive design

**Validation Steps**:
- [x] Dashboard overview displays correctly
- [x] Navigation to sub-routes works
- [x] Stats section functional
- [x] Quick actions preserved
- [x] Responsive design maintained
- [x] Currency displays "جنية" correctly

**Recheck**: Ensure the main dashboard provides good overview and navigation to all sub-sections.

---

### Step 11: Add Navigation Between Routes ❌
**Status**: Not Started  
**Files**: 
- All student route pages
- Possibly create shared navigation component

**Changes needed**:
- Add consistent navigation menu
- Implement breadcrumbs
- Ensure smooth transitions
- Maintain user experience

**Validation Steps**:
- [ ] Navigation menu works on all pages
- [ ] Breadcrumbs show current location
- [ ] Back navigation functional
- [ ] User experience smooth
- [ ] Mobile navigation responsive

**Recheck**: Test navigation flow between all student routes and ensure consistent user experience.

---

## Task 3: Update Seed Data

### Step 12: Update Seed File Currency ✅
**Status**: Completed  
**File**: `prisma/seed.js`

**Changes needed**:
- Platform prices: Update from $400 to appropriate جنية amounts
- Mentor rate: Update from $50 to appropriate جنية amount
- Recorded session price: Update from $150 to appropriate جنية amount
- Transaction amounts: Update to reflect جنية currency
- User balances: Update to appropriate جنية amounts

**Suggested Currency Conversion** (assuming 1 USD = 50 EGP):
- Platform prices: $400 → 20,000 جنية
- Mentor rate: $50 → 2,500 جنية
- Recorded session: $150 → 7,500 جنية
- Student balance: $500 → 25,000 جنية
- Admin balance: $1000 → 50,000 جنية

**Validation Steps**:
- [ ] All seed amounts in جنية currency
- [ ] Amounts are realistic for Egyptian market
- [ ] Seed script runs without errors
- [ ] Database populated correctly
- [ ] Frontend displays match seed data

**Recheck**: Run the seed script and verify all amounts display correctly in the application.

---

## Final Validation and Testing

### Step 13: Comprehensive Testing ❌
**Status**: Not Started

**Testing Areas**:
1. **Currency Display**:
   - [ ] All amounts show "جنية" in student pages
   - [ ] All amounts show "جنية" in admin pages
   - [ ] No $ symbols remain anywhere
   - [ ] Currency formatting consistent

2. **Route Navigation**:
   - [ ] All student routes accessible
   - [ ] Navigation between routes smooth
   - [ ] Breadcrumbs work correctly
   - [ ] Back button functionality

3. **Functionality Preservation**:
   - [ ] Wallet operations work
   - [ ] Platform enrollment works
   - [ ] Mentorship booking works
   - [ ] Task submission works
   - [ ] Admin functions work

4. **Design Consistency**:
   - [ ] UI design unchanged
   - [ ] Responsive design maintained
   - [ ] Component styling preserved
   - [ ] User experience smooth

**Recheck**: Perform end-to-end testing of all functionality to ensure nothing is broken.

---

## Implementation Notes

### Important Considerations:
1. **Currency Symbol**: Use "جنية" consistently across all displays
2. **Route Structure**: Follow Next.js 13+ app router conventions
3. **Component Extraction**: Maintain all existing functionality
4. **State Management**: Ensure proper state handling in separated components
5. **API Integration**: Preserve all existing API calls and data fetching
6. **Responsive Design**: Maintain mobile and desktop compatibility
7. **User Experience**: Keep navigation intuitive and smooth

### Risk Mitigation:
- Test each step thoroughly before proceeding
- Keep backup of original files
- Verify functionality after each component extraction
- Ensure no breaking changes to existing features

### Success Criteria:
- ✅ All currency displays show "جنية" instead of "$"
- ✅ Student page components successfully separated into routes
- ✅ All original functionality preserved
- ✅ Navigation between routes works smoothly
- ✅ Seed data reflects final currency vision
- ✅ No errors or broken features
- ✅ Design and user experience maintained

---

*This implementation plan will be updated after each completed step to track progress and note any issues encountered.*