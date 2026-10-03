# 智评校园 SmartCampus

> 面向中小学的教学质量评估与学生成长档案管理平台

## 项目简介

智评校园以教学质量评估和学生成长档案为核心，采用前后端分离架构。系统通过数据驱动的学情分析帮助教师和管理者掌握教学效果，同时为每位学生建立贯穿在校期间的综合成长档案。AI 能力（DeepSeek）嵌入具体教学场景，用于学情诊断与评语生成，不做独立的聊天应用。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts + Pinia + Vue Router | Vue 3.4 / Vite 5.0 |
| 后端 | Node.js + Express + MySQL | Express 4.18 / mysql2 3.6 |
| 认证 | JWT + bcryptjs | jsonwebtoken 9.0 |
| 实时通信 | Socket.IO | 4.7 |
| 文件处理 | Multer（上传）、xlsx / csv-parser（成绩导入导出） | - |
| 定时任务 | node-cron | 3.0 |
| AI 服务 | DeepSeek API（可选，未配置时相关接口不可用） | - |
| OCR | Umi-OCR 本地服务（可选） | - |

## 项目结构

```
SmartCampus-main/
├── backend-api/                     # 后端 API 服务
│   ├── src/
│   │   ├── app.js                   # 应用入口，挂载全部路由
│   │   ├── config/                  # 数据库连接与统一配置
│   │   ├── middleware/              # 认证、参数校验、错误处理、限流、审计
│   │   ├── models/                  # 数据模型层（*.model.js）
│   │   ├── services/                # 业务服务层（*.service.js）
│   │   ├── routes/                  # 路由层（*.routes.js）
│   │   ├── websockets/              # Socket.IO 事件处理
│   │   ├── migrations/              # SQL 迁移与种子数据
│   │   │   ├── index.js             # 迁移运行器
│   │   │   ├── runSql.js            # SQL 文件执行器
│   │   │   ├── V*.up.sql / V*.down.sql
│   │   │   └── seed/*.sql           # 种子数据
│   │   ├── scripts/                 # initDatabase.js 等运维脚本
│   │   ├── utils/                   # 统一响应、错误类型、异步包装
│   │   └── docs/                    # OpenAPI 规范（GET /api/docs）
│   └── .env.example
├── frontend-web-admin/              # Web 管理前端
│   └── src/
│       ├── api/                     # API 调用层
│       ├── components/              # 公共组件与业务组件
│       ├── composables/             # 组合式函数（useTable / useDialog / useECharts 等）
│       ├── layouts/                 # 布局
│       ├── router/                  # 路由与权限守卫
│       ├── stores/                  # Pinia 状态
│       └── views/                   # 页面（home/ auth/ system/ course/ student/ teaching/ portfolio/ activity/ elective/）
├── mobile-app/                      # 移动端（uni-app），当前不在维护范围内
├── docs/                            # 项目文档
└── datasets/                        # 数据集
```

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 9+

### 安装步骤

1. 安装依赖

```bash
# 根目录一键安装全部子项目依赖
npm run install:all

# 或只装后端与 Web 前端
cd backend-api && npm install
cd ../frontend-web-admin && npm install
```

2. 创建数据库

```sql
CREATE DATABASE smart_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 配置环境变量

```bash
cd backend-api
cp .env.example .env
# 编辑 .env 填入数据库密码、JWT 密钥；AI 相关为可选项
```

4. 初始化数据库（按顺序执行）

```bash
cd backend-api
npm run init:db        # 建表（含基础表结构与管理员账号）
npm run migrate        # 执行版本化迁移，补齐核心表与字段
npm run seed:core      # 基础数据：学科、班级、考试
npm run seed:users     # 测试账号：教师与学生
```

可选种子（课表、成绩、活动、选课演示数据）：

```bash
npm run seed:scores
npm run seed:timetable
npm run seed:activities
npm run seed:electives
# 或一次执行全部种子
npm run seed
```

5. 启动服务

```bash
# 根目录并行启动前后端
npm run dev

