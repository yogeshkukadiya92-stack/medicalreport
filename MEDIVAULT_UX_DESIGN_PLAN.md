# MediVault — Phase 1 Complete UI/UX Design Plan

> **Product Name Options:** MediVault / My Medical History / ReportSafe
> **Version:** Phase 1 — MVP
> **Date:** June 2026
> **Platforms:** Android App + Web App
> **Target:** Directly usable by UI/UX designers in Figma

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Complete User Journey](#2-complete-user-journey)
3. [Information Architecture & Sitemap](#3-information-architecture--sitemap)
4. [Screen-by-Screen List](#4-screen-by-screen-list)
5. [Navigation Structure](#5-navigation-structure)
6. [Wireframe Descriptions](#6-wireframe-descriptions)
7. [Upload Report Flow](#7-upload-report-flow)
8. [AI Extraction & Review Flow](#8-ai-extraction--review-flow)
9. [Dashboard Layout](#9-dashboard-layout)
10. [Analytics Dashboard Layout](#10-analytics-dashboard-layout)
11. [Family Member Management Flow](#11-family-member-management-flow)
12. [Doctor Sharing Flow](#12-doctor-sharing-flow)
13. [Reminder Flow](#13-reminder-flow)
14. [Emergency Card Flow](#14-emergency-card-flow)
15. [Settings & Privacy Flow](#15-settings--privacy-flow)
16. [Sample Microcopy](#16-sample-microcopy)
17. [UI States](#17-ui-states)
18. [Design System](#18-design-system)
19. [UI Component List](#19-ui-component-list)
20. [Accessibility Guidelines](#20-accessibility-guidelines)
21. [Figma File Structure](#21-figma-file-structure)

---

## 1. Design Philosophy

### Core Principles

| Principle | What It Means |
|-----------|---------------|
| **Trustworthy** | Medical data = high trust. Use calm colors, clear language, visible security indicators (lock icons, encryption badges). |
| **Simple First** | Senior citizens and non-tech users must feel comfortable. Every screen should have ONE clear primary action. |
| **Readable** | Minimum 16px body text on mobile. High contrast ratios. No decorative fonts. |
| **Minimal Clutter** | White space is a feature. Show only what's needed at each step. Progressive disclosure for advanced features. |
| **Encouraging** | Upload feels rewarding. Progress indicators. Positive language ("Your report is safely stored"). |

### Design Tone
- **Clean** — Lots of white space, flat design, no gradients
- **Medical but not clinical** — Warm, approachable, not cold hospital blue
- **Safe** — Visual cues that say "your data is protected"
- **Modern** — Rounded corners, soft shadows, smooth transitions

---

## 2. Complete User Journey

### First-Time User Journey (Onboarding)

```
App Open
  → Splash Screen (1.5s)
  → Onboarding Carousel (3 screens)
    → Screen 1: "Store all your medical reports in one place"
    → Screen 2: "AI reads your reports and tracks your health"
    → Screen 3: "Share reports with doctors instantly"
  → Login / Signup
    → Mobile OTP / Email / Google Login
  → OTP Verification
  → AI Consent Screen
    → "We use AI to read your reports. Your data is encrypted and never shared."
    → Accept / Learn More
  → Profile Setup
    → Name, Age, Gender, Blood Group, Known Conditions
  → Home Dashboard (empty state with upload prompt)
```

### Returning User Journey (Core Loop)

```
App Open
  → Home Dashboard
    → Quick Upload FAB button
    → OR tap recent report
    → OR view analytics
    → OR switch family member
  → Upload Report
    → Choose source (Camera / Gallery / PDF / Document)
    → Crop/adjust if image
    → AI processes report (loading screen with progress)
    → Review extracted data
    → Edit any wrong values
    → Tag report (type, lab name, doctor, date)
    → Save
  → View Reports
    → Filter by type, date, member
    → Tap report → Detail page
    → Compare two reports
  → Analytics
    → See trends for key parameters
    → Tap parameter → detailed graph
  → Share with Doctor
    → Select reports → Generate link / PDF → Share
```

### Engagement Loop

```
Upload Report → See Trends Improve → Get Reminder for Next Test → Upload Again
```

---

## 3. Information Architecture & Sitemap

### Level 0 — App Root
```
MediVault
├── Auth Module
├── Home (Dashboard)
├── Reports
├── Analytics
├── Family
└── Settings & More
```

### Level 1 — Sections

```
Auth Module
├── Splash Screen
├── Onboarding (3 screens)
├── Login / Signup
├── OTP Verification
├── AI Consent
└── Profile Setup

Home Dashboard
├── Health Summary Card
├── Quick Upload Button
├── Recent Reports (last 5)
├── Active Reminders
├── Parameter Alerts (out of range)
└── Family Member Switcher

Reports
├── All Reports (list/grid view)
├── Upload Flow (multi-step)
│   ├── Source Selection
│   ├── Preview & Crop
│   ├── AI Processing
│   ├── Review & Edit Extracted Data
│   └── Tag & Save
├── Report Detail
├── Timeline View
├── Search & Filter
└── Compare Reports

Analytics
├── Overview Dashboard
├── Parameter List
├── Individual Parameter Graph
│   ├── HbA1c
│   ├── Fasting Sugar
│   ├── Cholesterol (Total, HDL, LDL)
│   ├── Vitamin D
│   ├── Thyroid (TSH, T3, T4)
│   ├── Hemoglobin
│   ├── Blood Pressure
│   ├── BMI
│   └── Custom Parameters
└── Health Score

Family
├── Family Members List
├── Add Family Member
├── Member Profile
├── Switch Active Profile
└── Member Reports

Settings & More
├── Profile Settings
├── Share with Doctor
│   ├── Select Reports
│   ├── Generate Share Link
│   └── Share History
├── Emergency Health Card
├── Reminders
│   ├── Active Reminders
│   └── Add Reminder
├── Notifications
├── Privacy & Security
│   ├── Data Encryption Info
│   ├── Consent Management
│   └── Download My Data
├── Export Data
├── Language
├── Help & Support
├── About
└── Delete Account
```

---

## 4. Screen-by-Screen List

### Total Screens: 42

| # | Screen Name | Priority | Platform |
|---|------------|----------|----------|
| **Auth & Onboarding** | | | |
| 1 | Splash Screen | P0 | Both |
| 2 | Onboarding Screen 1 | P0 | Both |
| 3 | Onboarding Screen 2 | P0 | Both |
| 4 | Onboarding Screen 3 | P0 | Both |
| 5 | Login / Signup | P0 | Both |
| 6 | OTP Verification | P0 | Both |
| 7 | AI Consent Screen | P0 | Both |
| 8 | Profile Setup | P0 | Both |
| **Home** | | | |
| 9 | Home Dashboard | P0 | Both |
| 10 | Home Dashboard (Empty State) | P0 | Both |
| **Reports** | | | |
| 11 | Reports List (All Reports) | P0 | Both |
| 12 | Reports List (Empty State) | P0 | Both |
| 13 | Upload — Source Selection | P0 | Both |
| 14 | Upload — Camera Capture | P0 | Android |
| 15 | Upload — Preview & Crop | P0 | Both |
| 16 | Upload — AI Processing | P0 | Both |
| 17 | Upload — AI Review & Edit | P0 | Both |
| 18 | Upload — Tag & Save | P0 | Both |
| 19 | Upload — Success | P0 | Both |
| 20 | Report Detail | P0 | Both |
| 21 | Report — Original Document View | P0 | Both |
| 22 | Timeline View | P1 | Both |
| 23 | Compare Reports (Select) | P1 | Both |
| 24 | Compare Reports (Side by Side) | P1 | Both |
| 25 | Search & Filter | P0 | Both |
| **Analytics** | | | |
| 26 | Analytics Dashboard | P0 | Both |
| 27 | Analytics — Empty State | P0 | Both |
| 28 | Parameter Detail Graph | P0 | Both |
| 29 | Health Score | P1 | Both |
| **Family** | | | |
| 30 | Family Members List | P0 | Both |
| 31 | Add Family Member | P0 | Both |
| 32 | Family Member Profile | P0 | Both |
| **Sharing** | | | |
| 33 | Share — Select Reports | P0 | Both |
| 34 | Share — Generate Link | P0 | Both |
| 35 | Share — Doctor View (recipient page) | P0 | Web only |
| **Reminders** | | | |
| 36 | Reminders List | P1 | Both |
| 37 | Add / Edit Reminder | P1 | Both |
| **Emergency** | | | |
| 38 | Emergency Health Card | P1 | Both |
| 39 | Emergency Card — Full View | P1 | Both |
| **Settings** | | | |
| 40 | Settings Main | P0 | Both |
| 41 | Privacy & Security | P0 | Both |
| 42 | Export / Delete Account | P0 | Both |

---

## 5. Navigation Structure

### Android App — Bottom Navigation (5 tabs)

```
┌──────────────────────────────────────────────────────┐
│  🏠 Home    📄 Reports    [+]    📊 Analytics    ≡ More │
└──────────────────────────────────────────────────────┘
```

| Tab | Icon | Label | Destination |
|-----|------|-------|-------------|
| 1 | Home icon | Home | Dashboard |
| 2 | Document icon | Reports | Reports List |
| 3 | Plus icon (FAB, elevated) | Upload | Upload Source Selection (bottom sheet) |
| 4 | Chart icon | Analytics | Analytics Dashboard |
| 5 | Menu/hamburger | More | Settings, Family, Share, Emergency, Reminders |

**Notes:**
- The center Upload button is a **Floating Action Button (FAB)** — larger, teal colored, elevated above the nav bar
- Active tab: filled icon + teal color + label
- Inactive tab: outline icon + gray + label
- Family member switcher is in the **top app bar** as an avatar pill (tap to switch)

### Web App — Left Sidebar Navigation

```
┌─────────────────────┬───────────────────────────────────┐
│  MediVault Logo     │                                   │
│                     │                                   │
│  👤 Yogesh ▾        │         Main Content Area         │
│  (profile switcher) │                                   │
│                     │                                   │
│  ─────────────────  │                                   │
│  🏠 Dashboard       │                                   │
│  📄 Reports         │                                   │
│  📊 Analytics       │                                   │
│  👥 Family          │                                   │
│  📤 Share           │                                   │
│  ⏰ Reminders       │                                   │
│  🆔 Emergency Card  │                                   │
│                     │                                   │
│  ─────────────────  │                                   │
│  ⚙️ Settings        │                                   │
│  ❓ Help            │                                   │
│                     │                                   │
│  [+ Upload Report]  │                                   │
│  (sticky bottom)    │                                   │
└─────────────────────┴───────────────────────────────────┘
```

**Notes:**
- Sidebar width: 260px (collapsible to 72px icon-only on smaller screens)
- Upload button is sticky at the bottom of the sidebar — always visible
- Profile switcher dropdown at the top shows family members
- Active item: teal background pill, bold text
- Sidebar collapses to hamburger on tablet breakpoint (<1024px)

---

## 6. Wireframe Descriptions

### Screen 1-4: Onboarding Carousel

**Layout (Mobile):**
- Full-screen illustration (top 55%)
- Title text (24px, bold, center)
- Subtitle text (16px, gray, center, max 2 lines)
- Pagination dots (3 dots)
- "Next" button (bottom, full width)
- "Skip" text link (top right)
- On last screen: "Get Started" button replaces "Next"

**Illustrations:**
- Screen 1: Person uploading a document into a phone
- Screen 2: AI sparkle icon reading a document with data points floating out
- Screen 3: Two people sharing a document (doctor + patient)

---

### Screen 5: Login / Signup

**Layout:**
- MediVault logo + tagline at top
- Tab toggle: "Login" | "Sign Up"
- **Login tab:**
  - Phone number input with country code (+91)
  - "Send OTP" primary button
  - Divider: "or continue with"
  - Google Sign-In button (outline style)
  - Email login link
- **Sign Up tab:**
  - Phone number input
  - "Send OTP" button
  - Google Sign-Up button
  - Terms & Privacy checkbox
- Bottom: "By continuing, you agree to our Terms of Service and Privacy Policy"

---

### Screen 7: AI Consent Screen

**Layout:**
- Shield icon at top (large, teal)
- Title: "How We Use AI to Help You"
- 3 info cards stacked vertically:
  - Card 1: 🔍 "AI reads your reports to extract medical data like blood sugar, cholesterol, and other values"
  - Card 2: 🔒 "Your data is encrypted and stored securely. We never share it with anyone."
  - Card 3: ✏️ "You can always review and edit what AI extracts before saving"
- "I Understand & Continue" primary button
- "Learn More About Our Privacy" text link
- Small text: "You can change these preferences anytime in Settings"

---

### Screen 8: Profile Setup

**Layout:**
- Progress indicator (Step 1 of 1)
- Title: "Tell us about yourself"
- Form fields:
  - Profile photo (optional, circular upload area)
  - Full Name* (text input)
  - Date of Birth* (date picker)
  - Gender* (chip selector: Male / Female / Other)
  - Blood Group (dropdown: A+, A-, B+, B-, O+, O-, AB+, AB-)
  - Known Conditions (multi-select chips: Diabetes, Hypertension, Thyroid, Heart Disease, None, Other)
  - Height (number + unit toggle cm/ft)
  - Weight (number + unit toggle kg/lbs)
- "Save & Continue" primary button
- "Skip for now" text link

---

### Screen 9: Home Dashboard

**Layout (Mobile):**

```
┌─────────────────────────────┐
│ 👤 Yogesh ▾    🔔    ⚙️     │  ← Top bar with profile switcher
│                             │
│ ┌─────────────────────────┐ │
│ │  Good Morning, Yogesh   │ │  ← Greeting
│ │  Your health summary    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ HEALTH SNAPSHOT         │ │  ← Card: Key parameters at a glance
│ │ ┌─────┐ ┌─────┐ ┌─────┐│ │
│ │ │Sugar│ │BP   │ │HbA1c││ │     (2x3 grid of mini cards)
│ │ │110  │ │120/80│ │6.2 ││ │     Color: green=normal, amber=warning, red=high
│ │ └─────┘ └─────┘ └─────┘│ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐│ │
│ │ │Chol │ │VitD │ │TSH  ││ │
│ │ │195  │ │28   │ │3.5  ││ │
│ │ └─────┘ └─────┘ └─────┘│ │
│ └─────────────────────────┘ │
│                             │
│ RECENT REPORTS              │  ← Section header + "See All"
│ ┌─────────────────────────┐ │
│ │ 📄 Blood Test Report    │ │  ← Horizontal scrollable cards
│ │    City Lab · 15 Jun    │ │
│ └─────────────────────────┘ │
│                             │
│ UPCOMING                    │
│ ┌─────────────────────────┐ │
│ │ ⏰ HbA1c Test Due       │ │  ← Reminder card
│ │    Scheduled: 25 Jun    │ │
│ └─────────────────────────┘ │
│                             │
│           [+]               │  ← FAB for upload
│ ┌─────────────────────────┐ │
│ │ 🏠  📄  [+]  📊  ≡     │ │  ← Bottom nav
│ └─────────────────────────┘ │
```

**Layout (Web):**
- Left sidebar + main content area
- Main area splits into 2 columns on desktop:
  - Left (60%): Health Snapshot cards, Recent Reports list
  - Right (40%): Upcoming Reminders, Quick Actions, Parameter Alerts

---

### Screen 11: Reports List

**Layout:**
- Search bar at top
- Filter chips row: All, Blood Test, Prescription, X-Ray, Scan, Other
- Sort dropdown: Newest First, Oldest First
- Toggle: List View / Grid View
- Report cards in list:
  ```
  ┌─────────────────────────────┐
  │ 📄  Blood Test Report       │
  │     City Lab · Dr. Patel    │
  │     15 Jun 2026             │
  │     Sugar: 110 · HbA1c: 6.2│  ← Key extracted values preview
  │                    [→]      │
  └─────────────────────────────┘
  ```
- Each card shows: report type icon, title, lab name, date, 2-3 key values
- Long press / right-click → context menu: View, Share, Compare, Delete

---

### Screen 20: Report Detail

**Layout:**
```
┌─────────────────────────────┐
│  ←  Blood Test Report  ⋮   │  ← Top bar with back + menu
│                             │
│  ┌───────────────────────┐  │
│  │  📄 View Original     │  │  ← Tap to see uploaded PDF/image
│  │  [Thumbnail preview]  │  │
│  └───────────────────────┘  │
│                             │
│  REPORT INFO                │
│  Date: 15 Jun 2026          │
│  Lab: City Diagnostics      │
│  Doctor: Dr. Patel          │
│  Type: Complete Blood Count │
│                             │
│  EXTRACTED VALUES           │
│  ┌───────────────────────┐  │
│  │ Hemoglobin    14.2    │  │  ← Green = normal range
│  │ Normal: 13-17 g/dL    │  │
│  ├───────────────────────┤  │
│  │ Fasting Sugar  142 ⚠️ │  │  ← Amber = borderline
│  │ Normal: 70-110 mg/dL  │  │
│  ├───────────────────────┤  │
│  │ HbA1c          7.1 🔴 │  │  ← Red = out of range
│  │ Normal: <5.7 %        │  │
│  └───────────────────────┘  │
│                             │
│  [📤 Share]  [📊 Compare]  │  ← Action buttons
│                             │
└─────────────────────────────┘
```

**Value color coding:**
- Green (#10B981): Within normal range
- Amber (#F59E0B): Borderline / slightly off
- Red (#EF4444): Out of normal range
- Each value shows: parameter name, value, unit, normal range reference

---

## 7. Upload Report Flow

### Flow Diagram

```
User taps [+] Upload
    │
    ▼
Source Selection (Bottom Sheet on Mobile / Modal on Web)
    ├── 📸 Camera (Android only — opens camera)
    ├── 🖼️ Gallery (opens photo picker)
    ├── 📄 PDF (opens file picker, .pdf only)
    └── 📎 Document (opens file picker, .jpg/.png/.pdf)
    │
    ▼
Preview & Crop Screen
    │ User can:
    │ - Rotate image
    │ - Crop to document edges
    │ - Add another page (multi-page support)
    │ - Retake / Re-select
    │
    ▼
AI Processing Screen (see Section 8)
    │
    ▼
Review & Edit Screen (see Section 8)
    │
    ▼
Tag & Save Screen
    │ User confirms/edits:
    │ - Report Type (auto-detected, editable dropdown)
    │ - Report Date (auto-detected, editable date picker)
    │ - Lab / Hospital Name (auto-detected, editable text)
    │ - Doctor Name (optional text)
    │ - Family Member (dropdown, defaults to active profile)
    │ - Notes (optional text area)
    │
    ▼
Success Screen
    │ "Your report is safely stored! ✓"
    │ [View Report] [Upload Another] [Go Home]
```

### Upload Source Selection — Bottom Sheet (Mobile)

```
┌─────────────────────────────┐
│         Upload Report       │
│                             │
│  ┌───────┐  ┌───────┐      │
│  │  📸   │  │  🖼️   │      │
│  │Camera │  │Gallery│      │
│  └───────┘  └───────┘      │
│  ┌───────┐  ┌───────┐      │
│  │  📄   │  │  📎   │      │
│  │ PDF   │  │ File  │      │
│  └───────┘  └───────┘      │
│                             │
│  Supported: JPG, PNG, PDF   │
│  Max size: 20 MB per file   │
│                             │
└─────────────────────────────┘
```

---

## 8. AI Extraction & Review Flow

### AI Processing Screen

**Layout:**
```
┌─────────────────────────────┐
│                             │
│         [Document icon      │
│          with sparkle       │
│          animation]         │
│                             │
│    "Reading your report..." │
│                             │
│    ████████░░░░  65%        │  ← Progress bar
│                             │
│    ✓ Document scanned       │  ← Step-by-step progress
│    ✓ Text extracted         │
│    ● Finding medical values │
│    ○ Organizing data        │
│                             │
│    This usually takes       │
│    10-20 seconds            │
│                             │
└─────────────────────────────┘
```

**Behavior:**
- Show animated document icon with sparkle/pulse effect
- Real progress bar (not fake — tied to actual API response stages if possible)
- Step-by-step checklist shows progress
- If processing takes >30s, show: "Taking a bit longer than usual. Please wait..."
- On failure: "We couldn't read this report. Try uploading a clearer image." + [Retry] [Upload Different]

### AI Review & Edit Screen

**Layout:**
```
┌─────────────────────────────┐
│  ←  Review Extracted Data   │
│                             │
│  ┌───────────────────────┐  │
│  │ AI extracted these     │  │
│  │ values from your       │  │
│  │ report. Please check   │  │
│  │ and correct if needed. │  │
│  └───────────────────────┘  │
│                             │
│  Detected: Blood Test Report│
│                             │
│  EXTRACTED VALUES           │
│  ┌───────────────────────┐  │
│  │ Hemoglobin             │  │
│  │ [14.2]  g/dL     [✎]  │  │  ← Tap edit icon to modify value
│  ├───────────────────────┤  │
│  │ Fasting Sugar          │  │
│  │ [142]   mg/dL    [✎]  │  │
│  ├───────────────────────┤  │
│  │ HbA1c                  │  │
│  │ [7.1]   %        [✎]  │  │
│  ├───────────────────────┤  │
│  │ Total Cholesterol      │  │
│  │ [195]   mg/dL    [✎]  │  │
│  └───────────────────────┘  │
│                             │
│  + Add Missing Value        │  ← If AI missed something
│                             │
│  ┌───────────────────────┐  │
│  │ 📄 View Original      │  │  ← Side-by-side reference
│  └───────────────────────┘  │
│                             │
│  [Looks Good — Continue →]  │
│                             │
└─────────────────────────────┘
```

**Editing behavior:**
- Tap edit icon → inline editing (field becomes editable input)
- Changed values show a yellow "edited" badge
- "Add Missing Value" opens a form: Parameter Name + Value + Unit
- "View Original" opens the uploaded document in a bottom sheet / side panel for reference
- On web: split-screen layout — original document on left, extracted values on right

---

## 9. Dashboard Layout

### Mobile Dashboard

```
┌─────────────────────────────────┐
│ Top App Bar                     │
│  [Avatar] Yogesh ▾  🔔 Notif    │
├─────────────────────────────────┤
│                                 │
│ "Good morning, Yogesh"          │
│ "2 reports this month"          │
│                                 │
│ ┌─ Health Snapshot ───────────┐ │
│ │ 2x3 grid of parameter cards │ │
│ │ Each card:                  │ │
│ │   Parameter name            │ │
│ │   Latest value              │ │
│ │   Status color (G/A/R)      │ │
│ │   Mini trend arrow ↑↓→      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Recent Reports ────────────┐ │
│ │ Horizontal scroll cards     │ │
│ │ Each: type icon, title,     │ │
│ │ date, lab name              │ │
│ │ "See all →"                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Upcoming ──────────────────┐ │
│ │ Next test reminders         │ │
│ │ Doctor appointments         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Quick Tip ─────────────────┐ │
│ │ Health tip card (optional)  │ │
│ └─────────────────────────────┘ │
│                                 │
│         [+] FAB                 │
│ ┌─────────────────────────────┐ │
│ │ Bottom Navigation           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Web Dashboard

```
┌──────────┬──────────────────────────────────────────┐
│          │  Dashboard                     🔔  👤    │
│ Sidebar  │                                          │
│          │  ┌─ Health Snapshot ─────────────────┐   │
│          │  │ 3x2 grid of parameter cards       │   │
│          │  │ Larger cards than mobile           │   │
│          │  │ Each has mini sparkline graph      │   │
│          │  └───────────────────────────────────┘   │
│          │                                          │
│          │  ┌─ Recent Reports ──┐ ┌─ Upcoming ──┐  │
│          │  │ List view         │ │ Reminders   │  │
│          │  │ 5 recent reports  │ │ Appointments│  │
│          │  │                   │ │             │  │
│          │  │ "See all"         │ │ "Add new"   │  │
│          │  └───────────────────┘ └─────────────┘  │
│          │                                          │
│ [Upload] │  ┌─ Parameter Alerts ───────────────┐   │
│          │  │ "Your sugar is above normal range"│   │
│          │  │ "Vitamin D is low — consult doctor"│  │
│          │  └───────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────┘
```

---

## 10. Analytics Dashboard Layout

### Mobile Analytics

```
┌─────────────────────────────────┐
│ ← Analytics                     │
│                                 │
│ TIME RANGE: [3M] [6M] [1Y] [All]│  ← Chip selector
│                                 │
│ ┌─ Health Score ──────────────┐ │
│ │      ┌─────┐               │ │
│ │      │ 72  │  Good         │ │  ← Circular gauge
│ │      └─────┘               │ │
│ │  Based on 12 reports       │ │
│ └─────────────────────────────┘ │
│                                 │
│ KEY PARAMETERS                  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ HbA1c                   ↗  │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │   Line graph with       │ │ │  ← Mini trend graph
│ │ │   normal range band     │ │ │     Green shaded area = normal range
│ │ │   shown in green        │ │ │     Dots = your values
│ │ └─────────────────────────┘ │ │
│ │ Latest: 7.1% · Trend: ↑   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Fasting Sugar            ↗  │ │
│ │ [Mini graph]                │ │
│ │ Latest: 142 mg/dL · ↑      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Blood Pressure           ↗  │ │
│ │ [Mini graph - dual line]    │ │
│ │ Latest: 130/85 · ↑         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [+ Track New Parameter]        │
│                                 │
└─────────────────────────────────┘
```

### Parameter Detail Graph Screen (Tap on any parameter)

```
┌─────────────────────────────────┐
│ ← HbA1c Trend                  │
│                                 │
│ Current: 7.1%    Status: High  │
│ Normal Range: < 5.7%           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │    Full-size line graph     │ │  ← Interactive: tap dots for value
│ │    with data points         │ │     Pinch to zoom on mobile
│ │    Normal range shown       │ │     Green band = normal range
│ │    as green horizontal band │ │
│ │                             │ │
│ │  Jan  Mar  May  Jul  Sep    │ │
│ └─────────────────────────────┘ │
│                                 │
│ TIME: [3M] [6M] [1Y] [All]     │
│                                 │
│ HISTORY                         │
│ ┌─────────────────────────────┐ │
│ │ 15 Jun 2026    7.1%    🔴  │ │
│ │ 12 Mar 2026    6.8%    🟡  │ │
│ │ 10 Dec 2025    6.2%    🟢  │ │
│ │ 08 Sep 2025    5.9%    🟢  │ │
│ └─────────────────────────────┘ │
│                                 │
│ INSIGHT                         │
│ "Your HbA1c has increased by   │
│  0.9% over the last 9 months.  │
│  Consider consulting your      │
│  doctor."                       │
│                                 │
└─────────────────────────────────┘
```

### Web Analytics (wider layout)

- 3-column grid of parameter cards with inline graphs
- Click a card → expands to full graph on the right panel
- Time range selector applies globally
- Comparison mode: overlay two parameters on one graph

---

## 11. Family Member Management Flow

### Flow

```
Settings/More → Family Members
    │
    ├── View all family members (card list)
    │   Each card: avatar, name, age, relation, report count
    │
    ├── [+ Add Family Member]
    │   │
    │   ▼
    │   Add Member Form:
    │   - Name*
    │   - Relation* (dropdown: Spouse, Parent, Child, Sibling, Other)
    │   - Date of Birth*
    │   - Gender
    │   - Blood Group
    │   - Known Conditions
    │   - Profile Photo (optional)
    │   │
    │   ▼
    │   Member Added Successfully
    │
    └── Tap member card → Member Profile
        - View/edit profile info
        - View their reports
        - View their analytics
        - Delete member (with confirmation)
```

### Profile Switcher (Top Bar)

```
┌─────────────────────────────┐
│  [👤] Yogesh ▾              │
│  ┌─────────────────────────┐│
│  │ ✓ Yogesh (You)          ││  ← Active profile highlighted
│  │   Maa (Mother)          ││
│  │   Papa (Father)         ││
│  │   Priya (Wife)          ││
│  │   ──────────────        ││
│  │   + Add Member          ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Behavior:**
- Switching profile changes ALL data: dashboard, reports, analytics
- Active profile shown with check mark
- Profile avatar color differs per member for quick visual recognition

---

## 12. Doctor Sharing Flow

### Flow

```
Report Detail → Share button
    OR
More → Share with Doctor
    │
    ▼
Select Reports to Share
    │ - Checklist of reports with date/type
    │ - Multi-select with "Select All" option
    │ - Filter by type, date range
    │
    ▼
Share Options Screen
    │ - Recipient: Doctor name (optional text)
    │ - Include: ☑ Reports ☑ Analytics ☑ Medical History
    │ - Link expiry: 24 hours / 7 days / 30 days / Custom
    │ - Password protect: Toggle + password field
    │
    ▼
Generate Secure Link
    │ - Link generated with expiry info
    │ - [Copy Link] [Share via WhatsApp] [Share via Email] [Share via SMS]
    │
    ▼
Link Shared Confirmation
    │ - "Reports shared securely"
    │ - Link expiry reminder
    │ - View in Share History
```

### Doctor View (Web — recipient page)

```
┌─────────────────────────────────┐
│  MediVault — Shared Reports     │
│                                 │
│  Shared by: Yogesh Kumar        │
│  Expires: 22 Jun 2026           │
│                                 │
│  ┌─ Reports ──────────────────┐ │
│  │ 📄 Blood Test — 15 Jun     │ │
│  │ 📄 Thyroid Panel — 10 Jun  │ │
│  │ 📄 Lipid Profile — 10 Jun  │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Key Parameters ──────────┐  │
│  │ Summary table of values   │  │
│  └───────────────────────────┘  │
│                                 │
│  [Download All as PDF]          │
│                                 │
│  Powered by MediVault           │
└─────────────────────────────────┘
```

---

## 13. Reminder Flow

### Flow

```
Dashboard → Reminder Card → Tap
    OR
More → Reminders
    │
    ▼
Reminders List
    │ Active reminders sorted by date
    │ Past reminders (collapsed)
    │
    ├── [+ Add Reminder]
    │   Form:
    │   - Title* ("HbA1c Test", "Doctor Visit", custom text)
    │   - Suggested: based on past test frequency
    │   - Date & Time*
    │   - Repeat: None / Monthly / Quarterly / Yearly
    │   - Notify: On the day / 1 day before / 3 days before
    │   - For: (Family member dropdown)
    │   - Notes (optional)
    │
    └── Tap existing → Edit / Mark Done / Delete
```

### Reminder Card (Dashboard)

```
┌─────────────────────────────┐
│ ⏰  HbA1c Test Due          │
│    📅 25 Jun 2026 · In 4 days │
│    For: Yogesh               │
│    [Mark Done] [Snooze]      │
└─────────────────────────────┘
```

---

## 14. Emergency Card Flow

### Emergency Health Card Screen

```
┌─────────────────────────────────┐
│ ← Emergency Health Card         │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ┌──┐                  │    │
│  │  │👤│  YOGESH KUMAR    │    │
│  │  └──┘  Age: 32         │    │
│  │        Blood: O+       │    │
│  │                        │    │
│  │  CONDITIONS             │    │
│  │  • Type 2 Diabetes     │    │
│  │  • Hypertension        │    │
│  │                        │    │
│  │  ALLERGIES              │    │
│  │  • Penicillin          │    │
│  │                        │    │
│  │  MEDICATIONS            │    │
│  │  • Metformin 500mg     │    │
│  │  • Amlodipine 5mg     │    │
│  │                        │    │
│  │  EMERGENCY CONTACT      │    │
│  │  Priya: +91 98765 43210│    │
│  │                        │    │
│  │  ┌──────────────────┐  │    │
│  │  │    [QR Code]     │  │    │  ← Links to read-only emergency view
│  │  └──────────────────┘  │    │
│  └─────────────────────────┘    │
│                                 │
│  [Edit Card]  [Share]  [Print]  │
│                                 │
│  ℹ️ This card can be shown to    │
│  emergency responders without   │
│  unlocking the full app.        │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- Can be set as lock screen widget (Android)
- QR code links to a web page with emergency info (no login needed)
- Editable: conditions, allergies, medications, emergency contacts
- Printable as PDF
- Accessible from lock screen (optional setting)

---

## 15. Settings & Privacy Flow

### Settings Main Screen

```
ACCOUNT
├── Edit Profile
├── Family Members
├── Notification Preferences
│
REPORTS & DATA
├── Default Report View (List / Grid)
├── Preferred Units (mg/dL / mmol/L)
├── Export All Data (as PDF / ZIP)
├── Import Reports
│
SHARING & PRIVACY
├── Share History
├── AI Processing Consent
├── Data Encryption Details
├── Third-party Access (none in Phase 1)
│
APP
├── Language (English, Hindi, Gujarati, etc.)
├── Theme (Light / Dark / System)
├── Text Size (Normal / Large / Extra Large)
│
SUPPORT
├── Help & FAQs
├── Contact Support
├── Rate the App
├── About MediVault
│
DANGER ZONE
├── Download My Data
└── Delete My Account
    └── Confirmation: "This will permanently delete all your data..."
    └── Re-enter password/OTP to confirm
```

---

## 16. Sample Microcopy

### Consent Screen
```
Title: "How We Use AI to Help You"

Body: "When you upload a report, our AI reads it to find important
medical values like blood sugar, cholesterol, and more.

This helps you track your health easily without typing anything manually.

🔒 Your data is encrypted and stored securely on our servers.
We never share your medical data with anyone.
You are always in control.

You can review everything AI extracts and correct any mistakes
before saving."

Button: "I Understand & Continue"
Link: "Read our full Privacy Policy"
Footer: "You can change these settings anytime."
```

### Upload Screen
```
Title: "Upload a Medical Report"
Subtitle: "Take a photo or select a file"

Camera option: "Take a Photo"
Camera hint: "Place the report on a flat surface with good lighting"

Gallery option: "Choose from Gallery"
PDF option: "Select PDF File"
File option: "Choose Document"

File size note: "Supported: JPG, PNG, PDF · Max size: 20 MB"
Multi-page hint: "Got multiple pages? You can add more after the first."
```

### AI Processing Screen
```
Title: "Reading your report..."

Steps:
✓ "Document uploaded"
✓ "Text extracted successfully"
● "Finding medical values..."
○ "Organizing your data"

Wait message: "This usually takes 10-20 seconds"
Long wait: "Taking a bit longer than usual. Almost there..."
```

### Review Screen
```
Title: "Review Extracted Data"

Instruction: "We found these values in your report.
Please check them and tap the edit icon to correct
any mistakes before saving."

Edit hint: "Tap ✎ to edit a value"
Add button: "+ Add a value we missed"
Original link: "📄 View original report"

Confidence note (optional): "Values marked with ⚠️ might need
your attention — we weren't fully sure about them."

Button: "Looks Good — Save Report"
```

### Report Saved Screen
```
Title: "Report Saved Successfully! ✓"

Body: "Your blood test report from City Diagnostics
has been safely stored and organized."

Buttons:
[View Report] (primary)
[Upload Another] (secondary outline)
[Go to Dashboard] (text link)

Tip: "💡 Tip: Upload reports regularly to track
your health trends over time."
```

### Doctor Sharing Screen
```
Title: "Share Reports with Doctor"

Instruction: "Select the reports you'd like to share.
A secure link will be created that expires automatically."

Expiry label: "Link expires after:"
Options: "24 hours · 7 days · 30 days"

Password toggle label: "Protect with password"
Password hint: "Anyone with the link will need this password to view"

Generate button: "Create Secure Link"

Success: "Secure link created! ✓"
Success body: "Share this link with your doctor.
It will expire on 28 Jun 2026."

Share options: [Copy Link] [WhatsApp] [Email] [SMS]

Footer: "Your original reports stay safe with you.
Doctors only see what you choose to share."
```

---

## 17. UI States

### Empty States

| Screen | Empty State Message | Illustration | CTA |
|--------|-------------------|--------------|-----|
| Dashboard | "Welcome! Upload your first medical report to get started." | Illustration of document + phone | [Upload Report] |
| Reports List | "No reports yet. Upload a report to see it here." | Empty folder illustration | [Upload Report] |
| Analytics | "Upload at least 2 reports with the same test to see trends." | Graph with dotted placeholder lines | [Upload Report] |
| Family | "Add your family members to store their reports too." | Family illustration | [Add Member] |
| Reminders | "No reminders set. Stay on top of your health checkups." | Calendar illustration | [Add Reminder] |
| Share History | "You haven't shared any reports yet." | Share icon illustration | [Share Reports] |
| Search Results | "No reports found for '[query]'. Try different keywords." | Magnifying glass illustration | [Clear Search] |

### Error States

| Error Type | Message | Action |
|-----------|---------|--------|
| Upload Failed | "Upload failed. Please check your internet connection and try again." | [Retry] |
| AI Processing Failed | "We couldn't read this report. The image might be unclear." | [Retry] [Upload Different File] |
| AI Low Confidence | "Some values might not be accurate. Please review carefully." | Yellow banner on review screen |
| Network Error | "No internet connection. Your data is saved locally and will sync when you're back online." | Auto-retry indicator |
| File Too Large | "This file is too large (over 20 MB). Try compressing or splitting it." | [Choose Different File] |
| Unsupported Format | "This file format is not supported. Please upload a JPG, PNG, or PDF." | [Choose Different File] |
| Session Expired | "Your session has expired. Please login again." | [Login] |
| Server Error | "Something went wrong on our end. Please try again in a few minutes." | [Retry] |

### Loading States

| Screen | Loading Type | Details |
|--------|-------------|---------|
| Dashboard | Skeleton screens | Gray placeholder cards mimicking layout |
| Reports List | Skeleton cards | 3-4 skeleton report cards |
| Analytics | Skeleton graphs | Gray placeholder for charts |
| Report Detail | Shimmer effect | Content area shimmer |
| AI Processing | Custom animation | Animated progress (see Section 8) |
| Image Upload | Progress bar | Percentage upload progress |
| Share Link | Spinner | "Generating secure link..." |

### Success States

| Action | Success Feedback | Duration |
|--------|-----------------|----------|
| Report Uploaded | Full success screen with animation | Until user navigates |
| Report Saved | Green snackbar: "Report saved ✓" | 3 seconds |
| Profile Updated | Green snackbar: "Profile updated ✓" | 3 seconds |
| Member Added | Green snackbar: "Family member added ✓" | 3 seconds |
| Link Shared | Success card with share options | Until user navigates |
| Reminder Set | Green snackbar: "Reminder set for 25 Jun ✓" | 3 seconds |
| Data Exported | "Your data has been downloaded ✓" | 3 seconds |

---

## 18. Design System

### Color Palette

#### Primary Colors
```
Teal-600     #0D9488  — Primary brand, buttons, active states, links
Teal-700     #0F766E  — Primary hover/pressed state
Teal-50      #F0FDFA  — Light teal backgrounds, selected states
```

#### Secondary / Accent
```
Cyan-600     #0891B2  — Secondary actions, analytics accents
Indigo-500   #6366F1  — Charts, graph lines
```

#### Semantic Colors
```
Green-500    #10B981  — Normal range, success, healthy
Amber-500    #F59E0B  — Borderline, warning, attention needed
Red-500      #EF4444  — Out of range, error, danger
Blue-500     #3B82F6  — Informational
```

#### Neutrals
```
Gray-900     #111827  — Primary text
Gray-700     #374151  — Secondary text
Gray-500     #6B7280  — Placeholder, helper text
Gray-300     #D1D5DB  — Borders, dividers
Gray-100     #F3F4F6  — Card backgrounds
Gray-50      #F9FAFB  — Page background
White        #FFFFFF  — Card surfaces
```

#### Dark Mode
```
Background   #0F172A  — Page background
Surface      #1E293B  — Card surfaces
Surface-2    #334155  — Elevated surfaces
Border       #475569  — Borders
Text-primary #F1F5F9  — Primary text
Text-secondary #94A3B8 — Secondary text
```

#### Why Teal?
- Teal is the most trusted color in healthcare after blue
- It's calming without being cold (unlike pure blue)
- High contrast with both white and dark backgrounds
- Distinct from red/green semantic colors (important for health data)

### Typography

#### Font Stack
```
Primary:    Inter (Google Fonts — free, excellent readability)
Fallback:   -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace:  'JetBrains Mono' (for medical values/numbers)
```

#### Scale

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| H1 | 28px / 1.75rem | Bold (700) | 36px | Page titles |
| H2 | 22px / 1.375rem | Semi-bold (600) | 28px | Section headers |
| H3 | 18px / 1.125rem | Semi-bold (600) | 24px | Card titles |
| Body-L | 16px / 1rem | Regular (400) | 24px | Primary body text |
| Body-M | 14px / 0.875rem | Regular (400) | 20px | Secondary text, descriptions |
| Body-S | 12px / 0.75rem | Regular (400) | 16px | Captions, timestamps, helper text |
| Label | 14px / 0.875rem | Medium (500) | 20px | Button text, form labels |
| Value | 20px / 1.25rem | Bold (700) | 28px | Medical values (monospace) |
| Value-L | 32px / 2rem | Bold (700) | 40px | Dashboard big numbers |

**Accessibility note:** Body text should NEVER go below 14px. For senior citizen mode / accessibility settings, offer "Large Text" option that scales body to 18px and headings proportionally.

### Spacing Scale

```
4px   — xs (tight inline spacing)
8px   — sm (between related elements)
12px  — md (within cards)
16px  — lg (between sections, card padding)
24px  — xl (major section gaps)
32px  — 2xl (page-level spacing)
48px  — 3xl (major page sections)
```

### Border Radius

```
4px  — Small elements (chips, badges)
8px  — Cards, buttons, inputs
12px — Large cards, modals
16px — Bottom sheets
Full — Avatars, circular buttons
```

### Shadows

```
Shadow-sm:  0 1px 2px rgba(0,0,0,0.05)     — Cards at rest
Shadow-md:  0 4px 6px rgba(0,0,0,0.07)     — Elevated cards, dropdowns
Shadow-lg:  0 10px 15px rgba(0,0,0,0.10)   — Modals, bottom sheets
Shadow-xl:  0 20px 25px rgba(0,0,0,0.10)   — FAB
```

---

## 19. UI Component List

### Atoms (Basic Elements)
- Button (Primary / Secondary / Text / Icon / FAB)
- Text Input (with label, helper, error state)
- Dropdown / Select
- Chip (selectable, filter, status)
- Badge (notification dot, count)
- Avatar (image / initials / icon)
- Icon (outlined style, 24px default)
- Divider (horizontal / vertical)
- Toggle switch
- Checkbox
- Radio button
- Progress bar (linear / circular)
- Skeleton loader
- Snackbar / Toast

### Molecules (Compound Elements)
- Search Bar (icon + input + clear button)
- Filter Chip Row (horizontal scroll)
- Parameter Card (value + label + status color + trend arrow)
- Report Card (icon + title + date + lab + key values)
- Reminder Card (icon + title + date + countdown + actions)
- Family Member Card (avatar + name + relation + report count)
- Empty State Card (illustration + message + CTA)
- Error Banner (icon + message + action)
- Form Field Group (label + input + helper/error)
- Date Picker
- Consent Card (icon + title + description)
- Value Row (parameter name + value + unit + edit icon + status)

### Organisms (Screen Sections)
- Top App Bar (avatar + title + actions)
- Bottom Navigation Bar (5 tabs)
- Sidebar Navigation (web)
- Health Snapshot Grid (2x3 parameter cards)
- Reports List (filtered + sorted list of report cards)
- Analytics Graph Card (parameter name + mini graph + latest value)
- Upload Source Selector (bottom sheet with 4 options)
- AI Review Values List (editable value rows)
- Emergency Health Card (formatted card with QR)
- Share Options Panel (select reports + link options)
- Profile Switcher Dropdown
- Onboarding Slide (illustration + title + subtitle)

### Templates (Page Layouts)
- Dashboard Template (greeting + snapshot + recent + reminders)
- List Template (search + filter + sorted list)
- Detail Template (header + content sections)
- Form Template (stepper + form fields + actions)
- Analytics Template (time selector + graph cards)
- Settings Template (grouped settings rows)
- Full-screen Overlay (AI processing, success screens)

---

## 20. Accessibility Guidelines

### WCAG 2.1 AA Compliance Targets

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | All text meets 4.5:1 ratio (7:1 for small text). Never use color alone to convey meaning — pair with icons, text labels, or patterns. |
| **Touch Targets** | Minimum 48x48dp touch targets on mobile. 44x44px on web. |
| **Font Size** | Minimum 14px. Body text default 16px. Settings option for Large/Extra Large text. |
| **Screen Reader** | All interactive elements have aria-labels. Images have alt text. Graphs have text alternatives. |
| **Keyboard Navigation** | Full keyboard navigation on web. Logical tab order. Visible focus indicators. |
| **Motion** | Respect "reduce motion" OS setting. No auto-playing animations. Provide static alternatives. |
| **Language** | Use simple, jargon-free language. Explain medical terms on first use. Tooltips for abbreviations. |

### Health-Specific Accessibility
- Parameter status should use **color + icon + text**: "142 mg/dL ⚠️ High" (not just amber color)
- Graphs should have a table data view alternative
- Normal ranges should always be stated as text, not just shown as bands on graphs
- Emergency card should be accessible from lock screen
- High-contrast mode option in settings

### Senior Citizen Adaptations
- "Large Text" mode in settings (scales all text by 1.25x)
- "Simple Mode" option that hides advanced features (comparison, analytics export)
- Clear, non-abbreviated labels ("Blood Sugar" not "FBS")
- Confirmation dialogs for destructive actions
- WhatsApp share option prominent (most familiar to Indian seniors)

---

## 21. Figma File Structure

### Page Organization

```
📁 MediVault — Phase 1

├── 📄 Cover
│   └── Project title, version, date, team

├── 📄 Design System
│   ├── Colors (all palettes with hex codes)
│   ├── Typography (all text styles)
│   ├── Spacing & Grid
│   ├── Shadows & Elevation
│   ├── Icons (outlined icon set)
│   └── Component Library
│       ├── Atoms
│       ├── Molecules
│       └── Organisms

├── 📄 User Flows
│   ├── First-Time User Journey
│   ├── Upload Report Flow
│   ├── AI Review Flow
│   ├── Doctor Sharing Flow
│   ├── Family Management Flow
│   └── Reminder Flow

├── 📄 Android — Auth & Onboarding
│   ├── Splash
│   ├── Onboarding 1/2/3
│   ├── Login / Signup
│   ├── OTP Verification
│   ├── AI Consent
│   └── Profile Setup

├── 📄 Android — Home & Dashboard
│   ├── Dashboard (populated)
│   ├── Dashboard (empty state)
│   └── Notification Panel

├── 📄 Android — Reports
│   ├── Reports List (populated)
│   ├── Reports List (empty)
│   ├── Upload — Source Selection
│   ├── Upload — Camera
│   ├── Upload — Preview & Crop
│   ├── Upload — AI Processing
│   ├── Upload — Review & Edit
│   ├── Upload — Tag & Save
│   ├── Upload — Success
│   ├── Report Detail
│   ├── Original Document View
│   ├── Timeline View
│   ├── Compare — Select
│   ├── Compare — Side by Side
│   └── Search & Filter

├── 📄 Android — Analytics
│   ├── Analytics Dashboard
│   ├── Analytics (empty)
│   ├── Parameter Detail — HbA1c
│   ├── Parameter Detail — Sugar
│   ├── Parameter Detail — BP
│   └── Health Score

├── 📄 Android — Family & Sharing
│   ├── Family Members List
│   ├── Add Family Member
│   ├── Member Profile
│   ├── Profile Switcher
│   ├── Share — Select Reports
│   ├── Share — Options
│   ├── Share — Link Generated
│   └── Share History

├── 📄 Android — More
│   ├── Reminders List
│   ├── Add Reminder
│   ├── Emergency Card
│   ├── Emergency Card — Edit
│   ├── Settings
│   ├── Privacy & Security
│   └── Export / Delete Account

├── 📄 Web App — All Screens
│   ├── (Same screen list as Android, adapted to desktop layout)
│   ├── Sidebar navigation included
│   ├── 2-column and 3-column layouts
│   └── Doctor View (shared link recipient page)

├── 📄 States & Interactions
│   ├── All Empty States
│   ├── All Error States
│   ├── All Loading States (skeletons)
│   ├── All Success States
│   ├── Micro-interactions (button press, card expand, etc.)
│   └── Transitions (screen-to-screen)

├── 📄 Prototype
│   ├── Android Prototype (linked screens)
│   └── Web Prototype (linked screens)

└── 📄 Handoff Notes
    ├── Screen specifications
    ├── Animation notes
    ├── API integration points
    └── Edge cases & special behaviors
```

### Figma Component Naming Convention

```
Component Category / Component Name / Variant

Examples:
Button / Primary / Default
Button / Primary / Hover
Button / Primary / Disabled
Card / Report / Default
Card / Report / Selected
Card / Parameter / Normal
Card / Parameter / Warning
Card / Parameter / Critical
Input / Text / Default
Input / Text / Focused
Input / Text / Error
Nav / BottomBar / Home-Active
Nav / BottomBar / Reports-Active
State / Empty / Reports
State / Error / Upload-Failed
State / Loading / Skeleton-Card
```

### Auto-Layout Settings (Figma)

```
Mobile frames:     390 x 844 (iPhone 14 / similar Android)
Tablet frames:     820 x 1180 (iPad / Android tablet)
Web frames:        1440 x 900 (desktop)
Web min-width:     1024px (sidebar collapses below this)

Grid:
  Mobile:   4 columns, 16px gutter, 16px margin
  Tablet:   8 columns, 24px gutter, 32px margin
  Desktop: 12 columns, 24px gutter, 64px margin
```

---

## Mobile-First Design Recommendations

1. **Design mobile first**, then adapt to web — not the other way around
2. **One primary action per screen** — don't overwhelm with options
3. **Bottom sheets over modals** for mobile — easier to reach with thumb
4. **Thumb zone priority** — key actions (upload FAB, save button) in the bottom 1/3 of screen
5. **Pull to refresh** on lists and dashboard
6. **Swipe gestures** — swipe left on report card for quick actions (share, delete)
7. **Offline support** — cache reports locally, show "offline" indicator, sync when back online
8. **Haptic feedback** on key actions (save, delete, upload complete)
9. **Camera optimization** — auto-crop, edge detection, flash control for document scanning
10. **Deep links** — shared report links should open in the app if installed

---

## Summary

This design plan covers **42 screens** across **Android and Web**, with complete specifications for:
- Navigation, layout, and information architecture
- Every major user flow with screen-by-screen wireframe descriptions
- A full design system (colors, typography, spacing, components)
- All UI states (empty, error, loading, success)
- Sample microcopy for all key moments
- Accessibility guidelines for senior citizens and diverse users
- A ready-to-use Figma file structure

**Next steps for the designer:**
1. Set up the Figma file using the page structure above
2. Build the design system components first (atoms → molecules → organisms)
3. Design the Android screens in mobile-first order
4. Create the web adaptations
5. Link screens into an interactive prototype
6. Conduct usability testing with target users (especially senior citizens)
