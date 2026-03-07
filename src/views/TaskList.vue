<template>
  <div class="task-list-page">
    <!-- 工具栏 -->
    <el-card class="mb-4">
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div class="flex gap-2 items-center flex-wrap">
          <el-input
            v-model="searchText"
            placeholder="搜索任务..."
            style="width: 250px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px">
            <el-option
              v-for="(label, value) in statusLabels"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>

          <el-select v-model="quadrantFilter" placeholder="四象限" clearable style="width: 140px">
            <el-option
              v-for="(label, value) in quadrantLabels"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </div>

        <div class="flex gap-2">
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增任务
          </el-button>
          <el-dropdown @command="handleCommand">
            <el-button>
              更多操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="export">导出Excel</el-dropdown-item>
                <el-dropdown-item command="import">导入Excel</el-dropdown-item>
                <el-dropdown-item command="clear" divided>清空数据</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-card>

    <!-- 任务列表 -->
    <el-card>
      <TaskList
        :tasks="filteredTasks"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </el-card>

    <!-- 任务编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingTask ? '编辑任务' : '新增任务'"
      width="600px"
      destroy-on-close
    >
      <TaskForm
        ref="taskFormRef"
        :task="editingTask"
        :loading="submitting"
        @submit="handleSubmit"
        @cancel="dialogVisible = false"
      />
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入Excel" width="500px">
      <el-upload
        drag
        accept=".xlsx,.xls,.csv"
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
            支持 .xlsx, .xls, .csv 格式
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTaskStore } from '@/stores'
import { statusLabels, quadrantLabels } from '@/types'
import type { Task, TaskFormData } from '@/types'
import { TaskList, TaskForm } from '@/components'
import { exportToExcel, parseExcelFile } from '@/utils/export'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

const searchText = ref('')
const statusFilter = ref<number | null>(null)
const quadrantFilter = ref<number | null>(null)
const dateRange = ref<string[]>([])

const dialogVisible = ref(false)
const editingTask = ref<Task | null>(null)
const submitting = ref(false)
const importDialogVisible = ref(false)
const taskFormRef = ref<InstanceType<typeof TaskForm>>()

const filteredTasks = computed(() => {
  let result = [...taskStore.tasks]

  // 搜索过滤
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(task =>
      task.planDetail.toLowerCase().includes(keyword) ||
      (task.completionNote?.toLowerCase().includes(keyword)) ||
      (task.remark?.toLowerCase().includes(keyword))
    )
  }

  // 状态过滤
  if (statusFilter.value !== null) {
    result = result.filter(task => task.status === statusFilter.value)
  }

  // 四象限过滤
  if (quadrantFilter.value !== null) {
    result = result.filter(task => task.quadrant === quadrantFilter.value)
  }

  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(task => {
      if (!task.startDate && !task.dueDate) return false
      const taskStart = task.startDate || task.dueDate
      const taskEnd = task.dueDate || task.startDate
      return dayjs(taskEnd).isAfter(dayjs(start).subtract(1, 'day')) &&
             dayjs(taskStart).isBefore(dayjs(end).add(1, 'day'))
    })
  }

  return result
})

function showAddDialog() {
  editingTask.value = null
  dialogVisible.value = true
}

function handleEdit(task: Task) {
  editingTask.value = task
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  try {
    await taskStore.removeTask(id)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

async function handleSubmit(formData: TaskFormData) {
  submitting.value = true
  try {
    if (editingTask.value?.id) {
      await taskStore.updateTask(editingTask.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      await taskStore.addTask(formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'export':
      await handleExport()
      break
    case 'import':
      importDialogVisible.value = true
      break
    case 'clear':
      await handleClear()
      break
  }
}

async function handleExport() {
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
    const tasks = await parseExcelFile(file.raw)
    if (tasks.length === 0) {
      ElMessage.warning('未找到有效数据')
      return
    }
    const count = await taskStore.importTasks(tasks)
    importDialogVisible.value = false
    ElMessage.success(`成功导入 ${count} 条任务`)
  } catch (error) {
    ElMessage.error('导入失败，请检查文件格式')
  }
}

async function handleClear() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有任务数据吗？此操作不可恢复！',
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
