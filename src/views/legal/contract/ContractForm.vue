<template>
  <div class="contract-form-page">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑合同' : '新增合同' }}</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <!-- 文档上传区域 -->
    <el-card class="upload-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>智能识别</span>
          <el-tag type="info" size="small">支持 PDF、Word 文档</el-tag>
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
          accept=".pdf,.doc,.docx"
        >
          <el-icon class="el-icon--upload" :size="48"><Upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 PDF、Word(.doc/.docx) 格式，系统将自动识别合同信息
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
      </div>
    </el-card>

    <el-card>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px;">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号" prop="contractNumber">
              <el-input v-model="form.contractNumber" placeholder="自动生成" :disabled="true">
                <template #append>
                  <el-button @click="form.contractNumber = contractStore.generateContractNumber()">
                    生成
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入合同名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择合同类型" style="width: 100%">
                <el-option v-for="(label, value) in contractTypeLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option v-for="(label, value) in contractStatusLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">当事人信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="甲方(我方)" prop="partyA">
              <el-input v-model="form.partyA" placeholder="请输入甲方名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="乙方(对方)" prop="partyB">
              <el-input v-model="form.partyB" placeholder="请输入乙方名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="乙方联系人">
              <el-input v-model="form.partyBContact" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="乙方电话">
              <el-input v-model="form.partyBPhone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">日期与金额</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="签订日期">
              <el-date-picker v-model="form.signedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生效日期">
              <el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到期日期">
              <el-date-picker v-model="form.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同金额">
              <el-input-number v-model="form.amount" :precision="2" :min="0" style="width: 100%" placeholder="请输入金额" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种">
              <el-select v-model="form.currency" style="width: 100%">
                <el-option label="人民币 (CNY)" value="CNY" />
                <el-option label="美元 (USD)" value="USD" />
                <el-option label="欧元 (EUR)" value="EUR" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">合同内容与风险</el-divider>

        <el-form-item label="标的物" prop="subject">
          <el-input v-model="form.subject" placeholder="请输入标的物" />
        </el-form-item>

        <el-form-item label="合同内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入合同主要内容" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="风险等级" prop="riskLevel">
              <el-select v-model="form.riskLevel" placeholder="请选择风险等级" style="width: 100%">
                <el-option v-for="(label, value) in riskLevelLabels" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="风险评估">
          <el-input v-model="form.riskNote" type="textarea" :rows="3" placeholder="请输入风险评估说明" />
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
import { Upload, Loading } from '@element-plus/icons-vue'
import { useContractStore } from '@/stores'
import {
  ContractStatus, ContractType, RiskLevel,
  contractTypeLabels, contractStatusLabels, riskLevelLabels
} from '@/types'
import type { ContractFormData } from '@/types'
import { parseContractInfo, type ContractParsedInfo } from '@/utils/documentParser'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const router = useRouter()
const route = useRoute()
const contractStore = useContractStore()

const isEdit = computed(() => !!route.params.id)
const contractId = computed(() => Number(route.params.id))

const formRef = ref<FormInstance>()
const submitting = ref(false)
const parsing = ref(false)
const parsedInfo = ref<ContractParsedInfo | null>(null)
const parsedFieldCount = computed(() => {
  if (!parsedInfo.value) return 0
  return Object.keys(parsedInfo.value).filter(k => parsedInfo.value?.[k as keyof ContractParsedInfo]).length
})

const form = reactive<ContractFormData>({
  contractNumber: '',
  name: '',
  type: ContractType.OTHER,
  status: ContractStatus.DRAFT,
  partyA: '',
  partyB: '',
  partyBContact: null,
  partyBPhone: null,
  signedDate: null,
  startDate: null,
  endDate: null,
  amount: null,
  currency: 'CNY',
  subject: '',
  content: null,
  riskLevel: RiskLevel.LOW,
  riskNote: null,
  remark: null,
  attachmentPath: null,
  ownerId: null,
  departmentId: null
})

const rules: FormRules = {
  contractNumber: [{ required: true, message: '请生成合同编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
  partyA: [{ required: true, message: '请输入甲方名称', trigger: 'blur' }],
  partyB: [{ required: true, message: '请输入乙方名称', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入标的物', trigger: 'blur' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }]
}

// 解析文档内容
async function handleFileChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return

  parsing.value = true
  parsedInfo.value = null

  try {
    let text = ''

    if (file.name.endsWith('.pdf')) {
      text = await extractPdfText(file)
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      text = await extractDocText(file)
    } else {
      ElMessage.warning('不支持的文件格式')
      return
    }

    const info = parseContractInfo(text)
    parsedInfo.value = info
    applyParsedInfo(info)
    ElMessage.success('文档解析成功')

    // 使用文件名作为合同名称（如果没有识别到）
    if (!form.name && file.name) {
      form.name = file.name.replace(/\.(pdf|doc|docx)$/i, '')
    }
  } catch (error) {
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

// 解析合同信息

// 应用解析的信息到表单
function applyParsedInfo(info: ContractParsedInfo) {
  if (info.name) form.name = info.name
  if (info.partyA) form.partyA = info.partyA
  if (info.partyB) form.partyB = info.partyB
  if (info.amount) form.amount = parseFloat(info.amount)
  if (info.signedDate) form.signedDate = info.signedDate
  if (info.startDate) form.startDate = info.startDate
  if (info.endDate) form.endDate = info.endDate
  if (info.subject) form.subject = info.subject
  if (info.partyBContact) form.partyBContact = info.partyBContact
  if (info.partyBPhone) form.partyBPhone = info.partyBPhone

  // 根据内容判断合同类型
  if (form.name || form.subject) {
    const textToCheck = (form.name + ' ' + form.subject).toLowerCase()
    if (textToCheck.includes('采购') || textToCheck.includes('购买') || textToCheck.includes('买卖')) {
      form.type = ContractType.PURCHASE
    } else if (textToCheck.includes('租赁') || textToCheck.includes('出租')) {
      form.type = ContractType.LEASE
    } else if (textToCheck.includes('服务') || textToCheck.includes('委托')) {
      form.type = ContractType.SERVICE
    } else if (textToCheck.includes('劳动') || textToCheck.includes('聘用') || textToCheck.includes('就业')) {
      form.type = ContractType.LABOR
    }
  }
}

async function loadContract() {
  if (isEdit.value && contractId.value) {
    const contract = await contractStore.loadContract(contractId.value)
    if (contract) {
      Object.assign(form, {
        contractNumber: contract.contractNumber,
        name: contract.name,
        type: contract.type,
        status: contract.status,
        partyA: contract.partyA,
        partyB: contract.partyB,
        partyBContact: contract.partyBContact,
        partyBPhone: contract.partyBPhone,
        signedDate: contract.signedDate,
        startDate: contract.startDate,
        endDate: contract.endDate,
        amount: contract.amount,
        currency: contract.currency,
        subject: contract.subject,
        content: contract.content,
        riskLevel: contract.riskLevel,
        riskNote: contract.riskNote,
        remark: contract.remark,
        attachmentPath: contract.attachmentPath,
        ownerId: contract.ownerId,
        departmentId: contract.departmentId
      })
    }
  } else {
    form.contractNumber = contractStore.generateContractNumber()
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && contractId.value) {
      await contractStore.updateContract(contractId.value, form)
      ElMessage.success('更新成功')
    } else {
      const id = await contractStore.createContract(form)
      ElMessage.success('创建成功')
      router.push(`/legal/contract/${id}`)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadContract()
})
</script>

<style scoped>
.contract-form-page {
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
</style>
