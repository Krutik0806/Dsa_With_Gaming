@echo off
title CodeClash Runner
echo ========================================================
echo        STARTING CODECLASH FULL STACK PLATFORM
echo ========================================================
echo.

echo Starting Backend Server on http://localhost:4000...
start "CodeClash Backend (Port 4000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo Starting Frontend Vite Server on http://localhost:3000...
start "CodeClash Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  Both servers started!
echo  Frontend URL: http://localhost:3000
echo  Backend URL:  http://localhost:4000
echo  Demo login:   username: demo / password: demo1234
echo ========================================================
pause
