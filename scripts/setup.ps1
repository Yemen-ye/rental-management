param(
    [switch]$InstallNode,
    [switch]$InstallDeps,
    [switch]$InitDb
)

Write-Host "=== Rental Management System Setup ===" -ForegroundColor Cyan

$nodePath = "C:\Users\rt7x\AppData\Local\Temp\nodejs\node-v22.14.0-win-x64"
if (Test-Path $nodePath) {
    $env:Path = "$nodePath;$env:Path"
    Write-Host "Node.js found at: $nodePath" -ForegroundColor Green
} else {
    Write-Host "Node.js not found. Please install Node.js 22+." -ForegroundColor Red
    exit 1
}

node --version
npm --version

if ($InstallDeps) {
    Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $PSScriptRoot "..\backend")
    npm install

    Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $PSScriptRoot "..\frontend")
    npm install
}

if ($InitDb) {
    Write-Host "`nRunning Prisma migrations..." -ForegroundColor Yellow
    Set-Location (Join-Path $PSScriptRoot "..\backend")
    npx prisma migrate dev --name init
    npx prisma generate
    npx ts-node prisma/seed.ts
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "To start development:"
Write-Host "  Terminal 1: cd backend && npm run dev"
Write-Host "  Terminal 2: cd frontend && npm run dev"
Write-Host "`nAdmin login: admin@demo.com / Admin@123456"
