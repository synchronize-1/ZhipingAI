const https = require('https');

// API 配置 - 从环境变量读取
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

class DeepSeekService {
  /**
   * 通用对话接口
   * @param {Array} messages - 消息列表 [{ role: 'system'|'user'|'assistant', content: string }]
   * @param {Object} options - 配置选项
   * @param {string} options.model - 模型名称，默认 deepseek-chat
   * @param {number} options.temperature - 温度参数，默认 0.7
   * @param {number} options.maxTokens - 最大 token 数，默认 1000
   * @returns {Promise<string>} - 生成的文本内容
   * @throws {Error} - API 调用失败时抛出错误
   */
  static async chat(messages, options = {}) {
    if (!DEEPSEEK_API_KEY) {
      const error = new Error('DeepSeek API Key 未配置，请设置环境变量 DEEPSEEK_API_KEY');
      error.name = 'ConfigError';
      error.code = 'MISSING_API_KEY';
      throw error;
    }

    const model = options.model || 'deepseek-chat';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.maxTokens || 1000;

    const requestData = JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      stream: false
    });

    let url;
    try {
      url = new URL(DEEPSEEK_API_URL);
    } catch (e) {
      const error = new Error(`DeepSeek API URL 配置无效: ${DEEPSEEK_API_URL}`);
      error.name = 'ConfigError';
      error.code = 'INVALID_API_URL';
      throw error;
    }

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 60000
    };

    return new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const responseData = JSON.parse(data);
              if (responseData.choices && responseData.choices.length > 0) {
                resolve(responseData.choices[0].message.content);
              } else {
                const error = new Error('DeepSeek API 返回数据格式异常：缺少 choices 字段');
                error.name = 'APIResponseError';
                error.code = 'INVALID_RESPONSE_FORMAT';
                error.responseData = responseData;
                reject(error);
              }
            } catch (parseError) {
              const error = new Error(`DeepSeek API 响应解析失败: ${parseError.message}`);
              error.name = 'APIResponseError';
              error.code = 'RESPONSE_PARSE_ERROR';
              reject(error);
            }
          } else {
            let errorMessage = `DeepSeek API 请求失败 (HTTP ${res.statusCode})`;
            try {
              const errorData = JSON.parse(data);
              if (errorData.error) {
                errorMessage += `: ${errorData.error.message || JSON.stringify(errorData.error)}`;
              } else {
                errorMessage += `: ${data}`;
              }
            } catch (e) {
              errorMessage += `: ${data.substring(0, 200)}`;
            }
            const error = new Error(errorMessage);
            error.name = 'APIRequestError';
            error.code = `HTTP_${res.statusCode}`;
            error.statusCode = res.statusCode;
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        const apiError = new Error(`DeepSeek API 连接失败: ${error.message}`);
        apiError.name = 'APIConnectionError';
        apiError.code = 'CONNECTION_ERROR';
        apiError.cause = error;
        reject(apiError);
      });

      req.on('timeout', () => {
        req.destroy();
        const error = new Error('DeepSeek API 请求超时');
        error.name = 'APITimeoutError';
        error.code = 'TIMEOUT';
        reject(error);
      });

      req.write(requestData);
      req.end();
    });
  }
}

module.exports = DeepSeekService;
