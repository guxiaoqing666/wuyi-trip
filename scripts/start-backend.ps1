# ============================================
# 启动后端服务脚本
# 用法: .\scripts\start-backend.ps1
# ============================================

$ErrorActionPreference = "Stop"

$BACKEND_DIR = "C:\Users\simba\wuyi-trip\backend"
$DATA_DIR = "C:\Users\simba\wuyi-trip\data"
$LOG_FILE = "$DATA_DIR\backend.log"
$PID_FILE = "$DATA_DIR\backend.pid"
$PORT = 3000

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 启动后端服务" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查 Node.js
$nodeVersion = node --version 2>$null
if (!$nodeVersion) {
    Write-Error "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
}
Write-Host "✅ Node.js: $nodeVersion"

# 确保数据目录存在
if (!(Test-Path $DATA_DIR)) {
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
    Write-Host "✅ 创建数据目录: $DATA_DIR"
}

# 检查是否已在运行
$existingPid = $null
if (Test-Path $PID_FILE) {
    $existingPid = Get-Content $PID_FILE -Raw
    $existingPid = $existingPid.Trim()
    
    $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "⚠️  后端服务已在运行 (PID: $existingPid)" -ForegroundColor Yellow
        Write-Host "   访问: http://localhost:$PORT"
        Write-Host "   如需重启，先运行: .\scripts\stop-backend.ps1"
        exit 0
    }
}

# 检查端口占用
$portInUse = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  端口 $PORT 被占用，尝试释放..." -ForegroundColor Yellow
    $portInUse | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# 安装依赖
Write-Host "📦 检查依赖..."
Set-Location $BACKEND_DIR
if (!(Test-Path "node_modules")) {
    npm install
}

# 启动服务
Write-Host "🚀 启动后端服务..."
$proc = Start-Process -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $BACKEND_DIR `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $LOG_FILE `
    -RedirectStandardError $LOG_FILE

# 保存 PID
$proc.Id | Out-File -FilePath $PID_FILE -Force

Write-Host "⏳ 等待服务启动..."
Start-Sleep -Seconds 3

# 健康检查
$healthy = $false
$retries = 5
for ($i = 1; $i -le $retries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Write-Host "   尝试 $i/$retries..."
        Start-Sleep -Seconds 2
    }
}

if ($healthy) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host " ✅ 后端服务启动成功！" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host " 地址: http://localhost:$PORT" -ForegroundColor White
    Write-Host " PID:  $($proc.Id)" -ForegroundColor White
    Write-Host " 日志: $LOG_FILE" -ForegroundColor White
    Write-Host ""
    Write-Host " API 端点:" -ForegroundColor Cyan
    Write-Host "   GET  /api/messages    - 获取留言" -ForegroundColor White
    Write-Host "   POST /api/messages    - 发送留言" -ForegroundColor White
    Write-Host "   POST /api/visit       - 记录访问" -ForegroundColor White
    Write-Host "   GET  /api/stats       - 访问统计" -ForegroundColor White
    Write-Host "   GET  /api/health      - 健康检查" -ForegroundColor White
    Write-Host "================================" -ForegroundColor Green
} else {
    Write-Error "❌ 后端服务启动失败，请检查日志: $LOG_FILE"
    exit 1
}
