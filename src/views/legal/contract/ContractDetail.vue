<template>
  <div class="contract-detail">
    <div class="page-header">
      <h2>合同详情</h2>
      <div class="header-actions">
        <el-button @click="router.back()">返回</el-button>
        <el-button type="primary" @click="router.push(`/legal/contract/${contractId}/edit`)">编辑</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="10" animated />

    <template v-else-if="contract">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag :type="contractStatusColors[contract.status] as any" size="large">
              {{ contractStatusLabels[contract.status] }}
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="合同编号">{{ contract.contractNumber }}</el-descriptions-item>
          <el-descriptions-item label="合同名称" :span="2">{{ contract.name }}</el-descriptions-item>
          <el-descriptions-item label="合同类型">{{ contractTypeLabels[contract.type] }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <RiskBadge :level="contract.riskLevel" show-icon />
          </el-descriptions-item>
          <el-descriptions-item label="币种">{{ contract.currency }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 当事人信息 -->
      <el-card class="info-card">
        <template #header>当事人信息</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="甲方(我方)">{{ contract.partyA }}</el-descriptions-item>
          <el-descriptions-item label="乙方(对方)">{{ contract.partyB }}</el-descriptions-item>
          <el-descriptions-item label="乙方联系人">{{ contract.partyBContact || '-' }}</el-descriptions-item>
          <el-descriptions-item label="乙方电话">{{ contract.partyBPhone || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 日期与金额 -->
      <el-card class="info-card">
        <template #header>日期与金额</template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="签订日期">{{ contract.signedDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生效日期">{{ contract.startDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ contract.endDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="合同金额" :span="3">
            <span class="amount">{{ formatMoney(contract.amount) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 合同内容 -->
      <el-card class="info-card">
        <template #header>合同内容</template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标的物">{{ contract.subject }}</el-descriptions-item>
          <el-descriptions-item label="合同内容">
            <div class="content-text">{{ contract.content || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="风险评估">{{ contract.riskNote || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ contract.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作按钮 -->
      <el-card class="action-card">
        <template #header>操作</template>
        <el-space wrap>
          <el-button v-if="canSubmit" type="warning" @click="handleSubmitReview">提交审核</el-button>
          <el-button v-if="canApprove" type="success" @click="handleApprove">通过</el-button>
          <el-button v-if="canReject" type="danger" @click="handleReject">驳回</el-button>
          <el-button v-if="canSign" type="primary" @click="handleSign">签订</el-button>
          <el-button v-if="canExecute" type="primary" @click="handleExecute">开始履行</el-button>
          <el-button v-if="canComplete" type="success" @click="handleComplete">完成</el-button>
          <el-button v-if="canTerminate" type="danger" @click="handleTerminate">终止</el-button>
          <el-button v-if="canArchive" @click="handleArchive">归档</el-button>
        </el-space>
      </el-card>

      <!-- 审核记录 -->
      <el-card class="info-card">
        <template #header>审核记录</template>
        <ContractReviewList :contract-id="contractId" />
      </el-card>

      <!-- 审核表单 (待审核状态显示) -->
      <el-card v-if="showReviewForm" class="info-card">
        <template #header>提交审核意见</template>
        <ContractReviewForm :contract-id="contractId" @success="handleReviewSuccess" />
      </el-card>
    </template>

    <el-empty v-else description="合同不存在" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useContractStore } from '@/stores'
import { ContractStatus, contractStatusLabels, contractStatusColors, contractTypeLabels } from '@/types'
import RiskBadge from '@/components/contract/RiskBadge.vue'
import ContractReviewList from '@/components/contract/ContractReviewList.vue'
import ContractReviewForm from '@/components/contract/ContractReviewForm.vue'

const router = useRouter()
const route = useRoute()
const contractStore = useContractStore()

const contractId = computed(() => Number(route.params.id))
const contract = computed(() => contractStore.currentContract)
const loading = computed(() => contractStore.isLoading)

const showReviewForm = ref(false)

const canSubmit = computed(() =>
  contract.value?.status === ContractStatus.DRAFT
)

const canApprove = computed(() =>
  contract.value?.status === ContractStatus.PENDING_REVIEW ||
  contract.value?.status === ContractStatus.UNDER_REVIEW
)

const canReject = computed(() =>
  contract.value?.status === ContractStatus.PENDING_REVIEW ||
  contract.value?.status === ContractStatus.UNDER_REVIEW
)

const canSign = computed(() =>
  contract.value?.status === ContractStatus.APPROVED
)

const canExecute = computed(() =>
  contract.value?.status === ContractStatus.SIGNED
)

const canComplete = computed(() =>
  contract.value?.status === ContractStatus.EXECUTING
)

const canTerminate = computed(() =>
  contract.value?.status === ContractStatus.EXECUTING
)

const canArchive = computed(() =>
  contract.value?.status === ContractStatus.COMPLETED ||
  contract.value?.status === ContractStatus.TERMINATED
)

function formatMoney(value: number | null): string {
  if (!value) return '-'
  return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

async function handleSubmitReview() {
  await contractStore.submitForReview(contractId.value)
  ElMessage.success('已提交审核')
}

function handleApprove() {
  showReviewForm.value = true
}

function handleReject() {
  showReviewForm.value = true
}

async function handleSign() {
  try {
    await ElMessageBox.confirm('确定签订该合同吗？', '提示')
    await contractStore.signContract(contractId.value)
    ElMessage.success('合同已签订')
  } catch { }
}

async function handleExecute() {
  try {
    await ElMessageBox.confirm('确定开始履行该合同吗？', '提示')
    await contractStore.executeContract(contractId.value)
    ElMessage.success('合同开始履行')
  } catch { }
}

async function handleComplete() {
  try {
    await ElMessageBox.confirm('确定完成该合同吗？', '提示')
    await contractStore.completeContract(contractId.value)
    ElMessage.success('合同已完成')
  } catch { }
}

async function handleTerminate() {
  try {
    await ElMessageBox.confirm('确定终止该合同吗？此操作不可撤销。', '警告', { type: 'warning' })
    await contractStore.terminateContract(contractId.value)
    ElMessage.success('合同已终止')
  } catch { }
}

async function handleArchive() {
  try {
    await ElMessageBox.confirm('确定归档该合同吗？', '提示')
    await contractStore.archiveContract(contractId.value)
    ElMessage.success('合同已归档')
  } catch { }
}

function handleReviewSuccess() {
  showReviewForm.value = false
}

onMounted(() => {
  contractStore.loadContract(contractId.value)
})
</script>

<style scoped>
.contract-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.content-text {
  white-space: pre-wrap;
  line-height: 1.6;
}

.action-card {
  margin-bottom: 20px;
}
</style>
