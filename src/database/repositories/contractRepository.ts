import type { Database } from '../index'
import type {
  Contract, ContractFormData,
  ContractReview, ContractReviewFormData,
  ContractFilter,
  PaginatedResult
} from '@/types'
import { ContractStatus, ContractType, RiskLevel } from '@/types'

export function createContractRepository(db: Database) {
  function rowToContract(row: unknown[]): Contract {
    return {
      id: row[0] as number,
      contractNumber: row[1] as string,
      name: row[2] as string,
      type: row[3] as ContractType,
      status: row[4] as ContractStatus,
      partyA: row[5] as string,
      partyB: row[6] as string,
      partyBContact: row[7] as string | null,
      partyBPhone: row[8] as string | null,
      signedDate: row[9] as string | null,
      startDate: row[10] as string | null,
      endDate: row[11] as string | null,
      amount: row[12] as number | null,
      currency: row[13] as string,
      subject: row[14] as string,
      content: row[15] as string | null,
      riskLevel: row[16] as RiskLevel,
      riskNote: row[17] as string | null,
      remark: row[18] as string | null,
      attachmentPath: row[19] as string | null,
      ownerId: row[20] as number | null,
      departmentId: row[21] as number | null,
      createdBy: row[22] as number | null,
      updatedBy: row[23] as number | null,
      createdAt: row[24] as string,
      updatedAt: row[25] as string
    }
  }

  function getAllContracts(): Contract[] {
    const result = db.exec(`
      SELECT id, contract_number, name, type, status, party_a, party_b, party_b_contact,
             party_b_phone, signed_date, start_date, end_date, amount, currency, subject,
             content, risk_level, risk_note, remark, attachment_path, owner_id, department_id,
             created_by, updated_by, created_at, updated_at
      FROM contracts
      ORDER BY created_at DESC
    `)
    if (!result.length) return []
    return result[0].values.map(rowToContract)
  }

  function getContractById(id: number): Contract | null {
    const result = db.exec(`
      SELECT id, contract_number, name, type, status, party_a, party_b, party_b_contact,
             party_b_phone, signed_date, start_date, end_date, amount, currency, subject,
             content, risk_level, risk_note, remark, attachment_path, owner_id, department_id,
             created_by, updated_by, created_at, updated_at
      FROM contracts WHERE id = ?
    `, [id])
    if (!result.length || !result[0].values.length) return null
    return rowToContract(result[0].values[0])
  }

  function getContractsByFilter(filter: ContractFilter, page = 1, pageSize = 20): PaginatedResult<Contract> {
    const conditions: string[] = []
    const values: unknown[] = []

    if (filter.keyword) {
      conditions.push('(name LIKE ? OR contract_number LIKE ? OR party_b LIKE ?)')
      const kw = `%${filter.keyword}%`
      values.push(kw, kw, kw)
    }
    if (filter.type) {
      conditions.push('type = ?')
      values.push(filter.type)
    }
    if (filter.status) {
      conditions.push('status = ?')
      values.push(filter.status)
    }
    if (filter.riskLevel) {
      conditions.push('risk_level = ?')
      values.push(filter.riskLevel)
    }
    if (filter.departmentId) {
      conditions.push('department_id = ?')
      values.push(filter.departmentId)
    }
    if (filter.ownerId) {
      conditions.push('owner_id = ?')
      values.push(filter.ownerId)
    }
    if (filter.startDateFrom) {
      conditions.push('start_date >= ?')
      values.push(filter.startDateFrom)
    }
    if (filter.startDateTo) {
      conditions.push('start_date <= ?')
      values.push(filter.startDateTo)
    }
    if (filter.endDateFrom) {
      conditions.push('end_date >= ?')
      values.push(filter.endDateFrom)
    }
    if (filter.endDateTo) {
      conditions.push('end_date <= ?')
      values.push(filter.endDateTo)
    }
    if (filter.amountMin !== undefined) {
      conditions.push('amount >= ?')
      values.push(filter.amountMin)
    }
    if (filter.amountMax !== undefined) {
      conditions.push('amount <= ?')
      values.push(filter.amountMax)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countResult = db.exec(`SELECT COUNT(*) FROM contracts ${whereClause}`, values)
    const total = countResult[0]?.values[0]?.[0] as number || 0

    // 获取分页数据
    const offset = (page - 1) * pageSize
    const result = db.exec(`
      SELECT id, contract_number, name, type, status, party_a, party_b, party_b_contact,
             party_b_phone, signed_date, start_date, end_date, amount, currency, subject,
             content, risk_level, risk_note, remark, attachment_path, owner_id, department_id,
             created_by, updated_by, created_at, updated_at
      FROM contracts ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...values, pageSize, offset])

    const data = result[0]?.values.map(rowToContract) || []

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  function createContract(data: ContractFormData): number {
    db.run(`
      INSERT INTO contracts (contract_number, name, type, status, party_a, party_b,
                             party_b_contact, party_b_phone, signed_date, start_date,
                             end_date, amount, currency, subject, content, risk_level,
                             risk_note, remark, attachment_path, owner_id, department_id,
                             created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.contractNumber, data.name, data.type, data.status, data.partyA, data.partyB,
        data.partyBContact, data.partyBPhone, data.signedDate, data.startDate,
        data.endDate, data.amount, data.currency, data.subject, data.content, data.riskLevel,
        data.riskNote, data.remark, data.attachmentPath, data.ownerId, data.departmentId,
        null, null])

    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  function updateContract(id: number, data: Partial<ContractFormData>): void {
    const updates: string[] = []
    const values: unknown[] = []

    const fields: (keyof ContractFormData)[] = [
      'contractNumber', 'name', 'type', 'status', 'partyA', 'partyB',
      'partyBContact', 'partyBPhone', 'signedDate', 'startDate',
      'endDate', 'amount', 'currency', 'subject', 'content', 'riskLevel',
      'riskNote', 'remark', 'attachmentPath', 'ownerId', 'departmentId'
    ]

    const dbFields = [
      'contract_number', 'name', 'type', 'status', 'party_a', 'party_b',
      'party_b_contact', 'party_b_phone', 'signed_date', 'start_date',
      'end_date', 'amount', 'currency', 'subject', 'content', 'risk_level',
      'risk_note', 'remark', 'attachment_path', 'owner_id', 'department_id'
    ]

    fields.forEach((field, i) => {
      if (data[field] !== undefined) {
        updates.push(`${dbFields[i]} = ?`)
        values.push(data[field])
      }
    })

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(id)
      db.run(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`, values)
    }
  }

  function deleteContract(id: number): void {
    // 先删除相关审核记录
    db.run('DELETE FROM contract_reviews WHERE contract_id = ?', [id])
    // 再删除合同
    db.run('DELETE FROM contracts WHERE id = ?', [id])
  }

  // ========== 合同审核 ==========

  function getReviewsByContractId(contractId: number): ContractReview[] {
    const result = db.exec(`
      SELECT id, contract_id, reviewer_id, reviewer_name, review_date, review_result,
             review_opinion, risk_assessment, risk_notes, created_at, updated_at
      FROM contract_reviews
      WHERE contract_id = ?
      ORDER BY review_date DESC
    `, [contractId])

    if (!result.length) return []
    return result[0].values.map(row => ({
      id: row[0] as number,
      contractId: row[1] as number,
      reviewerId: row[2] as number,
      reviewerName: row[3] as string,
      reviewDate: row[4] as string,
      reviewResult: row[5] as 'approved' | 'rejected' | 'revision_required',
      reviewOpinion: row[6] as string,
      riskAssessment: row[7] as RiskLevel | null,
      riskNotes: row[8] as string | null,
      createdAt: row[9] as string,
      updatedAt: row[10] as string
    }))
  }

  function createReview(data: ContractReviewFormData, reviewerId: number, reviewerName: string): number {
    const today = new Date().toISOString().split('T')[0]
    db.run(`
      INSERT INTO contract_reviews (contract_id, reviewer_id, reviewer_name, review_date,
                                    review_result, review_opinion, risk_assessment, risk_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.contractId, reviewerId, reviewerName, today, data.reviewResult,
        data.reviewOpinion, data.riskAssessment, data.riskNotes])

    // 更新合同状态
    let newStatus = ContractStatus.UNDER_REVIEW
    if (data.reviewResult === 'approved') {
      newStatus = ContractStatus.APPROVED
    } else if (data.reviewResult === 'rejected') {
      newStatus = ContractStatus.REJECTED
    }

    db.run('UPDATE contracts SET status = ?, updated_at = datetime("now") WHERE id = ?',
           [newStatus, data.contractId])

    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  // ========== 统计 ==========

  function getContractStats(): {
    total: number
    byStatus: Record<ContractStatus, number>
    byRiskLevel: Record<RiskLevel, number>
    byType: Record<ContractType, number>
    totalAmount: number
  } {
    const totalResult = db.exec('SELECT COUNT(*) FROM contracts')
    const total = totalResult[0]?.values[0]?.[0] as number || 0

    const statusResult = db.exec('SELECT status, COUNT(*) FROM contracts GROUP BY status')
    const byStatus = {} as Record<ContractStatus, number>
    statusResult[0]?.values.forEach(row => {
      byStatus[row[0] as ContractStatus] = row[1] as number
    })

    const riskResult = db.exec('SELECT risk_level, COUNT(*) FROM contracts GROUP BY risk_level')
    const byRiskLevel = {} as Record<RiskLevel, number>
    riskResult[0]?.values.forEach(row => {
      byRiskLevel[row[0] as RiskLevel] = row[1] as number
    })

    const typeResult = db.exec('SELECT type, COUNT(*) FROM contracts GROUP BY type')
    const byType = {} as Record<ContractType, number>
    typeResult[0]?.values.forEach(row => {
      byType[row[0] as ContractType] = row[1] as number
    })

    const amountResult = db.exec('SELECT COALESCE(SUM(amount), 0) FROM contracts')
    const totalAmount = amountResult[0]?.values[0]?.[0] as number || 0

    return { total, byStatus, byRiskLevel, byType, totalAmount }
  }

  return {
    getAllContracts,
    getContractById,
    getContractsByFilter,
    createContract,
    updateContract,
    deleteContract,
    getReviewsByContractId,
    createReview,
    getContractStats
  }
}

export type ContractRepository = ReturnType<typeof createContractRepository>
