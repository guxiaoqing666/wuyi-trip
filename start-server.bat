@echo off
chcp 65001 >nul
echo ========================================
echo   Start WuYi Trip Server
echo ========================================
echo.

cd /d C:\Users\simba\wuyi-trip

echo [1/2] Checking if server is already running...
tasklist | findstr /I "node.exe" >nul
if %errorlevel% == 0 (
    echo [!] Server is already running
    echo     Visit: http://localhost:8080
    echo.
    pause
    exit /b 0
)

echo [2/2] Starting server...
start /min node server.js

timeout /t 2 /nobreak >nul

echo [OK] Server started
echo     Visit: http://localhost:8080
echo     Press Ctrl+C in the server window to stop
echo.
pause
