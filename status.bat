@echo off
chcp 65001 >nul
echo ========================================
echo  武夷自驾游后端服务 - 查看状态
echo ========================================
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\status.ps1"
pause
