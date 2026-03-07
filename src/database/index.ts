import * as initSqlJsModule from 'sql.js'
import type { Task, TaskFormData } from '@/types'
import { TaskStatus, QuadrantType } from '@/types'
import { V1_Initial, V2_LegalSystem, V3_WorkTaskMigration } from './migrations'
import type { Migration } from './migrations'
import { createUserRepository, type UserRepository } from './repositories/userRepository'
import { createContractRepository, type ContractRepository } from './repositories/contractRepository'
import { createCaseRepository, type CaseRepository } from './repositories/caseRepository'

// Handle different export formats
const initSqlJs = (initSqlJsModule as any).default || initSqlJsModule

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => Database;
}

export interface Database {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string, params?: unknown[]): QueryExecResult[];
  prepare(sql: string): Statement;
  export(): Uint8Array;
  close(): void;
}

interface Statement {
  run(params?: unknown[]): void;
  free(): boolean;
}

interface QueryExecResult {
  columns: string[];
  values: unknown[][];
}

let SQL: SqlJsStatic | null = null
let db: Database | null = null

// Repository instances
let _userRepository: UserRepository | null = null
let _contractRepository: ContractRepository | null = null
let _caseRepository: CaseRepository | null = null

// 获取数据库版本
function getDatabaseVersion(): number {
  if (!db) return 0

  try {
    const result = db.exec('SELECT MAX(version) FROM schema_version')
    if (result.length && result[0].values.length && result[0].values[0][0]) {
      return result[0].values[0][0] as number
    }
  } catch {
    // 版本表不存在，说明是旧数据库
  }
  return 0
}

// 执行迁移
function runMigrations(currentVersion: number): void {
  const migrations: Migration[] = [V1_Initial, V2_LegalSystem, V3_WorkTaskMigration]
    .sort((a, b) => a.version - b.version)

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration: ${migration.name} (v${migration.version})`)
      migration.up(db!)

      // 记录版本 (V1 在 initDatabase 中已经处理)
      db!.run(
        `INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, datetime('now'))`,
        [migration.version]
      )
    }
  }
}

// 初始化数据库
export async function initDatabase(): Promise<void> {
  if (db) return

  console.log('Initializing database...')

  try {
    // 手动加载 WASM 文件
    console.log('Fetching WASM file...')
    const wasmResponse = await fetch('/sql-wasm-browser.wasm')
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM: ${wasmResponse.status}`)
    }
    const wasmBinary = await wasmResponse.arrayBuffer()
    console.log('WASM file loaded, size:', wasmBinary.byteLength)

    // 初始化 sql.js
    SQL = await initSqlJs({
      wasmBinary: wasmBinary
    })
    console.log('sql.js initialized successfully')
  } catch (error) {
    console.error('Failed to initialize sql.js:', error)
    throw new Error('无法加载数据库引擎: ' + (error as Error).message)
  }

  // 尝试从 localStorage 加载已有数据库
  const savedDb = localStorage.getItem('workPlanDb')
  if (savedDb) {
    console.log('Loading existing database from localStorage')
    const uint8Array = new Uint8Array(JSON.parse(savedDb))
    db = new SQL.Database(uint8Array)
  } else {
    console.log('Creating new database')
    db = new SQL.Database()
    // 创建版本表
    db.run(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    db.run(`INSERT INTO schema_version (version) VALUES (0)`)
  }

  // 执行迁移
  const currentVersion = getDatabaseVersion()
  console.log('Current database version:', currentVersion)
  runMigrations(currentVersion)

  // 初始化 Repository
  initRepositories()

  saveDatabase()
  console.log('Database initialization complete')
}

// 初始化 Repository
function initRepositories(): void {
  if (!db) return
  _userRepository = createUserRepository(db)
  _contractRepository = createContractRepository(db)
  _caseRepository = createCaseRepository(db)
}

// 获取 Repository
export function getUserRepository(): UserRepository {
  if (!_userRepository) throw new Error('Database not initialized')
  return _userRepository
}

