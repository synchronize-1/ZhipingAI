```markdown
# 智评AI平台 - 需求文档（完整版）

## 1. 数据模型与依赖指数计算

### 1.1 数据来源
- **学生AI使用记录**：`ai_assistant_usage_student_life.csv`（10000+ 条记录）
- **学生调查问卷**：`数据集2（AI校园研究调查回答）.xlsx`（241 条记录）
- **数据库表**：`users`、`grades`、`attendances` 等

### 1.2 依赖指数计算公式

**依赖原始分**：
```
依赖原始分 = 了解程度 × (-3) + 使用频率 × 1 + 学习使用 × 1 + 职业兴趣 × 1 + ChatGPT数值 × 5
```

**依赖程度(0-100)**：
```
依赖程度 = (依赖原始分 - min) / (max - min) × 100
```

**等级划分**：
| 分数范围 | 等级 |
|---------|------|
| ≥ 80 | 重度依赖 |
| 50-79 | 中度依赖 |
| < 50 | 轻度依赖 |

### 1.3 影响程度计算公式
```
影响程度(0-100) = (使用频率 × 0.4 + 学习使用 × 0.4 + 职业兴趣 × 0.2) / 5 × 100
```

### 1.4 成绩预测模型
使用 XGBoost 回归模型，特征包括：
- `SessionLengthMin`（会话时长）
- `TotalPrompts`（提示词数量）
- `TaskType`（任务类型）
- `AI_AssistanceLevel`（AI 辅助等级 1-5）
- `FinalOutcome`（任务结果）
- `SatisfactionRating`（满意度）

---

## 2. 后端 API 接口

### 2.1 AI健康评估模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai-health/overview` | GET | 获取概览数据（班级人数、使用时长、预警人数） |
| `/api/ai-health/students` | GET | 学生列表（支持 keyword 搜索） |
| `/api/ai-health/students/:id` | GET | 获取单个学生详细数据 |
| `/api/ai-health/warnings` | GET | 获取当前预警列表 |
| `/api/ai-health/recommendations` | GET | 获取替代性学习方案 |
| `/api/ai-health/interventions/feedback` | GET | 获取干预闭环反馈数据 |
| `/api/ai-health/analytics` | GET | 获取综合指标分析 |

### 2.2 当前实现说明

所有接口已实现，当前返回基于数据库真实数据的模拟结果。

### 2.3 数据接入待办

| 待接入项 | 接入方案 |
|---------|---------|
| 真实 AI 使用时长 | 创建 `ai_usage_logs` 表，记录每次 AI 会话 |
| 真实成绩趋势 | 从 `grades` 表查询学生成绩历史 |
| 真实作业相似度 | 对接作业系统，计算与同学作业/标准答案的相似度 |
| 预警触发逻辑 | 基于依赖指数和成绩变化实时计算 |
| 综合指标 | 从 `ai_usage_logs` + `grades` 聚合计算 |
| CSV 数据导入 | 编写脚本导入历史数据 |

---

## 3. 前端页面

### 3.1 路由配置
- 路径：`/admin-health`
- 组件：`AIHealthAssessment.vue`
- 权限：仅 `admin` 角色可见

### 3.2 页面模块

| 模块 | 组件/图表 | 数据来源 |
|------|----------|---------|
| 概览 | 卡片展示 | `/overview` |
| AI使用时长柱状图 | ECharts | `/overview` |
| 成绩折线图 | ECharts | `/overview` |
| 学习时长折线图 | ECharts | `/overview` |
| 依赖程度饼图 | ECharts | `/overview` |
| 学生搜索 | `el-input` + 列表 | `/students` |
| 学生详情 | 卡片 + 图表 | `/students/:id` |
| 预警干预 | 列表展示 | `/warnings` |
| 替代学习方案 | 列表展示 | `/recommendations` |
| 干预闭环反馈 | 漏斗图 + 柱状图 | `/interventions/feedback` |
| 综合指标分析 | KPI卡片 + 散点图 | `/analytics` |

