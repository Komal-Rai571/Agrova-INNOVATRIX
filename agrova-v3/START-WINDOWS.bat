@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install it from https://nodejs.org
  pause
  exit /b 1
)
echo.
echo ==============================================
echo   AGROVA V3 - Recovery, Fulfillment and Settlement
 echo ==============================================
echo   Open: http://localhost:3000
 echo   FPO: manager@agrova.test / Agrova123!
echo.
npm start
pause
