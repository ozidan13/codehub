# Mentorship Feature Enhancement Plan

This document outlines the steps to improve the mentorship features in the student dashboard.

## Task Breakdown

- [x] **Step 1: Fix Live Session Time Slot Display**
  - **Goal:** Ensure that the available time slots for live mentorship sessions are displayed correctly to the student.
  - **Files to check:**
    - `src/app/api/admin/available-dates/route.ts`
    - `src/app/api/mentorship/available-dates/route.ts`
    - `src/components/mentorship/LiveSessionBooking.tsx`
    - `src/lib/dateUtils.ts`
  - **Verification:** After implementation, I will double-check that if an admin creates a time slot from 9:00 AM to 10:00 AM, it is displayed as such on the student's booking page, not as separate times.

- [x] **Step 2: Prevent Repurchasing of Recorded Sessions**
  - **Goal:** Modify the UI to clearly indicate which recorded sessions have already been purchased by the student and prevent them from buying it again.
  - **Files to check:**
    - `src/app/dashboard/page.tsx`
    - `src/components/mentorship/RecordedSessionsList.tsx`
    - `src/app/api/mentorship/route.ts` (to see what booking data is returned)
  - **Verification:** I will ensure that a purchased session shows a "View" or "Purchased" button instead of a "Purchase" button.

- [x] **Step 3: Improve Mentorship Section UI/UX**
  - **Goal:** Redesign the mentorship section on the student dashboard to be more intuitive and visually appealing, with clear separation between Live and Recorded sessions.
  - **Files to check:**
    - `src/app/dashboard/page.tsx`
  - **Verification:** The final UI should have distinct, well-designed sections for booking live sessions and browsing recorded sessions, improving user experience.

---
*This plan will be updated as each step is completed.*