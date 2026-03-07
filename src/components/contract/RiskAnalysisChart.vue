<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { RiskLevel } from '@/types'
import { riskLevelLabels } from '@/types'

const props = defineProps<{
  data: Record<RiskLevel, number>
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: '风险分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: props.data['low'] || 0, name: riskLevelLabels['low'], itemStyle: { color: '#67c23a' } },
          { value: props.data['medium'] || 0, name: riskLevelLabels['medium'], itemStyle: { color: '#e6a23c' } },
          { value: props.data['high'] || 0, name: riskLevelLabels['high'], itemStyle: { color: '#f56c6c' } },
          { value: props.data['critical'] || 0, name: riskLevelLabels['critical'], itemStyle: { color: '#c45656' } }
        ]
      }
    ]
  }

  chart.setOption(option)
}

function updateChart() {
  if (!chart) return

  chart.setOption({
    series: [{
      data: [
        { value: props.data['low'] || 0, name: riskLevelLabels['low'], itemStyle: { color: '#67c23a' } },
        { value: props.data['medium'] || 0, name: riskLevelLabels['medium'], itemStyle: { color: '#e6a23c' } },
        { value: props.data['high'] || 0, name: riskLevelLabels['high'], itemStyle: { color: '#f56c6c' } },
        { value: props.data['critical'] || 0, name: riskLevelLabels['critical'], itemStyle: { color: '#c45656' } }
      ]
    }]
  })
}

watch(() => props.data, updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})
</script>

<style scoped>
.chart-container {
  height: 300px;
}
</style>
