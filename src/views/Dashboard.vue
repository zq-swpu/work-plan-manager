<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">今日任务</div>
          <div class="stat-card-value text-blue-500">{{ todayTasks.length }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">今日已完成</div>
          <div class="stat-card-value text-green-500">{{ todayCompleted.length }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">今日未完成</div>
          <div class="stat-card-value text-orange-500">{{ todayNotCompleted.length }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-title">逾期任务</div>
          <div class="stat-card-value text-red-500">{{ overdueTasks.length }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 快速添加 -->
    <el-card class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <span>快速添加任务</span>
        </div>
      </template>
      <el-form :inline="true" @submit.prevent="handleQuickAdd">
        <el-form-item label="计划明细" class="flex-1">
          <el-input
            v-model="quickAddForm.planDetail"
            placeholder="输入任务内容，回车添加"
            style="width: 400px"
            @keyup.enter="handleQuickAdd"
          />
        </el-form-item>
        <el-form-item label="截至日期">
          <el-date-picker
            v-model="quickAddForm.dueDate"
            type="date"
            placeholder="今天"
            value-format="YYYY-MM-DD"
            :clearable="true"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuickAdd" :loading="adding">
            添加
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 今日任务列表 -->
    <el-card class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <span>今日任务</span>
          <el-button type="primary" size="small" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
        </div>
      </template>
      <TaskList
        :tasks="todayTasks"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </el-card>

    <!-- 逾期任务 -->
    <el-card v-if="overdueTasks.length > 0">
      <template #header>
        <div class="flex items-center">
          <el-icon class="text-red-500 mr-2"><Warning /></el-icon>
          <span class="text-red-500">逾期任务 ({{ overdueTasks.length }})</span>
        </div>
      </template>
      <TaskList
        :tasks="overdueTasks"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useTaskStore } from '@/stores'
import { TaskStatus, QuadrantType } from '@/types'
import type { Task, TaskFormData } from '@/types'
import { TaskList, TaskForm } from '@/components'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

const todayTasks = computed(() => taskStore.todayTasks)
const todayCompleted = computed(() => taskStore.todayCompleted)
const todayNotCompleted = computed(() => taskStore.todayNotCompleted)
const overdueTasks = computed(() => taskStore.overdueTasks)

const dialogVisible = ref(false)
const editingTask = ref<Task | null>(null)
const submitting = ref(false)
const adding = ref(false)
const taskFormRef = ref<InstanceType<typeof TaskForm>>()

const quickAddForm = reactive({
  planDetail: '',
  dueDate: dayjs().format('YYYY-MM-DD')
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

async function handleQuickAdd() {
  if (!quickAddForm.planDetail.trim()) {
    ElMessage.warning('请输入任务内容')
    return
  }

  adding.value = true
  try {
    await taskStore.addTask({
      status: TaskStatus.NOT_STARTED,
      planDetail: quickAddForm.planDetail,
      quadrant: QuadrantType.IMPORTANT_URGENT,
      startDate: dayjs().format('YYYY-MM-DD'),
      dueDate: quickAddForm.dueDate || dayjs().format('YYYY-MM-DD'),
      progress: 0,
      actualCompleteDate: '',
      completionNote: '',
      remark: ''
    })
    quickAddForm.planDetail = ''
    ElMessage.success('添加成功')
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    adding.value = false
  }
}
</script>
