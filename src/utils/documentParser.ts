/**
 * 文档解析工具
 * 从司法文书和合同文档中提取结构化信息
 */

// ========== 案件信息解析 ==========

export interface CaseParsedInfo {
  courtCaseNumber: string | null
  name: string | null
  plaintiff: string | null
  defendant: string | null
  appellant: string | null
  appellee: string | null
  court: string | null
  judge: string | null
  courtPhone: string | null
  filingDate: string | null
  hearingDate: string | null
  cause: string | null
  subjectAmount: string | null
  plaintiffAgent: string | null
  defendantAgent: string | null
}

/**
 * 解析案件信息（立案通知书、传票、起诉状、缴费通知书等）
 */
export function parseCaseInfo(text: string): CaseParsedInfo {
  const info: CaseParsedInfo = {
    courtCaseNumber: null,
    name: null,
    plaintiff: null,
    defendant: null,
    appellant: null,
    appellee: null,
    court: null,
    judge: null,
    courtPhone: null,
    filingDate: null,
    hearingDate: null,
    cause: null,
    subjectAmount: null,
    plaintiffAgent: null,
    defendantAgent: null,
  }

  // 法院案号
  parseCaseNumber(text, info)

  // 当事人识别
  parseParties(text, info)

  // 代理人
  parseAgents(text, info)

  // 案件名称
  parseCaseName(text, info)

  // 受理法院
  parseCourt(text, info)

  // 承办法官
  parseJudge(text, info)

  // 法院电话
  parseCourtPhone(text, info)

  // 立案日期
  parseFilingDate(text, info)

  // 开庭日期
  parseHearingDate(text, info)

  // 案由
  parseCause(text, info)

  // 诉讼标的额
  parseSubjectAmount(text, info)

  return info
}

