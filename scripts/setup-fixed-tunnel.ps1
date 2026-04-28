# ============================================
# Cloudflare 固定隧道配置
# 需要 Cloudflare 账号和域名
# ============================================

$ErrorActionPreference = "Stop"

$PROJECT_DIR = "C:\Users\simba\wuyi-trip"
$CLOUDFLARED = "$PROJECT_DIR\cloudflared.exe"

Write-Host "================================" -ForegroundColor Cyan
Write-Host " Cloudflare 固定隧道配置" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查 cloudflared
if (!(Test-Path $CLOUDFLARED)) {
    Write-Error "❌ cloudflared.exe 不存在"
    exit 1
}

# 步骤1: 登录
Write-Host "步骤 1: 登录 Cloudflare" -ForegroundColor Yellow
Write-Host "运行: $CLOUDFLARED tunnel login" -ForegroundColor Cyan
Write-Host ""
Write-Host "请复制上面的命令到 PowerShell 运行，会打开浏览器授权" -ForegroundColor White
Write-Host ""

# 步骤2: 创建隧道
Write-Host "步骤 2: 创建隧道" -ForegroundColor Yellow
Write-Host "运行: $CLOUDFLARED tunnel create wuyi-trip" -ForegroundColor Cyan
Write-Host ""

# 步骤3: 获取隧道 ID
Write-Host "步骤 3: 查看隧道列表获取 ID" -ForegroundColor Yellow
Write-Host "运行: $CLOUDFLARED tunnel list" -ForegroundColor Cyan
Write-Host ""

# 步骤4: 创建配置文件
Write-Host "步骤 4: 创建配置文件" -ForegroundColor Yellow
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"
Write-Host "配置文件路径: $configPath" -ForegroundColor White
Write-Host ""

$configTemplate = @"
# Cloudflare Tunnel 配置
tunnel: <你的隧道ID>
credentials-file: C:\Users\simba\.cloudflared\<你的隧道ID>.json

ingress:
  - hostname: wuyi-trip.你的域名.com
    service: http://localhost:3000
  - service: http_status:404
"@

Write-Host "配置模板:" -ForegroundColor Cyan
Write-Host $configTemplate -ForegroundColor Gray
Write-Host ""

# 步骤5: 添加 DNS
Write-Host "步骤 5: 添加 DNS 记录" -ForegroundColor Yellow
Write-Host "运行: $CLOUDFLARED tunnel route dns wuyi-trip wuyi-trip.你的域名.com" -ForegroundColor Cyan
Write-Host ""

# 步骤6: 运行隧道
Write-Host "步骤 6: 运行隧道" -ForegroundColor Yellow
Write-Host "运行: $CLOUDFLARED tunnel run wuyi-trip" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host " 配置完成后，更新前端 API 地址:" -ForegroundColor Green
Write-Host "   js/message-board.js" -ForegroundColor White
Write-Host "   改为: https://wuyi-trip.你的域名.com/api" -ForegroundColor White
Write-Host "================================" -ForegroundColor Green
