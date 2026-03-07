<template>
  <div class="case-detail">
    <div class="page-header">
      <h2>案件详情</h2>
      <div class="header-actions">
        <el-button @click="router.back()">返回</el-button>
        <el-button type="primary" @click="router.push(`/legal/case/${caseId}/edit`)">编辑</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="10" animated />

    <template v-else-if="lawsuitCase">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <div>
              <el-tag :type="caseStatusColors[lawsuitCase.status] as any" size="large" class="mr-2">
                {{ caseStatusLabels[lawsuitCase.status] }}
              </el-tag>
              <el-tag effect="plain" size="large">
                {{ caseStageLabels[lawsuitCase.stage] }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="案号">{{ lawsuitCase.caseNumber }}</el-descriptions-item>
          <el-descriptions-item label="案件名称" :span="2">{{ lawsuitCase.name }}</el-descriptions-item>
          <el-descriptions-item label="案件类型">{{ caseTypeLabels[lawsuitCase.type] }}</el-descriptions-item>
          <el-descriptions-item label="案由" :span="2">{{ lawsuitCase.cause }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 当事人信息 -->
      <el-card class="info-card">
        <template #header>当事人信息</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="我方角色">{{ partyRoleLabels[lawsuitCase.ourRole] }}</el-descriptions-item>
          <el-descriptions-item label="对方角色">{{ partyRoleLabels[lawsuitCase.opponentRole] }}</el-descriptions-item>
          <el-descriptions-item label="我方当事人">{{ lawsuitCase.ourParty }}</el-descriptions-item>
          <el-descriptions-item label="对方当事人">{{ lawsuitCase.opponentParty }}</el-descriptions-item>
          <el-descriptions-item label="我方代理人">{{ lawsuitCase.ourRepresentative || '-' }}</el-descriptions-item>
          <el-descriptions-item label="对方代理人">{{ lawsuitCase.opponentRepresentative || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 法院与金额 -->
      <el-card class="info-card">
        <template #header>法院与金额</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="受理法院">{{ lawsuitCase.court || '-' }}</el-descriptions-item>
          <el-descriptions-item label="承办法官">{{ lawsuitCase.judge || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法院电话">{{ lawsuitCase.courtPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="诉讼标的额">
            <span class="amount">{{ formatMoney(lawsuitCase.subjectAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="请求金额">{{ formatMoney(lawsuitCase.claimedAmount) }}</el-descriptions-item>
          <el-descriptions-item label="判决金额">{{ formatMoney(lawsuitCase.awardedAmount) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 日期信息 -->
      <el-card class="info-card">
        <template #header>日期信息</template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="立案日期">{{ lawsuitCase.filingDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开庭日期">{{ lawsuitCase.hearingDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结案日期">{{ lawsuitCase.closingDate || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 案件描述 -->
      <el-card class="info-card">
        <template #header>案件描述</template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="案件描述">
            <div class="content-text">{{ lawsuitCase.description || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="进展备忘">{{ lawsuitCase.progressNote || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ lawsuitCase.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作按钮 -->
      <el-card class="action-card">
        <template #header>状态操作</template>
        <el-space wrap>
          <el-button v-if="canStart" type="primary" @click="handleStart">开始处理</el-button>
          <el-button v-if="canSuspend" type="warning" @click="handleSuspend">中止</el-button>
          <el-button v-if="canResume" type="primary" @click="handleResume">恢复</el-button>
          <el-button v-if="canCloseWon" type="success" @click="handleClose('won')">胜诉结案</el-button>
          <el-button v-if="canCloseLost" type="danger" @click="handleClose('lost')">败诉结案</el-button>
          <el-button v-if="canCloseSettled" type="success" @click="handleClose('settled')">调解结案</el-button>
          <el-button v-if="canCloseWithdrawn" type="info" @click="handleClose('withdrawn')">撤诉结案</el-button>
          <el-button v-if="canArchive" @click="handleArchive">归档</el-button>
        </el-space>
      </el-card>

      <!-- 案件进展 -->
      <el-card class="info-card">
        <template #header>案件进展</template>
        <CaseProgressList :case-id="caseId" />
      </el-card>

      <!-- 添加进展表单 -->
      <el-card v-if="showProgressForm" class="info-card">
        <template #header>添加进展</template>
        <CaseProgressForm
          :case-id="caseId"
          :current-stage="lawsuitCase.stage"
          @success="handleProgressSuccess"
        />
      </el-card>
    </template>

    <el-empty v-else description="案件不存在" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCaseStore } from '@/stores'
import {
  CaseStatus, CaseStage,
  caseTypeLabels, caseStatusLabels, caseStatusColors, caseStageLabels, partyRoleLabels
} from '@/types'
import CaseProgressList from '@/components/case/CaseProgressList.vue'
import CaseProgressForm from '@/components/case/CaseProgressForm.vue'

const router = useRouter()
const route = useRoute()
const caseStore = useCaseStore()

const caseId = computed(() => Number(route.params.id))
const lawsuitCase = computed(() => caseStore.currentCase)
const loading = computed(() => caseStore.isLoading)

const showProgressForm = ref(true)

const canStart = computed(() =>
  lawsuitCase.value?.status === CaseStatus.PENDING || lawsuitCase.value?.status === CaseStatus.DRAFT
)

const canSuspend = computed(() =>
  lawsuitCase.value?.status === CaseStatus.IN_PROGRESS
)

const canResume = computed(() =>
  lawsuitCase.value?.status === CaseStatus.SUSPENDED
)

const canCloseWon = computed(() =>
  lawsuitCase.value?.status === CaseStatus.IN_PROGRESS
)

const canCloseLost = computed(() =>
  lawsuitCase.value?.status === CaseStatus.IN_PROGRESS
)

const canCloseSettled = computed(() =>
  lawsuitCase.value?.status === CaseStatus.IN_PROGRESS
)

const canCloseWithdrawn = computed(() =>
  lawsuitCase.value?.status === CaseStatus.IN_PROGRESS
)

const canArchive = computed(() =>
  lawsuitCase.value?.status === CaseStatus.CLOSED_WON ||
  lawsuitCase.value?.status === CaseStatus.CLOSED_LOST ||
  lawsuitCase.value?.status === CaseStatus.CLOSED_SETTLED ||
  lawsuitCase.value?.status === CaseStatus.CLOSED_WITHDRAWN
)

function formatMoney(value: number | null): string {
  if (!value) return '-'
  return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

async function handleStart() {
  try {
    await ElMessageBox.confirm('确定开始处理该案件吗？', '提示')
    await caseStore.updateStatus(caseId.value, CaseStatus.IN_PROGRESS)
    ElMessage.success('案件开始处理')
  } catch { }
}

async function handleSuspend() {
  try {
    await ElMessageBox.confirm('确定中止该案件吗？', '提示')
    await caseStore.updateStatus(caseId.value, CaseStatus.SUSPENDED)
    ElMessage.success('案件已中止')
  } catch { }
}

async function handleResume() {
  try {
    await ElMessageBox.confirm('确定恢复该案件吗？', '提示')
    await caseStore.updateStatus(caseId.value, CaseStatus.IN_PROGRESS)
    ElMessage.success('案件已恢复')
  } catch { }
}

async function handleClose(type: 'won' | 'lost' | 'settled' | 'withdrawn') {
  const statusMap = {
    won: CaseStatus.CLOSED_WON,
    lost: CaseStatus.CLOSED_LOST,
    settled: CaseStatus.CLOSED_SETTLED,
    withdrawn: CaseStatus.CLOSED_WITHDRAWN
  }
  const labels = {
    won: '胜诉',
    lost: '败诉',
    settled: '调解',
    withdrawn: '撤诉'
  }
  try {
    await ElMessageBox.confirm(`确定以${labels[type]}方式结案吗？`, '提示')
    await caseStore.updateStatus(caseId.value, statusMap[type])
    await caseStore.updateStage(caseId.value, CaseStage.CLOSED)
    ElMessage.success('案件已结案')
  } catch { }
}

async function handleArchive() {
  try {
    await ElMessageBox.confirm('确定归档该案件吗？', '提示')
    await caseStore.updateStatus(caseId.value, CaseStatus.ARCHIVED)
    ElMessage.success('案件已归档')
  } catch { }
}

function handleProgressSuccess() {
  caseStore.loadCase(caseId.value)
}

onMounted(() => {
  caseStore.loadCase(caseId.value)
})
</script>

<style scoped>
.case-detail {
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
  font-size: 16px;
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

.mr-2 {
  margin-right: 8px;
}
</style>
