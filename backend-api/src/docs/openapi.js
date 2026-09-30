/**
 * OpenAPI 3.0 规范（手写维护，无第三方依赖）
 *
 * 访问：
 *   GET /api/docs            -> 可视化文档页面
 *   GET /api/docs/openapi.json -> 原始规范
 */

const jsonResponse = (schemaRef) => ({
  description: '成功',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: 0 },
          message: { type: 'string', example: 'success' },
          data: schemaRef
        }
      }
    }
  }
});

const errorResponse = {
  description: '请求失败',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: 40001 },
          message: { type: 'string', example: '参数校验失败' },
          data: { type: 'object', nullable: true }
        }
      }
    }
  }
};

const pageQuery = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } }
];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: '智评AI · 智能校园管理平台 API',
    version: '1.0.0',
    description:
      '智能校园管理平台后端接口文档。统一响应结构为 { code, data, message }，code=0 表示成功。' +
      '除登录/注册外，所有接口需在请求头携带 Authorization: Bearer <token>。'
  },
  servers: [
    { url: 'http://localhost:3000', description: '本地开发环境' }
  ],
  tags: [
    { name: '认证', description: '登录、注册、令牌与个人信息' },
    { name: '选课系统', description: '选修课发布、选课与退选' },
    { name: '活动管理', description: '校园活动发布、报名与签到' },
    { name: '课表管理', description: '周课表、排课与冲突检测' },
    { name: '教学分析', description: '考试成绩与学情分析' },
    { name: '用户管理', description: '用户与班级管理' },
    { name: '操作日志', description: '审计日志查询（管理员）' },
    { name: '系统', description: '健康检查与接口文档' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      ElectiveCourse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          code: { type: 'string', example: 'EL101' },
          name: { type: 'string', example: '中国古典诗词鉴赏' },
          category: { type: 'string', example: '人文社科' },
          teacherId: { type: 'integer', nullable: true },
          teacherName: { type: 'string', nullable: true },
          semester: { type: 'string', example: '2025-2026-1' },
          grade: { type: 'string', nullable: true, example: '高一' },
          capacity: { type: 'integer', example: 60 },
          selectedCount: { type: 'integer', example: 45 },
          remaining: { type: 'integer', example: 15 },
          credit: { type: 'number', example: 2 },
          location: { type: 'string', example: '文科楼 201' },
          scheduleText: { type: 'string', example: '周三 7-8 节' },
          selectStart: { type: 'string', format: 'date-time', nullable: true },
          selectEnd: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['draft', 'open', 'closed'] },
          isFull: { type: 'boolean' },
          canSelect: { type: 'boolean' },
          hasSelected: { type: 'boolean' }
        }
      },
      OperationLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string', nullable: true },
          role: { type: 'string', nullable: true },
          module: { type: 'string', example: 'electives' },
          action: { type: 'string', example: 'create' },
          method: { type: 'string', example: 'POST' },
          path: { type: 'string', example: '/api/electives' },
          targetType: { type: 'string', nullable: true },
          targetId: { type: 'string', nullable: true },
          statusCode: { type: 'integer', example: 200 },
          success: { type: 'boolean' },
          durationMs: { type: 'integer', example: 42 },
          ip: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['系统'],
        summary: '健康检查',
        security: [],
        responses: { 200: jsonResponse({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) }
      }
    },
    '/api/docs': {
      get: { tags: ['系统'], summary: '可视化接口文档', security: [], responses: { 200: { description: 'HTML 文档页面' } } }
    },
    '/api/docs/openapi.json': {
      get: { tags: ['系统'], summary: 'OpenAPI 规范', security: [], responses: { 200: { description: 'OpenAPI 3.0 JSON' } } }
    },
    '/api/auth/login': {
      post: {
        tags: ['认证'],
        summary: '用户登录',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: jsonResponse({ type: 'object', properties: { token: { type: 'string' }, user: { type: 'object' } } }),
          400: errorResponse,
          429: errorResponse
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['认证'],
        summary: '用户注册',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'name', 'role'],
                properties: {
                  username: { type: 'string', minLength: 3 },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'teacher', 'admin'] }
                }
              }
            }
          }
        },
        responses: { 201: jsonResponse({ type: 'object', properties: { userId: { type: 'integer' } } }), 400: errorResponse }
      }
    },
    '/api/auth/me': {
      get: { tags: ['认证'], summary: '获取当前用户信息', responses: { 200: jsonResponse({ type: 'object' }), 401: errorResponse } }
    },
    '/api/electives/categories': {
      get: { tags: ['选课系统'], summary: '课程类别与学期字典', responses: { 200: jsonResponse({ type: 'object' }) } }
    },
    '/api/electives/options': {
      get: {
        tags: ['选课系统'],
        summary: '发布表单选项（管理员/教师）',
        responses: { 200: jsonResponse({ type: 'object' }), 403: errorResponse }
      }
    },
    '/api/electives/stats': {
      get: {
        tags: ['选课系统'],
        summary: '选课统计（管理员/教师）',
        responses: { 200: jsonResponse({ type: 'object' }), 403: errorResponse }
      }
    },
    '/api/electives/my': {
      get: { tags: ['选课系统'], summary: '我的选课记录（学生）', responses: { 200: jsonResponse({ type: 'object' }) } }
    },
    '/api/electives': {
      get: {
        tags: ['选课系统'],
        summary: '选修课列表',
        parameters: [
          ...pageQuery,
          { name: 'semester', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'open', 'closed'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'keyword', in: 'query', schema: { type: 'string' } },
          { name: 'grade', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: jsonResponse({ type: 'object', properties: { list: { type: 'array', items: { $ref: '#/components/schemas/ElectiveCourse' } }, total: { type: 'integer' } } }) }
      },
      post: {
        tags: ['选课系统'],
        summary: '发布选修课（管理员/教师）',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'semester', 'capacity'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  code: { type: 'string', maxLength: 50 },
                  category: { type: 'string', maxLength: 30 },
                  semester: { type: 'string', maxLength: 20 },
                  grade: { type: 'string', maxLength: 20 },
                  capacity: { type: 'integer', minimum: 1, maximum: 9999 },
                  credit: { type: 'number', minimum: 0, maximum: 99 },
                  location: { type: 'string' },
                  scheduleText: { type: 'string' },
                  selectStart: { type: 'string' },
                  selectEnd: { type: 'string' },
                  status: { type: 'string', enum: ['draft', 'open', 'closed'] },
                  description: { type: 'string', maxLength: 500 }
                }
              }
            }
          }
        },
        responses: { 200: jsonResponse({ $ref: '#/components/schemas/ElectiveCourse' }), 400: errorResponse, 403: errorResponse }
      }
    },
    '/api/electives/{id}': {
      get: {
        tags: ['选课系统'],
        summary: '选修课详情',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ $ref: '#/components/schemas/ElectiveCourse' }), 404: errorResponse }
      },
      put: {
        tags: ['选课系统'],
        summary: '修改选修课（管理员/教师）',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ $ref: '#/components/schemas/ElectiveCourse' }), 400: errorResponse, 404: errorResponse }
      },
      delete: {
        tags: ['选课系统'],
        summary: '删除选修课（管理员/教师）',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse(null), 404: errorResponse }
      }
    },
    '/api/electives/{id}/students': {
      get: {
        tags: ['选课系统'],
        summary: '选课名单（管理员/教师）',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ type: 'object' }) }
      }
    },
    '/api/electives/{id}/select': {
      post: {
        tags: ['选课系统'],
        summary: '学生选课',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ type: 'object' }), 400: errorResponse }
      },
      delete: {
        tags: ['选课系统'],
        summary: '学生退选',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ type: 'object' }), 400: errorResponse }
      }
    },
    '/api/activities': {
      get: { tags: ['活动管理'], summary: '活动列表', parameters: pageQuery, responses: { 200: jsonResponse({ type: 'object' }) } },
      post: { tags: ['活动管理'], summary: '发布活动（管理员/教师）', responses: { 200: jsonResponse({ type: 'object' }), 400: errorResponse } }
    },
    '/api/activities/{id}/register': {
      post: {
        tags: ['活动管理'],
        summary: '活动报名（学生）',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ type: 'object' }) }
      },
      delete: {
        tags: ['活动管理'],
        summary: '取消报名（学生）',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: jsonResponse({ type: 'object' }) }
      }
    },
    '/api/timetable/my': {
      get: { tags: ['课表管理'], summary: '当前用户课表', parameters: [{ name: 'semester', in: 'query', schema: { type: 'string' } }], responses: { 200: jsonResponse({ type: 'object' }) } }
    },
    '/api/timetable/check-conflict': {
      post: { tags: ['课表管理'], summary: '排课冲突预检', responses: { 200: jsonResponse({ type: 'object' }) } }
    },
    '/api/teaching/analysis/class/{examId}/{classId}': {
      get: {
        tags: ['教学分析'],
        summary: '班级学情分析',
        parameters: [
          { name: 'examId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'classId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { 200: jsonResponse({ type: 'object' }) }
      }
    },
    '/api/admin/users': {
      get: { tags: ['用户管理'], summary: '用户列表（管理员）', parameters: [...pageQuery, { name: 'role', in: 'query', schema: { type: 'string' } }], responses: { 200: jsonResponse({ type: 'object' }) } }
    },
    '/api/operation-logs': {
      get: {
        tags: ['操作日志'],
        summary: '操作日志列表（管理员）',
        parameters: [
          ...pageQuery,
          { name: 'module', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'username', in: 'query', schema: { type: 'string' } },
          { name: 'method', in: 'query', schema: { type: 'string', enum: ['POST', 'PUT', 'PATCH', 'DELETE'] } },
          { name: 'success', in: 'query', schema: { type: 'boolean' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: jsonResponse({ type: 'object', properties: { list: { type: 'array', items: { $ref: '#/components/schemas/OperationLog' } }, total: { type: 'integer' } } }) }
      }
    },
    '/api/operation-logs/stats': {
      get: { tags: ['操作日志'], summary: '审计统计（管理员）', responses: { 200: jsonResponse({ type: 'object' }) } }
    },
    '/api/operation-logs/modules': {
      get: { tags: ['操作日志'], summary: '模块字典（管理员）', responses: { 200: jsonResponse({ type: 'array', items: { type: 'string' } }) } }
    }
  }
};