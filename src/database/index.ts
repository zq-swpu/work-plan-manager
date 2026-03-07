import * as initSqlJsModule from 'sql.js'
import type { Task, TaskFormData } from '@/types'
import { V1_Initial, V2_LegalSystem, V3_WorkTaskMigration } from './migrations'
import type { Migration } from './migrations'
import { createUserRepository, type UserRepository } from './repositories/userRepository'
import { createContractRepository, type ContractRepository } from './repositories/contractRepository'
import { createCaseRepository, type CaseRepository } from './repositories/caseRepository'
import { createTaskRepository, type TaskRepository } from './repositories/taskRepository'
import { logger } from '@/utils/logger'

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
let _taskRepository: TaskRepository | null = null

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
      logger.debug('DB', `Running migration: ${migration.name} (v${migration.version})`)
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

  try {
    // 手动加载 WASM 文件
    const wasmResponse = await fetch('/sql-wasm-browser.wasm')
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM: ${wasmResponse.status}`)
    }
    const wasmBinary = await wasmResponse.arrayBuffer()

    // 初始化 sql.js
    SQL = await initSqlJs({
      wasmBinary: wasmBinary
    })
  } catch (error) {
    logger.error('DB', 'Failed to initialize sql.js', error)
    throw new Error('无法加载数据库引擎: ' + (error as Error).message)
  }

  // 尝试从 localStorage 加载已有数据库
  const savedDb = localStorage.getItem('workPlanDb')
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb))
    db = new SQL!.Database(uint8Array)
  } else {
    db = new SQL!.Database()
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
  runMigrations(currentVersion)

  // 初始化 Repository
  initRepositories()

  saveDatabase()
}

// 初始化 Repository
function initRepositories(): void {
  if (!db) return
  _userRepository = createUserRepository(db)
  _contractRepository = createContractRepository(db)
  _caseRepository = createCaseRepository(db)
  _taskRepository = createTaskRepository(db)
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

export function getTaskRepository(): TaskRepository {
  if (!_taskRepository) throw new Error('Database not initialized')
  return _taskRepository
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
  _taskRepository = null
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
// 任务相关函数 (委托到 taskRepository)
// ============================================

export function createTask(task: TaskFormData): number {
  const id = getTaskRepository().createTask(task)
  saveDatabase()
  return id
}

export function updateTask(id: number, task: Partial<TaskFormData>): void {
  getTaskRepository().updateTask(id, task)
  saveDatabase()
}

export function deleteTask(id: number): void {
  getTaskRepository().deleteTask(id)
  saveDatabase()
}

export function getAllTasks(): Task[] {
  return getTaskRepository().getAllTasks()
}

export function getTaskById(id: number): Task | null {
  return getTaskRepository().getTaskById(id)
}

export function getTasksByDateRange(startDate: string, endDate: string): Task[] {
  return getTaskRepository().getTasksByDateRange(startDate, endDate)
}

export function getTodayTasks(): Task[] {
  return getTaskRepository().getTodayTasks()
}

export function getOverdueTasks(): Task[] {
  return getTaskRepository().getOverdueTasks()
}

export function importTasks(tasks: TaskFormData[]): number {
  const count = getTaskRepository().importTasks(tasks)
  saveDatabase()
  return count
}

export function clearAllTasks(): void {
  getTaskRepository().clearAllTasks()
  saveDatabase()
}

// ============================================
// 设置相关函数
// ============================================
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
