import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserFormData, Department, DepartmentFormData, Role, RoleFormData, CurrentUser, LoginForm } from '@/types'
import { RoleType } from '@/types'
import { getUserRepository, saveDatabase } from '@/database'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<CurrentUser | null>(null)
  const users = ref<User[]>([])
  const departments = ref<Department[]>([])
  const roles = ref<Role[]>([])
  const isLoading = ref(false)
  const isAuthenticated = computed(() => currentUser.value !== null)

  // ========== 认证相关 ==========

  async function login(form: LoginForm): Promise<boolean> {
    isLoading.value = true
    try {
      const repo = getUserRepository()
      console.log('Attempting login for user:', form.username)
      const user = repo.authenticate(form.username, form.password)
      console.log('Authentication result:', user ? 'success' : 'failed')
      if (user) {
        const current = repo.getCurrentUser(user.id)
        if (current) {
          currentUser.value = current
          // 保存到 localStorage
          localStorage.setItem('currentUser', JSON.stringify(current))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout(): void {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  function loadCurrentUser(): void {
    const saved = localStorage.getItem('currentUser')
    if (saved) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem('currentUser')
      }
    }
  }

  function hasPermission(permission: string): boolean {
    if (!currentUser.value) return false
    if (currentUser.value.permissions.includes('*')) return true
    if (currentUser.value.permissions.includes(permission)) return true
    // 检查通配符权限 (e.g., "contract:*")
    const parts = permission.split(':')
    if (parts.length === 2) {
      const wildcard = `${parts[0]}:*`
      if (currentUser.value.permissions.includes(wildcard)) return true
    }
    return false
  }

  function isAdmin(): boolean {
    return currentUser.value?.roleCode === RoleType.ADMIN
  }

  // ========== 部门管理 ==========

  async function loadDepartments(): Promise<void> {
    const repo = getUserRepository()
    departments.value = repo.getAllDepartments()
  }

  async function createDepartment(data: DepartmentFormData): Promise<number> {
    const repo = getUserRepository()
    const id = repo.createDepartment(data)
    saveDatabase()
    await loadDepartments()
    return id
  }

  async function updateDepartment(id: number, data: Partial<DepartmentFormData>): Promise<void> {
    const repo = getUserRepository()
    repo.updateDepartment(id, data)
    saveDatabase()
    await loadDepartments()
  }

  async function deleteDepartment(id: number): Promise<void> {
    const repo = getUserRepository()
    repo.deleteDepartment(id)
    saveDatabase()
    await loadDepartments()
  }

  function getDepartmentName(id: number | null): string {
    if (!id) return '-'
    const dept = departments.value.find(d => d.id === id)
    return dept?.name || '-'
  }

  // ========== 角色管理 ==========

  async function loadRoles(): Promise<void> {
    const repo = getUserRepository()
    roles.value = repo.getAllRoles()
  }

  async function createRole(data: RoleFormData): Promise<number> {
    const repo = getUserRepository()
    const id = repo.createRole(data)
    saveDatabase()
    await loadRoles()
    return id
  }

  async function updateRole(id: number, data: Partial<RoleFormData>): Promise<void> {
    const repo = getUserRepository()
    repo.updateRole(id, data)
    saveDatabase()
    await loadRoles()
  }

  async function deleteRole(id: number): Promise<void> {
    const repo = getUserRepository()
    repo.deleteRole(id)
    saveDatabase()
    await loadRoles()
  }

  function getRoleName(id: number | null): string {
    if (!id) return '-'
    const role = roles.value.find(r => r.id === id)
    return role?.name || '-'
  }

  // ========== 用户管理 ==========

  async function loadUsers(): Promise<void> {
    const repo = getUserRepository()
    users.value = repo.getAllUsers()
  }

  async function createUser(data: UserFormData): Promise<number> {
    const repo = getUserRepository()
    const id = repo.createUser(data)
    saveDatabase()
    await loadUsers()
    return id
  }

  async function updateUser(id: number, data: Partial<UserFormData>): Promise<void> {
    const repo = getUserRepository()
    repo.updateUser(id, data)
    saveDatabase()
    await loadUsers()
  }

  async function deleteUser(id: number): Promise<void> {
    const repo = getUserRepository()
    repo.deleteUser(id)
    saveDatabase()
    await loadUsers()
  }

  function getUserName(id: number | null): string {
    if (!id) return '-'
    const user = users.value.find(u => u.id === id)
    return user?.realName || '-'
  }

  // ========== 初始化 ==========

  async function init(): Promise<void> {
    loadCurrentUser()
    await Promise.all([
      loadDepartments(),
      loadRoles(),
      loadUsers()
    ])
  }

  return {
    // State
    currentUser,
    users,
    departments,
    roles,
    isLoading,
    isAuthenticated,
    // Auth
    login,
    logout,
    loadCurrentUser,
    hasPermission,
    isAdmin,
    // Department
    loadDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentName,
    // Role
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    getRoleName,
    // User
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserName,
    // Init
    init
  }
})
