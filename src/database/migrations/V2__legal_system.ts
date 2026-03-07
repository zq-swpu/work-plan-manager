import type { Migration } from './index'

export const V2_LegalSystem: Migration = {
  version: 2,
  name: 'legal_system',

  up: (db) => {
    // 部门表
    db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        parent_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        manager_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES departments(id)
      )
    `)

    // 角色表
    db.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        status INTEGER DEFAULT 1,
        permissions TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 用户表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        real_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        department_id INTEGER,
        role_id INTEGER,
        status INTEGER DEFAULT 1,
        last_login_at DATETIME,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `)

    // 合同表
    db.run(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        party_a TEXT NOT NULL,
        party_b TEXT NOT NULL,
        party_b_contact TEXT,
        party_b_phone TEXT,
        signed_date DATE,
        start_date DATE,
        end_date DATE,
        amount REAL,
        currency TEXT DEFAULT 'CNY',
        subject TEXT NOT NULL,
        content TEXT,
        risk_level TEXT DEFAULT 'low',
        risk_note TEXT,
        remark TEXT,
        attachment_path TEXT,
        owner_id INTEGER,
        department_id INTEGER,
        created_by INTEGER,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `)

    // 合同审核记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS contract_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewer_name TEXT NOT NULL,
        review_date DATE NOT NULL,
        review_result TEXT NOT NULL,
        review_opinion TEXT,
        risk_assessment TEXT,
        risk_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id),
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
      )
    `)

    // 案件表
    db.run(`
      CREATE TABLE IF NOT EXISTS lawsuit_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        stage TEXT DEFAULT 'preparation',
        our_role TEXT NOT NULL,
        our_party TEXT NOT NULL,
        our_representative TEXT,
        opponent_role TEXT NOT NULL,
        opponent_party TEXT NOT NULL,
        opponent_representative TEXT,
        court TEXT,
        judge TEXT,
        court_phone TEXT,
        subject_amount REAL,
        claimed_amount REAL,
        awarded_amount REAL,
        filing_date DATE,
        hearing_date DATE,
        closing_date DATE,
        cause TEXT NOT NULL,
        description TEXT,
        progress_note TEXT,
        remark TEXT,
        attachment_path TEXT,
        contract_id INTEGER,
        handler_id INTEGER,
        department_id INTEGER,
        created_by INTEGER,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id),
        FOREIGN KEY (handler_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `)

    // 案件进展表
    db.run(`
      CREATE TABLE IF NOT EXISTS case_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        progress_date DATE NOT NULL,
        stage TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        handler_id INTEGER,
        handler_name TEXT,
        attachment_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES lawsuit_cases(id),
        FOREIGN KEY (handler_id) REFERENCES users(id)
      )
    `)

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON contracts(owner_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_department_id ON contracts(department_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_risk_level ON contracts(risk_level)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_contract_reviews_contract_id ON contract_reviews(contract_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_cases_status ON lawsuit_cases(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_cases_type ON lawsuit_cases(type)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_cases_handler_id ON lawsuit_cases(handler_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_cases_department_id ON lawsuit_cases(department_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_case_progress_case_id ON case_progress(case_id)`)

    // 插入默认角色
    db.run(`
      INSERT INTO roles (name, code, description, status, permissions) VALUES
      ('系统管理员', 'admin', '系统管理员，拥有所有权限', 1, '["*"]'),
      ('部门经理', 'manager', '部门经理，拥有部门内所有权限', 1, '["user:view","contract:*","case:*","task:*","dashboard:view"]'),
      ('法务专员', 'legal_staff', '法务专员，负责合同和案件管理', 1, '["contract:view","contract:create","contract:update","contract:review","case:view","case:create","case:update","task:*","dashboard:view"]'),
      ('普通用户', 'viewer', '普通用户，仅查看权限', 1, '["contract:view","case:view","task:view","dashboard:view"]')
    `)

    // 插入默认部门
    db.run(`
      INSERT INTO departments (name, code, status, sort_order) VALUES
      ('法务部', 'LEGAL', 1, 1),
      ('综合部', 'GENERAL', 1, 2),
      ('财务部', 'FINANCE', 1, 3)
    `)

    // 插入默认管理员账号 (密码: admin123，使用简单哈希)
    db.run(`
      INSERT INTO users (username, password, real_name, department_id, role_id, status) VALUES
      ('admin', 'e10adc3949ba59abbe56e057f20f883e', '系统管理员', 1, 1, 1)
    `)
  },

  down: (db) => {
    db.run(`DROP TABLE IF EXISTS case_progress`)
    db.run(`DROP TABLE IF EXISTS lawsuit_cases`)
    db.run(`DROP TABLE IF EXISTS contract_reviews`)
    db.run(`DROP TABLE IF EXISTS contracts`)
    db.run(`DROP TABLE IF EXISTS users`)
    db.run(`DROP TABLE IF EXISTS roles`)
    db.run(`DROP TABLE IF EXISTS departments`)
  }
}
