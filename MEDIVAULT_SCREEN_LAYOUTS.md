# MediVault — Detailed Screen-by-Screen UI Layouts

> **26 Screens · Figma-Ready Specification**
> **Date:** June 2026 · **Phase 1 MVP**
> **Platforms:** Android (390×844) · Web (1440×900)

---

## Table of Contents

| # | Screen | Category |
|---|--------|----------|
| 1 | [Splash Screen](#screen-1-splash-screen) | Onboarding |
| 2 | [Welcome Screen](#screen-2-welcome-screen) | Onboarding |
| 3 | [Login Screen](#screen-3-login-screen) | Auth |
| 4 | [OTP Verification Screen](#screen-4-otp-verification-screen) | Auth |
| 5 | [Consent Screen](#screen-5-consent-screen) | Auth |
| 6 | [Create Main Profile Screen](#screen-6-create-main-profile-screen) | Setup |
| 7 | [Add Family Member Screen](#screen-7-add-family-member-screen) | Setup |
| 8 | [Home Dashboard](#screen-8-home-dashboard) | Core |
| 9 | [Upload Report Screen](#screen-9-upload-report-screen) | Core |
| 10 | [Select Family Member Screen](#screen-10-select-family-member-screen) | Core |
| 11 | [File Preview Screen](#screen-11-file-preview-screen) | Core |
| 12 | [AI Processing Screen](#screen-12-ai-processing-screen) | Core |
| 13 | [AI Extracted Data Review Screen](#screen-13-ai-extracted-data-review-screen) | Core |
| 14 | [Report Saved Success Screen](#screen-14-report-saved-success-screen) | Core |
| 15 | [Past Reports List Screen](#screen-15-past-reports-list-screen) | Reports |
| 16 | [Report Detail Screen](#screen-16-report-detail-screen) | Reports |
| 17 | [Analytics Dashboard](#screen-17-analytics-dashboard) | Analytics |
| 18 | [Parameter Trend Graph Screen](#screen-18-parameter-trend-graph-screen) | Analytics |
| 19 | [Report Comparison Screen](#screen-19-report-comparison-screen) | Analytics |
| 20 | [Family Members Screen](#screen-20-family-members-screen) | Family |
| 21 | [Doctor Sharing Screen](#screen-21-doctor-sharing-screen) | Sharing |
| 22 | [Reminder Screen](#screen-22-reminder-screen) | Reminders |
| 23 | [Emergency Card Screen](#screen-23-emergency-card-screen) | Safety |
| 24 | [Settings Screen](#screen-24-settings-screen) | Settings |
| 25 | [Privacy & Security Screen](#screen-25-privacy--security-screen) | Settings |
| 26 | [Admin Dashboard](#screen-26-admin-dashboard) | Admin |

---

## Screen 1: Splash Screen

### Purpose
Brand introduction and app initialization. Shown for 1.5–2 seconds while the app loads user session, checks auth, and preloads essential data.

### Layout

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│                                 │
│          ┌──────────┐           │
│          │          │           │
│          │   LOGO   │           │
│          │  (64px)  │           │
│          │          │           │
│          └──────────┘           │
│                                 │
│         MediVault               │  ← App name, 28px, Bold, Teal-600
│    Your Health, Organized       │  ← Tagline, 14px, Regular, Gray-500
│                                 │
│                                 │
│                                 │
│                                 │
│          ● ● ●                  │  ← Loading dots animation
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│    🔒 Your data is encrypted    │  ← Trust indicator, 12px, Gray-400
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- No navigation header
- App logo centered — 64×64px, rounded square icon with teal gradient background and white "M" lettermark

### Main Sections
1. **Logo Block** — vertically centered, logo + app name + tagline
2. **Loading Indicator** — subtle pulsing dots or thin progress bar below tagline
3. **Trust Badge** — bottom area, small lock icon with "Your data is encrypted" text

### Buttons
- None (auto-navigation screen)

### Form Fields
- None

### Cards/Components
- Logo image (64×64, exported as SVG)
- App name text
- Tagline text
- Loading dots animation (3 dots with staggered pulse)
- Trust badge (lock icon + text)

### User Actions
- None — auto-navigates after 1.5s
- If first time → Welcome Screen
- If logged in → Home Dashboard
- If session expired → Login Screen

### Empty State
- N/A

### Error State
- If app fails to load: Show "Something went wrong. Tap to retry." with a retry button replacing the loading dots after 10 seconds.

### Success State
- Smooth fade-out transition to the next screen

### Suggested Microcopy
```
App Name:    "MediVault"
Tagline:     "Your Health, Organized"
Trust line:  "🔒 Your data is encrypted"
Error:       "Couldn't start the app. Check your connection and try again."
```

### Mobile Layout Notes
- Full screen, no status bar theming (status bar matches background)
- Background: White (#FFFFFF)
- Logo and text group centered vertically with slight upward offset (-10% from true center)
- Loading dots at 65% vertical position
- Trust badge pinned 32px from bottom safe area

### Web Layout Notes
- Same layout centered on screen
- Background fills entire viewport
- Slightly larger logo (80×80px)
- Add subtle radial gradient: white center to Teal-50 (#F0FDFA) edges
- Transition: Fade to login/dashboard

---

## Screen 2: Welcome Screen

### Purpose
First-time user introduction. Carousel of 3 slides explaining the app's value propositions. Builds trust and sets expectations before asking for login.

### Layout

```
┌─────────────────────────────────┐
│                          Skip → │  ← 14px, Teal-600, top-right
│                                 │
│                                 │
│    ┌───────────────────────┐    │
│    │                       │    │
│    │                       │    │
│    │    ILLUSTRATION       │    │  ← 55% of screen height
│    │    (Lottie or SVG)    │    │     Flat, friendly, diverse characters
│    │                       │    │
│    │                       │    │
│    └───────────────────────┘    │
│                                 │
│     Store all your medical      │  ← Title: 24px, Bold, Gray-900
│     reports in one place        │
│                                 │
│     Upload prescriptions, lab   │  ← Subtitle: 16px, Regular, Gray-500
│     reports, scans, and more.   │     Max 2 lines
│     Access them anytime.        │
│                                 │
│          ●  ○  ○                │  ← Pagination dots
│                                 │
│    ┌───────────────────────┐    │
│    │      Next →            │    │  ← Primary button, full width
│    └───────────────────────┘    │     On last slide: "Get Started"
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- No top bar/header
- "Skip" text link at top-right corner (16px from top, 16px from right)

### Main Sections

**Slide 1: Store**
- Illustration: Person placing a document into a phone/vault
- Title: "Store all your medical reports in one place"
- Subtitle: "Upload prescriptions, lab reports, scans, and more. Access them anytime."

**Slide 2: Understand**
- Illustration: AI sparkle reading a document, data points floating out
- Title: "AI reads your reports automatically"
- Subtitle: "No more typing. Our AI extracts blood sugar, cholesterol, and other values for you."

**Slide 3: Track & Share**
- Illustration: Graph trending upward + two people (doctor & patient)
- Title: "Track your health and share with doctors"
- Subtitle: "See trends over time. Share selected reports securely with one tap."

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Next | Primary, full width | "Next →" | Go to next slide |
| Get Started | Primary, full width | "Get Started" | Go to Login Screen |
| Skip | Text link, top-right | "Skip" | Go to Login Screen |

### Form Fields
- None

### Cards/Components
- Illustration container (aspect ratio 4:3, centered)
- Title text block (24px, bold, centered)
- Subtitle text block (16px, regular, centered, max-width 300px mobile)
- Pagination dots (3 dots, 8px diameter, 12px gap, active=Teal-600, inactive=Gray-300)
- Primary button (height 52px, border-radius 12px, Teal-600 bg)

### User Actions
- Swipe left/right to navigate slides
- Tap "Next" to advance
- Tap "Skip" to jump to Login
- Tap "Get Started" (last slide) to proceed

### Empty State
- N/A (always has content)

### Error State
- N/A (no network needed)

### Success State
- Smooth slide-left transition to next screen

### Suggested Microcopy
```
Slide 1 Title:    "Store all your medical reports in one place"
Slide 1 Subtitle: "Upload prescriptions, lab reports, scans, and more. Access them anytime."

Slide 2 Title:    "AI reads your reports automatically"
Slide 2 Subtitle: "No more typing. Our AI extracts blood sugar, cholesterol, and other values for you."

Slide 3 Title:    "Track your health and share with doctors"
Slide 3 Subtitle: "See trends over time. Share selected reports securely with one tap."

Skip:             "Skip"
Next:             "Next →"
Get Started:      "Get Started"
```

### Mobile Layout Notes
- Full screen, swipeable horizontal carousel
- Illustration: top 55% of screen
- Text + dots + button: bottom 45%
- Button fixed at bottom with 16px margin from bottom safe area
- Swipe gesture with spring animation
- Dots animate with slide transition

### Web Layout Notes
- Centered card layout (max-width 520px) on a Teal-50 background
- Illustration smaller (40% of card height)
- Left/right arrow buttons in addition to dots
- Can also use keyboard left/right arrows
- Button width: 320px centered (not full width)

---

## Screen 3: Login Screen

### Purpose
Authenticate users via mobile OTP, email, or Google Sign-In. Single screen handles both login and signup — new users are auto-detected when OTP is verified.

### Layout

```
┌─────────────────────────────────┐
│  ←                              │  ← Back arrow (only if coming from Welcome)
│                                 │
│          ┌──────────┐           │
│          │   LOGO   │           │  ← 48×48 logo
│          └──────────┘           │
│         MediVault               │  ← 22px, Bold
│                                 │
│   Welcome back! Log in to       │  ← 16px, Gray-600
│   access your medical reports.  │
│                                 │
│   ┌─ Login with Phone ────────┐ │
│   │                           │ │
│   │  Phone Number             │ │  ← Label: 14px, Gray-600
│   │  ┌──────┬────────────────┐│ │
│   │  │ +91▾ │ 98765 43210    ││ │  ← Country code dropdown + phone input
│   │  └──────┴────────────────┘│ │
│   │                           │ │
│   │  ┌───────────────────────┐│ │
│   │  │     Send OTP          ││ │  ← Primary button, full width
│   │  └───────────────────────┘│ │
│   │                           │ │
│   └───────────────────────────┘ │
│                                 │
│         ── or continue with ──  │  ← Divider with text, Gray-400
│                                 │
│   ┌───────────────────────────┐ │
│   │  🔵  Continue with Google │ │  ← Outline button, Google icon
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │  ✉️  Continue with Email  │ │  ← Outline button, email icon
│   └───────────────────────────┘ │
│                                 │
│                                 │
│                                 │
│   By continuing, you agree to   │  ← 12px, Gray-400, centered
│   our Terms of Service and      │
│   Privacy Policy.               │  ← "Terms" and "Privacy" are teal links
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (left, 24px) — only visible when navigating from Welcome screen
- No title text in header bar

### Main Sections
1. **Brand Block** — Logo (48×48) + app name (22px bold) + welcome text
2. **Phone Login Form** — Country code selector + phone input + Send OTP button
3. **Social Divider** — "or continue with" horizontal rule
4. **Social Login Buttons** — Google Sign-In + Email login (outline buttons stacked)
5. **Legal Footer** — Terms of Service and Privacy Policy links

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Send OTP | Primary, full width | "Send OTP" | Validate phone → Send OTP → Navigate to OTP Screen |
| Google | Outline, full width | "Continue with Google" | Initiate Google OAuth flow |
| Email | Outline, full width | "Continue with Email" | Show email input field (replaces phone) |
| Back | Icon button, top-left | ← | Navigate back to Welcome |

### Form Fields
| Field | Type | Validation | Placeholder |
|-------|------|-----------|-------------|
| Country Code | Dropdown | Required | "+91" (default India) |
| Phone Number | Number input (10 digits) | Required, 10 digits, numeric only | "Enter your phone number" |
| Email (if toggled) | Email input | Required, valid email format | "Enter your email address" |

### Cards/Components
- App logo (48×48)
- App name text
- Welcome message text
- Phone input with country code prefix
- Primary button (52px height)
- Divider with centered text
- Social login buttons (48px height, outlined, with provider icon)
- Legal text with hyperlinks
- Country code dropdown (searchable list of countries)

### User Actions
- Enter phone number → Tap "Send OTP"
- Tap Google button → Google OAuth popup/redirect
- Tap Email → Switch form to email input
- Tap Terms/Privacy links → Open in-app browser
- Tap back arrow → Return to Welcome

### Empty State
- N/A (form is always shown)

### Error State
```
Invalid phone:     "Please enter a valid 10-digit phone number."
                   (Red text below phone field, field border turns red)

Rate limited:      "Too many attempts. Please try again after 2 minutes."
                   (Red banner at top of form)

Google auth fail:  "Google sign-in failed. Please try again."
                   (Snackbar, red, auto-dismiss 4s)

Network error:     "No internet connection. Please check and try again."
                   (Snackbar with retry action)
```

### Success State
- Phone validated → Smooth transition to OTP Screen
- Google auth success → Navigate to Consent Screen (new user) or Dashboard (returning user)

### Suggested Microcopy
```
Welcome text (new):      "Welcome! Create an account to store your medical reports safely."
Welcome text (returning): "Welcome back! Log in to access your medical reports."
Phone label:              "Phone Number"
Phone placeholder:        "Enter your phone number"
Send OTP button:          "Send OTP"
Divider:                  "or continue with"
Google button:            "Continue with Google"
Email button:             "Continue with Email"
Legal:                    "By continuing, you agree to our Terms of Service and Privacy Policy."
```

### Mobile Layout Notes
- Logo + brand block top 25% of screen
- Form area centered in middle
- Legal text pinned at bottom (above keyboard when input focused)
- When keyboard opens: logo shrinks/hides, content scrolls up
- Country code dropdown: bottom sheet with search
- Phone field auto-focuses on screen load
- Numeric keyboard opens for phone input

### Web Layout Notes
- Centered card (max-width 420px) with subtle shadow
- Background: Teal-50 full viewport
- Google button shows popup (not redirect)
- Email login shows inline form swap (animated)
- Country code: standard dropdown (not bottom sheet)
- Tab order: phone → send OTP → Google → Email

---

## Screen 4: OTP Verification Screen

### Purpose
Verify the user's phone number or email via a 6-digit OTP code. Auto-reads SMS on Android.

### Layout

```
┌─────────────────────────────────┐
│  ←  Verify OTP                  │  ← Back arrow + title
│                                 │
│                                 │
│          📱                     │  ← Phone icon, 48px
│                                 │
│   We sent a 6-digit code to    │  ← 16px, Gray-700
│   +91 98765 43210               │  ← 16px, Bold, Gray-900
│                                 │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│   │ 4│ │ 8│ │ 2│ │  │ │  │ │  ││  ← 6 individual digit boxes
│   └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│     48×56px each, 8px gap
│                                 │     Active box: Teal-600 border
│                                 │
│   ┌───────────────────────────┐ │
│   │       Verify OTP          │ │  ← Primary button (disabled until 6 digits)
│   └───────────────────────────┘ │
│                                 │
│                                 │
│   Didn't receive the code?      │  ← 14px, Gray-500
│   Resend OTP (0:45)             │  ← 14px, Teal-600 (disabled with countdown)
│                                 │
│   Try a different method        │  ← 14px, Teal-600, text link
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (←) + "Verify OTP" title (18px, semi-bold)

### Main Sections
1. **Info Block** — Icon + "We sent a code to [phone/email]"
2. **OTP Input** — 6 individual digit boxes in a row
3. **Verify Button** — Primary button, disabled until 6 digits entered
4. **Resend Block** — "Didn't receive?" + "Resend OTP" with countdown timer + "Try different method" link

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Verify | Primary, full width | "Verify OTP" | Validate OTP → Proceed |
| Resend OTP | Text link | "Resend OTP" | Resend OTP (disabled during countdown) |
| Different method | Text link | "Try a different method" | Go back to Login |
| Back | Icon, top-left | ← | Go back to Login |

### Form Fields
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| OTP digits | 6 individual number inputs | Required, numeric, exactly 6 digits | Auto-advance cursor on digit entry |

### Cards/Components
- Phone/email icon (48px, teal)
- Destination text (phone number or email, bold)
- OTP digit boxes (6 boxes, 48×56px each)
- Primary button with disabled state
- Countdown timer text (updates every second)
- Resend link (disabled → enabled after countdown)

### User Actions
- Enter OTP digits manually (auto-advances to next box)
- Android: Auto-read OTP from SMS (with user permission)
- Tap Verify → Submit OTP
- Tap Resend → New OTP sent, timer resets to 60s
- Tap back → Return to Login
- Paste OTP from clipboard → Auto-fills all 6 boxes

### Empty State
- N/A

### Error State
```
Wrong OTP:         "Incorrect code. Please check and try again."
                   (Red text below OTP boxes, boxes shake animation, border turns red)

Expired OTP:       "This code has expired. Please request a new one."
                   (Red text, "Resend OTP" button highlighted)

Max attempts:      "Too many incorrect attempts. Please try again after 15 minutes."
                   (Red banner, Verify button disabled)

Network:           "Couldn't verify. Check your connection and try again."
                   (Snackbar with retry)
```

### Success State
- OTP verified → Green checkmark animation on all boxes → Navigate forward
- New user → Consent Screen
- Existing user → Home Dashboard

### Suggested Microcopy
```
Title:            "Verify OTP"
Instruction:      "We sent a 6-digit code to"
Phone display:    "+91 98765 43210"  (partially masked: "+91 •••••43210" for security)
Button:           "Verify OTP"
Resend:           "Didn't receive the code?"
Resend link:      "Resend OTP" / "Resend OTP (0:45)"
Different:        "Try a different method"
SMS auto-read:    "Reading OTP from SMS..."
```

### Mobile Layout Notes
- OTP boxes centered horizontally
- Numeric keyboard auto-opens
- SMS auto-read: boxes fill automatically with brief animation
- Paste support: long-press on first box shows paste option
- Boxes are large enough for finger tapping (48×56px)
- On wrong OTP: boxes shake left-right (200ms animation)

### Web Layout Notes
- Centered card layout (max-width 420px)
- OTP boxes slightly larger (52×60px)
- Keyboard input auto-advances between boxes
- Backspace moves to previous box
- Paste from clipboard supported (Ctrl+V fills all 6)
- Tab key moves between boxes

---

## Screen 5: Consent Screen

### Purpose
Inform users about AI processing and data privacy before they use the app. Required by data protection regulations. Must be accepted to continue.

### Layout

```
┌─────────────────────────────────┐
│  ←  Data & Privacy              │  ← Back arrow + title
│                                 │
│         🛡️                      │  ← Shield icon, 56px, Teal-600
│                                 │
│   How We Use AI to Help You     │  ← 22px, Bold, Gray-900
│                                 │
│   We care about your privacy.   │  ← 14px, Gray-600
│   Here's what happens when you  │
│   upload a report:              │
│                                 │
│   ┌───────────────────────────┐ │
│   │  🔍                       │ │
│   │  AI Reads Your Reports    │ │  ← Card title: 16px, Bold
│   │                           │ │
│   │  When you upload a report,│ │  ← Card body: 14px, Gray-600
│   │  our AI reads it to find  │ │
│   │  medical values like      │ │
│   │  blood sugar, cholesterol │ │
│   │  and more.                │ │
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │  🔒                       │ │
│   │  Your Data is Secure      │ │
│   │                           │ │
│   │  All data is encrypted    │ │
│   │  and stored on secure     │ │
│   │  servers. We never sell   │ │
│   │  or share your medical    │ │
│   │  data with anyone.        │ │
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │  ✏️                       │ │
│   │  You're In Control        │ │
│   │                           │ │
│   │  You can review and edit  │ │
│   │  everything AI extracts   │ │
│   │  before saving. Delete    │ │
│   │  your data anytime.       │ │
│   └───────────────────────────┘ │
│                                 │
│   Read our full Privacy Policy →│  ← 14px, Teal-600, text link
│                                 │
│   ┌───────────────────────────┐ │
│   │  I Understand & Continue  │ │  ← Primary button, full width
│   └───────────────────────────┘ │
│                                 │
│   You can change these          │  ← 12px, Gray-400
│   preferences anytime           │
│   in Settings.                  │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (←) + "Data & Privacy" title (18px, semi-bold)

### Main Sections
1. **Hero Block** — Shield icon + main title + intro paragraph
2. **Info Cards** — 3 stacked cards explaining AI usage, security, and user control
3. **Privacy Link** — Link to full privacy policy
4. **Consent Button** — Primary CTA
5. **Footer Note** — Reassurance that settings can be changed later

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Continue | Primary, full width | "I Understand & Continue" | Accept consent → Profile Setup |
| Privacy Policy | Text link | "Read our full Privacy Policy →" | Open privacy policy (in-app browser) |
| Back | Icon, top-left | ← | Go back (not recommended, show warning) |

### Form Fields
- None (consent is implied by tapping "Continue")

### Cards/Components
| Component | Content | Style |
|-----------|---------|-------|
| Card 1 | 🔍 AI Reads Your Reports | Icon + title + description, white bg, 1px border, 12px radius |
| Card 2 | 🔒 Your Data is Secure | Same style as Card 1 |
| Card 3 | ✏️ You're In Control | Same style as Card 1 |

Card specs:
- Padding: 16px
- Icon: 32px, Teal-600 tint
- Title: 16px, Bold, Gray-900
- Body: 14px, Regular, Gray-600
- Border: 1px, Gray-200
- Border-radius: 12px
- Background: White
- Gap between cards: 12px

### User Actions
- Scroll to read all three cards
- Tap "I Understand & Continue" → Proceed to Profile Setup
- Tap Privacy Policy link → View full policy
- Tap back → Warning: "You need to accept to use the app"

### Empty State
- N/A

### Error State
```
Back without consent: "You need to accept our data policy to use MediVault. 
                       We take your privacy seriously."
                       (Bottom sheet with "Accept" and "Exit App" buttons)
```

### Success State
- Button tap → Checkmark animation on button → Navigate to Profile Setup

### Suggested Microcopy
```
Title:       "How We Use AI to Help You"
Intro:       "We care about your privacy. Here's what happens when you upload a report:"

Card 1 Title: "AI Reads Your Reports"
Card 1 Body:  "When you upload a report, our AI reads it to find medical values like blood sugar, cholesterol, and more. This saves you from typing anything manually."

Card 2 Title: "Your Data is Secure"
Card 2 Body:  "All data is encrypted and stored on secure servers. We never sell or share your medical data with anyone. Ever."

Card 3 Title: "You're In Control"
Card 3 Body:  "You can review and edit everything AI extracts before saving. You can also delete your data at any time from Settings."

Link:        "Read our full Privacy Policy →"
Button:      "I Understand & Continue"
Footer:      "You can change these preferences anytime in Settings."
```

### Mobile Layout Notes
- Scrollable content area
- Button sticky at bottom (above safe area) — always visible
- Cards stack vertically with 12px gap
- Footer text below button, within scroll area
- Shield icon centered above title

### Web Layout Notes
- Centered card layout (max-width 560px)
- Cards can be in 1-column layout (same as mobile) or side-by-side for wider screens
- Button width: 320px, centered
- Privacy policy opens in new tab (not in-app browser)

---

## Screen 6: Create Main Profile Screen

### Purpose
Collect essential health profile information for the primary user. This data helps contextualize medical reports and enables health score calculations.

### Layout

```
┌─────────────────────────────────┐
│  ←  Create Your Profile         │  ← Back arrow + title
│                                 │
│  Step 1 of 1  ████████████████  │  ← Progress bar (full)
│                                 │
│   Tell us about yourself        │  ← 22px, Bold
│   This helps us organize your   │  ← 14px, Gray-500
│   health data better.           │
│                                 │
│        ┌──────────┐             │
│        │  📷      │             │  ← Profile photo upload (80×80, circular)
│        │  Add     │             │     Tap to open camera/gallery
│        │  Photo   │             │
│        └──────────┘             │
│                                 │
│   Full Name *                   │  ← Label: 14px, Medium, Gray-700
│   ┌───────────────────────────┐ │
│   │ Yogesh Kumar              │ │  ← Text input, 16px
│   └───────────────────────────┘ │
│                                 │
│   Date of Birth *               │
│   ┌───────────────────────────┐ │
│   │ 15 / 03 / 1994     📅    │ │  ← Date input with calendar icon
│   └───────────────────────────┘ │
│                                 │
│   Gender *                      │
│   ┌──────┐ ┌──────┐ ┌────────┐ │
│   │ Male │ │Female│ │ Other  │ │  ← Chip selector (single select)
│   └──────┘ └──────┘ └────────┘ │     Active: Teal bg, white text
│                                 │     Inactive: Gray-100 bg, Gray-700 text
│   Blood Group                   │
│   ┌───────────────────────────┐ │
│   │ Select blood group     ▾ │ │  ← Dropdown
│   └───────────────────────────┘ │     Options: A+, A-, B+, B-, O+, O-, AB+, AB-
│                                 │
│   Known Health Conditions       │
│   ┌──────────┐ ┌─────────────┐ │
│   │ Diabetes │ │Hypertension │ │  ← Multi-select chips
│   └──────────┘ └─────────────┘ │     (user can select multiple)
│   ┌──────────┐ ┌─────────────┐ │
│   │ Thyroid  │ │Heart Disease│ │
│   └──────────┘ └─────────────┘ │
│   ┌──────┐ ┌──────┐            │
│   │ None │ │Other │            │
│   └──────┘ └──────┘            │
│                                 │
│   Height                        │
│   ┌──────────────┐ ┌─────────┐ │
│   │ 175          │ │ cm | ft ▾│ │  ← Number input + unit toggle
│   └──────────────┘ └─────────┘ │
│                                 │
│   Weight                        │
│   ┌──────────────┐ ┌─────────┐ │
│   │ 72           │ │ kg |lbs▾│ │  ← Number input + unit toggle
│   └──────────────┘ └─────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │    Save & Continue        │ │  ← Primary button
│   └───────────────────────────┘ │
│                                 │
│   Skip for now                  │  ← 14px, Teal-600, text link
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (←) + "Create Your Profile" (18px, semi-bold)
- Progress bar below header (1 step, full)

### Main Sections
1. **Intro Text** — Title + subtitle explaining why this info is needed
2. **Photo Upload** — Circular avatar placeholder with camera icon
3. **Personal Info Form** — Name, DOB, Gender
4. **Health Info Form** — Blood group, conditions, height, weight
5. **Action Buttons** — Save & Continue + Skip for now

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Save | Primary, full width | "Save & Continue" | Validate required fields → Save profile → Dashboard |
| Skip | Text link, centered | "Skip for now" | Navigate to Dashboard with minimal profile |
| Photo | Circular button | Camera icon | Open photo picker (camera/gallery bottom sheet) |

### Form Fields
| Field | Type | Required | Validation | Default |
|-------|------|----------|-----------|---------|
| Profile Photo | Image upload | No | JPG/PNG, max 5MB | Default avatar |
| Full Name | Text input | Yes* | Min 2 chars, letters/spaces only | — |
| Date of Birth | Date picker | Yes* | Must be in the past, age 1-120 | — |
| Gender | Chip selector | Yes* | Single select from 3 options | — |
| Blood Group | Dropdown | No | Select from 8 options | "Select blood group" |
| Known Conditions | Multi-chip selector | No | Multiple select | None selected |
| Height | Number input + unit | No | 30-300 cm or 1-10 ft | — |
| Weight | Number input + unit | No | 2-500 kg or 4-1100 lbs | — |

### Cards/Components
- Circular avatar upload area (80×80px, dashed border when empty, camera icon overlay)
- Text inputs (48px height, 12px border-radius, 1px Gray-300 border)
- Chip selectors (36px height, 8px border-radius, 8px horizontal gap)
- Dropdown (48px height, chevron icon right-aligned)
- Unit toggle (segmented control: cm/ft, kg/lbs)
- Progress bar (4px height, Teal-600 fill)

### User Actions
- Fill required fields → Tap Save
- Tap photo area → Bottom sheet: Camera / Gallery
- Select gender chip → Single selection
- Select condition chips → Multiple selection (tap to toggle)
- Tap "None" in conditions → Deselects all others
- Tap unit toggle → Switches between metric/imperial
- Tap Skip → Goes to Dashboard with just name (prompts to complete later)

### Empty State
- N/A (always shows form)

### Error State
```
Missing name:      "Please enter your full name."
                   (Red text below field, red border)

Missing DOB:       "Please enter your date of birth."

Future DOB:        "Date of birth cannot be in the future."

Missing gender:    "Please select your gender."

Invalid height:    "Please enter a valid height."

Photo too large:   "Photo is too large. Maximum size is 5 MB."
                   (Snackbar, auto-dismiss)
```

### Success State
- All valid → "Profile created! ✓" green snackbar → Navigate to Dashboard

### Suggested Microcopy
```
Title:        "Tell us about yourself"
Subtitle:     "This helps us organize your health data better."
Photo label:  "Add Photo"
Name label:   "Full Name"
DOB label:    "Date of Birth"
DOB hint:     "DD / MM / YYYY"
Gender label: "Gender"
Blood label:  "Blood Group"
Blood hint:   "Select blood group"
Conditions:   "Known Health Conditions"
Conditions hint: "Select all that apply"
Height label: "Height"
Weight label: "Weight"
Save button:  "Save & Continue"
Skip:         "Skip for now"
Skip warning: "You can complete your profile later from Settings."
```

### Mobile Layout Notes
- Scrollable form
- Keyboard avoidance: scroll to active field when keyboard opens
- Photo upload at top, centered
- Gender chips in a single row (3 chips)
- Condition chips in a 2-column flow layout
- Height/Weight side by side (50% width each) on wider phones
- "Save" button sticky at bottom OR scrolls with form (both work)
- "Skip for now" below Save button within scroll

### Web Layout Notes
- Centered form card (max-width 560px)
- Photo upload left-aligned or centered
- Form in single column
- Height and Weight side by side (50/50)
- Gender chips larger (more padding)
- Condition chips in 3-column grid
- Button: 320px centered

---

## Screen 7: Add Family Member Screen

### Purpose
Add a family member's profile so the primary user can upload and manage medical reports on their behalf (for parents, spouse, children, etc.).

### Layout

```
┌─────────────────────────────────┐
│  ←  Add Family Member           │
│                                 │
│   Add a family member to        │  ← 14px, Gray-600
│   store their reports too.      │
│                                 │
│        ┌──────────┐             │
│        │  📷 Add  │             │  ← Profile photo (80×80, circular)
│        │  Photo   │             │
│        └──────────┘             │
│                                 │
│   Full Name *                   │
│   ┌───────────────────────────┐ │
│   │ Enter member's name       │ │
│   └───────────────────────────┘ │
│                                 │
│   Relationship *                │
│   ┌───────────────────────────┐ │
│   │ Select relationship    ▾ │ │  ← Dropdown
│   └───────────────────────────┘ │     Options: Spouse, Mother, Father,
│                                 │     Son, Daughter, Brother, Sister, Other
│   Date of Birth *               │
│   ┌───────────────────────────┐ │
│   │ DD / MM / YYYY       📅  │ │
│   └───────────────────────────┘ │
│                                 │
│   Gender                        │
│   ┌──────┐ ┌──────┐ ┌────────┐ │
│   │ Male │ │Female│ │ Other  │ │
│   └──────┘ └──────┘ └────────┘ │
│                                 │
│   Blood Group                   │
│   ┌───────────────────────────┐ │
│   │ Select blood group     ▾ │ │
│   └───────────────────────────┘ │
│                                 │
│   Known Health Conditions       │
│   ┌──────────┐ ┌─────────────┐ │
│   │ Diabetes │ │Hypertension │ │
│   └──────────┘ └─────────────┘ │
│   ┌──────────┐ ┌─────────────┐ │
│   │ Thyroid  │ │   None      │ │
│   └──────────┘ └─────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │    Add Family Member      │ │  ← Primary button
│   └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (←) + "Add Family Member" (18px, semi-bold)

### Main Sections
1. **Intro Text** — Brief explanation
2. **Photo Upload** — Circular avatar
3. **Member Details Form** — Name, Relationship, DOB, Gender, Blood Group, Conditions

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Add | Primary, full width | "Add Family Member" | Validate → Save → Show success |
| Back | Icon, top-left | ← | Go back to Family Members list |

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Photo | Image upload | No | JPG/PNG, max 5MB |
| Full Name | Text input | Yes | Min 2 chars |
| Relationship | Dropdown | Yes | Must select one option |
| Date of Birth | Date picker | Yes | Must be past date |
| Gender | Chip selector | No | Single select |
| Blood Group | Dropdown | No | Select from list |
| Conditions | Multi-chip | No | Multi-select |

### User Actions
- Fill form → Tap "Add Family Member"
- Success → Navigate back to Family Members list with new member visible

### Empty State
- N/A

### Error State
```
Missing name:    "Please enter the member's name."
Missing relation: "Please select the relationship."
Duplicate:       "A member with this name already exists."
```

### Success State
- "Family member added! ✓" green snackbar → Navigate to Family list

### Suggested Microcopy
```
Title:       "Add Family Member"
Subtitle:    "Add a family member to store their medical reports too."
Name hint:   "Enter member's name"
Relation:    "Relationship"
Relation hint: "How are they related to you?"
Button:      "Add Family Member"
Success:     "Priya has been added to your family. You can now upload her reports."
```

### Mobile Layout Notes
- Same form pattern as Profile Setup but fewer fields (no height/weight)
- Scrollable, button at bottom
- Relationship dropdown opens as bottom sheet on mobile

### Web Layout Notes
- Centered form (max-width 480px)
- Can open as a modal/dialog from Family Members page
- Relationship as standard dropdown

---

## Screen 8: Home Dashboard

### Purpose
Central hub showing health overview, recent activity, upcoming reminders, and quick access to upload. The first screen users see after login.

### Layout

```
┌─────────────────────────────────┐
│ ┌──┐                            │
│ │YK│ Yogesh ▾    🔔 2    ⚙️     │  ← Top bar: avatar + profile switcher + notifications + settings
│ └──┘                            │
│                                 │
│ Good morning, Yogesh ☀️          │  ← 22px, Bold (time-based greeting)
│ 3 reports this month            │  ← 14px, Gray-500
│                                 │
│ ┌─ HEALTH SNAPSHOT ───────────┐ │
│ │                             │ │
│ │ ┌─────────┐ ┌─────────┐    │ │  ← 2-column grid of parameter cards
│ │ │Sugar    │ │HbA1c    │    │ │     Each card: 
│ │ │142 mg/dL│ │7.1 %    │    │ │     - Parameter name (10px, gray)
│ │ │▲ High   │ │▲ Critical│   │ │     - Value (18px, bold, monospace)
│ │ │[amber]  │ │[red]    │    │ │     - Status text + color
│ │ └─────────┘ └─────────┘    │ │     - Mini trend arrow
│ │ ┌─────────┐ ┌─────────┐    │ │
│ │ │BP       │ │Chol.    │    │ │
│ │ │120/80   │ │225 mg/dL│    │ │
│ │ │● Normal │ │▲ Border.│    │ │
│ │ │[green]  │ │[amber]  │    │ │
│ │ └─────────┘ └─────────┘    │ │
│ │                   See all → │ │
│ └─────────────────────────────┘ │
│                                 │
│  RECENT REPORTS         See all→│
│ ┌─────────────────────────────┐ │
│ │📄 Complete Blood Count      │ │  ← Report card:
│ │   City Lab · Dr. Patel      │ │     icon + title + lab + date
│ │   15 Jun 2026               │ │     + 2-3 key values preview
│ │   Sugar: 142 · HbA1c: 7.1  │ │     Tap → Report Detail
│ │                          ›  │ │
│ ├─────────────────────────────┤ │
│ │💊 Prescription — Dr. Shah   │ │
│ │   Apollo Pharmacy           │ │
│ │   10 Jun 2026               │ │
│ │                          ›  │ │
│ └─────────────────────────────┘ │
│                                 │
│  UPCOMING                       │
│ ┌─────────────────────────────┐ │
│ │⏰ HbA1c Test Due            │ │  ← Reminder card
│ │  📅 25 Jun · In 4 days      │ │     Teal background tint
│ │              [Mark Done]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │⚠️ Vitamin D is low.         │ │  ← Alert card (red tint background)
│ │  Consider consulting doctor.│ │
│ └─────────────────────────────┘ │
│                                 │
│              [+]                │  ← FAB (56px, Teal-600, elevated)
│ ┌─────────────────────────────┐ │
│ │ 🏠  📄   [+]   📊   ≡      │ │  ← Bottom nav
│ └─────────────────────────────┘ │
```

### Header/Title
- Top app bar (56px height):
  - Left: Avatar circle (32px) with initials + Name + dropdown arrow (profile switcher)
  - Right: Notification bell with badge count + Settings gear icon

### Main Sections
1. **Greeting** — Time-based greeting + report count this month
2. **Health Snapshot** — 2×2 grid of latest parameter values with status colors
3. **Recent Reports** — List of last 2-3 reports with key value previews
4. **Upcoming** — Active reminders and health alerts
5. **FAB** — Floating upload button
6. **Bottom Navigation** — 5-tab nav bar

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| FAB | Floating Action Button | "+" | Open Upload Source Selection |
| See all (snapshot) | Text link | "See all →" | Navigate to Analytics |
| See all (reports) | Text link | "See all →" | Navigate to Reports List |
| Mark Done | Small outlined | "Mark Done" | Complete reminder |
| Notification bell | Icon button | 🔔 | Open notifications |
| Settings | Icon button | ⚙️ | Open Settings |

### Form Fields
- None

### Cards/Components

**Parameter Card:**
- Size: (screen-width - 48px) / 2 (fills 2 columns with 16px gap)
- Height: 85px
- Content: parameter name, value, status, trend arrow
- Background: White
- Left border: 3px color bar (green/amber/red)
- Border-radius: 10px

**Report Card:**
- Full width
- Height: ~80px
- Content: type icon (36×36, colored bg), title, lab name, date, key values
- Right: chevron arrow
- Divider between cards

**Reminder Card:**
- Full width
- Background: Teal-50 (#F0FDFA), border: Teal-200
- Content: clock icon, title, date, countdown, action button
- Border-radius: 10px

**Alert Card:**
- Full width
- Background: Red-50 (#FEF2F2), border: Red-200
- Content: warning icon, message text
- Tap → relevant action (e.g., parameter detail)
- Border-radius: 10px

### User Actions
- Scroll vertically through all sections
- Tap parameter card → Analytics detail for that parameter
- Tap report card → Report Detail
- Tap reminder → Reminder detail
- Tap alert → Relevant parameter detail
- Tap FAB → Upload flow
- Tap profile switcher → Dropdown to switch family member
- Pull to refresh → Reload data

### Empty State
```
┌─────────────────────────────────┐
│                                 │
│       [Illustration:            │
│        Document + phone]        │
│                                 │
│   Welcome to MediVault!         │  ← 20px, Bold
│                                 │
│   Upload your first medical     │  ← 14px, Gray-500
│   report to get started.        │
│   We'll organize it for you.    │
│                                 │
│   ┌───────────────────────────┐ │
│   │  📤  Upload Your First    │ │
│   │      Report               │ │
│   └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Error State
```
Network error:     Pull-to-refresh with "Couldn't load your data. Pull down to retry."
Partial load:      Show cached data with "Some data may be outdated" banner
```

### Success State
- Data loads → Skeleton screens fade into real content
- New report uploaded → "Report saved ✓" green snackbar

### Suggested Microcopy
```
Greeting (AM):    "Good morning, Yogesh ☀️"
Greeting (PM):    "Good afternoon, Yogesh"
Greeting (Eve):   "Good evening, Yogesh 🌙"
Subtitle:         "3 reports this month"
Snapshot title:   "HEALTH SNAPSHOT"
Reports title:    "RECENT REPORTS"
Upcoming title:   "UPCOMING"
See all:          "See all →"
Empty title:      "Welcome to MediVault!"
Empty body:       "Upload your first medical report to get started. We'll organize it for you."
Empty button:     "Upload Your First Report"
```

### Mobile Layout Notes
- Scrollable vertical layout
- FAB positioned above bottom nav, right side (56×56px, 16px from edges)
- Bottom nav: 56px height, 5 tabs
- Profile switcher: tap avatar → bottom sheet with family member list
- Health snapshot: 2-column grid, auto-height cards
- Pull-to-refresh gesture at top
- Skeleton loading on initial load

### Web Layout Notes
- Left sidebar (260px) + main content area
- Main area splits into 2 columns:
  - Left column (60%): Health Snapshot (3-column grid), Recent Reports (list)
  - Right column (40%): Upcoming Reminders, Alerts, Quick Actions
- FAB replaced with "Upload Report" button in sidebar (sticky bottom)
- Profile switcher in sidebar top area
- No bottom navigation (sidebar handles all nav)

---

## Screen 9: Upload Report Screen

### Purpose
Select the source for uploading a medical report. This is the entry point of the core upload flow.

### Layout (Bottom Sheet on Mobile)

```
┌─────────────────────────────────┐
│                                 │
│  ── (drag handle) ──            │  ← 40px wide, 4px tall, centered, Gray-300
│                                 │
│   Upload a Report               │  ← 18px, Bold
│   Take a photo or select a file │  ← 14px, Gray-500
│                                 │
│   For:  Yogesh (You) ▾          │  ← Profile selector inline
│                                 │
│   ┌─────────┐  ┌─────────┐     │
│   │         │  │         │     │
│   │   📸    │  │   🖼️    │     │  ← 2×2 grid of source options
│   │         │  │         │     │     Each: 80×80px icon area
│   │ Camera  │  │ Gallery │     │     + label below
│   └─────────┘  └─────────┘     │     Tap → respective picker
│   ┌─────────┐  ┌─────────┐     │
│   │         │  │         │     │
│   │   📄    │  │   📎    │     │
│   │         │  │         │     │
│   │  PDF    │  │  File   │     │
│   └─────────┘  └─────────┘     │
│                                 │
│   Supported: JPG, PNG, PDF      │  ← 12px, Gray-400
│   Maximum file size: 20 MB      │
│                                 │
│   ┌───────────────────────────┐ │
│   │  📋 Paste from Clipboard  │ │  ← Optional: if image in clipboard
│   └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Layout (Web — Modal)

```
┌──────────────────────────────────────┐
│  Upload a Report                  ✕  │
│                                      │
│  For: Yogesh (You) ▾                 │
│                                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │     Drag & drop your file      │  │  ← Drag-and-drop zone
│  │     here, or click to browse   │  │     Dashed border, Gray-300
│  │                                │  │     256px height
│  │         📄                     │  │
│  │                                │  │
│  │  Supported: JPG, PNG, PDF      │  │
│  │  Maximum: 20 MB                │  │
│  └────────────────────────────────┘  │
│                                      │
│  Or choose a source:                 │
│  ┌──────────┐ ┌──────────┐          │
│  │ 📸 Camera│ │ 🖼️ Gallery│          │
│  └──────────┘ └──────────┘          │
│                                      │
└──────────────────────────────────────┘
```

### Header/Title
- Mobile: Drag handle + "Upload a Report" (18px, bold)
- Web: "Upload a Report" + close (✕) button

### Main Sections
1. **Title Block** — Title + subtitle
2. **Profile Selector** — "For: [Name] ▾" — select which family member this report is for
3. **Source Options** — 2×2 grid: Camera, Gallery, PDF, File
4. **Info Text** — Supported formats and file size limit
5. **Clipboard Option** — Conditional, shown only if clipboard has image

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Camera | Grid tile | "Camera" | Open device camera |
| Gallery | Grid tile | "Gallery" | Open image picker |
| PDF | Grid tile | "PDF" | Open file picker (PDF filter) |
| File | Grid tile | "File" | Open file picker (all supported) |
| Clipboard | Outline, full width | "Paste from Clipboard" | Paste clipboard image |
| Close | Icon (web only) | ✕ | Close modal |

### Form Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| For (profile) | Dropdown | Auto-selected | Defaults to active profile, can change |

### User Actions
- Select a source → Opens respective native picker
- After file/image selected → Navigate to File Preview Screen
- Change "For" profile → Switches which member the report will be saved under
- Swipe down (mobile) → Dismiss bottom sheet
- Click outside (web) → Close modal

### Empty State
- N/A

### Error State
```
File too large:     "This file is too large (over 20 MB). Please choose a smaller file."
                    (Snackbar, red)
Unsupported:        "This file type is not supported. Please use JPG, PNG, or PDF."
                    (Snackbar, red)
Camera denied:      "Camera access is needed to take photos of reports. 
                     Please allow camera access in your phone settings."
                    (Info card with "Open Settings" button)
```

### Success State
- File selected → Smooth transition to File Preview Screen

### Suggested Microcopy
```
Title:           "Upload a Report"
Subtitle:        "Take a photo or select a file"
For label:       "For:"
Camera:          "Camera"
Camera hint:     "Take a photo of your report"
Gallery:         "Gallery"
Gallery hint:    "Choose from saved photos"
PDF:             "PDF"
PDF hint:        "Select a PDF document"
File:            "File"
File hint:       "Choose any supported file"
Format note:     "Supported: JPG, PNG, PDF"
Size note:       "Maximum file size: 20 MB"
Clipboard:       "Paste from Clipboard"
Web drop zone:   "Drag & drop your file here, or click to browse"
```

### Mobile Layout Notes
- Bottom sheet with drag handle (slides up from bottom)
- Peek height: ~70% of screen
- Swipe down to dismiss
- 2×2 grid of source tiles (centered, 8px gap)
- Each tile: icon (32px) + label (12px), white bg, rounded corners, subtle border
- Source tiles should have ripple/press effect

### Web Layout Notes
- Centered modal (max-width 520px, shadow-xl, 16px border-radius)
- Primary: drag-and-drop zone (large, dashed border)
- Secondary: source buttons below drop zone (row layout)
- Drop zone hover: border becomes solid teal, background Teal-50
- Drop zone active (file dragged over): scale up slightly, teal border pulsing

---

## Screen 10: Select Family Member Screen

### Purpose
Choose which family member a report belongs to. Shown when user has multiple profiles and uploads a report.

### Layout (Bottom Sheet)

```
┌─────────────────────────────────┐
│  ── (drag handle) ──            │
│                                 │
│   Who is this report for?       │  ← 18px, Bold
│                                 │
│   ┌───────────────────────────┐ │
│   │ ┌──┐                     │ │
│   │ │YK│ Yogesh (You)      ✓ │ │  ← Selected member (teal bg tint)
│   │ └──┘                     │ │
│   ├───────────────────────────┤ │
│   │ ┌──┐                     │ │
│   │ │MA│ Maa (Mother)        │ │
│   │ └──┘                     │ │
│   ├───────────────────────────┤ │
│   │ ┌──┐                     │ │
│   │ │PA│ Papa (Father)       │ │
│   │ └──┘                     │ │
│   ├───────────────────────────┤ │
│   │ ┌──┐                     │ │
│   │ │PR│ Priya (Wife)        │ │
│   │ └──┘                     │ │
│   └───────────────────────────┘ │
│                                 │
│   + Add New Member              │  ← Text link, Teal-600
│                                 │
│   ┌───────────────────────────┐ │
│   │       Continue            │ │  ← Primary button
│   └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Drag handle + "Who is this report for?" (18px, bold)

### Main Sections
1. **Question** — "Who is this report for?"
2. **Member List** — Radio-style list of family members with avatars
3. **Add New** — Link to add new member inline
4. **Continue Button** — Proceed with selection

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Continue | Primary, full width | "Continue" | Use selected member → proceed in upload flow |
| Add New | Text link | "+ Add New Member" | Navigate to Add Family Member |

### User Actions
- Tap a member → Select (radio behavior, single select)
- Tap Continue → Proceed with selected member
- Tap Add New → Open Add Family Member screen

### Empty State
- Only shows "You" if no family members added. "Add New Member" prominently displayed.

### Error State
- N/A (always has at least the primary user)

### Success State
- Member selected → Continue to File Preview with member context

### Suggested Microcopy
```
Title:      "Who is this report for?"
You label:  "Yogesh (You)"
Add new:    "+ Add New Member"
Button:     "Continue"
```

### Mobile Layout Notes
- Bottom sheet, list of members
- Each row: 56px height, avatar (36px) + name + relation in parentheses
- Selected row: Teal-50 background + checkmark icon right
- Scrollable if many members

### Web Layout Notes
- Can be inline dropdown or radio group in the upload modal
- Not a separate screen on web

---

## Screen 11: File Preview Screen

### Purpose
Preview the uploaded/captured document before AI processing. Users can crop, rotate, adjust, and add multiple pages.

### Layout

```
┌─────────────────────────────────┐
│  ←  Preview             Retake  │  ← Back + title + retake link
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  │    DOCUMENT PREVIEW       │  │  ← Full-width preview of captured/selected
│  │    (Image/PDF preview)    │  │     document with pinch-to-zoom
│  │                           │  │     65% of screen height
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐      │  ← Toolbar: rotate, crop, brightness, contrast
│  │ ↻ │ │ ✂ │ │ ☀ │ │ ◐ │      │     Icon buttons, 44×44px each
│  │Rot│ │Crp│ │Brt│ │Con│      │
│  └───┘ └───┘ └───┘ └───┘      │
│                                 │
│  Pages: 1 of 1                  │  ← Page indicator
│  ┌───┐                         │
│  │ 1 │  [+ Add Page]           │  ← Page thumbnails + add more
│  └───┘                         │
│                                 │
│  For: Yogesh (You)              │  ← Profile context
│                                 │
│  ┌───────────────────────────┐  │
│  │   Continue to AI Reading  │  │  ← Primary button
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (←) + "Preview" (18px) + "Retake" text link (right side)

### Main Sections
1. **Document Preview** — Large preview area (65% of screen)
2. **Editing Toolbar** — Rotate, Crop, Brightness, Contrast icons
3. **Page Management** — Page count, thumbnails, add page button
4. **Profile Context** — Shows which member this report is for
5. **Continue Button** — Proceed to AI processing

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Rotate | Icon button | ↻ | Rotate 90° clockwise |
| Crop | Icon button | ✂ | Enter crop mode (drag corners) |
| Brightness | Icon button | ☀ | Adjust brightness slider |
| Contrast | Icon button | ◐ | Adjust contrast slider |
| Add Page | Text + icon | "+ Add Page" | Open source selector for another page |
| Continue | Primary, full width | "Continue to AI Reading" | Start AI processing |
| Retake | Text link | "Retake" | Go back to source selection |

### User Actions
- Pinch to zoom on preview
- Tap rotate → Rotates 90° each tap
- Tap crop → Shows crop handles, user drags corners, tap "Apply" or "Cancel"
- Tap brightness/contrast → Shows slider at bottom
- Tap "Add Page" → Opens source selector, adds page to thumbnail strip
- Tap page thumbnail → Switches preview to that page
- Long press page thumbnail → Delete page (with confirmation)
- Tap Continue → Starts AI processing

### Empty State
- N/A (always has at least one document)

### Error State
```
Image too blurry:   "This image looks blurry. For best results, retake the photo 
                     with good lighting." (Warning banner, yellow, with "Continue Anyway" option)
Image too dark:     "This image is very dark. Try increasing brightness or retaking."
```

### Success State
- Continue tapped → Smooth transition to AI Processing Screen

### Suggested Microcopy
```
Title:          "Preview"
Retake:         "Retake"
Continue:       "Continue to AI Reading"
Add page:       "+ Add Page"
Pages:          "Page 1 of 3"
Blurry warning: "This image looks blurry. For best results, retake with good lighting."
Continue anyway: "Continue Anyway"
Delete page:    "Remove this page?"
For label:      "For: Yogesh (You)"
```

### Mobile Layout Notes
- Preview area fills most of screen
- Toolbar icons at bottom of preview area (overlay or below)
- Page thumbnails: horizontal scroll strip, 60×80px each
- Pinch-to-zoom on preview
- Crop mode: full-screen overlay with draggable corners
- Brightness/contrast: horizontal slider appears at bottom

### Web Layout Notes
- Preview centered (max-width 800px)
- Toolbar icons along top of preview (not bottom)
- Larger page thumbnails on the side (left sidebar in preview area)
- Crop uses standard web crop UI (drag handles)
- Drag and drop to reorder pages

---

## Screen 12: AI Processing Screen

### Purpose
Show progress while AI reads and extracts data from the uploaded report. Keeps the user informed and engaged during wait time (10-30 seconds).

### Layout

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│         ┌─────────────┐         │
│         │             │         │
│         │   📄 ✨     │         │  ← Animated document icon
│         │  (Lottie    │         │     Document with sparkle/scan animation
│         │   animation)│         │     Icon pulses, sparkles move
│         │             │         │
│         └─────────────┘         │
│                                 │
│     Reading your report...      │  ← 20px, Bold, Gray-900
│                                 │
│     ████████████░░░░░  72%      │  ← Progress bar: Teal-600 fill
│                                 │     Height: 6px, border-radius: 3px
│                                 │
│     ✓ Document uploaded         │  ← 14px, Green-500, checkmark
│     ✓ Text extracted            │  ← 14px, Green-500, checkmark
│     ● Finding medical values... │  ← 14px, Teal-600, filled dot (active)
│     ○ Organizing data           │  ← 14px, Gray-400, empty dot (pending)
│                                 │
│                                 │
│     This usually takes          │  ← 13px, Gray-400
│     10-20 seconds               │
│                                 │
│                                 │
│                                 │
│     🔒 Your data is encrypted   │  ← 12px, Gray-400, trust indicator
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- No navigation header (user cannot leave this screen during processing)
- No back button

### Main Sections
1. **Animation** — Animated document/AI icon (centered, ~120×120px)
2. **Status Text** — "Reading your report..." (changes as steps complete)
3. **Progress Bar** — Linear progress bar showing actual progress
4. **Step Checklist** — 4 steps with status indicators
5. **Wait Time** — Expected duration text
6. **Trust Badge** — Security assurance at bottom

### Buttons
- None visible during processing
- If processing takes > 45 seconds: Show "Taking longer than expected... [Cancel]" with cancel text link

### Form Fields
- None

### Cards/Components
- Animated icon (Lottie/CSS animation, 120×120px)
- Progress bar (full width - 64px margin, 6px height, rounded)
- Step checklist items (4 items, vertically stacked)
  - Completed: ✓ green icon + text
  - Active: ● teal filled dot + text (can include ellipsis animation)
  - Pending: ○ gray outline dot + text
- Wait time text
- Trust badge (lock icon + text)

### User Actions
- Wait for processing to complete (auto-navigates)
- If > 45s: Tap "Cancel" → Return to File Preview with option to retry
- Android: App can be backgrounded, notification when done

### Empty State
- N/A

### Error State
```
Processing failed:  Screen transitions to error state:
                    
                    ┌───────────────────────────────┐
                    │                               │
                    │         ❌                     │
                    │                               │
                    │  Couldn't read this report    │
                    │                               │
                    │  The image might be unclear   │
                    │  or the report format may     │
                    │  not be supported yet.        │
                    │                               │
                    │  ┌───────────────────────┐    │
                    │  │   Try Again            │    │  ← Primary button
                    │  └───────────────────────┘    │
                    │  ┌───────────────────────┐    │
                    │  │  Upload Different File │    │  ← Secondary button
                    │  └───────────────────────┘    │
                    │                               │
                    │  Save without AI reading →    │  ← Text link
                    │                               │
                    └───────────────────────────────┘

Timeout:           "Taking much longer than expected. The report might be 
                    complex. You can wait or try with a different file."
                    [Keep Waiting] [Cancel]
```

### Success State
- All steps complete → Checkmark animation → Auto-navigate to Review Screen (0.5s delay)

### Suggested Microcopy
```
Processing:       "Reading your report..."
Step 1 done:      "✓ Document uploaded"
Step 2 done:      "✓ Text extracted"
Step 3 active:    "● Finding medical values..."
Step 3 done:      "✓ Medical values found"
Step 4 active:    "● Organizing data..."
Step 4 done:      "✓ Data organized"
Wait:             "This usually takes 10-20 seconds"
Long wait:        "Taking a bit longer than usual. Almost there..."
Cancel:           "Cancel"
Fail title:       "Couldn't read this report"
Fail body:        "The image might be unclear or the format may not be supported yet."
Retry:            "Try Again"
Different:        "Upload Different File"
Save anyway:      "Save without AI reading →"
Trust:            "🔒 Your data is encrypted and processed securely"
```

### Mobile Layout Notes
- Full screen, no navigation
- Content centered vertically (slight upward offset)
- Animation: 120×120px Lottie
- Progress bar: 16px horizontal margin
- Prevent back gesture/button (show confirmation if pressed)
- If app backgrounded → Continue processing, show notification on complete

### Web Layout Notes
- Full-page centered content (same as mobile layout)
- Or shown as a modal overlay on the Upload page
- Progress bar max-width 400px
- Animation can be larger (160×160px)
- Browser tab title shows: "Processing... (72%) — MediVault"

---

## Screen 13: AI Extracted Data Review Screen

### Purpose
Display all values extracted by AI from the report. Users can verify, edit incorrect values, add missing values, and reference the original document.

### Layout

```
┌─────────────────────────────────┐
│  ←  Review Extracted Data       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ℹ️ AI found these values   │  │  ← Info banner (blue-50 bg)
│  │ in your report. Please    │  │     Dismissible with ✕
│  │ check and edit if needed. │  │
│  └───────────────────────────┘  │
│                                 │
│  Report Type: Blood Test Report │  ← Auto-detected type (editable chip)
│  Date Found: 15 Jun 2026       │  ← Auto-detected date
│                                 │
│  EXTRACTED VALUES               │  ← Section label
│                                 │
│  ┌───────────────────────────┐  │
│  │ Hemoglobin                │  │
│  │ ┌────────┐               │  │
│  │ │ 14.2   │ g/dL     [✎] │  │  ← Value field + unit + edit button
│  │ └────────┘               │  │     Status: 🟢 Normal (13-17)
│  │ Normal range: 13-17 g/dL │  │
│  ├───────────────────────────┤  │
│  │ Fasting Sugar          ⚠️ │  │  ← ⚠️ = low confidence from AI
│  │ ┌────────┐               │  │
│  │ │ 142    │ mg/dL    [✎] │  │
│  │ └────────┘               │  │     Status: 🟡 High (70-110)
│  │ Normal range: 70-110     │  │
│  ├───────────────────────────┤  │
│  │ HbA1c                    │  │
│  │ ┌────────┐               │  │
│  │ │ 7.1    │ %        [✎] │  │     Status: 🔴 Critical (<5.7)
│  │ └────────┘               │  │
│  │ Normal range: <5.7 %     │  │
│  ├───────────────────────────┤  │
│  │ Total Cholesterol         │  │
│  │ ┌────────┐               │  │
│  │ │ 195    │ mg/dL    [✎] │  │     Status: 🟢 Normal (<200)
│  │ └────────┘               │  │
│  │ Normal range: <200 mg/dL │  │
│  ├───────────────────────────┤  │
│  │ HDL Cholesterol           │  │
│  │ ┌────────┐               │  │
│  │ │ 48     │ mg/dL    [✎] │  │     Status: 🟢 Normal (>40)
│  │ └────────┘               │  │
│  │ Normal range: >40 mg/dL  │  │
│  └───────────────────────────┘  │
│                                 │
│  [+ Add a Value We Missed]      │  ← Text button, Teal-600
│                                 │
│  ┌───────────────────────────┐  │
│  │  📄 View Original Report  │  │  ← Outline button to reference original
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Looks Good — Continue →  │  │  ← Primary button (sticky bottom)
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### When editing a value (inline edit mode):

```
│  Fasting Sugar          ⚠️    │
│  ┌────────────────────────┐   │
│  │ 142                    │   │  ← Input becomes editable
│  └────────────────────────┘   │     Border turns Teal-600
│  Unit: mg/dL                  │
│  [Save] [Cancel]              │  ← Inline save/cancel
│  (Edited ✎)                   │  ← Yellow "edited" badge appears after save
```

### Header/Title
- Back arrow (←) + "Review Extracted Data" (18px, semi-bold)

### Main Sections
1. **Info Banner** — Instruction text explaining what to do
2. **Report Meta** — Auto-detected report type and date
3. **Values List** — Each extracted parameter with value, unit, normal range, status
4. **Add Missing** — Button to manually add a value AI missed
5. **View Original** — Button to see the uploaded document
6. **Continue Button** — Sticky at bottom

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Edit (per row) | Icon button | ✎ | Make value field editable inline |
| Save (inline) | Small primary | "Save" | Save edited value |
| Cancel (inline) | Small text | "Cancel" | Discard edit |
| Add Missing | Text button | "+ Add a Value We Missed" | Open add value form |
| View Original | Outline, full width | "📄 View Original Report" | Open document in bottom sheet/modal |
| Continue | Primary, full width, sticky | "Looks Good — Continue →" | Proceed to Tag & Save |
| Back | Icon, top-left | ← | Go back (with "unsaved changes" warning if edited) |

### Form Fields (when editing)
| Field | Type | Validation |
|-------|------|-----------|
| Value | Number input | Required, numeric |
| Unit | Dropdown or text | Auto-filled, editable |

### Add Missing Value form (inline/bottom sheet):
| Field | Type | Required |
|-------|------|----------|
| Parameter Name | Text input with autocomplete | Yes |
| Value | Number input | Yes |
| Unit | Dropdown | Yes |

### Cards/Components

**Value Row Component:**
- Height: ~80px
- Layout: Parameter name (14px bold) + confidence warning icon (if low) | Value display (18px mono bold) + unit (12px gray) + edit icon | Normal range text (12px, gray) + status indicator (colored dot + text)
- Status colors: Green=normal, Amber=borderline, Red=out of range
- Left color bar: 3px matching status color
- Edited badge: Yellow chip "Edited ✎" (shown after user modifies value)
- Low confidence: ⚠️ amber warning icon next to parameter name

**Info Banner:**
- Background: Blue-50 (#EFF6FF)
- Border: 1px Blue-200
- Icon: ℹ️ info circle
- Dismissible ✕ button
- Border-radius: 8px

### User Actions
- Scroll through all values
- Tap ✎ on any row → Value becomes editable input
- Edit value → Tap Save → Yellow "Edited" badge appears
- Tap "+ Add Missing" → Inline form or bottom sheet with autocomplete parameter names
- Tap "View Original" → Original document opens in bottom sheet (mobile) or side panel (web)
- Tap "Continue" → Proceed to Tag & Save screen
- Swipe/scroll to see all values

### Empty State
```
AI found no values:
    "We couldn't find any medical values in this report. 
     It might be a prescription or a different type of document.
     You can add values manually or save the report as-is."
    
    [+ Add Values Manually]
    [Save Without Values]
```

### Error State
```
Invalid edit value:  "Please enter a valid number." (red text below input)
Network error:       "Couldn't save changes. Check your connection." (snackbar)
```

### Success State
- Value edited → Brief green flash on the row + "Edited" badge
- All edits done → Tap Continue → Navigate to Tag & Save

### Suggested Microcopy
```
Title:         "Review Extracted Data"
Info banner:   "AI found these values in your report. Please check and edit if needed."
Low confidence: "⚠️ We weren't fully sure about this value. Please verify."
Edit hint:     "Tap ✎ to edit a value"
Add missing:   "+ Add a Value We Missed"
View original: "📄 View Original Report"
Continue:      "Looks Good — Continue →"
Edited badge:  "Edited ✎"
No values:     "We couldn't find any medical values in this report."
Add manually:  "+ Add Values Manually"
Save without:  "Save Without Values"
Normal range:  "Normal range: 13-17 g/dL"
```

### Mobile Layout Notes
- Scrollable list of value rows
- "Continue" button sticky at bottom (always visible)
- "View Original" opens bottom sheet with document preview
- Edit mode: keyboard opens, scroll to edited field
- Pull down on bottom sheet (original doc) to dismiss

### Web Layout Notes
- **Split-screen layout:**
  - Left panel (50%): Extracted values list (scrollable)
  - Right panel (50%): Original document preview (always visible)
- This eliminates the need for "View Original" button — document is always visible for reference
- Continue button at bottom of left panel
- Edited values highlighted with yellow left border

---

## Screen 14: Report Saved Success Screen

### Purpose
Confirm that the report has been successfully processed and saved. Provide next-step options and a brief summary of what was stored.

### Layout

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│         ┌─────────────┐         │
│         │             │         │
│         │     ✓       │         │  ← Animated checkmark (Lottie)
│         │  (green     │         │     Green circle with white checkmark
│         │   circle)   │         │     Scales up + check draws animation
│         │             │         │
│         └─────────────┘         │
│                                 │
│   Report Saved Successfully!    │  ← 22px, Bold, Gray-900
│                                 │
│   Your Blood Test Report from   │  ← 14px, Gray-600, centered
│   City Diagnostics has been     │
│   safely stored and organized.  │
│                                 │
│   ┌───────────────────────────┐ │
│   │ 📄 Blood Test Report     │ │  ← Summary card
│   │    Date: 15 Jun 2026     │ │
│   │    Lab: City Diagnostics │ │
│   │    Values extracted: 8   │ │
│   │    For: Yogesh           │ │
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │     View Report           │ │  ← Primary button
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │    Upload Another         │ │  ← Secondary (outline) button
│   └───────────────────────────┘ │
│                                 │
│   Go to Dashboard               │  ← Text link, Teal-600
│                                 │
│   💡 Tip: Upload reports        │  ← 12px, Gray-400
│   regularly to track your       │     Tip card with light bulb
│   health trends over time.      │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- No navigation bar (full-screen success state)
- No back button

### Main Sections
1. **Success Animation** — Green checkmark animation
2. **Title** — "Report Saved Successfully!"
3. **Summary Text** — What was saved
4. **Summary Card** — Report metadata
5. **Action Buttons** — View, Upload Another, Dashboard link
6. **Pro Tip** — Encouragement to keep uploading

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| View Report | Primary, full width | "View Report" | Navigate to Report Detail |
| Upload Another | Outline, full width | "Upload Another" | Navigate to Upload Screen |
| Dashboard | Text link, centered | "Go to Dashboard" | Navigate to Home Dashboard |

### User Actions
- Tap "View Report" → Report Detail for the just-saved report
- Tap "Upload Another" → Upload source selection
- Tap "Go to Dashboard" → Home Dashboard
- Android back button → Home Dashboard

### Empty State
- N/A

### Error State
- N/A (this screen only shows on success)

### Success State
- This IS the success state. Animation plays once on entry.

### Suggested Microcopy
```
Title:         "Report Saved Successfully!"
Body:          "Your [Report Type] from [Lab Name] has been safely stored and organized."
View:          "View Report"
Upload:        "Upload Another"
Dashboard:     "Go to Dashboard"
Tip:           "💡 Tip: Upload reports regularly to track your health trends over time."
```

### Mobile Layout Notes
- Full screen, content centered vertically
- Animation: 100×100px Lottie, plays once
- Summary card: white bg, subtle shadow, 12px border-radius
- Buttons stack vertically with 12px gap
- Tip at bottom of screen

### Web Layout Notes
- Centered content (max-width 480px) on light background
- Same layout as mobile, scaled slightly
- Animation slightly larger (120×120px)

---

## Screen 15: Past Reports List Screen

### Purpose
Browse, search, filter, and manage all uploaded medical reports. The primary interface for finding and accessing historical reports.

### Layout

```
┌─────────────────────────────────┐
│  Reports               📊 ≡    │  ← Title + view toggle (list/grid)
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔍 Search reports...      │  │  ← Search bar
│  └───────────────────────────┘  │
│                                 │
│  ┌────┐┌─────┐┌────┐┌──────┐   │  ← Filter chips (horizontal scroll)
│  │All ││Blood││Scan││Presc.│   │     Active chip: Teal bg, white text
│  └────┘└─────┘└────┘└──────┘   │     Inactive: Gray-100 bg
│  ┌──────┐┌───────┐             │
│  │X-Ray ││ Other │             │
│  └──────┘└───────┘             │
│                                 │
│  Sort: Newest first ▾          │  ← Sort dropdown
│                                 │
│  JUNE 2026                      │  ← Date group header
│  ┌───────────────────────────┐  │
│  │ 📄  Blood Test Report     │  │  ← Report card
│  │     City Lab · Dr. Patel  │  │
│  │     15 Jun 2026           │  │
│  │     Sugar:142 HbA1c:7.1   │  │  ← Key values preview
│  │                        ›  │  │
│  ├───────────────────────────┤  │
│  │ 💊  Prescription          │  │
│  │     Dr. Shah              │  │
│  │     10 Jun 2026           │  │
│  │                        ›  │  │
│  ├───────────────────────────┤  │
│  │ 🦴  X-Ray — Left Knee    │  │
│  │     Radiology Center      │  │
│  │     5 Jun 2026            │  │
│  │                        ›  │  │
│  └───────────────────────────┘  │
│                                 │
│  MAY 2026                       │
│  ┌───────────────────────────┐  │
│  │ 📄  Thyroid Panel         │  │
│  │     Path Lab              │  │
│  │     28 May 2026           │  │
│  │     TSH:3.5 T3:1.2       │  │
│  │                        ›  │  │
│  ├───────────────────────────┤  │
│  │ 📄  Lipid Profile        │  │
│  │     City Lab              │  │
│  │     20 May 2026           │  │
│  │     Chol:225 HDL:48      │  │
│  │                        ›  │  │
│  └───────────────────────────┘  │
│                                 │
│              [+]                │  ← FAB
│  ┌───────────────────────────┐  │
│  │ Bottom Navigation         │  │
│  └───────────────────────────┘  │
```

### Header/Title
- "Reports" (22px, bold, left) + View toggle icons (list/grid) at right

### Main Sections
1. **Search Bar** — Full-width search input
2. **Filter Chips** — Horizontal scrollable category chips
3. **Sort Control** — Dropdown (Newest/Oldest)
4. **Reports List** — Grouped by month, each card shows key info
5. **FAB** — Quick upload

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Search | Input with icon | "Search reports..." | Filter reports by keyword |
| Filter chips | Toggle chips | Category names | Filter by report type |
| Sort | Dropdown | "Newest first ▾" | Change sort order |
| View toggle | Icon toggle | List/Grid icons | Switch between list and grid view |
| FAB | Floating | "+" | Upload new report |
| Report card | Tap area | — | Navigate to Report Detail |

### Cards/Components

**Report Card (List View):**
- Height: ~85px
- Left: Type icon (36×36, colored bg circle)
- Content: Title (14px bold) + Lab/Doctor (12px gray) + Date (12px gray) + Key values (12px, colored by status)
- Right: Chevron arrow (›)
- Bottom border: 1px Gray-100

**Report Card (Grid View):**
- Size: (screen-width - 48px) / 2
- Aspect: 4:5
- Top: Document thumbnail or type icon (large)
- Bottom: Title + date
- Border-radius: 12px, shadow-sm

**Search Bar:**
- Height: 44px
- Left icon: 🔍 magnifying glass
- Right: ✕ clear button (visible when text entered)
- Background: Gray-100
- Border-radius: 10px

### User Actions
- Type in search → Real-time filtering
- Tap filter chip → Toggle filter (multiple active supported)
- Tap sort → Change order
- Tap view toggle → Switch list/grid
- Tap report card → Report Detail
- Long press report card (mobile) / Right click (web) → Context menu: Share, Compare, Delete
- Swipe left on card (mobile) → Reveal: Share, Delete buttons
- Pull to refresh
- Scroll to bottom → Load more (pagination)

### Empty State
```
No reports at all:
    [Empty folder illustration]
    "No reports yet"
    "Upload your first medical report to see it here."
    [Upload Report]

No search results:
    [Magnifying glass illustration]
    "No reports found for 'xyz'"
    "Try different keywords or remove filters."
    [Clear Search]

No reports in category:
    "No blood test reports found."
    "Upload a blood test report to see it here."
```

### Error State
```
Load failed:     "Couldn't load your reports. Pull down to retry."
Delete failed:   "Couldn't delete the report. Please try again."
```

### Success State
```
Report deleted:  "Report deleted." (Snackbar with "Undo" action, 5 seconds)
```

### Suggested Microcopy
```
Title:            "Reports"
Search:           "Search reports..."
Filter default:   "All"
Sort:             "Newest first"
Empty title:      "No reports yet"
Empty body:       "Upload your first medical report to see it here."
No results:       "No reports found for '[query]'"
No results hint:  "Try different keywords or remove filters."
Delete confirm:   "Delete this report? This cannot be undone."
Deleted:          "Report deleted."
Undo:             "Undo"
```

### Mobile Layout Notes
- Bottom navigation visible (Reports tab active)
- Search bar below title, always visible
- Filter chips horizontal scroll
- Cards in list view by default
- Swipe-to-reveal actions on cards
- Long press → multi-select mode (for batch share/delete)
- FAB: 56×56px, bottom-right, above nav

### Web Layout Notes
- Sidebar navigation (Reports active)
- Search bar wider, right-aligned or below title
- Filter chips in a single row (more space)
- List/grid toggle in toolbar
- Right-click context menu on cards
- Grid view: 3-4 columns
- Pagination or infinite scroll
- Bulk select with checkboxes

---

## Screen 16: Report Detail Screen

### Purpose
Show complete details of a single report including original document, all extracted values with status indicators, and action options.

### Layout

```
┌─────────────────────────────────┐
│  ←  Blood Test Report    ⋮     │  ← Back + title + overflow menu
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │  📄 View Original Report  │  │  ← Tappable thumbnail of original
│  │  [Thumbnail preview]      │  │     document. Opens full-screen viewer.
│  │                           │  │     Height: 120px, gray bg
│  └───────────────────────────┘  │
│                                 │
│  REPORT INFORMATION             │  ← Section header
│  ┌───────────────────────────┐  │
│  │ Type      Blood Test      │  │  ← Key-value pairs
│  │ Date      15 Jun 2026     │  │
│  │ Lab       City Diagnostics│  │
│  │ Doctor    Dr. Patel       │  │
│  │ For       Yogesh          │  │
│  └───────────────────────────┘  │
│                                 │
│  EXTRACTED VALUES               │  ← Section header
│  ┌───────────────────────────┐  │
│  │ Hemoglobin                │  │
│  │ 14.2 g/dL           🟢   │  │  ← Value + status dot
│  │ Normal: 13-17 g/dL       │  │     Green = normal
│  ├───────────────────────────┤  │
│  │ Fasting Sugar             │  │
│  │ 142 mg/dL            🟡   │  │     Amber = borderline
│  │ Normal: 70-110 mg/dL     │  │
│  ├───────────────────────────┤  │
│  │ HbA1c                    │  │
│  │ 7.1 %                🔴   │  │     Red = out of range
│  │ Normal: <5.7 %            │  │
│  ├───────────────────────────┤  │
│  │ Total Cholesterol         │  │
│  │ 195 mg/dL            🟢   │  │
│  │ Normal: <200 mg/dL       │  │
│  ├───────────────────────────┤  │
│  │ HDL Cholesterol           │  │
│  │ 48 mg/dL             🟢   │  │
│  │ Normal: >40 mg/dL        │  │
│  └───────────────────────────┘  │
│                                 │
│  NOTES                          │
│  ┌───────────────────────────┐  │
│  │ Routine quarterly check.  │  │  ← User notes (if any)
│  │ [Edit Notes]              │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌────────────┐ ┌────────────┐  │
│  │ 📤 Share   │ │ 📊 Compare │  │  ← Action buttons (2 columns)
│  └────────────┘ └────────────┘  │
│  ┌────────────┐ ┌────────────┐  │
│  │ ✏️ Edit    │ │ 🗑️ Delete  │  │
│  └────────────┘ └────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow (←) + Report title (18px, semi-bold, truncated if long) + Overflow menu (⋮)
- Overflow menu: Edit Details, Share, Compare, Download, Delete

### Main Sections
1. **Original Document** — Thumbnail preview, tap to view full
2. **Report Information** — Type, date, lab, doctor, member
3. **Extracted Values** — All parameters with values, ranges, status
4. **Notes** — User-added notes section
5. **Action Buttons** — Share, Compare, Edit, Delete

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Share | Outline | "📤 Share" | Navigate to Doctor Sharing flow |
| Compare | Outline | "📊 Compare" | Navigate to Report Comparison |
| Edit | Outline | "✏️ Edit" | Enable editing of values |
| Delete | Outline (red) | "🗑️ Delete" | Confirmation dialog → Delete report |
| View Original | Card tap area | "📄 View Original" | Full-screen document viewer |
| Edit Notes | Text link | "Edit Notes" | Inline notes editing |

### User Actions
- Tap thumbnail → Full-screen document viewer (pinch to zoom)
- Tap value row → View parameter trend (analytics)
- Tap Share → Doctor sharing flow
- Tap Compare → Report comparison
- Tap Edit → Values become editable (same as Review screen editing)
- Tap Delete → "Delete this report?" confirmation dialog
- Scroll to view all sections

### Empty State
```
No extracted values:
    "No medical values were extracted from this report. 
     You can add values manually."
    [+ Add Values]
```

### Error State
```
Load failed:    "Couldn't load report details. Please try again."
Delete failed:  "Couldn't delete the report. Please try again."
```

### Success State
```
Edited:         "Report updated ✓" (green snackbar)
Deleted:        Navigate to Reports List with "Report deleted" snackbar
```

### Suggested Microcopy
```
View original:    "📄 View Original Report"
Information:      "REPORT INFORMATION"
Values:           "EXTRACTED VALUES"
Notes:            "NOTES"
Notes empty:      "No notes added. Tap to add a note."
Edit notes:       "Edit Notes"
Share:            "Share"
Compare:          "Compare"
Edit:             "Edit"
Delete:           "Delete"
Delete confirm:   "Delete this report? This action cannot be undone."
Delete yes:       "Delete"
Delete no:        "Cancel"
```

### Mobile Layout Notes
- Scrollable single column
- Thumbnail: full width, 120px height, rounded corners
- Value rows: full width with left color bar
- Action buttons: 2×2 grid at bottom
- Swipe between reports (left/right) in the list

### Web Layout Notes
- Two-column layout:
  - Left (40%): Original document viewer (larger, scrollable/zoomable)
  - Right (60%): Report info + values + actions
- Action buttons in a horizontal toolbar at top of right panel
- Values in a card with expand/collapse per section

---

## Screen 17: Analytics Dashboard

### Purpose
Provide a comprehensive view of health trends across all tracked parameters. Shows health score, individual parameter trends, and time-range filtering.

### Layout
*(Detailed in previous document — see Analytics Dashboard wireframe)*

Core layout summary:
```
┌─────────────────────────────────┐
│  Analytics           Export ↓   │
│                                 │
│  [3M] [6M] [1Y] [All]          │  ← Time range chips
│                                 │
│  ┌─ Health Score ─────────────┐ │
│  │  72/100 · Good             │ │  ← Circular gauge
│  │  Based on 12 reports       │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ HbA1c ───────────────────┐ │  ← Parameter cards with mini graphs
│  │  [Line graph]  7.1% ▲     │ │     Sorted by severity (worst first)
│  │  ⚠ Increasing trend       │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Fasting Sugar ───────────┐ │
│  │  [Line graph]  142 ▲      │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Blood Pressure ──────────┐ │
│  │  [Dual line]  120/80 ●    │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Cholesterol ─────────────┐ │
│  │  [Line graph]  225 ▲      │ │
│  └────────────────────────────┘ │
│                                 │
│  [+ Track New Parameter]       │
│                                 │
│  Bottom Nav                     │
└─────────────────────────────────┘
```

### Header/Title
- "Analytics" (22px bold) + "Export ↓" text button (right)

### Main Sections
1. **Time Range Selector** — Chip row: 3M, 6M, 1Y, All
2. **Health Score Card** — Circular gauge with score + label
3. **Parameter Trend Cards** — Sorted by severity, each with mini line graph
4. **Add Parameter** — Button to track new parameter

### User Actions
- Tap time range chip → Filter all graphs
- Tap parameter card → Navigate to Parameter Trend Graph (Screen 18)
- Tap Export → Generate PDF report of analytics
- Tap "+ Track New" → Select parameter to add from autocomplete list

### Empty State
```
"Upload at least 2 reports with the same test to see trends."
[Upload Report]
```

### Suggested Microcopy
```
Title:      "Analytics"
Score:      "Health Score: 72/100 · Good"
Score basis: "Based on 12 reports"
Export:     "Export ↓"
Track new:  "+ Track New Parameter"
Empty:      "Upload at least 2 reports with the same test to see your health trends."
```

### Mobile Layout Notes
- Single column, scrollable
- Parameter cards: full width, ~140px height each (including mini graph)
- Mini graphs: 100% width, 60px height
- Health score gauge: 80px diameter, centered

### Web Layout Notes
- 2-3 column grid of parameter cards
- Health score card spans full width at top
- Click a card → Right panel slides out with full graph
- Or click → navigates to dedicated parameter page

---

## Screen 18: Parameter Trend Graph Screen

### Purpose
Show detailed trend graph for a single health parameter with historical data, normal range visualization, and AI-generated insights.

### Layout

```
┌─────────────────────────────────┐
│  ←  HbA1c Trend                 │
│                                 │
│  Current Value                  │
│  7.1%                      🔴   │  ← 32px, Bold, monospace + status
│  Normal Range: < 5.7%          │  ← 12px, Gray-500
│  Last updated: 15 Jun 2026     │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │     ┌──────────────────┐  │  │  ← Green shaded band = normal range
│  │     │  Normal Range    │  │  │
│  │     └──────────────────┘  │  │
│  │         •                 │  │  ← Data points (dots) connected by line
│  │        / \    •           │  │     Tap dot → tooltip shows value + date
│  │       /   \  / \   •     │  │     Dots colored by status
│  │  •   /     \/   \ / \    │  │
│  │   \ /            •   \   │  │
│  │    •                  •  │  │
│  │                           │  │
│  │  Jan  Mar  May  Jul  Sep  │  │  ← X-axis labels
│  └───────────────────────────┘  │
│                                 │
│  [3M] [6M] [1Y] [All]          │  ← Time range chips
│                                 │
│  HISTORY                        │  ← Section header
│  ┌───────────────────────────┐  │
│  │ 15 Jun 2026    7.1%   🔴 │  │  ← Value history list
│  │ City Diagnostics          │  │     Each row: date, value, status, lab
│  ├───────────────────────────┤  │
│  │ 12 Mar 2026    6.8%   🟡 │  │
│  │ Path Lab                  │  │
│  ├───────────────────────────┤  │
│  │ 10 Dec 2025    6.2%   🟢 │  │
│  │ City Diagnostics          │  │
│  ├───────────────────────────┤  │
│  │ 08 Sep 2025    5.9%   🟢 │  │
│  │ Apollo Lab                │  │
│  └───────────────────────────┘  │
│                                 │
│  INSIGHT                        │  ← AI-generated insight
│  ┌───────────────────────────┐  │
│  │ 📊 Your HbA1c has         │  │  ← Info card, blue-50 bg
│  │ increased by 0.9% over   │  │
│  │ the last 9 months.        │  │
│  │ Consider consulting your  │  │
│  │ doctor about this trend.  │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow + "[Parameter Name] Trend" (18px, semi-bold)

### Main Sections
1. **Current Value Display** — Large value + status + normal range + last updated
2. **Trend Graph** — Interactive line chart with normal range band
3. **Time Range Selector** — Filter chips
4. **History List** — All recorded values chronologically
5. **Insight Card** — AI-generated trend observation

### User Actions
- Tap data point on graph → Show tooltip with exact value + date
- Pinch to zoom graph (mobile)
- Change time range → Graph updates
- Tap history row → Navigate to the report containing that value
- Scroll for full history

### Empty State
```
"Only 1 data point for HbA1c. Upload another report with this test to see trends."
(Shows single dot on graph)
```

### Error State
```
Load failed: "Couldn't load trend data. Pull down to retry."
```

### Suggested Microcopy
```
Current:     "Current Value"
Range:       "Normal Range: < 5.7%"
Updated:     "Last updated: 15 Jun 2026"
History:     "HISTORY"
Insight:     "INSIGHT"
Insight eg:  "Your HbA1c has increased by 0.9% over the last 9 months. Consider consulting your doctor about this trend."
Single pt:   "Upload another report with this test to see a trend."
```

### Mobile Layout Notes
- Graph takes ~40% of screen
- Interactive: tap dots for tooltips, pinch to zoom
- History list scrollable below graph
- Fixed time range chips between graph and history

### Web Layout Notes
- Larger graph area (60% width), history panel on right (40%)
- Hover on data points for tooltips
- Graph has zoom controls (+/-)
- History rows clickable → opens report in side panel

---

## Screen 19: Report Comparison Screen

### Purpose
Compare two reports of the same type side by side to see how values changed over time.

### Layout

```
┌─────────────────────────────────┐
│  ←  Compare Reports             │
│                                 │
│  ┌────────────┐ ┌────────────┐  │
│  │ REPORT A   │ │ REPORT B   │  │
│  │ 15 Jun '26 │ │ 12 Mar '26 │  │  ← Date headers
│  │ City Lab   │ │ Path Lab   │  │  ← Lab names
│  │ [Change ▾] │ │ [Change ▾] │  │  ← Dropdown to switch reports
│  └────────────┘ └────────────┘  │
│                                 │
│  COMPARISON                     │
│  ┌────────────────────────────┐ │
│  │            │ Report A │ B  │ │
│  │ Parameter  │ (Jun)    │(Mar)│ │
│  ├────────────┼──────────┼────┤ │
│  │ Hemoglobin │ 14.2  🟢│13.8│ │  ← Side-by-side values
│  │            │      +0.4  ▲ │ │  ← Change indicator
│  ├────────────┼──────────┼────┤ │
│  │ F. Sugar   │ 142   🟡│128 │ │
│  │            │     +14   ▲ │ │  ← Red arrow = worsened
│  ├────────────┼──────────┼────┤ │
│  │ HbA1c      │ 7.1   🔴│6.8 │ │
│  │            │     +0.3  ▲ │ │
│  ├────────────┼──────────┼────┤ │
│  │ Cholesterol│ 195   🟢│210 │ │
│  │            │     -15   ▼ │ │  ← Green arrow = improved
│  ├────────────┼──────────┼────┤ │
│  │ HDL        │ 48    🟢│ 42 │ │
│  │            │      +6   ▲ │ │
│  └────────────────────────────┘ │
│                                 │
│  SUMMARY                        │
│  ┌────────────────────────────┐ │
│  │ ✅ 2 values improved       │ │
│  │ ⚠️ 3 values worsened       │ │
│  │ ── 0 values unchanged      │ │
│  └────────────────────────────┘ │
│                                 │
│  [📤 Share Comparison]          │  ← Outline button
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow + "Compare Reports" (18px, semi-bold)

### Main Sections
1. **Report Selectors** — Two side-by-side dropdowns to select reports A and B
2. **Comparison Table** — Parameter-by-parameter comparison with change indicators
3. **Summary Card** — Improved/worsened/unchanged counts
4. **Share Button** — Share comparison as image/PDF

### User Actions
- Select Report A and B from dropdowns
- View side-by-side values with change arrows
- Tap "Share Comparison" → Generate shareable comparison

### Empty State
```
"Select two reports of the same type to compare their values."
[Select Report A ▾]  [Select Report B ▾]
```

### Error State
```
Different types: "These reports have different test types. For best comparison, choose reports of the same type."
No common values: "No common parameters found between these reports."
```

### Suggested Microcopy
```
Title:        "Compare Reports"
Select A:     "Select first report"
Select B:     "Select second report"
Change up:    "+14 ▲" (red if worsened, green if improved — context-dependent)
Change down:  "-15 ▼" (green if improved for cholesterol, etc.)
Improved:     "✅ 2 values improved"
Worsened:     "⚠️ 3 values worsened"
Unchanged:    "── 0 values unchanged"
Share:        "Share Comparison"
```

### Mobile Layout Notes
- Two-column comparison table
- Horizontal scroll if values are wide
- Report selectors side by side (50/50)
- Summary card at bottom

### Web Layout Notes
- Three-column table with more room
- Report selectors inline at top
- Summary panel on the right sidebar
- Export to PDF option

---

## Screen 20: Family Members Screen

### Purpose
View and manage all family member profiles. Switch between profiles and add new members.

### Layout

```
┌─────────────────────────────────┐
│  ←  Family Members              │
│                                 │
│  Manage medical reports for     │  ← 14px, Gray-500
│  your whole family.             │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ┌──┐                     │  │
│  │ │YK│ Yogesh Kumar      ✓ │  │  ← Active profile highlighted
│  │ └──┘ You · 12 reports    │  │     Green checkmark = currently viewing
│  │     Age: 32 · O+ · Diabetes│ │     Tap → switch to this profile
│  ├───────────────────────────┤  │
│  │ ┌──┐                     │  │
│  │ │MA│ Kamla Devi           │  │  ← Family member card
│  │ └──┘ Mother · 8 reports  │  │
│  │     Age: 58 · B+ · BP    │  │
│  │                      [⋮] │  │  ← Overflow: Edit, Delete
│  ├───────────────────────────┤  │
│  │ ┌──┐                     │  │
│  │ │PA│ Ramesh Kumar         │  │
│  │ └──┘ Father · 5 reports  │  │
│  │     Age: 62 · A+ · Diabetes│ │
│  │                      [⋮] │  │
│  ├───────────────────────────┤  │
│  │ ┌──┐                     │  │
│  │ │PR│ Priya Kumar          │  │
│  │ └──┘ Wife · 3 reports    │  │
│  │     Age: 29 · AB+         │  │
│  │                      [⋮] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  + Add Family Member      │  │  ← Outline button
│  └───────────────────────────┘  │
│                                 │
│  ℹ️ Switch profiles to view     │  ← 12px, Gray-400
│  their reports and analytics.   │
│                                 │
└─────────────────────────────────┘
```

### Header/Title
- Back arrow + "Family Members" (18px, semi-bold)

### Main Sections
1. **Intro Text** — Brief description
2. **Member Cards** — List of all members with profile summary
3. **Add Button** — Add new family member
4. **Info Text** — Hint about switching profiles

### User Actions
- Tap member card → Switch active profile (shows "Switched to [Name]" snackbar)
- Tap ⋮ → Edit Profile / View Reports / Delete Member
- Tap "Add" → Navigate to Add Family Member screen
- Delete confirmation → "Remove [Name] and all their reports? This cannot be undone."

### Empty State
```
"No family members added yet."
"Add your parents, spouse, or children to manage their medical reports too."
[+ Add Family Member]
```

### Suggested Microcopy
```
Title:       "Family Members"
Subtitle:    "Manage medical reports for your whole family."
You label:   "You · 12 reports"
Active:      "✓ Currently viewing"
Switched:    "Switched to Priya's profile"
Add:         "+ Add Family Member"
Delete title: "Remove family member?"
Delete body:  "This will remove [Name] and all their medical reports. This cannot be undone."
Info:        "Switch profiles to view their reports and analytics."
```

### Mobile Layout Notes
- Full-screen list
- Each card: ~90px height with avatar, name, relation, report count, quick health info
- Overflow menu (⋮) on right side of each card
- Add button: full width, outline style, at bottom of list

### Web Layout Notes
- Card grid layout (2-3 columns)
- Cards larger with more profile info visible
- Edit/Delete actions visible on hover
- Add button: prominent, top-right or bottom

---

## Screen 21: Doctor Sharing Screen

### Purpose
Select reports to share with a doctor via a secure, time-limited link.

### Layout

```
┌─────────────────────────────────┐
│  ←  Share with Doctor           │
│                                 │
│  Select reports to share.       │  ← 14px, Gray-500
│  A secure link will be created. │
│                                 │
│  SELECT REPORTS                 │
│  ☐ Select All                   │  ← 14px, Teal-600
│  ┌───────────────────────────┐  │
│  │ ☑ Blood Test Report       │  │  ← Checkbox + report name + date
│  │   15 Jun 2026             │  │
│  ├───────────────────────────┤  │
│  │ ☑ Thyroid Panel           │  │
│  │   10 Jun 2026             │  │
│  ├───────────────────────────┤  │
│  │ ☐ Prescription            │  │
│  │   10 Jun 2026             │  │
│  ├───────────────────────────┤  │
│  │ ☐ X-Ray — Left Knee      │  │
│  │   5 Jun 2026              │  │
│  └───────────────────────────┘  │
│                                 │
│  INCLUDE WITH REPORTS           │
│  ☑ Health summary & analytics  │  ← Toggle options
│  ☐ Medical history timeline    │
│                                 │
│  LINK SETTINGS                  │
│  Link expires after:            │
│  ┌──────┐ ┌─────┐ ┌──────┐    │
│  │ 24hr │ │ 7d  │ │ 30d  │    │  ← Chip selector (single select)
│  └──────┘ └─────┘ └──────┘    │
│                                 │
│  Password protect:  [Toggle ON] │  ← Toggle switch
│  ┌───────────────────────────┐  │
│  │ Enter password             │  │  ← Shown when toggle is ON
│  └───────────────────────────┘  │
│                                 │
│  Doctor's name (optional):      │
│  ┌───────────────────────────┐  │
│  │ Dr. Patel                  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   Create Secure Link 🔗   │  │  ← Primary button
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

After link is generated:

```
│                                 │
│         🔗 ✓                    │  ← Link icon with checkmark
│                                 │
│   Secure link created!          │  ← 20px, Bold
│                                 │
│   Share this link with your     │  ← 14px, Gray-600
│   doctor. It expires on         │
│   28 Jun 2026.                  │
│                                 │
│   ┌───────────────────────────┐ │
│   │ https://share.medivault   │ │  ← Link display (truncated)
│   │ .in/r/abc123              │ │
│   │                   [Copy]  │ │  ← Copy button inside
│   └───────────────────────────┘ │
│                                 │
│   ┌─────────┐ ┌─────────┐      │
│   │WhatsApp │ │ Email   │      │  ← Share buttons
│   └─────────┘ └─────────┘      │
│   ┌─────────┐ ┌─────────┐      │
│   │  SMS    │ │  More   │      │
│   └─────────┘ └─────────┘      │
│                                 │
│   Your reports stay safe with   │  ← 12px, Gray-400
│   you. Doctors only see what    │
│   you share.                    │
```

### Header/Title
- Back arrow + "Share with Doctor" (18px, semi-bold)

### Main Sections
1. **Report Selection** — Checklist of reports with select all
2. **Include Options** — Additional data to include
3. **Link Settings** — Expiry, password protection
4. **Doctor Name** — Optional field
5. **Create Button** → After clicking: **Share Link Card** with sharing options

### Buttons
| Button | Type | Label | Action |
|--------|------|-------|--------|
| Select All | Checkbox + text | "Select All" | Toggle all checkboxes |
| Create Link | Primary, full width | "Create Secure Link 🔗" | Generate shareable link |
| Copy | Small, inside link card | "Copy" | Copy link to clipboard |
| WhatsApp | Icon + text | "WhatsApp" | Share via WhatsApp |
| Email | Icon + text | "Email" | Share via email |
| SMS | Icon + text | "SMS" | Share via SMS |
| More | Icon + text | "More" | OS share sheet |

### Form Fields
| Field | Type | Required |
|-------|------|----------|
| Report checkboxes | Multi-select checkboxes | At least 1 required |
| Include checkboxes | Multi-select toggles | Optional |
| Link expiry | Chip selector (single) | Required, default 7 days |
| Password protect | Toggle | Optional |
| Password | Text input (hidden chars) | Required if toggle on |
| Doctor name | Text input | Optional |

### User Actions
- Select reports → Select at least one
- Configure link settings → Set expiry, password
- Tap "Create Secure Link" → Generate link, show sharing options
- Tap share option → Open respective app with link
- Tap Copy → "Link copied ✓" snackbar

### Empty State
```
No reports: "You don't have any reports to share yet."
            [Upload Report]
```

### Error State
```
No reports selected: "Please select at least one report to share."
Link creation failed: "Couldn't create the link. Please try again."
```

### Success State
```
Link created: Show the share link card with options
Link copied:  "Link copied to clipboard ✓" (green snackbar)
```

### Suggested Microcopy
```
Title:        "Share with Doctor"
Subtitle:     "Select reports to share. A secure link will be created."
Select all:   "Select All"
Include:      "INCLUDE WITH REPORTS"
Include 1:    "Health summary & analytics"
Include 2:    "Medical history timeline"
Expiry label: "Link expires after:"
Password:     "Password protect:"
Password hint: "Anyone with the link will need this password"
Doctor label: "Doctor's name (optional):"
Create:       "Create Secure Link 🔗"
Success:      "Secure link created!"
Expiry note:  "Share this link with your doctor. It expires on 28 Jun 2026."
Copy:         "Copy"
Copied:       "Link copied to clipboard ✓"
Trust:        "Your reports stay safe with you. Doctors only see what you share."
```

### Mobile Layout Notes
- Scrollable form
- Share buttons in 2×2 grid after link generated
- WhatsApp button prominent (common in India)
- Link card has "Copy" button right-aligned

### Web Layout Notes
- Two-column: report selection on left, link settings on right
- Share options as icons in a row
- "Copy to clipboard" uses browser API

---

## Screen 22: Reminder Screen

### Purpose
View, create, and manage health reminders for tests, medications, and doctor appointments.

### Layout

```
┌─────────────────────────────────┐
│  ←  Reminders                   │
│                                 │
│  ACTIVE (3)                     │  ← Section header with count
│  ┌───────────────────────────┐  │
│  │ ⏰ HbA1c Test              │  │  ← Reminder card
│  │   📅 25 Jun 2026 · In 4 days│ │
│  │   For: Yogesh              │  │
│  │   Repeat: Every 3 months  │  │
│  │   [Mark Done] [Edit] [⋮]  │  │
│  ├───────────────────────────┤  │
│  │ 💊 Vitamin D Supplement    │  │
│  │   📅 Daily · Next: Tomorrow│  │
│  │   For: Maa                 │  │
│  │   [Mark Done] [Edit] [⋮]  │  │
│  ├───────────────────────────┤  │
│  │ 🏥 Dr. Patel Follow-up    │  │
│  │   📅 30 Jun 2026 · In 9 days│ │
│  │   For: Yogesh              │  │
│  │   [Mark Done] [Edit] [⋮]  │  │
│  └───────────────────────────┘  │
│                                 │
│  COMPLETED (2)              ▾   │  ← Collapsible section
│  ┌───────────────────────────┐  │
│  │ ✓ Blood Test              │  │  ← Completed, struck-through text
│  │   Done on 15 Jun 2026     │  │     Dimmed appearance
│  ├───────────────────────────┤  │
│  │ ✓ Eye Checkup             │  │
│  │   Done on 1 Jun 2026      │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  + Add Reminder            │  │  ← Primary button
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Add Reminder Form (Bottom Sheet or New Screen):

```
│   Add Reminder                  │
│                                 │
│   Title *                       │
│   ┌───────────────────────────┐ │
│   │ HbA1c Test                │ │  ← Text input with suggestions
│   └───────────────────────────┘ │
│   Suggested: HbA1c, Sugar,     │
│   Thyroid, Cholesterol, BP...  │
│                                 │
│   Date & Time *                 │
│   ┌───────────────────────────┐ │
│   │ 25 Jun 2026, 9:00 AM  📅 │ │
│   └───────────────────────────┘ │
│                                 │
│   Repeat                        │
│   ┌──────┐ ┌────────┐ ┌──────┐ │
│   │ None │ │Monthly │ │3-Mon.│ │
│   └──────┘ └────────┘ └──────┘ │
│   ┌────────┐ ┌────────┐        │
│   │ 6-Mon. │ │ Yearly │        │
│   └────────┘ └────────┘        │
│                                 │
│   Notify me                     │
│   ┌────────────┐ ┌──────────┐  │
│   │ On the day │ │ 1 day    │  │
│   └────────────┘ │ before   │  │
│   ┌────────────┐ └──────────┘  │
│   │ 3 days     │               │
│   │ before     │               │
│   └────────────┘               │
│                                 │
│   For: Yogesh ▾                 │  ← Member dropdown
│                                 │
│   Notes (optional)              │
│   ┌───────────────────────────┐ │
│   │                           │ │
│   └───────────────────────────┘ │
│                                 │
│   [Save Reminder]               │
```

### Main Sections
1. **Active Reminders** — Current/future reminders sorted by date
2. **Completed Reminders** — Past completed reminders (collapsible)
3. **Add Button** — Create new reminder

### User Actions
- Tap "Mark Done" → Move to completed section
- Tap "Edit" → Edit reminder form
- Tap ⋮ → Snooze, Skip, Delete
- Tap "+ Add Reminder" → Add form
- Swipe card → Quick actions

### Empty State
```
"No reminders set. Stay on top of your health checkups."
[+ Add Reminder]
```

### Suggested Microcopy
```
Title:         "Reminders"
Active:        "ACTIVE (3)"
Completed:     "COMPLETED (2)"
Add:           "+ Add Reminder"
Mark done:     "Mark Done"
Done note:     "Done on 15 Jun 2026"
Empty:         "No reminders set. Stay on top of your health checkups."
Saved:         "Reminder set for 25 Jun 2026 ✓"
Title hint:    "What's this reminder for?"
Suggestions:   "Suggested: HbA1c Test, Blood Sugar, Thyroid, Cholesterol, Blood Pressure"
Repeat:        "Repeat"
Notify:        "Notify me"
```

### Mobile/Web Layout Notes
- Mobile: single column list, bottom sheet for add form
- Web: two-column — list on left, details/add form on right
- Calendar view option on web

---

## Screen 23: Emergency Card Screen

### Purpose
Display critical health information that can be shown to emergency responders without needing full app access.

### Layout

```
┌─────────────────────────────────┐
│  ←  Emergency Health Card       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ┌──────────────────────┐  │  │
│  │ │                      │  │  │
│  │ │   🆔 EMERGENCY       │  │  │  ← Card header (red accent)
│  │ │   HEALTH CARD        │  │  │
│  │ │                      │  │  │
│  │ ├──────────────────────┤  │  │
│  │ │                      │  │  │
│  │ │  ┌──┐                │  │  │
│  │ │  │👤│ YOGESH KUMAR   │  │  │  ← Name (18px bold)
│  │ │  └──┘                │  │  │
│  │ │  Age: 32 years       │  │  │
│  │ │  Blood Group: O+     │  │  │  ← Red badge for blood group
│  │ │  Gender: Male        │  │  │
│  │ │                      │  │  │
│  │ │  CONDITIONS           │  │  │
│  │ │  • Type 2 Diabetes   │  │  │
│  │ │  • Hypertension      │  │  │
│  │ │                      │  │  │
│  │ │  ALLERGIES            │  │  │
│  │ │  • Penicillin        │  │  │
│  │ │  • Sulfa drugs       │  │  │
│  │ │                      │  │  │
│  │ │  CURRENT MEDICATIONS  │  │  │
│  │ │  • Metformin 500mg BD│  │  │
│  │ │  • Amlodipine 5mg OD │  │  │
│  │ │                      │  │  │
│  │ │  EMERGENCY CONTACTS   │  │  │
│  │ │  Priya: +91 98765432 │  │  │  ← Tappable phone number
│  │ │  Maa: +91 98765433   │  │  │
│  │ │                      │  │  │
│  │ │  ┌──────────────────┐│  │  │
│  │ │  │    [QR CODE]     ││  │  │  ← QR code links to web emergency view
│  │ │  │                  ││  │  │
│  │ │  └──────────────────┘│  │  │
│  │ │  Scan for digital card│ │  │
│  │ │                      │  │  │
│  │ └──────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ Edit │ │Share │ │Print │   │  ← Action buttons
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  ℹ️ This card can be shown to   │
│  emergency responders.          │
│  Tap Edit to update your info.  │
│                                 │
└─────────────────────────────────┘
```

### Main Sections
1. **Emergency Card** — Styled card with all critical information
2. **Action Buttons** — Edit, Share, Print
3. **Info Text** — Usage instructions

### User Actions
- Tap "Edit" → Edit card details (conditions, allergies, medications, contacts)
- Tap "Share" → Share card image or link
- Tap "Print" → Generate printable PDF
- Tap phone number → Dial contact
- Tap QR code → Opens web version in browser

### Empty State
```
"Set up your Emergency Health Card. It can be life-saving in emergencies."
[Set Up Card]
(Form with: conditions, allergies, medications, emergency contacts)
```

### Suggested Microcopy
```
Title:       "Emergency Health Card"
Card header: "🆔 EMERGENCY HEALTH CARD"
Conditions:  "CONDITIONS"
Allergies:   "ALLERGIES"
Medications: "CURRENT MEDICATIONS"
Contacts:    "EMERGENCY CONTACTS"
QR label:    "Scan for digital card"
Info:        "This card can be shown to emergency responders. Tap Edit to update your info."
Empty:       "Set up your Emergency Health Card. It can be life-saving in emergencies."
No allergies: "No known allergies"
```

### Mobile Layout Notes
- Card is a styled component that looks like a physical ID card
- Red accent on top of card (emergency = red)
- QR code centered at bottom of card
- Phone numbers are tappable → auto-dial
- Consider: option to add as lock screen widget

### Web Layout Notes
- Card centered on page
- Print button generates high-quality PDF
- QR code links to public (no auth needed) emergency info page

---

## Screen 24: Settings Screen

### Purpose
Central hub for all app settings, preferences, and account management.

### Layout

```
┌─────────────────────────────────┐
│  ←  Settings                    │
│                                 │
│  ACCOUNT                        │  ← Section header (12px, gray, uppercase)
│  ┌───────────────────────────┐  │
│  │ 👤 Edit Profile         › │  │  ← Setting row: icon + label + chevron
│  ├───────────────────────────┤  │
│  │ 👥 Family Members       › │  │
│  ├───────────────────────────┤  │
│  │ 🔔 Notifications        › │  │
│  └───────────────────────────┘  │
│                                 │
│  REPORTS & DATA                 │
│  ┌───────────────────────────┐  │
│  │ 📋 Default View  List  ▾ │  │  ← Inline selector
│  ├───────────────────────────┤  │
│  │ 📏 Units       mg/dL  ▾  │  │  ← Inline selector
│  ├───────────────────────────┤  │
│  │ 📥 Import Reports       › │  │
│  ├───────────────────────────┤  │
│  │ 📤 Export All Data       › │  │
│  └───────────────────────────┘  │
│                                 │
│  SHARING & PRIVACY              │
│  ┌───────────────────────────┐  │
│  │ 🔗 Share History         › │  │
│  ├───────────────────────────┤  │
│  │ 🛡️ Privacy & Security    › │  │
│  ├───────────────────────────┤  │
│  │ 🤖 AI Processing    [ON] │  │  ← Toggle
│  └───────────────────────────┘  │
│                                 │
│  APP                            │
│  ┌───────────────────────────┐  │
│  │ 🌐 Language   English  ▾ │  │
│  ├───────────────────────────┤  │
│  │ 🎨 Theme      System   ▾ │  │  ← Light / Dark / System
│  ├───────────────────────────┤  │
│  │ 🔤 Text Size  Normal   ▾ │  │  ← Normal / Large / Extra Large
│  └───────────────────────────┘  │
│                                 │
│  SUPPORT                        │
│  ┌───────────────────────────┐  │
│  │ ❓ Help & FAQs           › │  │
│  ├───────────────────────────┤  │
│  │ 💬 Contact Support       › │  │
│  ├───────────────────────────┤  │
│  │ ⭐ Rate the App          › │  │
│  ├───────────────────────────┤  │
│  │ ℹ️ About MediVault       › │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🗑️ Delete My Account     │  │  ← Red text, danger zone
│  └───────────────────────────┘  │
│                                 │
│  Version 1.0.0                  │  ← 12px, Gray-400, centered
│                                 │
└─────────────────────────────────┘
```

### Main Sections
1. **Account** — Profile, Family, Notifications
2. **Reports & Data** — View preferences, units, import/export
3. **Sharing & Privacy** — Share history, privacy settings, AI toggle
4. **App** — Language, Theme, Text Size
5. **Support** — Help, Contact, Rate, About
6. **Danger Zone** — Delete account

### User Actions
- Tap any row with › → Navigate to that settings page
- Tap inline selectors → Dropdown changes immediately
- Toggle switches → Immediate effect
- Tap "Delete My Account" → Confirmation flow

### Suggested Microcopy
```
Title:          "Settings"
Edit profile:   "Edit Profile"
Family:         "Family Members"
Notifications:  "Notifications"
Default view:   "Default View"
Units:          "Preferred Units"
Import:         "Import Reports"
Export:          "Export All Data"
Share history:  "Share History"
Privacy:        "Privacy & Security"
AI toggle:      "AI Processing"
Language:       "Language"
Theme:          "Theme"
Text size:      "Text Size"
Help:           "Help & FAQs"
Contact:        "Contact Support"
Rate:           "Rate the App"
About:          "About MediVault"
Delete:         "Delete My Account"
Version:        "Version 1.0.0"
```

### Mobile/Web Layout Notes
- Mobile: grouped list with section headers, scrollable
- Web: sidebar settings nav on left, detail panel on right
- Settings rows: 52px height, full-width tap target

---

## Screen 25: Privacy & Security Screen

### Purpose
Show users how their data is protected and give them control over privacy settings.

### Layout

```
┌─────────────────────────────────┐
│  ←  Privacy & Security          │
│                                 │
│  DATA PROTECTION                │
│  ┌───────────────────────────┐  │
│  │ 🔒 Encryption Status     │  │
│  │                           │  │
│  │ ✓ Data encrypted at rest  │  │  ← Green checkmarks
│  │ ✓ Data encrypted in       │  │
│  │   transit (TLS 1.3)       │  │
│  │ ✓ End-to-end encrypted    │  │
│  │   sharing links           │  │
│  └───────────────────────────┘  │
│                                 │
│  AI PROCESSING                  │
│  ┌───────────────────────────┐  │
│  │ 🤖 AI processes reports   │  │
│  │    to extract medical     │  │
│  │    data.                  │  │
│  │                           │  │
│  │ Enable AI:         [ON]   │  │  ← Toggle
│  │                           │  │
│  │ If disabled, you'll need  │  │
│  │ to enter values manually. │  │
│  └───────────────────────────┘  │
│                                 │
│  DATA ACCESS                    │
│  ┌───────────────────────────┐  │
│  │ No third-party access     │  │  ← Info card
│  │ Your data is not shared   │  │
│  │ with any third parties.   │  │
│  └───────────────────────────┘  │
│                                 │
│  YOUR DATA                      │
│  ┌───────────────────────────┐  │
│  │ 📥 Download My Data     › │  │  ← Downloads ZIP of all data
│  ├───────────────────────────┤  │
│  │ 📄 View Privacy Policy  › │  │  ← Opens privacy policy
│  ├───────────────────────────┤  │
│  │ 📄 View Terms of Service› │  │  ← Opens ToS
│  └───────────────────────────┘  │
│                                 │
│  DANGER ZONE                    │
│  ┌───────────────────────────┐  │
│  │ 🗑️ Delete All My Data    │  │  ← Red text
│  │                           │  │
│  │ This permanently deletes  │  │
│  │ all your reports, profile │  │
│  │ and account. This cannot  │  │
│  │ be undone.                │  │
│  │                           │  │
│  │ [Delete My Account]       │  │  ← Red outline button
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Main Sections
1. **Data Protection** — Encryption status with green checkmarks
2. **AI Processing** — Toggle to enable/disable AI
3. **Data Access** — Third-party access info
4. **Your Data** — Download, privacy policy, terms
5. **Danger Zone** — Delete account/data

### User Actions
- Toggle AI processing → Immediate setting change
- Tap Download → Generates ZIP file → Download starts
- Tap Privacy Policy → Opens in-app browser
- Tap Delete → Multi-step confirmation:
  1. "Are you sure?" dialog
  2. Enter password/OTP
  3. Type "DELETE" to confirm
  4. Account deleted → Navigate to Login

### Empty State
- N/A

### Error State
```
Download failed: "Couldn't prepare your data. Please try again."
Delete failed:   "Couldn't delete your account. Please try again."
```

### Suggested Microcopy
```
Title:        "Privacy & Security"
Encryption:   "Encryption Status"
E2E:          "✓ Data encrypted at rest"
Transit:      "✓ Data encrypted in transit (TLS 1.3)"
Sharing:      "✓ End-to-end encrypted sharing links"
AI toggle:    "Enable AI Processing"
AI off note:  "If disabled, you'll need to enter medical values manually after uploading."
No third:     "Your data is not shared with any third parties."
Download:     "Download My Data"
Download note: "Download all your data as a ZIP file."
Delete title: "Delete All My Data"
Delete warn:  "This permanently deletes all your reports, profiles, and account. This action cannot be undone."
Delete btn:   "Delete My Account"
Confirm 1:    "Are you sure you want to delete your account and all data?"
Confirm 2:    "Type DELETE to confirm."
```

### Mobile/Web Layout Notes
- Mobile: scrollable settings page
- Web: rendered within Settings detail panel
- Delete flow should have strong friction (3-step confirmation)

---

## Screen 26: Admin Dashboard (Basic Layout)

### Purpose
Administrative dashboard for app operators to view system-wide stats, user activity, and manage content. Separate from the user-facing app — web-only.

### Layout

```
┌──────────┬────────────────────────────────────────────────┐
│          │  Admin Dashboard                    👤 Admin   │
│ ADMIN    │                                                │
│ PANEL    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────┐│
│          │  │  USERS   │ │ REPORTS  │ │ ACTIVE   │ │ AI ││
│ Dashboard│  │  12,450  │ │  58,320  │ │  3,210   │ │94% ││
│ Users    │  │  +340    │ │  +1,820  │ │  today   │ │rate││
│ Reports  │  │  this wk │ │  this wk │ │          │ │    ││
│ Analytics│  └──────────┘ └──────────┘ └──────────┘ └────┘│
│ AI Stats │                                                │
│ Feedback │  ┌─ User Growth ──────────────────────────┐   │
│ Settings │  │                                         │   │
│          │  │    [Area chart: daily signups over      │   │
│          │  │     last 30 days]                       │   │
│          │  │                                         │   │
│          │  └─────────────────────────────────────────┘   │
│          │                                                │
│          │  ┌─ Reports Uploaded ─────┐ ┌─ AI Processing ┐│
│          │  │                        │ │                 ││
│          │  │  [Bar chart: daily     │ │  Success: 94%   ││
│          │  │   uploads last 7 days] │ │  Partial: 4%    ││
│          │  │                        │ │  Failed: 2%     ││
│          │  └────────────────────────┘ └─────────────────┘│
│          │                                                │
│          │  ┌─ Recent Activity ──────────────────────┐   │
│          │  │ User #4521 uploaded 3 reports          │   │
│          │  │ User #4520 shared reports with doctor  │   │
│          │  │ User #4519 signed up via Google        │   │
│          │  │ User #4518 deleted their account       │   │
│          │  └─────────────────────────────────────────┘   │
│          │                                                │
└──────────┴────────────────────────────────────────────────┘
```

### Header/Title
- "Admin Dashboard" + admin avatar/name on the right

### Main Sections
1. **KPI Cards** — 4 summary metric cards (Users, Reports, Active Today, AI Success Rate)
2. **User Growth Chart** — Area chart showing signups over time
3. **Reports Chart** — Bar chart of daily uploads
4. **AI Processing Stats** — Pie/donut chart of AI success rates
5. **Recent Activity** — Live feed of user actions (anonymized)

### Sidebar Navigation
- Dashboard (active)
- Users (list, search, view individual profiles)
- Reports (view all reports, flagged reports)
- Analytics (system-wide analytics)
- AI Stats (processing success/failure rates, avg time)
- Feedback (user feedback and ratings)
- Settings (system config, API keys, feature flags)

### KPI Cards
| Metric | Value | Subtext |
|--------|-------|---------|
| Total Users | 12,450 | +340 this week |
| Total Reports | 58,320 | +1,820 this week |
| Active Today | 3,210 | — |
| AI Success Rate | 94% | 4% partial, 2% failed |

### User Actions (Admin)
- View KPIs at a glance
- Click KPI cards → Drill down to detailed view
- View charts → Hover for data points
- View activity feed → Click user ID → User detail page
- Search users by phone/email
- View flagged/failed reports
- Toggle feature flags
- Export data as CSV

### Empty State
```
New installation: "No data yet. Users will appear here once they sign up."
```

### Error State
```
API error: "Couldn't load dashboard data. Check API connection."
```

### Suggested Microcopy
```
Title:        "Admin Dashboard"
Users card:   "Total Users"
Reports card: "Total Reports"
Active card:  "Active Today"
AI card:      "AI Success Rate"
Growth:       "User Growth — Last 30 Days"
Uploads:      "Reports Uploaded — Last 7 Days"
AI stats:     "AI Processing Stats"
Activity:     "Recent Activity"
```

### Web Layout Notes (Web-Only)
- Left sidebar (220px) with admin navigation
- Main content area with responsive grid
- KPI cards: 4 across on desktop, 2×2 on tablet
- Charts use Chart.js or similar
- Activity feed: real-time updates with WebSocket
- Fully responsive down to 1024px min-width
- Color scheme: same teal brand but darker header (#0F172A) to distinguish from user app

---

## Quick Reference: Component Sizing

### Mobile (390px width)

| Component | Height | Width | Radius | Padding |
|-----------|--------|-------|--------|---------|
| Top App Bar | 56px | full | 0 | 16px H |
| Bottom Nav | 56px | full | 0 | — |
| Button Primary | 52px | full - 32px | 12px | 16px H |
| Button Secondary | 48px | auto | 10px | 16px H |
| Text Input | 48px | full - 32px | 10px | 12px H |
| Chip | 36px | auto | 18px | 12px H |
| Report Card | ~85px | full - 32px | 10px | 12px |
| Parameter Card | 85px | 50% - 24px | 10px | 12px |
| FAB | 56×56 | — | 28px | — |
| Avatar | 36×36 | — | 18px | — |
| Search Bar | 44px | full - 32px | 10px | 12px H |
| Bottom Sheet | auto | full | 16px top | 16px |
| Snackbar | 48px | full - 32px | 8px | 12px H |

### Web (1440px width)

| Component | Max Width | Notes |
|-----------|-----------|-------|
| Sidebar | 260px | Collapsible to 72px |
| Content Area | 1180px | (1440 - 260) |
| Form Card | 480-560px | Centered |
| Modal | 520px | Centered with overlay |
| Parameter Grid | 3 columns | Auto-height cards |
| Report List | 800px | With right detail panel |

---

*End of Screen Layouts Specification*
*Total: 26 screens × 13 attributes = 338 design specifications*
*Ready for Figma implementation*
