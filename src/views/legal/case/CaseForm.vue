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
import { parseCaseInfo, type CaseParsedInfo } from '@/utils/documentParser'
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
const parsedInfo = ref<CaseParsedInfo | null>(null)
const parsedFieldCount = computed(() => {
  if (!parsedInfo.value) return 0
  return Object.keys(parsedInfo.value).filter(k => parsedInfo.value?.[k as keyof CaseParsedInfo]).length
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


// 应用解析的信息到表单
function applyParsedInfo(info: CaseParsedInfo) {
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
