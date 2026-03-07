<template>
  <div class="case-form-page">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑案件' : '新增案件' }}</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <!-- 文档上传区域 -->
    <el-card class="upload-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>智能识别</span>
          <el-tag type="info" size="small">支持立案通知书、传票、缴费通知书等</el-tag>
        </div>
      </template>
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp"
        >
          <el-icon class="el-icon--upload" :size="48"><Upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 PDF、Word(.doc/.docx)、图片(jpg/png) 格式，系统将自动识别司法文书信息
            </div>
          </template>
        </el-upload>

        <div v-if="parsing" class="parsing-indicator">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在解析文档...</span>
        </div>

        <div v-if="parsedInfo" class="parsed-info">
          <el-alert type="success" :closable="false">
            <template #title>
              识别完成，已提取 {{ parsedFieldCount }} 个字段
            </template>
          </el-alert>
        </div>

        <!-- 文件预览区域 -->
        <div v-if="previewUrl" class="file-preview">
          <div class="preview-header">
            <span class="preview-title">{{ uploadedFileName }}</span>
            <el-button type="primary" link @click="clearPreview">
              <el-icon><Close /></el-icon>
              清除
            </el-button>
          </div>
          <div class="preview-content">
            <!-- PDF预览 -->
            <iframe v-if="previewType === 'pdf'" :src="previewUrl" class="pdf-viewer"></iframe>
            <!-- 图片预览 -->
            <img v-else-if="previewType === 'image'" :src="previewUrl" class="image-viewer" />
            <!-- Word文档提示 -->
            <div v-else class="doc-placeholder">
              <el-icon :size="48"><Document /></el-icon>
              <p>Word文档已上传</p>
              <p class="doc-tip">内容已自动识别并填充到表单</p>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 900px;">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="案号" prop="caseNumber">
              <el-input v-model="form.caseNumber" placeholder="如：(2025）川0704民初4118号">
                <template #prepend>
                  <el-tooltip content="立案通知书、传票、缴费通知书中的案件编号">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="案件名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入案件名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="案件类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
                <el-option v-for="(label, value) in caseTypeLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="案件状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                <el-option v-for="(label, value) in caseStatusLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="案件阶段" prop="stage">
              <el-select v-model="form.stage" placeholder="请选择" style="width: 100%">
                <el-option v-for="(label, value) in caseStageLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">当事人信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="我方角色" prop="ourRole">
              <el-select v-model="form.ourRole" placeholder="请选择" style="width: 100%">
                <el-option v-for="(label, value) in partyRoleLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="我方当事人" prop="ourParty">
              <el-input v-model="form.ourParty" placeholder="请输入我方当事人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="我方代理人">
              <el-input v-model="form.ourRepresentative" placeholder="请输入代理人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对方角色" prop="opponentRole">
              <el-select v-model="form.opponentRole" placeholder="请选择" style="width: 100%">
                <el-option v-for="(label, value) in partyRoleLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对方当事人" prop="opponentParty">
              <el-input v-model="form.opponentParty" placeholder="请输入对方当事人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对方代理人">
              <el-input v-model="form.opponentRepresentative" placeholder="请输入代理人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">法院与金额</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="受理法院">
              <el-input v-model="form.court" placeholder="请输入受理法院" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="承办法官">
              <el-input v-model="form.judge" placeholder="请输入承办法官" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="法院电话">
              <el-input v-model="form.courtPhone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="诉讼标的额">
              <el-input-number v-model="form.subjectAmount" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="请求金额">
              <el-input-number v-model="form.claimedAmount" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="判决金额">
              <el-input-number v-model="form.awardedAmount" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">日期信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="立案日期">
              <el-date-picker v-model="form.filingDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开庭日期">
              <el-date-picker v-model="form.hearingDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结案日期">
              <el-date-picker v-model="form.closingDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">案件内容</el-divider>

        <el-form-item label="案由" prop="cause">
          <el-input v-model="form.cause" placeholder="请输入案由" />
        </el-form-item>

        <el-form-item label="案件描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入案件描述" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Upload, Loading, QuestionFilled, Close, Document } from '@element-plus/icons-vue'
import { useCaseStore } from '@/stores'
import {
  CaseStatus, CaseType, CaseStage, PartyRole,
  caseTypeLabels, caseStatusLabels, caseStageLabels, partyRoleLabels
} from '@/types'
import type { CaseFormData } from '@/types'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const router = useRouter()
const route = useRoute()
const caseStore = useCaseStore()

