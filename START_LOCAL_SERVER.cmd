@echo off
REM MediVault - Quick Start Script for Windows

echo.
echo ================================
echo   MediVault Local Server Setup
echo ================================
echo.

REM Navigate to project
cd /d "D:\Medical Report\medivault-web"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies... This may take 1-2 minutes
    call npm install --legacy-peer-deps
    echo.
)

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo Creating environment file...
    copy .env.example .env.local
    echo.
)

echo.
echo ================================
echo   Starting Development Server
echo ================================
echo.
echo Server will start on: http://localhost:3000
echo.
echo Default Login:
echo   - Phone: +919876543210 (or any number)
echo   - OTP: 123456 (any 6 digits)
echo.
echo Available Pages:
echo   - Dashboard: http://localhost:3000/dashboard
echo   - Family Members: http://localhost:3000/family
echo   - Upload Reports: http://localhost:3000/upload
echo   - Medical Reports: http://localhost:3000/reports
echo   - Settings: http://localhost:3000/settings
echo   - Analytics: http://localhost:3000/analytics (NEW!)
echo.
echo Press Ctrl+C to stop the server
echo.
echo ================================
echo.

REM Start development server
call npm run dev

pause
