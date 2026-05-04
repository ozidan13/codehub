# CodeHub Definitive Project Reference

Last updated: 2026-05-04

This document is the standalone technical reference for the CodeHub codebase. It is intended for engineers and AI coding tools that need to understand the project without rereading every source file.

## 1. Project Summary

CodeHub is a Next.js full-stack learning platform for Arabic-speaking programming students and admins/supervisors. Students sign up, enroll in programming platforms, complete tasks, submit summaries, see progress, manage wallet balance, and book mentorship sessions. Admins manage users, platforms, tasks, submissions, transactions, mentorship bookings, recorded sessions, and Calendly-style availability slots.

Core stack:

- Next.js 15.3.3 with App Router under `src/app`.
- React 19.
- NextAuth.js v4 with Credentials provider and JWT sessions.
- Prisma ORM 6.8.2 with PostgreSQL.
- Tailwind CSS v3.4.
- TypeScript with strict mode enabled. Build-time type and ESLint errors are currently ignored in `next.config.mjs`, although `npx tsc --noEmit` passes after the cleanup fixes documented here.
- Zod for API validation.
- bcryptjs for password hashing.
- date-fns for formatting and calendar utilities.
- Framer Motion and Lucide React for UI effects/icons.

Important current caveat: many Arabic strings in source appear mojibake-encoded in this checkout. The runtime may still show broken text depending on actual file encoding and browser interpretation. Fixing encoding should be treated as a separate cleanup task.

## 2. Repository Layout

High-level folders:

- `src/app`: Next.js App Router pages, layouts, route groups, and API route handlers.
- `src/app/(auth)`: public authentication pages.
- `src/app/(dashboard)`: authenticated dashboard pages.
- `src/app/api`: all server route handlers.
- `src/components`: client UI components for landing page, calendar, mentorship, and toast notifications.
- `src/lib`: auth config, Prisma singleton, utility functions, date utilities.
- `src/types`: shared TypeScript interfaces and NextAuth module augmentation.
- `src/utils`: calendar helper functions.
- `prisma`: Prisma schema, seed file, migrations.
- `scripts`: database maintenance scripts.
- `public`: static assets. The original default Next.js SVGs were unused and safe to remove.

Main app paths:

- `/`: landing page.
- `/login`: login page.
- `/signup`: signup page.
- `/student`: student dashboard.
- `/student/mentorship`: student mentorship booking page.
- `/student/profile`: student profile page.
- `/student/recenttransactions`: standalone student transaction history page.
- `/admin`: admin dashboard with internal tabs.

## 3. App Router Architecture

The app uses App Router route groups:

- `(auth)` groups `/login` and `/signup`. The group name does not affect the URL.
- `(dashboard)` groups authenticated dashboard pages. It currently contains the `admin` page and `student` layout/pages.

Root app files:

- `src/app/layout.tsx`: root HTML document, metadata, Next font setup, and `Providers`.
- `src/app/providers.tsx`: wraps the app in NextAuth `SessionProvider`.
- `src/app/globals.css`: Tailwind imports, design tokens, Arabic font import, animation utilities, glassmorphism utilities.
- `src/app/page.tsx`: Matrix-themed landing page.

Server/client split:

- Most pages are client components (`'use client'`) because they rely on `useSession`, `useRouter`, local state, fetch calls, modals, and animations.
- API routes use Next.js Route Handlers in `route.ts`.
- Prisma is used only server-side through route handlers and NextAuth callbacks.

Next.js compatibility notes:

- Dynamic API route handlers use the Next.js 15 async `params` pattern, for example `{ params }: { params: Promise<{ id: string }> }`.
- `src/middleware.ts` is used for route protection. In Next.js 15 this is valid.
- `next.config.mjs` currently ignores TypeScript and ESLint build errors. Re-enable these checks once ESLint has also been verified.

## 4. Authentication And Authorization

Auth implementation files:

- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/types/next-auth.d.ts`
- `src/middleware.ts`

### NextAuth Configuration

`authOptions` uses:

- `CredentialsProvider`.
- Prisma adapter imported from `@auth/prisma-adapter` and cast to `next-auth/adapters` `Adapter`.
- JWT session strategy.
- Session max age of 60 days.
- Custom sign-in page `/login`.
- Secret set to `process.env.SUPABASE_JWT_SECRET`.

The Credentials `authorize` flow:

1. Requires email and password.
2. Loads user by email.
3. Compares password with `bcrypt.compare`.
4. Returns `{ id, email, name, role, phoneNumber }` on success.

JWT callback:

- Copies `id`, `role`, `name`, and `phoneNumber` from user to token on login.

Session callback:

- Copies token fields to `session.user.id`, `session.user.role`, `session.user.name`, and `session.user.phoneNumber`.

Redirect callback:

- Allows relative URLs.
- Allows same-origin callback URLs.
- Defaults to `/student`.

### Session Type Augmentation

`src/types/next-auth.d.ts` extends:

- `Session.user.id`
- `Session.user.role`
- `Session.user.phoneNumber`
- `User.role`
- `User.phoneNumber`
- JWT `id`, `role`, `phoneNumber`

One bug: the profile page reads `session.user.createdAt`, but the NextAuth session type and callbacks do not provide `createdAt`.

### Middleware Protection

`src/middleware.ts` checks JWT using `getToken` and `SUPABASE_JWT_SECRET`.

Protected route prefixes:

- `/student`
- `/platforms`
- `/tasks`
- `/submissions`
- `/admin`
- `/profile`

Admin route prefixes:

- `/admin`

Public auth routes:

- `/login`
- `/signup`

Middleware behavior:

- Unauthenticated access to protected routes redirects to `/login?callbackUrl=...`.
- Authenticated non-admin access to `/admin` redirects to `/student`.
- Authenticated access to `/login` or `/signup` redirects to `/admin` for admins or `/student` for students.
- Authenticated access to `/` redirects to the correct dashboard.

Matcher excludes:

- `/api`
- `/_next/static`
- `/_next/image`
- `/favicon.ico`
- `.svg`

Security note: API route handlers also re-check sessions and roles. This is important because middleware should not be the only authorization layer.

### Signup Flow

`POST /api/auth/signup`:

- Validates email, password, name, and phone number with Zod.
- Rejects duplicate email or phone number.
- Hashes password with bcrypt cost 12.
- Creates a `STUDENT` user in a transaction.
- Creates an approved `TOP_UP` welcome transaction for 500 EGP.
- Attempts to auto-create/find the JavaScript Tasks platform.
- Auto-enrolls the new user into that platform for 365 days.

Known inconsistency: the signup route sets the new user balance to `0.00` but creates a 500 EGP approved welcome transaction. A removed duplicate file set balance to `1000.00`. The comments and values disagree.

## 5. Database Schema

Prisma datasource:

- Provider: PostgreSQL.
- URL: `env("POSTGRES_URL_NON_POOLING")`.

Client generator:

- `prisma-client-js`.

### Enums

`Role`:

- `STUDENT`
- `ADMIN`

`SubmissionStatus`:

- `PENDING`
- `APPROVED`
- `REJECTED`

`TransactionType`:

- `TOP_UP`
- `PLATFORM_PURCHASE`
- `MENTORSHIP_PAYMENT`
- `RECORDED_SESSION`
- `FACE_TO_FACE_SESSION`

`TransactionStatus`:

- `PENDING`
- `APPROVED`
- `REJECTED`

`BookingStatus`:

- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`

`SessionType`:

- `RECORDED`
- `FACE_TO_FACE`

### User

Mapped table: `users`

Fields:

