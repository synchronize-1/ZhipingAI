/**
 * 接口冒烟测试
 *
 * 用法: node src/scripts/smoke_test.js
 * 前置: 后端服务已启动（默认 http://localhost:3000），数据库可访问
 *
 * 覆盖：登录 / 用户管理 / 导入模板 / 首页看板 / 考试 / 成绩 /
 *       班级·年级·学生学情分析 / AI 诊断历史
 * 说明：AI 诊断生成接口会真实调用大模型，默认跳过，加 --with-ai 开启。
 */

const axios = require('axios');
const pool = require('../config/database');

const BASE = process.env.SMOKE_BASE || 'http://localhost:3000';
const WITH_AI = process.argv.includes('--with-ai');

const ADMIN_PASSWORDS = ['admin123', '123456'];

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}${detail ? `  — ${detail}` : ''}`);
}

function firstError(err) {
  if (err.response) {
    const d = err.response.data;
    return `HTTP ${err.response.status} ${typeof d === 'string' ? d : JSON.stringify(d)}`;
  }
  return err.message;
}

async function main() {
  // ---------- 准备测试数据 ----------
  const [[admin]] = await pool.query("SELECT username FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  const [[exam]] = await pool.query('SELECT id, name FROM exams ORDER BY id LIMIT 1');
  const [[cls]] = await pool.query('SELECT id, name FROM classes ORDER BY id LIMIT 1');
  const [[stu]] = await pool.query(
    "SELECT id, name FROM users WHERE role = 'student' AND class_id IS NOT NULL ORDER BY id LIMIT 1"
  );

  console.log(`\n🔧 测试数据: admin=${admin?.username} exam=${exam?.id}(${exam?.name}) class=${cls?.id}(${cls?.name}) student=${stu?.id}(${stu?.name})\n`);

  // ---------- 1. 登录 ----------
  let token = null;
  for (const pwd of ADMIN_PASSWORDS) {
    try {
      const res = await axios.post(`${BASE}/api/auth/login`, { username: admin.username, password: pwd });
      token = res.data?.data?.token;
      if (token) {
        record('登录 admin', true, `密码 ${pwd}`);
        break;
      }
    } catch (err) {
      /* 尝试下一个密码 */
    }
  }
  if (!token) {
    record('登录 admin', false, '候选密码均失败，后续接口无法测试');
    return;
  }

  // ---------- 1b. 测试教师 / 学生账号登录 ----------
  let teacherToken = null;
  for (const [uname, label] of [['teacher1', '教师'], ['20240201', '学生']]) {
    const res = await axios.post(
      `${BASE}/api/auth/login`,
      { username: uname, password: '123456' },
      { validateStatus: () => true }
    );
    const ok = res.status === 200 && res.data?.success && !!res.data?.data?.token;
    if (ok && label === '教师') teacherToken = res.data.data.token;
    record(
      `登录测试账号 ${uname}（${label}）`,
      ok,
      ok ? `角色 ${res.data.data.user.role}` : `HTTP ${res.status} ${JSON.stringify(res.data)}`
    );
  }

  const api = axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });

  // ---------- 2. 用户管理 ----------
  {
    const res = await api.get('/api/admin/users', { params: { page: 1, pageSize: 10 } });
    const ok = res.status === 200 && res.data?.code === 0 && Array.isArray(res.data.data?.list);
    record('GET /api/admin/users', ok, ok ? `共 ${res.data.data.total} 人` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  {
    const res = await api.get('/api/admin/users', { params: { page: 1, pageSize: 10, role: 'student', classId: cls?.id } });
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/admin/users?role=student&classId', ok, ok ? `班级 ${cls?.name} 共 ${res.data.data.total} 人` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  {
    const res = await api.get('/api/admin/users/template', { params: { role: 'student' }, responseType: 'arraybuffer' });
    const ok = res.status === 200 && Number(res.headers['content-length']) > 0;
    record('GET /api/admin/users/template', ok, ok ? `${res.headers['content-length']} bytes` : `HTTP ${res.status}`);
  }

  // ---------- 3. 首页看板 ----------
  {
    const res = await api.get('/api/home/dashboard');
    const ok = res.status === 200;
    record('GET /api/home/dashboard (admin)', ok, ok ? '' : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  if (teacherToken) {
    const res = await axios.get(`${BASE}/api/home/dashboard`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      validateStatus: () => true
    });
    const ok = res.status === 200;
    record('GET /api/home/dashboard (teacher)', ok, ok ? '' : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  // ---------- 4. 考试与成绩 ----------
  {
    const res = await api.get('/api/teaching/exams', { params: { page: 1, pageSize: 5 } });
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/teaching/exams', ok, ok ? `共 ${res.data.data.total} 场` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  if (exam && cls) {
    const res = await api.get('/api/teaching/scores', { params: { examId: exam.id, classId: cls.id } });
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/teaching/scores', ok, ok ? `${Array.isArray(res.data.data) ? res.data.data.length : 0} 条` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  // ---------- 5. 学情分析 ----------
  if (exam && cls) {
    const res = await api.get(`/api/teaching/analysis/class/${exam.id}/${cls.id}`);
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/teaching/analysis/class/:examId/:classId', ok, ok ? `科目 ${res.data.data?.overall?.subjectCount ?? '-'} 门 / 平均及格率 ${res.data.data?.overall?.avgPassRate ?? '-'}%` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  if (exam) {
    const res = await api.get(`/api/teaching/analysis/grade/${exam.id}`);
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/teaching/analysis/grade/:examId', ok, ok ? '' : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  if (stu) {
    const res = await api.get(`/api/teaching/analysis/student/${stu.id}`);
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/teaching/analysis/student/:studentId', ok, ok ? `历次 ${res.data.data?.totalExams ?? 0} 次` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  // ---------- 6. 诊断历史 ----------
  if (cls) {
    const res = await api.get('/api/teaching/analysis/diagnosis/history', { params: { reportType: 'class', targetId: cls.id, limit: 5 } });
    const ok = res.status === 200 && res.data?.code === 0;
    record('GET /api/teaching/analysis/diagnosis/history', ok, ok ? `${Array.isArray(res.data.data) ? res.data.data.length : 0} 条` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  // ---------- 7. AI 诊断生成（可选） ----------
  if (WITH_AI && exam && cls) {
    const res = await api.post('/api/teaching/analysis/class/diagnosis', { examId: exam.id, classId: cls.id }, { timeout: 120000 });
    const ok = res.status === 200 && res.data?.code === 0 && !!res.data.data?.content;
    record('POST /api/teaching/analysis/class/diagnosis (AI)', ok, ok ? `报告 ${res.data.data.content.length} 字` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  if (WITH_AI && stu) {
    const res = await api.post('/api/teaching/analysis/student/diagnosis', { studentId: stu.id }, { timeout: 120000 });
    const ok = res.status === 200 && res.data?.code === 0 && !!res.data.data?.content;
    record('POST /api/teaching/analysis/student/diagnosis (AI)', ok, ok ? `画像 ${res.data.data.content.length} 字` : `HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }

  // ---------- 汇总 ----------
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n📊 冒烟测试汇总: ${passed} 通过 / ${failed} 失败（共 ${results.length} 项）`);
  if (failed > 0) {
    console.log('失败项：');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
  }
  return failed;
}

main()
  .then(async (failed) => {
    await pool.end();
    process.exit(failed ? 1 : 0);
  })
  .catch(async (err) => {
    console.error('冒烟测试异常:', err);
    await pool.end();
    process.exit(1);
  });