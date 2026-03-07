<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    :disabled="loading"
  >
    <el-form-item label="计划明细" prop="planDetail">
      <el-input
        v-model="formData.planDetail"
        type="textarea"
        :rows="3"
        placeholder="请输入计划明细"
      />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option
              v-for="(label, value) in statusLabels"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="四象限" prop="quadrant">
          <QuadrantSelect v-model="formData.quadrant" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="截至日期" prop="dueDate">
          <el-date-picker
            v-model="formData.dueDate"
            type="date"
            placeholder="选择截至日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="完成进度" prop="progress">
      <el-slider
        v-model="formData.progress"
        :min="0"
        :max="100"
        :step="5"
        show-input
        :disabled="formData.status === TaskStatus.CANCELLED"
      />
    </el-form-item>

    <el-form-item label="实际完成日期" prop="actualCompleteDate">
      <el-date-picker
        v-model="formData.actualCompleteDate"
        type="date"
        placeholder="选择实际完成日期"
        value-format="YYYY-MM-DD"
        style="width: 100%"
        :disabled="formData.status !== TaskStatus.COMPLETED"
      />
    </el-form-item>

    <el-form-item label="完成情况说明" prop="completionNote">
      <el-input
        v-model="formData.completionNote"
        type="textarea"
        :rows="2"
        placeholder="请输入完成情况说明"
      />
    </el-form-item>

    <el-form-item label="备注说明" prop="remark">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="2"
        placeholder="请输入备注说明"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { TaskStatus, QuadrantType, statusLabels } from '@/types'
import type { Task, TaskFormData } from '@/types'
import QuadrantSelect from './QuadrantSelect.vue'

const props = defineProps<{
  task?: Task | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: TaskFormData): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()

const isEdit = computed(() => !!props.task?.id)

const defaultFormData: TaskFormData = {
  status: TaskStatus.NOT_STARTED,
  planDetail: '',
  quadrant: QuadrantType.IMPORTANT_URGENT,
  startDate: '',
  dueDate: '',
  progress: 0,
  actualCompleteDate: '',
  completionNote: '',
  remark: ''
}

const formData = reactive<TaskFormData>({ ...defaultFormData })

const rules: FormRules = {
  planDetail: [
    { required: true, message: '请输入计划明细', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  quadrant: [
    { required: true, message: '请选择四象限分类', trigger: 'change' }
  ]
}

// 监听任务数据变化，填充表单
watch(
  () => props.task,
  (task) => {
    if (task) {
      formData.id = task.id
      formData.status = task.status
      formData.planDetail = task.planDetail
      formData.quadrant = task.quadrant
      formData.startDate = task.startDate || ''
      formData.dueDate = task.dueDate || ''
      formData.progress = task.progress
      formData.actualCompleteDate = task.actualCompleteDate || ''
      formData.completionNote = task.completionNote || ''
      formData.remark = task.remark || ''
    } else {
      Object.assign(formData, defaultFormData)
    }
  },
  { immediate: true }
)

// 状态变化时自动调整进度
watch(
  () => formData.status,
  (status) => {
    if (status === TaskStatus.COMPLETED) {
      formData.progress = 100
      if (!formData.actualCompleteDate) {
        formData.actualCompleteDate = new Date().toISOString().split('T')[0]
      }
    } else if (status === TaskStatus.CANCELLED) {
      formData.progress = -1
    } else if (status === TaskStatus.NOT_STARTED) {
      formData.progress = 0
    }
  }
)

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  emit('submit', { ...formData })
}

function handleCancel() {
  emit('cancel')
}

defineExpose({
  resetForm: () => {
    Object.assign(formData, defaultFormData)
    formRef.value?.clearValidate()
  }
})
</script>
