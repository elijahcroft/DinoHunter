@echo off
title Hell Creek - game server
cd /d "%~dp0"
echo Starting the game... keep this window open while you play.
echo Close this window to stop the game.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
if errorlevel 1 pause
