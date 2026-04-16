// 临时脚本：检查环境变量配置
require('dotenv').config();

console.log('=== 环境变量检查 ===');
console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? '已配置 ✓' : '未配置 ✗');
console.log('DeepSeek API URL:', process.env.DEEPSEEK_API_URL || '未配置');
console.log('百度 API Key:', process.env.BAIDU_API_KEY ? '已配置 ✓' : '未配置 ✗');
console.log('百度 Secret Key:', process.env.BAIDU_SECRET_KEY ? '已配置 ✓' : '未配置 ✗');
console.log('文心一格 URL:', process.env.YIGE_API_URL || '未配置');
console.log('百度 OCR URL:', process.env.BAIDU_OCR_API_URL || '未配置');
console.log('===================');
