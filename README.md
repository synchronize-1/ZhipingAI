# 智评校园 SmartCampus

> 面向中小学的教学质量评估与学生成长档案管理平台

## 项目简介

智评校园是一个以**教学质量评估**和**学生成长档案**为核心的智慧校园管理系统。系统采用前后端分离架构，通过数据驱动的学情分析帮助教师和管理者精准掌握教学效果，同时为每位学生建立贯穿在校期间的综合成长档案。

### 核心价值

- **教学质量评估**：成绩录入、班级/年级学情分析、学生个人画像，数据驱动教学改进
- **学生成长档案**：技能、荣誉、心理健康、学期评语的全维度成长记录
- **AI 赋能**：DeepSeek AI 嵌入具体教学场景（学情诊断、智能评语），不做独立聊天玩具

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts | Vue 3.4 / Vite 5.0 |
| 后端 | Node.js + Express + MySQL 8.0+ | Express 4.18 |
| 认证 | JWT + bcryptjs | - |
| 实时通信 | Socket.IO | 4.7 |
| AI 服务 | DeepSeek API（可选） | - |
| OCR | Umi-OCR 本地服务（可选） | - |

## 项目结构

```
SmartCampus-main/
├── backend-api/                  # 后端 API 服务
│   ├── src/
│   │   ├── config/               # 数据库 & 统一配置
│   ├── middleware/               # 认证、错误处理
│   ├── models/                   # 数据模型层（M）
│   ├── services/                 # 业务服务层（S）
│   ├── routes/                   # 路由层（C）
│   ├── utils/                    # 工具函数
│   ├── migrations/               # 数据库迁移系统
│   │   ├── index.js              # 迁移运行器
│   │   ├── V0.0.1_init_users.js  # 用户表
│   │   ├── V0.0.2_seed_base_users.js
│   │   ├── V1.0.0_init_core_tables.js  # 12 张核心表
│   │   └── seed/seed_core_data.js     # 种子数据
│   └── scripts/initDatabase.js   # 数据库初始化
├── frontend-web-admin/           # Web 管理前端
│   └── src/
│       ├── api/                  # API 调用层
│       ├── components/common/     # 公共组件（DataTable 等）
│       ├── composables/          # 组合式函数
│       ├── views/
│       │   ├── teaching/         # 教学质量评估页面（9 个）
│       │   └── portfolio/        # 成长档案页面（6 个）
│       ├── router/               # 路由配置
│       └── stores/               # Pinia 状态管理
├── docs/                         # 项目文档
└── datasets/                     # 数据集
```

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 9+

### 安装步骤

1. **安装依赖**

```bash
# 根目录一键安装
npm run install:all

# 或分别安装
cd backend-api && npm install
cd ../frontend-web-admin && npm install
```

2. **配置数据库**

```sql
CREATE DATABASE smart_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **配置环境变量**

```bash
cd backend-api
cp .env.example .env
# 编辑 .env 填入数据库密码和 API Key
```

4. **初始化数据库**

```bash
cd backend-api
npm run init:db          # 创建所有表 + 管理员账号
node src/migrations/index.js     # 执行迁移（核心表）
node src/migrations/seed/seed_core_data.js  # 插入种子数据
```

5. **启动服务**

```bash
# 根目录一键启动前后端
npm start

# 或分别启动
cd backend-api && npm run dev       # → http://localhost:3000
cd ../frontend-web-admin && npm run dev  # → http://localhost:5173
```

6. **访问系统**

打开浏览器访问 http://localhost:5173

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

## 核心功能模块

### P0 - MVP 核心（已开发）

#### 教学质量评估中心

| 功能 | 说明 |
|------|------|
| 考试管理 | 创建/编辑/删除考试，配置考试科目、满分、及格分 |
| 成绩管理 | 批量导入成绩，自动计算分数等级、班级排名、年级排名 |
| 班级学情分析 | 各科统计、分数段分布、及格率/优秀率、薄弱科目识别 |
| 年级学情分析 | 各班平均分对比、学科雷达图、优秀/薄弱班级 |
| 学生学情分析 | 成绩趋势、各科雷达图、优势/薄弱学科、排名变化 |
| 班级管理 | 班级 CRUD、班主任分配、学科教师配置 |
| 学科管理 | 学科 CRUD、满分配置 |

#### 学生成长档案

| 功能 | 说明 |
|------|------|
| 档案总览 | 基本信息、技能/荣誉统计、成绩趋势、心理状态、最新评语 |
| 技能记录 | 分类管理（学术/体育/艺术/技术）、1-5 星等级、教师认证 |
| 荣誉记录 | 级别管理（校级→国际级）、类型分类、证明材料 |
| 心理健康 | 测评记录、情绪指数趋势、各维度雷达图、压力水平追踪 |
| 学生评语 | 学期评语、AI 智能生成（V1.0）、多种风格、来源标记 |
| 班级档案 | 班级学生档案列表，教师查看全班学生成长概况 |

### P1 - V1.0 规划中

- AI 学情诊断报告（班级 + 个人）
- AI 智能评语生成
- 课程课表管理
- 校园通知系统
- 校园服务（食堂、图书馆）

### P2 - V2.0 规划中

- OCR 成绩录入
- 心理健康测评系统
- 活动管理
- 选课系统

## 后端架构

采用三层架构（Model → Service → Route）：

```
Route (routes/)        → 接收请求，参数校验，权限检查
  ↓
Service (services/)    → 业务逻辑编排，数据聚合
  ↓
Model (models/)        → 数据库 CRUD，SQL 查询
```

- **统一响应格式**：`{ code, data, message }`
- **统一错误处理**：`middleware/errorHandler.js`
- **数据库迁移**：`migrations/` 目录管理表结构变更
- **权限控制**：JWT + 三角色分级（admin/teacher/student）

## API 文档

完整的 API 接口文档见 [docs/API接口文档.md](docs/API接口文档.md)。

## 文档索引

| 文档 | 说明 |
|------|------|
| [项目规划方案](docs/项目规划方案.md) | 项目定位、需求分析、架构重构、开发路线图 |
| [API 接口文档](docs/API接口文档.md) | 全部接口的请求/响应格式说明 |
| [项目技术文档](docs/项目技术文档.md) | 技术架构、数据库设计、开发规范 |
| [三端交互流程](docs/三端交互流程.md) | 管理员/教师/学生角色交互流程 |

## 环境变量配置

编辑 `backend-api/.env`：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=smart_campus

# 服务器
PORT=3000
JWT_SECRET=你的JWT密钥

# AI（可选）
DEEPSEEK_API_KEY=你的API Key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# OCR（可选）
UMI_OCR_URL=http://127.0.0.1:1224/api/ocr
```

## 常见问题

**数据库连接失败？** 检查 MySQL 服务是否启动，`.env` 配置是否正确。

**登录返回 401？** 确认已执行 `npm run init:db` 创建管理员账号，密码已 bcrypt 加密。

**AI 功能不可用？** 检查 `.env` 中 DeepSeek API Key 是否配置，API 是否有余额。

**端口被占用？**
```bash
netstat -ano | findstr :3000    # 查找占用进程
taskkill /PID <进程号> /F        # 结束进程
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。提交规范：`<type>(<scope>): <subject>`（feat/fix/docs/refactor/chore）。
