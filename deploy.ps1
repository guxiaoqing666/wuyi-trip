# ============================================
# 五一行程网页 - GitHub Pages 部署脚本
# 使用方法：在 PowerShell 中运行 .\deploy.ps1
# ============================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  五一行程网页部署工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查Git是否安装
try {
    $gitVersion = git --version 2>$null
    if (-not $gitVersion) {
        throw "Git not found"
    }
    Write-Host "✅ Git已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git未安装，正在安装..." -ForegroundColor Red
    Write-Host "请等待安装完成，或手动从 https://git-scm.com/download/win 下载安装" -ForegroundColor Yellow
    
    # 尝试用winget安装
    try {
        winget install Git.Git --accept-source-agreements --accept-package-agreements
        Write-Host "✅ Git安装完成，请重新运行此脚本" -ForegroundColor Green
        exit
    } catch {
        Write-Host "❌ 自动安装失败，请手动安装Git后重试" -ForegroundColor Red
        exit
    }
}

# 获取GitHub用户名
Write-Host ""
$username = Read-Host "请输入你的GitHub用户名"
if (-not $username) {
    Write-Host "❌ 用户名不能为空" -ForegroundColor Red
    exit
}

# 检查是否在正确的目录
$currentDir = Get-Location
if (-not (Test-Path "index.html")) {
    Write-Host "❌ 当前目录不是wuyi-trip项目根目录" -ForegroundColor Red
    Write-Host "请先 cd 到 C:\Users\simba\wuyi-trip 再运行" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "📁 项目目录: $currentDir" -ForegroundColor Cyan
Write-Host "🐙 GitHub用户名: $username" -ForegroundColor Cyan
Write-Host ""

# 初始化Git仓库
if (Test-Path ".git") {
    Write-Host "⚠️ Git仓库已存在，跳过初始化" -ForegroundColor Yellow
} else {
    Write-Host "🔧 初始化Git仓库..." -ForegroundColor Cyan
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Git初始化失败" -ForegroundColor Red
        exit
    }
    Write-Host "✅ Git仓库初始化完成" -ForegroundColor Green
}

# 配置Git用户信息（如未配置）
$gitUserName = git config user.name 2>$null
$gitUserEmail = git config user.email 2>$null

if (-not $gitUserName) {
    $defaultName = $username
    $inputName = Read-Host "请输入Git用户名(直接回车使用: $defaultName)"
    if (-not $inputName) { $inputName = $defaultName }
    git config user.name "$inputName"
}

if (-not $gitUserEmail) {
    $defaultEmail = "${username}@users.noreply.github.com"
    $inputEmail = Read-Host "请输入Git邮箱(直接回车使用: $defaultEmail)"
    if (-not $inputEmail) { $inputEmail = $defaultEmail }
    git config user.email "$inputEmail"
}

# 添加文件
Write-Host ""
Write-Host "📦 添加文件到Git..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 添加文件失败" -ForegroundColor Red
    exit
}
Write-Host "✅ 文件添加完成" -ForegroundColor Green

# 提交
Write-Host ""
Write-Host "💾 提交更改..." -ForegroundColor Cyan
git commit -m "五一行程网页初始版本"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ 没有新更改需要提交，或提交失败" -ForegroundColor Yellow
}

# 添加远程仓库
Write-Host ""
Write-Host "🔗 配置远程仓库..." -ForegroundColor Cyan
$remoteUrl = "https://github.com/$username/wuyi-trip.git"

# 检查是否已有远程仓库
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "⚠️ 远程仓库已存在: $existingRemote" -ForegroundColor Yellow
    $changeRemote = Read-Host "是否更换为新的远程仓库? (y/n)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        git remote remove origin
        git remote add origin $remoteUrl
        Write-Host "✅ 远程仓库已更新" -ForegroundColor Green
    }
} else {
    git remote add origin $remoteUrl
    Write-Host "✅ 远程仓库已添加: $remoteUrl" -ForegroundColor Green
}

# 推送
Write-Host ""
Write-Host "🚀 推送到GitHub..." -ForegroundColor Cyan
Write-Host "⚠️  如果提示输入密码，请输入你的GitHub密码" -ForegroundColor Yellow
Write-Host "⚠️  如果开启了两步验证，需使用Personal Access Token代替密码" -ForegroundColor Yellow
Write-Host ""

git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✅ 推送成功!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 下一步操作:" -ForegroundColor Cyan
    Write-Host "1. 打开 https://github.com/$username/wuyi-trip" -ForegroundColor White
    Write-Host "2. 点击 Settings → Pages" -ForegroundColor White
    Write-Host "3. Source 选择 'Deploy from a branch'" -ForegroundColor White
    Write-Host "4. Branch 选择 'main' / '(root)'" -ForegroundColor White
    Write-Host "5. 点击 Save" -ForegroundColor White
    Write-Host ""
    Write-Host "⏳ 等待1-2分钟后，访问:" -ForegroundColor Cyan
    Write-Host "   https://$username.github.io/wuyi-trip/" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "1. GitHub仓库不存在 - 请先创建仓库" -ForegroundColor White
    Write-Host "2. 用户名或密码错误" -ForegroundColor White
    Write-Host "3. 开启了两步验证 - 需使用Personal Access Token" -ForegroundColor White
    Write-Host ""
    Write-Host "解决步骤:" -ForegroundColor Cyan
    Write-Host "1. 访问 https://github.com/new 创建名为 'wuyi-trip' 的仓库" -ForegroundColor White
    Write-Host "2. 如开启了两步验证，访问 https://github.com/settings/tokens 生成Token" -ForegroundColor White
    Write-Host "3. 重新运行此脚本" -ForegroundColor White
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