- `id`: `String`, primary key, `cuid()`.
- `email`: unique `String`.
- `name`: optional `String`.
- `phoneNumber`: optional unique `String`.
- `password`: `String`, bcrypt hash.
- `role`: `Role`, default `STUDENT`.
- `createdAt`: default `now()`.
- `updatedAt`: `@updatedAt`.
- `balance`: `Decimal(10,2)`, default `500.00`.
- `isMentor`: `Boolean`, default `false`.
- `mentorBio`: optional `String`.
- `mentorRate`: optional `Decimal(10,2)`.

Relations:

- `submissions`: `Submission[]`.
- `accounts`: `Account[]`.
- `sessions`: `Session[]`.
- `enrollments`: `Enrollment[]`.
- `transactions`: `Transaction[]`.
- `studentBookings`: `MentorshipBooking[]` relation name `StudentBookings`.
- `mentorBookings`: `MentorshipBooking[]` relation name `MentorBookings`.

Cascade behavior:

- Accounts, sessions, submissions, enrollments, transactions, student bookings, and mentor bookings all cascade on user deletion at relation level.

### Account

Mapped table: `accounts`.

Standard NextAuth account model:

- `id`, `userId`, `type`, `provider`, `providerAccountId`, tokens, expiry, scope, session state.
- Unique compound index on `[provider, providerAccountId]`.
- Relation to `User` with `onDelete: Cascade`.

The app uses Credentials auth, so OAuth account rows are not central today, but the adapter schema supports them.

### Session

Mapped table: `sessions`.

Standard NextAuth session model:

- `id`
- `sessionToken`: unique
- `userId`
- `expires`
- Relation to `User` with cascade delete.

Because NextAuth strategy is JWT, database sessions are not the primary runtime session store.

### VerificationToken

Mapped table: `verification_tokens`.

Fields:

- `identifier`
- `token`: unique
- `expires`
- Unique compound index on `[identifier, token]`.

Not actively used by Credentials auth flow.

### Platform

Mapped table: `platforms`.

Fields:

- `id`: primary key.
- `name`: unique.
- `description`: optional.
- `url`: required platform URL.
- `courseLink`: optional course/material link.
- `createdAt`, `updatedAt`.
- `price`: optional `Decimal(10,2)`.
- `isPaid`: `Boolean`, default `false`.

Relations:

- `tasks`: `Task[]`.
- `enrollments`: `Enrollment[]`.

Cascade:

- Deleting a platform cascades to tasks and enrollments through their relations.
- Admin delete route blocks deletion if any task under the platform has submissions.

### Task

Mapped table: `tasks`.

Fields:

- `id`
- `title`
- `description`
- `link`
- `platformId`
- `order`: `Int`, default `0`.
- `createdAt`, `updatedAt`.

Relations:

- `platform`: `Platform`, `onDelete: Cascade`.
- `submissions`: `Submission[]`.

Indexes:

- `@@index([platformId])`

Admin delete route blocks deletion if submissions exist.

### Submission

Mapped table: `submissions`.

Fields:

- `id`
- `summary`: text.
- `status`: `SubmissionStatus`, default `PENDING`.
- `score`: optional integer, intended 0-100.
- `feedback`: optional text.
- `userId`
- `taskId`
- `createdAt`, `updatedAt`.

Relations:

- `user`: `User`, cascade delete.
- `task`: `Task`, cascade delete.

Constraints and indexes:

- Unique `[userId, taskId]`: one row per student/task.
- Index `[userId]`.

Important logic conflict: `POST /api/submissions` tries to allow a student to submit again after rejection by only blocking active `PENDING` or `APPROVED` submissions. The database unique constraint still prevents a second row for the same user/task, so rejected resubmission will fail unless the old row is updated or deleted.

### Enrollment

Mapped table: `enrollments`.

Fields:

- `id`
- `userId`
- `platformId`
- `createdAt`
- `expiresAt`: required, used for 30-day access windows.
- `isActive`: default `true`.
- `lastRenewalAt`: optional.

Relations:

- `user`: `User`, cascade delete.
- `platform`: `Platform`, cascade delete.

Constraint:

- Unique `[userId, platformId]`.

Business rules:

- Normal enrollment creates a 30-day expiration.
- Renewal extends for 30 days from renewal time.
- Signup auto-enrollment into JavaScript Tasks gives 365 days.

### Transaction

Mapped table: `transactions`.

Fields:

- `id`
- `userId`
- `type`: `TransactionType`.
- `amount`: `Decimal(10,2)`.
- `status`: `TransactionStatus`, default `PENDING`.
- `description`: optional.
- `senderWalletNumber`: optional wallet/phone number from the user.
- `adminWalletNumber`: optional admin wallet number.
- `createdAt`, `updatedAt`.

Relation:

- `user`: `User`, cascade delete.

Business rules:

- Top-up requests are `TOP_UP` and `PENDING` until admin approval.
- Platform purchases are immediately `APPROVED`.
- Mentorship purchases are immediately `APPROVED` unless cancelled/refunded later.

Cleanup fix applied: `src/app/api/mentorship/recorded-sessions/route.ts` now uses valid transaction values (`RECORDED_SESSION`, `APPROVED`) and the admin user as mentor.

### MentorshipBooking

Mapped table: `mentorship_bookings`.

Fields:

- `id`
- `studentId`
- `mentorId`
- `sessionType`: `RECORDED` or `FACE_TO_FACE`.
- `duration`: minutes, default 60.
- `amount`: `Decimal(10,2)`.
- `status`: `BookingStatus`, default `PENDING`.
- `sessionDate`: optional.
- `sessionStartTime`: optional `HH:MM`.
- `sessionEndTime`: optional `HH:MM`.
- `originalSessionDate`: optional, used for change tracking.
- `dateChanged`: boolean, default false.
- `studentNotes`: optional.
- `adminNotes`: optional.
- `whatsappNumber`: optional.
- `videoLink`: optional for recorded sessions.
- `meetingLink`: optional for live sessions.
- `availableDateId`: optional string reference to a booked `AvailableDate`.
- `createdAt`, `updatedAt`.

Relations:

- `student`: `User` via `StudentBookings`, cascade delete.
- `mentor`: `User` via `MentorBookings`, cascade delete.

Important schema gap: `availableDateId` and `AvailableDate.bookingId` are plain strings with no Prisma relation/foreign key. The application manually links them.

### AvailableDate

Mapped table: `available_dates`.

Fields:

- `id`
- `date`: calendar date as `DateTime`.
- `startTime`: `HH:MM`.
- `endTime`: `HH:MM`.
- `timeSlot`: display string.
- `isBooked`: default false.
- `bookingId`: optional string reference to a booking.
- `isRecurring`: default false.
- `dayOfWeek`: optional 0-6.
- `createdAt`, `updatedAt`.

Constraints and indexes:

- Unique `[date, startTime, endTime]`.
- Index `[date]`.
- Index `[isBooked]`.
- Index `[dayOfWeek]`.

### RecordedSession

Mapped table: `recorded_sessions`.

Fields:

- `id`
- `title`
- `description`
- `videoLink`
- `price`: `Decimal(10,2)`.
- `isActive`: default true.
- `createdAt`, `updatedAt`.

Used by:

- `/api/mentorship` GET and POST.
- `/api/admin/recorded-sessions`.
- `/api/mentorship/recorded-sessions` GET.

## 6. Migration History

Migration folders:

- `20250710111028_add_enrollment_expiration`
- `20250712024545_mentorship_upgrade`
- `20250712033555_add_recorded_session_model`
- `20250716081209_update_available_dates_schema`
- `20250720022044_add_phone_number_to_user`
- `20250925203834_add_course_link_to_platform`

