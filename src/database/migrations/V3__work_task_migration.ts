import type { Migration } from './index'

export const V3_WorkTaskMigration: Migration = {
  version: 3,
  name: 'work_task_migration',

  up: (db) => {
    // 创建新的工作任务表
    db.run(`
      CREATE TABLE IF NOT EXISTS work_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status INTEGER DEFAULT 3,
        plan_detail TEXT NOT NULL,
        quadrant INTEGER DEFAULT 1,
        task_type TEXT DEFAULT 'general',
        priority TEXT DEFAULT 'medium',
        start_date DATE,
        due_date DATE,
        progress INTEGER DEFAULT 0,
        actual_complete_date DATE,
        completion_note TEXT,
        remark TEXT,
        link_id INTEGER,
        link_type TEXT,
        assignee_id INTEGER,
        department_id INTEGER,
        created_by INTEGER,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignee_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `)

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON work_tasks(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_tasks_task_type ON work_tasks(task_type)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_tasks_priority ON work_tasks(priority)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee_id ON work_tasks(assignee_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_tasks_department_id ON work_tasks(department_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_tasks_link ON work_tasks(link_id, link_type)`)

    // 迁移原有tasks表数据到work_tasks
    db.run(`
      INSERT INTO work_tasks (id, status, plan_detail, quadrant, start_date, due_date, progress,
                              actual_complete_date, completion_note, remark, created_at, updated_at)
      SELECT id, status, plan_detail, quadrant, start_date, due_date, progress,
             actual_complete_date, completion_note, remark, created_at, updated_at
      FROM tasks
    `)

    // 注意: 保留原有tasks表以保持兼容性，但新功能使用work_tasks
  },

  down: (db) => {
    db.run(`DROP TABLE IF EXISTS work_tasks`)
  }
}
