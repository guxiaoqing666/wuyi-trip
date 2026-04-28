# ============================================
# 安装开机自启动
# 用法: 右键 -> 以管理员身份运行 PowerShell
#       .\scripts\install-autostart.ps1
# ============================================

$ErrorActionPreference = "Stop"

$PROJECT_DIR = "C:\Users\simba\wuyi-trip"
$START_BAT = "$PROJECT_DIR\start.bat"
$STARTUP_FOLDER = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$SHORTCUT_NAME = "武夷自驾游后端服务.lnk"

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 安装开机自启动" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查 start.bat 是否存在
if (!(Test-Path $START_BAT)) {
    Write-Error "❌ 找不到 start.bat"
    exit 1
}

# 创建快捷方式
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$STARTUP_FOLDER\$SHORTCUT_NAME")
$Shortcut.TargetPath = $START_BAT
$Shortcut.WorkingDirectory = $PROJECT_DIR
$Shortcut.Description = "武夷自驾游后端服务"
$Shortcut.Save()

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host " ✅ 开机自启动已设置！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host " 快捷方式: $STARTUP_FOLDER\$SHORTCUT_NAME" -ForegroundColor White
Write-Host ""
Write-Host " 管理命令:" -ForegroundColor Cyan
Write-Host "   启动: .\start.bat" -ForegroundColor White
Write-Host "   停止: .\stop.bat" -ForegroundColor White
Write-Host "   状态: .\status.bat" -ForegroundColor White
Write-Host ""
Write-Host " 取消自启: 删除快捷方式" -ForegroundColor Yellow
Write-Host "   $STARTUP_FOLDER\$SHORTCUT_NAME" -ForegroundColor White
Write-Host "================================" -ForegroundColor Green
