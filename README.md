# 🚗 五一自驾游行程网页

## 在线访问

部署后访问：`https://你的用户名.github.io/wuyi-trip/`

## 本地使用

```bash
# 方式一：直接打开
双击 index.html

# 方式二：本地服务器
cd wuyi-trip
node server.js
# 访问 http://localhost:8080
```

## 部署到GitHub Pages

### 自动部署（推荐）

```powershell
# 在 PowerShell 中运行
.\deploy.ps1
```

按提示输入GitHub用户名即可。

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

## 高德地图Key配置

如需显示地图：

1. 访问 [lbs.amap.com](https://lbs.amap.com) 注册账号
2. 创建应用 → 添加Key（Web端JS API）
3. 域名白名单添加：`你的用户名.github.io` 和 `*.github.io`
4. 修改 `index.html` 中的 `AMAP_CONFIG.key`

## 行程概览

| 天数 | 路线 | 主题 |
|------|------|------|
| Day1 | 合肥→高邮→连云港 | 高邮快闪+海边初体验 |
| Day2 | 连云港全天 | 连岛深度+海上云台山 |
| Day3 | 连云港→日照 | 海岸休闲+东夷小镇 |
| Day4 | 日照→徐州 | 云龙湖深度慢游 |
| Day5 | 徐州→合肥 | 古街晨游+返程 |

## 技术栈

- 纯 HTML + CSS + JavaScript
- 高德地图 JS API
- 响应式设计（手机优先）
