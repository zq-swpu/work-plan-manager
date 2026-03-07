import type { BaseEntity, Auditable } from './common'

// 案件类型
export enum CaseType {
  CIVIL_LITIGATION = 'civil_litigation',     // 民事诉讼
  ADMINISTRATIVE = 'administrative',          // 行政诉讼
  ARBITRATION = 'arbitration',                // 仲裁
  LABOR_DISPUTE = 'labor_dispute',            // 劳动争议
  INTELLECTUAL_PROPERTY = 'intellectual_property', // 知识产权
  CONTRACT_DISPUTE = 'contract_dispute',      // 合同纠纷
  ENFORCEMENT = 'enforcement',                // 执行案件
  OTHER = 'other'                             // 其他
}

export const caseTypeLabels: Record<CaseType, string> = {
  [CaseType.CIVIL_LITIGATION]: '民事诉讼',
  [CaseType.ADMINISTRATIVE]: '行政诉讼',
  [CaseType.ARBITRATION]: '仲裁',
  [CaseType.LABOR_DISPUTE]: '劳动争议',
  [CaseType.INTELLECTUAL_PROPERTY]: '知识产权',
  [CaseType.CONTRACT_DISPUTE]: '合同纠纷',
  [CaseType.ENFORCEMENT]: '执行案件',
  [CaseType.OTHER]: '其他'
}

// 案件状态
export enum CaseStatus {
  DRAFT = 'draft',                     // 草稿
  PENDING = 'pending',                 // 待处理
  IN_PROGRESS = 'in_progress',         // 进行中
  SUSPENDED = 'suspended',             // 中止
  CLOSED_WON = 'closed_won',           // 已结案(胜诉)
  CLOSED_LOST = 'closed_lost',         // 已结案(败诉)
  CLOSED_SETTLED = 'closed_settled',   // 已结案(调解)
  CLOSED_WITHDRAWN = 'closed_withdrawn', // 已结案(撤诉)
  ARCHIVED = 'archived'                // 已归档
}

export const caseStatusLabels: Record<CaseStatus, string> = {
  [CaseStatus.DRAFT]: '草稿',
  [CaseStatus.PENDING]: '待处理',
  [CaseStatus.IN_PROGRESS]: '进行中',
  [CaseStatus.SUSPENDED]: '中止',
  [CaseStatus.CLOSED_WON]: '已结案(胜诉)',
  [CaseStatus.CLOSED_LOST]: '已结案(败诉)',
  [CaseStatus.CLOSED_SETTLED]: '已结案(调解)',
  [CaseStatus.CLOSED_WITHDRAWN]: '已结案(撤诉)',
  [CaseStatus.ARCHIVED]: '已归档'
}

export const caseStatusColors: Record<CaseStatus, string> = {
  [CaseStatus.DRAFT]: 'info',
  [CaseStatus.PENDING]: 'warning',
  [CaseStatus.IN_PROGRESS]: 'primary',
  [CaseStatus.SUSPENDED]: 'warning',
  [CaseStatus.CLOSED_WON]: 'success',
  [CaseStatus.CLOSED_LOST]: 'danger',
  [CaseStatus.CLOSED_SETTLED]: 'success',
  [CaseStatus.CLOSED_WITHDRAWN]: 'info',
  [CaseStatus.ARCHIVED]: 'info'
}

// 案件阶段
export enum CaseStage {
  PREPARATION = 'preparation',       // 准备阶段
  FILED = 'filed',                   // 已立案
  FIRST_INSTANCE = 'first_instance', // 一审
  SECOND_INSTANCE = 'second_instance', // 二审
  RETRIAL = 'retrial',               // 再审
  EXECUTION = 'execution',           // 执行
  CLOSED = 'closed'                  // 已结案
}

export const caseStageLabels: Record<CaseStage, string> = {
  [CaseStage.PREPARATION]: '准备阶段',
  [CaseStage.FILED]: '已立案',
  [CaseStage.FIRST_INSTANCE]: '一审',
  [CaseStage.SECOND_INSTANCE]: '二审',
  [CaseStage.RETRIAL]: '再审',
  [CaseStage.EXECUTION]: '执行',
  [CaseStage.CLOSED]: '已结案'
}

