# Script pour corriger tous les guillemets typographiques
Write-Host "🔧 Correction des guillemets typographiques..." -ForegroundColor Cyan
Write-Host ""

$frontendPath = "frontend\src"
$count = 0
$files = Get-ChildItem -Path $frontendPath -Recurse -Filter "*.tsx" -File

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        # Remplacer les guillemets typographiques
        $content = $content -replace "'", "'"  # Apostrophe courbe gauche
        $content = $content -replace "'", "'"  # Apostrophe courbe droite
        $content = $content -replace """, '"'  # Guillemet courbe gauche
        $content = $content -replace """, '"'  # Guillemet courbe droite
        $content = $content -replace "«", '"'  # Guillemet français gauche
        $content = $content -replace "»", '"'  # Guillemet français droite
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $count++
            $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
            Write-Host "✅ $relativePath" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Erreur: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ $count fichiers corrigés !" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Le frontend va recompiler automatiquement..." -ForegroundColor Yellow
Write-Host "   Attendez 20-30 secondes puis rafraîchissez votre navigateur" -ForegroundColor Gray

