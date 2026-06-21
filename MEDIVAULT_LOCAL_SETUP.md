# MediVault - Local Development Setup

## Quick Start (Windows with PowerShell)

### 1. Navigate to Project
```powershell
cd "D:\Medical Report\medivault-web"
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Create Environment File
```powershell
cp .env.example .env.local
```

### 4. Start Development Server
```powershell
npm run dev
```

### 5. Open in Browser
```
http://localhost:3000
```

---

## What You'll See

### Available Pages:

**Auth Pages:**
- http://localhost:3000/login
- http://localhost:3000/verify-otp
- http://localhost:3000/consent
- http://localhost:3000/setup-profile

**App Pages:**
- http://localhost:3000/ (redirects to dashboard)
- http://localhost:3000/dashboard
- http://localhost:3000/family
- http://localhost:3000/upload
- http://localhost:3000/reports
- http://localhost:3000/analytics (NEW - Analytics Dashboard)
- http://localhost:3000/settings

---

## Troubleshooting

### Port 3000 Already in Use
```powershell
# Kill process on port 3000
Get-Process | Where-Object { $_.Name -eq "node" } | Stop-Process -Force

# Or use different port
$env:PORT=3001
npm run dev
```

### Module Not Found
```powershell
# Clear cache and reinstall
rm node_modules -Recurse
npm install --legacy-peer-deps
```

### Tailwind CSS Not Loading
```powershell
# Clear Next.js cache
rm .next -Recurse
npm run dev
```

---

## Development Tips

### Hot Reload
- Changes to files automatically reload the browser
- Saves time during development

### Dummy Data
- All screens use dummy data (no real backend needed)
- Login with any phone number (no auth validation yet)
- OTP: any 6-digit number

### Using DevTools
- Press F12 to open Developer Tools
- Check "React" tab for component inspection
- Check "Network" tab for API calls

---

## Project Structure

```
medivault-web/
├── src/
│   ├── app/          → Pages and routing
│   ├── components/   → Reusable UI components
│   ├── contexts/     → State management
│   ├── lib/
│   │   ├── api/      → API services
│   │   ├── types.ts  → TypeScript types
│   │   └── utils.ts  → Helper functions
│   └── data/         → Dummy data
└── public/           → Static files
```

---

## Next Steps

After seeing the basic app running:

1. **Analytics Module**: Add Chart.js/Recharts for data visualization
2. **Real Backend**: Connect to FastAPI backend (when ready)
3. **Database**: Connect to PostgreSQL
4. **Authentication**: Implement real JWT flow

---

## Contact

For issues or questions, check:
- README.md in the project
- MediVault documentation files
- GitHub repository issues

---

**Happy Coding! 🚀**
