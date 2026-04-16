<template>
  <div class="ai-sentiment-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="icon-wrapper">
            <el-icon class="header-icon"><Sunny /></el-icon>
          </div>
          <div class="header-text">
            <h1>AI情感分析</h1>
            <p>了解你的情绪，关注你的心理健康</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <el-icon><TrendCharts /></el-icon>
            <span>已分析 {{ totalAnalysis }} 次</span>
          </div>
          <div class="stat-item">
            <el-icon><Calendar /></el-icon>
            <span>连续使用 {{ consecutiveDays }} 天</span>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content">
      <el-row :gutter="24">
        <!-- 左侧：输入区域 -->
        <el-col :xs="24" :lg="14">
          <div class="input-section">
            <div class="section-card">
              <div class="card-header">
                <el-icon class="card-icon"><Edit /></el-icon>
                <h3>分享你的心情</h3>
              </div>
              
              <div class="input-area">
                <el-input
                  v-model="inputText"
                  type="textarea"
                  :rows="8"
                  placeholder="在这里写下你的心情、想法或任何想要分享的内容...&#10;&#10;例如：&#10;- 今天发生的事情&#10;- 当前的感受和情绪&#10;- 困扰你的问题&#10;- 让你开心的事情"
                  maxlength="2000"
                  show-word-limit
                  class="sentiment-input"
                />
              </div>

              <div class="quick-templates">
                <div class="template-header">
                  <el-icon><MagicStick /></el-icon>
                  <span>快速模板</span>
                </div>
                <div class="template-list">
                  <el-tag
                    v-for="template in templates"
                    :key="template.id"
                    @click="useTemplate(template.text)"
                    class="template-tag"
                    effect="plain"
                  >
                    {{ template.label }}
                  </el-tag>
                </div>
              </div>

              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="analyzeSentiment"
                  :loading="analyzing"
                  :disabled="!inputText.trim()"
                  class="analyze-btn"
                >
                  <el-icon><Search /></el-icon>
                  开始分析
                </el-button>
                <el-button 
                  size="large"
                  @click="clearInput"
                  class="clear-btn"
                >
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：结果展示 -->
        <el-col :xs="24" :lg="10">
          <div class="result-section">
            <!-- 情感分析结果 -->
            <div v-if="result" class="result-card">
              <div class="card-header">
                <el-icon class="card-icon"><DataAnalysis /></el-icon>
                <h3>分析结果</h3>
              </div>

              <!-- 情感类型 -->
              <div class="emotion-display">
                <div class="emotion-icon" :class="result.emotion">
                  <el-icon v-if="result.emotion === 'positive'"><Sunny /></el-icon>
                  <el-icon v-else-if="result.emotion === 'negative'"><CloudyAndRainy /></el-icon>
                  <el-icon v-else><PartlyCloudy /></el-icon>
                </div>
                <div class="emotion-info">
                  <h4>{{ getEmotionLabel(result.emotion) }}</h4>
                  <p>{{ getEmotionDesc(result.emotion) }}</p>
                </div>
              </div>

              <!-- 情感强度 -->
              <div class="intensity-section">
                <div class="intensity-header">
                  <span>情感强度</span>
                  <span class="intensity-value">{{ result.intensity }}%</span>
                </div>
                <el-progress 
                  :percentage="result.intensity" 
                  :color="getIntensityColor(result.intensity)"
                  :stroke-width="12"
                />
              </div>

              <!-- 关键词 -->
              <div class="keywords-section">
                <div class="section-title">
                  <el-icon><PriceTag /></el-icon>
                  <span>情感关键词</span>
                </div>
                <div class="keywords-list">
                  <el-tag
                    v-for="(keyword, index) in result.keywords"
                    :key="index"
                    :type="getKeywordType(keyword.sentiment)"
                    effect="light"
                    class="keyword-tag"
                  >
                    {{ keyword.word }}
                  </el-tag>
                </div>
              </div>

              <!-- AI建议 -->
              <div class="suggestion-section">
                <div class="section-title">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>AI心理建议</span>
                </div>
                <div class="suggestion-content">
                  <p>{{ result.suggestion }}</p>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="result-actions">
                <el-button @click="saveAnalysis" type="primary" plain>
                  <el-icon><FolderAdd /></el-icon>
                  保存记录
                </el-button>
                <el-button @click="shareResult" plain>
                  <el-icon><Share /></el-icon>
                  分享结果
                </el-button>
                <el-button @click="exportReport" plain>
                  <el-icon><Download /></el-icon>
                  导出报告
                </el-button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <el-empty 
                description="输入你的心情，开始情感分析"
                :image-size="180"
              >
                <template #image>
                  <div class="empty-icon">
                    <el-icon><Sunny /></el-icon>
                  </div>
                </template>
              </el-empty>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 历史记录 -->
      <div class="history-section">
        <div class="section-card">
          <div class="card-header">
            <el-icon class="card-icon"><Clock /></el-icon>
            <h3>历史记录</h3>
            <el-button text @click="viewAllHistory">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div class="history-list">
            <div 
              v-for="item in historyList" 
              :key="item.id"
              class="history-item"
              @click="loadHistory(item)"
            >
              <div class="history-icon" :class="item.emotion">
                <el-icon v-if="item.emotion === 'positive'"><Sunny /></el-icon>
                <el-icon v-else-if="item.emotion === 'negative'"><CloudyAndRainy /></el-icon>
                <el-icon v-else><PartlyCloudy /></el-icon>
              </div>
              <div class="history-content">
                <div class="history-text">{{ item.text }}</div>
                <div class="history-meta">
                  <span class="history-time">{{ formatTime(item.time) }}</span>
                  <el-tag :type="getKeywordType(item.emotion)" size="small">
                    {{ getEmotionLabel(item.emotion) }}
                  </el-tag>
                </div>
              </div>
              <el-icon class="history-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 数据状态
