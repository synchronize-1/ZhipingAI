const axios = require('axios');
//original AI_AGENT_URL
// const AI_AGENT_URL = 'http://10.138.50.151:8004/api/agent/chat';
const AI_AGENT_URL = 'http://localhost:8004/api/agent/chat';

class AIAgentService {
  /**
   * 调用AI智能体进行对话
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @param {Array} history - 历史对话记录（可选）
   * @returns {Promise<Object>} AI回复
   */
  static async chat(message, userId, history = []) {
    try {
      const response = await axios.post(AI_AGENT_URL, {
        message,
        userId,
        history,
        timestamp: new Date().toISOString()
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('AI智能体调用错误:', error.message);
      return {
        success: false,
        message: '智能体服务暂时不可用',
        error: error.message
      };
    }
  }

  /**
   * 智能问答 - 课表查询
   */
  static async queryCourseSchedule(userId, query) {
    const message = `帮我查询课表：${query}`;
    return await this.chat(message, userId);
  }

  /**
   * 智能问答 - 空闲教室查询
   */
  static async queryAvailableRooms(userId, query) {
    const message = `帮我查询空闲教室：${query}`;
    return await this.chat(message, userId);
  }

  /**
   * 智能问答 - 食堂人流查询
   */
  static async queryCanteenCrowd(userId) {
    const message = '帮我查询食堂人流情况';
    return await this.chat(message, userId);
  }

  /**
   * 智能问答 - 通用查询
   */
  static async generalQuery(userId, query, context = {}) {
    const contextInfo = Object.keys(context).length > 0 
      ? `\n上下文信息：${JSON.stringify(context)}` 
      : '';
    const message = `${query}${contextInfo}`;
    return await this.chat(message, userId);
  }
}

module.exports = AIAgentService;
