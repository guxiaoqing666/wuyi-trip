@echo off
chcp 65001 >nul
echo ========================================
echo  武夷自驾游后端服务 - 一键启动
echo ========================================
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-backend.ps1"
pause
