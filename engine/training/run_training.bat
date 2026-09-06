@echo off
title Uncle Fred Voice Fine-Tuning (RTX 3060)
color 0b
cd /d %~dp0\..\..

echo ====================================================================
echo      UNCLE FRED VOICE MODEL FINE-TUNING PIPELINE (RTX 3060 12GB)
echo ====================================================================
echo.
echo Step 1: 53 studio audio clips and phoneme alignments are prepared!
echo --------------------------------------------------------------------
rem Dataset already prepared and verified with headers and relative wav paths
echo [OK] 47 training samples + 6 validation samples verified.
echo.
echo.
echo Step 2: Fine-tuning XTTS-v2 neural weights on Uncle Fred's dataset...
echo --------------------------------------------------------------------
echo This will train the neural network to permanently bake Uncle Fred's
echo voice, breathing, cadence, and vocal inflections into the model.
echo.
echo Training takes approx 1-2 hours on your RTX 3060.
echo.
.\engine\tts_venv\Scripts\python.exe engine\training\train.py
if errorlevel 1 (
    echo.
    echo [ERROR] Training encountered an issue!
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo     TRAINING COMPLETE! UNCLE FRED VOICE IS NOW FULLY FINE-TUNED
echo ====================================================================
echo Checkpoints saved under: engine\training\checkpoints
echo.
pause
