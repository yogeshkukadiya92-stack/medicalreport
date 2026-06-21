# MediVault — Frontend Web App MVP Development Plan

> **Stack:** Next.js 14 (App Router) · React 18 · Tailwind CSS · REST API · JWT Auth
> **Phase:** 3 — Web App MVP Frontend
> **Date:** June 2026
> **Status:** Ready for developer implementation

---

## Table of Contents

1. [Frontend Architecture](#1-frontend-architecture)
2. [Page-wise Structure](#2-page-wise-structure)
3. [Component Structure](#3-component-structure)
4. [Next.js Folder Structure](#4-nextjs-folder-structure)
5. [Routing Plan](#5-routing-plan)
6. [Auth Flow](#6-auth-flow)
7. [Protected Route Strategy](#7-protected-route-strategy)
8. [API Integration Strategy](#8-api-integration-strategy)
9. [State Management Strategy](#9-state-management-strategy)
10. [Form Validation Strategy](#10-form-validation-strategy)
11. [File Upload Frontend Flow](#11-file-upload-frontend-flow)
12. [Report List & Filter Flow](#12-report-list--filter-flow)
13. [Report Detail Page Layout](#13-report-detail-page-layout)
14. [Dashboard Layout](#14-dashboard-layout)
15. [Error Handling](#15-error-handling)
16. [Loading States](#16-loading-states)
17. [Empty States](#17-empty-states)
18. [Success States](#18-success-states)
19. [Responsive Design Plan](#19-responsive-design-plan)
20. [Accessibility Suggestions](#20-accessibility-suggestions)
21. [Developer Task Breakdown](#21-developer-task-breakdown)
22. [Testing Checklist](#22-testing-checklist)
23. [Deployment Checklist](#23-deployment-checklist)

---

## 1. Frontend Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               Next.js App (App Router)                  │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │    │
│  │  │  Pages   │  │  Layouts │  │  Client Components │    │    │
│  │  │ (Server) │  │ (Server) │  │    (Interactive)    │    │    │
│  │  └────┬─────┘  └────┬─────┘  └─────────┬──────────┘    │    │
│  │       │              │                  │               │    │
│  │       └──────────────┼──────────────────┘               │    │
│  │                      │                                  │    │
│  │            ┌─────────▼─────────┐                        │    │
│  │            │   Context Layer   │                        │    │
│  │            │  Auth · Toast ·   │                        │    │
│  │            │  Family Member    │                        │    │
│  │            └─────────┬─────────┘                        │    │
│  │                      │                                  │    │
│  │            ┌─────────▼─────────┐                        │    │
│  │            │    API Layer      │                        │    │
│  │            │  (api-client.ts)  │                        │    │
│  │            │  Axios + Interceptors                      │    │
│  │            └─────────┬─────────┘                        │    │
│  └──────────────────────┼──────────────────────────────────┘    │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS
                ┌─────────▼─────────┐
                │   FastAPI Backend  │
                │   /v1/auth/*       │
                │   /v1/reports/*    │
                │   /v1/files/*      │
                └────────────────────┘
```

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Server-first rendering** | Use Next.js App Router; pages are server components by default |
| **Client components only when needed** | Forms, modals, interactive elements use `"use client"` |
| **API layer abstraction** | All backend calls go through `lib/api-client.ts` — never call `fetch` directly in components |
| **Token management** | Access token in memory (React state); refresh token in HttpOnly cookie |
| **Mobile-first design** | Tailwind breakpoints: base = mobile, `md:` = tablet, `lg:` = desktop |
| **Accessibility** | Semantic HTML, ARIA labels, keyboard navigation, 4.5:1 contrast ratio |
| **Senior-citizen friendly** | Min 16px body text, large touch targets (48×48px), clear labels, no jargon |

### Design System (Tailwind)

```javascript
// tailwind.config.js — custom theme extension
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',  // Primary action color
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        secondary: {
          500: '#0891B2',  // Cyan-600
          600: '#0E7490',
        },
        accent: {
          500: '#6366F1',  // Indigo — charts/analytics
        },
        health: {
          normal:    '#10B981',  // Green
          borderline:'#F59E0B',  // Amber
          high:      '#EF4444',  // Red
          low:       '#3B82F6',  // Blue
        },
        surface: {
          50:  '#F8FAFC',  // Page background
          100: '#F1F5F9',  // Card background
          200: '#E2E8F0',  // Borders
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'body':    ['16px', '24px'],     // Default body
        'body-lg': ['18px', '28px'],     // Emphasized body
        'label':   ['14px', '20px'],     // Form labels
        'heading': ['24px', '32px'],     // Page headings
        'title':   ['20px', '28px'],     // Card titles
        'small':   ['13px', '18px'],     // Metadata
      },
      borderRadius: {
        'card': '12px',
        'button': '10px',
        'input': '8px',
        'chip': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'modal': '0 20px 60px rgba(0,0,0,0.15)',
      },
    },
  },
};
```

---

## 2. Page-wise Structure

### All Pages (16 screens)

| # | Page | Route | Auth | Description |
|---|------|-------|------|-------------|
| 1 | **Login / Signup** | `/login` | Public | Phone number input |
| 2 | **OTP Verification** | `/verify-otp` | Public | 6-digit OTP entry |
| 3 | **Consent Screen** | `/consent` | Auth (new user) | AI processing + terms consent |
| 4 | **Profile Setup** | `/setup-profile` | Auth (new user) | Name, DOB, gender, blood group |
| 5 | **Home Dashboard** | `/dashboard` | Auth | Health summary, recent reports, quick upload |
| 6 | **Upload Report** | `/upload` | Auth | File picker, family member select, metadata |
| 7 | **File Preview** | `/upload/preview` | Auth | Preview before save, metadata entry |
| 8 | **Reports List** | `/reports` | Auth | All reports with search/filter |
| 9 | **Report Detail** | `/reports/[id]` | Auth | Full report with values, files, actions |
| 10 | **Family Members** | `/family` | Auth | List, add, edit, delete family members |
| 11 | **Add Family Member** | `/family/add` | Auth | Form to add new member |
| 12 | **Edit Family Member** | `/family/[id]/edit` | Auth | Edit existing member |
| 13 | **Analytics** | `/analytics` | Auth | Placeholder charts for health trends |
| 14 | **Settings** | `/settings` | Auth | Profile, consent, data export |
| 15 | **Share with Doctor** | `/reports/[id]/share` | Auth | Generate secure share link |
| 16 | **Not Found** | `/not-found` | — | 404 page |

### Page Flow

```
Login → OTP → [New User: Consent → Profile Setup] → Dashboard
                                                        │
                                    ┌───────┬───────────┼────────────┐
                                    │       │           │            │
                                 Upload  Reports   Analytics    Settings
                                    │       │
                                 Preview  Detail
                                            │
                                          Share
```

---

## 3. Component Structure

### Component Categories

```
components/
├── ui/            — Pure design system primitives (Button, Input, Card, etc.)
├── layout/        — Page structure (Sidebar, Header, BottomNav, PageWrapper)
├── forms/         — Form-specific (OTPInput, PhoneInput, ProfileForm)
├── reports/       — Report domain (ReportCard, ReportFilters, ValueRow)
├── dashboard/     — Dashboard domain (HealthSummary, RecentReports, QuickUpload)
├── family/        — Family domain (MemberCard, MemberForm)
├── upload/        — Upload domain (FileDropzone, FilePreview, MetadataForm)
└── shared/        — Cross-cutting (EmptyState, ErrorBoundary, LoadingSpinner)
```

### UI Components (Design System)

| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | `variant: 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md' \| 'lg'`, `loading`, `disabled`, `fullWidth` | All clickable actions |
| `Input` | `label`, `error`, `helper`, `type`, `icon`, `size` | Text inputs |
| `Select` | `label`, `options`, `error`, `placeholder` | Dropdowns |
| `Card` | `variant: 'default' \| 'outlined' \| 'elevated'`, `padding`, `onClick` | Content containers |
| `Badge` | `variant: 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | Status indicators |
| `Chip` | `selected`, `onClick`, `icon` | Filters, tags |
| `Modal` | `open`, `onClose`, `title`, `size` | Dialogs |
| `Toast` | `type: 'success' \| 'error' \| 'info'`, `message`, `duration` | Notifications |
| `Avatar` | `name`, `src`, `size`, `fallback` | Profile pictures |
| `Skeleton` | `variant: 'text' \| 'card' \| 'circle'`, `lines` | Loading placeholders |
| `EmptyState` | `icon`, `title`, `description`, `action` | No-data views |
| `PageHeader` | `title`, `subtitle`, `action`, `backHref` | Page top section |
| `Tabs` | `tabs[]`, `activeTab`, `onChange` | Tab navigation |
| `ProgressBar` | `value`, `max`, `label` | Upload progress |
| `FileIcon` | `mimeType`, `size` | File type indicator |
| `StatusDot` | `status: 'normal' \| 'borderline' \| 'high' \| 'low'` | Health value indicator |
| `Divider` | `label` | Section separator |

### Layout Components

| Component | Description |
|-----------|-------------|
| `AppShell` | Main layout with sidebar (desktop) / bottom nav (mobile) |
| `Sidebar` | Desktop navigation — logo, nav links, user info |
| `BottomNav` | Mobile bottom tab bar — Home, Reports, Upload (FAB), Analytics, Settings |
| `Header` | Mobile top bar — page title, back button, actions |
| `PageWrapper` | Max-width container with consistent padding |
| `AuthLayout` | Centered layout for login/signup/OTP screens |
| `OnboardingLayout` | Step-by-step layout for consent/profile setup |

### Domain Components

**Reports:**
| Component | Description |
|-----------|-------------|
| `ReportCard` | Card showing report title, date, lab, status badge, thumbnail |
| `ReportFilters` | Filter bar: type chips, date range, member select, search |
| `ReportValueRow` | Single extracted value with name, value, unit, status color |
| `ReportValueTable` | Table of all extracted values with edit buttons |
| `ReportTimeline` | Vertical timeline of reports by date |
| `ReportActions` | Action buttons: share, download, delete, star |

**Dashboard:**
| Component | Description |
|-----------|-------------|
| `HealthSummaryCard` | Key metrics needing attention (red/amber badges) |
| `RecentReportsCarousel` | Horizontal scroll of last 5 reports |
| `QuickUploadCard` | CTA card with upload icon and "Upload Report" button |
| `FamilyMemberSwitcher` | Dropdown/chips to switch active family member |
| `WelcomeHeader` | "Good morning, Rajesh" with avatar |

**Upload:**
| Component | Description |
|-----------|-------------|
| `FileDropzone` | Drag-and-drop area + file picker button |
| `FilePreviewPanel` | PDF viewer / image viewer for uploaded file |
| `UploadMetadataForm` | Report type, date, lab name, doctor, family member select |
| `UploadProgressOverlay` | Upload progress bar with percentage |
| `UploadSuccessModal` | "Report saved!" confirmation with next actions |

**Family:**
| Component | Description |
|-----------|-------------|
| `FamilyMemberCard` | Member name, relation, avatar, report count, action buttons |
| `FamilyMemberForm` | Add/edit form: name, relation, DOB, gender, blood group, conditions |
| `MemberSelectModal` | Modal to pick a family member before upload |

---

## 4. Next.js Folder Structure

```
medivault-web/
│
├── public/
│   ├── icons/                       # App icons, favicons
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── favicon.ico
│   ├── images/
│   │   ├── logo.svg                 # MediVault logo
│   │   ├── logo-dark.svg
│   │   ├── empty-reports.svg        # Empty state illustration
│   │   ├── empty-family.svg
│   │   ├── upload-success.svg
│   │   ├── consent-shield.svg
│   │   └── onboarding-hero.svg
│   └── manifest.json               # PWA manifest
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout — providers, fonts, global CSS
│   │   ├── page.tsx                 # "/" — redirect to /dashboard or /login
│   │   ├── not-found.tsx            # 404 page
│   │   ├── loading.tsx              # Global loading fallback
│   │   ├── error.tsx                # Global error boundary
│   │   │
│   │   ├── (auth)/                  # Auth group — no sidebar/nav
│   │   │   ├── layout.tsx           # AuthLayout — centered, minimal
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Phone number input
│   │   │   ├── verify-otp/
│   │   │   │   └── page.tsx         # OTP verification
│   │   │   ├── consent/
│   │   │   │   └── page.tsx         # AI + terms consent
│   │   │   └── setup-profile/
│   │   │       └── page.tsx         # Profile creation form
│   │   │
│   │   └── (app)/                   # Protected app group — with sidebar/nav
│   │       ├── layout.tsx           # AppShell — sidebar, bottom nav, header
│   │       ├── dashboard/
│   │       │   ├── page.tsx         # Home dashboard
│   │       │   └── loading.tsx      # Dashboard skeleton
│   │       ├── reports/
│   │       │   ├── page.tsx         # Reports list with filters
│   │       │   ├── loading.tsx      # Report list skeleton
│   │       │   └── [id]/
│   │       │       ├── page.tsx     # Report detail
│   │       │       ├── loading.tsx
│   │       │       └── share/
│   │       │           └── page.tsx # Share with doctor
│   │       ├── upload/
│   │       │   ├── page.tsx         # Upload flow (select file + member)
│   │       │   └── preview/
│   │       │       └── page.tsx     # Preview + metadata entry
│   │       ├── family/
│   │       │   ├── page.tsx         # Family members list
│   │       │   ├── add/
│   │       │   │   └── page.tsx     # Add family member form
│   │       │   └── [id]/
│   │       │       └── edit/
│   │       │           └── page.tsx # Edit family member
│   │       ├── analytics/
│   │       │   └── page.tsx         # Analytics placeholder
│   │       └── settings/
│   │           └── page.tsx         # Settings page
│   │
│   ├── components/
│   │   ├── ui/                      # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── FileIcon.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── Divider.tsx
│   │   │   └── index.ts             # Barrel export
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Main app frame
│   │   │   ├── Sidebar.tsx           # Desktop nav
│   │   │   ├── BottomNav.tsx         # Mobile nav
│   │   │   ├── Header.tsx            # Mobile top bar
│   │   │   ├── PageWrapper.tsx       # Content container
│   │   │   ├── AuthLayout.tsx        # Centered auth layout
│   │   │   └── OnboardingLayout.tsx  # Step layout
│   │   │
│   │   ├── forms/
│   │   │   ├── PhoneInput.tsx        # Country code + phone
│   │   │   ├── OTPInput.tsx          # 6-digit auto-advance
│   │   │   ├── ProfileForm.tsx       # Profile create/edit
│   │   │   └── DatePicker.tsx        # Date input (DOB, report date)
│   │   │
│   │   ├── reports/
│   │   │   ├── ReportCard.tsx
│   │   │   ├── ReportFilters.tsx
│   │   │   ├── ReportValueRow.tsx
│   │   │   ├── ReportValueTable.tsx
│   │   │   ├── ReportTimeline.tsx
│   │   │   └── ReportActions.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── HealthSummaryCard.tsx
│   │   │   ├── RecentReportsCarousel.tsx
│   │   │   ├── QuickUploadCard.tsx
│   │   │   ├── FamilyMemberSwitcher.tsx
│   │   │   └── WelcomeHeader.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── FileDropzone.tsx
│   │   │   ├── FilePreviewPanel.tsx
│   │   │   ├── UploadMetadataForm.tsx
│   │   │   ├── UploadProgressOverlay.tsx
│   │   │   └── UploadSuccessModal.tsx
│   │   │
│   │   ├── family/
│   │   │   ├── FamilyMemberCard.tsx
│   │   │   ├── FamilyMemberForm.tsx
│   │   │   └── MemberSelectModal.tsx
│   │   │
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingScreen.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── SEOHead.tsx
│   │
│   ├── lib/                          # Core utilities
│   │   ├── api-client.ts             # Axios instance + interceptors
│   │   ├── api/                      # API function modules
│   │   │   ├── auth.ts               # sendOTP, verifyOTP, refreshToken, logout
│   │   │   ├── profile.ts            # getProfile, createProfile, updateProfile
│   │   │   ├── family.ts             # listMembers, addMember, updateMember, deleteMember
│   │   │   ├── files.ts              # getUploadURL, confirmUpload, getFileURL
│   │   │   ├── reports.ts            # listReports, getReport, createReport, updateReport, deleteReport
│   │   │   ├── share.ts              # createShareLink, listShareLinks, revokeShareLink
│   │   │   └── consents.ts           # grantConsent, getConsents, revokeConsent
│   │   ├── auth.ts                   # Token storage, isAuthenticated, getAccessToken
│   │   ├── validators.ts             # Phone, email, file type/size validation
│   │   ├── formatters.ts             # Date, file size, phone number formatters
│   │   ├── constants.ts              # API URL, file limits, report types, etc.
│   │   └── utils.ts                  # General helpers (cn, debounce, etc.)
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts                # Auth context consumer
│   │   ├── useToast.ts               # Toast context consumer
│   │   ├── useFamilyMember.ts        # Active family member
│   │   ├── useReports.ts             # Report list with pagination
│   │   ├── useFileUpload.ts          # Upload state machine
│   │   ├── useDebounce.ts            # Debounced search
│   │   └── useMediaQuery.ts          # Responsive breakpoints
│   │
│   ├── contexts/                     # React Context providers
│   │   ├── AuthContext.tsx           # Auth state, login, logout, tokens
│   │   ├── ToastContext.tsx          # Toast queue
│   │   └── FamilyContext.tsx         # Active family member
│   │
│   ├── types/                        # TypeScript types
│   │   ├── api.ts                    # API response envelope types
│   │   ├── user.ts                   # User, Profile types
│   │   ├── family.ts                 # FamilyMember type
│   │   ├── report.ts                 # Report, ExtractedValue, ReportMetadata types
│   │   ├── file.ts                   # UploadedFile, FileURL types
│   │   ├── share.ts                  # ShareLink types
│   │   └── consent.ts               # Consent types
│   │
│   └── styles/
│       └── globals.css               # Tailwind directives + custom utilities
│
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
├── package.json
├── .env.local                        # Local env vars
├── .env.example                      # Documented env template
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## 5. Routing Plan

### Route Table

| Route | Page Component | Layout | Auth | Purpose |
|-------|---------------|--------|------|---------|
| `/` | `app/page.tsx` | — | — | Redirect: authenticated → `/dashboard`, else → `/login` |
| `/login` | `app/(auth)/login/page.tsx` | AuthLayout | Public | Phone number entry |
| `/verify-otp` | `app/(auth)/verify-otp/page.tsx` | AuthLayout | Public | OTP input, requires phone in state |
| `/consent` | `app/(auth)/consent/page.tsx` | OnboardingLayout | Auth | AI + terms consent (new users) |
| `/setup-profile` | `app/(auth)/setup-profile/page.tsx` | OnboardingLayout | Auth | Profile creation (new users) |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | AppShell | Auth | Home dashboard |
| `/reports` | `app/(app)/reports/page.tsx` | AppShell | Auth | Reports list |
| `/reports/[id]` | `app/(app)/reports/[id]/page.tsx` | AppShell | Auth | Report detail |
| `/reports/[id]/share` | `app/(app)/reports/[id]/share/page.tsx` | AppShell | Auth | Share with doctor |
| `/upload` | `app/(app)/upload/page.tsx` | AppShell | Auth | File selection + member pick |
| `/upload/preview` | `app/(app)/upload/preview/page.tsx` | AppShell | Auth | Preview + metadata |
| `/family` | `app/(app)/family/page.tsx` | AppShell | Auth | Family member list |
| `/family/add` | `app/(app)/family/add/page.tsx` | AppShell | Auth | Add member form |
| `/family/[id]/edit` | `app/(app)/family/[id]/edit/page.tsx` | AppShell | Auth | Edit member |
| `/analytics` | `app/(app)/analytics/page.tsx` | AppShell | Auth | Analytics placeholder |
| `/settings` | `app/(app)/settings/page.tsx` | AppShell | Auth | Settings |

### Navigation Structure

**Desktop Sidebar:**
```
┌──────────────────┐
│  🏥 MediVault    │
│                  │
│  ● Dashboard     │
│  ● Reports       │
│  ● Upload        │
│  ● Family        │
│  ● Analytics     │
│                  │
│  ─────────────── │
│  ● Settings      │
│  ● Logout        │
│                  │
│  ┌────────────┐  │
│  │ 👤 Rajesh  │  │
│  │  Self      │  │
│  └────────────┘  │
└──────────────────┘
```

**Mobile Bottom Nav:**
```
┌────────┬────────┬────────┬────────┬────────┐
│  Home  │Reports │   ＋   │ Trends │  More  │
│  🏠    │  📄    │  ⬆️    │  📊    │  ⚙️    │
└────────┴────────┴────────┴────────┴────────┘
                     FAB
              (Floating Upload)
```

---

## 6. Auth Flow

### Complete Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  /login     │     │ /verify-otp  │     │  Check user      │
│             │     │              │     │  status           │
│ Enter phone │────▶│ Enter 6-digit│────▶│                   │
│             │     │ OTP          │     │ is_new_user?      │
└─────────────┘     └──────────────┘     └────────┬──────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    │                           │
                              is_new_user=true           is_new_user=false
                                    │                           │
                              ┌─────▼─────┐              ┌─────▼─────┐
                              │ /consent  │              │/dashboard │
                              │           │              │           │
                              │ Accept    │              │  HOME     │
                              │ AI + Terms│              │           │
                              └─────┬─────┘              └───────────┘
                                    │
                              ┌─────▼──────────┐
                              │/setup-profile  │
                              │                │
                              │ Name, DOB,     │
                              │ Gender, Blood  │
                              └─────┬──────────┘
                                    │
                              ┌─────▼─────┐
                              │/dashboard │
                              └───────────┘
```

### Token Management

```typescript
// lib/auth.ts

// Access token: stored in memory (module-level variable)
let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// Refresh token: stored in HttpOnly cookie (set by backend)
// OR: stored in encrypted localStorage if backend doesn't set cookie
export function setRefreshToken(token: string) {
  localStorage.setItem('rt', token);
  // In production: should be HttpOnly cookie from Set-Cookie header
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('rt');
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem('rt');
}
```

### Auth Context

```typescript
// contexts/AuthContext.tsx
"use client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// On app mount:
// 1. Check for refresh token
// 2. If exists → call /auth/token/refresh → set access token → load user
// 3. If fails → clear tokens → redirect to /login
```

---

## 7. Protected Route Strategy

### Middleware Approach

```typescript
// middleware.ts (Next.js middleware — runs on server for every request)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/verify-otp'];
const ONBOARDING_ROUTES = ['/consent', '/setup-profile'];
const PROTECTED_ROUTES_PREFIX = ['dashboard', 'reports', 'upload', 'family', 'analytics', 'settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.get('refresh_token');
  
  // Public routes — allow always
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // If already logged in, redirect to dashboard
    if (hasRefreshToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // Protected routes — require auth
  if (!hasRefreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)'],
};
```

### Client-Side Auth Guard

```typescript
// components/shared/AuthGuard.tsx
"use client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    // New user flow enforcement
    if (user && !user.has_consent && pathname !== '/consent') {
      router.replace('/consent');
    } else if (user && !user.has_profile && pathname !== '/setup-profile') {
      router.replace('/setup-profile');
    }
  }, [isAuthenticated, isLoading, user, pathname]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

---

## 8. API Integration Strategy

### Axios Client Setup

```typescript
// lib/api-client.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearTokens, getRefreshToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401, refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = getRefreshToken();
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
          refresh_token: refreshToken,
        });
        
        const newAccessToken = data.data.access_token;
        setAccessToken(newAccessToken);
        
        // Retry queued requests
        failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
        failedQueue = [];
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError as Error));
        failedQueue = [];
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Module Pattern

```typescript
// lib/api/reports.ts

import apiClient from '../api-client';
import { Report, ReportDetail, ReportFilters, PaginatedResponse } from '@/types';

export const reportsAPI = {
  list: async (filters: ReportFilters): Promise<PaginatedResponse<Report>> => {
    const { data } = await apiClient.get('/reports', { params: filters });
    return data;
  },

  get: async (id: string): Promise<ReportDetail> => {
    const { data } = await apiClient.get(`/reports/${id}`);
    return data.data;
  },

  create: async (payload: CreateReportPayload): Promise<Report> => {
    const { data } = await apiClient.post('/reports', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Report>): Promise<Report> => {
    const { data } = await apiClient.patch(`/reports/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },

  confirm: async (id: string): Promise<void> => {
    await apiClient.post(`/reports/${id}/confirm`);
  },

  getStatus: async (id: string): Promise<ProcessingStatus> => {
    const { data } = await apiClient.get(`/reports/${id}/status`);
    return data.data;
  },

  getTrends: async (param: string, memberId?: string): Promise<TrendData> => {
    const { data } = await apiClient.get(`/reports/trends/${param}`, {
      params: { family_member_id: memberId },
    });
    return data.data;
  },

  getHealthSummary: async (memberId?: string): Promise<HealthSummary> => {
    const { data } = await apiClient.get('/reports/health-summary', {
      params: { family_member_id: memberId },
    });
    return data.data;
  },
};
```

---

## 9. State Management Strategy

### Approach: Context + Local State (No Redux)

For an MVP of this size, React Context + component-local state is sufficient. We avoid Redux or Zustand complexity.

| State Type | Strategy | Example |
|-----------|----------|---------|
| **Auth state** | `AuthContext` (global) | Current user, tokens, login/logout |
| **Active family member** | `FamilyContext` (global) | Which member's data to show |
| **Toast notifications** | `ToastContext` (global) | Queue of toasts |
| **Server data** | Local state + `useEffect` | Reports list, report detail |
| **Form state** | Local state + controlled inputs | Profile form, upload metadata |
| **UI state** | Local state | Modal open/close, filter selection |
| **URL state** | Search params | Report filters, pagination |

### Context Providers Hierarchy

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <FamilyProvider>
              {children}
            </FamilyProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
```

### Server State Pattern (Fetch + Cache)

```typescript
// Pattern for data fetching in page components

// Option A: Server Component (preferred for static data)
// app/(app)/reports/page.tsx
export default async function ReportsPage() {
  // This runs on the server — no useEffect needed
  // But we need auth token, which is client-side...
  // So reports page should be a client component
}

// Option B: Client Component with useEffect (for auth-protected data)
"use client";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchReports = useCallback(async (filters: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsAPI.list(filters);
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports({ page: 1, per_page: 20 });
  }, [fetchReports]);

  if (loading) return <ReportListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => fetchReports({})} />;
  if (reports.length === 0) return <EmptyState type="reports" />;
  
  return <ReportList reports={reports} pagination={pagination} />;
}
```

---

## 10. Form Validation Strategy

### Library: No Library — Custom Validation

For MVP simplicity, use custom validation. Upgrade to React Hook Form + Zod in Phase 2 if needed.

### Validation Utility

```typescript
// lib/validators.ts

export const validators = {
  phone: (value: string): string | null => {
    const cleaned = value.replace(/\s/g, '');
    if (!cleaned) return 'Phone number is required';
    if (!/^\+?[1-9]\d{9,13}$/.test(cleaned)) return 'Enter a valid phone number';
    return null;
  },

  otp: (value: string): string | null => {
    if (!value) return 'OTP is required';
    if (!/^\d{6}$/.test(value)) return 'OTP must be 6 digits';
    return null;
  },

  required: (label: string) => (value: string): string | null => {
    if (!value?.trim()) return `${label} is required`;
    return null;
  },

  fullName: (value: string): string | null => {
    if (!value?.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 150) return 'Name is too long';
    return null;
  },

  fileType: (file: File): string | null => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return 'Only PDF, JPEG, PNG, and WebP files allowed';
    return null;
  },

  fileSize: (file: File, maxMB: number = 20): string | null => {
    if (file.size > maxMB * 1024 * 1024) return `File size must be under ${maxMB} MB`;
    return null;
  },

  date: (value: string): string | null => {
    if (!value) return null; // optional
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Enter a valid date';
    if (date > new Date()) return 'Date cannot be in the future';
    return null;
  },
};
```

### Form Pattern

```typescript
// Pattern for form components

"use client";

interface FormErrors {
  [key: string]: string | null;
}

function ProfileForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {
      full_name: validators.fullName(formData.full_name),
      gender: validators.required('Gender')(formData.gender),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(e => e === null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await profileAPI.create(formData);
      toast.success('Profile created successfully');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Full Name"
        value={formData.full_name}
        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
        error={errors.full_name}
        required
      />
      {/* ... more fields */}
      <Button type="submit" loading={submitting} fullWidth>
        Create Profile
      </Button>
    </form>
  );
}
```

### Inline Error Display

```
┌──────────────────────────────────┐
│ Full Name *                      │
│ ┌──────────────────────────────┐ │
│ │                              │ │  ← Red border on error
│ └──────────────────────────────┘ │
│ ⚠ Full name is required          │  ← Red text below input
└──────────────────────────────────┘
```

- Errors show on blur (field-level) and on submit (form-level)
- Error text is red-500, positioned immediately below the input
- Input border turns red on error
- First error field auto-focuses on submit

---

## 11. File Upload Frontend Flow

### Complete Upload Flow

```
Step 1: Select File              Step 2: Select Member         Step 3: Preview + Metadata
┌────────────────────┐           ┌────────────────────┐       ┌────────────────────┐
│                    │           │ Choose member:     │       │  [PDF/Image View]  │
│   ┌────────────┐   │           │                    │       │                    │
│   │  📄 Drop   │   │           │  ● Rajesh (Self)   │       │  Report Type: ___  │
│   │  files     │   │           │  ○ Priya (Spouse)  │       │  Report Date: ___  │
│   │  here      │   │           │  ○ Mohan (Parent)  │       │  Lab Name:    ___  │
│   │            │   │           │                    │       │  Doctor:      ___  │
│   │  or click  │   │    ────▶  │  [+ Add Member]    │ ────▶ │  Notes:       ___  │
│   │  to browse │   │           │                    │       │                    │
│   └────────────┘   │           │         [Next →]   │       │  [Save Report]     │
│                    │           └────────────────────┘       └────────────────────┘
│  PDF, JPEG, PNG    │                                                  │
│  Max 20 MB         │                                                  ▼
└────────────────────┘                                        ┌────────────────────┐
                                                              │  ✅ Report Saved!  │
                                                              │                    │
                                                              │  [View Report]     │
                                                              │  [Upload Another]  │
                                                              └────────────────────┘
```

### Upload Hook (State Machine)

```typescript
// hooks/useFileUpload.ts

type UploadStep = 'select' | 'member' | 'preview' | 'uploading' | 'success' | 'error';

interface UploadState {
  step: UploadStep;
  file: File | null;
  fileId: string | null;
  familyMemberId: string | null;
  uploadProgress: number;
  previewUrl: string | null;
  error: string | null;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    step: 'select',
    file: null,
    fileId: null,
    familyMemberId: null,
    uploadProgress: 0,
    previewUrl: null,
    error: null,
  });

  const selectFile = (file: File) => {
    // Validate type and size
    const typeError = validators.fileType(file);
    const sizeError = validators.fileSize(file);
    if (typeError || sizeError) {
      setState(prev => ({ ...prev, error: typeError || sizeError }));
      return;
    }

    // Generate preview URL
    const previewUrl = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null; // PDF preview handled by embed/iframe

    setState(prev => ({
      ...prev,
      file,
      previewUrl,
      step: 'member',
      error: null,
    }));
  };

  const selectMember = (memberId: string) => {
    setState(prev => ({
      ...prev,
      familyMemberId: memberId,
      step: 'preview',
    }));
  };

  const upload = async (metadata: ReportMetadata) => {
    setState(prev => ({ ...prev, step: 'uploading', uploadProgress: 0 }));

    try {
      // Step 1: Get presigned URL from backend
      const { file_id, upload_url, upload_headers } = await filesAPI.getUploadURL({
        filename: state.file!.name,
        mime_type: state.file!.type,
        file_size_bytes: state.file!.size,
      });

      setState(prev => ({ ...prev, fileId: file_id, uploadProgress: 20 }));

      // Step 2: Upload file directly to S3
      await axios.put(upload_url, state.file, {
        headers: upload_headers,
        onUploadProgress: (e) => {
          const percent = 20 + Math.round((e.loaded / (e.total || 1)) * 60);
          setState(prev => ({ ...prev, uploadProgress: percent }));
        },
      });

      setState(prev => ({ ...prev, uploadProgress: 85 }));

      // Step 3: Confirm upload
      const checksum = await computeSHA256(state.file!);
      await filesAPI.confirmUpload(file_id, { checksum_sha256: checksum });

      setState(prev => ({ ...prev, uploadProgress: 90 }));

      // Step 4: Create report
      await reportsAPI.create({
        family_member_id: state.familyMemberId!,
        file_ids: [file_id],
        source: state.file!.type === 'application/pdf' ? 'pdf' : 'gallery',
        ...metadata,
      });

      setState(prev => ({ ...prev, step: 'success', uploadProgress: 100 }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: 'Upload failed. Please try again.',
      }));
    }
  };

  const reset = () => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setState({
      step: 'select',
      file: null,
      fileId: null,
      familyMemberId: null,
      uploadProgress: 0,
      previewUrl: null,
      error: null,
    });
  };

  return { state, selectFile, selectMember, upload, reset };
}
```

### FileDropzone Component

```typescript
// components/upload/FileDropzone.tsx

"use client";

export function FileDropzone({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-card p-12 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-surface-200 hover:border-primary-400 hover:bg-surface-50'
        }
      `}
      role="button"
      aria-label="Upload a file. Click or drag and drop."
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
    >
      <UploadIcon className="w-12 h-12 mx-auto text-primary-500 mb-4" />
      <p className="text-body font-medium text-gray-700">
        Drag & drop your report here
      </p>
      <p className="text-label text-gray-500 mt-2">
        or click to browse files
      </p>
      <p className="text-small text-gray-400 mt-4">
        Supported: PDF, JPEG, PNG, WebP · Max 20 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </div>
  );
}
```

---

## 12. Report List & Filter Flow

### Filter Bar Layout

```
Desktop:
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Search reports...          [Type ▼]  [Date ▼]  [Member ▼]  │
│                                                                 │
│  Chips: [All] [Blood Test] [Thyroid] [Lipid] [Diabetes] [Other] │
└─────────────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────────────┐
│  🔍 Search reports...     🔽   │   ← Filter icon opens bottom sheet
│                                │
│  [All] [Blood] [Thyroid] →     │   ← Horizontal scroll chips
└────────────────────────────────┘
```

### Report List Component

```typescript
// Reports list with filters, search, and pagination

"use client";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeMember } = useFamilyMember();
  const debouncedSearch = useDebounce(searchParams.get('search') || '', 300);

  const filters: ReportFilters = {
    page: Number(searchParams.get('page')) || 1,
    per_page: 20,
    search: debouncedSearch || undefined,
    report_type: searchParams.get('type') || undefined,
    family_member_id: searchParams.get('member') || activeMember?.id,
    sort_by: 'report_date',
    sort_order: 'desc',
  };

  useEffect(() => {
    fetchReports();
  }, [debouncedSearch, searchParams]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.list(filters);
      setReports(response.data);
      setPagination(response.pagination);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.replace(`/reports?${params.toString()}`);
  };

  return (
    <PageWrapper>
      <PageHeader title="My Reports" action={
        <Button href="/upload" size="sm">Upload Report</Button>
      } />

      <ReportFilters
        activeType={filters.report_type}
        onTypeChange={(type) => updateFilter('type', type)}
        searchValue={searchParams.get('search') || ''}
        onSearchChange={(val) => updateFilter('search', val)}
      />

      {loading ? (
        <ReportListSkeleton count={5} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon />}
          title="No reports yet"
          description="Upload your first medical report to get started"
          action={{ label: 'Upload Report', href: '/upload' }}
        />
      ) : (
        <>
          <div className="space-y-3 mt-4">
            {reports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
          {pagination && pagination.total_pages > 1 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={(page) => updateFilter('page', String(page))}
            />
          )}
        </>
      )}
    </PageWrapper>
  );
}
```

### Report Card Design

```
┌─────────────────────────────────────────────────┐
│  📄 Complete Blood Count              ⭐ │
│                                                 │
│  🏥 Apollo Diagnostics · 📅 18 Jun 2026        │
│  👤 Rajesh Kumar (Self)                         │
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 🟢 2    │ │ 🟡 2    │ │ 🔴 2    │           │
│  │ Normal  │ │ Border  │ │ High    │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│                                                 │
│  [Blood Test]  [Completed ✓]                    │
└─────────────────────────────────────────────────┘
```

---

## 13. Report Detail Page Layout

### Desktop Layout (Two-Column)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Reports        Complete Blood Count         ⭐ ⋮    │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │                          │  │  Report Information           │  │
│  │                          │  │                                │  │
│  │     PDF / Image          │  │  Type:    Blood Test           │  │
│  │     Preview              │  │  Date:    18 Jun 2026          │  │
│  │                          │  │  Lab:     Apollo Diagnostics   │  │
│  │     (Scrollable)         │  │  Doctor:  Dr. Sharma           │  │
│  │                          │  │  Member:  Rajesh Kumar (Self)  │  │
│  │                          │  │  Source:  PDF Upload            │  │
│  │                          │  │                                │  │
│  │                          │  │  [Edit Details]                │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Extracted Values                                    [Edit]  │ │
│  │                                                              │ │
│  │  Parameter          Value        Range        Status         │ │
│  │  ──────────────────────────────────────────────────────      │ │
│  │  Hemoglobin         14.2 g/dL    13.0–17.0   🟢 Normal     │ │
│  │  Fasting Sugar      142 mg/dL    70–110      🔴 High       │ │
│  │  HbA1c              7.1 %        < 5.7       🔴 High       │ │
│  │  Total Cholesterol  195 mg/dL    < 200       🟢 Normal     │ │
│  │  Vitamin D          18 ng/mL     30–100      🔵 Low        │ │
│  │  TSH                2.1 mIU/L    0.4–4.0     🟢 Normal     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │
│  │ Download │  │  Share   │  │  Delete  │  │ View Original│     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Single Column — Stacked)

```
┌────────────────────────────┐
│  ← Complete Blood Count ⋮  │
├────────────────────────────┤
│                            │
│  ┌──────────────────────┐  │
│  │  PDF/Image Preview   │  │
│  │  (tap to fullscreen) │  │
│  └──────────────────────┘  │
│                            │
│  Report Information        │
│  ────────────────────────  │
│  Type:   Blood Test        │
│  Date:   18 Jun 2026       │
│  Lab:    Apollo Diagnostics│
│  Doctor: Dr. Sharma        │
│  Member: Rajesh (Self)     │
│                            │
│  Extracted Values          │
│  ────────────────────────  │
│  ┌────────────────────────┐│
│  │ Hemoglobin    14.2 g/dL││
│  │ Range: 13.0–17.0  🟢   ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ Fasting Sugar  142     ││
│  │ Range: 70–110  🔴 High ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ HbA1c          7.1 %   ││
│  │ Range: <5.7    🔴 High ││
│  └────────────────────────┘│
│                            │
│  ┌──────────┐ ┌──────────┐ │
│  │  Share   │ │ Download │ │
│  └──────────┘ └──────────┘ │
└────────────────────────────┘
```

---

## 14. Dashboard Layout

### Desktop Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  Good morning, Rajesh 👋                         [Upload Report] │
│                                                                  │
│  ┌──────── Family Member Switcher ────────┐                      │
│  │  [Rajesh ●] [Priya] [Mohan] [+ Add]   │                      │
│  └────────────────────────────────────────┘                      │
│                                                                  │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐   │
│  │  Needs Attention    (2) │  │  Quick Stats                 │   │
│  │                         │  │                              │   │
│  │  🔴 HbA1c: 7.1%        │  │  Total Reports:    12        │   │
│  │     Normal: <5.7        │  │  This Month:       2         │   │
│  │     Report: 18 Jun →    │  │  Family Members:   3         │   │
│  │                         │  │  Last Upload:   18 Jun 2026  │   │
│  │  🔵 Vitamin D: 18 ng/mL│  │                              │   │
│  │     Normal: 30–100      │  │                              │   │
│  │     Report: 18 Jun →    │  │                              │   │
│  └─────────────────────────┘  └──────────────────────────────┘   │
│                                                                  │
│  Recent Reports                                  [View All →]    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ CBC      │ │ Thyroid  │ │ Lipid    │ │ Diabetes │            │
│  │ 18 Jun   │ │ 10 Jun   │ │ 1 Jun    │ │ 20 May   │            │
│  │ Apollo   │ │ Lal Path │ │ Apollo   │ │ SRL      │            │
│  │ 🟢2 🔴2  │ │ 🟢3 🟡1  │ │ 🟢4      │ │ 🔴2 🟡1  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  📊 Analytics Placeholder                                │    │
│  │                                                          │    │
│  │  "Track your health trends over time"                    │    │
│  │  [Go to Analytics →]                                     │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Dashboard

```
┌────────────────────────────┐
│  Good morning, Rajesh 👋    │
│                            │
│  [Rajesh ●] [Priya] [+]   │
│                            │
│  ┌────────────────────────┐│
│  │  ⚠ Needs Attention (2) ││
│  │  HbA1c 7.1% · Vit D 18││
│  │  [View Details →]       ││
│  └────────────────────────┘│
│                            │
│  ┌────────────────────────┐│
│  │  📤 Upload Report      ││
│  │  Store your latest     ││
│  │  medical report        ││
│  └────────────────────────┘│
│                            │
│  Recent Reports   [All →]  │
│  ┌────────────────────────┐│
│  │ CBC · 18 Jun · Apollo  ││
│  │ 🟢2 🔴2                ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ Thyroid · 10 Jun · Lal ││
│  │ 🟢3 🟡1                ││
│  └────────────────────────┘│
└────────────────────────────┘
```

---

## 15. Error Handling

### Error Categories

| Category | Source | User Message | Action |
|----------|--------|-------------|--------|
| **Network** | No internet | "You're offline. Check your connection." | Show banner at top, auto-dismiss on reconnect |
| **401 Unauthorized** | Token expired | Silent refresh. If refresh fails: "Session expired. Please log in again." | Redirect to `/login` |
| **403 Forbidden** | Access denied | "You don't have access to this resource." | Show error state, back button |
| **404 Not Found** | Invalid ID | "Report not found." | Show error state, link to reports list |
| **413 Too Large** | File > 20 MB | "File is too large. Maximum size is 20 MB." | Show inline error, keep file picker open |
| **415 Wrong Type** | Bad file type | "This file type is not supported. Use PDF, JPEG, or PNG." | Inline error |
| **422 Business Error** | Validation/limit | Show backend message directly (e.g., "Maximum 10 family members") | Inline error |
| **429 Rate Limit** | Too many requests | "Too many requests. Please wait a moment." | Auto-retry after `Retry-After` header |
| **500 Server Error** | Backend crash | "Something went wrong. Please try again." | Show error state with retry button |

### Global Error Boundary

```typescript
// app/error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <ExclamationIcon className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-heading font-semibold text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-body text-gray-500 mb-6 max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <Button onClick={reset} variant="primary">
        Try Again
      </Button>
    </div>
  );
}
```

### API Error Handler Utility

```typescript
// lib/utils.ts

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;
    if (apiError?.message) return apiError.message;
    
    switch (error.response?.status) {
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You don\'t have permission for this action.';
      case 404: return 'The requested resource was not found.';
      case 413: return 'File is too large. Maximum size is 20 MB.';
      case 429: return 'Too many requests. Please wait a moment.';
      default:  return 'Something went wrong. Please try again.';
    }
  }
  
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
```

---

## 16. Loading States

### Skeleton Screens (Not Spinners)

Use skeleton placeholders that match the content shape. Never show blank white screens or generic spinners for page loads.

**Dashboard Skeleton:**
```
┌────────────────────────────┐
│  ████████████ 👋            │
│                            │
│  [████] [████] [████]      │
│                            │
│  ┌────────────────────────┐│
│  │ ████████████████████   ││
│  │ ████████████           ││
│  │ ████████████████       ││
│  └────────────────────────┘│
│                            │
│  ████████████              │
│  ┌─────────┐ ┌─────────┐  │
│  │ ███████ │ │ ███████ │  │
│  │ ██████  │ │ ██████  │  │
│  │ ████    │ │ ████    │  │
│  └─────────┘ └─────────┘  │
└────────────────────────────┘
```

### Skeleton Component

```typescript
// components/ui/Skeleton.tsx

interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'rectangular';
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, lines = 1, className }: SkeletonProps) {
  const base = "animate-pulse bg-gray-200 rounded";
  
  if (variant === 'text') {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, "h-4", i === lines - 1 ? "w-3/4" : "w-full")}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'card') {
    return <div className={cn(base, "h-32 w-full rounded-card", className)} />;
  }
  
  if (variant === 'circle') {
    return <div className={cn(base, "w-10 h-10 rounded-full", className)} />;
  }
  
  return <div className={cn(base, className)} style={{ width, height }} />;
}
```

### Where to Use Loading States

| Page | Loading Type | Implementation |
|------|-------------|----------------|
| Dashboard | Skeleton cards | `dashboard/loading.tsx` |
| Reports list | Skeleton card list (5 items) | `reports/loading.tsx` |
| Report detail | Skeleton sections | `reports/[id]/loading.tsx` |
| Family members | Skeleton member cards | Inline loading state |
| Upload | Progress bar + percentage | `UploadProgressOverlay` component |
| OTP verification | Button spinner | Button `loading` prop |
| Profile creation | Button spinner | Button `loading` prop |
| File preview | Image/PDF loading indicator | Conditional rendering |

### Button Loading State

```tsx
<Button loading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Report'}
</Button>

// Renders:
// [⟳ Saving...]  ← spinner icon + text, button disabled, opacity reduced
```

---

## 17. Empty States

### Empty State Designs

Each empty state includes: illustration, title, description, and primary CTA.

| Page | Title | Description | CTA |
|------|-------|-------------|-----|
| Dashboard (new user) | "Welcome to MediVault!" | "Start by uploading your first medical report. We'll help you organize and track your health." | "Upload Your First Report" |
| Reports list | "No reports yet" | "Upload medical reports to keep them organized and easily accessible." | "Upload Report" |
| Reports list (filtered) | "No matching reports" | "Try changing your filters or search term." | "Clear Filters" |
| Family members | "Just you for now" | "Add family members to manage their reports too." | "Add Family Member" |
| Analytics | "Not enough data" | "Upload at least 2 reports to start seeing health trends." | "Upload Report" |
| Report values | "No values extracted" | "This report hasn't been processed yet, or no values were found." | "Edit Manually" |

### EmptyState Component

```typescript
// components/ui/EmptyState.tsx

interface EmptyStateProps {
  icon?: React.ReactNode;
  illustration?: string;     // SVG path in /public/images/
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {illustration && (
        <img src={illustration} alt="" className="w-48 h-48 mb-6 opacity-80" />
      )}
      {icon && !illustration && (
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-title font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-body text-gray-500 max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Button href={action.href}>{action.label}</Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="text-label text-primary-600 mt-3 hover:underline"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
```

---

## 18. Success States

### Success Patterns

| Action | Feedback | Duration | Follow-up |
|--------|----------|----------|-----------|
| Login successful | Redirect to dashboard (no toast) | Instant | — |
| Profile created | Toast: "Profile created!" + redirect | 3 sec | Go to dashboard |
| Family member added | Toast: "Member added!" + redirect | 3 sec | Go to family list |
| Report uploaded | Full-screen success modal | Until dismissed | "View Report" or "Upload Another" |
| Report deleted | Toast: "Report deleted" | 3 sec | Stay on reports list |
| Share link created | Modal with copy button | Until dismissed | Copy link + close |
| Value edited | Inline save indicator | 2 sec | Stay on detail page |
| Consent granted | Redirect to next step | Instant | — |

### Upload Success Modal

```
┌──────────────────────────────────┐
│                                  │
│          ✅                      │
│                                  │
│    Report Saved Successfully!    │
│                                  │
│    Your Complete Blood Count     │
│    report has been stored        │
│    securely.                     │
│                                  │
│    ┌────────────────────────┐    │
│    │   View Report    →     │    │
│    └────────────────────────┘    │
│    ┌────────────────────────┐    │
│    │   Upload Another       │    │
│    └────────────────────────┘    │
│                                  │
│           Go to Home             │
└──────────────────────────────────┘
```

### Toast Component

```typescript
// components/ui/Toast.tsx

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

const ICONS = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  error:   <XCircleIcon className="w-5 h-5 text-red-500" />,
  info:    <InfoIcon className="w-5 h-5 text-blue-500" />,
};

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 p-4 rounded-card border shadow-card",
            "animate-slide-in-right",
            STYLES[toast.type]
          )}
          role="alert"
        >
          {ICONS[toast.type]}
          <p className="text-body flex-1">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} aria-label="Dismiss">
            <XIcon className="w-4 h-4 opacity-50 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 19. Responsive Design Plan

### Breakpoints

| Breakpoint | Width | Layout | Navigation |
|-----------|-------|--------|------------|
| **Mobile** | < 768px | Single column, stacked cards | Bottom tab bar |
| **Tablet** | 768–1023px | 2-column where useful | Sidebar (collapsed) |
| **Desktop** | ≥ 1024px | Multi-column, side-by-side | Sidebar (expanded) |

### Component Responsiveness

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| **AppShell** | Bottom nav + header | Collapsed sidebar | Expanded sidebar |
| **Dashboard** | Stacked cards | 2-column grid | 2-column grid |
| **Reports list** | Full-width cards | Full-width cards | Full-width cards |
| **Report detail** | Stacked: preview → info → values | 2-column: preview + info | 2-column: preview + info side-by-side |
| **Upload** | Full-screen steps | Centered card | Centered card (max-w-2xl) |
| **Family list** | Full-width member cards | 2-column grid | 3-column grid |
| **Forms** | Full-width inputs | Max-w-lg centered | Max-w-lg centered |
| **Modals** | Full-screen bottom sheet | Centered modal | Centered modal |
| **Filter bar** | Horizontal scroll chips + filter icon | Inline chips + dropdowns | Inline chips + dropdowns |

### Tailwind Responsive Patterns

```tsx
// Dashboard grid:
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <HealthSummaryCard />
  <QuickStatsCard />
</div>

// AppShell layout:
<div className="flex min-h-screen">
  {/* Sidebar — hidden on mobile */}
  <aside className="hidden lg:flex lg:w-64 lg:flex-col">
    <Sidebar />
  </aside>
  
  {/* Main content */}
  <main className="flex-1 pb-20 lg:pb-0">
    {/* Mobile header — hidden on desktop */}
    <div className="lg:hidden">
      <Header />
    </div>
    {children}
  </main>
  
  {/* Bottom nav — mobile only */}
  <div className="lg:hidden fixed bottom-0 left-0 right-0">
    <BottomNav />
  </div>
</div>

// Report detail two-column:
<div className="flex flex-col lg:flex-row gap-6">
  <div className="lg:w-1/2">
    <FilePreviewPanel />
  </div>
  <div className="lg:w-1/2">
    <ReportInfoCard />
  </div>
</div>

// Form centered:
<div className="max-w-lg mx-auto px-4">
  <ProfileForm />
</div>
```

---

## 20. Accessibility Suggestions

### WCAG 2.1 AA Compliance Targets

| Area | Requirement | Implementation |
|------|-------------|----------------|
| **Color contrast** | 4.5:1 for body text, 3:1 for large text | Verify all color combinations with WebAIM checker |
| **Touch targets** | Min 44×44px (WCAG), prefer 48×48px | Tailwind: `min-h-[48px] min-w-[48px]` on all buttons |
| **Font size** | Min 16px body (prevent iOS zoom) | Never go below 13px; use `text-body` (16px) as default |
| **Focus indicators** | Visible focus ring on keyboard navigation | Tailwind: `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` |
| **Screen readers** | All interactive elements labeled | `aria-label`, `aria-describedby`, semantic HTML |
| **Keyboard nav** | All actions reachable via keyboard | Tab order, Enter/Space activation, Escape to close modals |
| **Alt text** | All meaningful images have alt text | Decorative images: `alt=""`, meaningful: descriptive text |
| **Error identification** | Errors linked to fields | `aria-invalid`, `aria-describedby={errorId}` |
| **Motion** | Respect reduced motion | `prefers-reduced-motion: reduce` disables animations |
| **Language** | Page language declared | `<html lang="en">` |

### Senior-Citizen Specific Design Rules

| Rule | Implementation |
|------|----------------|
| Large, readable text | Min 16px body, 20px headings on mobile |
| High contrast | Dark text on light backgrounds; avoid gray-on-gray |
| Clear, labeled buttons | Always text + icon; never icon-only (except close) |
| Simple language | "Upload Report" not "Ingest Document"; "Phone Number" not "Mobile" |
| Generous spacing | 16px between cards, 12px between form fields |
| No time pressure | No auto-advancing carousels; manual navigation only |
| Error recovery | Clear error messages with fix instructions |
| Confirmation on destructive actions | "Delete this report?" dialog before any delete |
| Consistent navigation | Same nav position on every page; predictable back button |

### Accessible Component Patterns

```tsx
// Accessible Input:
<div>
  <label htmlFor={id} className="block text-label font-medium text-gray-700 mb-1">
    {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
  </label>
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
    aria-required={required}
    className={cn(
      "w-full px-4 py-3 border rounded-input text-body",
      "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      "outline-none transition-colors",
      error ? "border-red-500 bg-red-50" : "border-surface-200"
    )}
  />
  {error && (
    <p id={`${id}-error`} className="text-sm text-red-600 mt-1" role="alert">
      {error}
    </p>
  )}
  {helper && !error && (
    <p id={`${id}-helper`} className="text-sm text-gray-500 mt-1">
      {helper}
    </p>
  )}
</div>

// Accessible Modal:
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="..."
>
  <h2 id="modal-title">{title}</h2>
  {/* Auto-focus first interactive element on open */}
  {/* Trap focus inside modal */}
  {/* Escape key closes modal */}
  {/* Restore focus to trigger element on close */}
</div>

// Status badge with screen reader text:
<span className="flex items-center gap-1.5">
  <span
    className={cn("w-2 h-2 rounded-full", statusColors[status])}
    aria-hidden="true"
  />
  <span className="text-label">{value} {unit}</span>
  <span className="sr-only">Status: {status}</span>
</span>
```

---

## 21. Developer Task Breakdown

### Sprint 1: Project Setup (Week 1)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F1.1 | Initialize Next.js 14 project with TypeScript | 1 | — |
| F1.2 | Configure Tailwind CSS with custom design tokens | 2 | F1.1 |
| F1.3 | Create folder structure (`components/`, `lib/`, `hooks/`, `types/`, `contexts/`) | 1 | F1.1 |
| F1.4 | Set up ESLint + Prettier configuration | 1 | F1.1 |
| F1.5 | Create `.env.local` and `.env.example` with API URL | 0.5 | F1.1 |
| F1.6 | Build UI component library: Button, Input, Select, Card, Badge | 6 | F1.2 |
| F1.7 | Build UI components: Modal, Toast, Avatar, Skeleton, EmptyState | 5 | F1.2 |
| F1.8 | Build UI components: PageHeader, Tabs, ProgressBar, Chip, Divider | 4 | F1.2 |
| F1.9 | Build layout components: AppShell, Sidebar, BottomNav, Header, PageWrapper | 6 | F1.6 |
| F1.10 | Build AuthLayout and OnboardingLayout | 2 | F1.9 |
| F1.11 | Set up Axios API client with interceptors | 3 | F1.5 |
| F1.12 | Create TypeScript types for all API models | 3 | — |
| F1.13 | Create ToastContext provider | 2 | F1.7 |
| F1.14 | Create utility functions (cn, formatDate, formatFileSize, debounce) | 2 | — |
| F1.15 | Create validators (phone, OTP, file, required) | 2 | — |
| | **Sprint 1 Total** | **~40 hours** | |

### Sprint 2: Auth Flow (Week 2)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F2.1 | Create AuthContext with login, logout, token management | 4 | F1.11 |
| F2.2 | Build PhoneInput component (country code + phone) | 3 | F1.6 |
| F2.3 | Build OTPInput component (6 boxes, auto-advance, paste support) | 4 | F1.6 |
| F2.4 | Build Login page (`/login`) | 3 | F2.2, F1.10 |
| F2.5 | Build OTP Verification page (`/verify-otp`) with resend timer | 4 | F2.3, F1.10 |
| F2.6 | Build Consent page (`/consent`) — AI + terms toggles | 3 | F1.10 |
| F2.7 | Build Profile Setup page (`/setup-profile`) — full form | 4 | F1.6, F1.10 |
| F2.8 | Create Next.js middleware for route protection | 2 | F2.1 |
| F2.9 | Create AuthGuard client component | 2 | F2.1 |
| F2.10 | Integrate auth API: sendOTP, verifyOTP, refreshToken, logout | 3 | F2.1, F1.11 |
| F2.11 | Implement token refresh interceptor with request queueing | 3 | F2.10 |
| F2.12 | Handle auth redirects: new user → consent → profile → dashboard | 2 | F2.8 |
| F2.13 | Add "Remember me" / persistent login via refresh token | 1 | F2.10 |
| | **Sprint 2 Total** | **~38 hours** | |

### Sprint 3: Dashboard & Family Members (Week 3)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F3.1 | Create FamilyContext (active member state) | 2 | F2.1 |
| F3.2 | Build WelcomeHeader component | 1 | F1.6 |
| F3.3 | Build FamilyMemberSwitcher (chips with active indicator) | 3 | F3.1 |
| F3.4 | Build HealthSummaryCard (attention items with badges) | 3 | F1.6 |
| F3.5 | Build QuickUploadCard | 1 | F1.6 |
| F3.6 | Build RecentReportsCarousel (horizontal scroll) | 3 | F1.6 |
| F3.7 | Build Dashboard page — assemble all components | 4 | F3.2–F3.6 |
| F3.8 | Build Dashboard skeleton loading state | 2 | F1.7 |
| F3.9 | Integrate dashboard API: health-summary, recent reports | 3 | F3.7, F1.11 |
| F3.10 | Build FamilyMemberCard component | 2 | F1.6 |
| F3.11 | Build FamilyMemberForm (add/edit shared component) | 4 | F1.6, F1.15 |
| F3.12 | Build Family Members list page (`/family`) | 3 | F3.10 |
| F3.13 | Build Add Family Member page (`/family/add`) | 2 | F3.11 |
| F3.14 | Build Edit Family Member page (`/family/[id]/edit`) | 2 | F3.11 |
| F3.15 | Integrate family API: list, add, update, delete, set-default | 3 | F3.12, F1.11 |
| F3.16 | Add ConfirmDialog for family member deletion | 2 | F1.7 |
| F3.17 | Build empty state for family page | 1 | F1.7 |
| | **Sprint 3 Total** | **~40 hours** | |

### Sprint 4: File Upload Flow (Week 4)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F4.1 | Build FileDropzone (drag + click + validation) | 4 | F1.6 |
| F4.2 | Build MemberSelectModal (select member before upload) | 3 | F3.1 |
| F4.3 | Build Upload page (`/upload`) — file select + member pick | 3 | F4.1, F4.2 |
| F4.4 | Build FilePreviewPanel (PDF embed + image viewer) | 5 | F1.6 |
| F4.5 | Build UploadMetadataForm (type, date, lab, doctor, notes) | 4 | F1.6, F1.15 |
| F4.6 | Build Upload Preview page (`/upload/preview`) | 4 | F4.4, F4.5 |
| F4.7 | Create useFileUpload hook (state machine) | 4 | F1.11 |
| F4.8 | Build UploadProgressOverlay (progress bar + percentage) | 2 | F1.6 |
| F4.9 | Build UploadSuccessModal | 2 | F1.7 |
| F4.10 | Integrate upload API: getUploadURL → S3 PUT → confirm → createReport | 5 | F4.7, F1.11 |
| F4.11 | Implement SHA-256 checksum in browser (Web Crypto API) | 2 | F4.10 |
| F4.12 | Handle upload errors (network, timeout, S3 failure) | 2 | F4.10 |
| F4.13 | Build FileIcon component (PDF/image/document icons) | 1 | — |
| | **Sprint 4 Total** | **~41 hours** | |

### Sprint 5: Reports Module (Week 5)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F5.1 | Build ReportCard component | 3 | F1.6 |
| F5.2 | Build ReportFilters (search + type chips + date + member) | 4 | F1.6 |
| F5.3 | Build PaginationControls | 2 | F1.6 |
| F5.4 | Build ReportListSkeleton | 1 | F1.7 |
| F5.5 | Build Reports list page (`/reports`) with URL-based filters | 5 | F5.1–F5.4 |
| F5.6 | Integrate reports list API with debounced search | 3 | F5.5, F1.11 |
| F5.7 | Build ReportValueRow (param, value, range, status color) | 2 | F1.6 |
| F5.8 | Build ReportValueTable (all values with edit buttons) | 3 | F5.7 |
| F5.9 | Build ReportInfoCard (metadata display) | 2 | F1.6 |
| F5.10 | Build ReportActions (share, download, delete, star) | 2 | F1.6 |
| F5.11 | Build Report Detail page (`/reports/[id]`) — two-column layout | 5 | F5.7–F5.10, F4.4 |
| F5.12 | Integrate report detail API + signed file URLs | 3 | F5.11, F1.11 |
| F5.13 | Build inline value edit modal (change extracted value) | 3 | F1.7 |
| F5.14 | Build Share page (`/reports/[id]/share`) — expiry, password, copy link | 4 | F1.6 |
| F5.15 | Integrate share API: create, list, revoke | 2 | F5.14, F1.11 |
| F5.16 | Build empty/error states for reports | 2 | F1.7 |
| | **Sprint 5 Total** | **~45 hours** | |

### Sprint 6: Analytics, Settings & Polish (Week 6)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F6.1 | Build Analytics placeholder page with "coming soon" cards | 3 | F1.6 |
| F6.2 | Build basic trend chart placeholder (static SVG or Chart.js) | 3 | F6.1 |
| F6.3 | Build Settings page — sections: profile, consent, data, account | 4 | F1.6 |
| F6.4 | Build profile edit section in settings | 2 | F3.11 |
| F6.5 | Build consent management section in settings | 2 | F1.6 |
| F6.6 | Build logout confirmation and flow | 1 | F2.1 |
| F6.7 | Build 404 Not Found page | 1 | F1.6 |
| F6.8 | Add page transitions / navigation loading bar | 2 | — |
| F6.9 | Add pull-to-refresh on mobile report list | 2 | — |
| F6.10 | Polish responsive design — test all pages at 375px, 768px, 1440px | 4 | All |
| F6.11 | Add keyboard navigation support to all interactive elements | 3 | All |
| F6.12 | Add `prefers-reduced-motion` media query for animations | 1 | — |
| F6.13 | Add `<title>` and meta descriptions for all pages (SEO/UX) | 1 | — |
| F6.14 | PWA setup — manifest.json, service worker, installable | 3 | — |
| F6.15 | Add favicon and app icons (192px, 512px) | 1 | — |
| | **Sprint 6 Total** | **~33 hours** | |

### Sprint 7: Testing & Deployment (Week 7)

| # | Task | Est. Hours | Dependencies |
|---|------|-----------|--------------|
| F7.1 | Set up Jest + React Testing Library | 2 | — |
| F7.2 | Write unit tests for UI components (Button, Input, Card, Modal) | 4 | F7.1 |
| F7.3 | Write unit tests for validators and formatters | 2 | F7.1 |
| F7.4 | Write integration tests for auth flow (login → OTP → dashboard) | 4 | F7.1 |
| F7.5 | Write integration tests for upload flow | 3 | F7.1 |
| F7.6 | Write integration tests for reports list + detail | 3 | F7.1 |
| F7.7 | Cross-browser testing: Chrome, Firefox, Safari, Edge | 4 | All |
| F7.8 | Mobile device testing: iOS Safari, Android Chrome | 3 | All |
| F7.9 | Accessibility audit with Lighthouse + axe-core | 3 | All |
| F7.10 | Performance audit — Lighthouse score ≥ 90 | 2 | All |
| F7.11 | Set up Vercel deployment (or Docker + Nginx) | 2 | — |
| F7.12 | Configure environment variables for staging/production | 1 | F7.11 |
| F7.13 | Set up CI/CD: lint + test on PR | 2 | F7.1, F7.11 |
| F7.14 | Final QA pass — test all 16 pages end-to-end | 4 | All |
| F7.15 | Create developer README | 2 | — |
| | **Sprint 7 Total** | **~41 hours** | |

### Total Estimate: ~278 hours (~7 weeks at 40 hrs/week)

---

## 22. Testing Checklist

### Unit Tests

**UI Components:**
- [ ] Button — renders all variants (primary, secondary, outline, ghost, danger)
- [ ] Button — shows loading spinner when `loading` prop is true
- [ ] Button — disabled state blocks clicks
- [ ] Input — displays label, error, helper text
- [ ] Input — shows red border on error
- [ ] Modal — opens/closes via `open` prop
- [ ] Modal — closes on Escape key
- [ ] Modal — traps focus inside
- [ ] Toast — renders correct icon per type
- [ ] Toast — auto-dismisses after duration
- [ ] Skeleton — renders correct number of lines
- [ ] EmptyState — renders title, description, action button
- [ ] Badge — applies correct color per variant
- [ ] Chip — toggles selected state on click
- [ ] FileIcon — shows correct icon for PDF, JPEG, PNG

**Utilities:**
- [ ] `validators.phone` — valid E.164 → null
- [ ] `validators.phone` — invalid format → error string
- [ ] `validators.otp` — 6 digits → null
- [ ] `validators.otp` — 5 digits → error string
- [ ] `validators.fileType` — PDF → null
- [ ] `validators.fileType` — .exe → error string
- [ ] `validators.fileSize` — 5 MB → null
- [ ] `validators.fileSize` — 25 MB → error string
- [ ] `formatDate` — ISO date → "18 Jun 2026"
- [ ] `formatFileSize` — 2456789 → "2.3 MB"
- [ ] `getErrorMessage` — AxiosError 404 → user-friendly string

### Integration Tests

**Auth Flow:**
- [ ] Login page → enter phone → navigate to OTP
- [ ] OTP page → enter code → navigate to dashboard (existing user)
- [ ] OTP page → enter code → navigate to consent (new user)
- [ ] Consent page → accept → navigate to profile setup
- [ ] Profile setup → submit → navigate to dashboard
- [ ] Protected page → no auth → redirect to login
- [ ] Token expired → auto-refresh → request succeeds
- [ ] Refresh token expired → redirect to login

**Report Upload:**
- [ ] Select file → validates type and size
- [ ] Invalid file type → shows error
- [ ] Select member → advances to preview
- [ ] Fill metadata → submit → upload progress → success modal
- [ ] Upload fails → shows error with retry

**Reports List:**
- [ ] Page loads → shows report cards
- [ ] Search → filters results in real-time (debounced)
- [ ] Type chip → filters by report type
- [ ] Empty results → shows empty state
- [ ] Pagination → navigates between pages
- [ ] Report card click → navigates to detail

**Report Detail:**
- [ ] Page loads → shows report info + values + file preview
- [ ] Edit value → opens modal → save → updates inline
- [ ] Share → opens share page
- [ ] Delete → confirmation dialog → deletes → redirects

### Manual QA Tests

- [ ] All 16 pages render without errors
- [ ] All forms submit correctly with valid data
- [ ] All forms show errors with invalid data
- [ ] All modals open and close correctly
- [ ] All toasts appear and auto-dismiss
- [ ] Navigation works: sidebar (desktop), bottom nav (mobile), back buttons
- [ ] File upload works for PDF, JPEG, PNG
- [ ] File upload shows progress bar
- [ ] Large file (15 MB) uploads without timeout
- [ ] Report list loads with 50+ reports (pagination working)
- [ ] Search returns results within 500ms
- [ ] Page transitions are smooth
- [ ] No layout shifts during loading
- [ ] Dark text readable on all backgrounds
- [ ] Touch targets minimum 48px on mobile
- [ ] Keyboard navigation reaches all interactive elements
- [ ] Screen reader reads page content correctly

### Cross-Browser Testing

| Browser | Version | Platform | Status |
|---------|---------|----------|--------|
| Chrome | Latest | Desktop + Android | [ ] |
| Firefox | Latest | Desktop | [ ] |
| Safari | Latest | macOS + iOS | [ ] |
| Edge | Latest | Desktop | [ ] |
| Samsung Internet | Latest | Android | [ ] |

---

## 23. Deployment Checklist

### Pre-Deployment

- [ ] All tests pass (`npm run test`)
- [ ] ESLint clean (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] No console.log statements in production code
- [ ] Environment variables documented in `.env.example`
- [ ] `NEXT_PUBLIC_API_URL` set for production
- [ ] All API endpoints tested against staging backend
- [ ] Responsive design verified at 375px, 768px, 1440px
- [ ] Lighthouse score ≥ 90 (performance, accessibility)
- [ ] No hardcoded API URLs, secrets, or test data
- [ ] Error boundaries wrap all pages
- [ ] 404 page configured
- [ ] Favicon and app icons included
- [ ] `<title>` and meta tags on all pages

### Vercel Deployment (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Value: https://api.medivault.app/v1

# 4. Deploy to preview
vercel

# 5. Deploy to production
vercel --prod
```

### Environment Variables (Production)

```env
NEXT_PUBLIC_API_URL=https://api.medivault.app/v1
NEXT_PUBLIC_APP_NAME=MediVault
NEXT_PUBLIC_APP_URL=https://medivault.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Docker Deployment (Alternative)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.medivault.app/v1
```

### Post-Deployment Verification

- [ ] Home page loads within 3 seconds
- [ ] Login flow works end-to-end
- [ ] File upload works (S3 presigned URL from production backend)
- [ ] Reports list loads with production data
- [ ] Report detail shows file preview with signed URLs
- [ ] Share link generates correctly
- [ ] Mobile layout renders correctly
- [ ] No CORS errors in browser console
- [ ] No mixed content warnings (all HTTPS)
- [ ] Error pages display correctly (404, 500)
- [ ] Analytics/monitoring tracking (if configured)

### Monitoring

- [ ] Vercel Analytics enabled (or alternative: Sentry for errors)
- [ ] Core Web Vitals tracking (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Error tracking — client-side errors reported
- [ ] API response time monitoring via browser dev tools

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --ci
      - run: npm run build
```
