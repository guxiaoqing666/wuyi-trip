# ============================================
# 启动 Cloudflare Quick Tunnel
# 无需登录，临时公网地址
# ============================================

$ErrorActionPreference = "Stop"

$PROJECT_DIR = "C:\Users\simba\wuyi-trip"
$CLOUDFLARED = "$PROJECT_DIR\cloudflared.exe"
$PID_FILE = "$PROJECT_DIR\data\tunnel.pid"
$URL_FILE = "$PROJECT_DIR\data\tunnel.url"

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 启动 Cloudflare Quick Tunnel" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查 cloudflared
if (!(Test-Path $CLOUDFLARED)) {
    Write-Error "❌ cloudflared.exe 不存在"
    exit 1
}

# 停止旧的 tunnel
if (Test-Path $PID_FILE) {
    $oldPid = Get-Content $PID_FILE -Raw
    $oldPid = $oldPid.Trim()
    $proc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $oldPid -Force
        Write-Host "✅ 已停止旧 tunnel"
    }
    Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
}

# 启动 Quick Tunnel
Write-Host "🚀 启动 Quick Tunnel..."
Write-Host "   指向: http://localhost:3000"
Write-Host ""

# 使用 Start-Process 启动，捕获输出
$proc = Start-Process -FilePath $CLOUDFLARED `
    -ArgumentList "tunnel", "--url", "http://localhost:3000" `
    -WorkingDirectory $PROJECT_DIR `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$PROJECT_DIR\data\tunnel.log" `
    -RedirectStandardError "$PROJECT_DIR\data\tunnel.log" `
    -PassThru

$proc.Id | Out-File -FilePath $PID_FILE -Force

Write-Host "⏳ 等待 tunnel 启动..."
Start-Sleep -Seconds 5

# 从日志中提取 URL
$logContent = Get-Content "$PROJECT_DIR\data\tunnel.log" -Raw -ErrorAction SilentlyContinue
if ($logContent -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
    $tunnelUrl = $Matches[1]
    $tunnelUrl | Out-File -FilePath $URL_FILE -Force
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host " ✅ Tunnel 启动成功！" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host " 公网地址: $tunnelUrl" -ForegroundColor White
    Write-Host " API 地址: ${tunnelUrl}/api" -ForegroundColor White
    Write-Host ""
    Write-Host " 请将此地址配置到前端:" -ForegroundColor Cyan
    Write-Host "   js/message-board.js" -ForegroundColor White
    Write-Host ""
    Write-Host " PID: $($proc.Id)" -ForegroundColor White
    Write-Host " 日志: $PROJECT_DIR\data\tunnel.log" -ForegroundColor White
    Write-Host "================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  正在获取地址，请查看日志:" -ForegroundColor Yellow
    Write-Host "   $PROJECT_DIR\data\tunnel.log" -ForegroundColor White
    Write-Host ""
    Write-Host " 或运行: Get-Content $PROJECT_DIR\data\tunnel.log -Wait" -ForegroundColor Cyan
}
