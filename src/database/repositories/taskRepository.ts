import type { Database } from '../index'
import type { Task, TaskFormData } from '@/types'
import { TaskStatus, QuadrantType } from '@/types'
import { logger } from '@/utils/logger'

export function createTaskRepository(db: Database) {
  // 将数据库行转换为任务对象
  function rowToTask(row: unknown[]): Task {
    return {
      id: row[0] as number,
      status: row[1] as TaskStatus,
      planDetail: row[2] as string,
      quadrant: row[3] as QuadrantType,
      startDate: row[4] as string | null,
      dueDate: row[5] as string | null,
      progress: row[6] as number,
      actualCompleteDate: row[7] as string | null,
      completionNote: row[8] as string | null,
      remark: row[9] as string | null,
      createdAt: row[10] as string,
      updatedAt: row[11] as string,
      // 新增字段使用默认值
      taskType: undefined,
      priority: undefined,
      linkId: undefined,
      linkType: undefined,
      assigneeId: undefined,
      departmentId: undefined,
      createdBy: undefined,
      updatedBy: undefined
    }
  }

  function createTask(task: TaskFormData): number {
    const stmt = db.prepare(`
      INSERT INTO tasks (status, plan_detail, quadrant, start_date, due_date, progress, actual_complete_date, completion_note, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run([
      task.status,
      task.planDetail,
      task.quadrant,
      task.startDate || null,
      task.dueDate || null,
      task.progress,
      task.actualCompleteDate || null,
      task.completionNote || null,
      task.remark || null
    ])

    stmt.free()

    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  function updateTask(id: number, task: Partial<TaskFormData>): void {
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (task.status !== undefined) {
      updates.push('status = ?')
      values.push(task.status)
    }
    if (task.planDetail !== undefined) {
      updates.push('plan_detail = ?')
      values.push(task.planDetail)
    }
    if (task.quadrant !== undefined) {
      updates.push('quadrant = ?')
      values.push(task.quadrant)
    }
    if (task.startDate !== undefined) {
      updates.push('start_date = ?')
      values.push(task.startDate || null)
    }
    if (task.dueDate !== undefined) {
      updates.push('due_date = ?')
      values.push(task.dueDate || null)
    }
    if (task.progress !== undefined) {
      updates.push('progress = ?')
      values.push(task.progress)
    }
    if (task.actualCompleteDate !== undefined) {
      updates.push('actual_complete_date = ?')
      values.push(task.actualCompleteDate || null)
    }
    if (task.completionNote !== undefined) {
      updates.push('completion_note = ?')
      values.push(task.completionNote || null)
    }
    if (task.remark !== undefined) {
      updates.push('remark = ?')
      values.push(task.remark || null)
    }

    updates.push("updated_at = datetime('now')")
    values.push(id)

    db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values)
  }

  function deleteTask(id: number): void {
    db.run('DELETE FROM tasks WHERE id = ?', [id])
  }

  function getAllTasks(): Task[] {
    const result = db.exec(`
      SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
             actual_complete_date, completion_note, remark, created_at, updated_at
      FROM tasks
      ORDER BY created_at DESC
    `)

    if (!result.length) return []
    return result[0].values.map(rowToTask)
  }

  function getTaskById(id: number): Task | null {
    const result = db.exec(`
      SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
             actual_complete_date, completion_note, remark, created_at, updated_at
      FROM tasks WHERE id = ?
    `, [id])

    if (!result.length || !result[0].values.length) return null
    return rowToTask(result[0].values[0])
  }

  function getTasksByDateRange(startDate: string, endDate: string): Task[] {
    const result = db.exec(`
      SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
             actual_complete_date, completion_note, remark, created_at, updated_at
      FROM tasks
      WHERE (start_date >= ? AND start_date <= ?)
         OR (due_date >= ? AND due_date <= ?)
         OR (start_date < ? AND due_date > ?)
      ORDER BY start_date ASC, due_date ASC
    `, [startDate, endDate, startDate, endDate, startDate, endDate])

    if (!result.length) return []
    return result[0].values.map(rowToTask)
  }

  function getTodayTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0]
    return getTasksByDateRange(today, today)
  }

  function getOverdueTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0]

    const result = db.exec(`
      SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
             actual_complete_date, completion_note, remark, created_at, updated_at
      FROM tasks
      WHERE due_date < ? AND status NOT IN (1, 4)
      ORDER BY due_date ASC
    `, [today])

    if (!result.length) return []
    return result[0].values.map(rowToTask)
  }

  function importTasks(tasks: TaskFormData[]): number {
    let count = 0
    for (const task of tasks) {
      try {
        createTask(task)
        count++
      } catch (e) {
        logger.error('TaskRepo', 'Failed to import task', { task, error: e })
      }
    }
    return count
  }

  function clearAllTasks(): void {
    db.run('DELETE FROM tasks')
  }

  return {
    createTask,
    updateTask,
    deleteTask,
    getAllTasks,
    getTaskById,
    getTasksByDateRange,
    getTodayTasks,
    getOverdueTasks,
    importTasks,
    clearAllTasks
  }
}

export type TaskRepository = ReturnType<typeof createTaskRepository>
