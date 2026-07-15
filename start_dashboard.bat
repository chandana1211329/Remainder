@echo off
title Study ^& Life Dashboard Launcher
echo ============================================================
echo   Starting Study ^& Life Dashboard Servers...
echo   Backend will run on:  http://localhost:5000
echo   Frontend will run on: http://192.168.1.38:5173
echo ============================================================
echo.

:: Get the directory of this batch file
set "PROJECT_DIR=%~dp0"

echo [1/2] Launching Backend Server in new window...
cd /d "%PROJECT_DIR%backend"
start "Dashboard Backend Server" cmd /k "node src/server.js"

echo [2/2] Launching Frontend Dev Server in new window...
cd /d "%PROJECT_DIR%frontend"
start "Dashboard Frontend Server" cmd /k "npm run dev"

echo.
echo ============================================================
echo   SUCCESS: Both servers are running!
echo   * Minimise the two new cmd windows.
echo   * Do NOT close them while using the app.
echo   * Access on phone: http://192.168.1.38:5173
echo ============================================================
echo.
echo Press any key to close this launcher console...
pause >nul