function parseCaseNumber(text: string, info: CaseParsedInfo): void {
  const caseNumberPatterns = [
    /[（(]\s*\d{4}\s*[）)]\s*[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼]\s*\d{0,4}\s*[民刑行商知][初终再监执]?[判]?\s*[第]?\s*\d+\s*号/,
    /[（(]\s*\d{4}\s*[）)]\s*[\u4e00-\u9fa5]{1,10}\s*[民刑行商知]\s*[初终再监执]?\s*[判]?\s*[第]?\s*\d+\s*号/,
  ]

  const labeledPatterns = [
    /案[件]?号[：:]\s*([（(].*?号)/,
    /编[号]?[：:]\s*([（(].*?号)/,
    /文书号[：:]\s*([（(].*?号)/,
  ]

  for (const pattern of labeledPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      info.courtCaseNumber = cleanCaseNumber(match[1])
      return
    }
  }

  for (const pattern of caseNumberPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.courtCaseNumber = cleanCaseNumber(match[0])
      return
    }
  }

  const allCaseNumbers = text.match(/[（(]\s*\d{4}\s*[）)].*?[号]/g)
  if (allCaseNumbers && allCaseNumbers.length > 0) {
    for (const num of allCaseNumbers) {
      if (/[民刑行商知][初终再监执]?/.test(num)) {
        info.courtCaseNumber = cleanCaseNumber(num)
        return
      }
    }
  }
}

function parseParties(text: string, info: CaseParsedInfo): void {
  // 原告/申请人/缴费人/交款人
  const partyAKeywords = [
    '原告', '起诉人', '申请人', '缴费人', '交款人', '缴款人',
    '执行申请人', '再审申请人', '申诉人', '上诉人'
  ]

  for (const keyword of partyAKeywords) {
    const standardPattern = new RegExp(`${keyword}[（(][^）)]*[）)]?[：:]\\s*([^\\n，,；;。.\\d]{2,50})`, 'i')
    let match = text.match(standardPattern)
    if (match) {
      info.plaintiff = cleanPartyName(match[1])
      break
    }

    const simplePattern = new RegExp(`${keyword}[：:：]?\\s*([^\\n，,；;。.\\d]{2,50})`, 'i')
    match = text.match(simplePattern)
    if (match) {
      const name = cleanPartyName(match[1])
      if (name && !/^[\d\s年月日号-]+$/.test(name)) {
        info.plaintiff = name
        break
      }
    }
  }

  // 被告/被申请人/被执行人
  const partyBKeywords = [
    '被告', '被起诉人', '被申请人', '被执行人', '被上诉人',
    '被申诉人', '第三人', '利害关系人'
  ]

  for (const keyword of partyBKeywords) {
    const standardPattern = new RegExp(`${keyword}[（(][^）)]*[）)]?[：:]\\s*([^\\n，,；;。.\\d]{2,50})`, 'i')
    let match = text.match(standardPattern)
    if (match) {
      info.defendant = cleanPartyName(match[1])
      break
    }

    const simplePattern = new RegExp(`${keyword}[：:：]?\\s*([^\\n，,；;。.\\d]{2,50})`, 'i')
    match = text.match(simplePattern)
    if (match) {
      const name = cleanPartyName(match[1])
      if (name && !/^[\d\s年月日号-]+$/.test(name)) {
        info.defendant = name
        break
      }
    }
  }

  // 缴费通知书特殊格式
  if (!info.plaintiff) {
    const paymentPatterns = [
      /缴费[人单位][：:]\s*([^\n，,；;]{2,50})/,
      /交款[人单位][：:]\s*([^\n，,；;]{2,50})/,
      /缴款[人单位][：:]\s*([^\n，,；;]{2,50})/,
      /付款[人单位][：:]\s*([^\n，,；;]{2,50})/,
    ]
    for (const pattern of paymentPatterns) {
      const match = text.match(pattern)
      if (match) {
        info.plaintiff = cleanPartyName(match[1])
        break
      }
    }
  }

  // 缴费通知书中识别对方当事人
  if (!info.defendant && info.plaintiff) {
    const opponentPatterns = [
      /被[告执行申请][人单位][：:]\s*([^\n，,；;]{2,50})/,
      /相对人[：:]\s*([^\n，,；;]{2,50})/,
    ]
    for (const pattern of opponentPatterns) {
      const match = text.match(pattern)
      if (match) {
        info.defendant = cleanPartyName(match[1])
        break
      }
    }
  }

  // 当事人上下文查找（处理多行格式）
  if (!info.plaintiff || !info.defendant) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (!info.plaintiff) {
        for (const kw of partyAKeywords) {
          if (line.startsWith(kw)) {
            const name = line.replace(new RegExp(`^${kw}[：:：\\s]*`), '').trim()
            if (name && name.length >= 2 && name.length <= 50 && !/^[\d\s]+$/.test(name)) {
              info.plaintiff = cleanPartyName(name)
              break
            }
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim()
              if (nextLine && nextLine.length >= 2 && !/^[：:\\d]+$/.test(nextLine)) {
                info.plaintiff = cleanPartyName(nextLine.substring(0, 50))
                break
              }
            }
          }
        }
      }

      if (!info.defendant) {
        for (const kw of partyBKeywords) {
          if (line.startsWith(kw)) {
            const name = line.replace(new RegExp(`^${kw}[：:：\\s]*`), '').trim()
            if (name && name.length >= 2 && name.length <= 50 && !/^[\d\s]+$/.test(name)) {
              info.defendant = cleanPartyName(name)
              break
            }
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim()
              if (nextLine && nextLine.length >= 2 && !/^[：:\\d]+$/.test(nextLine)) {
                info.defendant = cleanPartyName(nextLine.substring(0, 50))
                break
              }
            }
          }
        }
      }
    }
  }
}

function parseAgents(text: string, info: CaseParsedInfo): void {
  const agentPatterns = [
    { regex: /原告[^代]*代理[人律师][：:]\s*([^\n，,；;]+)/, field: 'plaintiffAgent' as const },
    { regex: /申请[^代]*代理[人律师][：:]\s*([^\n，,；;]+)/, field: 'plaintiffAgent' as const },
    { regex: /被告[^代]*代理[人律师][：:]\s*([^\n，,；;]+)/, field: 'defendantAgent' as const },
    { regex: /被申请[^代]*代理[人律师][：:]\s*([^\n，,；;]+)/, field: 'defendantAgent' as const },
    { regex: /委托代理[人][：:]\s*([^\n，,；;]+)/, field: 'plaintiffAgent' as const },
    { regex: /代理[人律师][：:]\s*([^\n，,；;]+)/, field: 'plaintiffAgent' as const },
  ]

  for (const { regex, field } of agentPatterns) {
    const match = text.match(regex)
    if (match) {
      info[field] = match[1].trim().substring(0, 20)
    }
  }
}

