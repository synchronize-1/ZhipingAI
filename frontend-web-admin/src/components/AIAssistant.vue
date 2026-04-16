<template>
  <div class="ai-assistant-wrapper">
    <!-- 悬浮按钮 -->
    <div 
      class="ai-float-btn"
      :class="{ 'is-open': isOpen }"
      @click="toggleChat"
    >
      <div class="btn-inner">
        <img 
          v-if="!isOpen" 
          src="https://img.icons8.com/3d-fluency/94/robot-2.png" 
          alt="AI助手"
          class="ai-icon"
        />
        <el-icon v-else :size="28"><Close /></el-icon>
      </div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring delay"></div>
    </div>

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="ai-chat-panel">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-left">
            <div class="ai-avatar">
              <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
            </div>
            <div class="header-info">
              <h3>智界·AI助手</h3>
              <span class="status-dot"></span>
              <span class="status-text">在线</span>
            </div>
          </div>
          <div class="header-actions">
            <el-tooltip content="清空对话" placement="top">
              <el-button circle size="small" @click="clearHistory">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="最小化" placement="top">
              <el-button circle size="small" @click="toggleChat">
                <el-icon><Minus /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 快捷功能 -->
        <div class="quick-actions">
          <div 
            v-for="action in quickActions" 
            :key="action.text"
            class="quick-action-item"
            @click="sendQuickMessage(action.query)"
          >
            <el-icon :size="16"><component :is="action.icon" /></el-icon>
            <span>{{ action.text }}</span>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="messagesContainer">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="welcome-section">
            <div class="welcome-avatar">
              <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
            </div>
            <h3>你好，{{ userName }}！</h3>
            <p>我是智界·AI助手，可以帮你查询课表、教室、食堂人流等信息，也可以回答你的问题。</p>
            <div class="welcome-suggestions">
              <div 
                v-for="suggestion in welcomeSuggestions" 
                :key="suggestion"
                class="suggestion-chip"
                @click="sendQuickMessage(suggestion)"
              >
                {{ suggestion }}
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <template v-for="(msg, index) in messages" :key="index">
            <div class="message-item" :class="msg.role">
              <div class="message-avatar">
                <img 
                  v-if="msg.role === 'assistant'" 
                  src="https://img.icons8.com/3d-fluency/94/robot-2.png" 
                  alt="AI" 
                />
                <el-avatar v-else :size="36" :src="userAvatar">
                  {{ userName?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-bubble" v-html="formatMessage(msg.content)"></div>
                <div class="message-time">{{ msg.time }}</div>
              </div>
            </div>
            <!-- 联想追问建议 - 仅在AI回复后显示 -->
            <div v-if="msg.role === 'assistant' && msg.followUpSuggestions?.length" class="follow-up-section">
              <div class="follow-up-label">
                <el-icon><QuestionFilled /></el-icon>
                <span>你可能还想问：</span>
              </div>
              <div class="follow-up-suggestions">
                <div 
                  v-for="suggestion in msg.followUpSuggestions" 
                  :key="suggestion"
                  class="follow-up-chip"
                  @click="sendQuickMessage(suggestion)"
                >
                  {{ suggestion }}
                </div>
              </div>
            </div>
          </template>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="message-item assistant">
            <div class="message-avatar">
              <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
            </div>
            <div class="message-content">
              <div class="message-bubble typing">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              placeholder="输入你的问题..."
              :disabled="isLoading"
              @keyup.enter="sendMessage"
            >
              <template #prefix>
                <el-icon class="input-icon"><ChatDotRound /></el-icon>
              </template>
            </el-input>
            <el-button 
              type="primary" 
              :icon="Promotion"
              :loading="isLoading"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
              class="send-btn"
            >
              发送
            </el-button>
          </div>
          <div class="input-tips">
            <span>按 Enter 发送 · 支持查询课表、教室、食堂等信息</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { Close, Delete, Minus, ChatDotRound, Promotion, Calendar, OfficeBuilding, Bowl, Reading, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const isOpen = ref(false)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const messagesContainer = ref(null)

const userName = computed(() => userStore.user?.name || '同学')
const userAvatar = computed(() => {
  const avatar = userStore.user?.avatar
  if (!avatar) return ''
  if (avatar.startsWith('http')) return avatar
  return `http://localhost:3000${avatar}`
})

// 快捷功能
const quickActions = [
  { icon: 'Calendar', text: '今日课表', query: '今天有什么课？' },
  { icon: 'OfficeBuilding', text: '空闲教室', query: '现在哪些教室是空闲的？' },
  { icon: 'Bowl', text: '食堂人流', query: '现在食堂人多吗？' },
  { icon: 'Reading', text: '图书馆', query: '图书馆现在有多少空位？' }
]

// 欢迎建议
const welcomeSuggestions = [
  '今天有什么课？',
  '明天第一节课是什么？',
  '哪个教室现在有空？',
  '食堂哪个窗口人少？'
]

// 智能生成追问 - 根据AI回复内容动态生成相关问题
const generateFollowUpSuggestions = (userMessage, aiReply) => {
  const suggestions = []
  const reply = aiReply.toLowerCase()
  const msg = userMessage.toLowerCase()
  
  // 1. 数学计算类 - 提取数字和运算，生成相关计算问题
  if (reply.match(/\d+/) && (reply.includes('等于') || reply.includes('答案') || reply.includes('结果') || msg.match(/[\+\-\*\/\=]/))) {
    const numbers = reply.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      const num = parseInt(numbers[0])
      suggestions.push(`${num}的2倍是多少？`)
      suggestions.push(`${num}加上50等于多少？`)
      if (num > 10) {
        suggestions.push(`${num}的平方根是多少？`)
      }
    }
    // 如果没有提取到数字，给通用数学问题
    if (suggestions.length === 0) {
      suggestions.push('帮我算一下 123+456')
      suggestions.push('50的平方是多少？')
    }
  }
  
  // 2. 课程相关 - 提取课程名称和时间
  else if (reply.includes('课') || reply.includes('课程') || reply.includes('课表')) {
    // 提取课程名称
    const courseMatch = reply.match(/《(.+?)》|【(.+?)】|「(.+?)」/)
    if (courseMatch) {
      const courseName = courseMatch[1] || courseMatch[2] || courseMatch[3]
      suggestions.push(`${courseName}的老师是谁？`)
      suggestions.push(`${courseName}在哪个教室上？`)
      suggestions.push(`${courseName}的考试时间是什么时候？`)
    } else {
      // 提取时间相关
      if (reply.includes('今天') || reply.includes('今日')) {
        suggestions.push('明天有什么课？')
        suggestions.push('这周还有哪些课？')
      } else if (reply.includes('明天')) {
        suggestions.push('后天有什么课？')
        suggestions.push('这周的课程表')
      } else {
        suggestions.push('今天有什么课？')
        suggestions.push('明天第一节是什么课？')
      }
      suggestions.push('本周有几节实验课？')
    }
  }
  
  // 3. 教室相关 - 提取教室编号和楼栋
  else if (reply.includes('教室') || reply.includes('空闲')) {
    // 提取教室编号 A-201, B-305等
    const roomMatch = reply.match(/([A-Z])-?(\d{3})/g)
    if (roomMatch && roomMatch.length > 0) {
      const building = roomMatch[0].charAt(0)
      suggestions.push(`${building}楼还有哪些空教室？`)
      suggestions.push(`${roomMatch[0]}教室能容纳多少人？`)
      suggestions.push(`下午${building}楼哪些教室会空出来？`)
    } else {
      suggestions.push('教学楼A有哪些空教室？')
      suggestions.push('能容纳50人以上的教室有哪些？')
      suggestions.push('实验室现在可以用吗？')
    }
  }
  
  // 4. 食堂相关 - 提取楼层和窗口信息
  else if (reply.includes('食堂') || reply.includes('餐') || reply.includes('窗口')) {
    // 提取楼层
    const floorMatch = reply.match(/([一二三四五])楼|([1-5])楼/)
    if (floorMatch) {
      const floor = floorMatch[1] || floorMatch[2]
      suggestions.push(`${floor}楼食堂有什么特色菜？`)
      suggestions.push(`${floor}楼哪个窗口人最少？`)
    } else {
      suggestions.push('哪个食堂人最少？')
      suggestions.push('今天有什么特色菜推荐？')
    }
    // 提取窗口号
    const windowMatch = reply.match(/(\d+)号窗口/)
    if (windowMatch) {
      suggestions.push(`${windowMatch[1]}号窗口有什么菜？`)
    }
    suggestions.push('晚餐时间人流预测')
  }
  
  // 5. 图书馆相关 - 提取楼层和区域
  else if (reply.includes('图书馆') || reply.includes('座位') || reply.includes('空位')) {
    // 提取楼层
    const floorMatch = reply.match(/([一二三四五])楼|([1-5])楼/)
    if (floorMatch) {
      const floor = floorMatch[1] || floorMatch[2]
      suggestions.push(`${floor}楼还有多少空位？`)
      suggestions.push(`${floor}楼的研讨室怎么预约？`)
    } else {
      suggestions.push('哪一层空位最多？')
      suggestions.push('研讨室怎么预约？')
    }
    // 提取区域
    if (reply.includes('自习')) {
      suggestions.push('阅览室有空位吗？')
    } else if (reply.includes('阅览')) {
      suggestions.push('自习区有空位吗？')
    }
    suggestions.push('图书馆几点关门？')
  }
  
  // 6. 助手介绍 - 引导功能使用
  else if (reply.includes('我是') || reply.includes('助手') || reply.includes('帮助')) {
    suggestions.push('查询今天的课程表')
    suggestions.push('找一个空闲教室')
    suggestions.push('看看食堂人多不多')
    suggestions.push('图书馆座位情况')
  }
  
  // 7. 默认 - 引导使用核心功能
  else {
    suggestions.push('今天有什么课？')
    suggestions.push('现在哪些教室空闲？')
    suggestions.push('食堂人多吗？')
    suggestions.push('图书馆有空位吗？')
  }
  
  // 确保返回4个建议，不足则补充通用问题
  while (suggestions.length < 4) {
    const generic = ['查看本周课表', '预约研讨室', '查询考试安排', '校园活动推荐']
    suggestions.push(generic[suggestions.length % generic.length])
  }
  
  // 只返回前4个
  return suggestions.slice(0, 4)
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const clearHistory = () => {
  messages.value = []
  ElMessage.success('对话已清空')
}

const formatMessage = (text) => {
  // 移除LaTeX数学公式标记，转换为普通文本
  let formatted = text
    .replace(/\\\[/g, '')  // 移除 \[
    .replace(/\\\]/g, '')  // 移除 \]
    .replace(/\\\(/g, '')  // 移除 \(
    .replace(/\\\)/g, '')  // 移除 \)
    .replace(/\n/g, '<br>') // 换行转换
  return formatted
}

const getCurrentTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendQuickMessage = (query) => {
  inputMessage.value = query
  sendMessage()
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    time: getCurrentTime()
  })
  
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const userRole = userStore.user?.role
    
    // 提取当前页面的上下文信息
    const pageContext = {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title
    }
    
    // 如果在课表页面，尝试提取课表信息
    let scheduleData = null
    if (pageContext.path.includes('schedule')) {
      // 从页面中查找学生信息（更可靠的方法）
      const pageText = document.body.innerText
      const studentMatch = pageText.match(/([\u4e00-\u9fa5]{2,4})\s*\((\d{10,})\)/)
      
      if (studentMatch) {
        pageContext.studentName = studentMatch[1]
        pageContext.studentId = studentMatch[2]
      }
      
      // 提取详细的课表信息，包含星期几的信息
      const courseCards = document.querySelectorAll('.course-card')
      if (courseCards.length > 0 && pageContext.studentName) {
        const coursesWithDay = []
        
        courseCards.forEach(card => {
          const courseName = card.querySelector('.course-name')?.textContent?.trim()
          const courseRoom = card.querySelector('.course-room')?.textContent?.trim()
          const courseTeacher = card.querySelector('.course-teacher')?.textContent?.trim()
          
          if (courseName) {
            // 找到课程所在的列（星期几）
            const cell = card.closest('.course-cell')
            if (cell) {
              const cellIndex = Array.from(cell.parentElement.children).indexOf(cell)
              const dayHeaders = document.querySelectorAll('.day-header')
              const dayName = dayHeaders[cellIndex - 1]?.querySelector('.day-name')?.textContent?.trim()
              
              coursesWithDay.push({
                name: courseName,
                room: courseRoom,
                teacher: courseTeacher,
                day: dayName || ''
              })
            }
          }
        })
        
        if (coursesWithDay.length > 0) {
          scheduleData = {
            studentName: pageContext.studentName,
            studentId: pageContext.studentId,
            courses: coursesWithDay,
            courseCount: coursesWithDay.length
          }
          
          pageContext.hasScheduleData = true
          pageContext.scheduleDetails = coursesWithDay.map(c => 
            `${c.day} ${c.name} ${c.room} ${c.teacher}`
          ).join(' | ')
          pageContext.courseCount = coursesWithDay.length
        }
      }
    }
    
    // 前端智能处理课表查询
    const isCourseQuery = message.includes('课') || message.includes('课程') || message.includes('课表') || message.includes('上课')
    if (isCourseQuery && scheduleData && pageContext.path.includes('schedule')) {
      // 获取今天是星期几
      const today = new Date()
      const dayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const todayName = dayMap[today.getDay()]
      const tomorrowName = dayMap[(today.getDay() + 1) % 7]
      const yesterdayName = dayMap[(today.getDay() - 1 + 7) % 7]
      
      // 检查是否询问特定日期
      const isAskingToday = message.includes('今天') || message.includes('今日')
      const isAskingTomorrow = message.includes('明天')
      const isAskingYesterday = message.includes('昨天')
      const isAskingThisWeek = message.includes('本周') || message.includes('这周')
      
      // 检查是否询问具体星期几
      let specificDay = null
      const dayPatterns = [
        { pattern: /星期[一二三四五六日天]|周[一二三四五六日天]/, days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
      ]
      
      for (let i = 0; i < dayMap.length; i++) {
        if (message.includes('星期' + ['日', '一', '二', '三', '四', '五', '六'][i]) || 
            message.includes('周' + ['日', '一', '二', '三', '四', '五', '六'][i])) {
          specificDay = dayMap[i]
          break
        }
      }
      
      let replyContent = ''
      let targetCourses = []
      let targetDayName = ''
      let queryType = ''
      
      // 优先级：具体星期 > 今天/明天/昨天 > 本周
      if (specificDay) {
        targetDayName = specificDay
        targetCourses = scheduleData.courses.filter(c => c.day === specificDay)
        queryType = 'specific'
      } else if (isAskingToday) {
        targetDayName = todayName
        targetCourses = scheduleData.courses.filter(c => c.day === todayName)
        queryType = 'today'
      } else if (isAskingTomorrow) {
        targetDayName = tomorrowName
        targetCourses = scheduleData.courses.filter(c => c.day === tomorrowName)
        queryType = 'tomorrow'
      } else if (isAskingYesterday) {
        targetDayName = yesterdayName
        targetCourses = scheduleData.courses.filter(c => c.day === yesterdayName)
        queryType = 'yesterday'
      } else if (isAskingThisWeek) {
        queryType = 'week'
      } else {
        queryType = 'week'
      }
      
      // 生成回复内容
      if (queryType === 'today') {
        if (targetCourses.length > 0) {
          replyContent = `📅 **${scheduleData.studentName}今天（${targetDayName}）的课程安排**\n\n`
          targetCourses.forEach(course => {
            replyContent += `• ${course.name}\n📍 ${course.room} | 👨‍🏫 ${course.teacher}\n\n`
          })
          replyContent += `💡 温馨提示：记得带上笔记本和课本哦！`
        } else {
          replyContent = `🎉 好消息！${scheduleData.studentName}今天（${targetDayName}）没有课程安排，可以好好休息或自主学习哦！`
        }
      } else if (queryType === 'tomorrow') {
        if (targetCourses.length > 0) {
          replyContent = `📅 **${scheduleData.studentName}明天（${targetDayName}）的课程安排**\n\n`
          targetCourses.forEach(course => {
            replyContent += `• ${course.name}\n📍 ${course.room} | 👨‍🏫 ${course.teacher}\n\n`
          })
        } else {
          replyContent = `🎉 ${scheduleData.studentName}明天（${targetDayName}）没有课程安排！`
        }
      } else if (queryType === 'yesterday') {
        if (targetCourses.length > 0) {
          replyContent = `📅 **${scheduleData.studentName}昨天（${targetDayName}）的课程安排**\n\n`
          targetCourses.forEach(course => {
            replyContent += `• ${course.name}\n📍 ${course.room} | 👨‍🏫 ${course.teacher}\n\n`
          })
        } else {
          replyContent = `${scheduleData.studentName}昨天（${targetDayName}）没有课程安排。`
        }
      } else if (queryType === 'specific') {
        if (targetCourses.length > 0) {
          replyContent = `📅 **${scheduleData.studentName}${targetDayName}的课程安排**\n\n`
          targetCourses.forEach(course => {
            replyContent += `• ${course.name}\n📍 ${course.room} | 👨‍🏫 ${course.teacher}\n\n`
          })
        } else {
          replyContent = `${scheduleData.studentName}${targetDayName}没有课程安排。`
        }
      } else {
        // 本周课程
        replyContent = `📅 **${scheduleData.studentName}本周课程安排**\n\n`
        const coursesByDay = {}
        scheduleData.courses.forEach(course => {
          if (!coursesByDay[course.day]) {
            coursesByDay[course.day] = []
          }
          coursesByDay[course.day].push(course)
        })
        
        Object.keys(coursesByDay).forEach(day => {
          replyContent += `**${day}**\n`
          coursesByDay[day].forEach(course => {
            replyContent += `• ${course.name} ${course.room} ${course.teacher}\n`
          })
          replyContent += `\n`
        })
        replyContent += `共 ${scheduleData.courseCount} 门课程`
      }
      
      // 生成后续建议
      const followUpSuggestions = [
        '今天有什么课？',
        '明天第一节课是什么？',
        '本周有几节课？'
      ]
      
      messages.value.push({
        role: 'assistant',
        content: replyContent,
        time: getCurrentTime(),
        followUpSuggestions: followUpSuggestions
      })
      
      isLoading.value = false
      scrollToBottom()
      return
    }
    
    // 调用DeepSeek API（通过后端ai-science接口）
    const response = await fetch('http://localhost:3000/api/ai-science/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: message
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // 添加AI回复
    const replyContent = data.success ? data.data.reply : '抱歉，我暂时无法回答这个问题。'
    
    // 生成联想追问建议
    const followUpSuggestions = generateFollowUpSuggestions(message, replyContent)
    
    messages.value.push({
      role: 'assistant',
      content: replyContent,
      time: getCurrentTime(),
      followUpSuggestions: followUpSuggestions
    })
  } catch (error) {
    console.error('AI对话错误:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，网络连接出现问题，请稍后再试。',
      time: getCurrentTime(),
      followUpSuggestions: ['今天有什么课？', '现在哪些教室空闲？', '食堂人多吗？']
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.ai-assistant-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

/* 悬浮按钮 */
.ai-float-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
}

.ai-float-btn.is-open {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.ai-icon {
  width: 36px;
  height: 36px;
}

/* 脉冲动画 */
.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(102, 126, 234, 0.5);
  animation: pulse 2s ease-out infinite;
}

.pulse-ring.delay {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.ai-float-btn.is-open .pulse-ring {
  display: none;
}

/* 聊天面板 */
.ai-chat-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 520px;
  height: 720px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 动画 */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 头部 */
.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.ai-avatar img {
  width: 32px;
  height: 32px;
}

.header-info h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.header-info .status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-right: 6px;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 快捷功能 */
.quick-actions {
  padding: 10px 12px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  scrollbar-width: none;
}

.quick-actions::-webkit-scrollbar {
  display: none;
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  color: #a5b4fc;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.quick-action-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%);
  color: white;
  transform: translateY(-2px);
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

/* 欢迎区域 */
.welcome-section {
  text-align: center;
  padding: 40px 20px;
}

.welcome-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-avatar img {
  width: 56px;
  height: 56px;
}

.welcome-section h3 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-section p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.suggestion-chip {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  color: white;
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.message-item.assistant .message-bubble {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-bottom-left-radius: 4px;
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.message-item.user .message-time {
  text-align: right;
}

/* 打字动画 */
.message-bubble.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

/* 输入区域 */
.chat-input-area {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.input-wrapper :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: none;
}

.input-wrapper :deep(.el-input__wrapper:hover),
.input-wrapper :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(102, 126, 234, 0.5);
}

.input-wrapper :deep(.el-input__inner) {
  color: white;
}

.input-wrapper :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.input-icon {
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 0 20px;
}

.send-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.input-tips {
  margin-top: 8px;
  text-align: center;
}

.input-tips span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* 联想追问样式 */
.follow-up-section {
  margin-left: 48px;
  margin-top: -8px;
  margin-bottom: 12px;
}

.follow-up-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-bottom: 8px;
}

.follow-up-label .el-icon {
  color: #667eea;
}

.follow-up-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.follow-up-chip {
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 14px;
  color: #a5b4fc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-up-chip:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border-color: rgba(102, 126, 234, 0.5);
  color: white;
  transform: translateY(-1px);
}

/* 响应式 */
@media (max-width: 480px) {
  .ai-chat-panel {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    right: -8px;
  }
  
  .follow-up-section {
    margin-left: 0;
  }
}
</style>
