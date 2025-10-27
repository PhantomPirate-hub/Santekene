# Script PowerShell pour démarrer tous les services Santé Kènè
Write-Host "🚀 Démarrage de Santé Kènè..." -ForegroundColor Green
Write-Host ""

# Vérifier si les fichiers .env existent
$envFiles = @(
    "backend-api\.env",
    "backend-ai\.env"
)

foreach ($envFile in $envFiles) {
    if (-not (Test-Path $envFile)) {
        Write-Host "⚠️  ATTENTION : Le fichier $envFile n'existe pas !" -ForegroundColor Yellow
        Write-Host "   Veuillez créer ce fichier avant de continuer." -ForegroundColor Yellow
        Write-Host "   Voir GUIDE_DEMARRAGE.md pour plus d'informations." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Demander confirmation
Write-Host "Ce script va ouvrir 3 nouvelles fenêtres PowerShell pour :" -ForegroundColor Cyan
Write-Host "  1. Backend API (Port 3001)" -ForegroundColor White
Write-Host "  2. Backend AI (Port 8000)" -ForegroundColor White
Write-Host "  3. Frontend (Port 3000)" -ForegroundColor White
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer ? (O/N)"

if ($confirmation -ne 'O' -and $confirmation -ne 'o') {
    Write-Host "❌ Annulé." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔄 Démarrage des services..." -ForegroundColor Green

# Backend API
Write-Host "📡 Démarrage du Backend API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host '🔧 Backend API - Santé Kènè' -ForegroundColor Green;
cd '$PSScriptRoot\backend-api';
npm run dev
"@

Start-Sleep -Seconds 2

# Backend AI
Write-Host "🤖 Démarrage du Backend AI..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host '🧠 Backend AI - Santé Kènè' -ForegroundColor Green;
cd '$PSScriptRoot\backend-ai';
.\venv\Scripts\Activate.ps1;
uvicorn main:app --reload --port 8000
"@

Start-Sleep -Seconds 2

# Frontend
Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host '💻 Frontend - Santé Kènè' -ForegroundColor Green;
cd '$PSScriptRoot\frontend';
npm run dev
"@

Write-Host ""
Write-Host "✅ Tous les services sont en cours de démarrage !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs des services :" -ForegroundColor Yellow
Write-Host "   • Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "   • Backend AI:  http://localhost:8000" -ForegroundColor White
Write-Host "   • AI Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "ℹ️  Consultez GUIDE_DEMARRAGE.md pour plus d'informations." -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

