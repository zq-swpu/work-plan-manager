import type { BaseEntity, Auditable } from './common'

// 合同状态
export enum ContractStatus {
  DRAFT = 'draft',                    // 草稿
  PENDING_REVIEW = 'pending_review',  // 待审核
  UNDER_REVIEW = 'under_review',      // 审核中
  APPROVED = 'approved',              // 已通过
  REJECTED = 'rejected',              // 已驳回
  SIGNED = 'signed',                  // 已签订
  EXECUTING = 'executing',            // 履行中
  COMPLETED = 'completed',            // 已完成
  TERMINATED = 'terminated',          // 已终止
  ARCHIVED = 'archived'               // 已归档
}

export const contractStatusLabels: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: '草稿',
  [ContractStatus.PENDING_REVIEW]: '待审核',
  [ContractStatus.UNDER_REVIEW]: '审核中',
  [ContractStatus.APPROVED]: '已通过',
  [ContractStatus.REJECTED]: '已驳回',
  [ContractStatus.SIGNED]: '已签订',
  [ContractStatus.EXECUTING]: '履行中',
  [ContractStatus.COMPLETED]: '已完成',
  [ContractStatus.TERMINATED]: '已终止',
  [ContractStatus.ARCHIVED]: '已归档'
}

export const contractStatusColors: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: 'info',
  [ContractStatus.PENDING_REVIEW]: 'warning',
  [ContractStatus.UNDER_REVIEW]: 'warning',
  [ContractStatus.APPROVED]: 'success',
  [ContractStatus.REJECTED]: 'danger',
  [ContractStatus.SIGNED]: 'primary',
  [ContractStatus.EXECUTING]: 'primary',
  [ContractStatus.COMPLETED]: 'success',
  [ContractStatus.TERMINATED]: 'danger',
  [ContractStatus.ARCHIVED]: 'info'
}

// 合同类型
export enum ContractType {
  PURCHASE = 'purchase',           // 采购合同
  SALES = 'sales',                 // 销售合同
  SERVICE = 'service',             // 服务合同
  LEASE = 'lease',                 // 租赁合同
  LABOR = 'labor',                 // 劳动合同
  PARTNERSHIP = 'partnership',     // 合作协议
  CONFIDENTIALITY = 'confidentiality', // 保密协议
  NDIV = 'nda',                    // 保密协议(NDA)
  LICENSE = 'license',             // 许可协议
  OTHER = 'other'                  // 其他
}

export const contractTypeLabels: Record<ContractType, string> = {
  [ContractType.PURCHASE]: '采购合同',
  [ContractType.SALES]: '销售合同',
  [ContractType.SERVICE]: '服务合同',
  [ContractType.LEASE]: '租赁合同',
  [ContractType.LABOR]: '劳动合同',
  [ContractType.PARTNERSHIP]: '合作协议',
  [ContractType.CONFIDENTIALITY]: '保密协议',
  [ContractType.NDIV]: '保密协议(NDA)',
  [ContractType.LICENSE]: '许可协议',
  [ContractType.OTHER]: '其他'
}

// 风险等级
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const riskLevelLabels: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '重大风险'
}

export const riskLevelColors: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'success',
  [RiskLevel.MEDIUM]: 'warning',
  [RiskLevel.HIGH]: 'danger',
  [RiskLevel.CRITICAL]: 'danger'
}

// 合同接口
export interface Contract extends BaseEntity, Auditable {
  contractNumber: string        // 合同编号
  name: string                  // 合同名称
  type: ContractType            // 合同类型
  status: ContractStatus        // 合同状态
  partyA: string                // 甲方(我方)
  partyB: string                // 乙方(对方)
  partyBContact: string | null  // 乙方联系人
  partyBPhone: string | null    // 乙方联系电话
  signedDate: string | null     // 签订日期
  startDate: string | null      // 生效日期
  endDate: string | null        // 到期日期
  amount: number | null         // 合同金额
  currency: string              // 币种
  subject: string               // 标的物
  content: string | null        // 合同内容
  riskLevel: RiskLevel          // 风险等级
  riskNote: string | null       // 风险评估说明
  remark: string | null         // 备注
  attachmentPath: string | null // 附件路径
  ownerId: number | null        // 负责人ID
  departmentId: number | null   // 所属部门ID
}

export interface ContractFormData {
  contractNumber: string
  name: string
  type: ContractType
  status: ContractStatus
  partyA: string
  partyB: string
  partyBContact: string | null
  partyBPhone: string | null
  signedDate: string | null
  startDate: string | null
  endDate: string | null
  amount: number | null
  currency: string
  subject: string
  content: string | null
  riskLevel: RiskLevel
  riskNote: string | null
  remark: string | null
  attachmentPath: string | null
  ownerId: number | null
  departmentId: number | null
}

// 合同审核记录
export interface ContractReview extends BaseEntity {
  contractId: number
  reviewerId: number
  reviewerName: string
  reviewDate: string
  reviewResult: 'approved' | 'rejected' | 'revision_required'
  reviewOpinion: string
  riskAssessment: RiskLevel | null
  riskNotes: string | null
}

export interface ContractReviewFormData {
  contractId: number
  reviewResult: 'approved' | 'rejected' | 'revision_required'
  reviewOpinion: string
  riskAssessment: RiskLevel | null
  riskNotes: string | null
}

// 合同筛选条件
export interface ContractFilter {
  keyword?: string
  type?: ContractType
  status?: ContractStatus
  riskLevel?: RiskLevel
  departmentId?: number
  ownerId?: number
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  amountMin?: number
  amountMax?: number
}
