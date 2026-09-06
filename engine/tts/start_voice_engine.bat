@echo off
title Uncle Fred Voice Engine (RTX 3060)
cd /d %~dp0\..\..
echo ========================================================
echo   Uncle Fred Voice Cloning Engine (Local RTX 3060)
echo ========================================================
echo Starting FastAPI TTS server on port 8020...
.\engine\tts_venv\Scripts\python.exe engine\tts\server.py
pause