function parseCaseName(text: string, info: CaseParsedInfo): void {
  const namePatterns = [
    /案件名称[：:]\s*([^\n]+)/,
    /案由[：:]\s*([^\n]{4,30})/,
  ]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.name = match[1].trim()
      break
    }
  }
}

function parseCourt(text: string, info: CaseParsedInfo): void {
  const courtPatterns = [
    /受理法院[：:]\s*([^\n]+)/,
    /审[理判]法院[：:]\s*([^\n]+)/,
    /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][省市县区]?[^\n]{2,15}人民法院)/,
    /([^\n]*中级人民法院)/,
  ]
  for (const pattern of courtPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.court = match[1].trim().replace(/[：:]/g, '')
      break
    }
  }
}

function parseJudge(text: string, info: CaseParsedInfo): void {
  const judgePatterns = [
    /承办法官[：:]\s*([^\n，,；;]+)/,
    /审判长[：:]\s*([^\n，,；;]+)/,
    /审判员[：:]\s*([^\n，,；;]+)/,
    /法官[：:]\s*([^\n，,；;]+)/,
    /联系电话[：:][^\d]*(\d{3,4}[-]?\d{7,8})/,
  ]
  for (const pattern of judgePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.judge = match[1].trim().replace(/[：:]/g, '').substring(0, 10)
      break
    }
  }
}

function parseCourtPhone(text: string, info: CaseParsedInfo): void {
  const phonePatterns = [
    /法院电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
    /联系电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
    /办公电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
    /电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
  ]
  for (const pattern of phonePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.courtPhone = match[1]
      break
    }
  }
}

