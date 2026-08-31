Write-Host "Launching Big Ambitions via Steam..."
Start-Process "steam://rungameid/1331550"
Write-Host "Waiting 25 seconds for game to reach Main Menu and mod to execute..."
Start-Sleep -Seconds 25

$rawDir = "C:\Users\tiago\Desktop\CODING PROJECTS\BigAmbitionsTool\data\raw"
if (Test-Path $rawDir) {
    Write-Host "Data directory created! Files:"
    Get-ChildItem $rawDir
} else {
    Write-Host "Data directory not created yet. Checking persistentDataPath debug log..."
    $debugLog = "C:\Users\tiago\AppData\LocalLow\Hovgaard Games\Big Ambitions\extractor_debug.log"
    if (Test-Path $debugLog) {
        Get-Content $debugLog
    } else {
        Write-Host "No extractor_debug.log found."
    }
}
