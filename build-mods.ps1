# ==============================================================================
# Big Ambitions Companion Mod - Unified Dual Build Pipeline
# Builds both:
#   1. Steam Workshop Native Mod (Ready to upload to Steam Workshop)
#   2. MelonLoader Standalone Mod (Packed as AmbitionProSync-Mod.zip in web/public)
# ==============================================================================

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = Get-Location }

$ModDir = Join-Path $RootDir "mod"
$WebPublic = Join-Path $RootDir "web\public\downloads"
$DistDir = Join-Path $RootDir "dist"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Building Big Ambitions Companion Mods (Dual-Target)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Build MelonLoader Standalone Mod
Write-Host "`n[1/3] Compiling MelonLoader Standalone Mod..." -ForegroundColor Yellow
$MelonCsproj = Join-Path $ModDir "AmbitionProSync\AmbitionProSync.csproj"
dotnet build $MelonCsproj -c Release -v minimal
if ($LASTEXITCODE -ne 0) { throw "MelonLoader build failed" }

# Package MelonLoader zip into web/public/downloads
Write-Host "Packaging MelonLoader zip for web download..." -ForegroundColor Gray
$MelonDll = Join-Path $ModDir "AmbitionProSync\bin\Release\net472\AmbitionProSync.dll"
$TempZipDir = Join-Path $env:TEMP "AmbitionProSync_Package"
if (Test-Path $TempZipDir) { Remove-Item $TempZipDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $TempZipDir "Mods") -Force | Out-Null
Copy-Item $MelonDll (Join-Path $TempZipDir "Mods\AmbitionProSync.dll") -Force

if (-not (Test-Path $WebPublic)) { New-Item -ItemType Directory -Path $WebPublic -Force | Out-Null }
$ZipTarget = Join-Path $WebPublic "AmbitionProSync-Mod.zip"
if (Test-Path $ZipTarget) { Remove-Item $ZipTarget -Force }
Compress-Archive -Path "$TempZipDir\*" -DestinationPath $ZipTarget -Force
Remove-Item $TempZipDir -Recurse -Force
Write-Host " -> Created $ZipTarget" -ForegroundColor Green

# 2. Build Steam Workshop Native Mod
Write-Host "`n[2/3] Compiling Steam Workshop Native Mod..." -ForegroundColor Yellow
$SteamCsproj = Join-Path $ModDir "BigAmbitionsCompanion.Steam\BigAmbitionsCompanion.Steam.csproj"
dotnet build $SteamCsproj -c Release -v minimal
if ($LASTEXITCODE -ne 0) { throw "Steam Workshop build failed" }

# Package Steam Workshop folder
Write-Host "Packaging Steam Workshop directory..." -ForegroundColor Gray
$SteamDll = Join-Path $ModDir "BigAmbitionsCompanion.Steam\bin\Release\net472\BigAmbitionsCompanionMod.dll"
$SteamDist = Join-Path $DistDir "SteamWorkshop\BigAmbitionsCompanion"
if (Test-Path $SteamDist) { Remove-Item $SteamDist -Recurse -Force }
New-Item -ItemType Directory -Path $SteamDist -Force | Out-Null

Copy-Item $SteamDll (Join-Path $SteamDist "BigAmbitionsCompanionMod.dll") -Force
Copy-Item (Join-Path $ModDir "BigAmbitionsCompanion.Steam\Mod.json") (Join-Path $SteamDist "Mod.json") -Force
Write-Host " -> Created Steam Workshop folder: $SteamDist" -ForegroundColor Green

# 3. Summary
Write-Host "`n[3/3] Build Complete!" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  MelonLoader Zip: web/public/downloads/AmbitionProSync-Mod.zip" -ForegroundColor White
Write-Host "  Steam Workshop : dist/SteamWorkshop/BigAmbitionsCompanion" -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Cyan