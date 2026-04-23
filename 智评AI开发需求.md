# 智评AI平台 - 需求文档（更新版）

```markdown
# 智评AI平台 - 需求文档（完整版）

## 1. 数据模型与依赖指数计算

### 1.1 数据来源
- **学生AI使用记录**：`datasets/ai_assistant_usage_student_life.csv`（10000+ 条记录）
  - 包含字段：SessionLengthMin, TotalPrompts, TaskType, AI_AssistanceLevel, FinalOutcome, UsedAgain, SatisfactionRating, 使用AI前的成绩, 使用AI后的成绩, Discipline
- **学生调查问卷**：`datasets/数据集2（AI校园研究调查回答）.xlsx`（241 条记录）
  - 包含字段：了解程度, 使用频率, 学习使用, 职业兴趣, 了解ChatGPT, 专业
- **数据库表**：`users`, `grades`, `attendances`, `ai_usage_logs`（待创建）

### 1.2 依赖指数计算公式

**依赖原始分**：
```
依赖原始分 = 了解程度 × (-3) + 使用频率 × 1 + 学习使用 × 1 + 职业兴趣 × 1 + ChatGPT数值 × 5
```

**依赖程度(0-100)**：
```
依赖程度 = (依赖原始分 - dataset_min) / (dataset_max - dataset_min) × 100
```
> min/max 从数据集2（调查问卷）中计算，结果为：min = -11, max = 32

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

### 2.2 数据文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| CSV 数据 | `D:\webstorm_project\SmartCampus-main\datasets\ai_assistant_usage_student_life.csv` | AI使用记录 |
| Excel 问卷 | `D:\webstorm_project\SmartCampus-main\datasets\数据集2（AI校园研究调查回答）.xlsx` | 依赖指数计算 |

### 2.3 数据接入状态

| 待接入项 | 优先级 | 接入方案 |
|---------|--------|---------|
| 创建 `ai_usage_logs` 表 | P0 | 执行建表语句 |
| 导入 CSV 数据 | P0 | 编写 `scripts/import-csv.js` |
| 导入 Excel 问卷数据 | P0 | 编写 `scripts/import-excel.js` |
| 建立用户映射（学科 → user_id） | P0 | CSV 中无学生 ID，需要创建学生记录或随机映射 |
| 实现依赖指数计算 | P0 | 基于导入的问卷数据 |
| 实现成绩趋势 | P0 | CSV 中有 100+ 条成绩记录，足够生成趋势 |
| 实现预警触发逻辑 | P0 | 基于 AI 使用时长和成绩变化 |
| 实现综合指标 | P1 | 从 CSV 聚合计算 |

---

## 3. 数据库表结构

### 3.1 AI使用记录表 `ai_usage_logs`（待创建）

```sql
CREATE TABLE ai_usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id VARCHAR(100),
  student_level VARCHAR(50),
  discipline VARCHAR(100),
  session_date DATE,
  session_length_min DECIMAL(5,2),
  total_prompts INT,
  task_type VARCHAR(50),
  ai_assistance_level INT,
  final_outcome VARCHAR(50),
  used_again BOOLEAN,
  satisfaction_rating INT,
  score_before INT,
  score_after INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.2 调查问卷表 `ai_survey_responses`（待创建）

```sql
CREATE TABLE ai_survey_responses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  answer_time DATETIME,
  knowledge_level INT,        -- 了解程度 (1-5)
  usage_frequency INT,        -- 使用频率 (1-5)
  study_usage INT,            -- 学习使用 (1-5)
  career_interest INT,        -- 职业兴趣 (1-5)
  knows_chatgpt BOOLEAN,      -- 了解ChatGPT
  major VARCHAR(100),         -- 专业
  dependence_score DECIMAL(5,2),
  dependence_level VARCHAR(10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. 用户映射说明

CSV 中没有直接的学生 ID，只有 `Discipline` 字段。需要建立学科到用户的映射。

**方案**：
1. 查询系统中现有的学生用户（`role = 'student'`）
2. 如果没有学生，则先创建一批测试学生（按学科分类）
3. 将 CSV 记录按 `Discipline` 随机分配到对应学科的学生

**学科映射**：
| CSV Discipline | 建议创建的用户名 |
|---------------|-----------------|
| Computer Science | cs_student_1, cs_student_2, ... |
| Psychology | psy_student_1, psy_student_2, ... |
| Business | biz_student_1, biz_student_2, ... |
| Biology | bio_student_1, bio_student_2, ... |
| Engineering | eng_student_1, eng_student_2, ... |
| History | his_student_1, his_student_2, ... |
| Math | math_student_1, math_student_2, ... |

---

## 5. 成绩数据说明

CSV 中有 `使用AI前的成绩` 和 `使用AI后的成绩` 字段（约100条有效记录），足够用于：
- 成绩趋势展示（按周/月聚合）
- 成绩与 AI 使用时长的相关性分析
- 过度依赖学生中成绩下滑比例计算

---

## 6. 作业相似度

| 相似度范围 | 等级 |
|-----------|------|
| ≥ 80% | 高 |
| 60% - 80% | 中 |
| < 60% | 低 |

> **当前状态**：返回模拟值 68（中等）
>
> **接入方案**：暂不接入，保持模拟值

---

## 7. 预警触发规则

| 等级 | 触发条件 |
|------|----------|
| 轻度 | AI使用时长 > 班级平均 20% + 成绩未下降 |
| 中度 | AI使用时长 > 班级平均 50% + 作业相似度 > 80% |
| 重度 | AI使用时长 > 班级平均 100% + 成绩连续下滑（连续2周下降） |

> **实现方式**：`/warnings` 接口实时计算，基于 `ai_usage_logs` 统计和成绩变化

---

## 8. 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

---

## 9. 前端组件状态

| 组件 | 状态 | 待完成 |
|------|------|--------|
| AIHealthDashboard.vue | ✅ 已完成 | - |
| AIHealthOverview.vue | ⚠️ 框架完成 | 图表集成 |
| AIHealthStudentQuery.vue | ⚠️ 框架完成 | 图表集成 |
| AIHealthWarnings.vue | ⚠️ 框架完成 | 方案推荐区块 |
| AIHealthAnalytics.vue | ⚠️ 框架完成 | 图表集成 |
```