# Fills the hosted database (Neon) and media storage (Cloudflare R2) with the site content from this computer.
# Run once before the first deploy: seeding here takes a few minutes, while the free host would need far longer.
# Safe to repeat: when the hosted database already has content, nothing is changed.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env.production")) {
    Write-Host "backend/.env.production not found. Copy .env.production.example to .env.production and fill it in." -ForegroundColor Red
    exit 1
}

$env:DJANGO_ENV_FILE = ".env.production"
$python = Join-Path (Get-Location) ".venv\Scripts\python.exe"

Write-Host "Applying database migrations..." -ForegroundColor Cyan
& $python manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Uploading demo content and media (a few minutes)..." -ForegroundColor Cyan
& $python manage.py seed_demo --if-empty
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done. Now set the same values in Render -> Environment and deploy." -ForegroundColor Green
