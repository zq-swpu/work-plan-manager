<template>
  <div class="weekly-view">
    <!-- 周选择器 -->
    <el-card class="mb-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <el-button @click="prevWeek">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="text-lg font-medium">{{ weekRangeText }}</span>
          <el-button @click="nextWeek">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="flex gap-2">
          <el-button @click="goToToday">今天</el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 周统计 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">本周任务</div>
          <div class="stat-card-value text-blue-500">{{ weekTasks.length }}</div>
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
          <div class="stat-card-title">进行中</div>
          <div class="stat-card-value text-orange-500">{{ inProgressCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">完成率</div>
          <div class="stat-card-value">{{ completionRate }}%</div>
        </div>
      </el-col>
    </el-row>

    <!-- 周视图 -->
    <el-row :gutter="16">
      <el-col v-for="day in weekDays" :key="day.date" :span="3">
        <el-card
          :class="{ 'today-card': isToday(day.date) }"
          class="day-card"
        >
          <template #header>
            <div class="text-center">
              <div class="text-sm text-gray-500">{{ day.weekLabel }}</div>
              <div class="text-lg font-bold" :class="{ 'text-blue-500': isToday(day.date) }">
                {{ day.dayNum }}
              </div>
            </div>
          </template>
          <div class="day-tasks">
            <div
              v-for="task in day.tasks.slice(0, 3)"
              :key="task.id"
              class="day-task-item"
              :class="getTaskClass(task)"
              @click="handleEdit(task)"
            >
              <div class="text-xs truncate">{{ task.planDetail }}</div>
            </div>
            <div v-if="day.tasks.length > 3" class="more-tasks">
              +{{ day.tasks.length - 3 }} 更多
            </div>
            <div v-if="day.tasks.length === 0" class="text-center text-gray-400 text-sm py-2">
              无任务
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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

const currentWeekStart = ref(dayjs().startOf('isoWeek'))
const weekTasks = ref<Task[]>([])
const dialogVisible = ref(false)
const editingTask = ref<Task | null>(null)
const submitting = ref(false)

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const weekRangeText = computed(() => {
  const start = currentWeekStart.value.format('YYYY-MM-DD')
  const end = currentWeekStart.value.add(6, 'day').format('YYYY-MM-DD')
  return `${start} ~ ${end}`
})

const completedCount = computed(() =>
  weekTasks.value.filter(t => t.status === TaskStatus.COMPLETED).length
)

const inProgressCount = computed(() =>
  weekTasks.value.filter(t => t.status === TaskStatus.IN_PROGRESS).length
)

const completionRate = computed(() => {
  const total = weekTasks.value.filter(t => t.status !== TaskStatus.CANCELLED).length
  return total > 0 ? Math.round((completedCount.value / total) * 100) : 0
})

const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = currentWeekStart.value.add(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      weekLabel: weekLabels[i],
      dayNum: date.format('D'),
      tasks: weekTasks.value.filter(task => {
        if (task.startDate && task.dueDate) {
          return dayjs(dateStr).isBetween(task.startDate, task.dueDate, 'day', '[]')
        }
        return task.startDate === dateStr || task.dueDate === dateStr
      })
    })
  }
  return days
})

function isToday(date: string): boolean {
  return date === dayjs().format('YYYY-MM-DD')
}

function getTaskClass(task: Task): string {
  if (task.status === TaskStatus.COMPLETED) return 'task-completed'
  if (task.status === TaskStatus.CANCELLED) return 'task-cancelled'
  if (task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day')) return 'task-overdue'
  return 'task-pending'
}

async function loadWeekTasks() {
  const start = currentWeekStart.value.format('YYYY-MM-DD')
  const end = currentWeekStart.value.add(6, 'day').format('YYYY-MM-DD')
  weekTasks.value = await taskStore.getWeekTasks(start, end)
}

function prevWeek() {
  currentWeekStart.value = currentWeekStart.value.subtract(7, 'day')
  loadWeekTasks()
}

function nextWeek() {
  currentWeekStart.value = currentWeekStart.value.add(7, 'day')
  loadWeekTasks()
}

function goToToday() {
  currentWeekStart.value = dayjs().startOf('isoWeek')
  loadWeekTasks()
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
    await loadWeekTasks()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadWeekTasks()
})
</script>

<style scoped>
.day-card {
  min-height: 200px;
}

.today-card {
  border: 2px solid #409eff;
}

.day-tasks {
  max-height: 150px;
  overflow-y: auto;
}

.day-task-item {
  padding: 4px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.day-task-item:hover {
  opacity: 0.8;
}

.task-completed {
  background-color: #f0f9eb;
  border-left: 3px solid #67c23a;
}

.task-cancelled {
  background-color: #f4f4f5;
  border-left: 3px solid #909399;
}

.task-overdue {
  background-color: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.task-pending {
  background-color: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.more-tasks {
  font-size: 12px;
  color: #909399;
  text-align: center;
  padding: 4px;
}
</style>
