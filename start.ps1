Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting SwachDrishti Platform...    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "1. Launching Django Backend at http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\activate; python manage.py runserver 127.0.0.1:8000" -PassThru

Write-Host "2. Launching Vite Frontend at http://localhost:3000..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -PassThru

Write-Host "`nBoth services are now running in background jobs!" -ForegroundColor Green
Write-Host "-> Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "-> Backend:  http://127.0.0.1:8000/api/" -ForegroundColor Cyan
