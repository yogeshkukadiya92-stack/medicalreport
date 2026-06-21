# MediVault — Web App MVP

A healthcare-focused medical report storage application built with Next.js, React, and Tailwind CSS.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd medivault-web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js 14 App Router pages
├── components/       # Reusable React components
├── contexts/         # React Context providers
├── hooks/           # Custom React hooks
├── lib/
│   ├── api/        # API service files
│   ├── types.ts    # TypeScript type definitions
│   └── utils.ts    # Helper functions
├── styles/         # Global styles
└── data/           # Dummy data
```

## Features

### Pages (12)
1. **Login** — Phone-based authentication
2. **OTP Verification** — 6-digit code entry
3. **Consent** — Terms & AI processing consent
4. **Create Profile** — User profile setup
5. **Home Dashboard** — Health overview & recent reports
6. **Family Members** — Manage family member profiles
7. **Upload Report** — Select file & choose family member
8. **File Preview** — Preview & enter report metadata
9. **Past Reports** — View all reports with search/filter
10. **Report Details** — Full report view with extracted values
11. **Basic Analytics** — Health trends placeholder
12. **Settings** — Account settings & logout

### Components
- **UI Primitives**: Button, Input, Card, Modal, Badge, etc.
- **Layout**: Sidebar, BottomNav, AppShell, PageWrapper
- **Domain**: ReportCard, FamilyMemberCard, HealthSummaryCard

### State Management
- React Context for auth and family member state
- Local state for forms and UI

### Styling
- Tailwind CSS with healthcare color scheme
- Responsive design (mobile-first)
- Light mode with accessible colors

## Development

### Build
```bash
npm run build
npm start
```

### Code Quality
```bash
npm run lint
npm run format
```

## Dummy Data

The app includes realistic dummy data for:
- User profiles
- Family members
- Medical reports
- Extracted health values
- Health trends

Data is loaded from `src/data/` directory and serves as mock API responses until backend integration.

## API Integration

API service files are prepared in `src/lib/api/` with placeholder functions:
- `auth.ts` — Authentication endpoints
- `reports.ts` — Report CRUD operations
- `family.ts` — Family member management
- `consents.ts` — Consent management

Replace fetch calls with real backend endpoints when API is ready.

## Styling Guide

### Colors
```
Primary: Teal (#0D9488) — Main actions
Secondary: Cyan (#0891B2) — Secondary actions
Health: Green/Amber/Red — Status indicators
```

### Fonts
```
Body: 16px (default)
Heading: 24px
Title: 20px
```

### Spacing
```
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

## Mobile Responsiveness

- **Mobile** (< 768px): Bottom navigation, single column
- **Desktop** (≥ 768px): Sidebar navigation, multi-column layouts
- All pages tested at 375px, 768px, and 1440px widths

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Performance

- Light bundle size (~50KB gzipped)
- Optimized images
- Minimal external dependencies
- Client-side rendering for MVP

## Security Notes

- No real authentication (dummy tokens)
- No real API calls (mock responses)
- Environment variables for API URL
- HTTPS required in production

## Next Steps

1. **Backend Integration**: Connect to FastAPI backend using prepared API service files
2. **Authentication**: Replace dummy auth with real JWT flow
3. **File Upload**: Implement S3 upload using presigned URLs
4. **Charts**: Add real health trend visualizations
5. **PWA**: Add offline support and installability
6. **Testing**: Add unit and integration tests

## License

MIT

## Support

For issues or questions, refer to the main project documentation in the parent directory.