History summary:

1. `20250710111028_add_enrollment_expiration`
   - Created base enums `Role`, `SubmissionStatus`, `TransactionType`, `TransactionStatus`, `BookingStatus`.
   - Created users, accounts, sessions, verification tokens, platforms, tasks, submissions, enrollments, transactions, and mentorship bookings.
   - Added enrollment expiration fields.
   - Added core unique indexes and cascade foreign keys.

2. `20250712024545_mentorship_upgrade`
   - Added `SessionType`.
   - Added `RECORDED_SESSION` and `FACE_TO_FACE_SESSION` transaction types.
   - Added mentorship booking fields for date changes, meeting/video links, WhatsApp number, and session type.
   - Created initial `available_dates` with unique `[date, timeSlot]`.

3. `20250712033555_add_recorded_session_model`
   - Created `recorded_sessions`.

4. `20250716081209_update_available_dates_schema`
   - Replaced `available_dates` unique `[date, timeSlot]` with `[date, startTime, endTime]`.
   - Added `startTime`, `endTime`, `isRecurring`, and `dayOfWeek`.
   - Added `availableDateId`, `sessionStartTime`, `sessionEndTime` to mentorship bookings.
   - Added indexes on available date fields.

5. `20250720022044_add_phone_number_to_user`
   - Added optional `phoneNumber` to users.
   - Added unique index on `phoneNumber`.

6. `20250925203834_add_course_link_to_platform`
   - Added optional `courseLink` to platforms.

Migration risk:

- The mentorship upgrade initially adds `sessionType` with default then drops default. This is okay for existing rows, but future inserts must always provide `sessionType`.
- `AvailableDate` date/time schema is string-based and manually linked; it can drift from bookings if update logic misses a case.

## 7. API Route Reference

All routes are under `src/app/api`.

### Auth

#### `GET/POST /api/auth/[...nextauth]`

Purpose:

- NextAuth handler.

Methods:

- GET and POST delegated to `NextAuth(authOptions)`.

Auth:

- Public endpoint used by NextAuth.

#### `POST /api/auth/signup`

Purpose:

- Create a student account.

Validation:

- Zod: `email`, `password` min 6, `name`, `phoneNumber`.

Business logic:

- Reject duplicate email/phone.
- Hash password.
- Create student.
- Create welcome top-up transaction.
- Create/find JavaScript Tasks platform.
- Auto-enroll for 365 days.

Responses:

- 201 with created user projection.
- 400 validation or duplicate.
- 500 server error.

Cleanup note:

- `src/app/api/auth/signup/_.ts` was a duplicate non-route file and was safe to delete.

### Platforms

#### `GET /api/platforms`

Purpose:

- Fetch all platforms, optionally with tasks and the current user's latest submission per task.

Query:

- `include_tasks=true`

Auth:

- Any authenticated user.

Business logic:

- Includes tasks ordered by `order` when requested.
- Includes per-task `_count` of current user's submissions and latest submission metadata.

Response:

- `{ platforms }`

#### `POST /api/platforms`

Purpose:

- Create platform.

Auth:

- Admin only.

Input:

- `name`, `description`, `url`, `courseLink`.

Validation:

- Manual required check for `name` and `url`; no Zod here.

Response:

- 201 `{ platform }`.

#### `GET /api/platforms/[id]`

Purpose:

- Fetch one platform, optionally tasks.

Auth:

- Any authenticated user, but must be enrolled in that platform.

Query:

- `include_tasks=true`

Business logic:

- Finds current user's enrollment by `[userId, platformId]`.
- Rejects if no enrollment.
- Rejects if expired.
- Returns enrollment status and days remaining.

Potential issue:

- Admins are also required to be enrolled to fetch a platform by id. This may be unintended for admin UI or tooling.

#### `PUT /api/platforms/[id]`

Purpose:

- Update platform.

Auth:

- Admin only.

Validation:

- Zod optional `name`, `description`, `url`, nullable `courseLink`.

Business logic:

- Ensures platform exists.
- Ensures changed name remains unique.

#### `DELETE /api/platforms/[id]`

Purpose:

- Delete platform.

Auth:

- Admin only.

Business logic:

- Ensures platform exists.
- Counts submissions through tasks and blocks deletion if any exist.
- Deletes platform; tasks/enrollments cascade.

### Tasks

#### `GET /api/tasks`

Purpose:

- Fetch all tasks or tasks for one platform.

Auth:

- Any authenticated user.

Query:

- `platformId`
- `include_submissions=true`

Business logic:

- If `platformId` is provided, requires active current-user enrollment.
- Includes platform summary.
- Optionally includes current user's submissions.
- Orders by platform then task order.

Potential issue:

- Admins also need enrollment when `platformId` is provided.

#### `POST /api/tasks`

Purpose:

- Create task.

Auth:

- Admin only.

Validation:

- Zod `title`, optional `description`, optional URL `link`, `platformId`, optional integer `order`.

Business logic:

- Verifies platform exists.
- If `order` absent, sets one greater than current max for platform.

#### `GET /api/tasks/[id]`

Purpose:

- Fetch one task.

Auth:

- Any authenticated user, but requires active enrollment in task platform.

Query:

- `include_submissions=true`

Business logic:

- Fetches task with platform and optional submissions.
- Checks current user's enrollment and expiration.

#### `PUT /api/tasks/[id]`

Purpose:

- Update task.

Auth:

- Admin only.

Validation:

- Zod optional fields.

Business logic:

- Ensures task exists.
- If platform changes, ensures new platform exists.

#### `DELETE /api/tasks/[id]`

Purpose:

- Delete task.

Auth:

- Admin only.

Business logic:

- Ensures task exists.
- Blocks deletion if submissions exist.

### Submissions

#### `GET /api/submissions`

Purpose:

- Fetch submissions.

Auth:

- Any authenticated user.

Query:

- `taskId`
- `userId` (admin only)
- `page`, `limit`

Business logic:

- Students only see their submissions.
- Admins see all and may filter by user.
- Includes task, platform, and user.
- Returns pagination.

#### `POST /api/submissions`

Purpose:

- Student creates a task submission.

Auth:

- Student only.

Validation:

- Zod `taskId`, `summary`.

Business logic:

- Verifies task exists.
- Blocks if current user already has `PENDING` or `APPROVED` submission for the task.
- Creates `PENDING` submission.

Known issue:

- Does not check enrollment/expiration before submission.
- Database unique constraint prevents resubmission after rejection.

#### `GET /api/submissions/[id]`

Purpose:

- Fetch one submission.

Auth:

- Any authenticated user.

Business logic:

- Students can only fetch their own.
- Admins can fetch any.

#### `PATCH /api/submissions/[id]`

Purpose:

- Admin reviews/scales a submission.

Auth:

- Admin only.

Validation:

- Optional `status` enum, optional score 0-100, optional `feedback`.

Business logic:

- Ensures submission exists.
- Updates provided status, score, feedback.

Potential issue:

- Does not enforce score required for approved status or score null for rejected/pending.

#### `DELETE /api/submissions/[id]`

Purpose:

- Admin deletes a submission.

Auth:

- Admin only.

### Enrollments

#### `GET /api/enrollments`

Purpose:

- Fetch current user's enrollments with expiration status.

Auth:

- Authenticated user.

Response fields added per enrollment:

- `isExpired`
- `daysRemaining`
- `status`: `active`, `expiring_soon`, `expired`

#### `POST /api/enrollments`

Purpose:

- Enroll current user in a platform.

