# 智评校园 API 接口文档

> 版本：v1.0.0  
> 更新时间：2026-09-25

---

## 目录

- [通用说明](#通用说明)
- [认证模块](#认证模块)
- [教学质量评估模块](#教学质量评估模块)
- [学生成长档案模块](#学生成长档案模块)
- [用户管理模块](#用户管理模块)
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
  "code": 0,
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
  },
  "message": "登录成功"
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

---

### 四、班级与学科管理

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

#### 4.2 创建班级

**接口地址：** `POST /api/teaching/classes`

**请求头：** 需要认证（admin）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 班级名称 |
| grade | String | 否 | 年级 |
| headTeacherId | Number | 否 | 班主任ID |
| department | String | 否 | 学院/系 |

#### 4.3 更新班级

**接口地址：** `PUT /api/teaching/classes/:id`

**请求头：** 需要认证（admin）

#### 4.4 删除班级

**接口地址：** `DELETE /api/teaching/classes/:id`

**请求头：** 需要认证（admin）

#### 4.5 获取班级学科教师

**接口地址：** `GET /api/teaching/classes/:id/teachers`

**请求头：** 需要认证（admin, teacher）

#### 4.6 获取学科列表

**接口地址：** `GET /api/teaching/subjects`

**请求头：** 需要认证（admin）

#### 4.7 获取所有学科（精简）

**接口地址：** `GET /api/teaching/subjects/simple`

**请求头：** 需要认证

**响应：** 返回所有学科的 id, name, code, full_score

#### 4.8 创建学科

**接口地址：** `POST /api/teaching/subjects`

**请求头：** 需要认证（admin）

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 学科名称 |
| code | String | 是 | 学科编码 |
| category | String | 否 | 分类 |
| fullScore | Number | 否 | 满分，默认100 |

#### 4.9 更新学科

**接口地址：** `PUT /api/teaching/subjects/:id`

**请求头：** 需要认证（admin）

#### 4.10 删除学科

**接口地址：** `DELETE /api/teaching/subjects/:id`

**请求头：** 需要认证（admin）

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

---

## 用户管理模块

### 获取用户列表

**接口地址：** `GET /api/users`

**请求头：** 需要认证（admin）

### 获取用户详情

**接口地址：** `GET /api/users/:id`

**请求头：** 需要认证

### 更新用户信息

**接口地址：** `PUT /api/users/:id`

**请求头：** 需要认证

### 上传头像

**接口地址：** `POST /api/users/:id/avatar`

**请求头：** 需要认证

**Content-Type:** `multipart/form-data`

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

**文档版本：** v1.0.0  
**维护说明：** 新增接口请及时更新本文档