function parseFilingDate(text: string, info: CaseParsedInfo): void {
  const filingDatePatterns = [
    /立案[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/,
    /受理[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/,
    /登记[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/,
    /\s(\d{4})[-年](\d{1,2})[-月](\d{1,2})[日]?\s*立[案件]/,
  ]
  for (const pattern of filingDatePatterns) {
    const match = text.match(pattern)
    if (match) {
      if (match[2] && match[3]) {
        info.filingDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else {
        info.filingDate = normalizeDate(match[1])
      }
      break
    }
  }
}

function parseHearingDate(text: string, info: CaseParsedInfo): void {
  const hearingDatePatterns = [
    /开庭[时]间[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/,
    /开庭[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/,
    /传票[^日]*(\d{4}[-年]\d{1,2}[-月]\d{1,2})[日]/,
  ]
  for (const pattern of hearingDatePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.hearingDate = normalizeDate(match[1])
      break
    }
  }
}

function parseCause(text: string, info: CaseParsedInfo): void {
  const causePatterns = [
    /案由[：:]\s*([^\n，,；;]+)/,
  ]
  for (const pattern of causePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.cause = match[1].trim().substring(0, 30)
      break
    }
  }

  if (!info.cause) {
    const commonCauses = ['买卖合同纠纷', '借款合同纠纷', '租赁合同纠纷', '劳动争议',
      '机动车交通事故责任纠纷', '民间借贷纠纷', '物业服务合同纠纷', '房屋买卖合同纠纷',
      '建设工程合同纠纷', '知识产权纠纷', '离婚纠纷', '继承纠纷', '人身损害赔偿纠纷',
      '信用卡纠纷', '金融借款合同纠纷', '追偿权纠纷', '保证合同纠纷']
    for (const cause of commonCauses) {
      if (text.includes(cause)) {
        info.cause = cause
        break
      }
    }
  }
}

function parseSubjectAmount(text: string, info: CaseParsedInfo): void {
  const amountPatterns = [
    /诉讼标的[额]?[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /争议金额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /标的额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /[人民币￥]\s*([\d,]+\.?\d*)\s*元/,
    /应[缴交]金额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
  ]
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.subjectAmount = match[1].replace(/,/g, '')
      break
    }
  }
}

// ========== 合同信息解析 ==========

export interface ContractParsedInfo {
  name: string | null
  partyA: string | null
  partyB: string | null
  amount: string | null
  signedDate: string | null
  startDate: string | null
  endDate: string | null
  subject: string | null
  partyBContact: string | null
  partyBPhone: string | null
}

/**
 * 解析合同信息
 */
export function parseContractInfo(text: string): ContractParsedInfo {
  const info: ContractParsedInfo = {
    name: null,
    partyA: null,
    partyB: null,
    amount: null,
    signedDate: null,
    startDate: null,
    endDate: null,
    subject: null,
    partyBContact: null,
    partyBPhone: null
  }

  // 合同名称
  const namePatterns = [
    /合同名称[：:]\s*([^\n]+)/,
    /关于[：:]?\s*([^\n]{5,50})合同/,
    /^([^\n]{5,50}合同)/m
  ]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.name = match[1].trim()
      break
    }
  }

  // 甲方
  const partyAPatterns = [
    /甲方[（(]出租方|买方|委托方[）)]?[：:]\s*([^\n]+)/,
    /甲方[：:]\s*([^\n]+)/,
    /出租方[：:]\s*([^\n]+)/,
    /买方[：:]\s*([^\n]+)/
  ]
  for (const pattern of partyAPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.partyA = cleanPartyName(match[1])
      break
    }
  }

  // 乙方
  const partyBPatterns = [
    /乙方[（(]承租方|卖方|受托方[）)]?[：:]\s*([^\n]+)/,
    /乙方[：:]\s*([^\n]+)/,
    /承租方[：:]\s*([^\n]+)/,
    /卖方[：:]\s*([^\n]+)/,
    /供应商[：:]\s*([^\n]+)/
  ]
  for (const pattern of partyBPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.partyB = cleanPartyName(match[1])
      break
    }
  }

  // 金额
  const amountPatterns = [
    /合同[总]?金额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /总价[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /金额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /[人民币￥]\s*([\d,]+\.?\d*)\s*元/
  ]
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.amount = match[1].replace(/,/g, '')
      break
    }
  }

  // 签订日期
  const datePatterns = [
    /签订[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
    /签署[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/,
    /(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)\s*签订/
  ]
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.signedDate = normalizeDate(match[1])
      break
    }
  }

  // 合同期限
  const periodMatch = text.match(/合同期限[：:]?\s*(?:自\s*)?(\d{4}[-年]\d{1,2}[-月]\d{1,2})?[至到]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/)
  if (periodMatch) {
    if (periodMatch[1]) info.startDate = normalizeDate(periodMatch[1])
    if (periodMatch[2]) info.endDate = normalizeDate(periodMatch[2])
  }

  // 生效日期
  const startDateMatch = text.match(/生效[日]期[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2})/)
  if (startDateMatch) {
    info.startDate = normalizeDate(startDateMatch[1])
  }

  // 标的物
  const subjectPatterns = [
    /标的物[：:]\s*([^\n]+)/,
    /标的[：:]\s*([^\n]+)/,
    /项目名称[：:]\s*([^\n]+)/
  ]
  for (const pattern of subjectPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.subject = match[1].trim().substring(0, 100)
      break
    }
  }

  // 联系人
  const contactMatch = text.match(/联系人[：:]\s*([^\n]+)/)
  if (contactMatch) {
    info.partyBContact = contactMatch[1].trim().substring(0, 20)
  }

  // 电话
  const phonePatterns = [
    /联系电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
    /电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
    /手机[：:]\s*(1[3-9]\d{9})/
  ]
  for (const pattern of phonePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.partyBPhone = match[1]
      break
    }
  }

  return info
}

// ========== 通用工具函数 ==========

/**
 * 清理当事人名称
 */
export function cleanPartyName(name: string): string {
  return name
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[：:]+\s*$/, '')
    .replace(/[，,。.；;].*$/, '')
    .replace(/住所地.*/g, '')
    .replace(/住址.*/g, '')
    .replace(/统一社会信用代码.*/g, '')
    .replace(/身份证号.*/g, '')
    .replace(/法定代表人.*/g, '')
    .replace(/\d{15,18}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50)
}

/**
 * 清理案号格式
 */
export function cleanCaseNumber(caseNumber: string): string {
  return caseNumber
    .replace(/[：:]\s*/g, '')
    .replace(/\s+/g, '')
    .replace(/[（(]/g, '（')
    .replace(/[）)]/g, '）')
    .trim()
}

/**
 * 标准化日期格式
 */
export function normalizeDate(dateStr: string): string {
  const normalized = dateStr
    .replace(/[年月]/g, '-')
    .replace(/日/g, '')
    .replace(/-+/g, '-')
    .replace(/-$/, '')

  const match = normalized.match(/^\d{4}-\d{1,2}-\d{1,2}$/)
  if (match) {
    const parts = normalized.split('-')
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }
  return normalized
}
