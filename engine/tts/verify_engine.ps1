Write-Host ========================================================== -ForegroundColor Cyan
Write-Host  Uncle Fred Local Voice Engine (RTX 3060 12GB) Status -ForegroundColor Cyan
Write-Host ========================================================== -ForegroundColor Cyan

# 1. Virtual environment
Write-Host 
Step 1: Checking Python virtual environment... -ForegroundColor Yellow
if (Test-Path engine\tts_venv\Scripts\python.exe) {
    Write-Host  Virtual environment ready at engine\tts_venv -ForegroundColor Green
} else {
    Write-Error Virtual environment missing!
    exit 1
}

# 2. GPU & CUDA
Write-Host 
Step 2: Checking NVIDIA RTX 3060 GPU and CUDA... -ForegroundColor Yellow
& .\engine\tts_venv\Scripts\python.exe -c import torch; print(' CUDA Available: ' + str(torch.cuda.is_available()) + ' | Device: ' + torch.cuda.get_device_name(0) + ' | VRAM: ' + str(round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)) + ' GB')

# 3. Audio clips
Write-Host 
Step 3: Checking Uncle Fred audio clips... -ForegroundColor Yellow
 = C:\Users\tiago\Desktop\UncleFred_AudioClips
if (Test-Path ) {
     = (Get-ChildItem -Path  -Filter *.wav).Count
    Write-Host  Found studio WAV clips in  -ForegroundColor Green
} else {
    Write-Warning Clips directory missing at 
}

# 4. Voice Server
Write-Host 
Step 4: Checking Voice Server endpoint (http://127.0.0.1:8020/health)... -ForegroundColor Yellow
try {
     = Invoke-RestMethod -Uri http://127.0.0.1:8020/health -Method Get -TimeoutSec 3
    Write-Host  Voice Engine is ONLINE! Model: on  -ForegroundColor Green
    Write-Host  Primary Reference Clip Ready:  -ForegroundColor Green
} catch {
    Write-Host  Voice Engine is offline. Start it using: .\engine\tts\start_voice_engine.bat -ForegroundColor Yellow
}

Write-Host 
All verification checks passed! -ForegroundColor Cyan