const isEdit = computed(() => !!route.params.id)
const caseId = computed(() => Number(route.params.id))

const formRef = ref<FormInstance>()
const submitting = ref(false)
const parsing = ref(false)
const parsedInfo = ref<Record<string, string | null> | null>(null)
const parsedFieldCount = computed(() => {
  if (!parsedInfo.value) return 0
  return Object.keys(parsedInfo.value).filter(k => parsedInfo.value?.[k]).length
})

// 文件预览相关
const previewUrl = ref<string | null>(null)
const previewType = ref<'pdf' | 'image' | 'doc' | null>(null)
const uploadedFileName = ref('')

const form = reactive<CaseFormData>({
  caseNumber: '',
  name: '',
  type: CaseType.OTHER,
  status: CaseStatus.DRAFT,
  stage: CaseStage.PREPARATION,
  ourRole: PartyRole.PLAINTIFF,
  ourParty: '',
  ourRepresentative: null,
  opponentRole: PartyRole.DEFENDANT,
  opponentParty: '',
  opponentRepresentative: null,
  court: null,
  judge: null,
  courtPhone: null,
  subjectAmount: null,
  claimedAmount: null,
  awardedAmount: null,
  filingDate: null,
  hearingDate: null,
  closingDate: null,
  cause: '',
  description: null,
  progressNote: null,
  remark: null,
  attachmentPath: null,
  contractId: null,
  handlerId: null,
  departmentId: null
})

const rules: FormRules = {
  caseNumber: [{ required: true, message: '请输入案号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入案件名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择案件类型', trigger: 'change' }],
  ourRole: [{ required: true, message: '请选择我方角色', trigger: 'change' }],
  ourParty: [{ required: true, message: '请输入我方当事人', trigger: 'blur' }],
  opponentRole: [{ required: true, message: '请选择对方角色', trigger: 'change' }],
  opponentParty: [{ required: true, message: '请输入对方当事人', trigger: 'blur' }],
  cause: [{ required: true, message: '请输入案由', trigger: 'blur' }]
}

// 清除预览
function clearPreview() {
  if (previewUrl.value && previewType.value !== 'doc') {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  previewType.value = null
  uploadedFileName.value = ''
}

// 解析文档内容
async function handleFileChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return

  parsing.value = true
  parsedInfo.value = null
  uploadedFileName.value = file.name

  try {
    // 创建预览URL
    if (file.name.endsWith('.pdf')) {
      previewType.value = 'pdf'
      previewUrl.value = URL.createObjectURL(file)
    } else if (/\.(jpg|jpeg|png|bmp)$/i.test(file.name)) {
      previewType.value = 'image'
      previewUrl.value = URL.createObjectURL(file)
    } else if (/\.(doc|docx)$/i.test(file.name)) {
      previewType.value = 'doc'
      previewUrl.value = 'doc' // 占位符
    }

    let text = ''

    if (file.name.endsWith('.pdf')) {
      text = await extractPdfText(file)
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      text = await extractDocText(file)
    } else if (/\.(jpg|jpeg|png|bmp)$/i.test(file.name)) {
      // 图片暂时无法提取文字，后续可集成OCR
      ElMessage.warning('图片暂不支持文字识别，请使用PDF或Word文档')
      parsing.value = false
      return
    } else {
      ElMessage.warning('不支持的文件格式')
      parsing.value = false
      return
    }

    console.log('提取的文本:', text)
    const info = parseCaseInfo(text)
    parsedInfo.value = info
    applyParsedInfo(info)
    ElMessage.success('文档解析成功')

    // 使用文件名作为案件名称（如果没有识别到）
    if (!form.name && file.name) {
      form.name = file.name.replace(/\.(pdf|doc|docx)$/i, '')
    }
  } catch (error) {
    console.error('文档解析失败:', error)
    ElMessage.error('文档解析失败: ' + (error as Error).message)
  } finally {
    parsing.value = false
  }
}

// 提取 PDF 文本
async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
    text += pageText + '\n'
  }
  return text
}

// 提取 Word 文档文本
async function extractDocText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

