<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="审核结果" prop="reviewResult">
      <el-radio-group v-model="form.reviewResult">
        <el-radio value="approved">通过</el-radio>
        <el-radio value="rejected">驳回</el-radio>
        <el-radio value="revision_required">需修改</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="审核意见" prop="reviewOpinion">
      <el-input
        v-model="form.reviewOpinion"
        type="textarea"
        :rows="4"
        placeholder="请输入审核意见"
      />
    </el-form-item>

    <el-form-item label="风险评估">
      <el-select v-model="form.riskAssessment" placeholder="请选择风险等级" clearable>
        <el-option
          v-for="(label, value) in riskLevelLabels"
          :key="value"
          :label="label"
          :value="value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="风险说明">
      <el-input
        v-model="form.riskNotes"
        type="textarea"
        :rows="3"
        placeholder="请输入风险说明"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        提交审核
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useContractStore } from '@/stores'
import { riskLevelLabels } from '@/types'
import type { ContractReviewFormData } from '@/types'

const props = defineProps<{
  contractId: number
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const contractStore = useContractStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive<ContractReviewFormData>({
  contractId: props.contractId,
  reviewResult: 'approved',
  reviewOpinion: '',
  riskAssessment: null,
  riskNotes: null
})

const rules: FormRules = {
  reviewResult: [
    { required: true, message: '请选择审核结果', trigger: 'change' }
  ],
  reviewOpinion: [
    { required: true, message: '请输入审核意见', trigger: 'blur' }
  ]
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await contractStore.createReview(form)
    ElMessage.success('审核提交成功')
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
