<template>
  <!-- 加载中状态 -->
  <div v-if="initializing" class="loading-screen" style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #409eff;">
    <el-icon class="is-loading" :size="48"><Loading /></el-icon>
    <p style="font-size: 16px;">系统初始化中...</p>
  </div>

  <!-- 错误状态 -->
  <div v-else-if="initError" class="error-screen" style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #f56c6c;">
    <el-icon :size="48" color="#f56c6c"><Warning /></el-icon>
    <p style="font-size: 16px;">初始化失败</p>
    <p class="error-detail" style="font-size: 12px; color: #909399; max-width: 400px; text-align: center;">{{ initError }}</p>
    <el-button type="primary" @click="handleReset">重置数据库</el-button>
  </div>

  <!-- 未登录状态 -->
  <template v-else-if="!isLoggedIn">
    <router-view />
  </template>

  <!-- 已登录状态 -->
  <div v-else class="app-container">
    <el-menu
      :default-active="currentRoute"
      class="sidebar"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      :collapse="sidebarCollapsed"
      router
    >
      <div class="logo-container">
        <span v-if="!sidebarCollapsed" class="logo-text">法务管理系统</span>
        <span v-else class="logo-mini">法务</span>
      </div>

      <!-- 法务管理 -->
      <el-sub-menu index="legal">
        <template #title>
          <el-icon><Briefcase /></el-icon>
          <span>法务管理</span>
        </template>
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/legal/contract">
          <el-icon><Document /></el-icon>
          <span>合同管理</span>
        </el-menu-item>
        <el-menu-item index="/legal/case">
          <el-icon><Finished /></el-icon>
          <span>案件管理</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 工作计划 -->
      <el-sub-menu index="plan">
        <template #title>
          <el-icon><Calendar /></el-icon>
          <span>工作计划</span>
        </template>
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <span>计划明细</span>
        </el-menu-item>
        <el-menu-item index="/weekly">
          <el-icon><Calendar /></el-icon>
          <span>周计划</span>
        </el-menu-item>
        <el-menu-item index="/monthly">
          <el-icon><Calendar /></el-icon>
          <span>月计划</span>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>统计图表</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 系统管理 -->
      <el-sub-menu index="system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </template>
        <el-menu-item index="/system/department">
          <el-icon><OfficeBuilding /></el-icon>
          <span>部门管理</span>
        </el-menu-item>
        <el-menu-item index="/system/role">
          <el-icon><UserFilled /></el-icon>
          <span>角色管理</span>
        </el-menu-item>
        <el-menu-item index="/system/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 设置 -->
      <el-menu-item index="/settings">
        <el-icon><Tools /></el-icon>
        <span>设置</span>
      </el-menu-item>
    </el-menu>

    <div class="main-container">
      <header class="main-header">
        <div class="header-left">
          <el-button
            :icon="sidebarCollapsed ? Expand : Fold"
            @click="sidebarCollapsed = !sidebarCollapsed"
            text
          />
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ userStore.currentUser?.realName?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.currentUser?.realName || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/settings')">
                  <el-icon><Setting /></el-icon>设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Fold, Expand, ArrowDown,
  Briefcase, DataBoard, Document, Finished,
  Calendar, List, TrendCharts,
  Setting, OfficeBuilding, UserFilled, User,
  Tools, SwitchButton, Loading, Warning
} from '@element-plus/icons-vue'
import { useTaskStore, useUserStore } from '@/stores'
import { initDatabase, resetDatabase } from '@/database'
import { logger } from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const userStore = useUserStore()

const sidebarCollapsed = ref(false)
const initializing = ref(true)
const initError = ref<string | null>(null)
const currentRoute = computed(() => route.path)
const isLoggedIn = computed(() => userStore.isAuthenticated)

const pageTitle = computed(() => {
  return route.meta.title as string || '法务管理系统'
})

async function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function handleReset() {
  resetDatabase()
  window.location.reload()
}

onMounted(async () => {
  // Expose resetDatabase for debugging
  ;(window as any).resetDatabase = resetDatabase

  try {
    await initDatabase()
    userStore.loadCurrentUser()

    // Initialize stores
    await Promise.all([
      taskStore.init(),
      userStore.init()
    ])
  } catch (error) {
    logger.error('App', 'Initialization failed', error)
    initError.value = String(error)
  } finally {
    initializing.value = false
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.loading-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #409eff;
}

.loading-screen p {
  font-size: 16px;
}

.error-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #f56c6c;
}

.error-screen p {
  font-size: 14px;
  max-width: 400px;
  text-align: center;
}

.error-detail {
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}
</style>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar {
  width: 220px;
  height: 100%;
  border-right: none;
  transition: width 0.3s;
}

.sidebar.el-menu--collapse {
  width: 64px;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #3a4750;
  background-color: #263445;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.logo-mini {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f0f2f5;
}

.main-header {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.avatar {
  background-color: #409eff;
  color: #fff;
}

.user-name {
  color: #303133;
  font-size: 14px;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}
</style>
