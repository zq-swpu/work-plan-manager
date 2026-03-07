import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LawsuitCase, CaseFormData, CaseFilter, CaseProgress, CaseProgressFormData } from '@/types'
import { CaseType, CaseStatus, CaseStage } from '@/types'
import { getCaseRepository, saveDatabase } from '@/database'
import { useUserStore } from './userStore'
import { logger } from '@/utils/logger'
import dayjs from 'dayjs'

export const useCaseStore = defineStore('case', () => {
  // State
  const cases = ref<LawsuitCase[]>([])
  const currentCase = ref<LawsuitCase | null>(null)
  const isLoading = ref(false)
  const filter = ref<CaseFilter>({})
  const pagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  // Getters
  const activeCases = computed(() =>
    cases.value.filter(c =>
      c.status !== CaseStatus.ARCHIVED &&
      c.status !== CaseStatus.CLOSED_WON &&
      c.status !== CaseStatus.CLOSED_LOST &&
      c.status !== CaseStatus.CLOSED_SETTLED &&
      c.status !== CaseStatus.CLOSED_WITHDRAWN
    )
  )

  const pendingCases = computed(() =>
    cases.value.filter(c => c.status === CaseStatus.PENDING)
  )

  const inProgressCases = computed(() =>
    cases.value.filter(c => c.status === CaseStatus.IN_PROGRESS)
  )

  const closedCases = computed(() =>
    cases.value.filter(c =>
      c.status === CaseStatus.CLOSED_WON ||
      c.status === CaseStatus.CLOSED_LOST ||
      c.status === CaseStatus.CLOSED_SETTLED ||
      c.status === CaseStatus.CLOSED_WITHDRAWN
    )
  )

  // 按阶段分组
  const casesByStage = computed(() => {
    const result: Record<CaseStage, LawsuitCase[]> = {
      [CaseStage.PREPARATION]: [],
      [CaseStage.FILED]: [],
      [CaseStage.FIRST_INSTANCE]: [],
      [CaseStage.SECOND_INSTANCE]: [],
      [CaseStage.RETRIAL]: [],
      [CaseStage.EXECUTION]: [],
      [CaseStage.CLOSED]: []
    }
    for (const c of cases.value) {
      if (result[c.stage]) {
        result[c.stage].push(c)
      }
    }
    return result
  })

  // Actions
  async function loadCases(): Promise<void> {
    isLoading.value = true
    try {
      const repo = getCaseRepository()
      const result = repo.getCasesByFilter(filter.value, pagination.value.page, pagination.value.pageSize)
      cases.value = result.data
      pagination.value.total = result.total
      pagination.value.totalPages = result.totalPages
    } finally {
      isLoading.value = false
    }
  }

  async function loadAllCases(): Promise<void> {
    const repo = getCaseRepository()
    cases.value = repo.getAllCases()
  }

  async function loadCase(id: number): Promise<LawsuitCase | null> {
    const repo = getCaseRepository()
    currentCase.value = repo.getCaseById(id)
    return currentCase.value
  }

  async function createCase(data: CaseFormData): Promise<number> {
    const repo = getCaseRepository()
    const id = repo.createCase(data)
    saveDatabase()
    try {
      await loadCases()
    } catch (e) {
      logger.error('Case', 'Failed to reload cases after create', e)
    }
    return id
  }

  async function updateCase(id: number, data: Partial<CaseFormData>): Promise<void> {
    const repo = getCaseRepository()
    repo.updateCase(id, data)
    saveDatabase()
    await loadCases()
    if (currentCase.value?.id === id) {
      await loadCase(id)
    }
  }

  async function deleteCase(id: number): Promise<void> {
    const repo = getCaseRepository()
    repo.deleteCase(id)
    saveDatabase()
    await loadCases()
    if (currentCase.value?.id === id) {
      currentCase.value = null
    }
  }

  async function updateStatus(id: number, status: CaseStatus): Promise<void> {
    await updateCase(id, { status })
  }

  async function updateStage(id: number, stage: CaseStage): Promise<void> {
    await updateCase(id, { stage })
  }

  // 进展相关
  async function getProgress(caseId: number): Promise<CaseProgress[]> {
    const repo = getCaseRepository()
    return repo.getProgressByCaseId(caseId)
  }

  async function createProgress(data: CaseProgressFormData): Promise<number> {
    const repo = getCaseRepository()
    const userStore = useUserStore()
    const handlerName = userStore.currentUser?.realName
    const id = repo.createProgress(data, handlerName)
    saveDatabase()
    await loadCase(data.caseId)
    return id
  }

  async function deleteProgress(id: number, caseId: number): Promise<void> {
    const repo = getCaseRepository()
    repo.deleteProgress(id)
    saveDatabase()
    await loadCase(caseId)
  }

  // 统计
  async function getStats(): Promise<{
    total: number
    byStatus: Record<CaseStatus, number>
    byType: Record<CaseType, number>
    byStage: Record<CaseStage, number>
    totalSubjectAmount: number
    totalClaimedAmount: number
    totalAwardedAmount: number
  }> {
    const repo = getCaseRepository()
    return repo.getCaseStats()
  }

  // 筛选
  function setFilter(newFilter: Partial<CaseFilter>): void {
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

  // 生成案号
  function generateCaseNumber(): string {
    const now = dayjs()
    const year = now.format('YYYY')
    const count = cases.value.filter(c =>
      c.caseNumber.startsWith(`AJ${year}`)
    ).length + 1
    return `AJ${year}${String(count).padStart(4, '0')}`
  }

  return {
    // State
    cases,
    currentCase,
    isLoading,
    filter,
    pagination,
    // Getters
    activeCases,
    pendingCases,
    inProgressCases,
    closedCases,
    casesByStage,
    // Actions
    loadCases,
    loadAllCases,
    loadCase,
    createCase,
    updateCase,
    deleteCase,
    updateStatus,
    updateStage,
    getProgress,
    createProgress,
    deleteProgress,
    getStats,
    setFilter,
    clearFilter,
    setPage,
    setPageSize,
    generateCaseNumber
  }
})