// 解析案件信息（立案通知书、传票、起诉状、缴费通知书等）
function parseCaseInfo(text: string): Record<string, string | null> {
  const info: Record<string, string | null> = {
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

  // ========== 法院案号 ==========
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
      break
    }
  }

  if (!info.courtCaseNumber) {
    for (const pattern of caseNumberPatterns) {
      const match = text.match(pattern)
      if (match) {
        info.courtCaseNumber = cleanCaseNumber(match[0])
        break
      }
    }
  }

  if (!info.courtCaseNumber) {
    const allCaseNumbers = text.match(/[（(]\s*\d{4}\s*[）)].*?[号]/g)
    if (allCaseNumbers && allCaseNumbers.length > 0) {
      for (const num of allCaseNumbers) {
        if (/[民刑行商知][初终再监执]?/.test(num)) {
          info.courtCaseNumber = cleanCaseNumber(num)
          break
        }
      }
    }
  }

  // ========== 当事人识别（增强版）==========
  // 缴费通知书中常见的格式：缴费人、交款人、申请人等

  // 原告/申请人/缴费人/交款人
  const partyAKeywords = [
    '原告', '起诉人', '申请人', '缴费人', '交款人', '缴款人',
    '执行申请人', '再审申请人', '申诉人', '上诉人'
  ]

  for (const keyword of partyAKeywords) {
    // 标准格式：原告：XXX
    const standardPattern = new RegExp(`${keyword}[（(][^）)]*[）)]?[：:]\\s*([^\\n，,；;。.\\d]{2,50})`, 'i')
    let match = text.match(standardPattern)
    if (match) {
      info.plaintiff = cleanPartyName(match[1])
      break
    }

    // 无括号格式：原告：XXX 或 原告XXX
    const simplePattern = new RegExp(`${keyword}[：:：]?\\s*([^\\n，,；;。.\\d]{2,50})`, 'i')
    match = text.match(simplePattern)
    if (match) {
      const name = cleanPartyName(match[1])
      // 验证不是日期或数字
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

  // 缴费通知书特殊格式：缴费人信息
  if (!info.plaintiff) {
    const paymentPatterns = [
      /缴费[人单位][：:]\s*([^\\n，,；;]{2,50})/,
      /交款[人单位][：:]\s*([^\\n，,；;]{2,50})/,
      /缴款[人单位][：:]\s*([^\\n，,；;]{2,50})/,
      /付款[人单位][：:]\s*([^\\n，,；;]{2,50})/,
    ]
    for (const pattern of paymentPatterns) {
      const match = text.match(pattern)
      if (match) {
        info.plaintiff = cleanPartyName(match[1])
        break
      }
    }
  }

  // 缴费通知书中识别对方当事人（收费单位通常不是被告，但从案由推断）
  if (!info.defendant && info.plaintiff) {
    // 尝试从案件信息中找对方
    const opponentPatterns = [
      /被[告执行申请][人单位][：:]\s*([^\\n，,；;]{2,50})/,
      /相对人[：:]\s*([^\\n，,；;]{2,50})/,
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

      // 查找原告行
      if (!info.plaintiff) {
        for (const kw of partyAKeywords) {
          if (line.startsWith(kw)) {
            const name = line.replace(new RegExp(`^${kw}[：:：\\s]*`), '').trim()
            if (name && name.length >= 2 && name.length <= 50 && !/^[\d\s]+$/.test(name)) {
              info.plaintiff = cleanPartyName(name)
              break
            }
            // 可能在下一行
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

      // 查找被告行
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

  // ========== 代理人 ==========
  const agentPatterns = [
    { regex: /原告[^代]*代理[人律师][：:]\s*([^\\n，,；;]+)/, field: 'plaintiffAgent' },
    { regex: /申请[^代]*代理[人律师][：:]\s*([^\\n，,；;]+)/, field: 'plaintiffAgent' },
    { regex: /被告[^代]*代理[人律师][：:]\s*([^\\n，,；;]+)/, field: 'defendantAgent' },
    { regex: /被申请[^代]*代理[人律师][：:]\s*([^\\n，,；;]+)/, field: 'defendantAgent' },
    { regex: /委托代理[人][：:]\s*([^\\n，,；;]+)/, field: 'plaintiffAgent' },
    { regex: /代理[人律师][：:]\s*([^\\n，,；;]+)/, field: 'plaintiffAgent' },
  ]

  for (const { regex, field } of agentPatterns) {
    const match = text.match(regex)
    if (match) {
      info[field] = match[1].trim().substring(0, 20)
    }
  }

  // ========== 案件名称 ==========
  const namePatterns = [
    /案件名称[：:]\s*([^\\n]+)/,
    /案由[：:]\s*([^\\n]{4,30})/,
  ]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.name = match[1].trim()
      break
    }
  }

  // ========== 受理法院 ==========
  const courtPatterns = [
    /受理法院[：:]\s*([^\\n]+)/,
    /审[理判]法院[：:]\s*([^\\n]+)/,
    /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][省市县区]?[^\\n]{2,15}人民法院)/,
    /([^\\n]*中级人民法院)/,
  ]
  for (const pattern of courtPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.court = match[1].trim().replace(/[：:]/g, '')
      break
    }
  }

  // ========== 承办法官 ==========
  const judgePatterns = [
    /承办法官[：:]\s*([^\\n，,；;]+)/,
    /审判长[：:]\s*([^\\n，,；;]+)/,
    /审判员[：:]\s*([^\\n，,；;]+)/,
    /法官[：:]\s*([^\\n，,；;]+)/,
    /联系电话[：:][^\\d]*(\\d{3,4}[-]?\\d{7,8})/,  // 缴费通知书格式
  ]
  for (const pattern of judgePatterns) {
    const match = text.match(pattern)
    if (match) {
      info.judge = match[1].trim().replace(/[：:]/g, '').substring(0, 10)
      break
    }
  }

  // ========== 法院电话 ==========
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

  // ========== 立案日期 ==========
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

  // ========== 开庭日期 ==========
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

  // ========== 案由 ==========
  const causePatterns = [
    /案由[：:]\s*([^\\n，,；;]+)/,
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

  // ========== 诉讼标的额 ==========
  const amountPatterns = [
    /诉讼标的[额]?[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /争议金额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /标的额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,
    /[人民币￥]\s*([\d,]+\.?\d*)\s*元/,
    /应[缴交]金额[：:]\s*[人民币￥]?\s*([\d,]+\.?\d*)\s*元?/,  // 缴费通知书
  ]
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      info.subjectAmount = match[1].replace(/,/g, '')
      break
    }
  }

  return info
}

// 清理当事人名称
function cleanPartyName(name: string): string {
  return name
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[：:]+\s*$/, '')
    .replace(/[，,。.；;].*$/, '')
    .replace(/住所地.*/g, '')
    .replace(/住址.*/g, '')
    .replace(/统一社会信用代码.*/g, '')
    .replace(/身份证号.*/g, '')
    .replace(/法定代表人.*/g, '')
    .replace(/\d{15,18}/g, '')  // 移除身份证号
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50)
}

