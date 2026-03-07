<template>
  <div class="legal-dashboard">
    <div class="page-header">
      <h2>法务数据看板</h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon contract">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ contractStats.total }}</div>
              <div class="stat-label">合同总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon case">
              <el-icon size="32"><Finished /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ caseStats.total }}</div>
              <div class="stat-label">案件总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon risk">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value stat-danger">{{ highRiskCount }}</div>
              <div class="stat-label">高风险合同</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value stat-warning">{{ pendingReviewCount }}</div>
              <div class="stat-label">待审核合同</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>合同风险分析</span>
          </template>
          <RiskAnalysisChart :data="contractStats.byRiskLevel" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>案件标的额统计</span>
          </template>
          <SubjectAmountChart
            :subject-amount="caseStats.totalSubjectAmount"
            :claimed-amount="caseStats.totalClaimedAmount"
            :awarded-amount="caseStats.totalAwardedAmount"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 列表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>即将到期合同</span>
              <el-button type="primary" link @click="router.push('/legal/contract')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="expiringContracts" size="small">
            <el-table-column prop="contractNumber" label="合同编号" width="120" />
            <el-table-column prop="name" label="合同名称" show-overflow-tooltip />
            <el-table-column prop="endDate" label="到期日期" width="110" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>进行中案件</span>
              <el-button type="primary" link @click="router.push('/legal/case')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="inProgressCases" size="small">
            <el-table-column prop="caseNumber" label="案号" width="120" />
            <el-table-column prop="name" label="案件名称" show-overflow-tooltip />
            <el-table-column label="阶段" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ caseStageLabels[row.stage as CaseStage] }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Finished, Warning, Clock } from '@element-plus/icons-vue'
import { useContractStore, useCaseStore } from '@/stores'
import { RiskLevel, CaseStage, caseStageLabels } from '@/types'
import RiskAnalysisChart from '@/components/contract/RiskAnalysisChart.vue'
import SubjectAmountChart from '@/components/case/SubjectAmountChart.vue'

const router = useRouter()
const contractStore = useContractStore()
const caseStore = useCaseStore()

const contractStats = ref({
  total: 0,
  byStatus: {},
  byRiskLevel: {} as Record<RiskLevel, number>,
  byType: {},
  totalAmount: 0
})

const caseStats = ref({
  total: 0,
  byStatus: {},
  byType: {},
  byStage: {} as Record<CaseStage, number>,
  totalSubjectAmount: 0,
  totalClaimedAmount: 0,
  totalAwardedAmount: 0
})

const highRiskCount = computed(() => {
  return (contractStats.value.byRiskLevel[RiskLevel.HIGH] || 0) +
         (contractStats.value.byRiskLevel[RiskLevel.CRITICAL] || 0)
})

const pendingReviewCount = computed(() => {
  const s = contractStats.value.byStatus as Record<string, number>
  return (s['pending_review'] || 0) + (s['under_review'] || 0)
})

const expiringContracts = computed(() => contractStore.expiringContracts.slice(0, 5))
const inProgressCases = computed(() => caseStore.inProgressCases.slice(0, 5))

async function loadStats() {
  await Promise.all([
    contractStore.loadAllContracts(),
    caseStore.loadAllCases()
  ])

  const cStats = await contractStore.getStats()
  contractStats.value = cStats

  const csStats = await caseStore.getStats()
  caseStats.value = csStats
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.legal-dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon.contract {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.case {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.risk {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-danger {
  color: #f56c6c;
}

.stat-warning {
  color: #e6a23c;
}

.chart-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
