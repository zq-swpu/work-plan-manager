// 通用状态枚举
export enum CommonStatus {
  DISABLED = 0,
  ENABLED = 1
}

export const commonStatusLabels: Record<CommonStatus, string> = {
  [CommonStatus.DISABLED]: '禁用',
  [CommonStatus.ENABLED]: '启用'
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 基础过滤条件
export interface BaseFilter {
  keyword?: string
  status?: CommonStatus
  startDate?: string
  endDate?: string
}

// 基础实体接口
export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt: string
}

// 审计字段
export interface Auditable {
  createdBy?: number | null
  updatedBy?: number | null
}