export function getContractRepository(): ContractRepository {
  if (!_contractRepository) throw new Error('Database not initialized')
  return _contractRepository
}

export function getCaseRepository(): CaseRepository {
  if (!_caseRepository) throw new Error('Database not initialized')
  return _caseRepository
}

// 保存数据库到 localStorage
export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const arr = Array.from(data)
  localStorage.setItem('workPlanDb', JSON.stringify(arr))
}

// 重置数据库 (清除所有数据)
export function resetDatabase(): void {
  localStorage.removeItem('workPlanDb')
  localStorage.removeItem('currentUser')
  db = null
  _userRepository = null
  _contractRepository = null
  _caseRepository = null
  console.log('Database has been reset. Please refresh the page.')
}

// 导出数据库文件
export function exportDatabase(): Uint8Array {
  if (!db) throw new Error('Database not initialized')
  return db.export()
}

// 导入数据库文件
export function importDatabase(data: Uint8Array): void {
  if (!SQL) throw new Error('SQL.js not initialized')
  db = new SQL.Database(data)
  initRepositories()
  saveDatabase()
}

// ============================================
// 原有任务相关函数 (保持向后兼容)
// ============================================

// 创建任务
export function createTask(task: TaskFormData): number {
  if (!db) throw new Error('Database not initialized')

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
  saveDatabase()

  const result = db.exec('SELECT last_insert_rowid()')
  return result[0]?.values[0]?.[0] as number || 0
}

// 更新任务
export function updateTask(id: number, task: Partial<TaskFormData>): void {
  if (!db) throw new Error('Database not initialized')

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

  updates.push('updated_at = datetime("now")')
  values.push(id)

  db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values)
  saveDatabase()
}

// 删除任务
export function deleteTask(id: number): void {
  if (!db) throw new Error('Database not initialized')
  db.run('DELETE FROM tasks WHERE id = ?', [id])
  saveDatabase()
}

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

// 获取所有任务
export function getAllTasks(): Task[] {
  if (!db) throw new Error('Database not initialized')

  const result = db.exec(`
    SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
           actual_complete_date, completion_note, remark, created_at, updated_at
    FROM tasks
    ORDER BY created_at DESC
  `)

  if (!result.length) return []

  return result[0].values.map(rowToTask)
}

// 根据ID获取任务
export function getTaskById(id: number): Task | null {
  if (!db) throw new Error('Database not initialized')

  const result = db.exec(`
    SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
           actual_complete_date, completion_note, remark, created_at, updated_at
    FROM tasks WHERE id = ?
  `, [id])

  if (!result.length || !result[0].values.length) return null

  return rowToTask(result[0].values[0])
}

// 根据日期范围获取任务
export function getTasksByDateRange(startDate: string, endDate: string): Task[] {
  if (!db) throw new Error('Database not initialized')

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

// 获取今日任务
export function getTodayTasks(): Task[] {
  const today = new Date().toISOString().split('T')[0]
  return getTasksByDateRange(today, today)
}

// 获取逾期任务
export function getOverdueTasks(): Task[] {
  if (!db) throw new Error('Database not initialized')

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

// 批量导入任务
export function importTasks(tasks: TaskFormData[]): number {
  if (!db) throw new Error('Database not initialized')

  let count = 0
  for (const task of tasks) {
    try {
      createTask(task)
      count++
    } catch (e) {
      console.error('Failed to import task:', task, e)
    }
  }
  return count
}

// 清空所有任务
export function clearAllTasks(): void {
  if (!db) throw new Error('Database not initialized')
  db.run('DELETE FROM tasks')
  saveDatabase()
}

// 获取设置
export function getSetting(key: string): string | null {
  if (!db) throw new Error('Database not initialized')

  const result = db.exec('SELECT value FROM settings WHERE key = ?', [key])
  if (!result.length || !result[0].values.length) return null
  return result[0].values[0][0] as string
}

// 保存设置
export function setSetting(key: string, value: string): void {
  if (!db) throw new Error('Database not initialized')

  db.run(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime("now")
  `, [key, value, value])
  saveDatabase()
}
