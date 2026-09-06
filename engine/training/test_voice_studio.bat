@echo off
title Uncle Fred Voice Studio (RTX 3060)
color 0b
cd /d "%~dp0\..\.."
echo ====================================================================
echo      UNCLE FRED VOICE STUDIO - INTERACTIVE TEST
echo ====================================================================
echo.
.\engine\tts_venv\Scripts\python.exe engine\training\interactive_speak.py
pause
