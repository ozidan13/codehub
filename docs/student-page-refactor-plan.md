# Student Dashboard Page Refactoring Plan

## Overview

Refactor `src/app/(dashboard)/student/page.tsx` from a 1,447-line monolithic component into separated, lazy-loaded components under `src/components/student-dashboard/` to improve maintainability, reduce bundle-size impact, and enable independent React Suspense boundaries.

**Active branch:** `refactor-student-page-components`

---

## Phase 0: Analysis & Verification (Do First)

### 0.1 Understand Current State

Read the current file at `src/app/(dashboard)/student/page.tsx`. It currently contains these inline components (in order):

1. **`DataCache`** class (lines 21-47) — client-side in-memory cache
2. **`DashboardPage`** (lines 50-244) — main page component; handles auth check, data fetching, layout orchestration
3. **`PageLoader`** (lines 250-261) — full-screen spinner
4. **Icon helpers** (lines 265-302) — `PLATFORM_ICON_MAP`, `FALLBACK_ICONS`, `getPlatformIcon`
5. **`PlatformHubCard`** (lines 304-341) — single platform card inside hub
6. **`PlatformHub`** (lines 343-536) — top hub section with responsive grid and center node
7. **`StatsSection`** (lines 538-681) — left column stats cards + performance overview
8. **`EnhancedStatCard`** (lines 684-759) — reusable stat card
9. **`WalletSection`** (lines 761-931) — wallet card + top-up form
10. **`ExpirationNotifications`** (lines 934-983) — expired/expiring soon alerts
11. **`PlatformCard`** (lines 988-1235) — full platform detail card with enroll/renew actions
12. **`TaskCard`** (lines 1237-1371) — individual task card
13. **`getTaskStatus`** (lines 1374-1379) — task status helper
14. **`SubmissionModal`** (lines 1382-1447) — modal for submitting task solutions

### 0.2 Verify No Regressions Before Starting

Run these commands and confirm zero errors before making any edits:

```bash
# Verify branch
git branch

# Type check
npx tsc --noEmit

# Build check (we ignore eslint at build time via next.config.mjs, but confirm no critical errors)
npm run build 2>&1 | head -n 40
```

**If any build or type error exists, stop and fix it before refactoring.**

---

## Phase 1: Extract DataCache to Utility File

### 1.1 Create the Utility

Create `src/lib/dataCache.ts`:

```typescript
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private isClient = typeof window !== 'undefined';

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) {
    if (!this.isClient) return;
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string) {
    if (!this.isClient) return null;
    const item = this.cache.get(key);
    if (!item || Date.now() - item.timestamp > item.ttl) {
      if (item) this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear() {
    if (this.isClient) {
      this.cache.clear();
    }
  }
}

export const dataCache = new DataCache();
```

### 1.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** the entire `DataCache` class declaration and the `const dataCache = new DataCache()` line.
- **Add** import at top: `import { dataCache } from '@/lib/dataCache';`

### 1.3 Verification

```bash
npx tsc --noEmit
```

Confirm `DataCache` is referenced nowhere else. Search:
```bash
grep -r "DataCache" src/ --include="*.ts" --include="*.tsx"
```

---

## Phase 2: Extract PageLoader Component

### 2.1 Create Component File

Create `src/components/student-dashboard/PageLoader.tsx`:

```tsx
'use client';

import { FC } from 'react';

const PageLoader: FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0B0F1E]">
    <div className="text-center">
      <div className="relative h-32 w-32 mb-4 mx-auto">
        <div className="absolute inset-0 rounded-full border-8 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-200">جاري التحميل...</h2>
      <p className="text-slate-500 mt-2">يتم تجهيز لوحة التحكم الخاصة بك.</p>
    </div>
  </div>
);

export default PageLoader;
```

### 2.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** the `PageLoader` component definition.
- **Add** import: `import PageLoader from '@/components/student-dashboard/PageLoader';`

### 2.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 3: Extract PlatformHub + Icon Helpers

### 3.1 Create Component File

Create `src/components/student-dashboard/PlatformHub.tsx`:

**IMPORTANT:** Include `PLATFORM_ICON_MAP`, `FALLBACK_ICONS`, `getPlatformIcon`, `PlatformHubCard`, and `PlatformHub` exactly as they exist today. Do not rewrite logic. Copy-paste with only the addition of `'use client'` and necessary imports.

```tsx
'use client';

import { useState, useEffect, FC } from 'react';
import { Box, Code2, Database, Layers, Wifi, Palette, FileCode, Cpu, Globe, Terminal, Braces, CircuitBoard, GitBranch, Codepen, Server, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Platform, Enrollment } from '@/types';

const PLATFORM_ICON_MAP: Record<string, { icon: typeof Box; color: string; bg: string }> = {
  'system design': { icon: Box, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  'oop': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'object oriented': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'database': { icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  'solid': { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'design pattern': { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'network': { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  'ui/ux': { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  'ui ux': { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  'javascript': { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'js': { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'interview': { icon: Terminal, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'algorithm': { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  'data structure': { icon: GitBranch, color: 'text-rose-400', bg: 'bg-rose-500/15' },
  'web': { icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/15' },
  'frontend': { icon: Codepen, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  'backend': { icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
};

const FALLBACK_ICONS = [
  { icon: Box, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
];

export function getPlatformIcon(platformName: string, index: number) {
  const lower = platformName.toLowerCase();
  for (const [key, value] of Object.entries(PLATFORM_ICON_MAP)) {
    if (lower.includes(key)) return value;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

// ... include PlatformHubCard and PlatformHub exactly as defined today ...
// Note: only change is wrapping the file content, no logic modifications.
```

