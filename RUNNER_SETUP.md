# 🤖 Self-Hosted Runner 部署指南

让你的本地电脑成为 GitHub Actions 的构建服务器，自动部署后端服务。

---

## 📋 前提条件

- Windows 10/11 电脑
- Node.js 20+ 已安装
- Git 已安装
- 电脑需要 24 小时开机（或按需开机）

---

## 第一步：注册 GitHub Runner

### 1.1 获取注册 Token

1. 打开仓库页面：`https://github.com/guxiaoqing666/wuyi-trip`
2. 点击 **Settings** → **Actions** → **Runners**
3. 点击 **New self-hosted runner**
4. 选择 **Windows** 和 **x64**
5. 复制配置命令中的 token（例如：`ABCD1234EFGH5678`）

### 1.2 下载并配置 Runner

以**管理员身份**打开 PowerShell，执行：

```powershell
# 创建目录
mkdir C:\github-runner
cd C:\github-runner

# 下载 Runner（版本可能更新，以 GitHub 页面为准）
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-win-x64-2.323.0.zip -OutFile actions-runner.zip

# 解压
Expand-Archive -Path actions-runner.zip -DestinationPath .

# 配置（把 YOUR_TOKEN 换成实际的 token）
.\config.cmd --url https://github.com/guxiaoqing666/wuyi-trip --token YOUR_TOKEN --name "wuyi-trip-local" --labels "self-hosted,local,backend"
```

配置时会询问：
- **Runner name**: `wuyi-trip-local`（或自定义）
- **Labels**: 按回车使用默认，或输入 `self-hosted,local,backend`
- **Work folder**: 按回车使用默认 `_work`

---

## 第二步：安装为 Windows 服务（推荐）

这样 Runner 会开机自启，不需要手动运行：

```powershell
cd C:\github-runner

# 安装为服务
.\svc.cmd install

# 启动服务
.\svc.cmd start

# 查看状态
.\svc.cmd status
```

---

## 第三步：测试自动部署

### 3.1 手动触发部署

1. 打开仓库页面
2. 点击 **Actions** → **Deploy Backend to Self-Hosted Runner**
3. 点击 **Run workflow** → **Run workflow**
4. 等待执行完成

### 3.2 自动触发

下次推送代码到 `main` 分支，且修改了以下文件时，会自动部署：
- `backend/**`
- `scripts/**`
- `.github/workflows/deploy-backend.yml`

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `.github/workflows/deploy-backend.yml` | GitHub Actions 工作流 |
| `scripts/start-backend.ps1` | 手动启动后端 |
| `scripts/stop-backend.ps1` | 手动停止后端 |
| `scripts/status.ps1` | 查看状态 |
| `scripts/install-service.ps1` | 安装为 Windows 服务 |

---

## 🔧 日常管理

### 查看 Runner 状态

```powershell
# 服务状态
Get-Service actions.runner.*

# 进程
Get-Process Runner.Listener
```

### 重启 Runner

```powershell
cd C:\github-runner
.\svc.cmd stop
.\svc.cmd start
```

### 查看部署日志

```powershell
# GitHub Actions 日志
# 在仓库页面 Actions 标签查看

# 后端服务日志
Get-Content C:\Users\simba\wuyi-trip\data\backend.log -Tail 50
```

---

## 🚀 后端服务管理

### 手动启动

```powershell
cd C:\Users\simba\wuyi-trip
.\scripts\start-backend.ps1
```

### 手动停止

```powershell
cd C:\Users\simba\wuyi-trip
.\scripts\stop-backend.ps1
```

### 查看状态

```powershell
cd C:\Users\simba\wuyi-trip
.\scripts\status.ps1
```

### 安装为 Windows 服务（开机自启）

```powershell
# 以管理员身份运行
C:\Users\simba\wuyi-trip\scripts\install-service.ps1
```

---

## ⚠️ 注意事项

1. **电脑必须开机**：关机时服务不可用
2. **网络连接**：需要联网才能接收 GitHub 任务
3. **防火墙**：Runner 使用出站连接，一般不需要额外配置
4. **权限**：安装服务需要管理员权限

---

## 🐛 故障排除

### Runner 显示 Offline

```powershell
# 重启服务
cd C:\github-runner
.\svc.cmd stop
Start-Sleep 5
.\svc.cmd start
```

### 部署失败

1. 查看 Actions 日志：仓库页面 → Actions → 失败的运行
2. 检查后端日志：`C:\Users\simba\wuyi-trip\data\backend.log`
3. 手动测试：`.\scripts\start-backend.ps1`

### 端口被占用

```powershell
# 查看占用 3000 端口的进程
Get-NetTCPConnection -LocalPort 3000

# 停止进程
Stop-Process -Id <PID> -Force
```

---

## 📊 架构图

```
GitHub (云端)
    │
    │ push 代码到 main 分支
    ▼
GitHub Actions ──► 触发 deploy-backend.yml
    │
    │ 下发任务（通过已有连接）
    ▼
Self-Hosted Runner（你的电脑）
    │
    │ 执行部署步骤
    ▼
Node.js 后端服务 (localhost:3000)
    │
    │ 提供 API
    ▼
本地数据文件 (data/*.json)
```

---

有问题？查看 [GitHub 官方文档](https://docs.github.com/en/actions/hosting-your-own-runners)
