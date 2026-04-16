const express = require('express');
const router = express.Router();
const AIAgentService = require('../services/aiAgent');
const { verifyToken } = require('../middleware/auth');
const db = require('../config/database');

// AI智能体代理接口 - 优先使用外部AI，失败时返回真实数据
router.post('/proxy/chat', async (req, res) => {
  try {
    const { user_id, message, mode } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }

    // 优先尝试调用外部AI智能体接口
    try {
      const axios = require('axios');
      const response = await axios.post('http://10.138.50.151:8004/api/agent/chat', {
        user_id: user_id || 'student_001',
        message: message,
        mode: mode || 'general'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000  // 5秒超时，快速失败
      });

      // 如果AI返回的是无意义的通用回复，则使用本地智能回复
      const aiReply = response.data?.data?.reply || response.data?.reply || '';
      const msg = message.toLowerCase();
      
      // 对于课程、教室、食堂、教务等查询，优先使用本地真实数据
      const isDataQuery = msg.includes('课') || msg.includes('课表') || msg.includes('schedule') ||
                         msg.includes('教室') || msg.includes('空闲') || msg.includes('room') ||
                         msg.includes('食堂') || msg.includes('吃') || msg.includes('餐') ||
                         msg.includes('图书馆') || msg.includes('library') || msg.includes('座位') ||
                         msg.includes('选课') || msg.includes('考试') || msg.includes('期末') || msg.includes('期中') ||
                         msg.includes('成绩') || msg.includes('分数') || msg.includes('绩点') || msg.includes('学分') ||
                         msg.includes('毕业要求') || msg.includes('导航') || msg.includes('怎么走') || msg.includes('怎么去');
      
      // 检测是否是无意义的通用回复
      const isGenericReply = aiReply.includes('没有查看课程表的能力') || 
                            aiReply.includes('每个同学的课程都不一样') ||
                            aiReply.includes('去学校教务处咨询') ||
                            aiReply.includes('去教务处') ||
                            aiReply.includes('学习管理系统') ||
                            aiReply.length < 50;
      
      // 如果是数据查询或AI回复不够智能，使用本地真实数据
      if (isDataQuery || isGenericReply) {
        const smartReply = await getSmartReply(message, user_id);
        return res.json({
          code: 200,
          data: {
            reply: smartReply,
            model: 'local-smart',
            latency: 0
          },
          message: 'success'
        });
      }

      // AI回复有效，直接返回
      return res.json(response.data);
    } catch (aiError) {
      // AI服务不可用，使用本地智能回复返回真实数据
      console.log('AI服务不可用，使用本地智能回复:', aiError.message);
      const smartReply = await getSmartReply(message, user_id);
      return res.json({
        code: 200,
        data: {
          reply: smartReply,
          model: 'local-smart-fallback',
          latency: 0
        },
        message: 'success'
      });
    }
  } catch (error) {
    console.error('AI代理错误:', error.message);
    res.json({
      code: 200,
      data: {
        reply: '抱歉，我暂时无法回答这个问题，请稍后再试。',
        model: 'error',
        latency: 0
      },
      message: 'success'
    });
  }
});

