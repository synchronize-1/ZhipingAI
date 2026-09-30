-- V1.0.0 回滚：按创建的逆序删除核心表（注意外键依赖关系）
-- 注意：schema_migrations 由迁移运行器负责维护，不在此处删除。
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notification_reads;
DROP TABLE IF EXISTS portfolio_comments;
DROP TABLE IF EXISTS portfolio_mental_health;
DROP TABLE IF EXISTS portfolio_honors;
DROP TABLE IF EXISTS portfolio_skills;
DROP TABLE IF EXISTS class_subject_teachers;
DROP TABLE IF EXISTS exam_scores;
DROP TABLE IF EXISTS exam_subjects;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;

SET FOREIGN_KEY_CHECKS = 1;