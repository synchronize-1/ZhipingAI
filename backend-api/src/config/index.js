require('dotenv').config();

const config = {
  // 服务配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'smart_campus',
    connectionLimit: 10
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'smart-campus-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // AI 配置
  ai: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
    },
    umiOcr: {
      url: process.env.UMI_OCR_URL || 'http://127.0.0.1:1224/api/ocr'
    }
  },

  // 文件上传
  upload: {
    avatarDir: 'uploads/avatars',
    maxSize: 5 * 1024 * 1024 // 5MB
  }
};

module.exports = config;
