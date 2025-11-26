@echo off
echo ========================================
echo   ERP System - Stopping All Servers
echo ========================================
echo.
echo Killing all Node.js processes...
echo.

:: Kill all Node.js processes
taskkill /F /IM node.exe /T 2>nul

:: Kill Expo processes
taskkill /F /IM expo.exe /T 2>nul

echo.
echo ========================================
echo   All servers stopped!
echo ========================================
echo.
echo Press any key to exit...
pause >nul

