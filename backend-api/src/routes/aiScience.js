const express = require('express');
const router = express.Router();
const AIScienceService = require('../services/aiScienceService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ai-science');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
  }
});

// ==================== AI体验中心 ====================

/**
 * AI对话 - 使用DeepSeek
 * POST /api/ai-science/chat
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

/**
 * AI写诗
 * POST /api/ai-science/write-poem
 */
router.post('/write-poem', async (req, res) => {
  try {
    const { theme, style } = req.body;

    if (!theme) {
      return res.status(400).json({ success: false, message: '请输入诗歌主题' });
    }

    const result = await AIScienceService.writePoem(theme, style);
    res.json(result);
  } catch (error) {
    console.error('AI写诗错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * AI写故事
 * POST /api/ai-science/write-story
 */
router.post('/write-story', async (req, res) => {
  try {
    const { beginning, genre } = req.body;

    if (!beginning) {
      return res.status(400).json({ success: false, message: '请输入故事开头' });
    }

    const result = await AIScienceService.writeStory(beginning, genre);
    res.json(result);
  } catch (error) {
    console.error('AI写故事错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * AI情感分析
 * POST /api/ai-science/analyze-sentiment
 */
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: '请输入要分析的文字' });
    }

    const result = await AIScienceService.analyzeSentiment(text);
    res.json(result);
  } catch (error) {
    console.error('情感分析错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * OCR文字识别 - 使用Umi-OCR本地服务
 * POST /api/ai-science/ocr
 */
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    let imageBase64;

    if (req.file) {
      // 从上传的文件读取
      const imageBuffer = fs.readFileSync(req.file.path);
      imageBase64 = imageBuffer.toString('base64');
      // 删除临时文件
      fs.unlinkSync(req.file.path);
    } else if (req.body.image) {
      // 前端发送的image字段（base64格式）
      imageBase64 = req.body.image.replace(/^data:image\/\w+;base64,/, '');
    } else if (req.body.imageBase64) {
      // 直接使用base64
      imageBase64 = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    } else {
      return res.status(400).json({ success: false, message: '请上传图片或提供图片base64' });
    }

    console.log('OCR识别请求，图片大小:', imageBase64.length, '字符');
    const result = await AIScienceService.recognizeText(imageBase64);
    res.json(result);
  } catch (error) {
    console.error('OCR识别错误:', error);
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

// ==================== AI科普问答 ====================

/**
 * AI科普问答
 * POST /api/ai-science/qa
 */
router.post('/qa', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: '请输入问题' });
    }

    const result = await AIScienceService.aiScienceQA(question);
    res.json(result);
  } catch (error) {
    console.error('AI科普问答错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ==================== AI游乐场 ====================

/**
 * 图灵测试 - 获取AI回复
 * POST /api/ai-science/turing-test
 */
router.post('/turing-test', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: '请输入话题' });
    }

    const result = await AIScienceService.turingTestReply(topic);
    res.json(result);
  } catch (error) {
    console.error('图灵测试错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ==================== AI知识馆内容 ====================

/**
 * 获取AI历史时间线
 * GET /api/ai-science/history
 */
router.get('/history', (req, res) => {
  const aiHistory = [
    {
      year: 1950,
      title: '图灵测试',
      description: '艾伦·图灵提出了著名的"图灵测试"，用来判断机器是否具有智能。',
      icon: '🧠',
      detail: '图灵问：机器能思考吗？他设计了一个游戏：如果你和一台机器聊天，分不清对方是人还是机器，那这台机器就算有智能了。'
    },
    {
      year: 1956,
      title: 'AI诞生',
      description: '达特茅斯会议上，"人工智能"这个词正式诞生。',
      icon: '🎂',
      detail: '一群科学家在达特茅斯学院开会，他们相信机器可以像人一样思考，于是给这个研究领域起了个名字：Artificial Intelligence（人工智能）。'
    },
    {
      year: 1997,
      title: '深蓝战胜人类',
      description: 'IBM的深蓝计算机战胜了国际象棋世界冠军卡斯帕罗夫。',
      icon: '♟️',
      detail: '深蓝每秒能分析2亿个棋步，最终以3.5:2.5战胜了人类最强棋手。这是AI第一次在智力游戏上击败人类冠军。'
    },
    {
      year: 2011,
      title: 'Siri诞生',
      description: '苹果推出Siri，智能语音助手走进千家万户。',
      icon: '🎤',
      detail: '你可以对着手机说话，它能听懂你的意思并回答问题。这让普通人第一次亲密接触到AI技术。'
    },
    {
      year: 2016,
      title: 'AlphaGo震惊世界',
      description: 'AlphaGo以4:1战胜围棋世界冠军李世石。',
      icon: '⚫',
      detail: '围棋被认为是人类最复杂的棋类游戏，可能的棋步比宇宙中的原子还多。AlphaGo的胜利证明AI可以处理极其复杂的问题。'
    },
    {
      year: 2022,
      title: 'ChatGPT横空出世',
      description: 'OpenAI发布ChatGPT，掀起生成式AI革命。',
      icon: '💬',
      detail: 'ChatGPT能写文章、编程、回答问题，两个月内用户突破1亿。AI不再只是专家的工具，每个人都可以和AI对话。'
    },
    {
      year: 2024,
      title: 'AI多模态时代',
      description: 'AI可以同时理解文字、图片、声音和视频。',
      icon: '🌈',
      detail: '现在的AI不仅能聊天，还能画画、作曲、剪视频。AI正在成为人类创作的得力助手。'
    }
  ];

  res.json({ success: true, data: aiHistory });
});

/**
 * 获取AI名人堂
 * GET /api/ai-science/pioneers
 */
router.get('/pioneers', (req, res) => {
  const pioneers = [
    {
      name: '艾伦·图灵',
      nameEn: 'Alan Turing',
      country: '英国',
      years: '1912-1954',
      title: '人工智能之父',
      avatar: '👨‍🔬',
      contribution: '提出图灵测试，奠定了计算机科学和人工智能的理论基础。',
      quote: '机器能思考吗？'
    },
    {
      name: '约翰·麦卡锡',
      nameEn: 'John McCarthy',
      country: '美国',
      years: '1927-2011',
      title: 'AI命名者',
      avatar: '👨‍💻',
      contribution: '发明了"人工智能"这个词，创造了Lisp编程语言。',
      quote: '人工智能就是制造智能机器的科学。'
    },
    {
      name: '杰弗里·辛顿',
      nameEn: 'Geoffrey Hinton',
      country: '加拿大',
      years: '1947-',
      title: '深度学习之父',
      avatar: '🧓',
      contribution: '发明了反向传播算法，让神经网络能够学习。2024年获诺贝尔物理学奖。',
      quote: '神经网络就像大脑，通过练习变得更聪明。'
    },
    {
      name: '吴恩达',
      nameEn: 'Andrew Ng',
      country: '美国/中国',
      years: '1976-',
      title: 'AI教育家',
      avatar: '👨‍🏫',
      contribution: '创办Coursera，让全世界的人都能免费学习AI。',
      quote: 'AI是新的电力，将改变每一个行业。'
    },
    {
      name: '李飞飞',
      nameEn: 'Fei-Fei Li',
      country: '美国/中国',
      years: '1976-',
      title: 'AI视觉先驱',
      avatar: '👩‍🔬',
      contribution: '创建ImageNet数据集，推动了计算机视觉的发展。',
      quote: '我想让机器像人一样看世界。'
    }
  ];

  res.json({ success: true, data: pioneers });
});

/**
 * 获取AI应用案例
 * GET /api/ai-science/applications
 */
router.get('/applications', (req, res) => {
  const applications = [
    {
      category: '生活',
      icon: '🏠',
      items: [
        { name: '智能推荐', desc: '抖音、淘宝如何知道你喜欢什么', example: '分析你的浏览记录，预测你的喜好' },
        { name: '语音助手', desc: 'Siri、小爱同学如何听懂你的话', example: '语音转文字，理解意图，执行命令' },
        { name: '人脸识别', desc: '手机解锁、刷脸支付', example: '分析面部特征点，验证身份' }
      ]
    },
    {
      category: '医疗',
      icon: '🏥',
      items: [
        { name: '医学影像分析', desc: 'AI帮助医生看X光片、CT', example: '识别肿瘤、骨折等异常' },
        { name: '药物研发', desc: 'AI加速新药发现', example: '预测药物分子结构和效果' },
        { name: '健康监测', desc: '智能手表监测心率异常', example: '实时分析健康数据，预警疾病' }
      ]
    },
    {
      category: '教育',
      icon: '📚',
      items: [
        { name: '个性化学习', desc: 'AI根据你的水平推荐题目', example: '分析错题，推荐适合的练习' },
        { name: '作文批改', desc: 'AI帮你检查作文', example: '检查语法错误，提供修改建议' },
        { name: '智能答疑', desc: 'AI回答学习问题', example: '24小时在线的AI老师' }
      ]
    },
    {
      category: '艺术',
      icon: '🎨',
      items: [
        { name: 'AI绘画', desc: '输入文字，AI画出图片', example: 'Midjourney、Stable Diffusion' },
        { name: 'AI作曲', desc: 'AI创作音乐', example: '根据情绪生成旋律' },
        { name: 'AI写作', desc: 'AI帮你写诗、写故事', example: 'ChatGPT、文心一言' }
      ]
    },
    {
      category: '交通',
      icon: '🚗',
      items: [
        { name: '自动驾驶', desc: '汽车自己开', example: '识别道路、行人、交通信号' },
        { name: '路线规划', desc: '导航APP如何找最快路线', example: '分析实时路况，预测拥堵' },
        { name: '交通管理', desc: '智能红绿灯', example: '根据车流量自动调整信号时间' }
      ]
    }
  ];

  res.json({ success: true, data: applications });
});

/**
 * 获取AI原理讲解
 * GET /api/ai-science/principles
 */
router.get('/principles', (req, res) => {
  const principles = [
    {
      id: 'learning',
      title: 'AI如何学习？',
      icon: '📖',
      analogy: 'AI就像一个学生，通过大量做题来学习',
      steps: [
        { step: 1, desc: '给AI看大量的例子（比如1000张猫的图片）' },
        { step: 2, desc: 'AI尝试找出这些例子的共同特点' },
        { step: 3, desc: 'AI做错了，系统告诉它哪里错了' },
        { step: 4, desc: 'AI调整自己的判断标准' },
        { step: 5, desc: '重复这个过程，AI越来越准' }
      ],
      funFact: 'ChatGPT读过的文字比你一辈子能读的还多1000倍！'
    },
    {
      id: 'language',
      title: 'AI如何理解语言？',
      icon: '💬',
      analogy: 'AI把每个词变成一串数字，就像给词打分',
      steps: [
        { step: 1, desc: '把文字拆成一个个词（分词）' },
        { step: 2, desc: '每个词变成一串数字（词向量）' },
        { step: 3, desc: '分析词与词之间的关系' },
        { step: 4, desc: '预测下一个词应该是什么' },
        { step: 5, desc: '一个词一个词地生成回答' }
      ],
      funFact: '在AI眼里，"国王-男人+女人=女王"，数学很神奇吧！'
    },
    {
      id: 'image',
      title: 'AI如何生成图片？',
      icon: '🎨',
      analogy: 'AI就像一个画家，从模糊的草图一步步画清晰',
      steps: [
        { step: 1, desc: '从一张全是噪点的图片开始' },
        { step: 2, desc: '理解你输入的文字描述' },
        { step: 3, desc: '一点点去掉噪点，让图片变清晰' },
        { step: 4, desc: '确保图片符合你的描述' },
        { step: 5, desc: '最终生成一张清晰的图片' }
      ],
      funFact: '生成一张图片，AI要进行几十亿次计算！'
    },
    {
      id: 'limits',
      title: 'AI的局限性',
      icon: '⚠️',
      analogy: 'AI很强，但也会犯一些人类不会犯的错误',
      examples: [
        { title: '幻觉问题', desc: 'AI有时会一本正经地胡说八道，编造不存在的事实' },
        { title: '不懂常识', desc: 'AI可能不知道"水是湿的"这种基本常识' },
        { title: '容易被骗', desc: '给图片加一点噪点，AI可能就认错了' },
        { title: '没有真正理解', desc: 'AI是在模仿，不是真的理解意思' }
      ],
      funFact: 'AI曾把一张熊猫的图片认成了长臂猿，只因为加了一点人眼看不见的噪点！'
    }
  ];

  res.json({ success: true, data: principles });
});

/**
 * 情感分析
 * POST /api/ai-science/sentiment
 */
router.post('/sentiment', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: '文本内容不能为空' });
    }

    // 使用AI进行情感分析
    const prompt = `请对以下文本进行情感分析，返回JSON格式的结果。

文本内容：
${text}

请分析并返回以下JSON格式（只返回JSON，不要有其他文字）：
{
  "emotion": "positive/negative/neutral",
  "intensity": 75,
  "keywords": [
    {"word": "开心", "sentiment": "positive"},
    {"word": "压力", "sentiment": "negative"}
  ],
  "suggestion": "根据情感给出的心理建议"
}

要求：
1. emotion: 判断整体情感倾向（positive积极/negative消极/neutral中性）
2. intensity: 情感强度0-100
3. keywords: 提取3-5个情感关键词
4. suggestion: 给出温暖、专业的心理建议（50-100字）`;

    const result = await AIScienceService.chat(prompt);

    if (result.success) {
      try {
        // 尝试解析AI返回的JSON
        let analysisData = result.data.reply;
        
        // 提取JSON内容（如果AI返回了额外的文字）
        const jsonMatch = analysisData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = jsonMatch[0];
        }
        
        const parsedData = JSON.parse(analysisData);
        
        res.json({
          success: true,
          data: parsedData
        });
      } catch (parseError) {
        // 如果JSON解析失败，返回默认结构
        console.error('JSON解析失败:', parseError);
        res.json({
          success: true,
          data: {
            emotion: 'neutral',
            intensity: 50,
            keywords: [
              { word: '情绪', sentiment: 'neutral' }
            ],
            suggestion: result.data.reply
          }
        });
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('情感分析错误:', error);
    res.status(500).json({
      success: false,
      message: '情感分析失败，请稍后重试'
    });
  }
});

module.exports = router;
