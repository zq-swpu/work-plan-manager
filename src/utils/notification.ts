import dayjs from 'dayjs'
import type { Task } from '@/types'
import { TaskStatus } from '@/types'
import { logger } from '@/utils/logger'

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    logger.warn('Notification', '浏览器不支持通知功能')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 发送桌面通知
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (Notification.permission !== 'granted') {
    logger.warn('Notification', '未获得通知权限')
    return null
  }

  const notification = new Notification(title, {
    icon: '/vite.svg',
    badge: '/vite.svg',
    ...options
  })

  return notification
}

// 发送任务到期提醒
export function sendTaskDueNotification(task: Task): void {
  const title = '任务到期提醒'
  const body = `任务"${task.planDetail}"即将到期`

  sendNotification(title, {
    body,
    tag: `task-due-${task.id}`,
    requireInteraction: true
  })
}

// 发送逾期警告
export function sendOverdueNotification(task: Task): void {
  const title = '任务逾期警告'
  const overdueDays = dayjs().diff(dayjs(task.dueDate), 'day')
  const body = `任务"${task.planDetail}"已逾期 ${overdueDays} 天`

  sendNotification(title, {
    body,
    tag: `task-overdue-${task.id}`,
    requireInteraction: true
  })
}

// 检查并发送提醒
export function checkAndSendNotifications(tasks: Task[], reminderDays: number): void {
  const today = dayjs()

  tasks.forEach(task => {
    // 跳过已完成和已取消的任务
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return
    }

    if (!task.dueDate) return

    const dueDate = dayjs(task.dueDate)
    const daysUntilDue = dueDate.diff(today, 'day')

    // 逾期提醒
    if (daysUntilDue < 0) {
      sendOverdueNotification(task)
    }
    // 即将到期提醒
    else if (daysUntilDue <= reminderDays) {
      sendTaskDueNotification(task)
    }
  })
}

// 设置定时检查
let checkInterval: ReturnType<typeof setInterval> | null = null

export function startNotificationCheck(
  getTasks: () => Task[],
  reminderDays: number,
  intervalMinutes: number = 60
): void {
  // 停止之前的检查
  stopNotificationCheck()

  // 立即检查一次
  requestNotificationPermission().then(granted => {
    if (granted) {
      checkAndSendNotifications(getTasks(), reminderDays)
    }
  })

  // 设置定时检查
  checkInterval = setInterval(() => {
    requestNotificationPermission().then(granted => {
      if (granted) {
        checkAndSendNotifications(getTasks(), reminderDays)
      }
    })
  }, intervalMinutes * 60 * 1000)
}

export function stopNotificationCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}
