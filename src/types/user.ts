import type { BaseEntity, CommonStatus } from './common'

// 部门接口
export interface Department extends BaseEntity {
  name: string
  code: string
  parentId: number | null
  sortOrder: number
  status: CommonStatus
  managerId: number | null
  description: string | null
}

export interface DepartmentFormData {
  name: string
  code: string
  parentId: number | null
  sortOrder: number
  status: CommonStatus
  managerId: number | null
  description: string | null
}

// 角色类型
export enum RoleType {
  ADMIN = 'admin',
  MANAGER = 'manager',
  LEGAL_STAFF = 'legal_staff',
  VIEWER = 'viewer'
}

export const roleTypeLabels: Record<RoleType, string> = {
  [RoleType.ADMIN]: '系统管理员',
  [RoleType.MANAGER]: '部门经理',
  [RoleType.LEGAL_STAFF]: '法务专员',
  [RoleType.VIEWER]: '普通用户'
}

// 角色接口
export interface Role extends BaseEntity {
  name: string
  code: RoleType
  description: string | null
  status: CommonStatus
  permissions: string[] // 权限代码列表
}

export interface RoleFormData {
  name: string
  code: RoleType
  description: string | null
  status: CommonStatus
  permissions: string[]
}

// 用户接口
export interface User extends BaseEntity {
  username: string
  password: string // 加密存储
  realName: string
  email: string | null
  phone: string | null
  departmentId: number | null
  roleId: number | null
  status: CommonStatus
  lastLoginAt: string | null
  avatar: string | null
}

export interface UserFormData {
  username: string
  password?: string
  realName: string
  email: string | null
  phone: string | null
  departmentId: number | null
  roleId: number | null
  status: CommonStatus
  avatar: string | null
}

// 登录表单
export interface LoginForm {
  username: string
  password: string
  rememberMe?: boolean
}

// 登录响应
export interface LoginResponse {
  user: User
  token: string
}

// 当前用户信息
export interface CurrentUser {
  id: number
  username: string
  realName: string
  departmentId: number | null
  roleId: number | null
  roleCode: RoleType | null
  permissions: string[]
  departmentName?: string
  roleName?: string
}

// 权限常量
export const Permissions = {
  // 用户管理
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // 部门管理
  DEPARTMENT_VIEW: 'department:view',
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_UPDATE: 'department:update',
  DEPARTMENT_DELETE: 'department:delete',

  // 角色管理
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  // 合同管理
  CONTRACT_VIEW: 'contract:view',
  CONTRACT_CREATE: 'contract:create',
  CONTRACT_UPDATE: 'contract:update',
  CONTRACT_DELETE: 'contract:delete',
  CONTRACT_REVIEW: 'contract:review',

  // 案件管理
  CASE_VIEW: 'case:view',
  CASE_CREATE: 'case:create',
  CASE_UPDATE: 'case:update',
  CASE_DELETE: 'case:delete',

  // 工作任务
  TASK_VIEW: 'task:view',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',

  // 数据看板
  DASHBOARD_VIEW: 'dashboard:view'
} as const

export type Permission = typeof Permissions[keyof typeof Permissions]
