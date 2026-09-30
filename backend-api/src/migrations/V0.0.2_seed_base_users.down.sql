-- V0.0.2 回滚：删除基础用户
DELETE FROM users WHERE id IN (1, 2, 3, 4, 5);