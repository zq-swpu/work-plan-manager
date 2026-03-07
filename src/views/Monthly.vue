<template>
  <div class="monthly-view">
    <!-- 月份选择器 -->
    <el-card class="mb-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <el-button @click="prevMonth">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="text-lg font-medium">{{ currentMonthText }}</span>
          <el-button @click="nextMonth">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="flex gap-2">
          <el-button @click="goToCurrentMonth">本月</el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 月统计 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">本月任务</div>
          <div class="stat-card-value text-blue-500">{{ monthTasks.length }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">已完成</div>
          <div class="stat-card-value text-green-500">{{ completedCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">未完成</div>
          <div class="stat-card-value text-red-500">{{ unfinishedCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">完成率</div>
          <div class="stat-card-value">{{ completionRate }}%</div>
        </div>
      </el-col>
    </el-row>

    <!-- 月历视图 -->
    <el-card>
      <div class="calendar-grid">
        <div v-for="day in calendarDays" :key="day.date" class="calendar-day">
          <div
            class="day-header"
            :class="{ 'today': day.isToday, 'other-month': day.isOtherMonth }"
          >
            {{ day.dayNum }}
          </div>
          <div class="day-content">
            <div
              v-for="task in day.tasks.slice(0, 3)"
              :key="task.id"
              class="calendar-task"
              :class="getTaskClass(task)"
              @click="handleEdit(task)"
            >
              <span class="truncate">{{ task.planDetail }}</span>
            </div>
            <div v-if="day.tasks.length > 3" class="more-tasks">
              +{{ day.tasks.length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 任务编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingTask ? '编辑任务' : '新增任务'"
      width="600px"
      destroy-on-close
    >
      <TaskForm
        :task="editingTask"
        :loading="submitting"
        @submit="handleSubmit"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useTaskStore } from '@/stores'
import { TaskStatus } from '@/types'
import type { Task, TaskFormData } from '@/types'
import { TaskForm } from '@/components'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekday from 'dayjs/plugin/weekday'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isoWeek)
dayjs.extend(weekday)
dayjs.extend(isBetween)

const taskStore = useTaskStore()

const currentMonth = ref(dayjs())
const monthTasks = ref<Task[]>([])
const dialogVisible = ref(false)
const editingTask = ref<Task | null>(null)
const submitting = ref(false)

const currentMonthText = computed(() =>
  currentMonth.value.format('YYYY年M月')
)

const completedCount = computed(() =>
  monthTasks.value.filter(t => t.status === TaskStatus.COMPLETED).length
)

const unfinishedCount = computed(() =>
  monthTasks.value.filter(t =>
    t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  ).length
)

const completionRate = computed(() => {
  const total = monthTasks.value.filter(t => t.status !== TaskStatus.CANCELLED).length
  return total > 0 ? Math.round((completedCount.value / total) * 100) : 0
})

const calendarDays = computed(() => {
  const monthStart = currentMonth.value.startOf('month')
  const monthEnd = currentMonth.value.endOf('month')
  const calendarStart = monthStart.startOf('isoWeek')
  const calendarEnd = monthEnd.endOf('isoWeek')

  const days = []
  let current = calendarStart

  while (current.isBefore(calendarEnd) || current.isSame(calendarEnd, 'day')) {
    const dateStr = current.format('YYYY-MM-DD')
    const isOtherMonth = !current.isSame(currentMonth.value, 'month')

    days.push({
      date: dateStr,
      dayNum: current.format('D'),
      isToday: dateStr === dayjs().format('YYYY-MM-DD'),
      isOtherMonth,
      tasks: !isOtherMonth ? monthTasks.value.filter(task => {
        if (task.startDate && task.dueDate) {
          return dayjs(dateStr).isBetween(task.startDate, task.dueDate, 'day', '[]')
        }
        return task.startDate === dateStr || task.dueDate === dateStr
      }) : []
    })

    current = current.add(1, 'day')
  }

  return days
})

async function loadMonthTasks() {
  const year = currentMonth.value.year()
  const month = currentMonth.value.month() + 1
  monthTasks.value = await taskStore.getMonthTasks(year, month)
}

function prevMonth() {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
  loadMonthTasks()
}

function nextMonth() {
  currentMonth.value = currentMonth.value.add(1, 'month')
  loadMonthTasks()
}

function goToCurrentMonth() {
  currentMonth.value = dayjs()
  loadMonthTasks()
}

function getTaskClass(task: Task): string {
  if (task.status === TaskStatus.COMPLETED) return 'task-completed'
  if (task.status === TaskStatus.CANCELLED) return 'task-cancelled'
  if (task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day')) return 'task-overdue'
  return 'task-pending'
}

function showAddDialog() {
  editingTask.value = null
  dialogVisible.value = true
}

function handleEdit(task: Task) {
  editingTask.value = task
  dialogVisible.value = true
}

async function handleSubmit(formData: TaskFormData) {
  submitting.value = true
  try {
    if (editingTask.value?.id) {
      await taskStore.updateTask(editingTask.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      await taskStore.addTask(formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadMonthTasks()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMonthTasks()
})
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e4e7ed;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.calendar-day {
  background-color: #fff;
  min-height: 100px;
}

.day-header {
  padding: 8px;
  font-weight: bold;
  text-align: center;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.day-header.today {
  background-color: #409eff;
  color: #fff;
}

.day-header.other-month {
  color: #c0c4cc;
}

.day-content {
  padding: 4px;
  min-height: 70px;
}

.calendar-task {
  padding: 2px 6px;
  margin-bottom: 2px;
  font-size: 12px;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-task:hover {
  opacity: 0.8;
}

.task-completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.task-cancelled {
  background-color: #f4f4f5;
  color: #909399;
}

.task-overdue {
  background-color: #fef0f0;
  color: #f56c6c;
}

.task-pending {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.more-tasks {
  font-size: 12px;
  color: #909399;
  text-align: center;
  padding: 2px;
}
</style>
