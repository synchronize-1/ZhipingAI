const User = require('../models/User.model');
const { generateToken } = require('../middleware/auth');
const { ErrorCode } = require('../utils/response');

class AuthService {
  // 用户登录
  static async login(username, password) {
    const user = await User.findByUsername(username);
    if (!user) {
      const error = new Error('用户名或密码错误');
      error.name = 'UnauthorizedError';
      error.code = ErrorCode.UNAUTHORIZED;
      throw error;
    }

    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      const error = new Error('用户名或密码错误');
      error.name = 'UnauthorizedError';
      error.code = ErrorCode.UNAUTHORIZED;
      throw error;
    }

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      }
    };
  }

  // 用户注册
  static async register(userData) {
    const { username } = userData;
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      const error = new Error('用户名已存在');
      error.name = 'ConflictError';
      error.status = 409;
      throw error;
    }

    const userId = await User.create(userData);
    return { userId };
  }

  // 获取当前用户信息
  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }
    return user;
  }
}

module.exports = AuthService;
