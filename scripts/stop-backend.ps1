# ============================================
# 停止后端服务
# 用法: .\scripts\stop-backend.ps1
# ============================================

$DATA_DIR = "C:\Users\simba\wuyi-trip\data"
$PID_FILE = "$DATA_DIR\backend.pid"
$PORT = 3000

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 停止后端服务" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$stopped = $false

# 方法1: 通过 PID 文件
if (Test-Path $PID_FILE) {
    $procId = Get-Content $PID_FILE -Raw
    $procId = $procId.Trim()
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $procId -Force
        Write-Host "✅ 已停止进程 (PID: $procId)" -ForegroundColor Green
        $stopped = $true
    }
    Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
}

# 方法2: 通过进程名 (Java)
$procs = Get-CimInstance Win32_Process | Where-Object { 
    $_.Name -eq 'java.exe' -and $_.CommandLine -like '*wuyi-trip*'
}
foreach ($proc in $procs) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 已停止 Java 进程 (PID: $($proc.ProcessId))" -ForegroundColor Green
    $stopped = $true
}

# 方法3: 通过进程名 (Node.js 兼容旧版)
$procs = Get-CimInstance Win32_Process | Where-Object { 
    $_.Name -eq 'node.exe' -and $_.CommandLine -like '*server.js*'
}
foreach ($proc in $procs) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 已停止 Node 进程 (PID: $($proc.ProcessId))" -ForegroundColor Green
    $stopped = $true
}

# 方法4: 通过端口
$conn = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
foreach ($c in $conn) {
    if ($c.OwningProcess) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ 已释放端口 $PORT (PID: $($c.OwningProcess))" -ForegroundColor Green
        $stopped = $true
    }
}

if ($stopped) {
    Write-Host ""
    Write-Host "✅ 后端服务已停止" -ForegroundColor Green
} else {
    Write-Host "⚠️  没有找到运行的后端服务" -ForegroundColor Yellow
}

Write-Host "================================" -ForegroundColor Cyan
