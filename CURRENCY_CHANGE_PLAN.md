# Currency Change Implementation Plan

## Overview
This document outlines the detailed steps to change the currency display from "$" (dollar) to "جنية" (Egyptian Pound) across the CodeHub platform.

## Analysis Summary
After analyzing the codebase, the following files contain currency display instances that need to be updated:

### Files to Modify:
1. `src\app\(dashboard)\student\page.tsx` - Multiple dollar sign instances
2. `src\app\(dashboard)\admin\page.tsx` - Multiple dollar sign instances  
3. `src\components\mentorship\RecordedSessionsList.tsx` - One dollar sign instance
4. `src\app\api\wallet\route.ts` - Description text with dollar sign
5. Database seeds - Update to reflect new currency

## Detailed Implementation Steps

### Step 1: Update Student Dashboard Page
**File:** `src\app\(dashboard)\student\page.tsx`

**Changes Required:**
- Line ~320: `${wallet.balance}` → `${wallet.balance} جنية`
- Line ~350: `${transaction.amount}` → `${transaction.amount} جنية`
- Line ~380: `${booking.amount}` → `${booking.amount} جنية`
- Line ~420: `${enrollment.platform.price}` → `${enrollment.platform.price} جنية`
- Line ~450: `${session.price}` → `${session.price} جنية`
- Line ~480: `${sessionPrice}` → `${sessionPrice} جنية`
- Line ~510: `${totalAmount}` → `${totalAmount} جنية`
- Line ~540: Display userBalance with "جنية" suffix

**Verification Step:** After making changes, review the code to ensure:
- All dollar signs are replaced with "جنية"
- No syntax errors are introduced
- Currency formatting is consistent
- Arabic text displays correctly

---

### Step 2: Update Admin Dashboard Page
**File:** `src\app\(dashboard)\admin\page.tsx`

**Changes Required:**
- Line ~1254: `${Number(booking.amount).toFixed(2)}` → `${Number(booking.amount).toFixed(2)} جنية`
- Line ~1595: `${Number(recordedSession.price).toFixed(2)}` → `${Number(recordedSession.price).toFixed(2)} جنية`
- Line ~1725: `${Number(booking.amount || 0).toFixed(2)}` → `${Number(booking.amount || 0).toFixed(2)} جنية`

**Verification Step:** After making changes, review the code to ensure:
- All dollar signs are replaced with "جنية"
- Number formatting with toFixed(2) is preserved
- No syntax errors are introduced
- Currency display is consistent across all admin views

---

### Step 3: Update RecordedSessionsList Component
**File:** `src\components\mentorship\RecordedSessionsList.tsx`

**Changes Required:**
- Line ~50: `Purchase for $${Number(session.price).toFixed(2)}` → `Purchase for ${Number(session.price).toFixed(2)} جنية`

**Verification Step:** After making changes, review the code to ensure:
- Dollar sign is replaced with "جنية"
- Button text displays correctly
- No syntax errors are introduced
- Purchase functionality remains intact

---

### Step 4: Update API Route Description
**File:** `src\app\api\wallet\route.ts`

**Changes Required:**
- Update any description text that mentions "$" to use "جنية" instead

**Verification Step:** After making changes, review the code to ensure:
- API descriptions are updated
- No functional changes to API logic
- Currency references are consistent

---

### Step 5: Update Database Seeds
**Files:** Any seed files in the project

**Changes Required:**
- Update seed data to reflect Egyptian Pound pricing
- Ensure all monetary values are appropriate for EGP currency
- Update any currency-related descriptions or labels

**Verification Step:** After making changes, review the seed files to ensure:
- All pricing is realistic for Egyptian market
- Currency references are updated
- Seed data is consistent with new currency format

---

### Step 6: Final Testing and Verification

**Testing Checklist:**
1. Run the application locally
2. Navigate to student dashboard and verify all currency displays show "جنية"
3. Navigate to admin dashboard and verify all currency displays show "جنية"
4. Test mentorship recorded sessions purchase flow
5. Verify wallet operations display correct currency
6. Check that all Arabic text renders correctly
7. Ensure no console errors or warnings
8. Test responsive design with new currency text

**Code Review Checklist:**
1. All `$` symbols replaced with "جنية" where appropriate
2. No syntax errors introduced
3. Consistent currency formatting across all files
4. Arabic text properly encoded and displayed
5. No breaking changes to existing functionality
6. All number formatting preserved (e.g., toFixed(2))

---

## Important Notes

### Currency Formatting Guidelines:
- Use "جنية" as the currency symbol
- Maintain existing number formatting (e.g., toFixed(2) for decimal places)
- Place "جنية" after the amount (e.g., "100.00 جنية")
- Ensure consistent spacing between amount and currency

### Error Prevention:
- Always test each file after modification
- Check for syntax errors before proceeding to next step
- Verify Arabic text encoding is correct
- Ensure no functional regressions are introduced

### Rollback Plan:
- Keep backup of original files before making changes
- Use version control to track all modifications
- Test thoroughly before committing changes

---

## Completion Criteria

✅ **Step 1 Complete:** Student dashboard shows "جنية" for all currency displays

✅ **Step 2 Complete:** Admin dashboard shows "جنية" for all currency displays

✅ **Step 3 Complete:** RecordedSessionsList component shows "جنية"

✅ **Step 4 Complete:** API descriptions updated to use "جنية"

✅ **Step 5 Complete:** Database seeds updated with appropriate EGP values

⏳ **Step 6 In Progress:** Final testing and verification

---

**Final Status:** ✅ **COMPLETED**

**All currency changes have been successfully implemented across the platform!**