const express = require('express');
const router = express.Router();
const AIScienceService = require('../services/aiScience.service');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, fail, ErrorCode } = require('../utils/response');

/**
 * AI 对话 - 使用 DeepSeek
 * POST /api/ai-science/chat
 * 供全局 AI 助手（components/AIAssistant.vue、AIAssistantFloat.vue）调用
 */
router.post('/chat', verifyToken, validate({
  body: {
    message: { required: true, type: 'string', min: 1, max: 4000 }
  }
}), async (req, res) => {
  try {
    const { message, history, systemPrompt } = req.body;

    const result = await AIScienceService.chat(message, history, systemPrompt);
    if (!result.success) {
      return fail(res, result.message || 'AI对话服务暂时不可用', ErrorCode.SERVICE_UNAVAILABLE);
    }

    return success(res, result.data);
  } catch (error) {
    console.error('AI对话错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

module.exports = router;