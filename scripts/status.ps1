# ============================================
# 查看后端服务状态
# 用法: .\scripts\status.ps1
# ============================================

$DATA_DIR = "C:\Users\simba\wuyi-trip\data"
$PID_FILE = "$DATA_DIR\backend.pid"
$PORT = 3000

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 后端服务状态" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查 Java 进程
$proc = Get-CimInstance Win32_Process | Where-Object { 
    $_.Name -eq 'java.exe' -and $_.CommandLine -like '*wuyi-trip*'
} | Select-Object -First 1

if ($proc) {
    Write-Host "状态: ✅ 运行中 (Java)" -ForegroundColor Green
    Write-Host "PID:  $($proc.ProcessId)" -ForegroundColor White
    $process = Get-Process -Id $proc.ProcessId
    Write-Host "内存: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor White
} else {
    # 检查 Node 进程（兼容旧版）
    $proc = Get-CimInstance Win32_Process | Where-Object { 
        $_.Name -eq 'node.exe' -and $_.CommandLine -like '*server.js*'
    } | Select-Object -First 1
    
    if ($proc) {
        Write-Host "状态: ✅ 运行中 (Node.js)" -ForegroundColor Green
        Write-Host "PID:  $($proc.ProcessId)" -ForegroundColor White
    } else {
        Write-Host "状态: ❌ 未运行" -ForegroundColor Red
    }
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
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "API:  ✅ 健康检查通过" -ForegroundColor Green
    Write-Host "      留言: $($healthData.data.messages) 条" -ForegroundColor White
    Write-Host "      访问: $($healthData.data.visits) 次" -ForegroundColor White
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

Write-Host "================================" -ForegroundColor Cyan
