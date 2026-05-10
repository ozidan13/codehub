# CodeHub Mobile Application — Technical Architecture Brief

**Version**: 1.1  
**Date**: 2026-05-10  
**Author**: Senior Mobile & Systems Architect  
**Status**: Ready for Engineering Review  

---

## 1. Executive Summary

This document provides a complete, production-ready architecture and implementation blueprint for building a cross-platform mobile application for the **CodeHub** learning platform. The mobile application will consume the **exact same backend APIs, authentication system, database, and business logic** as the existing Next.js 15 web application, ensuring zero duplication of backend infrastructure and perfect synchronization across platforms.

**Primary Goal**: Deliver a native-quality Android and iOS application that mirrors web functionality while adding mobile-native capabilities (offline access, push notifications, biometric auth), without modifying the existing backend.

**Secondary Goal**: Establish an architecture that allows web UI changes to propagate to mobile with minimal effort through shared contracts and automated code generation where applicable.

---

## 2. Framework Selection & Justification

### 2.1 Recommended Framework: React Native with Expo

| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.74+ | Core cross-platform UI framework |
| Expo SDK | 51+ | Development environment, OTA updates, native modules |
| TypeScript | 5.3+ | Type safety (same as web) |
| Expo Router | 3.0+ | File-system based navigation |
| Zustand | 4.5+ | Lightweight state management |
| TanStack Query | 5.0+ | Server state, caching, synchronization |
| React Hook Form | 7.51+ | Form management (same as web if applicable) |
| Zod | 3.23+ | Schema validation (identical to web) |
| Axios | 1.7+ | HTTP client with interceptors |
| date-fns | 3.6+ | Date formatting (identical to web) |

### 2.2 Why React Native / Expo?

1. **Ecosystem Alignment**: The web team already uses React 19 + TypeScript. React Native shares the same component model, hooks, and patterns. Developer onboarding is near-instant.
2. **API Compatibility**: The existing REST API (`/api/*`) requires no changes. Every endpoint—auth, platforms, tasks, submissions, wallet, mentorship—works identically from mobile.
3. **Code Sharing Potential**: Business logic, Zod schemas, utility functions (`dateUtils`, validation), and TypeScript types can be extracted into a shared `@codehub/shared` package.
4. **Expo Benefits**:
   - **EAS Build**: Cloud builds for Android (APK/AAB) and iOS (IPA) without local Android Studio/Xcode setup.
   - **OTA Updates**: Push JS bundle updates without app store review cycles.
   - **Expo Modules**: Push notifications, biometric auth, secure storage, image picker—all pre-integrated.
   - **Expo Dev Client**: Development builds with native debugging.
5. **Native Performance**: True native UI (not WebView), 60fps animations, native gesture handling.

### 2.3 Alternatives Considered

| Framework | Why Rejected |
|-----------|-------------|
| Flutter | Dart learning curve; no code sharing with React web team; backend integration identical but team velocity lower. |
| Ionic / Capacitor | WebView-based; performance inferior for complex lists/animations; feels less "native" to users. |
| Native (Kotlin/Swift) | Double maintenance, double testing, no code sharing, longer time-to-market. |

---

## 3. High-Level Architecture

