# Script pour corriger les guillemets typographiques
Write-Host "Correction des guillemets typographiques..." -ForegroundColor Cyan

$frontendPath = "frontend\src"
$count = 0
$files = Get-ChildItem -Path $frontendPath -Recurse -Filter "*.tsx" -File

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        # Apostrophes courbes -> apostrophe droite
        $content = $content.Replace([char]0x2018, [char]0x0027)  # '
        $content = $content.Replace([char]0x2019, [char]0x0027)  # '
        
        # Guillemets courbes -> guillemets droits
        $content = $content.Replace([char]0x201C, [char]0x0022)  # "
        $content = $content.Replace([char]0x201D, [char]0x0022)  # "
        
        # Guillemets francais
        $content = $content.Replace([char]0x00AB, [char]0x0022)  # «
        $content = $content.Replace([char]0x00BB, [char]0x0022)  # »
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $count++
            $relativePath = $file.FullName.Replace((Get-Location).Path + "\frontend\src\", "")
            Write-Host "OK: $relativePath" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Erreur: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "$count fichiers corriges!" -ForegroundColor Green
Write-Host "Le frontend va recompiler automatiquement..." -ForegroundColor Yellow

