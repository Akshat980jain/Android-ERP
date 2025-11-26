@echo off
echo ========================================
echo   ERP System - Quick Start (No Install)
echo ========================================
echo.
echo This script assumes dependencies are already installed.
echo Use 'start-all-servers.bat' for first-time setup.
echo.
echo Press any key to launch all servers...
pause >nul

:: Start Backend Server
start "Backend Server - Port 5000" cmd /k "cd backend && echo [BACKEND] Starting server... && npm start"

:: Wait 3 seconds before starting frontend
timeout /t 3 /nobreak >nul

:: Start Frontend Server
start "Frontend Server - Vite" cmd /k "cd frontend && echo [FRONTEND] Starting Vite dev server... && npm run dev"

:: Wait 2 seconds before starting android
timeout /t 2 /nobreak >nul

:: Start Android/Expo Server
start "Android Expo Server" cmd /k "cd android && echo [ANDROID] Starting Expo server... && npm start"

echo.
echo ========================================
echo   All servers are launching!
echo ========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo   Android:  Expo Metro Bundler
echo.
echo To stop all servers, run: stop-all-servers.bat
echo.
echo Close this window or press any key to exit...
pause >nul

