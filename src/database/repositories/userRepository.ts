import type { Database } from '../index'
import type {
  User, UserFormData,
  Department, DepartmentFormData,
  Role, RoleFormData,
  CurrentUser
} from '@/types'
import { CommonStatus, RoleType } from '@/types'
import CryptoJS from 'crypto-js'

// 用户相关操作
export function createUserRepository(db: Database) {
  // ========== 部门操作 ==========

  function getAllDepartments(): Department[] {
    const result = db.exec(`
      SELECT id, name, code, parent_id, sort_order, status, manager_id, description,
             created_at, updated_at
      FROM departments
      ORDER BY sort_order ASC
    `)
    if (!result.length) return []
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      code: row[2] as string,
      parentId: row[3] as number | null,
      sortOrder: row[4] as number,
      status: row[5] as CommonStatus,
      managerId: row[6] as number | null,
      description: row[7] as string | null,
      createdAt: row[8] as string,
      updatedAt: row[9] as string
    }))
  }

  function getDepartmentById(id: number): Department | null {
    const result = db.exec(`
      SELECT id, name, code, parent_id, sort_order, status, manager_id, description,
             created_at, updated_at
      FROM departments WHERE id = ?
    `, [id])
    if (!result.length || !result[0].values.length) return null
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      name: row[1] as string,
      code: row[2] as string,
      parentId: row[3] as number | null,
      sortOrder: row[4] as number,
      status: row[5] as CommonStatus,
      managerId: row[6] as number | null,
      description: row[7] as string | null,
      createdAt: row[8] as string,
      updatedAt: row[9] as string
    }
  }

  function createDepartment(data: DepartmentFormData): number {
    db.run(`
      INSERT INTO departments (name, code, parent_id, sort_order, status, manager_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [data.name, data.code, data.parentId, data.sortOrder, data.status, data.managerId, data.description])
    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  function updateDepartment(id: number, data: Partial<DepartmentFormData>): void {
    const updates: string[] = []
    const values: unknown[] = []

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
    if (data.code !== undefined) { updates.push('code = ?'); values.push(data.code) }
    if (data.parentId !== undefined) { updates.push('parent_id = ?'); values.push(data.parentId) }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder) }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }
    if (data.managerId !== undefined) { updates.push('manager_id = ?'); values.push(data.managerId) }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(id)
      db.run(`UPDATE departments SET ${updates.join(', ')} WHERE id = ?`, values)
    }
  }

  function deleteDepartment(id: number): void {
    db.run('DELETE FROM departments WHERE id = ?', [id])
  }

  // ========== 角色操作 ==========

  function getAllRoles(): Role[] {
    const result = db.exec(`
      SELECT id, name, code, description, status, permissions, created_at, updated_at
      FROM roles
      ORDER BY id ASC
    `)
    if (!result.length) return []
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      code: row[2] as RoleType,
      description: row[3] as string | null,
      status: row[4] as CommonStatus,
      permissions: JSON.parse(row[5] as string || '[]'),
      createdAt: row[6] as string,
      updatedAt: row[7] as string
    }))
  }

  function getRoleById(id: number): Role | null {
    const result = db.exec(`
      SELECT id, name, code, description, status, permissions, created_at, updated_at
      FROM roles WHERE id = ?
    `, [id])
    if (!result.length || !result[0].values.length) return null
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      name: row[1] as string,
      code: row[2] as RoleType,
      description: row[3] as string | null,
      status: row[4] as CommonStatus,
      permissions: JSON.parse(row[5] as string || '[]'),
      createdAt: row[6] as string,
      updatedAt: row[7] as string
    }
  }

  function createRole(data: RoleFormData): number {
    db.run(`
      INSERT INTO roles (name, code, description, status, permissions)
      VALUES (?, ?, ?, ?, ?)
    `, [data.name, data.code, data.description, data.status, JSON.stringify(data.permissions)])
    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  function updateRole(id: number, data: Partial<RoleFormData>): void {
    const updates: string[] = []
    const values: unknown[] = []

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
    if (data.code !== undefined) { updates.push('code = ?'); values.push(data.code) }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }
    if (data.permissions !== undefined) { updates.push('permissions = ?'); values.push(JSON.stringify(data.permissions)) }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(id)
      db.run(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, values)
    }
  }

  function deleteRole(id: number): void {
    db.run('DELETE FROM roles WHERE id = ?', [id])
  }

  // ========== 用户操作 ==========

  // 密码哈希盐值（在实际应用中应该每个用户使用不同的盐值）
  const SALT = 'work-plan-manager-2024'

  function hashPassword(password: string): string {
    // 使用 SHA-256 并添加盐值增强安全性
    return CryptoJS.SHA256(password + SALT).toString()
  }

  function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash
  }

  // 检查是否是旧版 MD5 哈希格式（用于迁移兼容）
  function isLegacyMd5Hash(hash: string): boolean {
    return hash.length === 32 && /^[a-f0-9]{32}$/.test(hash)
  }

  // 验证密码（支持新旧格式）
  function verifyPasswordWithMigration(password: string, hash: string): boolean {
    // 如果是旧版 MD5 格式，使用 MD5 验证
    if (isLegacyMd5Hash(hash)) {
      const md5Hash = CryptoJS.MD5(password).toString()
      return md5Hash === hash
    }
    // 否则使用新的 SHA-256 格式
    return verifyPassword(password, hash)
  }

  function getAllUsers(): User[] {
    const result = db.exec(`
      SELECT id, username, password, real_name, email, phone, department_id, role_id,
             status, last_login_at, avatar, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `)
    if (!result.length) return []
    return result[0].values.map(row => ({
      id: row[0] as number,
      username: row[1] as string,
      password: row[2] as string,
      realName: row[3] as string,
      email: row[4] as string | null,
      phone: row[5] as string | null,
      departmentId: row[6] as number | null,
      roleId: row[7] as number | null,
      status: row[8] as CommonStatus,
      lastLoginAt: row[9] as string | null,
      avatar: row[10] as string | null,
      createdAt: row[11] as string,
      updatedAt: row[12] as string
    }))
  }

  function getUserById(id: number): User | null {
    const result = db.exec(`
      SELECT id, username, password, real_name, email, phone, department_id, role_id,
             status, last_login_at, avatar, created_at, updated_at
      FROM users WHERE id = ?
    `, [id])
    if (!result.length || !result[0].values.length) return null
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      username: row[1] as string,
      password: row[2] as string,
      realName: row[3] as string,
      email: row[4] as string | null,
      phone: row[5] as string | null,
      departmentId: row[6] as number | null,
      roleId: row[7] as number | null,
      status: row[8] as CommonStatus,
      lastLoginAt: row[9] as string | null,
      avatar: row[10] as string | null,
      createdAt: row[11] as string,
      updatedAt: row[12] as string
    }
  }

  function getUserByUsername(username: string): User | null {
    const result = db.exec(`
      SELECT id, username, password, real_name, email, phone, department_id, role_id,
             status, last_login_at, avatar, created_at, updated_at
      FROM users WHERE username = ?
    `, [username])
    if (!result.length || !result[0].values.length) return null
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      username: row[1] as string,
      password: row[2] as string,
      realName: row[3] as string,
      email: row[4] as string | null,
      phone: row[5] as string | null,
      departmentId: row[6] as number | null,
      roleId: row[7] as number | null,
      status: row[8] as CommonStatus,
      lastLoginAt: row[9] as string | null,
      avatar: row[10] as string | null,
      createdAt: row[11] as string,
      updatedAt: row[12] as string
    }
  }

  function createUser(data: UserFormData): number {
    const password = data.password ? hashPassword(data.password) : hashPassword('123456')
    db.run(`
      INSERT INTO users (username, password, real_name, email, phone, department_id, role_id, status, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.username, password, data.realName, data.email, data.phone, data.departmentId, data.roleId, data.status, data.avatar])
    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  function updateUser(id: number, data: Partial<UserFormData>): void {
    const updates: string[] = []
    const values: unknown[] = []

    if (data.username !== undefined) { updates.push('username = ?'); values.push(data.username) }
    if (data.password !== undefined && data.password) { updates.push('password = ?'); values.push(hashPassword(data.password)) }
    if (data.realName !== undefined) { updates.push('real_name = ?'); values.push(data.realName) }
    if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email) }
    if (data.phone !== undefined) { updates.push('phone = ?'); values.push(data.phone) }
    if (data.departmentId !== undefined) { updates.push('department_id = ?'); values.push(data.departmentId) }
    if (data.roleId !== undefined) { updates.push('role_id = ?'); values.push(data.roleId) }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }
    if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar) }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(id)
      db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
    }
  }

  function deleteUser(id: number): void {
    db.run('DELETE FROM users WHERE id = ?', [id])
  }

  function updateLastLogin(id: number): void {
    db.run(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`, [id])
  }

  function authenticate(username: string, password: string): User | null {
    const user = getUserByUsername(username)
    if (!user) return null
    if (!verifyPasswordWithMigration(password, user.password)) return null
    if (user.status !== CommonStatus.ENABLED) return null
    // 如果是旧版 MD5 哈希，自动升级为新的 SHA-256 格式
    if (isLegacyMd5Hash(user.password)) {
      const newHash = hashPassword(password)
      db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id])
    }
    updateLastLogin(user.id)
    return user
  }

  function getCurrentUser(userId: number): CurrentUser | null {
    const user = getUserById(userId)
    if (!user) return null

    const role = user.roleId ? getRoleById(user.roleId) : null
    const department = user.departmentId ? getDepartmentById(user.departmentId) : null

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      departmentId: user.departmentId,
      roleId: user.roleId,
      roleCode: role?.code || null,
      permissions: role?.permissions || [],
      departmentName: department?.name,
      roleName: role?.name
    }
  }

  return {
    // Department
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    // Role
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    // User
    getAllUsers,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser,
    updateLastLogin,
    authenticate,
    getCurrentUser,
    hashPassword,
    verifyPassword
  }
}

export type UserRepository = ReturnType<typeof createUserRepository>
