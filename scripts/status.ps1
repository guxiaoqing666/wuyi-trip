# ============================================
# 查看后端服务状态
# 用法: .\scripts\status.ps1
# ============================================

$DATA_DIR = "C:\Users\simba\wuyi-trip\data"
$PID_FILE = "$DATA_DIR\backend.pid"
$LOG_FILE = "$DATA_DIR\backend.log"
$PORT = 3000

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 后端服务状态" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查进程
$proc = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*backend/server.js*" } | Select-Object -First 1

if ($proc) {
    Write-Host "状态: ✅ 运行中" -ForegroundColor Green
    Write-Host "PID:  $($proc.ProcessId)" -ForegroundColor White
    Write-Host "启动: $($proc.CreationDate)" -ForegroundColor White
    
    # 内存使用
    $process = Get-Process -Id $proc.ProcessId
    Write-Host "内存: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor White
} else {
    Write-Host "状态: ❌ 未运行" -ForegroundColor Red
}

# 检查端口
$conn = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "端口: ✅ $PORT 正在监听" -ForegroundColor Green
} else {
    Write-Host "端口: ❌ $PORT 未监听" -ForegroundColor Red
}

# 测试 API
try {
    $health = Invoke-WebRequest -Uri "http://localhost:$PORT/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "API:  ✅ 健康检查通过" -ForegroundColor Green
} catch {
    Write-Host "API:  ❌ 健康检查失败" -ForegroundColor Red
}

# 数据文件
$messagesFile = "$DATA_DIR\messages.json"
$visitsFile = "$DATA_DIR\visits.json"

if (Test-Path $messagesFile) {
    $messages = Get-Content $messagesFile | ConvertFrom-Json
    Write-Host "留言: $($messages.Length) 条" -ForegroundColor White
}

if (Test-Path $visitsFile) {
    $visits = Get-Content $visitsFile | ConvertFrom-Json
    Write-Host "访问: $($visits.Length) 次" -ForegroundColor White
}

# 日志
if (Test-Path $LOG_FILE) {
    $logSize = (Get-Item $LOG_FILE).Length
    Write-Host "日志: $([math]::Round($logSize / 1KB, 2)) KB" -ForegroundColor White
}

Write-Host "================================" -ForegroundColor Cyan