Auth:

- Authenticated user.

Validation:

- Zod `platformId`.

Business logic:

- Rejects duplicate enrollment.
- Loads platform price and paid flag.
- If paid, checks balance.
- In transaction, deducts balance, creates approved `PLATFORM_PURCHASE`, creates enrollment expiring in 30 days.
- Free platforms skip payment and create 30-day enrollment.

Potential issue:

- Any authenticated role can enroll, including admins.

#### `PUT /api/enrollments`

Purpose:

- Renew an expired enrollment.

Auth:

- Authenticated user.

Validation:

- Zod `enrollmentId`.

Business logic:

- Finds enrollment owned by current user.
- Rejects if still active.
- If paid, checks balance and deducts price in transaction.
- Updates `expiresAt`, `isActive`, `lastRenewalAt`.
- Free platforms renew without payment.

### Wallet And Transactions

#### `GET /api/wallet`

Purpose:

- Fetch current user's balance.

Auth:

- Authenticated user.

Response:

- `{ balance }`.

#### `POST /api/wallet`

Purpose:

- Older top-up request endpoint.

Auth:

- Authenticated user.

Validation:

- Zod amount min 10 max 1000.

Business logic:

- Creates pending `TOP_UP`.

Current UI uses `/api/wallet/topup`, so this endpoint appears redundant but still functional.

#### `POST /api/wallet/topup`

Purpose:

- Current wallet top-up request endpoint.

Auth:

- Authenticated user.

Validation:

- Zod amount min 1.

Business logic:

- Loads user's phone number.
- Requires phone number.
- Creates pending `TOP_UP` with `senderWalletNumber` as user phone and hardcoded admin wallet `01026454497`.

#### `GET /api/wallet/topup`

Purpose:

- Fetch current user's top-up transactions.

Auth:

- Authenticated user.

#### `GET /api/transactions`

Purpose:

- Current user's transaction history.

Auth:

- Authenticated user.

Query:

- `page`, `limit`.

Response:

- `{ transactions, pagination }`.

### Student Stats

#### `GET /api/student`

Purpose:

- Student dashboard/profile aggregate.

Auth:

- Student only.

Business logic:

- Fetches all student submissions and total task count.
- Calculates total/pending/approved/rejected, average score, completion rate.
- Returns user summary and recent submissions.

#### `GET /api/student/stats`

Purpose:

- Compact student dashboard stats.

Auth:

- Any authenticated user by current code, though semantically student.

Business logic:

- Counts current user's submissions by status.
- Aggregates average approved score.

### Mentorship Student APIs

#### `GET /api/mentorship`

Purpose:

- Fetch student mentorship home data.

Auth:

- Authenticated user.

Business logic:

- Finds first admin user with `isMentor: true`.
- Fetches current user's bookings.
- Fetches unbooked future available date slots.
- Formats dates.
- Fetches active recorded sessions.
- Returns fixed pricing `{ recordedSession: 100, faceToFaceSession: 500 }`.

Potential issue:

- Recorded sessions have their own price, so fixed `recordedSession: 100` may disagree with records.

#### `POST /api/mentorship`

Purpose:

- Book recorded or face-to-face mentorship.

Auth:

- Authenticated user.

Validation:

- Zod session type, duration 30-180 default 60, optional notes, WhatsApp number, selected date id, recorded session id.

Business logic:

- `RECORDED` requires `recordedSessionId`.
- `FACE_TO_FACE` requires WhatsApp number and `selectedDateId`.
- Finds first admin mentor.
- For recorded: loads active `RecordedSession` and uses its price.
- For live: uses fixed 500 EGP and checks selected `AvailableDate` unbooked.
- Checks balance.
- In transaction:
  - Deducts balance.
  - Creates approved transaction of type `RECORDED_SESSION` or `FACE_TO_FACE_SESSION`.
  - Creates booking with `CONFIRMED` for recorded or `PENDING` for live.
  - For live, marks available date `isBooked: true`.

Known issue:

- It sets `availableDateId` on booking but does not set `AvailableDate.bookingId` in this route, while admin update/cancel logic often expects `bookingId`.

#### `GET /api/mentorship/available-dates`

Purpose:

- Fetch unbooked date slots for students.

Auth:

- Authenticated user.

Query:

- `startDate`, `endDate`
- `grouped=true`

Business logic:

- Defaults to future slots only.
- Can return flat list or grouped by day.

#### `GET /api/mentorship/recorded-sessions`

Purpose:

- Fetch active recorded sessions.

Auth:

- Authenticated user.

#### `POST /api/mentorship/recorded-sessions`

Purpose:

- Purchase a recorded session through a dedicated endpoint.

Auth:

- Authenticated user.

Business logic:

- Validates `recordedSessionId`.
- Requires active recorded session and sufficient wallet balance.
- Prevents duplicate confirmed purchases for the same recorded video link.
- Finds an admin user as mentor.
- In a Prisma transaction, deducts balance, creates an approved `RECORDED_SESSION` transaction, and creates a confirmed recorded `MentorshipBooking`.

Design note:

- This route overlaps with the recorded-session branch in `POST /api/mentorship`. Keep only one purchase flow long term.

### Admin APIs

#### `GET /api/admin/stats`

Purpose:

- Fetch admin overview stats.

Auth:

- Admin only.

Business logic:

- Counts students, users, platforms, submissions by status.
- Aggregates average approved score.
- Counts mentorship bookings by session type and status.

Response:

- Flat object with totals. It does not currently return `platformStats` despite the admin page interface expecting that optional concept.

#### `GET /api/admin/transactions`

Purpose:

- Admin transaction list.

Auth:

- Admin only.

Query:

- `page`, `limit`, `status`, `type`.

Business logic:

- Includes user id/name/email/phone.
- Returns pagination.

#### `PATCH /api/admin/transactions`

Purpose:

- Approve/reject a pending transaction.

Auth:

- Admin only.

Validation:

- Zod `transactionId`, `status` as `APPROVED` or `REJECTED`.

Business logic:

- Ensures transaction exists and is `PENDING`.
- Updates transaction.
- If approving a `TOP_UP`, increments user balance by transaction amount.

#### `GET /api/admin/topup`

Purpose:

- Fetch pending top-up requests only.

Auth:

- Admin only.

#### `POST /api/admin/topup`

Purpose:

- Older approve/reject top-up route.

Auth:

- Admin only.

Validation:

- Zod `transactionId`, action `APPROVE` or `REJECT`.

Business logic:

- Similar to `/api/admin/transactions` but top-up specific.

Current UI mainly uses `/api/admin/transactions`, so this route is redundant but functional.

#### `GET /api/admin/mentorship`

Purpose:

- Admin list of mentorship bookings.

Auth:

- Admin only.

Query:

- `page`, `limit`, `status`.

Business logic:

- Includes student and mentor summaries.
- Computes stats: total, pending, confirmed, completed, cancelled, recorded count, face-to-face count, total revenue excluding cancelled.

#### `PATCH /api/admin/mentorship`

Purpose:

- Update mentorship booking.

Auth:

- Admin only.

Validation:

- Zod `bookingId`, optional status, optional session date, optional meeting/video/admin notes.

Business logic:

- Updates status/notes/links.
- If face-to-face date changes:
  - Marks `dateChanged`.
  - Stores original date.
  - Attempts to free old available date by matching `date` and `bookingId`.
  - Books first free available date on the new day.
- If cancelling:
  - Updates booking.
  - Frees date slot for live sessions.
  - Refunds user balance.
  - Creates approved refund transaction with negative amount string.
- Else simply updates booking.

