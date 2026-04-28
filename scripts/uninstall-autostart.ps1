# ============================================
# 卸载开机自启动
# 用法: .\scripts\uninstall-autostart.ps1
# ============================================

$STARTUP_FOLDER = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$SHORTCUT_NAME = "武夷自驾游后端服务.lnk"
$SHORTCUT_PATH = "$STARTUP_FOLDER\$SHORTCUT_NAME"

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 卸载开机自启动" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if (Test-Path $SHORTCUT_PATH) {
    Remove-Item $SHORTCUT_PATH -Force
    Write-Host "✅ 已删除开机自启动快捷方式" -ForegroundColor Green
} else {
    Write-Host "⚠️  没有找到开机自启动快捷方式" -ForegroundColor Yellow
}

Write-Host "================================" -ForegroundColor Cyan
