# Production Angular build for EC2 nginx (/var/www/hms-ui).
# Usage: powershell -File .\deploy\publish-production.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$browserDir = Join-Path $root 'dist\HMS-UI\browser'
if (-not (Test-Path $browserDir)) {
    $browserDir = Join-Path $root 'dist\HMS-UI'
}

$outDir = Join-Path $root 'dist\publish'
if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item -ItemType Directory -Path $outDir | Out-Null
Copy-Item -Path (Join-Path $browserDir '*') -Destination $outDir -Recurse -Force

Write-Host "Frontend publish folder: $outDir"
Write-Host "Deploy to server:"
Write-Host '  scp -r "dist\publish\*" ubuntu@54.167.151.96:/var/www/hms-ui/'