const inputText = ref('')
const analyzing = ref(false)
const result = ref(null)
const totalAnalysis = ref(0)
const consecutiveDays = ref(0)

// 快速模板
const templates = [
  { id: 1, label: '今天很开心', text: '今天发生了很多让我开心的事情，心情特别好！' },
  { id: 2, label: '有点焦虑', text: '最近感觉有点焦虑，压力比较大...' },
  { id: 3, label: '平静放松', text: '今天心情很平静，感觉很放松。' },
  { id: 4, label: '有些困扰', text: '遇到了一些困扰的事情，不知道该怎么办。' },
]

// 历史记录（模拟数据）
const historyList = ref([
  {
    id: 1,
    text: '今天考试考得不错，心情很好！',
    emotion: 'positive',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 2,
    text: '作业太多了，感觉有点压力...',
    emotion: 'negative',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 3,
    text: '今天天气不错，心情还可以。',
    emotion: 'neutral',
    time: new Date(Date.now() - 48 * 60 * 60 * 1000)
  },
])

// 使用模板
const useTemplate = (text) => {
  inputText.value = text
  ElMessage.success('已应用模板')
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  result.value = null
}

// 情感分析
const analyzeSentiment = async () => {
  analyzing.value = true
  try {
    const response = await axios.post('/api/ai-science/sentiment', {
      text: inputText.value
    })

    if (response.data.success) {
      result.value = response.data.data
      totalAnalysis.value++
      
      // 添加到历史记录
      historyList.value.unshift({
        id: Date.now(),
        text: inputText.value.substring(0, 50) + (inputText.value.length > 50 ? '...' : ''),
        emotion: response.data.data.emotion,
        time: new Date()
      })
      
      ElMessage.success('分析完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('情感分析错误:', error)
    ElMessage.error('分析失败，请重试')
  } finally {
    analyzing.value = false
  }
}

// 获取情感标签
const getEmotionLabel = (emotion) => {
  const labels = {
    positive: '积极情绪',
    negative: '消极情绪',
    neutral: '中性情绪'
  }
  return labels[emotion] || '未知'
}

// 获取情感描述
const getEmotionDesc = (emotion) => {
  const descs = {
    positive: '你的情绪状态很好，保持积极乐观的心态！',
    negative: '你可能正在经历一些困难，试着调整心态。',
    neutral: '你的情绪比较平稳，这是一个不错的状态。'
  }
  return descs[emotion] || ''
}

// 获取强度颜色
const getIntensityColor = (intensity) => {
  if (intensity >= 80) return '#f56c6c'
  if (intensity >= 60) return '#e6a23c'
  if (intensity >= 40) return '#409eff'
  return '#67c23a'
}

// 获取关键词类型
const getKeywordType = (sentiment) => {
  const types = {
    positive: 'success',
    negative: 'danger',
    neutral: 'info'
  }
  return types[sentiment] || 'info'
}

// 格式化时间
const formatTime = (time) => {
  const now = new Date()
  const diff = now - new Date(time)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(time).toLocaleDateString()
}

// 加载历史记录
const loadHistory = (item) => {
  inputText.value = item.text
  ElMessage.info('已加载历史记录')
}

// 保存分析
const saveAnalysis = () => {
  ElMessage.success('分析结果已保存')
}

// 分享结果
const shareResult = () => {
  ElMessage.info('分享功能开发中...')
}

// 导出报告
const exportReport = () => {
  ElMessage.info('报告导出功能开发中...')
}

// 查看全部历史
const viewAllHistory = () => {
  ElMessage.info('查看全部历史功能开发中...')
}
</script>

<style scoped lang="scss">
.ai-sentiment-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #ffe5f1 100%);
  padding: 24px;

  .page-header {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .icon-wrapper {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #ffb3d9 0%, #ff8cc6 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(255, 179, 217, 0.4);

      .header-icon {
        font-size: 32px;
        color: white;
      }
    }

    .header-text {
      h1 {
        font-size: 28px;
        font-weight: 600;
        color: #2c3e50;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: #7f8c8d;
        margin: 0;
      }
    }

    .header-stats {
      display: flex;
      gap: 24px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: #f8f9fa;
        border-radius: 12px;

        .el-icon {
          font-size: 20px;
          color: #ff8cc6;
        }

        span {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
        }
      }
    }
  }

  .page-content {
    .section-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;

      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;

        .card-icon {
          font-size: 24px;
          color: #ff8cc6;
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
          flex: 1;
        }
      }
    }

    .input-area {
      margin-bottom: 20px;

      .sentiment-input {
        :deep(.el-textarea__inner) {
          border-radius: 12px;
          border: 2px solid #e9ecef;
          font-size: 15px;
          line-height: 1.6;
          transition: all 0.3s;

          &:focus {
            border-color: #ffb3d9;
            box-shadow: 0 0 0 3px rgba(255, 179, 217, 0.1);
          }
        }
      }
    }

    .quick-templates {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;

      .template-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #495057;
        font-size: 14px;
        font-weight: 500;
      }

      .template-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .template-tag {
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;

      .analyze-btn {
        flex: 1;
        height: 48px;
        font-size: 16px;
        font-weight: 500;
        background: linear-gradient(135deg, #ffb3d9 0%, #ff8cc6 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(255, 179, 217, 0.4);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 179, 217, 0.5);
        }
      }

      .clear-btn {
        height: 48px;
      }
    }

    .result-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

      .emotion-display {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        margin-bottom: 24px;

        .emotion-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;

          &.positive {
            background: linear-gradient(135deg, #ffe5f1 0%, #ffc9e3 100%);
            color: #ff6bb5;
          }

          &.negative {
            background: linear-gradient(135deg, #e8d5e8 0%, #d4b5d4 100%);
            color: #9966cc;
          }

          &.neutral {
            background: linear-gradient(135deg, #f5e6ff 0%, #e6ccff 100%);
            color: #b380ff;
          }
        }

        .emotion-info {
          flex: 1;

          h4 {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 8px 0;
          }

          p {
            font-size: 14px;
            color: #7f8c8d;
            margin: 0;
          }
        }
      }

      .intensity-section {
        margin-bottom: 24px;

        .intensity-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
          color: #495057;
          font-weight: 500;

          .intensity-value {
            color: #ff8cc6;
            font-weight: 600;
          }
        }
      }

      .keywords-section,
      .suggestion-section {
        margin-bottom: 24px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #2c3e50;

          .el-icon {
            color: #ff8cc6;
          }
        }

        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .keyword-tag {
            font-size: 13px;
          }
        }

        .suggestion-content {
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 4px solid #ffb3d9;

          p {
            margin: 0;
            line-height: 1.6;
            color: #495057;
          }
        }
      }

      .result-actions {
        display: flex;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid #e9ecef;
      }
    }

    .empty-state {
      background: white;
      border-radius: 16px;
      padding: 60px 24px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

      .empty-icon {
        font-size: 120px;
        color: #e9ecef;
        margin-bottom: 20px;
      }
    }

    .history-list {
      .history-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 12px;
        background: #f8f9fa;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .history-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;

          &.positive {
            background: #ffe5f1;
            color: #ff6bb5;
          }

          &.negative {
            background: #e8d5e8;
            color: #9966cc;
          }

          &.neutral {
            background: #f5e6ff;
            color: #b380ff;
          }
        }

        .history-content {
          flex: 1;
          min-width: 0;

          .history-text {
            font-size: 14px;
            color: #2c3e50;
            margin-bottom: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .history-meta {
            display: flex;
            align-items: center;
            gap: 12px;

            .history-time {
              font-size: 12px;
              color: #7f8c8d;
            }
          }
        }

        .history-arrow {
          color: #adb5bd;
          font-size: 16px;
        }
      }
    }

    .trend-chart {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;

      .chart-placeholder {
        text-align: center;
        color: #adb5bd;

        .el-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        p {
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .ai-sentiment-page {
    padding: 16px;

    .page-header {
      padding: 20px;

      .header-stats {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}
</style>
