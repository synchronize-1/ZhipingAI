const axios = require('axios');
const http = require('http');
const https = require('https');

// API配置 - 从环境变量读取，如果没有则使用默认值
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-5lzLEdS2GXHR6tL19B04ulpCkPTpnZdT7WneIs2bSF82BrAI';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://openrouter.fans/v1/chat/completions';

// Umi-OCR 本地服务配置
const UMI_OCR_URL = 'http://127.0.0.1:1224/api/ocr';

// 创建自定义axios实例，配置keepAlive和更长的超时
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ 
    keepAlive: true,
    rejectUnauthorized: false // 允许自签名证书
  }),
  timeout: 60000 // 60秒超时
});

class AIScienceService {

  /**
   * DeepSeek AI对话
   * @param {string} message - 用户消息
   * @param {Array} history - 历史对话
   * @param {string} systemPrompt - 系统提示词
   */
  static async chat(message, history = [], systemPrompt = null) {
    try {
      // 只发送当前用户消息，不包含历史对话和系统提示
      const messages = [
        { role: 'user', content: message }
      ];

      console.log('\n========================================');
      console.log('=== DeepSeek API 调用信息 ===');
      console.log('完整URL:', DEEPSEEK_API_URL);
      console.log('完整API Key:', DEEPSEEK_API_KEY);
      console.log('Messages:', JSON.stringify(messages));
      console.log('========================================\n');

      // 使用原生https模块发送请求
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

      console.log('=== API 响应成功 ===');

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

  /**
   * AI写诗
   */
  static async writePoem(theme, style = '现代诗') {
    const prompt = `请以"${theme}"为主题，创作一首${style}。
要求：
1. 语言优美，富有意境
2. 长度适中（4-8行）
3. 适合学生阅读`;

    return await this.chat(prompt, [], `你是一位才华横溢的AI诗人，擅长创作各种风格的诗歌。`);
  }

  /**
   * AI写故事
   */
  static async writeStory(beginning, genre = '奇幻') {
    const prompt = `请根据以下开头续写一个${genre}类型的短故事：
"${beginning}"

要求：
1. 故事有趣、有创意
2. 长度约200-300字
3. 结局要有意义`;

    return await this.chat(prompt, [], `你是一位创意十足的AI故事作家。`);
  }

  /**
   * AI情感分析
   */
  static async analyzeSentiment(text) {
    const prompt = `请分析以下文字的情感：
"${text}"

请用JSON格式返回：
{
  "emotion": "主要情感（开心/难过/生气/平静/惊讶/害怕）",
  "confidence": 0-100的置信度,
  "explanation": "简短解释（30字以内）"
}`;

    const result = await this.chat(prompt, [], `你是一个情感分析专家，擅长识别文字中的情感。请只返回JSON格式。`);
    
    if (result.success) {
      try {
        // 尝试解析JSON
        const jsonMatch = result.data.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: parsed
          };
        }
      } catch (e) {
        // 解析失败，返回原始回复
      }
    }
    
    return result;
  }


  /**
   * Umi-OCR - 本地文字识别
   * @param {string} imageBase64 - 图片的base64编码（无需前缀）
   */
  static async recognizeText(imageBase64) {
    try {
      console.log('\n========================================');
      console.log('=== Umi-OCR 识别请求 ===');
      console.log('图片大小:', imageBase64.length, '字符');
      console.log('========================================\n');

      // 调用Umi-OCR本地服务
      const response = await axios.post(
        UMI_OCR_URL,
        {
          base64: imageBase64,
          options: {
            'data.format': 'text'  // 返回纯文本格式
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('Umi-OCR响应:', response.data);

      // 处理响应
      if (response.data.code === 100) {
        // 识别成功
        const text = response.data.data;
        return {
          success: true,
          data: {
            text: text,
            wordsCount: text.length,
            time: response.data.time
          }
        };
      } else if (response.data.code === 101) {
        // 无文本
        return {
          success: false,
          message: '图片中未识别到文字',
          error: '无文本内容'
        };
      } else {
        // 识别失败
        return {
          success: false,
          message: '文字识别失败',
          error: response.data.data || '未知错误'
        };
      }
    } catch (error) {
      console.error('Umi-OCR识别错误:', error.message);
      
      // 检查是否是连接错误
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'OCR服务未启动',
          error: '请确保Umi-OCR软件正在运行，并且HTTP服务已开启（端口1224）'
        };
      }
      
      return {
        success: false,
        message: 'OCR服务暂时不可用',
        error: error.message
      };
    }
  }

  /**
   * AI科普问答 - 专门回答AI相关问题
   */
  static async aiScienceQA(question) {
    const systemPrompt = `你是AI科普校园的智能科普助手，专门为12-22岁的学生讲解AI知识。

你的任务：
1. 用简单易懂的语言解释AI概念
2. 多用生活中的例子和比喻
3. 避免使用复杂的数学公式和专业术语
4. 保持有趣、友好的语气
5. 回答控制在200字以内

科普内容包括：
- AI的历史和发展
- AI的基本原理（用比喻解释）
- AI的应用场景
- AI的未来展望
- AI的局限性和误区`;

    return await this.chat(question, [], systemPrompt);
  }

  /**
   * 图灵测试模拟 - 生成AI回复供学生判断
   */
  static async turingTestReply(topic) {
    const prompt = `请针对话题"${topic}"给出一个简短的回复（30-50字）。
这个回复将用于图灵测试游戏，学生需要判断这是人类还是AI说的。
有时请表现得像人类（有错别字、口语化），有时表现得像AI（太完美、太正式）。
只返回回复内容，不要其他说明。`;

    return await this.chat(prompt, [], '你正在参与一个图灵测试游戏。');
  }
}

module.exports = AIScienceService;