---

## 4. 数据库表结构

### 4.1 用户表 `users`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR | 姓名 |
| role | ENUM | student/teacher/admin |
| student_id | VARCHAR | 学号 |
| department | VARCHAR | 院系 |

### 4.2 成绩表 `grades`
| 字段 | 类型 | 说明 |
|------|------|------|
| student_id | INT | 学生ID |
| course_id | INT | 课程ID |
| score | DECIMAL | 分数 |
| semester | VARCHAR | 学期 |

### 4.3 考勤表 `attendances`
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | INT | 用户ID |
| course_id | INT | 课程ID |
| status | ENUM | present/late/absent |

### 4.4 AI使用记录表 `ai_usage_logs`（待创建）
```sql
CREATE TABLE ai_usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_length_min DECIMAL(5,2),
  total_prompts INT,
  task_type VARCHAR(50),
  ai_assistance_level INT,
  satisfaction_rating INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 5. 作业相似度

| 相似度范围 | 等级 |
|-----------|------|
| ≥ 80% | 高 |
| 60% - 80% | 中 |
| < 60% | 低 |

> **当前状态**：返回固定的 `homeworkSimilarity: 68`（中等）
>
> **接入方案**：从作业系统获取提交内容，使用余弦相似度计算

---

## 6. 预警触发规则

| 等级 | 触发条件 |
|------|----------|
| 轻度 | AI使用时长 > 班级平均 20% + 成绩未下降 |
| 中度 | AI使用时长 > 班级平均 50% + 作业相似度 > 80% |
| 重度 | AI使用时长 > 班级平均 100% + 成绩连续下滑（连续2周下降） |

> **当前状态**：返回固定示例数据
>
> **实现方案**：创建 `getStudentWarnings(studentId)` 函数，实时计算返回

---

## 7. 后端文件结构

```
backend-api/src/
├── app.js                    # 应用入口
├── config/
│   └── database.js           # MySQL 连接池
├── middleware/
│   └── auth.js               # JWT 验证
├── models/                   # 数据模型
├── routes/                   # 路由
│   ├── aiHealth.js           # AI健康评估接口
│   ├── auth.js               # 登录/注册
│   ├── users.js              # 用户管理
│   └── ...
└── scripts/
    ├── initDatabase.js       # 数据库初始化
    └── seed-users.js         # 测试账号导入
```

---

## 8. 前端文件结构

```
frontend-web-admin/src/
├── api/
│   └── index.js              # API 定义
├── views/
│   ├── AIHealthAssessment.vue # 智评AI主页面
│   └── ...
├── layouts/
│   └── MainLayout.vue        # 主布局
├── router/
│   └── index.js              # 路由配置
└── stores/
    └── user.js               # 用户状态
```

---

## 9. 接入步骤

### 9.1 创建 AI 使用记录表
执行上述 `ai_usage_logs` 建表语句

### 9.2 导入 CSV 数据
创建 `scripts/import-csv.js`，将 CSV 数据写入 `ai_usage_logs`

### 9.3 更新 `aiHealth.js`
- 从 `ai_usage_logs` 聚合真实数据
- 查询真实成绩
- 实现实时预警计算
- 从真实数据计算相关系数

---

## 10. 当前问题与待办

| 问题 | 优先级 | 解决方案 |
|------|--------|----------|
| 概览数据为估算值 | 高 | 创建 `ai_usage_logs` 表并导入 CSV |
| 成绩趋势为 mock | 高 | 从 `grades` 表查询真实成绩 |
| 预警为固定示例 | 中 | 实现实时预警计算逻辑 |
| 作业相似度为固定值 | 中 | 对接作业系统或添加模拟计算 |
| 依赖指数未持久化 | 中 | 定时任务更新 `users.dependence_score` |
| 综合指标为固定值 | 低 | 从真实数据聚合计算 |

---

## 11. 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
```