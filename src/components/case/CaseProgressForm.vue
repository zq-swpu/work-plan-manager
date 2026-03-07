<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="进展日期" prop="progressDate">
      <el-date-picker
        v-model="form.progressDate"
        type="date"
        placeholder="选择日期"
        value-format="YYYY-MM-DD"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="案件阶段" prop="stage">
      <el-select v-model="form.stage" placeholder="请选择阶段" style="width: 100%">
        <el-option
          v-for="(label, value) in caseStageLabels"
          :key="value"
          :label="label"
          :value="value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="进展标题" prop="title">
      <el-input v-model="form.title" placeholder="请输入进展标题" />
    </el-form-item>

    <el-form-item label="进展内容" prop="content">
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="4"
        placeholder="请输入进展内容"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        提交
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useCaseStore } from '@/stores'
import { CaseStage, caseStageLabels } from '@/types'
import type { CaseProgressFormData } from '@/types'

const props = defineProps<{
  caseId: number
  currentStage?: CaseStage
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const caseStore = useCaseStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive<CaseProgressFormData>({
  caseId: props.caseId,
  progressDate: new Date().toISOString().split('T')[0],
  stage: props.currentStage || CaseStage.PREPARATION,
  title: '',
  content: '',
  handlerId: null,
  attachmentPath: null
})

const rules: FormRules = {
  progressDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  stage: [{ required: true, message: '请选择阶段', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await caseStore.createProgress(form)
    ElMessage.success('进展添加成功')
    emit('success')
    // 重置表单
    form.title = ''
    form.content = ''
  } finally {
    submitting.value = false
  }
}
</script>
