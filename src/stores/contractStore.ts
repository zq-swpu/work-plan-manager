import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contract, ContractFormData, ContractReviewFormData, ContractFilter, ContractReview } from '@/types'
import { ContractStatus, ContractType, RiskLevel } from '@/types'
import { getContractRepository, saveDatabase } from '@/database'
import { useUserStore } from './userStore'
import dayjs from 'dayjs'

export const useContractStore = defineStore('contract', () => {
  // State
  const contracts = ref<Contract[]>([])
  const currentContract = ref<Contract | null>(null)
  const isLoading = ref(false)
  const filter = ref<ContractFilter>({})
  const pagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  // Getters
  const activeContracts = computed(() =>
    contracts.value.filter(c =>
      c.status !== ContractStatus.ARCHIVED &&
      c.status !== ContractStatus.TERMINATED
    )
  )

  const pendingReviewContracts = computed(() =>
    contracts.value.filter(c =>
      c.status === ContractStatus.PENDING_REVIEW ||
      c.status === ContractStatus.UNDER_REVIEW
    )
  )

  const expiringContracts = computed(() => {
    const thirtyDaysLater = dayjs().add(30, 'day').format('YYYY-MM-DD')
    return contracts.value.filter(c =>
      c.endDate &&
      c.status === ContractStatus.EXECUTING &&
      dayjs(c.endDate).isBefore(thirtyDaysLater) &&
      dayjs(c.endDate).isAfter(dayjs())
    )
  })

  const highRiskContracts = computed(() =>
    contracts.value.filter(c =>
      c.riskLevel === RiskLevel.HIGH || c.riskLevel === RiskLevel.CRITICAL
    )
  )

  // Actions
  async function loadContracts(): Promise<void> {
    isLoading.value = true
    try {
      const repo = getContractRepository()
      const result = repo.getContractsByFilter(filter.value, pagination.value.page, pagination.value.pageSize)
      contracts.value = result.data
      pagination.value.total = result.total
      pagination.value.totalPages = result.totalPages
    } finally {
      isLoading.value = false
    }
  }

  async function loadAllContracts(): Promise<void> {
    const repo = getContractRepository()
    contracts.value = repo.getAllContracts()
  }

  async function loadContract(id: number): Promise<Contract | null> {
    const repo = getContractRepository()
    currentContract.value = repo.getContractById(id)
    return currentContract.value
  }

  async function createContract(data: ContractFormData): Promise<number> {
    const repo = getContractRepository()
    const id = repo.createContract(data)
    saveDatabase()
    await loadContracts()
    return id
  }

  async function updateContract(id: number, data: Partial<ContractFormData>): Promise<void> {
    const repo = getContractRepository()
    repo.updateContract(id, data)
    saveDatabase()
    await loadContracts()
    if (currentContract.value?.id === id) {
      await loadContract(id)
    }
  }

  async function deleteContract(id: number): Promise<void> {
    const repo = getContractRepository()
    repo.deleteContract(id)
    saveDatabase()
    await loadContracts()
    if (currentContract.value?.id === id) {
      currentContract.value = null
    }
  }

  async function submitForReview(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.PENDING_REVIEW })
  }

  async function approveContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.APPROVED })
  }

  async function rejectContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.REJECTED })
  }

  async function signContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.SIGNED })
  }

  async function executeContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.EXECUTING })
  }

  async function completeContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.COMPLETED })
  }

  async function terminateContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.TERMINATED })
  }

  async function archiveContract(id: number): Promise<void> {
    await updateContract(id, { status: ContractStatus.ARCHIVED })
  }

  // 审核相关
  async function getReviews(contractId: number): Promise<ContractReview[]> {
    const repo = getContractRepository()
    return repo.getReviewsByContractId(contractId)
  }

  async function createReview(data: ContractReviewFormData): Promise<number> {
    const repo = getContractRepository()
    const userStore = useUserStore()
    const userId = userStore.currentUser?.id || 0
    const userName = userStore.currentUser?.realName || '未知'
    const id = repo.createReview(data, userId, userName)
    saveDatabase()
    await loadContract(data.contractId)
    return id
  }

  // 统计
  async function getStats(): Promise<{
    total: number
    byStatus: Record<ContractStatus, number>
    byRiskLevel: Record<RiskLevel, number>
    byType: Record<ContractType, number>
    totalAmount: number
  }> {
    const repo = getContractRepository()
    return repo.getContractStats()
  }

  // 筛选
  function setFilter(newFilter: Partial<ContractFilter>): void {
    filter.value = { ...filter.value, ...newFilter }
    pagination.value.page = 1
  }

  function clearFilter(): void {
    filter.value = {}
    pagination.value.page = 1
  }

  function setPage(page: number): void {
    pagination.value.page = page
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size
    pagination.value.page = 1
  }

  // 生成合同编号
  function generateContractNumber(): string {
    const now = dayjs()
    const year = now.format('YYYY')
    const month = now.format('MM')
    const count = contracts.value.filter(c =>
      c.contractNumber.startsWith(`HT${year}${month}`)
    ).length + 1
    return `HT${year}${month}${String(count).padStart(4, '0')}`
  }

  return {
    // State
    contracts,
    currentContract,
    isLoading,
    filter,
    pagination,
    // Getters
    activeContracts,
    pendingReviewContracts,
    expiringContracts,
    highRiskContracts,
    // Actions
    loadContracts,
    loadAllContracts,
    loadContract,
    createContract,
    updateContract,
    deleteContract,
    submitForReview,
    approveContract,
    rejectContract,
    signContract,
    executeContract,
    completeContract,
    terminateContract,
    archiveContract,
    getReviews,
    createReview,
    getStats,
    setFilter,
    clearFilter,
    setPage,
    setPageSize,
    generateContractNumber
  }
})
