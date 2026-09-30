const express = require('express');
const router = express.Router();
const AIScienceService = require('../services/aiScienceService');

/**
 * AI 对话 - 使用 DeepSeek
 * POST /api/ai-science/chat
 * 供全局 AI 助手（components/AIAssistant.vue、AIAssistantFloat.vue）调用
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history, systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }

    const result = await AIScienceService.chat(message, history, systemPrompt);
    res.json(result);
  } catch (error) {
    console.error('AI对话错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;