# 🚗 五一自驾游行程网页

一个精美的五一自驾游行程展示网页，包含实时天气、智能行程进度、语音播报、旅行海报生成、匿名留言板等功能。

## 🌐 在线访问

**前端页面**: https://guxiaoqing666.github.io/wuyi-trip/

> ⚠️ 留言板功能需要本地后端服务运行（见下方说明）

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🌤️ 实时天气 | 5天天气预报（Open-Meteo API） |
| 📅 智能进度 | 根据当前时间自动高亮进行中的行程 |
| 🔊 语音播报 | TTS 语音播报当日行程 |
| 🖼️ 旅行海报 | Canvas 生成精美旅行海报 |
| 📝 旅行日记 | 本地存储，记录美好瞬间 |
| 💬 匿名留言板 | 本地后端服务，支持弹幕效果 |
| 📊 访问统计 | 记录访问数据 |

---

## 🖥️ 本地后端服务（可选）

留言板、访问统计等功能需要本地后端服务支持。

### 快速启动

```powershell
# 1. 进入项目目录
cd C:\Users\simba\wuyi-trip

# 2. 启动后端服务
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1

# 3. 查看状态
powershell -ExecutionPolicy Bypass -File .\scripts\status.ps1

# 4. 停止服务
powershell -ExecutionPolicy Bypass -File .\scripts\stop-backend.ps1
```

### 安装为 Windows 服务（开机自启）

```powershell
# 以管理员身份运行 PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\install-service.ps1
```

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/messages` | 获取留言列表 |
| POST | `/api/messages` | 发送留言 |
| POST | `/api/visit` | 记录访问 |
| GET | `/api/stats` | 访问统计 |
| GET | `/api/health` | 健康检查 |

---

## 🤖 Self-Hosted Runner 自动部署

配置 GitHub Actions Self-Hosted Runner，实现代码推送后自动部署后端服务。

详见 [RUNNER_SETUP.md](./RUNNER_SETUP.md)

### 快速配置

1. **注册 Runner**: GitHub 仓库 → Settings → Actions → Runners → New self-hosted runner
2. **下载配置**:
   ```powershell
   mkdir C:\github-runner; cd C:\github-runner
   Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-win-x64-2.323.0.zip -OutFile actions-runner.zip
   Expand-Archive -Path actions-runner.zip -DestinationPath .
   .\config.cmd --url https://github.com/guxiaoqing666/wuyi-trip --token YOUR_TOKEN
   ```
3. **安装服务**:
   ```powershell
   .\svc.cmd install
   .\svc.cmd start
   ```

---

## 📁 项目结构

```
wuyi-trip/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式
├── js/
│   ├── data.js             # 行程数据
│   ├── weather.js          # 天气 API
│   ├── message-board.js    # 留言板
│   ├── progress.js         # 行程进度
│   ├── tts.js              # 语音播报
│   ├── poster.js           # 海报生成
│   ├── diary.js            # 旅行日记
│   └── nav.js              # 导航
├── backend/
│   ├── server.js           # 后端服务
│   └── package.json        # 依赖
├── scripts/
│   ├── start-backend.ps1   # 启动脚本
│   ├── stop-backend.ps1    # 停止脚本
│   ├── status.ps1          # 状态查看
│   └── install-service.ps1 # 安装服务
├── data/                   # 数据文件（自动创建）
│   ├── messages.json       # 留言数据
│   └── visits.json         # 访问记录
└── .github/workflows/
    └── deploy-backend.yml  # 自动部署工作流
```

---

## 🚀 部署到 GitHub Pages

### 自动部署（推荐）

```powershell
# 在 PowerShell 中运行
.\deploy.ps1
```

按提示输入 GitHub 用户名即可。

### 手动部署

```bash
# 1. 初始化Git
git init
git add .
git commit -m "五一行程网页"

# 2. 关联远程仓库（替换用户名）
git remote add origin https://github.com/你的用户名/wuyi-trip.git

# 3. 推送
git branch -M main
git push -u origin main

# 4. GitHub仓库 Settings → Pages → Source选main/root → Save
```

---

## 🗺️ 高德地图 Key 配置

如需显示地图：

1. 访问 [lbs.amap.com](https://lbs.amap.com) 注册账号
2. 创建应用 → 添加 Key（Web端JS API）
3. 域名白名单添加：`你的用户名.github.io` 和 `*.github.io`
4. 修改 `index.html` 中的 `AMAP_CONFIG.key`

---

## 📅 行程概览

| 天数 | 路线 | 主题 |
|------|------|------|
| Day1 | 合肥→高邮→连云港 | 高邮快闪+海边初体验 |
| Day2 | 连云港全天 | 连岛深度+海上云台山 |
| Day3 | 连云港→日照 | 海岸休闲+东夷小镇 |
| Day4 | 日照→徐州 | 云龙湖深度慢游 |
| Day5 | 徐州→合肥 | 古街晨游+返程 |

---

## 🛠️ 技术栈

- **前端**: 纯 HTML + CSS + JavaScript
- **后端**: Node.js (原生 http 模块)
- **天气**: Open-Meteo API
- **地图**: 高德地图 JS API
- **CI/CD**: GitHub Actions + Self-Hosted Runner
- **设计**: 响应式设计（手机优先）

---

## ⚠️ 注意事项

1. **本地后端**: 留言板等功能需要电脑开机并运行后端服务
2. **数据存储**: 所有数据保存在本地 `data/` 目录
3. **网络访问**: 外网访问需要内网穿透或云服务器
4. **浏览器限制**: GitHub Pages 无法直接访问 localhost

---

## 📄 许可证

MIT License
