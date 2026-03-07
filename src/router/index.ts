import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 认证路由
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { title: '登录', public: true }
    },

    // 主页 - 法务看板
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/legal/dashboard/LegalDashboard.vue'),
      meta: { title: '法务看板' }
    },

    // ========== 工作计划 ==========
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TaskList.vue'),
      meta: { title: '工作计划明细' }
    },
    {
      path: '/weekly',
      name: 'weekly',
      component: () => import('@/views/Weekly.vue'),
      meta: { title: '周计划' }
    },
    {
      path: '/monthly',
      name: 'monthly',
      component: () => import('@/views/Monthly.vue'),
      meta: { title: '月计划' }
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/Statistics.vue'),
      meta: { title: '统计图表' }
    },

    // ========== 合同管理 ==========
    {
      path: '/legal/contract',
      name: 'contract-list',
      component: () => import('@/views/legal/contract/ContractList.vue'),
      meta: { title: '合同管理' }
    },
    {
      path: '/legal/contract/create',
      name: 'contract-create',
      component: () => import('@/views/legal/contract/ContractForm.vue'),
      meta: { title: '新增合同' }
    },
    {
      path: '/legal/contract/:id',
      name: 'contract-detail',
      component: () => import('@/views/legal/contract/ContractDetail.vue'),
      meta: { title: '合同详情' }
    },
    {
      path: '/legal/contract/:id/edit',
      name: 'contract-edit',
      component: () => import('@/views/legal/contract/ContractForm.vue'),
      meta: { title: '编辑合同' }
    },

    // ========== 案件管理 ==========
    {
      path: '/legal/case',
      name: 'case-list',
      component: () => import('@/views/legal/case/CaseList.vue'),
      meta: { title: '案件管理' }
    },
    {
      path: '/legal/case/create',
      name: 'case-create',
      component: () => import('@/views/legal/case/CaseForm.vue'),
      meta: { title: '新增案件' }
    },
    {
      path: '/legal/case/:id',
      name: 'case-detail',
      component: () => import('@/views/legal/case/CaseDetail.vue'),
      meta: { title: '案件详情' }
    },
    {
      path: '/legal/case/:id/edit',
      name: 'case-edit',
      component: () => import('@/views/legal/case/CaseForm.vue'),
      meta: { title: '编辑案件' }
    },

    // ========== 系统管理 ==========
    {
      path: '/system/department',
      name: 'department',
      component: () => import('@/views/system/department/DepartmentList.vue'),
      meta: { title: '部门管理' }
    },
    {
      path: '/system/role',
      name: 'role',
      component: () => import('@/views/system/role/RoleList.vue'),
      meta: { title: '角色管理' }
    },
    {
      path: '/system/user',
      name: 'user',
      component: () => import('@/views/system/user/UserList.vue'),
      meta: { title: '用户管理' }
    },

    // 设置
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '法务管理系统'} - 法务管理系统`

  const userStore = useUserStore()

  // 公开页面不需要认证
  if (to.meta.public) {
    next()
    return
  }

  // 检查是否已登录
  if (!userStore.isAuthenticated) {
    userStore.loadCurrentUser()
  }

  if (!userStore.isAuthenticated && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router
