<template>
  <div class="case-list">
    <div class="page-header">
      <h2>案件管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增案件
      </el-button>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="案件名称/案号/对方" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="案件类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable>
            <el-option v-for="(label, value) in caseTypeLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="案件状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable>
            <el-option v-for="(label, value) in caseStatusLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="案件阶段">
          <el-select v-model="filterForm.stage" placeholder="全部" clearable>
            <el-option v-for="(label, value) in caseStageLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-table :data="cases" v-loading="loading" border stripe>
      <el-table-column prop="caseNumber" label="案号" min-width="180" show-overflow-tooltip />
      <el-table-column prop="name" label="案件名称" min-width="200" show-overflow-tooltip />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          {{ caseTypeLabels[row.type as CaseType] }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="caseStatusColors[row.status as CaseStatus] as any" size="small">
            {{ caseStatusLabels[row.status as CaseStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="阶段" width="100">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ caseStageLabels[row.stage as CaseStage] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="court" label="受理法院" width="150" show-overflow-tooltip />
      <el-table-column label="我方角色" width="100">
        <template #default="{ row }">
          {{ partyRoleLabels[row.ourRole as PartyRole] }}
        </template>
      </el-table-column>
      <el-table-column label="标的额" width="120" align="right">
        <template #default="{ row }">
          {{ row.subjectAmount ? formatMoney(row.subjectAmount) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="filingDate" label="立案日期" width="110" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除该案件吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useCaseStore } from '@/stores'
import {
  CaseStatus, CaseType, CaseStage, PartyRole,
  caseTypeLabels, caseStatusLabels, caseStatusColors, caseStageLabels, partyRoleLabels
} from '@/types'

const router = useRouter()
const caseStore = useCaseStore()

const loading = computed(() => caseStore.isLoading)
const cases = computed(() => caseStore.cases)
const page = computed({
  get: () => caseStore.pagination.page,
  set: (v) => caseStore.setPage(v)
})
const pageSize = computed({
  get: () => caseStore.pagination.pageSize,
  set: (v) => caseStore.setPageSize(v)
})
const total = computed(() => caseStore.pagination.total)

const filterForm = reactive({
  keyword: '',
  type: undefined as CaseType | undefined,
  status: undefined as CaseStatus | undefined,
  stage: undefined as CaseStage | undefined
})

function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function handleSearch() {
  caseStore.setFilter({
    keyword: filterForm.keyword,
    type: filterForm.type,
    status: filterForm.status,
    stage: filterForm.stage
  })
  caseStore.loadCases()
}

function handleReset() {
  Object.assign(filterForm, {
    keyword: '',
    type: undefined,
    status: undefined,
    stage: undefined
  })
  caseStore.clearFilter()
  caseStore.loadCases()
}

function handleSizeChange(size: number) {
  caseStore.setPageSize(size)
  caseStore.loadCases()
}

function handlePageChange(p: number) {
  caseStore.setPage(p)
  caseStore.loadCases()
}

function handleAdd() {
  router.push('/legal/case/create')
}

function handleView(row: any) {
  router.push(`/legal/case/${row.id}`)
}

function handleEdit(row: any) {
  router.push(`/legal/case/${row.id}/edit`)
}

async function handleDelete(id: number) {
  await caseStore.deleteCase(id)
  ElMessage.success('删除成功')
}

onMounted(() => {
  caseStore.loadCases()
})
</script>

<style scoped>
.case-list {
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

.filter-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
