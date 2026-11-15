@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_CIKO.ps1"
if errorlevel 1 (
  echo.
  echo Startup failed. Copy the error text and send it for debugging.
  pause
) else (
  echo Ciko is running. You may close this window.
  pause
)
