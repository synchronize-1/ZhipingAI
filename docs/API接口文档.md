# 智评校园 API 接口文档

> 版本：v1.1.0  
> 更新时间：2026-09-30

---

## 目录

- [通用说明](#通用说明)
- [认证模块](#认证模块)
- [用户管理模块](#用户管理模块)
- [管理用户模块](#管理用户模块)
- [教学质量评估模块](#教学质量评估模块)
- [学生成长档案模块](#学生成长档案模块)
- [课程模块](#课程模块)
- [课表模块](#课表模块)
- [活动模块](#活动模块)
- [选课模块](#选课模块)
- [社交模块](#社交模块)
- [校园服务模块](#校园服务模块)
- [通知模块](#通知模块)
- [首页看板模块](#首页看板模块)
- [AI 健康分析模块](#ai-健康分析模块)
- [AI 对话模块](#ai-对话模块)
- [操作日志模块](#操作日志模块)
- [错误码说明](#错误码说明)

---

## 通用说明

### 基础信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `/api` |
| 请求方式 | RESTful API |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 认证方式

使用 JWT (JSON Web Token) 进行身份认证。

**请求头：**
```
Authorization: Bearer <token>
```

**获取 Token：** 通过登录接口 `/api/auth/login` 获取。

### 统一响应格式

新架构模块（`teaching` / `portfolio` / `admin/users` / `home` / `timetable` / `activities` / `electives` / `notifications` / `operation-logs`）统一由 `utils/response.js` 输出：

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Number | 状态码，0 表示成功，非 0 表示失败 |
| data | Any | 响应数据 |
| message | String | 响应消息 |

早期模块（`auth` / `users` / `courses` / `services` / `social` / `ai-science` / `ai-health`）沿用 `{ success, data, message }` 结构，`success: true` 表示成功。本文档在各接口处标注其实际返回结构。

### 分页响应格式

```json
{
  "code": 0,
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  },
  "message": "success"
}
```

### 分页请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | Number | 否 | 1 | 页码 |
| pageSize | Number | 否 | 10 | 每页条数 |

### 系统接口

| 接口地址 | 说明 |
|----------|------|
| `GET /api/health` | 健康检查，返回 `{ status, timestamp }`，不受限流影响 |
| `GET /api/docs` | Swagger UI 可视化文档页 |
| `GET /api/docs/openapi.json` | 原始 OpenAPI 3.0 规范 |

---

## 认证模块

### 登录

**接口地址：** `POST /api/auth/login`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |

**响应数据：**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin",
      "avatar": "/uploads/avatars/admin.jpg",
      "department": "信息中心"
    }
  }
}
```

### 注册

**接口地址：** `POST /api/auth/register`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |
| name | String | 是 | 姓名 |
| role | String | 是 | 角色：admin/teacher/student |
| email | String | 否 | 邮箱 |
| phone | String | 否 | 手机号 |
| department | String | 否 | 部门/学院 |
| studentId | String | 否 | 学号（学生角色） |
| employeeId | String | 否 | 工号（教师角色） |

### 获取当前用户信息

**接口地址：** `GET /api/auth/me`

**请求头：** 需要认证

### 修改密码

**接口地址：** `PUT /api/auth/password`

**请求头：** 需要认证

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | String | 是 | 原密码 |
| newPassword | String | 是 | 新密码 |

### 刷新 Token

**接口地址：** `POST /api/auth/refresh`

**请求头：** 需要认证

**响应：** `{ "success": true, "data": { "token": "..." }, "message": "..." }`

---

## 教学质量评估模块

### 一、考试管理

#### 1.1 获取考试列表

**接口地址：** `GET /api/teaching/exams`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页条数，默认10 |
| examType | String | 否 | 考试类型：月考/期中/期末/模拟考等 |
| grade | String | 否 | 年级 |
| status | Number | 否 | 状态：0草稿 1进行中 2已完成 |
| keyword | String | 否 | 关键词搜索（考试名称） |

**响应数据：**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "2024年春季期中考试",
        "exam_type": "期中",
        "grade": "高一",
        "exam_date": "2024-04-15",
        "semester": "2023-2024第二学期",
        "status": 2,
        "created_by": 1,
        "created_at": "2024-04-01T00:00:00.000Z",
        "updated_at": "2024-04-16T00:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10
  },
  "message": "success"
}
```

#### 1.2 获取考试详情

**接口地址：** `GET /api/teaching/exams/:id`

**请求头：** 需要认证（admin, teacher）

**响应数据：** 包含考试基本信息 + 关联科目列表

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "2024年春季期中考试",
    "exam_type": "期中",
    "grade": "高一",
    "exam_date": "2024-04-15",
    "semester": "2023-2024第二学期",
    "status": 2,
    "subjects": [
      {
        "id": 1,
        "subject_id": 1,
        "subject_name": "语文",
        "full_score": 150,
        "pass_score": 90,
        "exam_duration": 120
      }
    ]
  },
  "message": "success"
}
```

#### 1.3 创建考试

**接口地址：** `POST /api/teaching/exams`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 考试名称 |
| examType | String | 是 | 考试类型 |
| grade | String | 是 | 年级 |
| examDate | String | 是 | 考试日期 (YYYY-MM-DD) |
| semester | String | 否 | 学期 |
| status | Number | 否 | 状态，默认1 |

#### 1.4 更新考试

**接口地址：** `PUT /api/teaching/exams/:id`

**请求头：** 需要认证（admin, teacher）

**请求参数：** 同创建考试

#### 1.5 删除考试

**接口地址：** `DELETE /api/teaching/exams/:id`

**请求头：** 需要认证（admin）

> 注意：删除考试会同时删除相关成绩数据

#### 1.6 添加考试科目

**接口地址：** `POST /api/teaching/exams/:id/subjects`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | Number | 是 | 学科ID |
| fullScore | Number | 否 | 满分，默认100 |
| passScore | Number | 否 | 及格分，默认60 |
| examDuration | Number | 否 | 考试时长（分钟） |

#### 1.7 移除考试科目

**接口地址：** `DELETE /api/teaching/exams/:id/subjects/:subjectId`

**请求头：** 需要认证（admin, teacher）

---

### 二、成绩管理

#### 2.1 获取成绩列表

**接口地址：** `GET /api/teaching/scores`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| examId | Number | 是 | 考试ID |
| classId | Number | 否 | 班级ID |
| subjectId | Number | 否 | 科目ID |
| studentId | Number | 否 | 学生ID（学生角色只能查自己） |
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

#### 2.2 批量导入成绩

**接口地址：** `POST /api/teaching/scores/import`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| examId | Number | 是 | 考试ID |
| scores | Array | 是 | 成绩数据数组 |

**scores 数组元素：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| subjectId | Number | 是 | 科目ID |
| classId | Number | 是 | 班级ID |
| score | Number | 是 | 分数 |
| isAbsent | Boolean | 否 | 是否缺考 |
| remark | String | 否 | 备注 |

> 系统会自动计算分数等级、班级排名、年级排名

#### 2.3 更新成绩

**接口地址：** `PUT /api/teaching/scores/:id`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| score | Number | 否 | 分数 |
| isAbsent | Boolean | 否 | 是否缺考 |
| remark | String | 否 | 备注 |

> 更新后会自动重新计算排名

#### 2.4 删除成绩

**接口地址：** `DELETE /api/teaching/scores/:id`

**请求头：** 需要认证（admin, teacher）

#### 2.5 学生历史成绩

**接口地址：** `GET /api/teaching/scores/student/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

#### 2.6 成绩导入预览

**接口地址：** `POST /api/teaching/scores/preview`

**请求头：** 需要认证（admin, teacher）

**Content-Type:** `multipart/form-data`

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | Excel 文件 |
| examId | Number | 是 | 考试ID |
| classId | Number | 是 | 班级ID |

> 解析并校验 Excel 数据，返回预览结果，不落库。

#### 2.7 成绩导出

**接口地址：** `GET /api/teaching/scores/export`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| examId | Number | 是 | 考试ID |
| classId | Number | 是 | 班级ID |
| subjectId | Number | 否 | 科目ID |

> 返回 `.xlsx` 文件流。

#### 2.8 下载成绩导入模板

**接口地址：** `GET /api/teaching/scores/template`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| examId | Number | 是 | 考试ID |
| classId | Number | 是 | 班级ID |

> 返回 `.xlsx` 文件流。

---

### 三、教学质量分析

#### 3.1 班级学情分析

**接口地址：** `GET /api/teaching/analysis/class/:examId/:classId`

**请求头：** 需要认证（admin, teacher）

**响应数据：**

```json
{
  "code": 0,
  "data": {
    "classInfo": {
      "id": 1,
      "name": "高一(1)班",
      "grade": "高一",
      "student_count": 45
    },
    "overview": {
      "totalStudents": 45,
      "avgScore": 78.5,
      "maxScore": 98,
      "minScore": 45,
      "passRate": 72.5,
      "excellentRate": 18.2
    },
    "subjectStats": [
      {
        "subjectId": 1,
        "subjectName": "语文",
        "avgScore": 82,
        "maxScore": 95,
        "minScore": 60,
        "passRate": 85,
        "excellentRate": 22,
        "classRank": 3,
        "gradeRank": 5
      }
    ],
    "scoreDistribution": [
      { range: "90-100", count: 8, percentage: 17.8 },
      { range: "80-89", count: 12, percentage: 26.7 }
    ],
    "topStudents": [
      { "studentId": 1, "name": "张三", "totalScore": 680, "classRank": 1 }
    ],
    "weakSubjects": [
      { "subjectId": 3, "subjectName": "英语", "avgScore": 65, "passRate": 55 }
    ]
  },
  "message": "success"
}
```

#### 3.2 年级学情分析

**接口地址：** `GET /api/teaching/analysis/grade/:examId`

**请求头：** 需要认证（admin）

**响应数据：**

```json
{
  "code": 0,
  "data": {
    "overview": {
      "totalStudents": 500,
      "totalClasses": 10,
      "avgScore": 75.2,
      "maxScore": 99,
      "minScore": 30,
      "passRate": 68.5,
      "excellentRate": 15.3
    },
    "classRankings": [
      {
        "classId": 1,
        "className": "高一(1)班",
        "avgScore": 82.5,
        "passRate": 85,
        "excellentRate": 25,
        "rank": 1
      }
    ],
    "subjectStats": [
      {
        "subjectId": 1,
        "subjectName": "语文",
        "avgScore": 78,
        "passRate": 72,
        "excellentRate": 18
      }
    ],
    "gradeDistribution": [
      { range: "优秀(90+)", count: 76, percentage: 15.2 },
      { range: "良好(80-89)", count: 125, percentage: 25.0 }
    ],
    "excellentClasses": [],
    "weakClasses": []
  },
  "message": "success"
}
```

#### 3.3 学生学情分析

**接口地址：** `GET /api/teaching/analysis/student/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| examId | Number | 否 | 指定考试ID，不传则分析历次考试 |

**响应数据：**

```json
{
  "code": 0,
  "data": {
    "studentInfo": {
      "id": 1,
      "name": "张三",
      "student_id": "2024001",
      "className": "高一(1)班",
      "grade": "高一"
    },
    "latestExam": {
      "examId": 1,
      "examName": "期中考试",
      "totalScore": 620,
      "avgScore": 77.5,
      "classRank": 8,
      "gradeRank": 45
    },
    "radarData": [
      { "subject": "语文", "score": 85, "fullScore": 150 }
    ],
    "trendData": [
      { "examName": "第一次月考", "totalScore": 580, "classRank": 12, "gradeRank": 60 }
    ],
    "strongSubjects": [
      { "subjectId": 1, "subjectName": "语文", "classRank": 3 }
    ],
    "weakSubjects": [
      { "subjectId": 3, "subjectName": "英语", "classRank": 25 }
    ],
    "suggestions": [
      "英语成绩有待提高，建议加强阅读理解训练",
      "数学成绩优秀，继续保持"
    ]
  },
  "message": "success"
}
```

#### 3.4 学习进步分析

**接口地址：** `GET /api/teaching/analysis/progress/:examId/:classId`

**请求头：** 需要认证（admin, teacher）

#### 3.5 生成班级学情诊断报告

**接口地址：** `POST /api/teaching/analysis/class/diagnosis`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| examId | Number | 是 | 考试ID |
| classId | Number | 是 | 班级ID |

> 基于 AI 生成班级学情诊断报告并落库。

#### 3.6 生成个人学情画像

**接口地址：** `POST /api/teaching/analysis/student/diagnosis`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| examId | Number | 否 | 考试ID |

#### 3.7 诊断历史记录

**接口地址：** `GET /api/teaching/analysis/diagnosis/history`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reportType | String | 是 | 报告类型 |
| targetId | Number | 是 | 目标ID（班级/学生） |
| limit | Number | 否 | 返回条数 |

#### 3.8 诊断报告详情

**接口地址：** `GET /api/teaching/analysis/diagnosis/:id`

**请求头：** 需要认证（admin, teacher）

---

### 四、班级与学科管理

> 班级与学科为基础数据，由数据库初始化与种子脚本维护；当前 API 仅提供只读查询，不提供增删改。

#### 4.1 获取班级列表

**接口地址：** `GET /api/teaching/classes`

**请求头：** 需要认证（admin）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| grade | String | 否 | 年级 |
| department | String | 否 | 学院/系 |
| keyword | String | 否 | 关键词搜索 |

#### 4.2 获取班级学科教师

**接口地址：** `GET /api/teaching/classes/:id/teachers`

**请求头：** 需要认证（admin, teacher）

#### 4.3 获取学科列表

**接口地址：** `GET /api/teaching/subjects`

**请求头：** 需要认证（admin）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| category | String | 否 | 分类 |
| keyword | String | 否 | 关键词搜索 |

---

## 学生成长档案模块

### 一、成长档案总览

#### 1.1 获取学生成长档案总览

**接口地址：** `GET /api/portfolio/overview/:studentId`

**请求头：** 需要认证

**响应数据：**

```json
{
  "code": 0,
  "data": {
    "basicInfo": {
      "id": 1,
      "name": "张三",
      "username": "zhangsan",
      "avatar": "/uploads/avatars/xxx.jpg",
      "studentId": "2024001",
      "className": "高一(1)班",
      "grade": "高一",
      "headTeacher": "李老师",
      "department": "高一年级组"
    },
    "stats": {
      "skillCount": 8,
      "honorCount": 5,
      "mentalStatus": "良好",
      "latestCommentSemester": "2023-2024第一学期"
    },
    "skillStats": [
      { "category": "学术", "count": 3 },
      { "category": "体育", "count": 2 }
    ],
    "honorStats": [
      { "level": "校级", "count": 2 },
      { "level": "市级", "count": 1 }
    ],
    "scoreTrend": [
      { "examName": "第一次月考", "totalScore": 580, "avgScore": 72.5 },
      { "examName": "期中考试", "totalScore": 620, "avgScore": 77.5 }
    ],
    "latestMentalHealth": {
      "id": 1,
      "assessmentDate": "2024-03-15",
      "moodScore": 82,
      "stressLevel": "中",
      "notes": "情绪状态良好"
    },
    "latestComment": {
      "id": 1,
      "semester": "2023-2024第一学期",
      "content": "该生学习认真，团结同学...",
      "source": "teacher"
    }
  },
  "message": "success"
}
```

#### 1.2 获取班级成长档案列表

**接口地址：** `GET /api/portfolio/class/:classId`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| keyword | String | 否 | 姓名/学号搜索 |

---

### 二、技能管理

#### 2.1 获取学生技能列表

**接口地址：** `GET /api/portfolio/skills/student/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| category | String | 否 | 技能分类 |

#### 2.2 添加技能

**接口地址：** `POST /api/portfolio/skills`

**请求头：** 需要认证

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| skillName | String | 是 | 技能名称 |
| skillCategory | String | 否 | 技能分类 |
| level | Number | 否 | 等级 1-5，默认1 |
| description | String | 否 | 描述 |
| evidenceUrl | String | 否 | 证明材料URL |
| semester | String | 否 | 获得学期 |

> 学生添加的技能需要教师审核（可在后续版本实现）

#### 2.3 更新技能

**接口地址：** `PUT /api/portfolio/skills/:id`

**请求头：** 需要认证

#### 2.4 删除技能

**接口地址：** `DELETE /api/portfolio/skills/:id`

**请求头：** 需要认证

#### 2.5 获取技能统计

**接口地址：** `GET /api/portfolio/skills/stats/:studentId`

**请求头：** 需要认证

---

### 三、荣誉管理

#### 3.1 获取学生荣誉列表

**接口地址：** `GET /api/portfolio/honors/student/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| honorType | String | 否 | 荣誉类型 |
| level | String | 否 | 荣誉级别 |

#### 3.2 添加荣誉

**接口地址：** `POST /api/portfolio/honors`

**请求头：** 需要认证

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| title | String | 是 | 荣誉称号 |
| honorType | String | 否 | 荣誉类型 |
| level | String | 否 | 级别：校级/市级/省级/国家级/国际级 |
| awardingOrg | String | 否 | 颁发机构 |
| awardedDate | String | 否 | 获奖日期 |
| description | String | 否 | 描述 |
| evidenceUrl | String | 否 | 证明材料URL |
| semester | String | 否 | 获得学期 |

#### 3.3 更新荣誉

**接口地址：** `PUT /api/portfolio/honors/:id`

**请求头：** 需要认证

#### 3.4 删除荣誉

**接口地址：** `DELETE /api/portfolio/honors/:id`

**请求头：** 需要认证

#### 3.5 获取荣誉统计

**接口地址：** `GET /api/portfolio/honors/stats/:studentId`

**请求头：** 需要认证

---

### 四、心理健康

#### 4.1 获取心理健康记录列表

**接口地址：** `GET /api/portfolio/mental-health/student/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| assessmentType | String | 否 | 测评类型 |

#### 4.2 添加心理健康记录

**接口地址：** `POST /api/portfolio/mental-health`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| assessmentDate | String | 是 | 测评日期 |
| assessmentType | String | 否 | 测评类型 |
| overallScore | Number | 否 | 总得分 |
| stressLevel | String | 否 | 压力水平：低/中/高 |
| moodScore | Number | 否 | 情绪指数 0-100 |
| details | Object | 否 | 详细测评数据（JSON） |
| notes | String | 否 | 备注/建议 |

#### 4.3 更新心理健康记录

**接口地址：** `PUT /api/portfolio/mental-health/:id`

**请求头：** 需要认证（admin, teacher）

#### 4.4 删除心理健康记录

**接口地址：** `DELETE /api/portfolio/mental-health/:id`

**请求头：** 需要认证（admin, teacher）

#### 4.5 获取心理趋势

**接口地址：** `GET /api/portfolio/mental-health/trend/:studentId`

**请求头：** 需要认证

**响应数据：**

```json
{
  "code": 0,
  "data": {
    "trend": [
      {
        "assessmentDate": "2024-01-15",
        "moodScore": 75,
        "stressLevel": "中",
        "overallScore": 68
      }
    ],
    "latestRecord": { ... }
  },
  "message": "success"
}
```

---

### 五、评语管理

#### 5.1 获取学生评语列表

**接口地址：** `GET /api/portfolio/comments/student/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| semester | String | 否 | 学期 |
| commentType | String | 否 | 评语类型 |

#### 5.2 获取最新学期评语

**接口地址：** `GET /api/portfolio/comments/latest/:studentId`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester | String | 否 | 指定学期，不传则返回最新 |

#### 5.3 添加评语

**接口地址：** `POST /api/portfolio/comments`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| classId | Number | 否 | 班级ID |
| semester | String | 是 | 学期 |
| commentType | String | 否 | 评语类型，默认 general |
| content | String | 是 | 评语内容 |
| commentStyle | String | 否 | 评语风格 |
| source | String | 否 | 来源：teacher/ai/edited |

#### 5.4 更新评语

**接口地址：** `PUT /api/portfolio/comments/:id`

**请求头：** 需要认证（admin, teacher）

#### 5.5 删除评语

**接口地址：** `DELETE /api/portfolio/comments/:id`

**请求头：** 需要认证（admin, teacher）

#### 5.6 AI 生成评语

**接口地址：** `POST /api/portfolio/comments/generate`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | Number | 是 | 学生ID |
| semester | String | 否 | 学期 |
| style | String | 否 | 风格，默认 warm |
| length | String | 否 | 篇幅，默认 medium |

> 基于学生档案数据由 AI 生成评语文本，返回内容供教师确认后保存。

---

## 用户管理模块

> 该模块沿用 `{ success, data, message }` 响应结构。

### 获取用户列表

**接口地址：** `GET /api/users`

**请求头：** 需要认证（admin）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页条数，默认10 |
| role | String | 否 | 角色筛选：student/teacher/admin |

### 获取用户详情

**接口地址：** `GET /api/users/:id`

**请求头：** 需要认证

### 更新用户信息

**接口地址：** `PUT /api/users/:id`

**请求头：** 需要认证（本人或 admin）

### 更新用户偏好设置

**接口地址：** `PUT /api/users/:id/preferences`

**请求头：** 需要认证（仅本人）

**请求参数：** 偏好设置对象，字段随业务扩展。

### 获取用户个性化首页数据

**接口地址：** `GET /api/users/:id/dashboard`

**请求头：** 需要认证

> 按用户角色返回不同结构：学生返回课表/通知/待办；教师返回今日课程/待办/学生反馈；管理员返回统计与系统日志。

### 上传头像

**接口地址：** `POST /api/users/:id/avatar`

**请求头：** 需要认证（本人或 admin）

**Content-Type:** `multipart/form-data`

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| avatar | File | 是 | JPG/PNG 图片，最大 2MB |

### 删除头像

**接口地址：** `DELETE /api/users/:id/avatar`

**请求头：** 需要认证（本人或 admin）

---

## 管理用户模块

> 管理员专用用户治理接口，统一 `{ code, data, message }` 响应。全部接口需要认证且角色为 `admin`。

### 获取用户列表（分页筛选）

**接口地址：** `GET /api/admin/users`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| role | String | 否 | 角色筛选 |
| classId | Number | 否 | 班级筛选 |
| keyword | String | 否 | 姓名/用户名/学号关键词 |
| status | Number | 否 | 状态筛选 |

### 下载导入模板

**接口地址：** `GET /api/admin/users/template`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | String | 是 | 模板对应角色 |

> 返回 `.xlsx` 文件流（`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`）。

### 获取用户详情

**接口地址：** `GET /api/admin/users/:id`

### 创建用户

**接口地址：** `POST /api/admin/users`

**请求参数：** 用户字段对象（用户名、密码、姓名、角色、班级等）。

### 更新用户

**接口地址：** `PUT /api/admin/users/:id`

### 删除用户

**接口地址：** `DELETE /api/admin/users/:id`

### 重置密码

**接口地址：** `POST /api/admin/users/:id/reset-password`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newPassword | String | 否 | 不传则由系统生成随机密码 |

### 批量重置密码

**接口地址：** `POST /api/admin/users/batch-reset-password`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userIds | Number[] | 是 | 用户ID数组 |

### 批量分配班级

**接口地址：** `POST /api/admin/users/batch-update-class`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userIds | Number[] | 是 | 用户ID数组 |
| classId | Number | 是 | 目标班级ID |

### 切换启用状态

**接口地址：** `PUT /api/admin/users/:id/toggle-status`

### Excel 批量导入用户

**接口地址：** `POST /api/admin/users/import`

**Content-Type:** `multipart/form-data`

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | `.xlsx`/`.xls`，最大 10MB |
| role | String | 是 | 导入用户的角色 |

---

## 课程模块

> 该模块沿用 `{ success, data, message }` 响应结构。

### 获取学期列表

**接口地址：** `GET /api/courses/semesters`

**请求头：** 需要认证

### 获取教师列表

**接口地址：** `GET /api/courses/teachers`

**请求头：** 需要认证

> 教师名称取自 `courses` 表的去重值。

### 获取课程列表

**接口地址：** `GET /api/courses`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页条数，默认10 |
| semester | String | 否 | 学期筛选 |

### 获取课程详情

**接口地址：** `GET /api/courses/:id`

**请求头：** 需要认证

### 创建课程

**接口地址：** `POST /api/courses`

**请求头：** 需要认证（admin, teacher）

### 更新课程

**接口地址：** `PUT /api/courses/:id`

**请求头：** 需要认证（admin, teacher）

### 删除课程

**接口地址：** `DELETE /api/courses/:id`

**请求头：** 需要认证（admin）

### 获取学生选课列表

**接口地址：** `GET /api/courses/student/:studentId`

**请求头：** 需要认证

### 学生选课

**接口地址：** `POST /api/courses/:id/enroll`

**请求头：** 需要认证（student）

### 获取课程学生列表

**接口地址：** `GET /api/courses/:id/students`

**请求头：** 需要认证

### 获取 AI 推荐学习资源

**接口地址：** `GET /api/courses/recommend/resources`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | Number | 否 | 返回条数，默认5 |

---

## 课表模块

> 统一 `{ code, data, message }` 响应。

### 获取节次与星期定义

**接口地址：** `GET /api/timetable/periods`

**请求头：** 需要认证

> 返回 `{ periods, days }`，供前端渲染周课表网格。

### 获取排课表单选项

**接口地址：** `GET /api/timetable/options`

**请求头：** 需要认证（admin, teacher）

> 返回班级 / 学科 / 教师 / 教室 / 学期选项。

### 获取当前用户课表

**接口地址：** `GET /api/timetable/my`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester | String | 否 | 学期 |

> 教师返回本人课表，学生返回本班课表，管理员返回班级概览。

### 冲突预检

**接口地址：** `POST /api/timetable/check-conflict`

**请求头：** 需要认证（admin, teacher）

**请求参数：** 待排课信息对象，返回结构化冲突结果。

### 获取周课表视图

**接口地址：** `GET /api/timetable`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester | String | 否 | 学期 |
| classId | Number | 否 | 班级 |
| teacherId | Number | 否 | 教师 |
| roomId | Number | 否 | 教室 |

### 新增排课

**接口地址：** `POST /api/timetable`

**请求头：** 需要认证（admin）

### 清空某班级课表

**接口地址：** `DELETE /api/timetable/class/:classId`

**请求头：** 需要认证（admin）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester | String | 否 | 限定学期 |

### 修改排课

**接口地址：** `PUT /api/timetable/:id`

**请求头：** 需要认证（admin）

### 删除排课

**接口地址：** `DELETE /api/timetable/:id`

**请求头：** 需要认证（admin）

---

## 活动模块

> 统一 `{ code, data, message }` 响应，列表接口使用分页结构。

### 获取活动类型字典

**接口地址：** `GET /api/activities/categories`

**请求头：** 需要认证

### 获取活动统计

**接口地址：** `GET /api/activities/stats`

**请求头：** 需要认证（admin, teacher）

### 获取当前用户报名记录

**接口地址：** `GET /api/activities/my`

**请求头：** 需要认证

### 获取活动列表

**接口地址：** `GET /api/activities`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |
| category | String | 否 | 活动类型 |
| status | String | 否 | 活动状态 |
| keyword | String | 否 | 关键词 |

> 学生视角额外返回 `hasJoined` / `canRegister`。

### 获取活动报名名单

**接口地址：** `GET /api/activities/:id/registrations`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 报名状态筛选 |

### 获取活动详情

**接口地址：** `GET /api/activities/:id`

**请求头：** 需要认证

### 发布活动

**接口地址：** `POST /api/activities`

**请求头：** 需要认证（admin, teacher）

### 修改活动

**接口地址：** `PUT /api/activities/:id`

**请求头：** 需要认证（admin, teacher）

### 删除活动

**接口地址：** `DELETE /api/activities/:id`

**请求头：** 需要认证（admin, teacher）

### 报名活动

**接口地址：** `POST /api/activities/:id/register`

**请求头：** 需要认证

> 报名成功后异步创建站内通知，通知失败不影响报名主流程。

### 取消报名

**接口地址：** `DELETE /api/activities/:id/register`

**请求头：** 需要认证

### 签到

**接口地址：** `PUT /api/activities/registrations/:registrationId/check-in`

**请求头：** 需要认证（admin, teacher）

---

## 选课模块

> 统一 `{ code, data, message }` 响应；发布/修改接口带参数校验。

### 获取筛选选项

**接口地址：** `GET /api/electives/categories`

**请求头：** 需要认证

> 返回类别 / 学期等公开筛选项。

### 获取表单选项

**接口地址：** `GET /api/electives/options`

**请求头：** 需要认证（admin, teacher）

### 获取选课统计

**接口地址：** `GET /api/electives/stats`

**请求头：** 需要认证（admin, teacher）

### 获取当前学生选课记录

**接口地址：** `GET /api/electives/my`

**请求头：** 需要认证

### 获取选修课列表

**接口地址：** `GET /api/electives`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页条数，默认10，最大100 |
| semester | String | 否 | 学期 |
| status | String | 否 | 状态：draft/open/closed |
| category | String | 否 | 类别 |
| keyword | String | 否 | 关键词 |
| teacherId | Number | 否 | 教师 |
| grade | String | 否 | 年级 |
| mine | String | 否 | 仅看本人相关 |

> 学生视角仅见开放课程，并返回 `hasSelected` / `canSelect`。

### 获取选课名单

**接口地址：** `GET /api/electives/:id/students`

**请求头：** 需要认证（admin, teacher）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 选课状态筛选 |

### 获取课程详情

**接口地址：** `GET /api/electives/:id`

**请求头：** 需要认证

### 发布选修课

**接口地址：** `POST /api/electives`

**请求头：** 需要认证（admin, teacher）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 课程名称，1-100字 |
| code | String | 否 | 课程代码，≤50字 |
| category | String | 否 | 类别，≤30字 |
| semester | String | 是 | 学期，1-20字 |
| teacherId | Number | 否 | 教师ID |
| subjectId | Number | 否 | 学科ID |
| grade | String | 否 | 年级，≤20字 |
| capacity | Number | 是 | 容量，1-9999 |
| credit | Number | 否 | 学分，0-99 |
| location | String | 否 | 上课地点，≤100字 |
| scheduleText | String | 否 | 上课时间文本，≤100字 |
| selectStart | String | 否 | 选课开始时间 |
| selectEnd | String | 否 | 选课结束时间 |
| status | String | 否 | 状态：draft/open/closed |
| description | String | 否 | 简介，≤500字 |

### 修改选修课

**接口地址：** `PUT /api/electives/:id`

**请求头：** 需要认证（admin, teacher）

> 字段同发布接口，均为可选（部分更新）。

### 删除选修课

**接口地址：** `DELETE /api/electives/:id`

**请求头：** 需要认证（admin, teacher）

### 学生选课

**接口地址：** `POST /api/electives/:id/select`

**请求头：** 需要认证（student）

> 选课成功后异步创建站内通知。

### 学生退选

**接口地址：** `DELETE /api/electives/:id/select`

**请求头：** 需要认证（student）

---

## 社交模块

> 该模块沿用 `{ success, data, message }` 响应结构。

### 获取活动列表

**接口地址：** `GET /api/social/activities`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页条数，默认10 |
| category | String | 否 | 活动类型 |
| status | String | 否 | 活动状态 |

### 创建活动

**接口地址：** `POST /api/social/activities`

**请求头：** 需要认证

### 报名活动

**接口地址：** `POST /api/social/activities/:id/join`

**请求头：** 需要认证

### 获取活动参与者

**接口地址：** `GET /api/social/activities/:id/participants`

**请求头：** 需要认证

### 获取兴趣小组

**接口地址：** `GET /api/social/groups`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 小组分类 |

### 加入兴趣小组

**接口地址：** `POST /api/social/groups/:id/join`

**请求头：** 需要认证

### 获取小组成员

**接口地址：** `GET /api/social/groups/:id/members`

**请求头：** 需要认证

### 获取学生成长档案（社交视图）

**接口地址：** `GET /api/social/growth/:studentId`

**请求头：** 需要认证

> 学生仅可查看本人档案，管理员 / 教师可查看全部。

### 获取情感化问候语

**接口地址：** `GET /api/social/greeting`

**请求头：** 需要认证

---

## 校园服务模块

> 该模块沿用 `{ success, data, message }` 响应结构。

### 查询空闲教室

**接口地址：** `GET /api/services/rooms/available`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| building | String | 否 | 教学楼 |
| date | String | 否 | 日期 |
| timeSlot | Number | 否 | 时间段 |

### 获取教学楼列表

**接口地址：** `GET /api/services/rooms/buildings`

**请求头：** 需要认证

### 预约教室

**接口地址：** `POST /api/services/rooms/reserve`

**请求头：** 需要认证

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomId | Number | 是 | 教室ID |
| date | String | 是 | 预约日期 |
| timeSlot | Number | 是 | 时间段 |
| purpose | String | 否 | 用途 |

### 获取图书列表

**接口地址：** `GET /api/services/books`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页条数，默认10 |
| keyword | String | 否 | 关键词 |
| category | String | 否 | 图书分类 |

### 借阅图书

**接口地址：** `POST /api/services/books/:id/borrow`

**请求头：** 需要认证

### 归还图书

**接口地址：** `POST /api/services/books/borrowings/:id/return`

**请求头：** 需要认证

### 获取食堂列表

**接口地址：** `GET /api/services/canteens`

**请求头：** 需要认证

### 获取全部食堂人流

**接口地址：** `GET /api/services/canteens/crowd`

**请求头：** 需要认证

### 获取指定食堂人流

**接口地址：** `GET /api/services/canteens/:id/crowd`

**请求头：** 需要认证

### 获取食堂菜单

**接口地址：** `GET /api/services/canteens/:id/menu`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 菜品分类 |

### 创建订餐订单

**接口地址：** `POST /api/services/orders`

**请求头：** 需要认证

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| canteenId | Number | 是 | 食堂ID |
| items | Array | 是 | 菜品明细 |
| totalPrice | Number | 是 | 总价 |
| pickupTime | String | 否 | 取餐时间 |

---

## 通知模块

> 统一 `{ code, data, message }` 响应。

### 获取通知列表

**接口地址：** `GET /api/notifications`

**请求头：** 需要认证

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页条数，默认20，最大100 |
| unreadOnly | String | 否 | 仅未读：true/false |
| type | String | 否 | 通知类型，取值见 `NotificationService.types` |

> 按角色收敛可见范围。

### 标记单条已读

**接口地址：** `PUT /api/notifications/:id/read`

**请求头：** 需要认证

### 全部标记已读

**接口地址：** `PUT /api/notifications/read-all`

**请求头：** 需要认证

### 发布通知

**接口地址：** `POST /api/notifications`

**请求头：** 需要认证（admin）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 标题，2-200字 |
| content | String | 否 | 内容，≤2000字 |
| type | String | 否 | 通知类型 |
| targetRole | String | 否 | 目标角色：all/student/teacher/admin |
| targetUserId | Number | 否 | 指定接收用户 |

### 删除通知

**接口地址：** `DELETE /api/notifications/:id`

**请求头：** 需要认证

---

## 首页看板模块

> 统一 `{ code, data, message }` 响应。

### 获取首页看板数据

**接口地址：** `GET /api/home/dashboard`

**请求头：** 需要认证

> 按当前登录用户角色返回不同聚合结构：`admin` 全局统计、`teacher` 教学数据、`student` 学习数据。

---

## AI 健康分析模块

> 该模块沿用 `{ success, data, message }` 响应结构。全部接口需要认证且角色为 `admin`。

### 获取总览数据

**接口地址：** `GET /api/ai-health/overview`

> 返回班级/教师总数、AI 使用时长、预警学生数、成绩与学习时长趋势、依赖程度分布等。

### 获取学生列表

**接口地址：** `GET /api/ai-health/students`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | String | 否 | 姓名关键词 |
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页条数，默认20 |

### 获取学生详情

**接口地址：** `GET /api/ai-health/students/:id`

### 获取预警列表

**接口地址：** `GET /api/ai-health/warnings`

> 基于 AI 使用时长与班级平均的比值生成预警级别与干预建议。

### 获取干预方案

**接口地址：** `GET /api/ai-health/recommendations`

### 获取干预反馈

**接口地址：** `GET /api/ai-health/interventions/feedback`

### 获取分析数据

**接口地址：** `GET /api/ai-health/analytics`

### 获取单个学生预警详情

**接口地址：** `GET /api/ai-health/student-warning/:id`

---

## AI 对话模块

> 该模块沿用 `{ success, data, message }` 响应结构。

### AI 对话

**接口地址：** `POST /api/ai-science/chat`

**请求头：** 无需认证

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | String | 是 | 用户消息 |
| history | Array | 否 | 历史对话上下文 |
| systemPrompt | String | 否 | 自定义系统提示词 |

> 后端基于 DeepSeek 提供对话能力，供全局 AI 助手组件调用。

---

## 操作日志模块

> 统一 `{ code, data, message }` 响应。全部接口需要认证且角色为 `admin`。

### 获取操作日志列表

**接口地址：** `GET /api/operation-logs`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页条数，默认20，最大100 |
| module | String | 否 | 模块 |
| action | String | 否 | 操作动作 |
| username | String | 否 | 操作人 |
| method | String | 否 | 请求方法：POST/PUT/PATCH/DELETE |
| success | Boolean | 否 | 是否成功 |
| startDate | String | 否 | 开始日期 |
| endDate | String | 否 | 结束日期 |
| keyword | String | 否 | 关键词 |

### 获取审计统计

**接口地址：** `GET /api/operation-logs/stats`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | String | 否 | 开始日期 |
| endDate | String | 否 | 结束日期 |

### 获取模块字典

**接口地址：** `GET /api/operation-logs/modules`

---

## 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| 0 | 200 | 成功 |
| 40000 | 400 | 请求参数错误 |
| 40001 | 400 | 参数校验失败 |
| 40100 | 401 | 未认证 |
| 40101 | 401 | Token已过期 |
| 40300 | 403 | 权限不足 |
| 40400 | 404 | 资源不存在 |
| 40900 | 409 | 数据冲突（已存在） |
| 50000 | 500 | 服务器内部错误 |
| 50001 | 500 | 数据库错误 |
| 50003 | 500 | 服务不可用 |

---

**文档版本：** v1.1.0  
**维护说明：** 新增接口请及时更新本文档
