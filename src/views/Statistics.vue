<template>
  <div class="statistics-view">
    <!-- 总览统计 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-card-title">总任务数</div>
          <div class="stat-card-value text-blue-500">{{ statistics.totalTasks }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-card-title">已完成</div>
          <div class="stat-card-value text-green-500">{{ statistics.completedTasks }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-card-title">进行中</div>
          <div class="stat-card-value text-orange-500">{{ statistics.inProgressTasks }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-card-title">未开始</div>
          <div class="stat-card-value text-gray-500">{{ statistics.notStartedTasks }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-card-title">逾期</div>
          <div class="stat-card-value text-red-500">{{ statistics.overdueTasks }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-card-title">完成率</div>
          <div class="stat-card-value text-green-500">{{ statistics.completionRate }}%</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- 四象限分布图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>四象限分布</span>
          </template>
          <div ref="quadrantChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 状态分布图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>状态分布</span>
          </template>
          <div ref="statusChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 月度完成趋势 -->
    <el-card class="mt-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span>月度完成趋势</span>
          <el-radio-group v-model="trendRange" size="small">
            <el-radio-button label="6">近6个月</el-radio-button>
            <el-radio-button label="12">近12个月</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="trendChartRef" style="height: 350px"></div>
    </el-card>

    <!-- 逾期任务分析 -->
    <el-card class="mt-4" v-if="overdueTasks.length > 0">
      <template #header>
        <div class="flex items-center">
          <el-icon class="text-red-500 mr-2"><Warning /></el-icon>
          <span class="text-red-500">逾期任务分析 ({{ overdueTasks.length }})</span>
        </div>
      </template>
      <el-table :data="overdueTasks" style="width: 100%">
        <el-table-column prop="planDetail" label="任务" min-width="200" />
        <el-table-column label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger">{{ getOverdueDays(row) }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="120" align="center" />
        <el-table-column label="四象限" width="120" align="center">
          <template #default="{ row }: { row: Task }">
            <el-tag size="small">{{ quadrantLabels[row.quadrant] }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useTaskStore } from '@/stores'
import { TaskStatus, quadrantLabels } from '@/types'
import type { Task } from '@/types'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

const statistics = computed(() => taskStore.statistics)
const quadrantStatistics = computed(() => taskStore.quadrantStatistics)
const overdueTasks = computed(() => taskStore.overdueTasks)

const trendRange = ref('6')

const quadrantChartRef = ref<HTMLElement>()
const statusChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

let quadrantChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

function getOverdueDays(task: Task): number {
  if (!task.dueDate) return 0
  const today = dayjs()
  const dueDate = dayjs(task.dueDate)
  return dueDate.isBefore(today) ? today.diff(dueDate, 'day') : 0
}

function initCharts() {
  if (quadrantChartRef.value) {
    quadrantChart = echarts.init(quadrantChartRef.value)
  }
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  updateCharts()
}

function updateCharts() {
  updateQuadrantChart()
  updateStatusChart()
  updateTrendChart()
}

function updateQuadrantChart() {
  if (!quadrantChart) return

  const data = [
    { value: quadrantStatistics.value.importantUrgent, name: '重要/紧急' },
    { value: quadrantStatistics.value.importantNotUrgent, name: '重要/不紧急' },
    { value: quadrantStatistics.value.notImportantUrgent, name: '不重要/紧急' },
    { value: quadrantStatistics.value.notImportantNotUrgent, name: '不重要/不紧急' }
  ]

  quadrantChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data,
        color: ['#f56c6c', '#e6a23c', '#409eff', '#67c23a']
      }
    ]
  })
}

function updateStatusChart() {
  if (!statusChart) return

  const data = [
    { value: statistics.value.completedTasks, name: '已完成' },
    { value: statistics.value.inProgressTasks, name: '进行中' },
    { value: statistics.value.notStartedTasks, name: '未开始' },
    { value: statistics.value.cancelledTasks, name: '已取消' }
  ]

  statusChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 'right'
    },
    series: [
      {
        type: 'pie',
        radius: '70%',
        data: data,
        color: ['#67c23a', '#e6a23c', '#909399', '#f56c6c'],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
}

function updateTrendChart() {
  if (!trendChart) return

  const months = parseInt(trendRange.value)
  const labels: string[] = []
  const completedData: number[] = []
  const totalData: number[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month')
    labels.push(date.format('YYYY-MM'))

    const monthStart = date.startOf('month').format('YYYY-MM-DD')
    const monthEnd = date.endOf('month').format('YYYY-MM-DD')

    const monthTasks = taskStore.tasks.filter(task => {
      if (!task.createdAt) return false
      const createdAt = dayjs(task.createdAt)
      return createdAt.isAfter(monthStart) && createdAt.isBefore(monthEnd)
    })

    totalData.push(monthTasks.length)
    completedData.push(monthTasks.filter(t => t.status === TaskStatus.COMPLETED).length)
  }

  trendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['创建任务', '完成任务']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '创建任务',
        type: 'line',
        data: totalData,
        smooth: true,
        lineStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '完成任务',
        type: 'line',
        data: completedData,
        smooth: true,
        lineStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  })
}

watch(trendRange, () => {
  nextTick(() => updateTrendChart())
})

onMounted(() => {
  nextTick(() => {
    initCharts()
  })

  window.addEventListener('resize', () => {
    quadrantChart?.resize()
    statusChart?.resize()
    trendChart?.resize()
  })
})
</script>