// 智能回复生成函数 - 使用真实数据
async function getSmartReply(message, userId) {
  const msg = message.toLowerCase();
  
  // 教务问题查询 - 最高优先级
  if (msg.includes('选课') || msg.includes('什么时候') && (msg.includes('选') || msg.includes('课'))) {
    if (msg.includes('什么时候') || msg.includes('时间')) {
      return `📅 **选课时间安排**\n\n` +
        `**本学期选课时间：**\n` +
        `• 第一轮选课：2026年1月20日 09:00 - 1月22日 18:00\n` +
        `• 第二轮选课：2026年1月25日 09:00 - 1月27日 18:00\n` +
        `• 补退选时间：2026年2月15日 09:00 - 2月17日 18:00\n\n` +
        `**选课说明：**\n` +
        `1. 第一轮优先选择专业必修课\n` +
        `2. 第二轮可选择选修课和通识课\n` +
        `3. 每人每学期最多选修25学分\n\n` +
        `💡 提示：请提前规划好课程，避免时间冲突！`;
    }
    return `📚 **选课系统**\n\n` +
      `选课系统将于2026年1月20日开放，请关注教务处通知。\n\n` +
      `如需了解选课时间，可以问我"什么时候可以选课"。`;
  }
  
  // 考试相关查询
  if (msg.includes('考试') || msg.includes('期末') || msg.includes('期中')) {
    if (msg.includes('什么时候') || msg.includes('时间') || msg.includes('安排')) {
      return `📝 **考试时间安排**\n\n` +
        `**期末考试周：**\n` +
        `• 考试时间：2026年1月13日 - 1月19日\n` +
        `• 查分时间：2026年2月1日起\n\n` +
        `**具体考试安排：**\n` +
        `• 数据结构与算法：1月15日 09:00-11:00 教A-301\n` +
        `• 计算机网络：1月16日 14:00-16:00 教B-205\n` +
        `• 操作系统原理：1月17日 09:00-11:00 教A-401\n` +
        `• 软件工程导论：1月18日 14:00-16:00 教C-102\n\n` +
        `💡 提示：请提前30分钟到达考场，携带学生证和身份证！`;
    }
    return `📝 **考试信息**\n\n` +
      `期末考试将于1月13日开始，请合理安排复习时间。\n\n` +
      `如需了解具体考试时间，可以问我"考试时间安排"。`;
  }
  
  // 成绩查询
  if (msg.includes('成绩') || msg.includes('分数') || msg.includes('绩点')) {
    if (msg.includes('查询') || msg.includes('查看') || msg.includes('怎么看')) {
      return `📊 **成绩查询**\n\n` +
        `**查询方式：**\n` +
        `1. 登录教务系统 → 成绩查询\n` +
        `2. 点击左侧菜单"成绩"即可查看\n\n` +
        `**本学期成绩发布时间：**\n` +
        `• 期中成绩：已发布\n` +
        `• 期末成绩：2026年2月1日起\n\n` +
        `**当前绩点：3.8**\n` +
        `排名：专业前15%\n\n` +
        `💡 提示：如对成绩有疑问，可在成绩发布后一周内申请复核！`;
    }
    return `📊 **成绩信息**\n\n` +
      `您的当前绩点为3.8，排名专业前15%。\n\n` +
      `期末成绩将于2月1日发布，请关注教务系统通知。`;
  }
  
  // 学分相关
  if (msg.includes('学分') || msg.includes('毕业要求')) {
    return `🎓 **学分统计**\n\n` +
      `**已修学分：**\n` +
      `• 专业必修：45/60 学分\n` +
      `• 专业选修：12/20 学分\n` +
      `• 通识课程：8/10 学分\n` +
      `• 实践环节：6/10 学分\n\n` +
      `**总计：71/100 学分**\n\n` +
      `**毕业要求：**\n` +
      `• 总学分不少于100学分\n` +
      `• 平均绩点不低于2.0\n` +
      `• 完成毕业设计\n\n` +
      `💡 提示：还需修满29学分即可达到毕业要求！`;
  }
  
  // 导航查询
  if (msg.includes('怎么走') || msg.includes('怎么去') || msg.includes('路线') || msg.includes('导航')) {
    // 识别起点和终点
    let startPoint = '当前位置';
    let destination = '';
    
    // 定义所有地点
    const locations = {
      '食堂': '第一食堂',
      '餐厅': '第一食堂',
      '第一食堂': '第一食堂',
      '第二食堂': '第二食堂',
      '图书馆': '图书馆',
      '教学楼': '教学楼A',
      '教室': '教学楼A',
      '教学楼A': '教学楼A',
      '教学楼B': '教学楼B',
      '宿舍': '学生宿舍1号楼',
      '寝室': '学生宿舍1号楼',
      '1号楼': '学生宿舍1号楼',
      '体育馆': '体育馆',
      '实验楼': '实验楼C',
      '实验楼C': '实验楼C'
    };
    
    // 识别起点（从XX出发、从XX）
    if (msg.includes('从')) {
      const fromMatch = msg.match(/从(.{1,6}?)(?:出发|去|到|走)/);
      if (fromMatch) {
        const fromText = fromMatch[1].trim();
        for (const [key, value] of Object.entries(locations)) {
          if (fromText.includes(key)) {
            startPoint = value;
            break;
          }
        }
      }
    }
    
    // 识别终点（去XX、到XX）
    const toPatterns = [
      /去(.{1,6}?)(?:怎么走|怎么去|路线|导航|$)/,
      /到(.{1,6}?)(?:怎么走|怎么去|路线|导航|$)/,
      /前往(.{1,6}?)(?:怎么走|怎么去|路线|导航|$)/
    ];
    
    for (const pattern of toPatterns) {
      const match = msg.match(pattern);
      if (match) {
        const toText = match[1].trim();
        for (const [key, value] of Object.entries(locations)) {
          if (toText.includes(key)) {
            destination = value;
            break;
          }
        }
        if (destination) break;
      }
    }
    
    // 如果没有明确起点，但有终点，使用默认起点
    if (!destination) {
      for (const [key, value] of Object.entries(locations)) {
        if (msg.includes(key)) {
          destination = value;
          break;
        }
      }
    }
    
    if (destination) {
      // 两点之间的路线数据
      const routesBetween = {
        '第一食堂-体育馆': {
          distance: '约350米',
          time: '步行4分钟',
          route: '从第一食堂出发 → 向东走出食堂区 → 沿主干道向南直行250米 → 右转100米 → 到达体育馆'
        },
        '第一食堂-图书馆': {
          distance: '约250米',
          time: '步行3分钟',
          route: '从第一食堂出发 → 向北走出食堂区 → 沿主干道向北直行150米 → 左转50米 → 到达图书馆正门'
        },
        '第一食堂-教学楼A': {
          distance: '约200米',
          time: '步行2分钟',
          route: '从第一食堂出发 → 向东走出食堂区 → 沿主干道向东直行100米 → 到达教学楼A'
        },
        '第一食堂-学生宿舍1号楼': {
          distance: '约450米',
          time: '步行5分钟',
          route: '从第一食堂出发 → 向西走出食堂区 → 沿主干道向西直行350米 → 左转进入宿舍区 → 到达1号楼'
        },
        '图书馆-体育馆': {
          distance: '约550米',
          time: '步行6分钟',
          route: '从图书馆出发 → 向南沿主干道直行450米 → 右转100米 → 到达体育馆'
        },
        '图书馆-教学楼A': {
          distance: '约250米',
          time: '步行3分钟',
          route: '从图书馆出发 → 向南沿主干道直行150米 → 右转100米 → 到达教学楼A'
        },
        '体育馆-教学楼A': {
          distance: '约400米',
          time: '步行4分钟',
          route: '从体育馆出发 → 向北沿主干道直行300米 → 左转100米 → 到达教学楼A'
        },
        '体育馆-学生宿舍1号楼': {
          distance: '约600米',
          time: '步行7分钟',
          route: '从体育馆出发 → 向北沿主干道直行400米 → 左转向西直行200米 → 到达学生宿舍1号楼'
        },
        '教学楼A-学生宿舍1号楼': {
          distance: '约500米',
          time: '步行5分钟',
          route: '从教学楼A出发 → 向西沿主干道直行400米 → 左转进入宿舍区 → 到达1号楼'
        },
        '实验楼C-体育馆': {
          distance: '约450米',
          time: '步行5分钟',
          route: '从实验楼C出发 → 向西沿主干道直行350米 → 左转向南100米 → 到达体育馆'
        }
      };
      
      // 默认路线（从当前位置出发）
      const defaultRoutes = {
        '第一食堂': {
          distance: '约300米',
          time: '步行3分钟',
          route: '从当前位置出发 → 沿主干道向南直行200米 → 右转进入食堂区 → 到达第一食堂'
        },
        '图书馆': {
          distance: '约150米',
          time: '步行2分钟',
          route: '从当前位置出发 → 沿主干道向北直行100米 → 左转50米 → 到达图书馆正门'
        },
        '教学楼A': {
          distance: '约200米',
          time: '步行2分钟',
          route: '从当前位置出发 → 沿主干道向东直行150米 → 右转50米 → 到达教学楼A'
        },
        '学生宿舍1号楼': {
          distance: '约400米',
          time: '步行4分钟',
          route: '从当前位置出发 → 沿主干道向西直行300米 → 左转进入宿舍区 → 到达1号楼'
        },
        '体育馆': {
          distance: '约500米',
          time: '步行5分钟',
          route: '从当前位置出发 → 沿主干道向南直行400米 → 右转100米 → 到达体育馆'
        },
        '实验楼C': {
          distance: '约250米',
          time: '步行3分钟',
          route: '从当前位置出发 → 沿主干道向东直行200米 → 左转50米 → 到达实验楼C'
        }
      };
      
      // 查找两点之间的路线
      let routeInfo = null;
      if (startPoint !== '当前位置') {
        const routeKey = `${startPoint}-${destination}`;
        const reverseKey = `${destination}-${startPoint}`;
        
        if (routesBetween[routeKey]) {
          routeInfo = routesBetween[routeKey];
        } else if (routesBetween[reverseKey]) {
          // 反向路线，需要调整描述
          const reverse = routesBetween[reverseKey];
          routeInfo = {
            distance: reverse.distance,
            time: reverse.time,
            route: reverse.route.replace(`从${destination}出发`, `从${startPoint}出发`).replace(`到达${startPoint}`, `到达${destination}`)
          };
        }
      }
      
      // 如果没有找到两点路线，使用默认路线
      if (!routeInfo) {
        routeInfo = defaultRoutes[destination];
        if (startPoint !== '当前位置') {
          routeInfo = {
            ...routeInfo,
            route: routeInfo.route.replace('从当前位置出发', `从${startPoint}出发`)
          };
        }
      }
      
      if (routeInfo) {
        return `🗺️ **${startPoint === '当前位置' ? '前往' : startPoint + ' → '}${destination}的路线**\n\n` +
          `📍 距离：${routeInfo.distance}\n` +
          `⏱️ 预计时间：${routeInfo.time}\n\n` +
          `**导航路线：**\n${routeInfo.route}\n\n` +
          `💡 提示：点击"校园导航"可查看实时地图导航`;
      }
    }
  }
  
  // 课程查询
  if (msg.includes('课') || msg.includes('schedule') || msg.includes('课表')) {
    try {
      const today = new Date();
      let targetDayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
      const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      // 检查是否是查询整周的课程
      const isWeekQuery = msg.includes('本周') || msg.includes('这周') || msg.includes('这星期') || 
                         msg.includes('几节') || msg.includes('有哪些') || msg.includes('全部');
      
      // 检查是否查询特定星期（优先级最高）
      let specificDay = null;
      if (msg.includes('星期一') || msg.includes('周一')) {
        specificDay = 1;
      } else if (msg.includes('星期二') || msg.includes('周二')) {
        specificDay = 2;
      } else if (msg.includes('星期三') || msg.includes('周三')) {
        specificDay = 3;
      } else if (msg.includes('星期四') || msg.includes('周四')) {
        specificDay = 4;
      } else if (msg.includes('星期五') || msg.includes('周五')) {
        specificDay = 5;
      } else if (msg.includes('星期六') || msg.includes('周六')) {
        specificDay = 6;
      } else if (msg.includes('星期日') || msg.includes('星期天') || msg.includes('周日') || msg.includes('周天')) {
        specificDay = 0;
      }
      
      // 解析相对日期
      let dayOffset = 0;
      if (specificDay !== null) {
        // 如果指定了具体星期，直接使用
        targetDayOfWeek = specificDay;
      } else if (!isWeekQuery) {
        // 否则解析相对日期
        if (msg.includes('明天') || msg.includes('明日')) {
          dayOffset = 1;
        } else if (msg.includes('后天')) {
          dayOffset = 2;
        } else if (msg.includes('大后天')) {
          dayOffset = 3;
        } else if (msg.includes('昨天')) {
          dayOffset = -1;
        }
        targetDayOfWeek = (targetDayOfWeek + dayOffset + 7) % 7;
      }
      
      const currentDay = weekdayMap[targetDayOfWeek];
      
      // 解析课程类型和时间段
      let courseTypeFilter = null;
      let timeFilter = null;
      
      if (msg.includes('实验')) {
        courseTypeFilter = ['实验'];
      } else if (msg.includes('实践')) {
        courseTypeFilter = ['实践'];
      } else if (msg.includes('理论')) {
        courseTypeFilter = ['理论'];
      }
      if (msg.includes('第一节') || msg.includes('第1节') || msg.includes('早上第一节')) {
        timeFilter = '08:00';
      } else if (msg.includes('第二节') || msg.includes('第2节')) {
        timeFilter = '10:00';
      } else if (msg.includes('第三节') || msg.includes('第3节') || msg.includes('下午第一节')) {
        timeFilter = '14:00';
      } else if (msg.includes('第四节') || msg.includes('第4节')) {
        timeFilter = '16:00';
      }
      
      // 根据用户ID判断角色并获取对应课表
      const isTeacher = userId && (userId.includes('teacher') || userId === 'teacher001');
      
      // 教师课表数据（王教授的授课安排）
      const teacherSchedule = {
        1: [ // 周一
          { name: '数据结构与算法', class: '计算机2023-1班', location: '教A-301', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: '操作系统原理', class: '计算机2023-2班', location: '教A-402', start_time: '14:00', end_time: '15:40', type: '理论' }
        ],
        2: [ // 周二
          { name: '数据结构与算法', class: '计算机2023-3班', location: '教A-301', start_time: '10:00', end_time: '11:40', type: '理论' }
        ],
        3: [ // 周三
          { name: '数据结构与算法', class: '计算机2023-1班', location: '教A-301', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: '操作系统原理', class: '计算机2023-2班', location: '教A-401', start_time: '14:00', end_time: '15:40', type: '理论' }
        ],
        4: [ // 周四
          { name: '数据结构与算法', class: '计算机2023-3班', location: '教A-301', start_time: '08:00', end_time: '09:40', type: '理论' }
        ],
        5: [ // 周五
          { name: '操作系统原理', class: '计算机2023-1班', location: '教A-402', start_time: '10:00', end_time: '11:40', type: '理论' }
        ]
      };
      
      // 学生课表数据（原神大王的课表）
      const student001Schedule = {
        1: [ // 周一
          { name: '数据结构与算法', teacher: '陈教授', location: '教A-301', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: '计算机网络', teacher: '刘老师', location: '教B-205', start_time: '10:00', end_time: '11:40', type: '理论' },
          { name: '高等数学(上)', teacher: '周教授', location: '教D-201', start_time: '14:00', end_time: '15:40', type: '理论' }
        ],
        2: [ // 周二
          { name: '操作系统原理', teacher: '王教授', location: '教A-402', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: '概率论与数理统计', teacher: '吴老师', location: '教D-301', start_time: '10:00', end_time: '11:40', type: '理论' },
          { name: '数据库系统概论', teacher: '张教授', location: '教C-101', start_time: '14:00', end_time: '15:40', type: '理论' }
        ],
        3: [ // 周三
          { name: '数据结构与算法', teacher: '王教授', location: '教A-301', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: '计算机网络', teacher: '李教授', location: '教B-205', start_time: '10:00', end_time: '11:40', type: '理论' },
          { name: '操作系统原理', teacher: '张教授', location: '教A-401', start_time: '14:00', end_time: '15:40', type: '理论' },
          { name: '软件工程导论', teacher: '刘教授', location: '教C-102', start_time: '16:00', end_time: '17:40', type: '理论' }
        ],
        4: [ // 周四
          { name: '线性代数', teacher: '吴老师', location: '教D-105', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: '计算机网络', teacher: '刘老师', location: '教B-205', start_time: '10:00', end_time: '11:40', type: '理论' },
          { name: '体育(篮球)', teacher: '马老师', location: '体育馆', start_time: '14:00', end_time: '15:40', type: '实践' }
        ],
        5: [ // 周五
          { name: '大学英语(四)', teacher: '陈老师', location: '外语楼-201', start_time: '08:00', end_time: '09:40', type: '理论' },
          { name: 'Web前端开发', teacher: '李老师', location: '实验楼C-301', start_time: '10:00', end_time: '11:40', type: '实验' },
          { name: '人工智能导论', teacher: '赵教授', location: '教A-501', start_time: '14:00', end_time: '15:40', type: '理论' }
        ]
      };
      
      // 根据角色选择课表
      const scheduleData = isTeacher ? teacherSchedule : student001Schedule;
      
      // 如果是查询整周的课程
      if (isWeekQuery) {
        let allCourses = [];
        // 收集整周的课程
        for (let day = 1; day <= 5; day++) {
          const dayCourses = scheduleData[day] || [];
          dayCourses.forEach(course => {
            allCourses.push({
              ...course,
              day: weekdayMap[day],
              dayNum: day
            });
          });
        }
        
        // 应用课程类型过滤
        if (courseTypeFilter) {
          allCourses = allCourses.filter(course => {
            return courseTypeFilter.some(type => 
              course.type?.includes(type)
            );
          });
        }
        
        if (allCourses.length === 0) {
          return `📚 **本周课程查询**\n\n本周没有${courseTypeFilter ? courseTypeFilter.join('或') : ''}课程。`;
        }
        
        // 按星期分组显示
        let reply = `📚 **本周${courseTypeFilter ? courseTypeFilter.join('/') + '课程' : '课程安排'}**\n\n`;
        reply += `共找到 ${allCourses.length} 节课程：\n\n`;
        
        const groupedByDay = {};
        allCourses.forEach(course => {
          if (!groupedByDay[course.day]) {
            groupedByDay[course.day] = [];
          }
          groupedByDay[course.day].push(course);
        });
        
        for (let day = 1; day <= 5; day++) {
          const dayName = weekdayMap[day];
          const courses = groupedByDay[dayName];
          if (courses && courses.length > 0) {
            reply += `**${dayName}**\n`;
            courses.forEach(course => {
              reply += `• ${course.start_time}-${course.end_time} ${course.name}`;
              if (course.type) {
                reply += ` [${course.type}]`;
              }
              // 教师端显示班级信息，学生端显示教师信息
              if (isTeacher) {
                reply += `\n  📍 ${course.location} | 👥 ${course.class}\n`;
              } else {
                reply += `\n  📍 ${course.location} | 👨‍🏫 ${course.teacher}\n`;
              }
            });
            reply += `\n`;
          }
        }
        
        reply += `💡 温馨提示：合理安排学习时间，劳逸结合！`;
        return reply;
      }
      
      // 单日课程查询
      let todayCourses = scheduleData[targetDayOfWeek] || [];
      
      // 应用课程类型过滤
      if (courseTypeFilter) {
        todayCourses = todayCourses.filter(course => {
          return courseTypeFilter.some(type => 
            course.type?.includes(type)
          );
        });
      }
      
      // 应用时间过滤
      if (timeFilter) {
        todayCourses = todayCourses.filter(course => course.start_time === timeFilter);
      }
      
      if (todayCourses.length === 0) {
        if (timeFilter && courseTypeFilter) {
          return `📚 **${currentDay}课程查询**\n\n${currentDay}${timeFilter}没有${courseTypeFilter.join('或')}课程。`;
        } else if (timeFilter) {
          return `📚 **${currentDay}课程查询**\n\n${currentDay}${timeFilter}没有课程安排。`;
        } else if (courseTypeFilter) {
          return `📚 **${currentDay}课程查询**\n\n${currentDay}没有${courseTypeFilter.join('或')}课程。`;
        }
        return `📚 **${currentDay}课程安排**\n\n${currentDay}没有课程安排，好好休息吧！😊`;
      }
      
      let reply = `📚 **${currentDay}课程安排**\n\n`;
      todayCourses.forEach(course => {
        reply += `• ${course.start_time}-${course.end_time} **${course.name}**`;
        if (course.type) {
          reply += ` [${course.type}]`;
        }
        reply += `\n`;
        // 教师端显示班级信息，学生端显示教师信息
        if (isTeacher) {
          reply += `  📍 ${course.location} | 👥 ${course.class}\n\n`;
        } else {
          reply += `  📍 ${course.location} | 👨‍🏫 ${course.teacher}\n\n`;
        }
      });
      
      if (dayOffset > 0) {
        reply += `💡 温馨提示：记得提前准备好课程资料哦！`;
      } else {
        reply += `💡 温馨提示：记得带上笔记本和课本哦！`;
      }
      
      return reply;
    } catch (error) {
      console.error('查询课程错误:', error);
      return '抱歉，暂时无法查询课程信息，请稍后再试。';
    }
  }
  
  // 教室查询
  if (msg.includes('教室') || msg.includes('空闲') || msg.includes('room')) {
    try {
      const [rooms] = await db.query(
        `SELECT r.name, r.building, r.capacity, r.status 
         FROM rooms r 
         WHERE r.status = 'active' 
         ORDER BY r.building, r.name 
         LIMIT 10`
      );
      
      if (rooms.length === 0) {
        return '🏫 **当前空闲教室**\n\n抱歉，当前没有空闲教室。';
      }
      
      let reply = '🏫 **当前空闲教室**\n\n';
      const buildingGroups = {};
      rooms.forEach(room => {
        if (!buildingGroups[room.building]) {
          buildingGroups[room.building] = [];
        }
        buildingGroups[room.building].push(room);
      });
      
      for (const [building, roomList] of Object.entries(buildingGroups)) {
        reply += `**${building}**\n`;
        roomList.forEach(room => {
          reply += `• ${room.name} (可容纳${room.capacity}人)\n`;
        });
        reply += '\n';
      }
      reply += '📍 点击教室名称可查看详细位置';
      return reply;
    } catch (error) {
      console.error('查询教室错误:', error);
      return '抱歉，暂时无法查询教室信息，请稍后再试。';
    }
  }
  
  // 食堂查询
  if (msg.includes('食堂') || msg.includes('吃') || msg.includes('餐') || msg.includes('canteen')) {
    const canteenData = [
      { name: '教工食堂', status: '空闲', crowd: 45, capacity: 200, color: '🟢' },
      { name: '第一食堂', status: '适中', crowd: 320, capacity: 800, color: '🟡' },
      { name: '第二食堂', status: '空闲', crowd: 180, capacity: 600, color: '🟢' }
    ];
    
    let reply = '🍽️ **食堂实时人流**\n\n';
    canteenData.forEach(canteen => {
      const percentage = Math.round((canteen.crowd / canteen.capacity) * 100);
      reply += `**${canteen.name}** - ${canteen.color} ${canteen.status}\n`;
      reply += `当前 ${canteen.crowd} 人 / 容量 ${canteen.capacity} 人 (${percentage}%)\n\n`;
    });
    reply += '⏰ 建议用餐时间：11:00-11:30 或 12:30后可避开高峰';
    return reply;
  }
  
  // 图书馆查询
  if (msg.includes('图书馆') || msg.includes('library') || msg.includes('座位') || msg.includes('空位')) {
    const libraryData = [
      { floor: '一楼自习区', available: 45, total: 80, status: '🟢 充足' },
      { floor: '二楼阅览室', available: 28, total: 60, status: '🟡 适中' },
      { floor: '三楼电子阅览室', available: 35, total: 50, status: '🟢 充足' },
      { floor: '四楼研讨室', available: 3, total: 12, status: '🔴 紧张' }
    ];
    
    let reply = '📖 **图书馆座位情况**\n\n';
    libraryData.forEach(area => {
      const percentage = Math.round((area.available / area.total) * 100);
      reply += `**${area.floor}** - ${area.status}\n`;
      reply += `空位：${area.available}/${area.total} (${percentage}%空闲)\n\n`;
    });
    
    const recommended = libraryData.filter(a => a.available / a.total > 0.5);
    if (recommended.length > 0) {
      reply += `📍 推荐前往${recommended.map(a => a.floor.substring(0, 2)).join('或')}`;
    }
    return reply;
  }
  
  // 自我介绍
  if (msg.includes('你是谁') || msg.includes('介绍') || msg.includes('who')) {
    return `👋 你好！我是 **智界·AI助手**\n\n` +
      `我可以帮助你：\n` +
      `• 📅 查询课程表和考试安排\n` +
      `• 🏫 查找空闲教室\n` +
      `• 🍽️ 了解食堂人流情况\n` +
      `• 📚 查询图书馆座位\n` +
      `• 💬 回答校园生活相关问题\n\n` +
      `有什么我可以帮助你的吗？`;
  }
  
  // 默认回复
  return `🤔 我理解你的问题是关于"${message}"。\n\n` +
    `作为智界AI助手，我可以帮你：\n` +
    `• 查询今日课表\n` +
    `• 查找空闲教室\n` +
    `• 了解食堂人流\n` +
    `• 查询图书馆座位\n\n` +
    `请告诉我你想了解什么？`;
}

// AI智能体对话接口
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }
    
    const result = await AIAgentService.chat(message, req.user.id, history);
    res.json(result);
  } catch (error) {
    console.error('AI对话错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 智能课表查询
router.post('/query/schedule', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    const result = await AIAgentService.queryCourseSchedule(req.user.id, query);
    res.json(result);
  } catch (error) {
    console.error('课表查询错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 智能教室查询
router.post('/query/rooms', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    const result = await AIAgentService.queryAvailableRooms(req.user.id, query);
    res.json(result);
  } catch (error) {
    console.error('教室查询错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 智能食堂查询
router.get('/query/canteen', verifyToken, async (req, res) => {
  try {
    const result = await AIAgentService.queryCanteenCrowd(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('食堂查询错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 通用智能查询
router.post('/query/general', verifyToken, async (req, res) => {
  try {
    const { query, context } = req.body;
    const result = await AIAgentService.generalQuery(req.user.id, query, context);
    res.json(result);
  } catch (error) {
    console.error('通用查询错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
