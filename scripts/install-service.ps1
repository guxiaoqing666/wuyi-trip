# ============================================
# 安装为 Windows 服务（开机自启）
# 需要管理员权限
# 用法: 右键 -> 以管理员身份运行 PowerShell -> .\scripts\install-service.ps1
# ============================================

$ErrorActionPreference = "Stop"

$BACKEND_DIR = "C:\Users\simba\wuyi-trip\backend"
$DATA_DIR = "C:\Users\simba\wuyi-trip\data"
$SERVICE_NAME = "WuyiTripBackend"

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 安装 Windows 服务" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查管理员权限
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "❌ 需要管理员权限，请右键以管理员身份运行 PowerShell"
    exit 1
}

# 检查 nssm（Non-Sucking Service Manager）
$nssm = Get-Command nssm -ErrorAction SilentlyContinue
if (!$nssm) {
    Write-Host "📥 下载 nssm..."
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $nssmZip = "$env:TEMP\nssm.zip"
    $nssmDir = "C:\nssm"
    
    Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip
    Expand-Archive -Path $nssmZip -DestinationPath $nssmDir -Force
    
    $nssmPath = if ([Environment]::Is64BitOperatingSystem) {
        "$nssmDir\nssm-2.24\win64\nssm.exe"
    } else {
        "$nssmDir\nssm-2.24\win32\nssm.exe"
    }
    
    # 添加到 PATH
    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$nssmDir", "Machine")
    $env:Path += ";$nssmDir"
    
    $nssm = $nssmPath
} else {
    $nssm = "nssm"
}

# 检查现有服务
$existingService = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "⚠️  服务已存在，先移除..."
    & $nssm stop $SERVICE_NAME 2>$null
    & $nssm remove $SERVICE_NAME confirm 2>$null
    Start-Sleep -Seconds 2
}

# 安装服务
Write-Host "🔧 安装服务..."
& $nssm install $SERVICE_NAME "node"
& $nssm set $SERVICE_NAME Application "node"
& $nssm set $SERVICE_NAME AppDirectory $BACKEND_DIR
& $nssm set $SERVICE_NAME AppParameters "server.js"
& $nssm set $SERVICE_NAME DisplayName "武夷自驾游后端服务"
& $nssm set $SERVICE_NAME Description "武夷自驾游行程网页后端服务"
& $nssm set $SERVICE_NAME Start SERVICE_AUTO_START
& $nssm set $SERVICE_NAME AppStdout "$DATA_DIR\service.log"
& $nssm set $SERVICE_NAME AppStderr "$DATA_DIR\service-error.log"

# 启动服务
Write-Host "🚀 启动服务..."
& $nssm start $SERVICE_NAME

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host " ✅ 服务安装完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host " 服务名: $SERVICE_NAME" -ForegroundColor White
Write-Host " 启动方式: 自动（开机自启）" -ForegroundColor White
Write-Host ""
Write-Host " 管理命令:" -ForegroundColor Cyan
Write-Host "   启动: net start $SERVICE_NAME" -ForegroundColor White
Write-Host "   停止: net stop $SERVICE_NAME" -ForegroundColor White
Write-Host "   删除: sc delete $SERVICE_NAME" -ForegroundColor White
Write-Host "================================" -ForegroundColor Green