### 3.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** `PLATFORM_ICON_MAP`, `FALLBACK_ICONS`, `getPlatformIcon`, `PlatformHubCard`, `PlatformHub`.
- **Add** import:
  ```tsx
  import PlatformHub, { getPlatformIcon } from '@/components/student-dashboard/PlatformHub';
  ```
- Verify `getPlatformIcon` is not used elsewhere in the page (it should only be used inside `PlatformHub`). If it is used elsewhere, import it where needed.

### 3.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 4: Extract StatsSection + EnhancedStatCard

### 4.1 Create Component File

Create `src/components/student-dashboard/StatsSection.tsx`:

```tsx
'use client';

import { FC, ReactNode } from 'react';
import { FileText, CheckCircle, Clock, Trophy, BarChart3, Activity, ArrowUp, ArrowDown, Medal, Sparkles, Award, Target, TrendingUp } from 'lucide-react';
import { StudentStats } from '@/types';

// Include EnhancedStatCard exactly as-is first, then StatsSection exactly as-is.
// Add 'use client' and fix imports only.
```

**Do not modify the internal math or Arabic strings.**

### 4.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** `StatsSection` and `EnhancedStatCard` definitions.
- **Add** import:
  ```tsx
  import StatsSection from '@/components/student-dashboard/StatsSection';
  ```

### 4.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 5: Extract WalletSection

### 5.1 Create Component File

Create `src/components/student-dashboard/WalletSection.tsx`:

```tsx
'use client';

import { useState, FC } from 'react';
import { useSession } from 'next-auth/react';
import { Wallet, Activity, TrendingUp, Zap, CreditCard } from 'lucide-react';
import { WalletData } from '@/types';

// Copy WalletSection exactly. Ensure all handlers and JSX are preserved verbatim.
```

### 5.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** `WalletSection` definition.
- **Add** import:
  ```tsx
  import WalletSection from '@/components/student-dashboard/WalletSection';
  ```

### 5.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 6: Extract ExpirationNotifications

### 6.1 Create Component File

Create `src/components/student-dashboard/ExpirationNotifications.tsx`:

```tsx
'use client';

import { FC } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { Enrollment } from '@/types';

// Copy ExpirationNotifications exactly.
```

### 6.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** `ExpirationNotifications` definition.
- **Add** import:
  ```tsx
  import ExpirationNotifications from '@/components/student-dashboard/ExpirationNotifications';
  ```

### 6.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 7: Extract PlatformCard, TaskCard, and getTaskStatus

### 7.1 Create Component File

Create `src/components/student-dashboard/PlatformCard.tsx`:

**Must include:**
- `getTaskStatus` helper
- `TaskCard` component
- `PlatformCard` component

```tsx
'use client';

import { useState, FC } from 'react';
import { BookOpen, XCircle, GraduationCap, Clock, Activity, ArrowUp, ExternalLink, ShoppingCart, RefreshCw, CheckCircle, Star, Target, Trophy, FileText, Play } from 'lucide-react';
import { Platform, Enrollment, Task } from '@/types';
import { formatDate } from '@/lib/dateUtils';

// Copy getTaskStatus, TaskCard, and PlatformCard exactly as-is.
// Do not alter enrollment/renewal logic, pricing display, or task-status logic.
```

### 7.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** `PlatformCard`, `TaskCard`, and `getTaskStatus` definitions.
- **Add** import:
  ```tsx
  import PlatformCard from '@/components/student-dashboard/PlatformCard';
  ```

### 7.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 8: Extract SubmissionModal

### 8.1 Create Component File

Create `src/components/student-dashboard/SubmissionModal.tsx`:

```tsx
'use client';

import { useState, FC } from 'react';
import { X } from 'lucide-react';
import { Task } from '@/types';

interface SubmissionModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

// Copy SubmissionModal exactly.
```

### 8.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:
- **Remove** `SubmissionModal` and `SubmissionModalProps` definitions.
- **Add** import:
  ```tsx
  import SubmissionModal from '@/components/student-dashboard/SubmissionModal';
  ```

### 8.3 Verification

```bash
npx tsc --noEmit
```

---

## Phase 9: Introduce React.lazy + Suspense for Performance

**Do NOT lazy-load components that are above the fold on initial paint.** Only lazy-load heavy below-the-fold or conditionally rendered components.

### 9.1 Which Components to Lazy-Load

Safe to lazy-load:
- `SubmissionModal` — only rendered when `showSubmissionModal === true`
- `PlatformCard` — below the fold on large screens (inside right column); **only if** initial paint is slow. Otherwise keep direct import.
- `StatsSection`, `WalletSection`, `ExpirationNotifications` — left column; consider if heavy.

