import type { Database } from '../index'
import { V1_Initial } from './V1__initial'
import { V2_LegalSystem } from './V2__legal_system'
import { V3_WorkTaskMigration } from './V3__work_task_migration'
import { logger } from '@/utils/logger'

export interface Migration {
  version: number
  name: string
  up: (db: Database) => void
  down?: (db: Database) => void
}

// 导出所有迁移
export { V1_Initial, V2_LegalSystem, V3_WorkTaskMigration }

// 获取所有迁移按版本号排序
export function getAllMigrations(): Migration[] {
  return [
    V1_Initial,
    V2_LegalSystem,
    V3_WorkTaskMigration
  ].sort((a, b) => a.version - b.version)
}

// 执行迁移
export function runMigrations(db: Database, migrations: Migration[], currentVersion: number): void {
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      logger.debug('Migration', `Running: ${migration.name} (v${migration.version})`)
      migration.up(db)
      // 更新版本号
      db.run(
        `INSERT INTO schema_version (version, applied_at) VALUES (?, datetime('now'))`,
        [migration.version]
      )
    }
  }
}
