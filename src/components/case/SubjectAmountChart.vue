<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  subjectAmount: number
  claimedAmount: number
  awardedAmount: number
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function formatMoney(value: number): string {
  if (!value) return '¥0'
  return '¥' + (value / 10000).toFixed(2) + '万'
}

function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>${data.marker} ${formatMoney(data.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['诉讼标的额', '请求金额', '判决金额'],
      axisLabel: {
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => (value / 10000) + '万'
      }
    },
    series: [
      {
        name: '金额',
        type: 'bar',
        barWidth: '40%',
        data: [
          {
            value: props.subjectAmount || 0,
            itemStyle: { color: '#409eff' }
          },
          {
            value: props.claimedAmount || 0,
            itemStyle: { color: '#e6a23c' }
          },
          {
            value: props.awardedAmount || 0,
            itemStyle: { color: '#67c23a' }
          }
        ],
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => formatMoney(params.value)
        }
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
        { value: props.subjectAmount || 0, itemStyle: { color: '#409eff' } },
        { value: props.claimedAmount || 0, itemStyle: { color: '#e6a23c' } },
        { value: props.awardedAmount || 0, itemStyle: { color: '#67c23a' } }
      ]
    }]
  })
}

watch(() => [props.subjectAmount, props.claimedAmount, props.awardedAmount], updateChart)

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
