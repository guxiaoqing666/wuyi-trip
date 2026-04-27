@echo off
chcp 65001 >nul
echo ========================================
echo   Stop WuYi Trip Server
echo ========================================
echo.

taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% == 0 (
    echo [OK] Server stopped
) else (
    echo [!] No running server found
)

echo.
pause
