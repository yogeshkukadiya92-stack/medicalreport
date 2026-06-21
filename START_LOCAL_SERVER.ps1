# MediVault - Quick Start Script for PowerShell

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   MediVault Local Server Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
Set-Location "D:\Medical Report\medivault-web"
Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies... This may take 1-2 minutes" -ForegroundColor Yellow
    npm install --legacy-peer-deps
    Write-Host ""
}

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating environment file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host ""
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Starting Development Server" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Server will start on: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Default Login:" -ForegroundColor Cyan
Write-Host "   - Phone: +919876543210 (or any number)" -ForegroundColor White
Write-Host "   - OTP: 123456 (any 6 digits)" -ForegroundColor White
Write-Host ""
Write-Host "📄 Available Pages:" -ForegroundColor Cyan
Write-Host "   ✓ Dashboard: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "   ✓ Family Members: http://localhost:3000/family" -ForegroundColor White
Write-Host "   ✓ Upload Reports: http://localhost:3000/upload" -ForegroundColor White
Write-Host "   ✓ Medical Reports: http://localhost:3000/reports" -ForegroundColor White
Write-Host "   ✓ Settings: http://localhost:3000/settings" -ForegroundColor White
Write-Host "   ✓ Analytics: http://localhost:3000/analytics (NEW!)" -ForegroundColor Green
Write-Host ""
Write-Host "⏹️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Start development server
npm run dev
