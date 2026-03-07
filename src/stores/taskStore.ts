import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskFormData, StatisticsData, QuadrantStatistics } from '@/types'
import { TaskStatus, QuadrantType } from '@/types'
import * as db from '@/database'
import dayjs from 'dayjs'

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const initialized = ref(false)

  // Getters
  const todayTasks = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return tasks.value.filter(task => {
      if (!task.startDate && !task.dueDate) return false
      const startAt = task.startDate ? dayjs(task.startDate) : null
      const dueAt = task.dueDate ? dayjs(task.dueDate) : null
      const todayDate = dayjs(today)
      if (startAt && dueAt) {
        return todayDate.isAfter(startAt.subtract(1, 'day')) && todayDate.isBefore(dueAt.add(1, 'day'))
      }
      if (startAt) return startAt.isSame(todayDate, 'day')
      if (dueAt) return dueAt.isSame(todayDate, 'day')
      return false
    })
  })

  const todayCompleted = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return tasks.value.filter(task =>
      task.status === TaskStatus.COMPLETED &&
      task.actualCompleteDate === today
    )
  })

  const todayNotCompleted = computed(() => {
    return todayTasks.value.filter(task =>
      task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED
    )
  })

  const overdueTasks = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return tasks.value.filter(task => {
      if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false
      if (!task.dueDate) return false
      return dayjs(task.dueDate).isBefore(dayjs(today))
    })
  })

  const statistics = computed((): StatisticsData => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.status === TaskStatus.COMPLETED).length
    const inProgress = tasks.value.filter(t => t.status === TaskStatus.IN_PROGRESS).length
    const notStarted = tasks.value.filter(t => t.status === TaskStatus.NOT_STARTED).length
    const cancelled = tasks.value.filter(t => t.status === TaskStatus.CANCELLED).length
    const overdue = overdueTasks.value.length
    const activeTotal = total - cancelled
    const completionRate = activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 0

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      notStartedTasks: notStarted,
      cancelledTasks: cancelled,
      overdueTasks: overdue,
      completionRate
    }
  })

  const quadrantStatistics = computed((): QuadrantStatistics => {
    return {
      importantUrgent: tasks.value.filter(t => t.quadrant === QuadrantType.IMPORTANT_URGENT && t.status !== TaskStatus.CANCELLED).length,
      importantNotUrgent: tasks.value.filter(t => t.quadrant === QuadrantType.IMPORTANT_NOT_URGENT && t.status !== TaskStatus.CANCELLED).length,
      notImportantUrgent: tasks.value.filter(t => t.quadrant === QuadrantType.NOT_IMPORTANT_URGENT && t.status !== TaskStatus.CANCELLED).length,
      notImportantNotUrgent: tasks.value.filter(t => t.quadrant === QuadrantType.NOT_IMPORTANT_NOT_URGENT && t.status !== TaskStatus.CANCELLED).length
    }
  })

  // Actions
  async function init() {
    if (initialized.value) return
    isLoading.value = true
    try {
      await db.initDatabase()
      await loadTasks()
      initialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function loadTasks() {
    tasks.value = db.getAllTasks()
  }

  async function addTask(taskData: TaskFormData): Promise<number> {
    const id = db.createTask(taskData)
    await loadTasks()
    return id
  }

  async function updateTask(id: number, taskData: Partial<TaskFormData>): Promise<void> {
    db.updateTask(id, taskData)
    await loadTasks()
  }

  async function removeTask(id: number): Promise<void> {
    db.deleteTask(id)
    await loadTasks()
  }

  async function getWeekTasks(weekStart: string, weekEnd: string): Promise<Task[]> {
    return db.getTasksByDateRange(weekStart, weekEnd)
  }

  async function getMonthTasks(year: number, month: number): Promise<Task[]> {
    const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD')
    const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD')
    return db.getTasksByDateRange(startDate, endDate)
  }

  async function importTasks(tasksData: TaskFormData[]): Promise<number> {
    const count = db.importTasks(tasksData)
    await loadTasks()
    return count
  }

  async function exportAllTasks(): Promise<Task[]> {
    return [...tasks.value]
  }

  async function clearAllTasks(): Promise<void> {
    db.clearAllTasks()
    await loadTasks()
  }

  function getOverdueDays(task: Task): number {
    if (!task.dueDate) return 0
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return 0
    const today = dayjs()
    const dueDate = dayjs(task.dueDate)
    return dueDate.isBefore(today) ? today.diff(dueDate, 'day') : 0
  }

  return {
    // State
    tasks,
    isLoading,
    initialized,
    // Getters
    todayTasks,
    todayCompleted,
    todayNotCompleted,
    overdueTasks,
    statistics,
    quadrantStatistics,
    // Actions
    init,
    loadTasks,
    addTask,
    updateTask,
    removeTask,
    getWeekTasks,
    getMonthTasks,
    importTasks,
    exportAllTasks,
    clearAllTasks,
    getOverdueDays
  }
})
