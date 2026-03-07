import type { Database } from '../index'
import type {
  LawsuitCase, CaseFormData,
  CaseProgress, CaseProgressFormData,
  CaseFilter,
  PaginatedResult
} from '@/types'
import { CaseType, CaseStatus, CaseStage, PartyRole } from '@/types'

export function createCaseRepository(db: Database) {
  function rowToCase(row: unknown[]): LawsuitCase {
    return {
      id: row[0] as number,
      caseNumber: row[1] as string,
      name: row[2] as string,
      type: row[3] as CaseType,
      status: row[4] as CaseStatus,
      stage: row[5] as CaseStage,
      ourRole: row[6] as PartyRole,
      ourParty: row[7] as string,
      ourRepresentative: row[8] as string | null,
      opponentRole: row[9] as PartyRole,
      opponentParty: row[10] as string,
      opponentRepresentative: row[11] as string | null,
      court: row[12] as string | null,
      judge: row[13] as string | null,
      courtPhone: row[14] as string | null,
      subjectAmount: row[15] as number | null,
      claimedAmount: row[16] as number | null,
      awardedAmount: row[17] as number | null,
      filingDate: row[18] as string | null,
      hearingDate: row[19] as string | null,
      closingDate: row[20] as string | null,
      cause: row[21] as string,
      description: row[22] as string | null,
      progressNote: row[23] as string | null,
      remark: row[24] as string | null,
      attachmentPath: row[25] as string | null,
      contractId: row[26] as number | null,
      handlerId: row[27] as number | null,
      departmentId: row[28] as number | null,
      createdBy: row[29] as number | null,
      updatedBy: row[30] as number | null,
      createdAt: row[31] as string,
      updatedAt: row[32] as string
    }
  }

  function getAllCases(): LawsuitCase[] {
    const result = db.exec(`
      SELECT id, case_number, name, type, status, stage, our_role, our_party, our_representative,
             opponent_role, opponent_party, opponent_representative, court, judge, court_phone,
             subject_amount, claimed_amount, awarded_amount, filing_date, hearing_date, closing_date,
             cause, description, progress_note, remark, attachment_path, contract_id, handler_id,
             department_id, created_by, updated_by, created_at, updated_at
      FROM lawsuit_cases
      ORDER BY created_at DESC
    `)
    if (!result.length) return []
    return result[0].values.map(rowToCase)
  }

  function getCaseById(id: number): LawsuitCase | null {
    const result = db.exec(`
      SELECT id, case_number, name, type, status, stage, our_role, our_party, our_representative,
             opponent_role, opponent_party, opponent_representative, court, judge, court_phone,
             subject_amount, claimed_amount, awarded_amount, filing_date, hearing_date, closing_date,
             cause, description, progress_note, remark, attachment_path, contract_id, handler_id,
             department_id, created_by, updated_by, created_at, updated_at
      FROM lawsuit_cases WHERE id = ?
    `, [id])
    if (!result.length || !result[0].values.length) return null
    return rowToCase(result[0].values[0])
  }

  function getCasesByFilter(filter: CaseFilter, page = 1, pageSize = 20): PaginatedResult<LawsuitCase> {
    const conditions: string[] = []
    const values: unknown[] = []

    if (filter.keyword) {
      conditions.push('(name LIKE ? OR case_number LIKE ? OR opponent_party LIKE ?)')
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
    if (filter.stage) {
      conditions.push('stage = ?')
      values.push(filter.stage)
    }
    if (filter.ourRole) {
      conditions.push('our_role = ?')
      values.push(filter.ourRole)
    }
    if (filter.departmentId) {
      conditions.push('department_id = ?')
      values.push(filter.departmentId)
    }
    if (filter.handlerId) {
      conditions.push('handler_id = ?')
      values.push(filter.handlerId)
    }
    if (filter.court) {
      conditions.push('court LIKE ?')
      values.push(`%${filter.court}%`)
    }
    if (filter.filingDateFrom) {
      conditions.push('filing_date >= ?')
      values.push(filter.filingDateFrom)
    }
    if (filter.filingDateTo) {
      conditions.push('filing_date <= ?')
      values.push(filter.filingDateTo)
    }
    if (filter.subjectAmountMin !== undefined) {
      conditions.push('subject_amount >= ?')
      values.push(filter.subjectAmountMin)
    }
    if (filter.subjectAmountMax !== undefined) {
      conditions.push('subject_amount <= ?')
      values.push(filter.subjectAmountMax)
    }
    if (filter.contractId) {
      conditions.push('contract_id = ?')
      values.push(filter.contractId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countResult = db.exec(`SELECT COUNT(*) FROM lawsuit_cases ${whereClause}`, values)
    const total = countResult[0]?.values[0]?.[0] as number || 0

    // 获取分页数据
    const offset = (page - 1) * pageSize
    const result = db.exec(`
      SELECT id, case_number, name, type, status, stage, our_role, our_party, our_representative,
             opponent_role, opponent_party, opponent_representative, court, judge, court_phone,
             subject_amount, claimed_amount, awarded_amount, filing_date, hearing_date, closing_date,
             cause, description, progress_note, remark, attachment_path, contract_id, handler_id,
             department_id, created_by, updated_by, created_at, updated_at
      FROM lawsuit_cases ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...values, pageSize, offset])

    const data = result[0]?.values.map(rowToCase) || []

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  function createCase(data: CaseFormData): number {
    console.log('caseRepository.createCase called with:', data)
    try {
      db.run(`
        INSERT INTO lawsuit_cases (case_number, name, type, status, stage, our_role, our_party,
                                   our_representative, opponent_role, opponent_party, opponent_representative,
                                   court, judge, court_phone, subject_amount, claimed_amount, awarded_amount,
                                   filing_date, hearing_date, closing_date, cause, description, progress_note,
                                   remark, attachment_path, contract_id, handler_id, department_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [data.caseNumber, data.name, data.type, data.status, data.stage, data.ourRole, data.ourParty,
          data.ourRepresentative, data.opponentRole, data.opponentParty, data.opponentRepresentative,
          data.court, data.judge, data.courtPhone, data.subjectAmount, data.claimedAmount, data.awardedAmount,
          data.filingDate, data.hearingDate, data.closingDate, data.cause, data.description, data.progressNote,
          data.remark, data.attachmentPath, data.contractId, data.handlerId, data.departmentId, null, null])

      const result = db.exec('SELECT last_insert_rowid()')
      const id = result[0]?.values[0]?.[0] as number || 0
      console.log('caseRepository.createCase result id:', id)
      return id
    } catch (error) {
      console.error('caseRepository.createCase error:', error)
      throw error
    }
  }

  function updateCase(id: number, data: Partial<CaseFormData>): void {
    const updates: string[] = []
    const values: unknown[] = []

    const fields: (keyof CaseFormData)[] = [
      'caseNumber', 'name', 'type', 'status', 'stage', 'ourRole', 'ourParty',
      'ourRepresentative', 'opponentRole', 'opponentParty', 'opponentRepresentative',
      'court', 'judge', 'courtPhone', 'subjectAmount', 'claimedAmount', 'awardedAmount',
      'filingDate', 'hearingDate', 'closingDate', 'cause', 'description', 'progressNote',
      'remark', 'attachmentPath', 'contractId', 'handlerId', 'departmentId'
    ]

    const dbFields = [
      'case_number', 'name', 'type', 'status', 'stage', 'our_role', 'our_party',
      'our_representative', 'opponent_role', 'opponent_party', 'opponent_representative',
      'court', 'judge', 'court_phone', 'subject_amount', 'claimed_amount', 'awarded_amount',
      'filing_date', 'hearing_date', 'closing_date', 'cause', 'description', 'progress_note',
      'remark', 'attachment_path', 'contract_id', 'handler_id', 'department_id'
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
      db.run(`UPDATE lawsuit_cases SET ${updates.join(', ')} WHERE id = ?`, values)
    }
  }

  function deleteCase(id: number): void {
    // 先删除相关进展记录
    db.run('DELETE FROM case_progress WHERE case_id = ?', [id])
    // 再删除案件
    db.run('DELETE FROM lawsuit_cases WHERE id = ?', [id])
  }

  // ========== 案件进展 ==========

  function getProgressByCaseId(caseId: number): CaseProgress[] {
    const result = db.exec(`
      SELECT id, case_id, progress_date, stage, title, content, handler_id, handler_name,
             attachment_path, created_at, updated_at
      FROM case_progress
      WHERE case_id = ?
      ORDER BY progress_date DESC
    `, [caseId])

    if (!result.length) return []
    return result[0].values.map(row => ({
      id: row[0] as number,
      caseId: row[1] as number,
      progressDate: row[2] as string,
      stage: row[3] as CaseStage,
      title: row[4] as string,
      content: row[5] as string,
      handlerId: row[6] as number | null,
      handlerName: row[7] as string | null,
      attachmentPath: row[8] as string | null,
      createdAt: row[9] as string,
      updatedAt: row[10] as string
    }))
  }

  function createProgress(data: CaseProgressFormData, handlerName?: string): number {
    db.run(`
      INSERT INTO case_progress (case_id, progress_date, stage, title, content, handler_id, handler_name, attachment_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.caseId, data.progressDate, data.stage, data.title, data.content, data.handlerId, handlerName, data.attachmentPath])

    // 更新案件的阶段和进展备忘
    db.run(`
      UPDATE lawsuit_cases
      SET stage = ?, progress_note = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [data.stage, data.content, data.caseId])

    const result = db.exec('SELECT last_insert_rowid()')
    return result[0]?.values[0]?.[0] as number || 0
  }

  function deleteProgress(id: number): void {
    db.run('DELETE FROM case_progress WHERE id = ?', [id])
  }

  // ========== 统计 ==========

  function getCaseStats(): {
    total: number
    byStatus: Record<CaseStatus, number>
    byType: Record<CaseType, number>
    byStage: Record<CaseStage, number>
    totalSubjectAmount: number
    totalClaimedAmount: number
    totalAwardedAmount: number
  } {
    const totalResult = db.exec('SELECT COUNT(*) FROM lawsuit_cases')
    const total = totalResult[0]?.values[0]?.[0] as number || 0

    const statusResult = db.exec('SELECT status, COUNT(*) FROM lawsuit_cases GROUP BY status')
    const byStatus = {} as Record<CaseStatus, number>
    statusResult[0]?.values.forEach(row => {
      byStatus[row[0] as CaseStatus] = row[1] as number
    })

    const typeResult = db.exec('SELECT type, COUNT(*) FROM lawsuit_cases GROUP BY type')
    const byType = {} as Record<CaseType, number>
    typeResult[0]?.values.forEach(row => {
      byType[row[0] as CaseType] = row[1] as number
    })

    const stageResult = db.exec('SELECT stage, COUNT(*) FROM lawsuit_cases GROUP BY stage')
    const byStage = {} as Record<CaseStage, number>
    stageResult[0]?.values.forEach(row => {
      byStage[row[0] as CaseStage] = row[1] as number
    })

    const amountResult = db.exec(`
      SELECT COALESCE(SUM(subject_amount), 0), COALESCE(SUM(claimed_amount), 0), COALESCE(SUM(awarded_amount), 0)
      FROM lawsuit_cases
    `)
    const amounts = amountResult[0]?.values[0] || [0, 0, 0]

    return {
      total,
      byStatus,
      byType,
      byStage,
      totalSubjectAmount: amounts[0] as number,
      totalClaimedAmount: amounts[1] as number,
      totalAwardedAmount: amounts[2] as number
    }
  }

  return {
    getAllCases,
    getCaseById,
    getCasesByFilter,
    createCase,
    updateCase,
    deleteCase,
    getProgressByCaseId,
    createProgress,
    deleteProgress,
    getCaseStats
  }
}

export type CaseRepository = ReturnType<typeof createCaseRepository>
