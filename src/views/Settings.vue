<template>
  <div class="settings-view">
    <el-card>
      <template #header>
        <span>系统设置</span>
      </template>

      <el-form label-width="120px">
        <el-form-item label="主题">
          <el-radio-group v-model="settings.theme" @change="handleSettingChange('theme', $event)">
            <el-radio label="light">浅色</el-radio>
            <el-radio label="dark">深色</el-radio>
            <el-radio label="auto">跟随系统</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="通知提醒">
          <el-switch
            v-model="settings.notificationEnabled"
            @change="handleSettingChange('notificationEnabled', $event)"
          />
        </el-form-item>

        <el-form-item label="提前提醒天数">
          <el-input-number
            v-model="settings.reminderDays"
            :min="0"
            :max="7"
            @change="handleSettingChange('reminderDays', $event)"
          />
          <span class="ml-2 text-gray-500">天</span>
        </el-form-item>

        <el-form-item label="语言">
          <el-select v-model="settings.language" @change="handleSettingChange('language', $event)">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据管理 -->
    <el-card class="mt-4">
      <template #header>
        <span>数据管理</span>
      </template>

      <div class="flex gap-4 flex-wrap">
        <el-button type="primary" @click="handleExportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="importDialogVisible = true">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
        <el-button type="warning" @click="handleBackup">
          <el-icon><DocumentCopy /></el-icon>
          备份数据库
        </el-button>
        <el-button type="danger" @click="handleClearData">
          <el-icon><Delete /></el-icon>
          清空所有数据
        </el-button>
      </div>
    </el-card>

    <!-- 关于 -->
    <el-card class="mt-4">
      <template #header>
        <span>关于</span>
      </template>
      <div class="text-gray-600">
        <p><strong>工作计划管理系统</strong></p>
        <p class="mt-2">版本：1.0.0</p>
        <p class="mt-2">基于 Vue 3 + Tauri 构建</p>
      </div>
    </el-card>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入数据" width="500px">
      <el-upload
        drag
        accept=".json,.db"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .json, .db 格式的备份文件
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingStore, useTaskStore } from '@/stores'
import { exportToExcel } from '@/utils/export'
import * as db from '@/database'

const settingStore = useSettingStore()
const taskStore = useTaskStore()

const settings = computed(() => settingStore.settings)
const importDialogVisible = ref(false)

function handleSettingChange(key: string, value: unknown) {
  settingStore.updateSetting(key as any, value as any)
  ElMessage.success('设置已保存')
}

async function handleExportData() {
  try {
    const tasks = await taskStore.exportAllTasks()
    await exportToExcel(tasks)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

async function handleFileChange(file: { raw: File }) {
  try {
    const fileName = file.raw.name.toLowerCase()

    // .db 文件 - 完整数据库备份
    if (fileName.endsWith('.db')) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        if (arrayBuffer) {
          await ElMessageBox.confirm(
            '导入数据库备份将覆盖当前所有数据，确定继续吗？',
            '警告',
            {
              confirmButtonText: '确定导入',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
          const data = new Uint8Array(arrayBuffer)
          db.importDatabase(data)
          importDialogVisible.value = false
          ElMessage.success('数据库导入成功，页面即将刷新')
          setTimeout(() => window.location.reload(), 1000)
        }
      }
      reader.readAsArrayBuffer(file.raw)
      return
    }

    // .json 文件 - 旧版任务数据
    if (fileName.endsWith('.json')) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          const tasks = JSON.parse(content)
          if (Array.isArray(tasks)) {
            const count = await taskStore.importTasks(tasks.map((t: Record<string, unknown>) => ({
              status: (t.status as number) ?? 3,
              planDetail: (t.planDetail as string) || '',
              quadrant: (t.quadrant as number) ?? 1,
              startDate: (t.startDate as string) || '',
              dueDate: (t.dueDate as string) || '',
              progress: (t.progress as number) ?? 0,
              actualCompleteDate: (t.actualCompleteDate as string) || '',
              completionNote: (t.completionNote as string) || '',
              remark: (t.remark as string) || ''
            })))
            importDialogVisible.value = false
            ElMessage.success(`成功导入 ${count} 条数据`)
          }
        }
      }
      reader.readAsText(file.raw)
      return
    }

    ElMessage.error('不支持的文件格式')
  } catch (error) {
    if ((error as any) !== 'cancel') {
      ElMessage.error('导入失败，请检查文件格式')
    }
  }
}

async function handleBackup() {
  try {
    const data = db.exportDatabase()
    const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-plan-backup-${new Date().toISOString().split('T')[0]}.db`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('备份成功')
  } catch (error) {
    ElMessage.error('备份失败')
  }
}

async function handleClearData() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await taskStore.clearAllTasks()
    ElMessage.success('数据已清空')
  } catch {
    // 用户取消
  }
}
</script>