# 或分别启动
cd backend-api && npm run dev            # → http://localhost:3000
cd ../frontend-web-admin && npm run dev  # → http://localhost:5173
```

6. 访问系统

浏览器打开 http://localhost:5173

### 可用脚本

根目录：

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 安装根目录与全部子项目依赖 |
| `npm run dev` | 并行启动后端与 Web 前端 |
| `npm run start:backend` / `start:web` | 单独启动后端 / 前端 |
| `npm run init:db` | 初始化数据库 |

后端（`backend-api/`）：

| 命令 | 说明 |
|------|------|
| `npm run dev` / `npm start` | 开发模式（nodemon）/ 生产模式 |
| `npm run init:db` | 建表并写入管理员账号 |
| `npm run migrate` | 执行未执行的迁移 |
| `npm run migrate:status` | 查看迁移状态 |
| `npm run migrate:down` | 回滚最近一次迁移 |
| `npm run seed:core` / `seed:users` / `seed:scores` / `seed:timetable` / `seed:activities` / `seed:electives` | 按模块插入种子数据 |
| `npm run seed` | 依次执行全部种子 |
| `npm run sql` | 执行任意 SQL 文件（需传入文件路径） |

前端（`frontend-web-admin/`）：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |

### 测试账号

执行 `npm run init:db` 创建管理员，执行 `npm run seed:users` 创建教师与学生账号。

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | admin | admin123 | 系统管理员 |
| 教师 | teacher1 ~ teacher8 | 123456 | 工号 T2024001 ~ T2024008 |
| 学生 | student1 / student2 | 123456 | 高一(1)班，学号 20240101 / 20240102 |
| 学生 | 20240103 ~ 20240510 | 123456 | 用户名即学号，5 个班级各 10 人 |

学生账号也可直接用学号登录（如 `20240103`）。

## 核心功能模块

教学质量评估：考试管理（含考试科目配置）、成绩管理（导入、预览、导出、模板下载、手动录入）、班级学情分析、年级学情分析、学生学情分析、AI 学情诊断报告、班级管理、学科管理。

学生成长档案：档案总览、技能记录与认证、荣誉记录与认证、心理健康记录与趋势、学生评语（支持 AI 生成）、班级档案。

课程与课表：课程管理、周课表查看与排课、排课冲突检测、按班级清空课表。

活动管理：活动发布与编辑、报名与取消、签到、报名统计。

选课系统：选修课管理、学生选课与退选、名额限制与选课时间窗口、按班级查看选课名单。

校园通知：通知发布（管理员）、已读标记、未读统计、Socket.IO 实时推送。

数据看板：按角色返回不同结构的首页数据（管理员 / 教师 / 学生）。

AI 健康分析（管理员）：AI 依赖度概览、学生依赖度列表与详情、预警列表、干预建议与反馈、相关性分析。

用户与权限：用户管理、批量导入、批量重置密码、批量调整班级、状态切换、操作日志审计。

系统能力：JWT 认证与三角色权限、Socket.IO 实时通信、请求限流、操作审计。

## 后端架构

采用三层架构：

```
Route (routes/)        → 接收请求、参数校验、权限检查
  ↓
Service (services/)    → 业务逻辑编排、多表数据聚合
  ↓
Model (models/)        → 数据库 CRUD、SQL 查询
```

- 统一响应格式：`{ code, data, message }`，成功码为 `0`
- 统一错误处理：`middleware/errorHandler.js`
- 参数校验：`middleware/validate.js`
- 数据库迁移：`migrations/` 下的版本化 SQL（`V*.up.sql` / `V*.down.sql`），由 `index.js` 驱动、`runSql.js` 执行
- 权限控制：JWT + 三角色分级（admin / teacher / student）

> 说明：部分早期模块（`/api/auth`、`/api/users`、`/api/courses`、`/api/social`、`/api/services`、`/api/ai-science`、`/api/ai-health`）仍使用 `{ success, data, message }` 信封，并存在路由层内联业务逻辑的情况。前端请求层已兼容两种信封。相关收敛工作记录在 [项目优化计划](docs/项目优化计划.md)。

## API 文档

完整接口说明见 [docs/API接口文档.md](docs/API接口文档.md)，服务运行时也可通过 `GET /api/docs` 获取 OpenAPI 规范。

## 文档索引

| 文档 | 说明 |
|------|------|
| [API 接口文档](docs/API接口文档.md) | 全部接口的请求 / 响应格式说明 |
| [项目技术文档](docs/项目技术文档.md) | 技术架构、数据库设计、开发规范 |
| [三端交互流程](docs/三端交互流程.md) | 管理员 / 教师 / 学生角色交互流程与权限矩阵 |
| [项目优化计划](docs/项目优化计划.md) | 各阶段优化目标、边界与执行决议 |

## 环境变量配置

编辑 `backend-api/.env`（模板见 `backend-api/.env.example`）：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_campus

# 服务器
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRES_IN=7d

# DeepSeek AI（可选）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# Umi-OCR 本地服务（可选）
UMI_OCR_URL=http://127.0.0.1:1224/api/ocr

# AI 使用限制
AI_CHAT_DAILY_LIMIT=100
AI_OCR_DAILY_LIMIT=50
```

## 常见问题

数据库连接失败：确认 MySQL 服务已启动，`.env` 中的连接信息正确。

登录返回 401：确认已执行 `npm run init:db` 创建管理员账号，密码以 bcrypt 加密存储。

AI 功能不可用：确认 `.env` 中已配置 `DEEPSEEK_API_KEY`，且该 Key 有可用额度。

迁移失败：先用 `npm run migrate:status` 查看已执行版本，确认目标库中不存在同名冲突表。

端口被占用：

```bash
netstat -ano | findstr :3000    # 查找占用进程
taskkill /PID <进程号> /F        # 结束进程
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。提交信息规范：`<type>(<scope>): <subject>`（feat / fix / docs / refactor / chore）。