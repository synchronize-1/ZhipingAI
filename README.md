# 🎓 智评AI

<div align="center">


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Vue Version](https://img.shields.io/badge/vue-3.4.0-brightgreen)](https://vuejs.org/)
[![MySQL Version](https://img.shields.io/badge/mysql-8.0%2B-blue)](https://www.mysql.com/)
[![Express Version](https://img.shields.io/badge/express-4.18%2B-lightgrey)](https://expressjs.com/)

[功能特性](#-功能特性) • [技术栈](#️-技术栈) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [文档](#-文档)

</div>

---

## 📋 目录

- [项目简介](#-项目简介)
- [核心功能](#-核心功能)
- [AI功能亮点](#-ai功能亮点)
- [技术栈](#️-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [环境配置](#-环境配置)
- [文档](#-文档)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🎯 项目简介

**SmartCampus（智界·灵动校园）** 是一个现代化的智慧校园管理系统，采用前后端分离架构，集成AI技术，为学校提供全方位的数字化管理解决方案。

### 🏗️ 项目组成

```
📦 SmartCampus
 ┣ 🖥️ Web管理后台 (Vue 3 + Element Plus)
 ┃  ┣ 数据可视化大屏
 ┃  ┣ 完整的管理功能
 ┃  ┗ AI智能助手
 ┣ 📱 移动端应用 (uni-app)
 ┃  ┣ H5 / 微信小程序
 ┃  ┣ Android / iOS
 ┃  ┗ 语音助手
 ┗ ⚙️ 后端API服务 (Node.js + Express + MySQL)
    ┣ RESTful API
    ┣ WebSocket实时通讯
    ┗ AI服务集成
```

### ⭐ 核心特色

- 🤖 **AI赋能** - 集成DeepSeek大语言模型，提供智能对话、学习辅导、情感分析等AI功能
- 📷 **OCR识别** - 本地Umi-OCR服务，图片文字识别，保护隐私
- 🎓 **智慧教学** - 智能课表、在线学习、AI学习助手
- 🏫 **便捷服务** - 校园导航、空闲教室查询、食堂人流监测
- 🔒 **智能管理** - 考勤管理、安全监控、能耗分析
- 💡 **个性化** - 成长档案、情感分析、心理建议
- 📊 **数据可视化** - ECharts实时数据大屏
- 🎤 **语音助手** - AI语音交互查询
- 📍 **位置感知** - 基于LBS的智能课前提醒
- 🔄 **实时通讯** - WebSocket实时数据推送

---

## ✨ 核心功能

### 🖥️ Web管理后台

#### 管理功能
- 📊 **数据可视化大屏** - 教室使用率、能耗监测、人流热力图、活动参与度
- 👥 **用户管理** - 学生、教师、管理员的增删改查和权限管理
- 📚 **课程管理** - 课程创建、编辑、删除、教师分配
- 📅 **课表管理** - 智能排课、教室冲突检测、课表查询
- 🏫 **教室管理** - 教室信息、使用状态、预约管理
- ✅ **考勤管理** - 考勤记录、统计分析、报表导出
- 🎯 **活动管理** - 活动发布、报名管理、签到统计
- 🔧 **服务管理** - 报修处理、设备预约、图书借阅

#### AI功能模块
- 🤖 **AI智能助手** - 右下角悬浮助手，支持课表查询、教室查询、智能问答
- 📝 **AI学习助手** - 作业辅导、知识问答、图片识别OCR
- ✍️ **AI写作助手** - 作文写作、文章续写、创意写作、文章润色
- 😊 **AI情感分析** - 情感识别、情感强度分析、关键词提取、心理建议
- 🔬 **AI科普乐园** - AI对话、AI写诗、AI写故事、OCR文字识别
- 📷 **AI智能识别** - 图片文字识别、公式识别、手写文字识别

### 📱 移动端应用

#### 学生端功能
- 📅 **智能课表** - 课前提醒、位置感知、一键导航到教室
- 🏫 **空闲教室** - 实时查询、按楼层筛选、按时间段查询
- 🍽️ **食堂人流** - 实时监测、高峰预测、推荐就餐时间
- 📚 **图书借阅** - 图书搜索、在线借阅、续借、借阅历史
- 🔧 **在线报修** - 故障上报、图片上传、进度查询
- 🗺️ **校园导航** - 3D地图、实时导航、建筑物介绍
- 🎤 **语音助手** - 语音查询课表、教室、天气等
- 🎉 **校园活动** - 活动浏览、在线报名、签到打卡
- 📬 **消息通知** - 实时推送、课程提醒、活动通知

#### 教师端功能
- 📊 **教学管理** - 课程管理、学生管理、成绩录入
- ✅ **考勤统计** - 考勤记录、出勤率分析、缺勤提醒
- 📝 **作业批改** - 作业查看、在线批改、成绩统计

---

## 🤖 AI功能亮点

本项目深度集成AI技术，提供多场景智能服务：

### 1️⃣ DeepSeek大语言模型集成
- **智能对话** - 支持多轮对话，理解上下文
- **学习辅导** - 作业解答、知识讲解、学习建议
- **写作助手** - 作文创作、文章续写、内容润色
- **情感分析** - 文本情感识别、心理健康建议

### 2️⃣ Umi-OCR本地识别
- **图片文字识别** - 支持印刷体、手写体
- **公式识别** - 数学公式、化学方程式
- **多语言支持** - 中文、英文等多语言识别
- **隐私保护** - 本地处理，数据不上传

### 3️⃣ 智能课表助手
- **自然语言查询** - "今天有什么课？"、"明天第一节是什么课？"
- **智能解析** - 前端智能解析课表数据
- **追问建议** - 自动生成相关追问

### 4️⃣ 情感分析系统
- **情感倾向识别** - 积极/消极/中性
- **情感强度分析** - 0-100分值
- **关键词提取** - 识别情感关键词
- **心理建议** - AI生成个性化建议

---

## 🛠️ 技术栈

### 后端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | JavaScript运行环境 |
| Express.js | 4.18+ | Web应用框架 |
| MySQL | 8.0+ | 关系型数据库 |
| mysql2 | 3.6+ | MySQL驱动 |
| jsonwebtoken | 9.0+ | JWT认证 |
| bcryptjs | 2.4+ | 密码加密 |
| Socket.IO | 4.7+ | WebSocket实时通讯 |
| multer | 1.4+ | 文件上传中间件 |
| axios | 1.6+ | HTTP客户端 |
| dotenv | 16.3+ | 环境变量管理 |
| node-cron | 3.0+ | 定时任务 |

### Web前端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 渐进式JavaScript框架 |
| Vite | 5.0+ | 下一代前端构建工具 |
| Element Plus | 2.4+ | Vue 3 UI组件库 |
| Pinia | 2.1+ | Vue状态管理 |
| Vue Router | 4.2+ | Vue官方路由 |
| ECharts | 5.4+ | 数据可视化图表库 |
| axios | 1.6+ | HTTP客户端 |
| Socket.IO Client | 4.7+ | WebSocket客户端 |
| Sass | 1.69+ | CSS预处理器 |
| TailwindCSS | 3.4+ | 实用优先的CSS框架 |
| dayjs | 1.11+ | 轻量级日期处理库 |

### 移动端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| uni-app | 最新 | 跨平台应用开发框架 |
| Vue | 3.x | 前端框架 |
| Pinia | 2.x | 状态管理 |

### AI服务
| 服务 | 说明 |
|------|------|
| DeepSeek API | 大语言模型服务，提供智能对话、写作、分析等功能 |
| Umi-OCR | 本地OCR服务，图片文字识别 |

---

## 📁 项目结构（待更新）

```
SmartCampus/
├── backend-api/                    # 后端API服务
│   ├── src/
│   │   ├── app.js                 # 应用入口
│   │   ├── config/                # 配置文件
│   │   │   └── database.js        # 数据库配置
│   │   ├── middleware/            # 中间件
│   │   │   ├── auth.js           # JWT认证
│   │   │   └── roleCheck.js      # 权限检查
│   │   ├── routes/                # API路由
│   │   │   ├── auth.js           # 认证路由
│   │   │   ├── user.js           # 用户管理
│   │   │   ├── course.js         # 课程管理
│   │   │   ├── schedule.js       # 课表管理
│   │   │   ├── service.js        # 校园服务
│   │   │   ├── aiAgent.js        # AI代理
│   │   │   └── aiScience.js      # AI科学
│   │   ├── services/              # 业务逻辑
│   │   │   └── aiScienceService.js
│   │   ├── websockets/            # WebSocket
│   │   │   └── socketHandlers.js
│   │   └── scripts/               # 脚本
│   │       └── initDatabase.js   # 数据库初始化
│   ├── uploads/                   # 上传文件
│   ├── .env.example              # 环境变量示例
│   └── package.json
│
├── frontend-web-admin/            # Web管理后台
│   ├── src/
│   │   ├── main.js               # 应用入口
│   │   ├── App.vue               # 根组件
│   │   ├── api/                  # API接口
│   │   ├── components/           # 组件
│   │   │   └── AIAssistant.vue  # AI助手
│   │   ├── layouts/              # 布局
│   │   │   └── MainLayout.vue
│   │   ├── router/               # 路由
│   │   │   └── index.js
│   │   ├── stores/               # 状态管理
│   │   ├── views/                # 页面
│   │   │   ├── Login.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── Schedule.vue
│   │   │   ├── AILearning.vue   # AI学习助手
│   │   │   ├── AIWriting.vue    # AI写作助手
│   │   │   ├── AISentiment.vue  # AI情感分析
│   │   │   ├── AIScience.vue    # AI科普乐园
│   │   │   └── AIOCR.vue        # AI智能识别
│   │   └── utils/                # 工具函数
│   └── package.json
│
├── mobile-app/                    # 移动端应用
│   ├── pages/                    # 页面
│   ├── components/               # 组件
│   ├── static/                   # 静态资源
│   ├── utils/                    # 工具
│   ├── store/                    # 状态管理
│   └── package.json
│
├── docs/                          # 项目文档
│   ├── 使用教程.md                # 使用教程
│   └── 项目技术文档.md            # 技术文档
│
├── .gitignore                     # Git忽略文件
├── package.json                   # 根package.json
└── README.md                      # 项目说明
```

---

## 🚀 快速开始

### 📋 环境要求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | 18.0+ | JavaScript运行环境 |
| MySQL | 8.0+ | 关系型数据库 |
| npm | 9.0+ | 包管理器 |

### 📦 安装步骤

#### 1️⃣ 克隆项目

```bash
git clone https://github.com/yourusername/SmartCampus.git
cd SmartCampus
```

#### 2️⃣ 安装依赖

```bash
# 方式一：一键安装所有模块依赖（推荐）
npm run install:all

# 方式二：分别安装各模块依赖
cd backend-api && npm install
cd ../frontend-web-admin && npm install
cd ../mobile-app && npm install
```

> **注意**: 首次安装可能需要较长时间，请耐心等待

#### 3️⃣ 配置数据库

1. 创建MySQL数据库：

```sql
CREATE DATABASE smart_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 复制环境变量配置文件：

```bash
cd backend-api
cp .env.example .env
```

3. 编辑 `backend-api/.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=smart_campus

# 服务器配置
PORT=3000
JWT_SECRET=your-secret-key-change-this

# DeepSeek AI配置（可选）
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# Umi-OCR配置（可选）
UMI_OCR_URL=http://127.0.0.1:1224/api/ocr
```

#### 4️⃣ 初始化数据库

```bash
cd backend-api
npm run init:db
```

成功后会显示：
```
✅ 数据库初始化成功！（暂时只开发了管理员端口，融合了学生端的部分内容）
✅ 已创建测试账号：
   管理员: admin / admin123
   教师: teacher1 / teacher123
   学生: student1 / student123
```

#### 5️⃣ 启动项目

```bash
# 启动后端服务
cd backend-api
npm run dev
# 后端服务运行在: http://localhost:3000

# 新开终端，启动Web前端
cd frontend-web-admin
npm run dev
# Web前端运行在: http://localhost:5173

# 新开终端，启动移动端（可选）
cd mobile-app
npm run dev:h5
# 移动端运行在: http://localhost:8080
```

#### 6️⃣ 访问系统

- **Web管理后台**: http://localhost:5173
- **后端API**: http://localhost:3000
- **移动端H5**: http://localhost:8080

### 👤 测试账号

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|---------|
| 管理员 | admin | admin123 | 拥有所有权限 |
| 教师 | teacher1 | teacher123 | 教学管理权限 |
| 学生 | student1 | student123 | 学生功能权限 |

---

## ⚙️ 环境配置

### DeepSeek AI配置（可选）

如需使用AI功能，请配置DeepSeek API：

1. 访问 [DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册并创建API密钥
3. 在 `backend-api/.env` 中配置：
   ```env
   DEEPSEEK_API_KEY=sk-your-api-key
   DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
   ```

### Umi-OCR配置（可选）

如需使用OCR文字识别功能：

1. 下载 [Umi-OCR](https://github.com/hiroi-sora/Umi-OCR)
2. 运行Umi-OCR并开启HTTP服务（端口1224）
3. 在 `backend-api/.env` 中配置：
   ```env
   UMI_OCR_URL=http://127.0.0.1:1224/api/ocr
   ```

---

## 📚 文档

- 📖 **[三端交互流程](docs/三端交互流程.md)** - 管理员、教师、学生交互流程
- 🔧 **[项目技术文档](./docs/项目技术文档.md)** - 完整的技术架构、API文档和开发指南


## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

---

## 📝 开发计划

- ……
---

## ❓ 常见问题

### 1. 安装依赖失败？
```bash
# 清除缓存重试
npm cache clean --force
npm install
```

### 2. 数据库连接失败？
- 检查MySQL服务是否启动
- 确认 `.env` 配置是否正确
- 检查数据库用户权限

### 3. AI功能无法使用？
- 确认DeepSeek API Key是否配置
- 检查API Key是否有余额
- 查看后端日志确认错误信息

### 4. 端口被占用？
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <进程号> /F

# Linux/Mac
lsof -i :3000
kill -9 <进程号>
```

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证

---

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [Express.js](https://expressjs.com/)
- [uni-app](https://uniapp.dcloud.io/)
- [ECharts](https://echarts.apache.org/)
- [DeepSeek](https://www.deepseek.com/)
- [Umi-OCR](https://github.com/hiroi-sora/Umi-OCR)


<div align="center">

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！

Made with ❤️ by synduality

</div>
