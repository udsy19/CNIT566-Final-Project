@echo off
REM Beacon - CNIT 566 Final Project
REM Author: Udaya Tejas
REM
REM Double-clickable launcher for Windows.

setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PORT=3000"

echo.
echo -- Beacon - CNIT 566 Final Project -----------
echo Author: Udaya Tejas

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js is not installed.
    echo Install it from https://nodejs.org ^(version 20 or newer^),
    echo then double-click this file again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo.
    echo -- Installing dependencies ^(~1-2 min, first run only^) --
    call npm install
    if errorlevel 1 goto :failed
)

if not exist "data\beacon.sqlite" (
    echo.
    echo -- Setting up the local database + demo data --
    call npm run db:migrate
    if errorlevel 1 goto :failed
    call npm run db:seed
    if errorlevel 1 goto :failed
)

if not exist ".next\BUILD_ID" (
    echo.
    echo -- Building Beacon ^(~30 sec, first run only^) --
    call npm run build
    if errorlevel 1 goto :failed
)

echo.
echo -----------------------------------------------
echo Beacon is starting on http://localhost:%PORT%
echo.
echo Sign in:
echo     demo@purdue.edu / purdue123
echo.
echo The browser will open in a moment.
echo Press Ctrl-C in this window to stop the app.
echo -----------------------------------------------
echo.

REM Open browser after a short delay (background)
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:%PORT%"

call npm run start
goto :end

:failed
echo.
echo Setup failed. See the error message above.
pause
exit /b 1

:end
endlocal