// 当事人角色
export enum PartyRole {
  PLAINTIFF = 'plaintiff',     // 原告
  DEFENDANT = 'defendant',     // 被告
  APPELLANT = 'appellant',     // 上诉人
  APPELLEE = 'appellee',       // 被上诉人
  APPLICANT = 'applicant',     // 申请人
  RESPONDENT = 'respondent',   // 被申请人
  THIRD_PARTY = 'third_party'  // 第三人
}

export const partyRoleLabels: Record<PartyRole, string> = {
  [PartyRole.PLAINTIFF]: '原告',
  [PartyRole.DEFENDANT]: '被告',
  [PartyRole.APPELLANT]: '上诉人',
  [PartyRole.APPELLEE]: '被上诉人',
  [PartyRole.APPLICANT]: '申请人',
  [PartyRole.RESPONDENT]: '被申请人',
  [PartyRole.THIRD_PARTY]: '第三人'
}

// 案件接口
export interface LawsuitCase extends BaseEntity, Auditable {
  caseNumber: string              // 案号
  name: string                    // 案件名称
  type: CaseType                  // 案件类型
  status: CaseStatus              // 案件状态
  stage: CaseStage                // 案件阶段

  // 当事人信息
  ourRole: PartyRole              // 我方角色
  ourParty: string                // 我方当事人
  ourRepresentative: string | null // 我方代理人
  opponentRole: PartyRole         // 对方角色
  opponentParty: string           // 对方当事人
  opponentRepresentative: string | null // 对方代理人

  // 法院信息
  court: string | null            // 受理法院
  judge: string | null            // 承办法官
  courtPhone: string | null       // 法院联系电话

  // 金额信息
  subjectAmount: number | null    // 诉讼标的额
  claimedAmount: number | null    // 请求金额
  awardedAmount: number | null    // 判决金额

  // 日期信息
  filingDate: string | null       // 立案日期
  hearingDate: string | null      // 开庭日期
  closingDate: string | null      // 结案日期

  // 其他信息
  cause: string                   // 案由
  description: string | null      // 案件描述
  progressNote: string | null     // 进展备忘
  remark: string | null           // 备注
  attachmentPath: string | null   // 附件路径

  // 关联信息
  contractId: number | null       // 关联合同ID
  handlerId: number | null        // 主办人ID
  departmentId: number | null     // 所属部门ID
}

export interface CaseFormData {
  caseNumber: string
  name: string
  type: CaseType
  status: CaseStatus
  stage: CaseStage
  ourRole: PartyRole
  ourParty: string
  ourRepresentative: string | null
  opponentRole: PartyRole
  opponentParty: string
  opponentRepresentative: string | null
  court: string | null
  judge: string | null
  courtPhone: string | null
  subjectAmount: number | null
  claimedAmount: number | null
  awardedAmount: number | null
  filingDate: string | null
  hearingDate: string | null
  closingDate: string | null
  cause: string
  description: string | null
  progressNote: string | null
  remark: string | null
  attachmentPath: string | null
  contractId: number | null
  handlerId: number | null
  departmentId: number | null
}

// 案件进展
export interface CaseProgress extends BaseEntity {
  caseId: number
  progressDate: string
  stage: CaseStage
  title: string
  content: string
  handlerId: number | null
  handlerName: string | null
  attachmentPath: string | null
}

export interface CaseProgressFormData {
  caseId: number
  progressDate: string
  stage: CaseStage
  title: string
  content: string
  handlerId: number | null
  attachmentPath: string | null
}

// 案件筛选条件
export interface CaseFilter {
  keyword?: string
  type?: CaseType
  status?: CaseStatus
  stage?: CaseStage
  ourRole?: PartyRole
  departmentId?: number
  handlerId?: number
  court?: string
  filingDateFrom?: string
  filingDateTo?: string
  subjectAmountMin?: number
  subjectAmountMax?: number
  contractId?: number
}
