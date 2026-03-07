import type { Migration } from './index'

export const V1_Initial: Migration = {
  version: 1,
  name: 'initial',

  up: (db) => {
    // 创建版本表
    db.run(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建设置表
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建原有任务表 (保持兼容)
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status INTEGER DEFAULT 3,
        plan_detail TEXT NOT NULL,
        quadrant INTEGER DEFAULT 1,
        start_date DATE,
        due_date DATE,
        progress INTEGER DEFAULT 0,
        actual_complete_date DATE,
        completion_note TEXT,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_quadrant ON tasks(quadrant)`)
  },

  down: (db) => {
    db.run(`DROP TABLE IF EXISTS tasks`)
    db.run(`DROP TABLE IF EXISTS settings`)
    db.run(`DROP TABLE IF EXISTS schema_version`)
  }
}