Potential issues:

- Date slot linking is fragile because booking creation does not set `AvailableDate.bookingId`.
- Cancellation refund transaction uses a negative string for a Decimal field. Prisma may coerce it, but it should be intentional and tested.

#### `PUT /api/admin/mentorship`

Purpose:

- Update current admin's mentor settings.

Auth:

- Admin only.

Validation:

- Zod `mentorRate` 10-200 and `mentorBio` 10-500.

Business logic:

- Sets `isMentor: true`.

#### `GET /api/admin/available-dates`

Purpose:

- Fetch available date slots for admin calendar.

Auth:

- Admin only.

Query:

- `startDate`, `endDate`, `includeBooked=true`.

Default:

- Excludes booked slots unless `includeBooked=true`.

#### `POST /api/admin/available-dates`

Purpose:

- Create one or many available date slots.

Auth:

- Admin only.

Modes:

- Single date: `{ date, startTime, endTime, isRecurring?, dayOfWeek? }`.
- Date range bulk: `{ dateRange, timeSlots, excludeWeekends }`.
- Specific dates array: `{ dates: [...] }`.
- Recurring template: `{ recurringTemplate }`.

Business logic:

- Single creates one slot after duplicate check.
- Bulk generates days in range and time slots, skipping weekends when requested.
- Uses batch loop and `Promise.allSettled`, skipping unique duplicates.
- Recurring template creates one slot with template date `2025-01-01`.

Weekend inconsistency:

- API `isWeekend` treats Sunday and Saturday as weekend.
- Calendar helper `filterWeekdays` treats Friday and Saturday as weekend.
- Admin bulk modal labels Friday/Saturday as weekend.

#### `PUT /api/admin/available-dates`

Purpose:

- Update an unbooked available date slot.

Auth:

- Admin only.

Business logic:

- Blocks updates to booked slots.
- Recomputes `timeSlot`.

#### `DELETE /api/admin/available-dates`

Purpose:

- Delete one unbooked slot or all unbooked slots.

Auth:

- Admin only.

Query:

- `id`
- `deleteAll=true`

Business logic:

- Blocks deletion of booked slot.

#### `GET /api/admin/recorded-sessions`

Purpose:

- Admin list of all recorded sessions.

Auth:

- Admin only.

#### `POST /api/admin/recorded-sessions`

Purpose:

- Create recorded session.

Auth:

- Admin only.

Validation:

- Zod title, optional description, URL video link, positive price, optional active flag.

#### `PUT /api/admin/recorded-sessions`

Purpose:

- Update recorded session by body `id`.

Auth:

- Admin only.

#### `DELETE /api/admin/recorded-sessions`

Purpose:

- Delete recorded session by query `id`.

Auth:

- Admin only.

### Users

#### `GET /api/users`

Purpose:

- Admin list users.

Auth:

- Admin only.

Query:

- `role`
- `includeProgress=true`

Business logic:

- Selects public user fields.
- If progress requested, includes submissions and computes per-user stats.

#### `POST /api/users`

Purpose:

- Admin creates user.

Auth:

- Admin only.

Validation:

- Zod name, email, phoneNumber, password min 6, role default student.

Business logic:

- Rejects duplicate email/phone.
- Hashes password.
- Creates user.

#### `PUT /api/users?id=...`

Purpose:

- Admin updates user.

Auth:

- Admin only.

Validation:

- Optional name, phoneNumber, role.

Business logic:

- Blocks admin changing their own role.

#### `DELETE /api/users?id=...`

Purpose:

- Admin deletes user.

Auth:

- Admin only.

Business logic:

- Blocks deleting self.
- Blocks deletion if user has submissions, transactions, enrollments, or mentorship bookings.
- Then deletes user.

## 8. Student Dashboard

File:

- `src/app/(dashboard)/student/page.tsx`

Student layout:

- `src/app/(dashboard)/student/layout.tsx`

### Layout

`StudentLayout`:

- Client component.
- Uses `useSession`, `usePathname`, and `signOut`.
- Sticky horizontal navigation.
- Mobile dropdown menu.
- Tabs/routes:
  - Dashboard: `/student`
  - Mentorship: `/student/mentorship`
  - Profile: `/student/profile`
- Uses `window.location.href` for tab navigation rather than Next router.

### Data Fetching

Dashboard fetches in parallel:

- `/api/platforms?include_tasks=true`
- `/api/student/stats`
- `/api/wallet`
- `/api/enrollments`
- `/api/transactions?limit=5`

State:

- `platforms`
- `stats`
- `wallet`
- `enrollments`
- `transactions`
- loading flags
- selected task and submission modal visibility

Client cache:

- A `DataCache` class exists with TTL support, but the student dashboard mainly clears it and does not heavily use cache reads.

Auth behavior:

- If unauthenticated, redirects to `/login`.
- If admin, redirects to `/admin`.

### Main Sections

Left column:

- `StatsSection`
- `WalletSection`
- `ExpirationNotifications`

Right column:

- Platform cards with tasks.
- JavaScript platform sorted first.

### Stats Section

Displays:

- Total submissions.
- Approved submissions.
- Pending submissions.
- Average score.
- Progress rings:
  - completion rate based on approved/total submissions.
  - average score.
  - performance level.

Potential issue:

- `completionRate` is based on approved submissions divided by total submissions, not total tasks. This is a submission approval ratio, not course completion.

### Wallet Section

Displays:

- Current balance.
- Top-up form.
- Top-up flow posts to `/api/wallet/topup`.
- On success, refreshes dashboard data.

Top-up requirements:

- Amount numeric.
- Server requires user phone number.

### Enrollment And Platform Cards

The dashboard maps platforms and passes:

- `platform`
- `enrollments`
- `onTaskClick`
- `onEnrollmentSuccess`

Platform behavior:

- Shows enrollment state.
- Paid platforms require balance through `/api/enrollments`.
- Expired enrollments can be renewed through `PUT /api/enrollments`.
- Enrollment expiration states come from `/api/enrollments`.
- Platform/task access on API side enforces active enrollment for specific platform/task reads.

### Task Cards

Tasks include:

- Submission status from `/api/platforms?include_tasks=true`.
- Task links.
- Submission action opens `SubmissionModal`.

Submission status lifecycle:

- No submission: can submit.
- `PENDING`: waiting for admin.
- `APPROVED`: score/feedback can be displayed.
- `REJECTED`: intended to allow retry, but database unique constraint blocks a new submission row.

### Submission Modal

Inputs:

- Task link display.
- Textarea summary.

Action:

- `POST /api/submissions` with `{ taskId, summary }`.
- On success, closes and refreshes.
- On failure, uses `alert`.

### Expiration Notifications

Uses enrollment statuses:

- `active`
- `expiring_soon`
- `expired`

Purpose:

- Warn student when access is near expiration or expired.

## 9. Student Mentorship

File:

- `src/app/(dashboard)/student/mentorship/page.tsx`

Components:

- `src/components/mentorship/LiveSessionBooking.tsx`
- `src/components/mentorship/RecordedSessionsList.tsx` was unused and safe to remove.
- `src/components/calendar/CalendlyStudentCalendar.tsx`

### Data Fetching

The mentorship page fetches:

- `/api/mentorship`
- `/api/transactions?limit=10`
- `/api/mentorship/available-dates`

It merges available dates from the dedicated endpoint into the `/api/mentorship` payload.

### Page Sections

`MentorshipSection`:

- Shows mentor card.
- Shows live booking UI.
- Uses `LiveSessionBooking`.

`BookedSessionsSection`:

