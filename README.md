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

**智评AI，采用前后端分离架构，集成AI技术，为管理者、学生、教师的AI健康使用而服务

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
- 💡 **个性化** - 成长档案、情感分析、心理建议
- 📊 **数据可视化** - ECharts实时数据大屏
- 🎤 **语音助手** - AI语音交互查询
- 🔄 **实时通讯** - WebSocket实时数据推送

---

## ✨ 核心功能

### 🖥️ Web管理后台

#### 管理功能
- 📊 **数据可视化大屏** - 教室使用率、能耗监测、人流热力图、活动参与度
- 👥 **用户管理** - 学生、教师、管理员的增删改查和权限管理
- 📚 **课程管理** - 课程创建、编辑、删除、教师分配

#### AI功能模块
- 🤖 **AI智能助手** - 右下角悬浮助手，支持课表查询、教室查询、智能问答
- 📝 **AI学习助手** - 作业辅导、知识问答、图片识别OCR
- ✍️ **AI写作助手** - 作文写作、文章续写、创意写作、文章润色
- 😊 **AI情感分析** - 情感识别、情感强度分析、关键词提取、心理建议
- 🔬 **AI科普乐园** - AI对话、AI写诗、AI写故事、OCR文字识别
- 📷 **AI智能识别** - 图片文字识别、公式识别、手写文字识别


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


### AI服务
| 服务 | 说明 |
|------|------|
| DeepSeek API | 大语言模型服务，提供智能对话、写作、分析等功能 |
| Umi-OCR | 本地OCR服务，图片文字识别 |

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

- 克隆项目，cd对应文件夹

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
