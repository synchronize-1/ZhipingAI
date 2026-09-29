const XLSX = require('xlsx');
const User = require('../models/User');
const Class = require('../models/Class.model');
const { ErrorCode } = require('../utils/response');

/**
 * 获取默认密码
 * @param {string} role - 用户角色
 * @param {string} studentId - 学号（学生用）
 * @param {string} employeeId - 工号（教师用）
 * @returns {string} 默认密码
 */
function getDefaultPassword(role, studentId, employeeId) {
  if (role === 'student' && studentId) {
    return String(studentId).slice(-6);
  }
  if (role === 'teacher' && employeeId) {
    return String(employeeId).slice(-6);
  }
  return '123456';
}

class UserService {
  // ==================== 1. 获取用户列表（分页、筛选） ====================
  static async getUserList(params) {
    const result = await User.getUserList(params);
    return result;
  }

  // ==================== 2. 获取用户详情 ====================
  static async getUserDetail(id) {
    const user = await User.getDetailById(id);
    if (!user) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }
    return user;
  }

  // ==================== 3. 创建用户 ====================
  static async createUser(userData) {
    const { username, name, role, email, phone, department, studentId, employeeId, classId } = userData;

    // 校验必填字段
    if (!username || !name || !role) {
      const error = new Error('用户名、姓名、角色为必填项');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 检查角色合法性
    if (!['admin', 'teacher', 'student'].includes(role)) {
      const error = new Error('角色不合法，仅支持 admin/teacher/student');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 检查 username 是否重复
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      const error = new Error('用户名已存在');
      error.name = 'ConflictError';
      error.code = ErrorCode.CONFLICT;
      throw error;
    }

    // 学生需检查学号是否重复
    if (role === 'student' && studentId) {
      const existing = await User.findByStudentId(studentId);
      if (existing) {
        const error = new Error('学号已存在');
        error.name = 'ConflictError';
        error.code = ErrorCode.CONFLICT;
        throw error;
      }
    }

    // 教师需检查工号是否重复
    if (role === 'teacher' && employeeId) {
      const existing = await User.findByEmployeeId(employeeId);
      if (existing) {
        const error = new Error('工号已存在');
        error.name = 'ConflictError';
        error.code = ErrorCode.CONFLICT;
        throw error;
      }
    }

    // 如果指定了班级，校验班级存在
    if (classId) {
      const cls = await Class.findById(classId);
      if (!cls) {
        const error = new Error('班级不存在');
        error.name = 'ValidationError';
        error.code = ErrorCode.PARAM_VALIDATION;
        throw error;
      }
    }

    // 生成默认密码
    const defaultPassword = getDefaultPassword(role, studentId, employeeId);

    const userId = await User.create({
      username,
      password: defaultPassword,
      name,
      role,
      email: email || null,
      phone: phone || null,
      avatar: null,
      department: department || null,
      studentId: studentId || null,
      employeeId: employeeId || null,
    });

    // 如果指定了班级，更新班级信息
    if (classId) {
      await User.update(userId, { class_id: classId });
    }

    return { userId, defaultPassword };
  }

  // ==================== 4. 更新用户信息 ====================
  static async updateUser(id, userData) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 可更新字段：name, role, email, phone, classId, department, status, studentId, employeeId
    const updateData = {};

    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.role !== undefined) {
      if (!['admin', 'teacher', 'student'].includes(userData.role)) {
        const error = new Error('角色不合法');
        error.name = 'ValidationError';
        error.code = ErrorCode.PARAM_VALIDATION;
        throw error;
      }
      updateData.role = userData.role;
    }
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.department !== undefined) updateData.department = userData.department;
    if (userData.status !== undefined) updateData.status = userData.status;
    if (userData.studentId !== undefined) updateData.student_id = userData.studentId;
    if (userData.employeeId !== undefined) updateData.employee_id = userData.employeeId;

    // 班级单独处理，校验存在性
    if (userData.classId !== undefined) {
      if (userData.classId !== null && userData.classId !== '') {
        const cls = await Class.findById(userData.classId);
        if (!cls) {
          const error = new Error('班级不存在');
          error.name = 'ValidationError';
          error.code = ErrorCode.PARAM_VALIDATION;
          throw error;
        }
      }
      updateData.class_id = userData.classId || null;
    }

    // 学号唯一性校验（如果修改了学号）
    if (userData.studentId && user.role === 'student') {
      const existing = await User.findByStudentId(userData.studentId);
      if (existing && existing.id !== Number(id)) {
        const error = new Error('学号已被其他用户使用');
        error.name = 'ConflictError';
        error.code = ErrorCode.CONFLICT;
        throw error;
      }
    }

    // 工号唯一性校验（如果修改了工号）
    if (userData.employeeId && user.role === 'teacher') {
      const existing = await User.findByEmployeeId(userData.employeeId);
      if (existing && existing.id !== Number(id)) {
        const error = new Error('工号已被其他用户使用');
        error.name = 'ConflictError';
        error.code = ErrorCode.CONFLICT;
        throw error;
      }
    }

    await User.update(id, updateData);
    return { success: true };
  }

  // ==================== 5. 删除用户 ====================
  static async deleteUser(id, currentUserId) {
    // 不能删除自己
    if (Number(id) === Number(currentUserId)) {
      const error = new Error('不能删除自己');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    const user = await User.findById(id);
    if (!user) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 不能删除最后一个管理员
    if (user.role === 'admin') {
      const adminCount = await User.countByRole('admin');
      if (adminCount <= 1) {
        const error = new Error('不能删除最后一个管理员');
        error.name = 'ForbiddenError';
        error.code = ErrorCode.FORBIDDEN;
        throw error;
      }
    }

    const deleted = await User.delete(id);
    return { success: deleted };
  }

  // ==================== 6. 重置密码 ====================
  static async resetPassword(id, newPassword = null) {
    const user = await User.getDetailById(id);
    if (!user) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    let password = newPassword;
    // 如果不传 newPassword，重置为默认密码
    if (!password) {
      password = getDefaultPassword(user.role, user.student_id, user.employee_id);
    }

    await User.updatePassword(id, password);
    return { newPassword: password };
  }

  // ==================== 7. 批量重置密码 ====================
  static async batchResetPassword(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      const error = new Error('用户ID列表不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const users = await User.findByIds(userIds);
    const results = [];
    let successCount = 0;

    for (const id of userIds) {
      const user = users.find(u => u.id === Number(id));
      if (!user) {
        results.push({ id, name: null, newPassword: null, valid: false, message: '用户不存在' });
        continue;
      }

      try {
        const defaultPassword = getDefaultPassword(user.role, user.student_id, user.employee_id);
        await User.updatePassword(user.id, defaultPassword);
        successCount++;
        results.push({ id: user.id, name: user.name, newPassword: defaultPassword, valid: true, message: '重置成功' });
      } catch (err) {
        results.push({ id: user.id, name: user.name, newPassword: null, valid: false, message: err.message });
      }
    }

    return { successCount, results };
  }

  // ==================== 8. 批量分配班级 ====================
  static async batchUpdateClass(userIds, classId) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      const error = new Error('用户ID列表不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    if (!classId) {
      const error = new Error('班级ID不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 校验班级存在
    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const affectedRows = await User.batchUpdateClass(userIds, classId);
    return { successCount: affectedRows };
  }

  // ==================== 9. 切换用户启用/禁用状态 ====================
  static async toggleStatus(id) {
    const user = await User.getDetailById(id);
    if (!user) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const newStatus = user.status === 1 ? 0 : 1;

    // 不能禁用最后一个管理员
    if (user.role === 'admin' && newStatus === 0) {
      const adminCount = await User.countByRole('admin');
      // 计算当前启用的管理员数量
      const allUsers = await User.getUserList({ role: 'admin', status: 1, pageSize: 1000 });
      const activeAdminCount = allUsers.total;
      if (activeAdminCount <= 1) {
        const error = new Error('不能禁用最后一个管理员');
        error.name = 'ForbiddenError';
        error.code = ErrorCode.FORBIDDEN;
        throw error;
      }
    }

    await User.updateStatus(id, newStatus);
    return { status: newStatus };
  }

  // ==================== 10. 批量导入用户（Excel） ====================
  static async importUsers(fileBuffer, role) {
    if (!role || !['admin', 'teacher', 'student'].includes(role)) {
      const error = new Error('角色不合法，仅支持 admin/teacher/student');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 解析 Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (jsonData.length < 2) {
      const error = new Error('Excel 文件内容为空或格式不正确');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 第一行是表头，从第二行开始读取数据
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // 预加载所有班级名称，用于快速校验
    const allClasses = await Class.getAllSimple();
    const classMap = {};
    for (const cls of allClasses) {
      classMap[cls.name] = cls.id;
    }

    // 预加载所有用户名/学号/工号，用于查重
    const allUsersResult = await User.getUserList({ pageSize: 10000 });
    const usernameSet = new Set(allUsersResult.list.map(u => u.username));
    const studentIdSet = new Set(allUsersResult.list.filter(u => u.student_id).map(u => u.student_id));
    const employeeIdSet = new Set(allUsersResult.list.filter(u => u.employee_id).map(u => u.employee_id));

    // 用于记录本次导入中出现的重复
    const importNoSet = new Set();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // Excel 行号，从 2 开始

      // 跳过空行
      if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
        continue;
      }

      // 列：学号/工号、姓名、邮箱(可选)、手机号(可选)、班级(可选，学生用)
      const no = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      const email = String(row[2] || '').trim() || null;
      const phone = String(row[3] || '').trim() || null;
      const className = String(row[4] || '').trim() || null;

      let valid = true;
      const messages = [];

      // 校验：学号/工号不能为空
      if (!no) {
        valid = false;
        messages.push('学号/工号不能为空');
      }

      // 校验：姓名不能为空
      if (!name) {
        valid = false;
        messages.push('姓名不能为空');
      }

      // 校验：学号/工号不能重复（数据库中已存在）
      if (no) {
        if (role === 'student' && studentIdSet.has(no)) {
          valid = false;
          messages.push('学号已存在');
        }
        if (role === 'teacher' && employeeIdSet.has(no)) {
          valid = false;
          messages.push('工号已存在');
        }
        if (usernameSet.has(no)) {
          valid = false;
          messages.push('用户名已存在');
        }
        // 本次导入内的重复
        if (importNoSet.has(no)) {
          valid = false;
          messages.push('Excel 内学号/工号重复');
        }
      }

      // 校验：班级名称需存在（仅学生）
      let classId = null;
      if (role === 'student' && className) {
        if (classMap[className]) {
          classId = classMap[className];
        } else {
          valid = false;
          messages.push(`班级"${className}"不存在`);
        }
      }

      if (!valid) {
        failCount++;
        results.push({
          no,
          name,
          valid: false,
          message: messages.join('；')
        });
        continue;
      }

      // 创建用户
      try {
        const defaultPassword = getDefaultPassword(role, role === 'student' ? no : null, role === 'teacher' ? no : null);

        const userData = {
          username: no,
          password: defaultPassword,
          name,
          role,
          email,
          phone,
          avatar: null,
          department: null,
          studentId: role === 'student' ? no : null,
          employeeId: role === 'teacher' ? no : null,
        };

        const userId = await User.create(userData);

        // 如果是学生且有班级，分配班级
        if (role === 'student' && classId) {
          await User.update(userId, { class_id: classId });
        }

        // 加入已存在集合，防止本批内重复
        importNoSet.add(no);
        usernameSet.add(no);
        if (role === 'student') studentIdSet.add(no);
        if (role === 'teacher') employeeIdSet.add(no);

        successCount++;
        results.push({
          no,
          name,
          valid: true,
          message: '导入成功'
        });
      } catch (err) {
        failCount++;
        results.push({
          no,
          name,
          valid: false,
          message: `导入失败：${err.message}`
        });
      }
    }

    return {
      total: results.length,
      successCount,
      failCount,
      results
    };
  }

  /**
   * 生成用户导入模板 Excel
   * @param {string} role - 目标角色：teacher/student
   * @returns {{ buffer: Buffer, fileName: string }}
   */
  static async generateImportTemplate(role) {
    if (!role || !['teacher', 'student'].includes(role)) {
      const error = new Error('角色不合法，仅支持 teacher/student');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const isStudent = role === 'student';
    const headers = isStudent
      ? ['学号', '姓名', '邮箱(可选)', '手机号(可选)', '班级(可选)']
      : ['工号', '姓名', '邮箱(可选)', '手机号(可选)', '部门(可选)'];

    const excelData = [headers];

    if (isStudent) {
      const classes = await Class.getAllSimple();
      excelData.push(['20240601', '张三', 'zhangsan@example.com', '13800000000', classes[0]?.name || '高一(1)班']);
      excelData.push(['20240602', '李四', '', '', classes[1]?.name || '高一(2)班']);
      excelData.push(['', '', '', '', '']);
      excelData.push(['说明：学号唯一且不可与已有账号重复；班级需与系统中班级名称完全一致；不填班级则暂不分配。', '', '', '', '']);
    } else {
      excelData.push(['T2024009', '王老师', 'wang@example.com', '13800000000', '语文组']);
      excelData.push(['T2024010', '李老师', '', '', '数学组']);
      excelData.push(['', '', '', '', '']);
      excelData.push(['说明：工号唯一且不可与已有账号重复；部门可自定义填写。', '', '', '', '']);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isStudent ? '学生导入' : '教师导入');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = isStudent ? '学生导入模板.xlsx' : '教师导入模板.xlsx';

    return { buffer, fileName };
  }
}

module.exports = UserService;
