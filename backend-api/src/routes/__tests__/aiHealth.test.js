const express = require('express');
const request = require('supertest');

jest.mock('../../../src/config/database', () => ({
  execute: jest.fn()
}));

jest.mock('../../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  checkRole: () => (req, res, next) => next()
}));

const pool = require('../../../src/config/database');
const aiHealthRoutes = require('../../../src/routes/aiHealth');

describe('GET /api/ai-health/overview', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns overview data for admin', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ total: 120 }]])
      .mockResolvedValueOnce([[{ total: 18 }]]);

    const res = await request(app).get('/api/ai-health/overview');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.classTotal).toBe(120);
    expect(res.body.data.teacherTotal).toBe(18);
    expect(res.body.data.aiUsageHoursWeekly).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.weekLabels)).toBe(true);
    expect(Array.isArray(res.body.data.aiUsageByClass)).toBe(true);
    expect(Array.isArray(res.body.data.avgScoreTrend)).toBe(true);
    expect(Array.isArray(res.body.data.dependencyDistribution)).toBe(true);
  });
});

describe('GET /api/ai-health/students', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns searchable student list', async () => {
    pool.execute.mockResolvedValueOnce([[
      { id: 1, name: '张三', username: 'student001', department: '计算机学院', student_id: 'S000001' }
    ]]);

    const res = await request(app).get('/api/ai-health/students').query({ keyword: '张' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe('张三');
  });
});

describe('GET /api/ai-health/students/:id', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns student detail data', async () => {
    pool.execute.mockResolvedValueOnce([[
      { id: 1, name: '张三', username: 'student001', department: '计算机学院', student_id: 'S000001' }
    ]]);

    const res = await request(app).get('/api/ai-health/students/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('张三');
    expect(Array.isArray(res.body.data.scoreTrend)).toBe(true);
    expect(Array.isArray(res.body.data.aiUsageComposition)).toBe(true);
  });
});

describe('GET /api/ai-health/warnings', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns warning intervention list', async () => {
    const res = await request(app).get('/api/ai-health/warnings');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('level');
    expect(res.body.data[0]).toHaveProperty('suggestion');
  });
});

describe('GET /api/ai-health/recommendations', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns recommendation plans', async () => {
    const res = await request(app).get('/api/ai-health/recommendations');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('title');
  });
});

describe('GET /api/ai-health/interventions/feedback', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns intervention feedback metrics', async () => {
    const res = await request(app).get('/api/ai-health/interventions/feedback');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.stageLabels)).toBe(true);
    expect(Array.isArray(res.body.data.funnelValues)).toBe(true);
    expect(Array.isArray(res.body.data.scoreBeforeAfter)).toBe(true);
    expect(res.body.data.reassessment).toHaveProperty('ruleHint');
  });
});

describe('GET /api/ai-health/analytics', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-health', aiHealthRoutes);

  it('returns integrated analytics metrics', async () => {
    const res = await request(app).get('/api/ai-health/analytics');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('failRateCorrelation');
    expect(res.body.data).toHaveProperty('usageScoreCorrelation');
    expect(Array.isArray(res.body.data.overDependenceTrend)).toBe(true);
    expect(Array.isArray(res.body.data.usageScoreScatter)).toBe(true);
  });
});