### 3.1 System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├──────────────────────┬──────────────────────────────────────────┤
│   Web (Next.js 15)   │   Mobile (React Native + Expo)           │
│   - Browser/SSR/CSR  │   - iOS/Android native                   │
│   - NextAuth sessions│   - JWT stored in Keychain/Keystore      │
└──────────────────────┴──────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│              Next.js 15 API Routes (src/app/api)                 │
│   - /api/auth/*          - /api/platforms/*                      │
│   - /api/tasks/*         - /api/submissions/*                    │
│   - /api/enrollments/*   - /api/wallet/*                         │
│   - /api/transactions/*  - /api/mentorship/*                     │
│   - /api/admin/*         - /api/users/*                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (UNCHANGED)                       │
│   PostgreSQL + Prisma ORM v6                                     │
│   Same schema, same migrations, same enums                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile Architecture Layers

```
┌─────────────────────────────────────────────┐
│  PRESENTATION LAYER                          │
│  - Screens (route-mapped)                    │
│  - Components (shared, feature-specific)     │
│  - Native UI (React Native primitives)       │
├─────────────────────────────────────────────┤
│  STATE LAYER                                 │
│  - Zustand (client UI state)                 │
│  - TanStack Query (server state, cache)      │
│  - MMKV (persistent local storage)            │
├─────────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER                        │
│  - API Client (Axios + interceptors)         │
│  - Authentication Manager                    │
│  - Push Notification Service                 │
│  - Biometric Auth Service                    │
│  - Offline Sync Engine                       │
├─────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                        │
│  - Expo Modules (secure-storage, notif)      │
│  - NetInfo (connectivity detection)          │
│  - Background Tasks (expo-background-fetch)  │
└─────────────────────────────────────────────┘
```

---

## 4. Project Structure

```
codehub-mobile/
├── app/                              # Expo Router file-system routes
│   ├── (auth)/                       # Auth group (no tab bar)
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (app)/                        # Main app group (with tab bar)
│   │   ├── _layout.tsx               # Tab navigator + auth guard
│   │   ├── index.tsx                 # Dashboard (Student home)
│   │   ├── platforms/
│   │   │   ├── index.tsx             # Platform list
│   │   │   └── [id].tsx              # Platform detail + tasks
│   │   ├── tasks/
│   │   │   └── [id].tsx              # Task detail + submission
│   │   ├── mentorship/
│   │   │   ├── index.tsx             # Mentorship home
│   │   │   ├── book.tsx              # Book live session
│   │   │   └── recorded.tsx          # Recorded sessions
│   │   ├── calendar/
│   │   │   └── index.tsx             # Availability calendar
│   │   ├── wallet/
│   │   │   └── index.tsx             # Wallet + top-up
│   │   ├── profile/
│   │   │   └── index.tsx             # User profile
│   │   └── transactions/
│   │       └── index.tsx             # Transaction history
│   ├── admin/                        # Admin dashboard (protected)
│   │   ├── _layout.tsx
│   │   └── index.tsx                 # Admin home with tabs
│   └── _layout.tsx                   # Root layout (providers)
│
├── src/
│   ├── api/                          # API client & endpoints
│   │   ├── client.ts                 # Axios instance with interceptors
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── platforms.ts
│   │   ├── tasks.ts
│   │   ├── submissions.ts
│   │   ├── enrollments.ts
│   │   ├── wallet.ts
│   │   ├── transactions.ts
│   │   ├── mentorship.ts
│   │   ├── admin.ts
│   │   └── users.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePlatforms.ts
│   │   ├── useSubmissions.ts
│   │   ├── useWallet.ts
│   │   ├── useMentorship.ts
│   │   ├── useCalendar.ts
│   │   ├── useOffline.ts
│   │   └── usePushNotifications.ts
│   │
│   ├── stores/                       # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts                # Theme, toasts, modals
│   │   └── notificationStore.ts
│   │
│   ├── services/                     # Business logic services
│   │   ├── AuthService.ts            # Login, logout, token refresh
│   │   ├── BiometricService.ts       # Face ID / fingerprint
│   │   ├── PushNotificationService.ts
│   │   ├── OfflineSyncService.ts
│   │   └── CacheService.ts           # MMKV wrapper
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # Primitives (Button, Input, Card)
│   │   ├── PlatformCard.tsx
│   │   ├── TaskCard.tsx
│   │   ├── StatsCard.tsx
│   │   ├── WalletCard.tsx
│   │   ├── Calendar/
│   │   │   ├── CalendarBase.tsx
│   │   │   ├── TimeSlotGrid.tsx
│   │   │   └── index.ts
│   │   ├── Mentorship/
│   │   │   ├── LiveSessionBooking.tsx
│   │   │   └── RecordedSessionCard.tsx
│   │   └── layout/
│   │       ├── TabBar.tsx
│   │       ├── Header.tsx
│   │       └── SafeAreaWrapper.tsx
│   │
│   ├── types/                          # TypeScript types (mirrors web)
│   │   ├── api.ts                      # API request/response types
│   │   ├── models.ts                   # Domain models
│   │   └── navigation.ts             # Expo Router typed routes
│   │
│   ├── constants/                      # App constants
│   │   ├── config.ts                 # API base URL, timeouts
│   │   ├── colors.ts                   # Brand colors (match web)
│   │   ├── fonts.ts
│   │   └── enums.ts                    # Replicated from Prisma
│   │
│   ├── utils/                          # Utility functions
│   │   ├── dateUtils.ts              # Shared with web (date-fns)
│   │   ├── formatters.ts
│   │   ├── validators.ts             # Zod schemas (shared with web)
│   │   └── crypto.ts                 # Token hashing/encryption
│   │
│   └── lib/                          # 3rd party wrappers
│       ├── tanstack-query.ts
│       └── zustand.ts
│
├── assets/                             # Images, fonts, icons
│   ├── images/
│   ├── fonts/
│   └── animations/
│
├── shared/                             # SHARED PACKAGE (symlink or npm link)
│   ├── package.json
│   ├── types/
│   │   └── index.ts                    # Identical to web src/types/index.ts
│   ├── validation/
│   │   └── schemas.ts                  # Zod schemas from web API routes
│   └── utils/
│       └── dateUtils.ts                # Identical to web src/lib/dateUtils.ts
│
├── .env.development
├── .env.production
├── app.json                            # Expo configuration
├── eas.json                            # EAS Build configuration
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. State Management Strategy

### 5.1 Dual-State Architecture

We use a **dual-state** approach that cleanly separates ephemeral UI state from persistent server state.

#### Server State → TanStack Query (React Query)

```typescript
// src/hooks/usePlatforms.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: () => api.get('/api/platforms?include_tasks=true').then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 minutes (match web DataCache TTL)
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { taskId: string; summary: string }) =>
      api.post('/api/submissions', data),
    onSuccess: () => {
      // Invalidate all submission-related caches
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
```

**Why TanStack Query:**
- Automatic caching with TTL (mirrors web `DataCache` behavior)
- Background refetching when app regains focus
- Optimistic updates for instant UI feedback
- Retry logic with exponential backoff
- Offline detection + automatic refetch on reconnect

#### Client State → Zustand

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; name: string; role: 'STUDENT' | 'ADMIN' } | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
    }
  )
);
```

**Why Zustand:**
- Minimal boilerplate vs Redux
- Excellent TypeScript support
- Persist middleware works with SecureStore (encrypted)
- Selectors prevent unnecessary re-renders

### 5.2 State Flow Diagram

```
User Action
    │
    ▼
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Zustand    │────▶│  TanStack Query   │────▶│  REST API    │
│  UI State   │     │  Server Cache     │     │  (Web Backend)│
└─────────────┘     └──────────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  MMKV Cache  │
                    │  (Offline)   │
                    └──────────────┘
```

---

## 6. API Integration Strategy

### 6.1 API Client Configuration

```typescript
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import * as Network from 'expo-network';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g., https://codehub.app
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach JWT
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest) {
      // Attempt token refresh or force re-login
      useAuthStore.getState().logout();
      // Navigate to login (handled by auth guard)
    }
    
    return Promise.reject(error);
  }
);

export { api };
```

### 6.2 Endpoint Mapping (Web → Mobile)

Every web API route has a corresponding mobile API module:

| Web Endpoint | Mobile Module | Method |
|-------------|--------------|--------|
| `POST /api/auth/signup` | `src/api/auth.ts` | `signup(credentials)` |
| `POST /api/auth/[...nextauth]` | `src/api/auth.ts` | `login(credentials)` |
| `GET /api/platforms` | `src/api/platforms.ts` | `getPlatforms()` |
| `POST /api/submissions` | `src/api/submissions.ts` | `createSubmission(data)` |
| `GET /api/student/stats` | `src/api/student.ts` | `getStats()` |
| `GET /api/wallet` | `src/api/wallet.ts` | `getBalance()` |
| `POST /api/wallet/topup` | `src/api/wallet.ts` | `requestTopUp(amount)` |
| `GET /api/mentorship` | `src/api/mentorship.ts` | `getMentorshipData()` |
| `POST /api/mentorship` | `src/api/mentorship.ts` | `bookSession(data)` |
| `GET /api/admin/stats` | `src/api/admin.ts` | `getAdminStats()` |

**Critical Principle**: Mobile uses the **exact same endpoints**, **same request/response shapes**, and **same Zod validation schemas** as the web app.

### 6.3 Duplicate Endpoint Resolution

The web backend currently contains overlapping endpoints. Mobile must choose **one canonical endpoint** per operation to avoid confusion and ensure consistent behavior:

| Operation | Canonical Mobile Endpoint | Avoid | Reason |
|-----------|--------------------------|-------|--------|
| Wallet top-up | `POST /api/wallet/topup` | `POST /api/wallet` | `/api/wallet/topup` is the actively used endpoint with lower minimum amount (1 vs 10) and returns user phone number. |
| Approve/reject top-up | `PATCH /api/admin/transactions` | `POST /api/admin/topup` | `/api/admin/transactions` is the actively used, more generic endpoint. |
| Purchase recorded session | `POST /api/mentorship/recorded-sessions` | `POST /api/mentorship` (recorded branch) | Dedicated endpoint has clearer semantics and better duplicate-purchase prevention. |

**Mobile API layer should abstract these decisions** so that UI code calls `wallet.requestTopUp()` without caring about the underlying route.

### 6.4 Shared Validation Schemas

```typescript
// shared/validation/schemas.ts (extracted from web API routes)
import { z } from 'zod';

// Identical to web: src/app/api/auth/signup/route.ts
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phoneNumber: z.string().min(10),
});

// Identical to web: src/app/api/submissions/route.ts
export const submissionSchema = z.object({
  taskId: z.string().cuid(),
  summary: z.string().min(10),
});

// Identical to web: src/app/api/mentorship/route.ts
export const mentorshipBookingSchema = z.object({
  sessionType: z.enum(['RECORDED', 'FACE_TO_FACE']),
  duration: z.number().min(30).max(180).default(60),
  notes: z.string().optional(),
  whatsappNumber: z.string().optional(),
  selectedDateId: z.string().optional(),
  recordedSessionId: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
```

---

## 6.5 Web Backend Quirks & Mobile Mitigations

The web backend (documented in `CODEHUB_REFERENCE.md`) has known issues, edge cases, and inconsistencies that the mobile client must explicitly handle. Mobile cannot assume a perfectly consistent API surface.

### 6.5.1 Inconsistent Error Formats

**Issue**: Some API routes return plain text errors (`"Invalid credentials"`) while most return JSON (`{ error: "..." }`).

**Mobile Mitigation**:

```typescript
// src/api/client.ts — enhanced error parser
function parseApiError(error: AxiosError): AppError {
  const contentType = error.response?.headers['content-type'] || '';
  const status = error.response?.status || 500;
  
  if (contentType.includes('application/json')) {
    const data = error.response?.data as { error?: string; message?: string };
    return { message: data.error || data.message || 'Unknown error', status };
  }
  
  // Fallback for plain text responses
  const text = error.response?.data as string;
  return { message: text || `HTTP ${status}`, status };
}
```

### 6.5.2 Submission Retry After Rejection

**Issue**: The database has a unique constraint `[userId, taskId]` on submissions. The API intends to allow resubmission after `REJECTED`, but creating a second row fails. This is a **web backend bug** (priority fix #2 in reference).

**Mobile Mitigation**:
- On submission creation, if the API returns a 409/500 that suggests duplicate submission, mobile should **PATCH the existing rejected submission** instead of POSTing a new one.
- UI should show clear messaging: "Your previous submission was rejected. Updating it now..."
- Fallback: Delete the rejected submission first (if admin API supports it), then re-submit.

```typescript
// src/api/submissions.ts
export async function createOrResubmitSubmission(data: SubmissionInput) {
  try {
    return await api.post('/api/submissions', data);
  } catch (error: any) {
    // Heuristic: if it looks like a duplicate submission error
    if (error.response?.status === 500 || error.response?.status === 409) {
      // Find existing rejected submission
      const { data: existing } = await api.get(`/api/submissions?taskId=${data.taskId}`);
      const rejected = existing.submissions?.find((s: Submission) => s.status === 'REJECTED');
      if (rejected) {
        // Update existing rejected submission to pending
        return await api.patch(`/api/submissions/${rejected.id}`, {
          status: 'PENDING',
          summary: data.summary,
        });
      }
    }
    throw error;
  }
}
```

### 6.5.3 Hardcoded Admin Wallet Number

**Issue**: The admin wallet number `01026454497` is hardcoded in `POST /api/wallet/topup` and signup routes. The reference doc recommends moving this to env/config.

**Mobile Mitigation**:
- Do **not** hardcode the wallet number in mobile UI.
- Fetch it from an API endpoint or include it in the `/api/wallet` response.
- If the backend does not expose it dynamically, create a config endpoint `GET /api/config` that returns `adminWalletNumber`, `faceToFacePrice`, `recordedSessionDefaultPrice`.
- If fetching dynamically is not possible, store it in mobile remote config (Firebase Remote Config or EAS Update environment) so it can be changed without an app store release.

### 6.5.4 Recorded Session Price Mismatch

**Issue**: `GET /api/mentorship` returns fixed pricing `{ recordedSession: 100, faceToFaceSession: 500 }`, but actual `RecordedSession` records have individual prices that may differ from 100 EGP.

**Mobile Mitigation**:
- **Ignore** the fixed `recordedSession: 100` from `/api/mentorship` GET.
- Always use the actual `price` field from the `RecordedSession` record when displaying prices or computing total cost.
- For face-to-face, the fixed `500` is currently correct, but mobile should still display the price returned by the booking creation response (in case backend changes).

### 6.5.5 Calendar Weekend Inconsistency

**Issue**: The web has conflicting weekend definitions. API `isWeekend` treats Saturday/Sunday as weekend. Calendar helpers (`filterWeekdays`) treat Friday/Saturday as weekend. Admin bulk modal labels Friday/Saturday as weekend.

**Mobile Mitigation**:
- Mobile **must define its own single source of truth** for weekend handling.
- Given the target audience is Arabic-speaking (Egypt-centric), Friday/Saturday should be treated as weekend.
- Implement a mobile-side `isWeekend(date)` utility using date-fns with explicit locale:

```typescript
// src/utils/calendar.ts
import { isWeekend as dateFnsIsWeekend } from 'date-fns';

export function isWeekend(date: Date): boolean {
  // Friday = 5, Saturday = 6 in JavaScript getDay()
  const day = date.getDay();
  return day === 5 || day === 6; // Friday or Saturday
}
```
- When calling bulk slot creation APIs, explicitly set `excludeWeekends: true` and verify the backend interpreted it correctly by fetching the created slots.

### 6.5.6 Admin Enrollment Access Blocks

**Issue**: Some platform/task GET routes require active enrollment even for admin users (`/api/platforms/[id]`, `/api/tasks?platformId=...`). This may break admin mobile flows.

**Mobile Mitigation**:
- Admin mobile should fetch platforms via `/api/platforms` (no enrollment check) rather than `/api/platforms/[id]` when listing.
- For task details, admin mobile can use `/api/tasks` (with filters) instead of `/api/tasks/[id]` where possible.
- If admin must access a specific task by ID, be prepared for 403 responses and show an informative message: "Admin access to enrolled content requires backend fix."
- Track this as a **backend-blocker** for full admin mobile parity.

### 6.5.7 Signup Balance Inconsistency

**Issue**: New user balance is set to `0.00` in the signup transaction, but a welcome `TOP_UP` transaction of 500 EGP is created as `APPROVED`. The balance field should probably be `500.00`.

**Mobile Mitigation**:
- After signup, do **not** assume the wallet balance from the signup response. Always call `GET /api/wallet` to get the true balance.
- Display a welcome toast: "Welcome! 500 EGP has been credited to your wallet."
- If the API returns `0.00`, file a backend bug and show a graceful fallback: "Your welcome bonus is being processed."

### 6.5.8 Missing Zod on Some Routes

**Issue**: Not all API routes use Zod consistently. Some routes do manual validation (e.g., `POST /api/platforms` checks `name` and `url` manually without Zod).

**Mobile Mitigation**:
- Mobile should **always validate inputs client-side with Zod** before sending, even if the backend lacks server-side Zod.
- This prevents wasted network calls and gives instant user feedback.
- For admin routes with manual validation, be extra defensive: inspect error responses carefully because they may not follow the standard `{ error: string }` shape.

### 6.5.9 Profile Page `createdAt` Bug

**Issue**: The profile page reads `session.user.createdAt`, but NextAuth session callbacks do not expose `createdAt`. The web has this bug.

**Mobile Mitigation**:
- Mobile should fetch user profile data from `GET /api/student` or a dedicated profile endpoint, not from the JWT token payload.
- Do not rely on JWT claims for profile display. Always fetch fresh profile data on the profile screen.

---

## 7. Authentication Flow

### 7.1 Web vs Mobile Authentication Bridge

The web uses **NextAuth.js v4** with JWT sessions stored in HTTP-only cookies. Mobile cannot use cookies directly in the same way. We bridge this gap with a **token-based authentication layer**.

```
Mobile App
    │
    ▼ POST /api/auth/mobile-login
┌────────────────────────────────────────┐
│  Next.js API Route (NEW — minimal)    │
│  - Accepts email + password           │
│  - Validates via Prisma + bcrypt      │
│  - Returns JWT + user object          │
└────────────────────────────────────────┘
    │
    ▼
Mobile stores JWT in Expo SecureStore
(iOS Keychain / Android Keystore)
```

### 7.2 Recommended: Minimal Mobile Auth Endpoint

Add **one new endpoint** to the existing web backend (or repurpose the existing login logic):

```typescript
// NEW FILE: src/app/api/auth/mobile-login/route.ts
// This is the ONLY backend change required for mobile auth

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Sign JWT with same secret as NextAuth
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.SUPABASE_JWT_SECRET!, // Same secret as web NextAuth
      { expiresIn: '60d' }
    );
    
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
```

**Alternative (Zero Backend Changes)**: Mobile can use the existing NextAuth credentials endpoint by extracting the JWT from the `Set-Cookie` header. However, this is fragile. The single `/api/auth/mobile-login` endpoint is strongly recommended.

### 7.3 Mobile Auth Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Splash  │────▶│  Login   │────▶│  API     │────▶│  JWT     │
│  Screen  │     │  Screen  │     │  Login   │     │  Store   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                          │
                                                          ▼
                                                   ┌──────────┐
                                                   │  Biometric│
                                                   │  Prompt   │
                                                   │ (optional)│
                                                   └──────────┘
```

### 7.4 Biometric Authentication (Face ID / Touch ID / Fingerprint)

```typescript
// src/services/BiometricService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/stores/authStore';

export class BiometricService {
  static async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }
  
  static async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access CodeHub',
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  }
  
  static async enableBiometricLogin(): Promise<void> {
    const authenticated = await this.authenticate();
    if (authenticated) {
      // Store a biometric flag; on next open, try biometric first
      await SecureStore.setItemAsync('biometric_enabled', 'true');
    }
  }
}
```

---

## 8. Offline Handling Strategy

### 8.1 Offline-First Architecture

The app uses a **read-heavy, write-queue** approach:

- **Read**: Cache server data aggressively (TanStack Query + MMKV)
- **Write**: Queue mutations locally, sync when online

```
User submits a task summary while offline:

1. UI shows optimistic update (TanStack Query)
2. Mutation fails due to no network
3. Request is queued in MMKV
4. UI shows "Pending sync" badge
5. When network returns:
   a. Background sync processes queue
   b. Submissions are sent to /api/submissions
   c. Queue is cleared
   d. Related caches are invalidated
```

### 8.2 Implementation: Offline Queue

```typescript
// src/services/OfflineSyncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api/client';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
  id: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  body: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = 'offline_request_queue';

export class OfflineSyncService {
  static async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<void> {
    const queue = await this.getQueue();
    queue.push({
      ...request,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
  
  static async sync(): Promise<void> {
    const network = await NetInfo.fetch();
    if (!network.isConnected) return;
    
    const queue = await this.getQueue();
    if (queue.length === 0) return;
    
    const remaining: QueuedRequest[] = [];
    
    for (const request of queue) {
      try {
        await api.request({
          method: request.method,
          url: request.url,
          data: request.body,
        });
      } catch (error) {
        remaining.push(request);
      }
    }
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }
  
  private static async getQueue(): Promise<QueuedRequest[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }
}
```

### 8.3 Pre-cached Data (Always Available)

| Data | Strategy |
|------|----------|
| Platforms & Tasks | Cache on first load, refresh in background |
| Student Stats | Cache for 5 min, stale-while-revalidate |
| Wallet Balance | Cache, show stale value with "refreshing" indicator |
| Submission History | Cache, paginated |
| Mentorship Slots | Cache for 2 min (changes frequently) |

---

## 9. Push Notification Strategy

### 9.1 Notification Categories

| Event | Trigger | Recipients |
|-------|---------|-----------|
| Submission Reviewed | Admin approves/rejects submission | Student |
| Transaction Approved | Admin approves top-up | Student |
| New Task Available | Admin adds task to enrolled platform | Enrolled students |
| Mentorship Confirmed | Admin confirms booking | Student |
| Mentorship Reminder | 1 hour before session | Student |
| Enrollment Expiring | 3 days before expiration | Student |

### 9.2 Expo Push Notifications Architecture

```
Web Backend (Next.js)
    │
    │ Admin action (approve submission)
    ▼
┌─────────────────────────────┐
│  Database Trigger / Hook    │
│  (Prisma middleware)       │
└─────────────────────────────┘
    │
    ▼ POST to Expo Push API
Expo Push Notification Service
    │
    ▼
iOS APNs / Android FCM
    │
    ▼
Mobile App (background / foreground)
```

### 9.3 Minimal Backend Integration

Add a simple push token storage to the `User` model (optional migration):

```prisma
// Optional addition to schema.prisma
model PushToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform  String   // 'ios' | 'android'
  createdAt DateTime @default(now())
}
```

Or use a separate notification service table to avoid schema changes:

```typescript
// src/app/api/notifications/register/route.ts
export async function POST(req: NextRequest) {
  const { token, platform } = await req.json();
  const session = await getToken({ req, secret: process.env.SUPABASE_JWT_SECRET });
  
  await prisma.pushToken.upsert({
    where: { token },
    update: { userId: session.sub },
    create: { token, platform, userId: session.sub },
  });
  
  return NextResponse.json({ success: true });
}
```

### 9.4 Mobile Push Handler

```typescript
// src/services/PushNotificationService.ts
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export function usePushNotifications() {
  useEffect(() => {
    registerForPushNotifications();
    
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { type, data } = notification.request.content.data;
        handleNotification(type, data);
      }
    );
    
    return () => subscription.remove();
  }, []);
}

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.post('/api/notifications/register', { token, platform: Platform.OS });
}
```

### 9.5 Deep Linking from Notifications

Push notifications must navigate users to the relevant screen when tapped.

**Deep link schema**:

```
codehub://submission/{id}       // Submission reviewed
codehub://transaction/{id}    // Top-up approved
codehub://task/{id}            // New task available
codehub://booking/{id}         // Mentorship confirmed
codehub://wallet               // Enrollment expiring (general wallet)
```

**Implementation with Expo Router**:

```typescript
// app/_layout.tsx — add to existing file
import * as Linking from 'expo-linking';

const linking = {
  prefixes: ['codehub://', 'https://codehub.app'],
  config: {
    screens: {
      '(app)': {
        screens: {
          index: 'dashboard',
          'tasks/[id]': 'task/:id',
          wallet: 'wallet',
          transactions: 'transactions',
          mentorship: {
            screens: {
              index: 'mentorship',
              book: 'mentorship/book',
            },
          },
        },
      },
    },
  },
};

// In notification handler
function handleNotification(type: string, data: Record<string, string>) {
  const router = useRouter();
  
  switch (type) {
    case 'SUBMISSION_REVIEWED':
      router.push(`/(app)/tasks/${data.taskId}`);
      break;
    case 'TRANSACTION_APPROVED':
      router.push('/(app)/wallet');
      break;
    case 'MENTORSHIP_CONFIRMED':
      router.push(`/(app)/mentorship?bookingId=${data.bookingId}`);
      break;
    case 'ENROLLMENT_EXPIRING':
      router.push(`/(app)/platforms/${data.platformId}`);
      break;
  }
}
```

**Backend payload format**:

```json
{
  "to": "ExponentPushToken[...]",
  "title": "Submission Approved",
  "body": "Your JavaScript Tasks submission was approved! Score: 85/100.",
  "data": {
    "type": "SUBMISSION_REVIEWED",
    "taskId": "task_cuid",
    "submissionId": "sub_cuid",
    "status": "APPROVED"
  }
}
```

---

## 10. Feature Mapping: Web → Mobile

### 10.1 Student Features

| Web Feature | Mobile Screen | Native Enhancements |
|-------------|---------------|---------------------|
| Dashboard (`/student`) | `(app)/index.tsx` | Native scroll, pull-to-refresh, haptic feedback on task completion |
| Platform Cards | `(app)/platforms/index.tsx` | Horizontal carousel, native card shadows |
| Task Submission Modal | `(app)/tasks/[id].tsx` | Native textarea, image upload (camera roll), auto-save draft |
| Stats Section | `(app)/index.tsx` (top section) | Native SVG progress rings, animated counters |
| Wallet & Top-up | `(app)/wallet/index.tsx` | Native number input, biometric confirmation for top-up |
| Mentorship Booking | `(app)/mentorship/book.tsx` | Native calendar picker, date/time wheels |
| Recorded Sessions | `(app)/mentorship/recorded.tsx` | Native video player (expo-av), download for offline |
| Profile | `(app)/profile/index.tsx` | Native image picker for avatar, biometric toggle |
| Transaction History | `(app)/transactions/index.tsx` | Native list with section headers |

### 10.2 Admin Features

| Web Feature | Mobile Screen | Notes |
|-------------|---------------|-------|
| Admin Dashboard (`/admin`) | `(admin)/index.tsx` | Tab-based layout instead of sidebar |
| Submission Review | Modal on submissions list | Swipe actions for approve/reject |
| Transaction Approval | `(admin)/transactions.tsx` | Bulk select + approve |
| Mentorship Management | `(admin)/mentorship.tsx` | Calendar integration with native date picker |
| Available Dates | `(admin)/calendar.tsx` | Native calendar UI, bulk slot creation |
| User Management | `(admin)/users.tsx` | Search + filter with native components |

### 10.3 Shared Components Strategy

Where the web uses complex components (`PlatformCard`, `StatsSection`, `WalletSection`), mobile creates **native equivalents** with the same data contracts:

```typescript
// Web: src/components/student-dashboard/PlatformCard.tsx
// Mobile: src/components/PlatformCard.tsx

// Same props interface (from shared/types)
interface PlatformCardProps {
  platform: Platform;
  enrollments: Enrollment[];
  onTaskClick: (task: Task) => void;
  onEnrollmentSuccess: () => void;
}

// Different implementation: native TouchableOpacity instead of onClick,
// native View shadows instead of CSS box-shadow,
// but same data flow and API calls.
```

---

## 10.5 RTL & Internationalization

The web targets Arabic-speaking users (primarily Egyptian students). The mobile app **must support RTL layout and Arabic typography natively**.

### 10.5.1 RTL Layout

React Native supports RTL via `I18nManager`:

```typescript
// src/lib/rtl.ts
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

export function configureRTL() {
  // Force RTL for Arabic
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
  
  // If RTL changed, reload the app bundle
  if (I18nManager.isRTL !== I18nManager.doLeftAndRightSwapInRTL) {
    Updates.reloadAsync();
  }
}
```

**Expo Router RTL support**:

```typescript
// app/_layout.tsx
import { I18nManager } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    I18nManager.forceRTL(true);
  }, []);
  
  // Expo Router supports RTL routing automatically
  // Text aligns right, flex-direction reverses
}
```

### 10.5.2 Arabic Font Loading

Load `Tajawal` (same as web) via `expo-font`:

```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Tajawal-Regular': require('../assets/fonts/Tajawal-Regular.ttf'),
    'Tajawal-Bold': require('../assets/fonts/Tajawal-Bold.ttf'),
    'Tajawal-ExtraBold': require('../assets/fonts/Tajawal-ExtraBold.ttf'),
  });
  
  if (!fontsLoaded) return <ExpoSplashScreen />;
  
  // ... rest of layout
}
```

### 10.5.3 Text Direction & Layout Rules

| Web Tailwind | React Native Equivalent | RTL Behavior |
|-------------|------------------------|-------------|
| `text-right` | `textAlign: 'right'` | Automatic in RTL |
| `flex-row` | `flexDirection: 'row'` | Reverses to `row-reverse` in RTL |
| `ml-4` | `marginLeft: 16` | Swaps to `marginRight` in RTL |
| `border-l` | `borderLeftWidth: 1` | Swaps to `borderRightWidth` |

**Important**: Use `start`/`end` logical properties instead of `left`/`right`:

```typescript
// GOOD: Works in both LTR and RTL
style={{ paddingStart: 16, paddingEnd: 16 }}

// BAD: Breaks in RTL
style={{ paddingLeft: 16, paddingRight: 16 }}
```

### 10.5.4 Arabic Date & Number Formatting

Use `date-fns` with Arabic locale (same as web):

```typescript
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function formatDateArabic(date: Date): string {
  return format(date, 'PPP', { locale: ar }); // "١٠ مايو ٢٠٢٦"
}
```

### 10.5.5 Encoding Defensive Handling

The web currently has **mojibake encoding issues** with Arabic strings. Mobile must handle this gracefully:

```typescript
// src/utils/encoding.ts
export function sanitizeArabicText(text: string | undefined): string {
  if (!text) return '';
  
  // Detect mojibake patterns (common with UTF-8/Windows-1256 mismatches)
  const mojibakePattern = /[ï¿½Ø§Ø¨ØªØ«]/;
  if (mojibakePattern.test(text)) {
    // Fallback to a generic label instead of broken characters
    return '???'; // Or attempt iconv-lite decoding if bundled
  }
  
  return text;
}
```

**Recommendation**: Treat backend Arabic text as potentially corrupted until the web encoding issue is fixed. Use English as fallback where critical.

---

## 10.6 Monitoring & Observability

Production mobile apps require comprehensive monitoring beyond crash reporting.

### 10.6.1 Crash & Error Tracking

**Sentry** (recommended for React Native):

```bash
npx expo install @sentry/react-native
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [Sentry.reactNativeTracingIntegration()],
  tracesSampleRate: 0.1, // 10% of transactions
});

// In API client
api.interceptors.response.use(
  (response) => response,
  (error) => {
    Sentry.captureException(error, {
      extra: {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
      },
    });
    return Promise.reject(error);
  }
);
```

### 10.6.2 Performance Monitoring

Track critical user journeys:

```typescript
// src/lib/performance.ts
import * as Sentry from '@sentry/react-native';

export function traceOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const transaction = Sentry.startTransaction({ name, op: 'mobile.operation' });
  
  return operation()
    .finally(() => {
      transaction.finish();
    });
}

// Usage
await traceOperation('dashboard_load', async () => {
  await Promise.all([
    queryClient.fetchQuery({ queryKey: ['platforms'] }),
    queryClient.fetchQuery({ queryKey: ['stats'] }),
    queryClient.fetchQuery({ queryKey: ['wallet'] }),
  ]);
});
```

### 10.6.3 Analytics

**Firebase Analytics** or **Amplitude** for user behavior tracking:

```typescript
// src/lib/analytics.ts
import analytics from '@react-native-firebase/analytics';

export function logEvent(name: string, params?: Record<string, unknown>) {
  analytics().logEvent(name, params);
}

// Track key events
logEvent('submission_created', { platform_id: platformId, task_id: taskId });
logEvent('enrollment_purchased', { platform_id: platformId, price: price });
logEvent('mentorship_booked', { session_type: 'FACE_TO_FACE', amount: 500 });
logEvent('wallet_topup_requested', { amount });
```

### 10.6.4 API Health Dashboard

Monitor mobile-specific API metrics:

| Metric | Alert Threshold | Action |
|--------|------------------|--------|
| API error rate | > 5% in 5 min | Page on-call |
| Average API latency | > 2s p95 | Investigate backend |
| Offline queue depth | > 50 items | Warn user, exponential backoff |
| JWT refresh failures | > 1% | Auth service degradation |
| Push notification delivery | < 90% | Check Expo Push status |

### 10.6.5 Log Aggregation

Use structured logging with correlation IDs:

```typescript
// src/utils/logger.ts
export function createLogger(scope: string) {
  const correlationId = generateCorrelationId();
  
  return {
    info: (message: string, meta?: object) => {
      console.log(JSON.stringify({ level: 'info', scope, correlationId, message, ...meta }));
    },
    error: (message: string, error: unknown) => {
      console.error(JSON.stringify({ level: 'error', scope, correlationId, message, error: String(error) }));
    },
  };
}
```

In production, forward logs to **Datadog**, **LogRocket**, or **Firebase Crashlytics**.

---

## 11. Security Best Practices

### 11.1 Token Storage

```typescript
// NEVER use AsyncStorage for tokens
import * as SecureStore from 'expo-secure-store';

// iOS: Keychain (encrypted)
// Android: Keystore (encrypted)
await SecureStore.setItemAsync('jwt_token', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
});
```

### 11.2 Certificate Pinning (Production)

```typescript
// axios-native-config.ts
import { Platform } from 'react-native';
import { TrustKit } from 'react-native-trustkit'; // iOS
import { SSLPinning } from 'react-native-ssl-pinning'; // Android

// Pin the backend's SSL certificate to prevent MITM attacks
const pinnedCertificates = [
  Platform.OS === 'ios' ? 'codehub-app.der' : 'codehub-app.cer',
];
```

### 11.3 Input Validation

- **All inputs validated with Zod** (same schemas as web API)
- **Sanitize before display** to prevent XSS in WebViews (if any)
- **Rate limiting awareness**: Exponential backoff on 429 responses

### 11.4 Biometric & Session Security

- JWT max age: 60 days (same as web)
- Require biometric for: wallet top-up, enrollment purchase, mentorship booking
- Auto-lock after 5 minutes of inactivity
- Clear SecureStore on logout or app uninstall

---

## 12. Performance Optimization

### 12.1 List Virtualization

```typescript
// For long lists (submissions, transactions, tasks)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={submissions}
  renderItem={({ item }) => <SubmissionCard submission={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/>
```

**Why FlashList**: 10x faster than FlatList for large datasets. Critical for admin dashboards with thousands of submissions.

### 12.2 Image Optimization

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: platform.imageUrl }}
  contentFit="cover"
  transition={1000}
  cachePolicy="memory-disk"
  style={{ width: 120, height: 120, borderRadius: 12 }}
/>
```

**Why expo-image**: Supports WebP, SVG, placeholders, blurhash, and aggressive caching.

### 12.3 Bundle Size Management

```javascript
// babel.config.js — tree-shake unused imports
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Remove console.log in production
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ],
  };
};
```

### 12.4 Startup Time

- Use `expo-splash-screen` with branded launch image
- Preload critical data (user profile, platforms) during splash
- Lazy-load admin screens (separate bundle)
- Use Hermes engine (default in Expo SDK 51)

---

## 12.5 Testing Strategy

A senior-grade mobile architecture requires a multi-layered testing pyramid. Given that the backend is shared with the web, **contract testing** is non-negotiable.

### 12.5.1 Unit Tests (Jest + React Native Testing Library)

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

Coverage targets:

- **Business logic**: 90% — API clients, utilities, validation schemas, formatters.
- **Hooks**: 80% — `useAuth`, `useWallet`, `useOffline`.
- **Components**: 70% — PlatformCard, WalletCard, StatsSection.

Example test for the submission retry mitigation:

```typescript
// src/api/submissions.test.ts
import { createOrResubmitSubmission } from './submissions';
import { api } from './client';

jest.mock('./client', () => ({ api: { post: jest.fn(), get: jest.fn(), patch: jest.fn() } }));

it('patches rejected submission on duplicate error', async () => {
  (api.post as jest.Mock).mockRejectedValue({ response: { status: 500 } });
  (api.get as jest.Mock).mockResolvedValue({
    data: { submissions: [{ id: 'sub_1', status: 'REJECTED' }] },
  });
  (api.patch as jest.Mock).mockResolvedValue({ data: { id: 'sub_1', status: 'PENDING' } });

  const result = await createOrResubmitSubmission({ taskId: 'task_1', summary: 'Retry' });
  expect(api.patch).toHaveBeenCalledWith('/api/submissions/sub_1', expect.any(Object));
  expect(result.data.status).toBe('PENDING');
});
```

### 12.5.2 Integration Tests

Test TanStack Query hooks against a **mocked Axios instance**:

```typescript
// src/hooks/usePlatforms.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlatforms } from './usePlatforms';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

it('caches platform data', async () => {
  const { result } = renderHook(() => usePlatforms(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### 12.5.3 API Contract Tests (Pact)

Use **Pact** to ensure mobile assumptions about backend responses remain valid as the web evolves:

```typescript
// contract-tests/platform.pact.spec.ts
import { PactV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'codehub-mobile',
  provider: 'codehub-web-api',
  dir: './pacts',
});

it('GET /api/platforms returns expected shape', async () => {
  await provider
    .given('platforms exist')
    .uponReceiving('a request for platforms with tasks')
    .withRequest({ method: 'GET', path: '/api/platforms', query: { include_tasks: 'true' } })
    .willRespondWith({
      status: 200,
      body: {
        platforms: [
          { id: string(), name: string(), tasks: array({ id: string(), title: string() }) },
        ],
      },
    });
  // Verify against actual provider in CI
});
```

**CI Integration**: Run Pact verification in GitHub Actions on every web API PR. Fail the build if mobile consumer expectations break.

### 12.5.4 E2E Tests (Maestro)

Use **Maestro** (not Detox — lighter, faster, YAML-based) for critical user journeys:

```yaml
# .maestro/login-flow.yaml
appId: com.codehub.app
---
- launchApp
- tapOn: "Email"
- inputText: "student@codehub.com"
- tapOn: "Password"
- inputText: "student123"
- tapOn: "Sign In"
- assertVisible: "Dashboard"
- assertVisible: "Wallet"
```

Critical flows to cover:

1. Login → Dashboard → View Platform → Submit Task
2. Wallet Top-Up → Pending → Admin Approval → Balance Update
3. Mentorship Booking → Calendar Select → Confirm → Booking History
4. Admin: Login → Transactions → Approve Top-Up

### 12.5.5 Snapshot Tests

Use snapshot tests for shared UI primitives (Button, Input, Card) to catch unintended visual regressions.

---

## 13. Build & Deployment Process

### 13.1 Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build development client (for testing native modules)
eas build --profile development
```

### 13.2 Environment Configuration

```bash
# .env.development
EXPO_PUBLIC_API_URL=https://staging.codehub.app
EXPO_PUBLIC_APP_NAME=CodeHub Staging

# .env.production
EXPO_PUBLIC_API_URL=https://codehub.app
EXPO_PUBLIC_APP_NAME=CodeHub
```

### 13.3 EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 13.4 Build Commands

```bash
# Generate APK for internal testing
eas build --platform android --profile preview

# Generate AAB for Play Store
eas build --platform android --profile production

# Generate IPA for TestFlight / App Store
eas build --platform ios --profile production

# OTA Update (no store review needed)
eas update --channel production --message "Fixed submission bug"
```

### 13.5 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/mobile-build.yml
name: Mobile Build
on:
  push:
    branches: [main]
    paths: ['codehub-mobile/**']

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd codehub-mobile && npm ci
      - run: cd codehub-mobile && eas build --platform android --profile preview --non-interactive
```

---

## 14. Scalability Considerations

### 14.1 Horizontal Scaling

Since the backend is unchanged, it already scales horizontally via:
- Stateless Next.js API routes
- PostgreSQL read replicas (if needed)
- Vercel Edge Network for API caching

Mobile adds load proportional to user count. The existing API architecture (REST + Prisma) handles this naturally.

### 14.2 Code Sharing for Future Growth

Extract a `@codehub/shared` package containing:

```
shared/
├── package.json
├── src/
│   ├── types/
│   │   └── index.ts        # User, Platform, Task, Submission, etc.
│   ├── validation/
│   │   └── schemas.ts        # All Zod schemas
│   ├── constants/
│   │   └── enums.ts          # Role, Status, TransactionType, etc.
│   └── utils/
│       ├── dateUtils.ts      # formatDate, formatDateTime
│       └── formatters.ts     # Currency, phone number formatting
└── tsconfig.json
```

**Both web and mobile consume this package.** When a schema changes (e.g., new Task field), update once, publish to npm/git submodule, and both platforms get the update.

### 14.3 Feature Flags

Use a simple feature flag system to roll out mobile features independently:

```typescript
// src/constants/features.ts
export const FEATURES = {
  BIOMETRIC_LOGIN: true,
  OFFLINE_MODE: true,
  PUSH_NOTIFICATIONS: true,
  ADMIN_DASHBOARD_MOBILE: false, // Ship later
};
```

### 14.4 Modular Architecture

Organize by feature, not layer:

```
src/
├── features/
│   ├── auth/
│   │   ├── api.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   └── stores/
│   ├── platform/
│   ├── task/
│   ├── submission/
│   ├── wallet/
│   ├── mentorship/
│   └── admin/
```

Each feature is self-contained and can be developed/tested in isolation.

---

## 15. Compatibility Strategy with Web Application

### 15.1 API Contract-First Development

The web backend **owns the API contract**. Mobile never creates its own endpoints. When the web adds a feature:

1. Backend adds new `/api/*` endpoint (or extends existing)
2. Web implements UI consuming that endpoint
3. Mobile implements screen consuming the **same** endpoint

This guarantees 100% data consistency.

### 15.2 Shared TypeScript Types

The `@codehub/shared` package ensures that if the `Task` model gains a `difficulty` field:

```typescript
// shared/src/types/index.ts
interface Task {
  id: string;
  title: string;
  description?: string;
  link?: string;
  platformId: string;
  order: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'; // NEW FIELD
  createdAt: Date;
}
```

Both web and mobile TypeScript compilers will catch mismatches immediately.

### 15.3 Design System Alignment

| Web Token | Mobile Token | Example |
|-----------|--------------|---------|
| `bg-[#111628]` | `colors.background` | `#111628` |
| `glass` class | `StyleSheet` shadow | Same shadow values |
| `Tajawal` font | `Tajawal` via `expo-font` | Same font files |
| `text-emerald-500` | `colors.success` | `#10b981` |

Create a `theme.ts` that maps Tailwind classes to React Native StyleSheet objects:

```typescript
// src/constants/theme.ts
export const theme = {
  colors: {
    background: '#111628',
    surface: '#1a1f35',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    // ... all web colors
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
  },
  borderRadius: {
    sm: 8, md: 12, lg: 16, xl: 24,
  },
  shadows: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
```

### 15.4 Real-Time Synchronization

For features requiring real-time sync (chat, live notifications), add a lightweight WebSocket or Server-Sent Events layer to the backend:

```typescript
// Optional: src/app/api/realtime/route.ts
// Simple SSE endpoint for live notifications
export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Send heartbeat + events
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

Mobile connects to this endpoint for instant updates.

---

## 16. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Scaffold Expo project with TypeScript
- [ ] Configure EAS Build, CI/CD
- [ ] Implement API client with interceptors
- [ ] Implement authentication flow (login/signup)
- [ ] Implement Zustand auth store with SecureStore
- [ ] Create shared types package (extract from web)
- [ ] Set up TanStack Query

### Phase 2: Student Core (Week 3-4)
- [ ] Student dashboard (platforms, stats, wallet)
- [ ] Task list and detail screens
- [ ] Submission flow (text + camera/image upload)
- [ ] Enrollment purchase/renewal
- [ ] Wallet top-up flow
- [ ] Offline caching for core data

### Phase 3: Mentorship (Week 5)
- [ ] Mentorship home screen
- [ ] Live session booking with native calendar
- [ ] Recorded sessions list + video player
- [ ] Booking history and status tracking

### Phase 4: Polish & Admin (Week 6)
- [ ] Admin dashboard (tab-based mobile layout)
- [ ] Submission review (swipe actions)
- [ ] Transaction approval flow
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Performance optimization (FlashList, image caching)

### Phase 5: Production (Week 7)
- [ ] End-to-end testing
- [ ] Security audit (OWASP Mobile Top 10)
- [ ] Play Store / App Store submission
- [ ] OTA update configuration
- [ ] Analytics integration (Firebase / Amplitude)

---

## 17. Appendix: Sample Code

### 17.1 Complete Login Screen

```tsx
// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/api/client';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/mobile-login', { email, password });
      setAuth(data.token, data.user);
      router.replace(data.user.role === 'ADMIN' ? '/(admin)' : '/(app)');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#111628' }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 32 }}>
        Welcome to CodeHub
      </Text>
      
      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: '#1a1f35',
          color: '#fff',
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 16,
        }}
      />
      
      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: '#1a1f35',
          color: '#fff',
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
          fontSize: 16,
        }}
      />
      
      {error ? (
        <Text style={{ color: '#ef4444', marginBottom: 16 }}>{error}</Text>
      ) : null}
      
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: '#3b82f6',
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={{ marginTop: 16 }}>
        <Text style={{ color: '#3b82f6', textAlign: 'center' }}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 17.2 Platform Card (Native Equivalent)

```tsx
// src/components/PlatformCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Platform, Task, Enrollment } from '@codehub/shared/types';
import { formatDate } from '@codehub/shared/utils/dateUtils';

interface Props {
  platform: Platform;
  enrollments: Enrollment[];
  onTaskPress: (task: Task) => void;
  onEnroll: () => void;
}

export function PlatformCard({ platform, enrollments, onTaskPress, onEnroll }: Props) {
  const enrollment = enrollments.find((e) => e.platformId === platform.id);
  const isActive = enrollment?.isActive && new Date(enrollment.expiresAt) > new Date();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{platform.name}</Text>
        {isActive ? (
          <View style={styles.badgeActive}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={onEnroll} style={styles.enrollButton}>
            <Text style={styles.enrollText}>Enroll</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.description}>{platform.description}</Text>
      
      {isActive && (
        <Text style={styles.expiry}>
          Expires: {formatDate(enrollment!.expiresAt)}
        </Text>
      )}
      
      <View style={styles.tasks}>
        {platform.tasks?.map((task) => (
          <TouchableOpacity key={task.id} onPress={() => onTaskPress(task)} style={styles.taskRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskStatus}>{task.submission?.status || 'Not started'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1f35',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  badgeActive: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  enrollButton: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  enrollText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  description: { color: '#94a3b8', fontSize: 14, marginBottom: 12 },
  expiry: { color: '#f59e0b', fontSize: 13, marginBottom: 12 },
  tasks: { marginTop: 8 },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2d3655' },
  taskTitle: { color: '#e2e8f0', fontSize: 14 },
  taskStatus: { color: '#94a3b8', fontSize: 12 },
});
```

### 17.3 Root Layout with Auth Guard

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(user?.role === 'ADMIN' ? '/(admin)' : '/(app)');
    }
  }, [isAuthenticated, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="admin" />
        </Stack>
      </AuthGuard>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}
```

---

## 18. Risk Assessment & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Backend API changes break mobile | High | Medium | Shared `@codehub/shared` package; Pact contract tests; API versioning; CI gate on contract verification. |
| iOS App Store rejection | Medium | Low | Follow Apple guidelines; no restricted APIs; clear privacy policy; declare `NSFaceIDUsageDescription`. |
| Slow list performance (admin) | Medium | Medium | FlashList virtualization; pagination; infinite scroll; debounced search. |
| JWT token exposure | High | Low | SecureStore (Keychain/Keystore); certificate pinning; token refresh rotation; auto-lock. |
| Offline data inconsistency | Medium | Medium | Queue-based sync; conflict resolution (last-write-wins); user notifications; version vector clocks for complex merges. |
| Push notification delivery | Low | Medium | Expo Push service (99.9% reliability); fallback in-app badges; local notification scheduling for reminders. |
| **Web backend bugs propagate to mobile** | High | High | Defensive coding (Section 6.5); graceful degradation; never trust backend consistency without client-side validation. |
| **Duplicate endpoint behavior divergence** | Medium | Medium | Abstract behind canonical mobile API layer (Section 6.4); never call duplicate routes directly from UI. |
| **Hardcoded values change without mobile update** | Medium | Low | Remote config for admin wallet, prices; dynamic config endpoint; EAS Update for value changes. |
| **Arabic encoding/mojibake in UI** | Medium | Medium | Sanitize all backend strings (Section 10.5.5); English fallback; alert web team for backend fix. |
| **Admin enrollment access blocks** | Medium | Low | Use list endpoints for admin; track as backend-blocker; show informative error UI. |
| **Submission retry UX failure** | Medium | High | Client-side retry logic (Section 6.5.2); PATCH rejected submission; optimistic UI with rollback. |
| **Certificate pinning breaks on backend cert renewal** | High | Low | Monitor cert expiry 30 days ahead; pin intermediate CA instead of leaf; fallback to standard TLS with alert. |

---

## 19. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| APK Size | < 50 MB | EAS Build artifacts |
| Cold Start Time | < 3 seconds | `performance.now()` on app launch |
| API Response Cache Hit | > 70% | TanStack Query devtools |
| Crash-Free Sessions | > 99% | Sentry / Firebase Crashlytics |
| Offline Functionality | Core reads work | Manual QA checklist |
| Web Feature Parity | 100% student features | Feature matrix audit |
| Build Time | < 15 minutes | EAS Build dashboard |
| **Unit Test Coverage** | > 80% overall | Jest coverage report in CI |
| **Contract Test Pass Rate** | 100% | Pact verification in CI |
| **E2E Critical Flow Pass Rate** | 100% | Maestro CI runs |
| **RTL Layout Compliance** | 100% screens | Manual QA on Arabic device |
| **Accessibility (TalkBack/VoiceOver)** | Core flows pass | Screen reader manual QA |
| **Push Notification Deep Link Success** | > 95% | Firebase Analytics event tracking |
| **API Error Graceful Handling** | 100% of known issues | Unit tests for each mitigation in Section 6.5 |
| **Biometric Auth Adoption** | > 60% of users | Analytics opt-in rate |

---

## 20. Conclusion

This architecture provides a **production-ready, scalable, and maintainable** mobile application for CodeHub that:

1. **Uses the exact same backend** — every API endpoint, database model, and business rule is shared with the web app.
2. **Requires minimal backend changes** — only one new endpoint (`/api/auth/mobile-login`) is strongly recommended; push tokens are optional.
3. **Leverages existing team knowledge** — React Native + TypeScript aligns perfectly with the web team's React + TypeScript expertise.
4. **Scales with the business** — Modular feature architecture, shared packages, and EAS Build support rapid iteration and team growth.
5. **Delivers native quality** — True native UI, biometric auth, push notifications, and offline support provide a premium mobile experience.

**Next Step**: Begin Phase 1 (Foundation) by scaffolding the Expo project and extracting the `@codehub/shared` package from the existing web codebase.

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-09 | Initial architecture brief covering framework selection, project structure, state management, API integration, auth, offline, push notifications, feature mapping, security, performance, build/deployment, scalability, compatibility, roadmap, and sample code. |
| 1.1 | 2026-05-10 | **Senior Engineer Review Enhancements**: |
| | | - **Section 6.3**: Added duplicate endpoint resolution table (wallet top-up, admin transactions, recorded sessions). |
| | | - **Section 6.4**: Added shared validation schemas with Zod examples extracted from web routes. |
| | | - **Section 6.5**: Added comprehensive "Web Backend Quirks & Mobile Mitigations" covering 9 known web issues: inconsistent error formats, submission retry bug, hardcoded admin wallet, recorded session price mismatch, calendar weekend inconsistency, admin enrollment blocks, signup balance inconsistency, missing Zod validation, and profile `createdAt` bug. |
| | | - **Section 9.5**: Added deep linking from push notifications with Expo Router schema. |
| | | - **Section 10.5**: Added RTL & Internationalization with Arabic font loading, layout rules, date formatting, and mojibake defensive handling. |
| | | - **Section 10.6**: Added Monitoring & Observability with Sentry, performance tracing, Firebase Analytics, API health dashboard, and structured logging. |
| | | - **Section 12.5**: Added Testing Strategy with Jest unit tests, TanStack Query integration tests, Pact contract tests, Maestro E2E tests, and snapshot tests. |
| | | - **Section 18**: Enhanced Risk Assessment with 7 new web-specific risks. |
| | | - **Section 19**: Enhanced Success Metrics with testing coverage, contract tests, RTL compliance, accessibility, deep link success, and biometric adoption targets. |

---

*End of Technical Architecture Brief.*
