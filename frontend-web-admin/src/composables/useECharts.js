import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

export function useECharts(chartRef, options, watchSources = []) {
    let chart = null

    const initChart = () => {
        if (!chartRef.value) return
        if (chart) chart.dispose()
        chart = echarts.init(chartRef.value)
        chart.setOption(options.value || options)
    }

    const updateOptions = (newOptions) => {
        if (chart) {
            chart.setOption(newOptions, { notMerge: false })
        }
    }

    const resize = () => {
        chart?.resize()
    }

    onMounted(() => {
        initChart()
    })

    onBeforeUnmount(() => {
        chart?.dispose()
        chart = null
    })

    // 监听数据变化自动更新
    if (watchSources.length) {
        watch(watchSources, () => {
            updateOptions(options.value || options)
        }, { deep: true })
    }

    return { initChart, updateOptions, resize, chart }
}