import type { BaseEntity, Auditable } from './common'

// 任务状态枚举
export enum TaskStatus {
  COMPLETED = 1,  // 已完成
  IN_PROGRESS = 2, // 进行中
  NOT_STARTED = 3, // 未开始
  CANCELLED = 4   // 已取消
}

// 任务类型枚举
export enum TaskType {
  GENERAL = 'general',           // 普通任务
  CONTRACT_REVIEW = 'contract_review', // 合同审核
  CASE_HANDLING = 'case_handling',     // 案件处理
  MEETING = 'meeting',           // 会议
  DOCUMENT = 'document',         // 文档处理
  OTHER = 'other'                // 其他
}

export const taskTypeLabels: Record<TaskType, string> = {
  [TaskType.GENERAL]: '普通任务',
  [TaskType.CONTRACT_REVIEW]: '合同审核',
  [TaskType.CASE_HANDLING]: '案件处理',
  [TaskType.MEETING]: '会议',
  [TaskType.DOCUMENT]: '文档处理',
  [TaskType.OTHER]: '其他'
}

// 任务优先级
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '低',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.HIGH]: '高',
  [TaskPriority.URGENT]: '紧急'
}

export const taskPriorityColors: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'info',
  [TaskPriority.MEDIUM]: 'warning',
  [TaskPriority.HIGH]: 'danger',
  [TaskPriority.URGENT]: 'danger'
}

// 四象限分类枚举
export enum QuadrantType {
  IMPORTANT_URGENT = 1,      // 重要/紧急
  IMPORTANT_NOT_URGENT = 2,  // 重要/不紧急
  NOT_IMPORTANT_URGENT = 3,  // 不重要/紧急
  NOT_IMPORTANT_NOT_URGENT = 4 // 不重要/不紧急
}

// 任务接口 (扩展为工作任务)
export interface Task extends BaseEntity, Auditable {
  status: TaskStatus
  planDetail: string
  quadrant: QuadrantType
  taskType?: TaskType           // 任务类型
  priority?: TaskPriority       // 优先级
  startDate: string | null
  dueDate: string | null
  progress: number
  actualCompleteDate: string | null
  completionNote: string | null
  remark: string | null
  linkId?: number | null        // 关联ID(合同/案件等)
  linkType?: string | null      // 关联类型(contract/case等)
  assigneeId?: number | null    // 指派人ID
  departmentId?: number | null  // 所属部门ID
}

// 任务表单数据
export interface TaskFormData {
  id?: number
  status: TaskStatus
  planDetail: string
  quadrant: QuadrantType
  taskType?: TaskType
  priority?: TaskPriority
  startDate: string | null
  dueDate: string | null
  progress: number
  actualCompleteDate: string | null
  completionNote: string | null
  remark: string | null
  linkId?: number | null
  linkType?: string | null
  assigneeId?: number | null
  departmentId?: number | null
}

// 统计数据接口
export interface StatisticsData {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  notStartedTasks: number
  cancelledTasks: number
  overdueTasks: number
  completionRate: number
}

// 四象限统计
export interface QuadrantStatistics {
  importantUrgent: number
  importantNotUrgent: number
  notImportantUrgent: number
  notImportantNotUrgent: number
}

// 日期范围
export interface DateRange {
  start: string
  end: string
}

// 状态标签映射
export const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.NOT_STARTED]: '未开始',
  [TaskStatus.CANCELLED]: '已取消'
}

// 四象限标签映射
export const quadrantLabels: Record<QuadrantType, string> = {
  [QuadrantType.IMPORTANT_URGENT]: '重要/紧急',
  [QuadrantType.IMPORTANT_NOT_URGENT]: '重要/不紧急',
  [QuadrantType.NOT_IMPORTANT_URGENT]: '不重要/紧急',
  [QuadrantType.NOT_IMPORTANT_NOT_URGENT]: '不重要/不紧急'
}

// 状态颜色映射
export const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.IN_PROGRESS]: 'warning',
  [TaskStatus.NOT_STARTED]: 'info',
  [TaskStatus.CANCELLED]: 'danger'
}

// 四象限颜色映射
export const quadrantColors: Record<QuadrantType, string> = {
  [QuadrantType.IMPORTANT_URGENT]: 'danger',
  [QuadrantType.IMPORTANT_NOT_URGENT]: 'warning',
  [QuadrantType.NOT_IMPORTANT_URGENT]: 'primary',
  [QuadrantType.NOT_IMPORTANT_NOT_URGENT]: 'success'
}