**Recommended approach:**
- Lazy-load `SubmissionModal` (always safe because it's behind a click).
- Keep `PlatformHub`, `StatsSection`, `WalletSection`, `ExpirationNotifications`, `PlatformCard` as direct imports to avoid layout shift on first paint.

### 9.2 Update the Page

In `src/app/(dashboard)/student/page.tsx`:

```tsx
import { Suspense, lazy } from 'react';

const SubmissionModal = lazy(() => import('@/components/student-dashboard/SubmissionModal'));
```

Wrap the modal render in `Suspense`:

```tsx
{showSubmissionModal && selectedTask && (
  <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
    <SubmissionModal
      task={selectedTask}
      onClose={() => setShowSubmissionModal(false)}
      onSuccess={handleSubmissionSuccess}
    />
  </Suspense>
)}
```

### 9.3 Verification

```bash
npx tsc --noEmit
npm run build 2>&1 | head -n 50
```

---

## Phase 10: Final Cleanup of the Main Page

### 10.1 What the Final Page Should Look Like

The cleaned `src/app/(dashboard)/student/page.tsx` should contain **only**:

1. `'use client'`
2. React hooks imports (`useState`, `useEffect`, `useCallback`)
3. `next-auth/react` and `next/navigation` imports
4. `lucide-react` imports **only for icons used directly by the main page** (remove unused ones after extraction)
5. `import { formatDate } from '@/lib/dateUtils';` — remove if unused after extraction
6. Type imports from `@/types`
7. `import { dataCache } from '@/lib/dataCache';`
8. Component imports (direct and lazy)
9. `DashboardPage` component (state, `fetchData`, effects, handlers, render)
10. **No** inline child component definitions

### 10.2 Remove Unused Imports

After extraction, carefully remove `lucide-react` icons that are no longer used in the main page. The remaining page only needs icons if it uses them directly in its own JSX (not in child components).

### 10.3 Verification

```bash
npx tsc --noEmit
npm run build 2>&1 | head -n 60
```

If build succeeds, visually smoke-test:
1. Student dashboard loads without blank screen.
2. Platform hub renders.
3. Stats cards render with numbers.
4. Wallet balance shows.
5. Platform cards render with tasks.
6. Clicking a task opens submission modal.
7. Submitting a solution refreshes dashboard.

---

## Safety Rules (Anti-Hallucination)

- **Never invent new file paths.** Only use `src/components/student-dashboard/`.
- **Never modify API endpoints** (`/api/platforms`, `/api/student/stats`, `/api/wallet`, `/api/enrollments`, `/api/transactions`, `/api/submissions`, `/api/wallet/topup`).
- **Never modify types in `src/types/index.ts`.**
- **Never modify `src/lib/dateUtils.ts`.**
- **Never modify `src/app/(dashboard)/student/layout.tsx`.**
- **Never change CSS class names or Arabic text strings.** Copy-paste verbatim.
- **Never remove `useSession` or `useRouter` from `DashboardPage`;** they are used for auth redirects.
- **Never change the data-fetching logic** inside `fetchData` or the state variable names (`platforms`, `stats`, `wallet`, `enrollments`, `transactions`).
- **Never change handler names** (`handleRefresh`, `handleTaskClick`, `handleSubmissionSuccess`, `handleTopUpSuccess`, `handleEnrollmentSuccess`).
- **Never change the `orderedPlatforms` sorting logic.**
- **Do not add `memo` or `useMemo` prematurely.** Only add if you profile and prove a benefit.

---

## Rollback Plan

If anything breaks and you cannot fix within 10 minutes:

```bash
git checkout -- src/app/(dashboard)/student/page.tsx
git checkout -- src/components/student-dashboard/ 2>/dev/null || true
rm -rf src/components/student-dashboard/
```

Then verify:
```bash
npx tsc --noEmit
npm run build 2>&1 | head -n 40
```

---

## File Inventory After Refactor

```
src/components/student-dashboard/
  PageLoader.tsx
  PlatformHub.tsx          (exports getPlatformIcon as named export)
  StatsSection.tsx         (includes EnhancedStatCard)
  WalletSection.tsx
  ExpirationNotifications.tsx
  PlatformCard.tsx         (includes TaskCard + getTaskStatus)
  SubmissionModal.tsx

src/app/(dashboard)/student/page.tsx   (reduced to ~250 lines)
```

---

## Post-Refactor Build Verification Checklist

- [ ] `npx tsc --noEmit` passes with zero errors.
- [ ] `npm run build` completes successfully.
- [ ] Student dashboard loads without console errors.
- [ ] Platform hub displays platforms correctly.
- [ ] Stats section shows submission counts and average score.
- [ ] Wallet shows balance and top-up form toggles correctly.
- [ ] Expired/expiring notifications appear when applicable.
- [ ] Platform cards show enrollment status, tasks, and action buttons.
- [ ] Clicking a task opens the submission modal.
- [ ] Submitting a solution refreshes the page data.
- [ ] Enrollment and renewal buttons work correctly.
