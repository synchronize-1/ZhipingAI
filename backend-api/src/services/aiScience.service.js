const https = require('https');

// API配置 - 从环境变量读取
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

class AIScienceService {

  /**
   * DeepSeek AI对话
   * @param {string} message - 用户消息
   * @param {Array} history - 历史对话
   * @param {string} systemPrompt - 系统提示词
   */
  static async chat(message, history = [], systemPrompt = null) {
    if (!DEEPSEEK_API_KEY) {
      return {
        success: false,
        message: 'AI对话服务未配置',
        error: '缺少 DEEPSEEK_API_KEY 环境变量'
      };
    }

    try {
      // 只发送当前用户消息，不包含历史对话和系统提示
      const messages = [
        { role: 'user', content: message }
      ];

      const requestData = JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      });

      const url = new URL(DEEPSEEK_API_URL);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        },
        timeout: 60000
      };

      const responseData = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.write(requestData);
        req.end();
      });

      return {
        success: true,
        data: {
          reply: responseData.choices[0].message.content,
          model: 'deepseek-chat',
          usage: responseData.usage
        }
      };
    } catch (error) {
      console.error('DeepSeek对话错误:', error.message);
      return {
        success: false,
        message: 'AI对话服务暂时不可用',
        error: error.message
      };
    }
  }
}

module.exports = AIScienceService;