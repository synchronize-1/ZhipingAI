import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// AI 悬浮助手的状态、快捷配置与对话业务逻辑。
// 仅负责数据与行为，滚动、DOM 结构由子组件承担。
export function useAIAssistant() {
  const userStore = useUserStore()

  const isOpen = ref(false)
  const inputMessage = ref('')
  const messages = ref([])
  const isLoading = ref(false)

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

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
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
    }
  }

  return {
    isOpen,
    inputMessage,
    messages,
    isLoading,
    userName,
    userAvatar,
    quickActions,
    welcomeSuggestions,
    toggleChat,
    clearHistory,
    sendQuickMessage,
    sendMessage
  }
}