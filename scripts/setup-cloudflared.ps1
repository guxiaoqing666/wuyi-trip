# ============================================
# Cloudflare Tunnel 配置脚本
# 用法: 以管理员运行 PowerShell
#       .\scripts\setup-cloudflared.ps1
# ============================================

$ErrorActionPreference = "Stop"

$PROJECT_DIR = "C:\Users\simba\wuyi-trip"
$CLOUDFLARED = "$PROJECT_DIR\cloudflared.exe"

Write-Host "================================" -ForegroundColor Cyan
Write-Host " Cloudflare Tunnel 配置" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. 下载 cloudflared
if (!(Test-Path $CLOUDFLARED)) {
    Write-Host "📥 下载 cloudflared..."
    try {
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $CLOUDFLARED -TimeoutSec 300
        Write-Host "✅ 下载完成"
    } catch {
        Write-Error "❌ 下载失败，请手动下载: https://github.com/cloudflare/cloudflared/releases"
        exit 1
    }
}

# 2. 检查版本
Write-Host ""
Write-Host "📋 cloudflared 版本:"
& $CLOUDFLARED --version

# 3. 登录提示
Write-Host ""
Write-Host "================================" -ForegroundColor Yellow
Write-Host " 下一步：登录 Cloudflare" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "请运行以下命令登录：" -ForegroundColor White
Write-Host ""
Write-Host "  $CLOUDFLARED tunnel login" -ForegroundColor Cyan
Write-Host ""
Write-Host "这会打开浏览器让你授权。" -ForegroundColor White
Write-Host ""
Write-Host "登录后，创建隧道：" -ForegroundColor White
Write-Host ""
Write-Host "  $CLOUDFLARED tunnel create wuyi-trip" -ForegroundColor Cyan
Write-Host ""
Write-Host "然后查看隧道列表获取 ID：" -ForegroundColor White
Write-Host ""
Write-Host "  $CLOUDFLARED tunnel list" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================" -ForegroundColor Yellow

# 4. 保存配置模板
$configDir = "$env:USERPROFILE\.cloudflared"
if (!(Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$configTemplate = @"
# Cloudflare Tunnel 配置模板
# 1. 替换 <隧道ID> 为你创建的隧道 ID
# 2. 替换 yourdomain.com 为你的域名

tunnel: <隧道ID>
credentials-file: $configDir\<隧道ID>.json

ingress:
  - hostname: wuyi-trip.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
"@

$configTemplate | Out-File -FilePath "$configDir\config.yml.template" -Encoding UTF8

Write-Host ""
Write-Host "✅ 配置模板已保存到: $configDir\config.yml.template" -ForegroundColor Green
Write-Host ""
Write-Host "编辑后重命名为 config.yml，然后运行：" -ForegroundColor White
Write-Host ""
Write-Host "  $CLOUDFLARED tunnel run wuyi-trip" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================" -ForegroundColor Green