- Shows booked sessions.
- Shows mentor name, session type, status badge, amount, date, time, WhatsApp number, notes, links.
- Includes transaction history dropdown filtered to mentorship/session transactions.

### Recorded Sessions

Backend supports recorded sessions via:

- `RecordedSession` model.
- `/api/admin/recorded-sessions`.
- `/api/mentorship` recorded purchase branch.
- `/api/mentorship/recorded-sessions` GET.

Frontend status:

- The current `/student/mentorship` page focuses on live booking.
- The old `RecordedSessionsList` component was unused and has been removed.
- A stale recorded-session modal implementation in the student dashboard file was unused, referenced missing symbols, and has been removed.

### Face-To-Face Sessions

Flow:

1. Student selects a date in `CalendlyStudentCalendar`.
2. `LiveSessionBooking` lists available time slots for the selected date.
3. Student chooses a time.
4. Student enters WhatsApp number and optional notes.
5. Component posts to `/api/mentorship` with:
   - `sessionType: FACE_TO_FACE`
   - `duration: 60`
   - `selectedDateId`
   - `whatsappNumber`
   - `studentNotes`
6. Server checks balance against 500 EGP.
7. Server deducts balance, creates transaction, creates `PENDING` booking, marks slot booked.
8. Admin later confirms/cancels/completes and can add meeting link/admin notes.

Live booking status lifecycle:

- `PENDING`: booked by student, awaiting admin confirmation.
- `CONFIRMED`: admin confirmed and may provide meeting link.
- `COMPLETED`: finished.
- `CANCELLED`: cancelled, refund should be created.

### Pricing

Current pricing:

- Face-to-face: fixed 500 EGP in `/api/mentorship`.
- Recorded: recorded session record price.
- `/api/mentorship` GET also returns fixed `recordedSession: 100` and `faceToFaceSession: 500`, which can conflict with recorded session prices.

## 10. Calendar System

Files:

- `src/utils/calendar-helpers.ts`
- `src/components/calendar/CalendarBase.tsx`
- `src/components/calendar/TimeSlotGrid.tsx`
- `src/components/calendar/CalendlyAdminCalendar.tsx`
- `src/components/calendar/CalendlyStudentCalendar.tsx`
- `src/components/calendar/index.ts`

### calendar-helpers

Exports:

- `TIME_SLOTS`: 09:00-18:00 hourly slots.
- `formatDateArabic(date)`: date-fns Arabic formatting.
- `formatDateForAPI(date)`: ISO string.
- `formatTimeArabic(time)`: 24-hour to Arabic AM/PM label.
- `generateCalendarDays(currentDate)`: full visible calendar grid with Saturday week start.
- `isDateAvailable(date, availableDates)`.
- `getAvailableTimeSlotsForDate(date, availableDates)`.
- `getNextMonth`, `getPreviousMonth`.
- `isDateInPast`, `isDateToday`, `isDateInCurrentMonth`.
- `createTimeSlotKey`, `parseTimeSlotKey`.
- `generateDateRange`.
- `filterWeekdays`: excludes Friday and Saturday.
- `getDateCellClasses`.
- `getTimeSlotClasses`.

### CalendarBase

Responsibilities:

- Month navigation.
- Calendar grid rendering.
- Default date cell rendering with available/today/selected/past styling.
- Arabic month display via date-fns locale.
- Legend for available, selected, today.

Inputs:

- `currentDate`
- `onDateChange`
- `availableDates`
- optional `onDateSelect`
- optional `selectedDate`
- optional custom `renderDateCell`

### TimeSlotGrid

Admin-focused time slot manager.

Responsibilities:

- Show configured `TIME_SLOTS` for selected date.
- Identify existing slots from `availableDates`.
- Identify booked slots.
- Allow click/drag selection.
- Allow bulk apply selected slots.
- Allow remove existing unbooked slots.

Callbacks:

- `onTimeSlotToggle`
- `onBulkSelect`

### CalendlyAdminCalendar

Admin wrapper around `CalendarBase` and `TimeSlotGrid`.

Responsibilities:

- Selected date state.
- Bulk operation modal.
- Single slot create/delete.
- Bulk slot create for one day.
- Date-range bulk create.
- Refresh after changes.

Bulk creation:

- Admin selects start/end dates.
- Chooses time slots.
- Chooses whether to exclude weekends.
- Calls API through parent `DatesTab`.

### CalendlyStudentCalendar

Student wrapper around `CalendarBase`.

Responsibilities:

- Transform mentorship available date shape into calendar helper shape.
- Enforce optional min/max date.
- Disable selection when disabled.
- Call `onDateChange` when a selectable available date is chosen.
- Show empty state until selected.

Known type issue:

- Some older code calls it with `onDateSelect`, but its props define `onDateChange`. Build errors are currently ignored.

## 11. Admin Dashboard

File:

- `src/app/(dashboard)/admin/page.tsx`

Size:

- Large single client component file, roughly 185 KB. It contains the dashboard, tabs, modals, forms, filters, pagination, confirmation UI, and dates tab.

### Top-Level State

Important state:

- `activeTab`: `overview`, `students`, `submissions`, `platforms`, `tasks`, `users`, `transactions`, `mentorship`, `dates`.
- `overviewStats`
- `students`
- `submissions`
- `platforms`
- `tasks`
- `users`
- `transactions`
- `mentorshipBookings`
- modal state for review, CRUD, delete, confirmation.
- pagination for submissions, transactions, mentorship.

### Cache System

`DataCache` stores:

- `data`
- `timestamp`
- `ttl`

Cache keys include tab names and pages.

Approximate TTLs:

- Overview: 2 minutes.
- Students: 5 minutes.
- Submissions: 3 minutes.
- Platforms/tasks: 10 minutes.
- Users: 5 minutes.
- Transactions/mentorship: 2 minutes.

Cache invalidation:

- `invalidateCache` deletes matching keys from the private map through bracket access.
- CRUD and approval actions invalidate affected tab caches.

### Data Loading

`fetchAdminData(tab, page, useCache)` routes:

- overview: `/api/admin/stats`
- students: `/api/users?role=STUDENT&includeProgress=true`
- submissions: `/api/submissions?page=...&limit=...`
- platforms: `/api/platforms`
- tasks: `/api/tasks`
- users: `/api/users?includeProgress=false`
- transactions: `/api/admin/transactions?page=...&limit=...`
- mentorship: `/api/admin/mentorship?page=...&limit=...`
- dates: rendered through `DatesTab`, which fetches its own data.

### Tabs

#### Overview

Component:

- `OverviewTab`

Displays:

- Total users.
- Total students.
- Total submissions.
- Pending submissions.
- Other fields are available in API but not all are rendered in the compact section.

#### Students

Component:

- `StudentsTab`

Features:

- Fetches all students for local stats/filtering.
- Filters by search, score range, completed task range, date range.
- Stats: total, active, inactive, high performers, average score, total completed tasks.
- Student table cards.
- Student detail modal.

#### Submissions

Component:

- `SubmissionsTab`

Features:

- Shows submission cards.
- Shows task/platform/user/status/score/feedback/summary.
- Pagination.
- Review button opens `ReviewModal`.

Review modal:

- Allows status `PENDING`, `APPROVED`, `REJECTED`.
- Score input 0-100.
- Feedback textarea.
- Sends `PATCH /api/submissions/[id]`.
- Uses toast success/error.

#### Transactions

Component:

- `TransactionsTab`

Features:

- Fetches page data from parent plus fetches `/api/admin/transactions?limit=1000` for stats/filtering.
- Filters by status, type, search, date range, amount range.
- Stats: total, pending, approved, rejected, total amount, approved amount.
- Approve/reject buttons for pending transactions.
- Uses confirmation modal before patching.

