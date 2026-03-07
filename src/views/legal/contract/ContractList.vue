<template>
  <div class="contract-list">
    <div class="page-header">
      <h2>合同管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增合同
      </el-button>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="合同名称/编号/对方" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="合同类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable>
            <el-option v-for="(label, value) in contractTypeLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable>
            <el-option v-for="(label, value) in contractStatusLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="filterForm.riskLevel" placeholder="全部" clearable>
            <el-option v-for="(label, value) in riskLevelLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-table :data="contracts" v-loading="loading" border stripe>
      <el-table-column prop="contractNumber" label="合同编号" width="140" />
      <el-table-column prop="name" label="合同名称" min-width="200" show-overflow-tooltip />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          {{ contractTypeLabels[row.type as ContractType] }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="contractStatusColors[row.status as ContractStatus] as any" size="small">
            {{ contractStatusLabels[row.status as ContractStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="partyB" label="对方" width="150" show-overflow-tooltip />
      <el-table-column label="金额" width="120" align="right">
        <template #default="{ row }">
          {{ row.amount ? formatMoney(row.amount) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="风险等级" width="100" align="center">
        <template #default="{ row }">
          <RiskBadge :level="row.riskLevel" />
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="生效日期" width="110" />
      <el-table-column prop="endDate" label="到期日期" width="110" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除该合同吗？" @confirm="handleDelete(row.id)">
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
import { useContractStore } from '@/stores'
import { ContractStatus, ContractType, RiskLevel, contractTypeLabels, contractStatusLabels, contractStatusColors, riskLevelLabels } from '@/types'
import RiskBadge from '@/components/contract/RiskBadge.vue'

const router = useRouter()
const contractStore = useContractStore()

const loading = computed(() => contractStore.isLoading)
const contracts = computed(() => contractStore.contracts)
const page = computed({
  get: () => contractStore.pagination.page,
  set: (v) => contractStore.setPage(v)
})
const pageSize = computed({
  get: () => contractStore.pagination.pageSize,
  set: (v) => contractStore.setPageSize(v)
})
const total = computed(() => contractStore.pagination.total)

const filterForm = reactive({
  keyword: '',
  type: undefined as ContractType | undefined,
  status: undefined as ContractStatus | undefined,
  riskLevel: undefined as RiskLevel | undefined
})

function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function handleSearch() {
  contractStore.setFilter({
    keyword: filterForm.keyword,
    type: filterForm.type,
    status: filterForm.status,
    riskLevel: filterForm.riskLevel
  })
  contractStore.loadContracts()
}

function handleReset() {
  Object.assign(filterForm, {
    keyword: '',
    type: undefined,
    status: undefined,
    riskLevel: undefined
  })
  contractStore.clearFilter()
  contractStore.loadContracts()
}

function handleSizeChange(size: number) {
  contractStore.setPageSize(size)
  contractStore.loadContracts()
}

function handlePageChange(p: number) {
  contractStore.setPage(p)
  contractStore.loadContracts()
}

function handleAdd() {
  router.push('/legal/contract/create')
}

function handleView(row: any) {
  router.push(`/legal/contract/${row.id}`)
}

function handleEdit(row: any) {
  router.push(`/legal/contract/${row.id}/edit`)
}

async function handleDelete(id: number) {
  await contractStore.deleteContract(id)
  ElMessage.success('删除成功')
}

onMounted(() => {
  contractStore.loadContracts()
})
</script>

<style scoped>
.contract-list {
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
