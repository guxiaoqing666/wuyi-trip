@echo off
chcp 65001 >nul
echo ========================================
echo  武夷自驾游后端服务 - 一键停止
echo ========================================
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\stop-backend.ps1"
pause