Transaction update:

- Parent `handleTransactionStatusConfirm` stores pending action.
- Confirmation calls `PATCH /api/admin/transactions`.
- On approve, top-up transactions credit balance server-side.

#### Mentorship Bookings

Component:

- `MentorshipTab`

Features:

- List bookings.
- Pagination.
- Status actions for confirming/cancelling.
- Update modal for selected booking.
- Can set meeting/video/admin notes and session date.
- Confirmation modal for confirm/cancel.

#### Available Dates

Component:

- `DatesTab`

Features:

- Fetches `/api/admin/available-dates`.
- Shows total, available, booked, recurring counts.
- Shows booking rate.
- Uses `CalendlyAdminCalendar`.
- Creates single slots.
- Deletes slots through confirmation.
- Bulk creates slots for a selected day or date range.

#### Platforms

Component:

- `PlatformsTab`

Features:

- Table of platforms.
- Create/edit/delete through `CrudModal` and delete confirmation.
- Uses `/api/platforms`.

#### Tasks

Component:

- `TasksTab`

Features:

- Table of tasks.
- Create/edit/delete through `CrudModal`.
- Uses `/api/tasks`.
- Requires platform options for create/edit.

#### Users

Component:

- `UsersTab`

Features:

- Table of users.
- Create/edit/delete through `CrudModal`.
- Uses `/api/users`.

### Optimistic Updates

CRUD `submitForm` applies local optimistic updates before server request:

- Adds new entity placeholder on create.
- Replaces selected entity on update.
- Filters entity out on delete.

Rollback:

- On error, invalidates cache and refetches relevant data.

### Confirmation Modals

The admin dashboard contains confirmation modal utilities for:

- Approving/rejecting transactions.
- Confirming/cancelling bookings.
- Deleting time slots.
- Deleting CRUD entities.

### Toasts

Admin wraps content in `ToastProvider` and uses `useToastHelpers`.

Toast types:

- success
- error
- warning
- info

## 12. Frontend Architecture And Styling

### Shared Components

Landing:

- `DigitalRain`: full-screen matrix rain canvas animation.
- `MatrixParticles`: canvas particles with programming characters.
- `TerminalDemo`: animated Arabic terminal content.
- `magicui/terminal`: animated span typing and terminal shell container.

Calendar:

- `CalendarBase`
- `TimeSlotGrid`
- `CalendlyAdminCalendar`
- `CalendlyStudentCalendar`

Mentorship:

- `LiveSessionBooking`

UI:

- `ToastProvider`, `useToast`, `useToastHelpers`.

### Global CSS

`globals.css` includes:

- Tajawal Google Font import.
- Tailwind layers.
- Apple-inspired CSS variables.
- Dark mode token adjustments.
- Base font set to Arabic/Tajawal stack.
- Global input/textarea/select color.
- Gradient text utilities.
- Focus-visible styling.
- Global transition rule for `*`.
- Glass and glass-dark classes.
- Animation keyframes and classes.
- Reduced-motion media query.
- Tailwind v4-like `@theme inline` block even though project uses Tailwind v3.

Potential CSS issues:

- Global `* { transition: all ... }` can hurt performance and cause unexpected animation.
- `@theme inline` is Tailwind v4 syntax and not meaningful in Tailwind v3.
- Duplicate animation names exist.
- `tailwind.config.js` has two `fontFamily` entries inside `extend`; the latter overwrites the earlier one.
- Tailwind plugin references `apple-blue-hover`, which is not defined in colors.

### Tailwind Config

Content paths:

- `src/pages`
- `src/components`
- `src/app`

Theme extensions:

- Apple-inspired colors.
- Gray palette.
- Legacy primary/secondary/accent/neutral palettes.
- Geist-based font families.
- Font sizes, spacing, radius, shadows, blur, transitions, animations.

Plugin adds:

- `.btn-apple`
- `.btn-apple-secondary`
- `.card-apple`
- `.glass`
- `.input-apple`
- `.text-gradient-apple`

## 13. Landing Page

File:

- `src/app/page.tsx`

Visual system:

- Black Matrix-style background.
- `DigitalRain` canvas animation.
- `MatrixParticles` canvas.
- Floating programming icons and snippets.
- Glassmorphism header.
- Signup/login buttons with green glow.
- Terminal demo with animated Arabic typing.

Components:

- `DigitalRain`
- `MatrixParticles`
- `TerminalDemo`
- `Terminal`, `AnimatedSpan`

Routing:

- Signup button links to `/signup`.
- Login button links to `/login`.

## 14. Enrollment And Wallet System

### Enrollment Purchase

Endpoint:

- `POST /api/enrollments`

Rules:

- Free platforms: enroll immediately for 30 days.
- Paid platforms: require sufficient balance, deduct price, create approved platform purchase transaction, enroll for 30 days.
- Duplicate enrollment is blocked by API and DB unique constraint.

### Enrollment Expiration

Rules:

- `expiresAt` determines access.
- API returns status:
  - `expired` when now > expiresAt.
  - `expiring_soon` when days remaining <= 7.
  - `active` otherwise.
- Platform/task detail APIs deny access when expired.

### Renewal

Endpoint:

- `PUT /api/enrollments`

Rules:

- Only expired enrollments can be renewed.
- Paid renewal requires balance and creates approved purchase transaction.
- Renewal extends 30 days from now and sets `lastRenewalAt`.

### Wallet Top-Up

Student flow:

1. Student opens wallet top-up form.
2. UI posts to `/api/wallet/topup`.
3. Server creates pending `TOP_UP` transaction.
4. Admin approves/rejects in transactions tab.
5. Approval increments balance.

Statuses:

- `PENDING`: awaiting admin.
- `APPROVED`: balance credited if top-up.
- `REJECTED`: no balance change.

### Transaction Types

Used correctly:

- `TOP_UP`
- `PLATFORM_PURCHASE`
- `RECORDED_SESSION`
- `FACE_TO_FACE_SESSION`

Defined but not central:

- `MENTORSHIP_PAYMENT`

Incorrect/legacy UI labels:

- Recent transactions page refers to `DEPOSIT`, `ENROLLMENT`, `MENTORSHIP`, which do not match current enum values.
- The dedicated recorded-session route previously used legacy enum values and has been corrected to the current schema.

## 15. Deployment, Environment, And Scripts

### Required Environment Variables

Minimum required for runtime:

- `POSTGRES_URL_NON_POOLING`: Prisma datasource URL.
- `SUPABASE_JWT_SECRET`: currently used as NextAuth secret in `auth.ts` and middleware.
- `NEXTAUTH_URL`: required by NextAuth in deployed environments.

Also present/relevant:

