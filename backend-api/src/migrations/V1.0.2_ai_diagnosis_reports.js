/**
 * V1.0.2 AI 学情诊断报告表
 *
 * 用于保存班级 / 学生 AI 学情诊断报告，支持历史查看与对比，
 * 避免重复调用大模型接口。
 *
 * - report_type: class（班级诊断）/ student（个人学情画像）
 * - target_id:   report_type 为 class 时为班级ID，为 student 时为学生ID
 * - exam_id:     关联考试（个人画像可为空，表示综合历次成绩）
 * - metrics:     生成报告时使用的统计快照（JSON）
 */

exports.up = async (connection) => {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ai_diagnosis_reports (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '报告ID',
      report_type VARCHAR(20) NOT NULL COMMENT '报告类型：class/student',
      target_id INT NOT NULL COMMENT '目标ID：班级ID或学生ID',
      exam_id INT DEFAULT NULL COMMENT '关联考试ID（可空）',
      title VARCHAR(200) COMMENT '报告标题',
      content TEXT NOT NULL COMMENT 'AI 生成的诊断内容',
      metrics JSON COMMENT '生成时的统计快照',
      generated_by INT COMMENT '生成人（教师/管理员）',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      INDEX idx_type_target (report_type, target_id),
      INDEX idx_exam_id (exam_id),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
      FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI学情诊断报告表'
  `);

  console.log('  ✅ ai_diagnosis_reports 表已创建');
};

exports.down = async (connection) => {
  await connection.execute('DROP TABLE IF EXISTS ai_diagnosis_reports');
  console.log('  🗑️  ai_diagnosis_reports 表已删除');
};