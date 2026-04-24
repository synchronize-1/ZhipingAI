// composables/useECharts.js
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

/**
 * ECharts 组合式函数
 * @param {Ref} chartRef - 图表容器 ref
 * @param {Function} optionGetter - 获取图表配置的函数
 * @param {Object} options - 额外选项
 * @returns {Object} { resize, dispose, setOption, loading, clear }
 */
export function useECharts(chartRef, optionGetter, options = {}) {
    const { autoResize = true, watchData = null } = options
    let chart = null
    const isLoading = ref(false)

    // 初始化图表
    const initChart = () => {
        if (!chartRef.value) return false
        if (chart) {
            chart.dispose()
            chart = null
        }
        chart = echarts.init(chartRef.value)
        return true
    }

    // 设置图表配置
    const setOption = (option, notMerge = false) => {
        if (!chart) {
            if (!initChart()) return
        }
        if (option) {
            chart.setOption(option, notMerge)
        }
    }

    // 刷新图表（重新获取配置并应用）
    const refresh = async () => {
        if (!chartRef.value) return
        await nextTick()
        if (!chart) initChart()
        const option = typeof optionGetter === 'function' ? optionGetter() : optionGetter
        if (option) {
            chart?.setOption(option, true)
        }
    }

    // 显示加载状态
    const showLoading = () => {
        isLoading.value = true
        if (chart) {
            chart.showLoading()
        }
    }

    // 隐藏加载状态
    const hideLoading = () => {
        isLoading.value = false
        if (chart) {
            chart.hideLoading()
        }
    }

    // 调整大小
    const resize = () => {
        chart?.resize()
    }

    // 销毁图表
    const dispose = () => {
        if (chart) {
            chart.dispose()
            chart = null
        }
    }

    // 清空图表
    const clear = () => {
        chart?.clear()
    }

    // 监听数据变化自动刷新
    if (watchData) {
        watch(watchData, () => {
            refresh()
        }, { deep: true })
    }

    // 自动 resize
    if (autoResize) {
        window.addEventListener('resize', resize)
        onBeforeUnmount(() => {
            window.removeEventListener('resize', resize)
        })
    }

    onMounted(() => {
        initChart()
        refresh()
    })

    onBeforeUnmount(() => {
        dispose()
    })

    return {
        chart,
        isLoading,
        setOption,
        refresh,
        showLoading,
        hideLoading,
        resize,
        dispose,
        clear
    }
}

/**
 * 生成渐变色
 * @param {Array} colors - 颜色数组 [{ offset, color }]
 * @param {string} direction - 方向 'vertical' | 'horizontal'
 */
export const createGradient = (colors, direction = 'vertical') => {
    const x1 = direction === 'horizontal' ? 0 : 0
    const y1 = direction === 'vertical' ? 0 : 0
    const x2 = direction === 'horizontal' ? 1 : 0
    const y2 = direction === 'vertical' ? 1 : 0
    return new echarts.graphic.LinearGradient(x1, y1, x2, y2, colors)
}

/**
 * 常见图表配色
 */
export const chartColors = {
    primary: '#667eea',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899'
}

/**
 * 默认图表配置
 */
export const defaultChartOptions = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true }
}