- `NEXTAUTH_SECRET`: present but not used by current `authOptions` because `secret` uses `SUPABASE_JWT_SECRET`.
- `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_HOST`: present for hosted Postgres/Supabase workflows.
- `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: present but Supabase client is not used in current source.

Recommendation:

- Standardize on `NEXTAUTH_SECRET` for NextAuth and middleware unless there is a specific reason to reuse Supabase JWT secret.
- Do not commit `.env`.

### NPM Scripts

From `package.json`:

- `npm run dev`: `next dev`
- `npm run build`: `next build`
- `npm run start`: `next start`
- `npm run lint`: `next lint`
- `postinstall`: `prisma generate`
- `npm run prisma:generate`: `prisma generate`
- `npm run prisma:migrate`: `prisma migrate dev`
- `npm run prisma:studio`: `prisma studio`
- `npm run prisma:seed`: `node prisma/seed.js`

### Prisma Seed

File:

- `prisma/seed.js`

Creates/updates:

- Five paid platforms at 400 EGP.
- Platform tasks for algorithms, OOP, SOLID/design patterns, and JavaScript Tasks.
- Admin user `admin@codehub.com` with password `admin123`.
- Sample student `student@codehub.com` with password `student123`.
- Sample transaction.
- Recorded session.
- Sample mentorship bookings.

Security note:

- Default credentials should not be used in production.

### Maintenance Scripts

`scripts/enroll-existing-users.js`:

- Finds or creates JavaScript Tasks platform.
- Enrolls existing students not already enrolled.
- Gives 365-day expiration.
- Processes users in batches.

`scripts/run-enrollment.js`:

- Wrapper for enrollment script.
- Loads dotenv.

`scripts/reset-user-balances.js`:

- Resets all user balances to zero.
- Destructive operation.

`scripts/restore-users.js`:

- Restores users from `prisma/backup/users_rows.sql`.
- This is operationally sensitive because the backup contains user data and password hashes.
- If retained, it should be excluded from distribution and handled securely.

Root one-off scripts before cleanup:

- `clean-user-names.js`
- `delete-suspicious-users.js`
- `fix-user-roles.js`

These were not referenced by `package.json`; they are destructive/manual DB maintenance scripts and not required for app functionality.

### Deployment Targets

The project is a standard Next.js app and can deploy to:

- Vercel: best fit for Next.js App Router.
- Railway or Render: possible via `npm run build` and `npm run start` with a PostgreSQL URL.

Deployment requirements:

- Set runtime env vars.
- Run Prisma migrations against production DB.
- Generate Prisma client during install/build.
- Ensure Node version supports Next.js 15 and React 19.

Important build caveat:

- `next.config.mjs` ignores TypeScript and ESLint failures. Deployment can succeed with broken routes/types.

## 16. Known Issues And Incomplete Areas

High priority:

1. Build hides errors.
   - `next.config.mjs` has `typescript.ignoreBuildErrors = true` and `eslint.ignoreDuringBuilds = true`.
   - `npx tsc --noEmit` now passes, but ESLint should be run before removing both ignores.

2. Submission retry after rejection is broken.
   - API intends to allow retry.
   - DB unique `[userId, taskId]` blocks creating a second submission.
   - Fix by updating rejected submission back to pending, deleting rejected row before create, or changing schema to support attempts.

3. AvailableDate booking linkage is incomplete.
   - Booking creation marks `isBooked` but does not set `bookingId`.
   - Admin cancel/date-change logic expects `bookingId`.
   - Add explicit Prisma relation or consistently set both sides.

4. Encoding problem.
   - Many Arabic strings appear mojibake-encoded.
   - Convert files to UTF-8 and restore Arabic copy.

Medium priority:

1. Auth secret inconsistency.
   - `.env` has `NEXTAUTH_SECRET`, but auth uses `SUPABASE_JWT_SECRET`.

2. Signup balance/welcome transaction mismatch.
   - User balance set to 0 but welcome approved transaction amount 500.
   - Decide whether welcome balance should actually be credited.

3. Duplicate wallet top-up endpoints.
   - `/api/wallet` POST and `/api/wallet/topup` POST overlap.
   - `/api/admin/topup` overlaps with `/api/admin/transactions`.

4. Recent transactions labels are stale.
   - Uses old type labels `DEPOSIT`, `ENROLLMENT`, `MENTORSHIP`.

5. Admin dashboard is too large.
   - Split tabs/modals/forms into separate components.
   - Move shared API client/filter helpers out of the page.

6. Calendar weekend rules conflict.
   - API excludes Saturday/Sunday.
   - Helpers and UI copy suggest Friday/Saturday.

7. Admin/student platform and task access.
   - Admins may be blocked by enrollment checks on some GET routes.

8. Mentor selection.
   - Uses first admin mentor. No way to choose among multiple mentors.

9. Hardcoded admin wallet number.
   - `01026454497` appears in signup/top-up routes.
   - Move to env/config table.

10. Prisma client logs every query.
   - `src/lib/prisma.ts` logs `query`, noisy and potentially expensive in production.

11. Root layout uses Geist instead of Tajawal as Next font, while CSS imports Tajawal.
   - Font strategy should be simplified and optimized.

Low priority:

1. Public static Next.js SVGs were unused.
2. `@theme inline` in CSS is Tailwind v4 syntax in a Tailwind v3 app.
3. Global transition on `*` can reduce UI performance.
4. Some API errors return plain text while most return JSON.
5. Zod validation is not consistently used across all routes.

## 17. Cleanup Performed

Removed because they do not affect app functionality:

- Empty component: `src/components/mentorship/candlymentorship.tsx`.
- Duplicate non-routed signup handler: `src/app/api/auth/signup/_.ts`.
- Unused default public SVGs: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`.
- Unused old component: `src/components/mentorship/RecordedSessionsList.tsx`.
- Old planning docs after this reference supersedes them.
- One-off root DB scripts not referenced by `package.json`.
- Duplicate `prisma/corr/seed.js`; `prisma/seed.js` is the authoritative seed file.
- Sensitive backup `prisma/backup/users_rows.sql` and its restore script; the backup contained user data/password hashes and should not live in the app repo.
- Unused dependencies: Express, jsonwebtoken, multer, cors, express-validator, duplicate `@next-auth/prisma-adapter`, Heroicons, react-calendar, react-hook-form, hookform resolvers, react-intersection-observer, `pg`, `ts-node`, `ts-node-dev`, and related unused type packages.

Code cleanup fixes also applied:

- Dedicated recorded-session purchase route now uses valid Prisma enum values and defined variables.
- Removed stale unused `MentorshipModal` code from the student dashboard.
- Fixed strict TypeScript mismatches in admin calendar callbacks, optimistic entity names, session phone normalization, canvas animation refs, and profile join-date fallback.

## 18. Recommended Next Steps

Priority order:

1. Re-enable TypeScript and ESLint build checks, then fix any ESLint-only surfaced issues.
2. Consolidate recorded-session purchase paths (`/api/mentorship` and `/api/mentorship/recorded-sessions`) so there is one canonical flow.
3. Fix Arabic file encoding.
4. Fix submission retry semantics.
5. Add robust booking/available-date relation and update booking creation/cancel/update logic.
6. Consolidate duplicate wallet/top-up APIs and update UI to one flow.
7. Address `npm audit` findings after confirming safe dependency upgrades.
8. Split admin dashboard into smaller components.
9. Move hardcoded prices/wallet numbers into config or DB.
10. Add tests for critical money flows:
    - top-up approve/reject
    - paid enrollment purchase
    - renewal
    - mentorship booking
    - cancellation/refund
11. Add role/access tests for API handlers.
12. Review production deployment config and secrets.

## 19. Quick Mental Model For Future Work

Student flow:

`signup -> JWT session -> /student -> enroll/buy platform -> tasks -> submission -> admin review -> progress stats`

Wallet flow:

`student top-up request -> pending transaction -> admin approval -> balance increment -> purchases deduct balance`

Mentorship flow:

`admin creates availability/recorded sessions -> student books -> balance deducted -> booking created -> admin confirms/cancels/completes -> optional refund on cancel`

Admin flow:

`/admin tab -> fetch API data -> local cache -> filter/paginate -> modal action -> API mutation -> toast -> cache invalidation/refetch`

The main architectural truth: most business rules live in API route handlers, while dashboards are large client-side orchestration components that call those APIs directly.
