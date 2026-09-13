$debugLog = "$env:USERPROFILE\AppData\LocalLow\Hovgaard Games\Big Ambitions\extractor_debug.log"
if (Test-Path $debugLog) {
    Remove-Item $debugLog -Force -ErrorAction SilentlyContinue
}

Write-Host "Launching Big Ambitions via Steam..."
Start-Process "steam://rungameid/1331550"

Write-Host "Monitoring extractor log for rendering completion..."
$completed = $false
for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Path $debugLog) {
        $content = Get-Content $debugLog -Tail 15 -ErrorAction SilentlyContinue
        if ($content -match "Vehicle studio rendering complete!") {
            $completed = $true
            Write-Host "Detected completion: Vehicle studio rendering complete!"
            break
        }
    }
}

if (-not $completed) {
    Write-Host "Timed out waiting for completion or reached maximum wait time."
}

Start-Sleep -Seconds 3
Get-Process "Big Ambitions" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Game process terminated."

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$rawDir = Join-Path $RootDir "data\raw"
$steamRawDir = "C:\Program Files (x86)\Steam\steamapps\common\Big Ambitions\data\raw"

if (Test-Path (Join-Path $steamRawDir "vehicle_renders")) {
    $targetRenders = Join-Path $rawDir "vehicle_renders"
    if (-not (Test-Path $targetRenders)) { New-Item -ItemType Directory -Path $targetRenders -Force | Out-Null }
    Copy-Item -Path (Join-Path $steamRawDir "vehicle_renders\*") -Destination $targetRenders -Recurse -Force
}

$rendersDir = Join-Path $rawDir "vehicle_renders"
if (Test-Path $rendersDir) {
    $renders = Get-ChildItem $rendersDir -Filter *.png
    Write-Host "Vehicle & Boat catalog renders: $($renders.Count) files"
    foreach ($ttName in @("anselmoaf90_360", "speedboat_360", "yacht_360", "luxuryyacht_360")) {
        $ttDir = Join-Path $rendersDir $ttName
        if (Test-Path $ttDir) {
            $ttFrames = Get-ChildItem $ttDir -Filter *.png
            Write-Host "Turntable frames in data/raw ($ttName): $($ttFrames.Count) files"
        }
    }
}

$webVehiclesDir = Join-Path $RootDir "web\public\images\vehicles"
if (Test-Path $webVehiclesDir) {
    foreach ($ttName in @("anselmoaf90_360", "speedboat_360", "yacht_360", "luxuryyacht_360")) {
        $webDir = Join-Path $webVehiclesDir $ttName
        if (Test-Path $webDir) {
            $webFrames = Get-ChildItem $webDir -Filter *.png
            Write-Host "Turntable frames in web ($ttName): $($webFrames.Count) files"
        }
    }
}

Write-Host "Recent extractor log entries:"
if (Test-Path $debugLog) {
    Get-Content $debugLog | Select-Object -Last 30
}