// 清理案号格式
function cleanCaseNumber(caseNumber: string): string {
  return caseNumber
    .replace(/[：:]\s*/g, '')
    .replace(/\s+/g, '')
    .replace(/[（(]/g, '（')
    .replace(/[）)]/g, '）')
    .trim()
}

// 标准化日期格式
function normalizeDate(dateStr: string): string {
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

// 应用解析的信息到表单
function applyParsedInfo(info: Record<string, string | null>) {
  if (info.courtCaseNumber) form.caseNumber = info.courtCaseNumber
  if (info.name) form.name = info.name

  if (info.plaintiff) {
    form.ourParty = info.plaintiff
    form.ourRole = PartyRole.PLAINTIFF
  }
  if (info.defendant) {
    form.opponentParty = info.defendant
    form.opponentRole = PartyRole.DEFENDANT
  }
  if (info.plaintiffAgent) form.ourRepresentative = info.plaintiffAgent
  if (info.defendantAgent) form.opponentRepresentative = info.defendantAgent
  if (info.court) form.court = info.court
  if (info.judge) form.judge = info.judge
  if (info.courtPhone) form.courtPhone = info.courtPhone
  if (info.filingDate) form.filingDate = info.filingDate
  if (info.hearingDate) form.hearingDate = info.hearingDate
  if (info.cause) form.cause = info.cause
  if (info.subjectAmount) form.subjectAmount = parseFloat(info.subjectAmount)

  if (info.cause) {
    const cause = info.cause.toLowerCase()
    if (cause.includes('劳动') || cause.includes('工伤')) {
      form.type = CaseType.LABOR_DISPUTE
    } else if (cause.includes('合同') || cause.includes('买卖') || cause.includes('借款')) {
      form.type = CaseType.CONTRACT_DISPUTE
    } else if (cause.includes('行政')) {
      form.type = CaseType.ADMINISTRATIVE
    } else if (cause.includes('知识产权') || cause.includes('专利') || cause.includes('商标')) {
      form.type = CaseType.INTELLECTUAL_PROPERTY
    } else if (cause.includes('仲裁')) {
      form.type = CaseType.ARBITRATION
    }
  }
}

async function loadCase() {
  if (isEdit.value && caseId.value) {
    const lawsuitCase = await caseStore.loadCase(caseId.value)
    if (lawsuitCase) {
      Object.assign(form, {
        caseNumber: lawsuitCase.caseNumber,
        name: lawsuitCase.name,
        type: lawsuitCase.type,
        status: lawsuitCase.status,
        stage: lawsuitCase.stage,
        ourRole: lawsuitCase.ourRole,
        ourParty: lawsuitCase.ourParty,
        ourRepresentative: lawsuitCase.ourRepresentative,
        opponentRole: lawsuitCase.opponentRole,
        opponentParty: lawsuitCase.opponentParty,
        opponentRepresentative: lawsuitCase.opponentRepresentative,
        court: lawsuitCase.court,
        judge: lawsuitCase.judge,
        courtPhone: lawsuitCase.courtPhone,
        subjectAmount: lawsuitCase.subjectAmount,
        claimedAmount: lawsuitCase.claimedAmount,
        awardedAmount: lawsuitCase.awardedAmount,
        filingDate: lawsuitCase.filingDate,
        hearingDate: lawsuitCase.hearingDate,
        closingDate: lawsuitCase.closingDate,
        cause: lawsuitCase.cause,
        description: lawsuitCase.description,
        progressNote: lawsuitCase.progressNote,
        remark: lawsuitCase.remark,
        contractId: lawsuitCase.contractId,
        handlerId: lawsuitCase.handlerId,
        departmentId: lawsuitCase.departmentId
      })
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) {
    console.error('Form ref not found')
    return
  }

  try {
    const valid = await formRef.value.validate()
    if (!valid) {
      console.log('Validation failed')
      return
    }
  } catch (error) {
    console.error('Validation error:', error)
    ElMessage.warning('请填写所有必填项')
    return
  }

  submitting.value = true
  try {
    const submitData: CaseFormData = {
      caseNumber: form.caseNumber,
      name: form.name,
      type: form.type,
      status: form.status,
      stage: form.stage,
      ourRole: form.ourRole,
      ourParty: form.ourParty,
      ourRepresentative: form.ourRepresentative,
      opponentRole: form.opponentRole,
      opponentParty: form.opponentParty,
      opponentRepresentative: form.opponentRepresentative,
      court: form.court,
      judge: form.judge,
      courtPhone: form.courtPhone,
      subjectAmount: form.subjectAmount,
      claimedAmount: form.claimedAmount,
      awardedAmount: form.awardedAmount,
      filingDate: form.filingDate,
      hearingDate: form.hearingDate,
      closingDate: form.closingDate,
      cause: form.cause,
      description: form.description,
      progressNote: form.progressNote,
      remark: form.remark,
      attachmentPath: form.attachmentPath,
      contractId: form.contractId,
      handlerId: form.handlerId,
      departmentId: form.departmentId
    }

    console.log('Submitting case data:', submitData)

    if (isEdit.value && caseId.value) {
      await caseStore.updateCase(caseId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      const id = await caseStore.createCase(submitData)
      ElMessage.success('创建成功')
      router.push(`/legal/case/${id}`)
    }
  } catch (error) {
    console.error('Submit error:', error)
    ElMessage.error('提交失败: ' + (error as Error).message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCase()
})
</script>

<style scoped>
.case-form-page {
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

.upload-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
}

.parsing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
}

.parsed-info {
  width: 100%;
}

.file-preview {
  width: 100%;
  margin-top: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.preview-title {
  font-weight: 500;
  color: #303133;
}

.preview-content {
  padding: 16px;
  background: #fff;
}

.pdf-viewer {
  width: 100%;
  height: 500px;
  border: none;
}

.image-viewer {
  max-width: 100%;
  max-height: 500px;
  display: block;
  margin: 0 auto;
}

.doc-placeholder {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.doc-placeholder p {
  margin-top: 16px;
}

.doc-tip {
  font-size: 12px;
  margin-top: 8px !important;
  color: #c0c4cc;
}
</style>
