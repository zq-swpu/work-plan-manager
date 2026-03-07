import * as XLSX from 'xlsx'
import type { Task, TaskFormData } from '@/types'
import { TaskStatus, QuadrantType, statusLabels, quadrantLabels } from '@/types'
import dayjs from 'dayjs'

// 导出任务到 Excel
export async function exportToExcel(tasks: Task[]): Promise<void> {
  const data = tasks.map((task, index) => ({
    '序号': index + 1,
    '状态': statusLabels[task.status],
    '逾期天数': calculateOverdueDays(task),
    '计划明细': task.planDetail,
    '四象限分类': quadrantLabels[task.quadrant],
    '开始日期': task.startDate || '',
    '截至日期': task.dueDate || '',
    '完成进度': task.progress < 0 ? '已取消' : `${task.progress}%`,
    '实际完成日期': task.actualCompleteDate || '',
    '完成情况说明': task.completionNote || '',
    '备注说明': task.remark || ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '工作计划')

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 6 },   // 序号
    { wch: 8 },   // 状态
    { wch: 8 },   // 逾期天数
    { wch: 40 },  // 计划明细
    { wch: 12 },  // 四象限分类
    { wch: 12 },  // 开始日期
    { wch: 12 },  // 截至日期
    { wch: 10 },  // 完成进度
    { wch: 12 },  // 实际完成日期
    { wch: 30 },  // 完成情况说明
    { wch: 30 }   // 备注说明
  ]

  const fileName = `工作计划_${dayjs().format('YYYY-MM-DD')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

// 从 Excel 解析任务数据
export async function parseExcelFile(file: File): Promise<TaskFormData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)

        const tasks: TaskFormData[] = jsonData.map((row: any) => {
          // 映射状态
          let status = TaskStatus.NOT_STARTED
          const statusText = String(row['状态'] || '').trim()
          if (statusText === '已完成') status = TaskStatus.COMPLETED
          else if (statusText === '进行中') status = TaskStatus.IN_PROGRESS
          else if (statusText === '未开始') status = TaskStatus.NOT_STARTED
          else if (statusText === '已取消') status = TaskStatus.CANCELLED

          // 映射四象限
          let quadrant = QuadrantType.IMPORTANT_URGENT
          const quadrantText = String(row['四象限分类'] || row['四象限'] || '').trim()
          if (quadrantText.includes('重要') && quadrantText.includes('紧急') && !quadrantText.includes('不')) {
            quadrant = QuadrantType.IMPORTANT_URGENT
          } else if (quadrantText.includes('重要') && quadrantText.includes('不紧急')) {
            quadrant = QuadrantType.IMPORTANT_NOT_URGENT
          } else if (quadrantText.includes('不重要') && quadrantText.includes('紧急')) {
            quadrant = QuadrantType.NOT_IMPORTANT_URGENT
          } else if (quadrantText.includes('不重要') && quadrantText.includes('不紧急')) {
            quadrant = QuadrantType.NOT_IMPORTANT_NOT_URGENT
          }

          // 解析进度
          let progress = 0
          const progressText = String(row['完成进度'] || '0')
          if (progressText === '已取消') {
            progress = -1
          } else {
            progress = parseInt(progressText.replace('%', ''), 10) || 0
          }

          return {
            status,
            planDetail: String(row['计划明细'] || row['任务'] || row['明细'] || '').trim(),
            quadrant,
            startDate: parseDate(row['开始日期']),
            dueDate: parseDate(row['截至日期'] || row['截止日期'] || row['结束日期']),
            progress,
            actualCompleteDate: parseDate(row['实际完成日期']),
            completionNote: String(row['完成情况说明'] || row['完成说明'] || '').trim(),
            remark: String(row['备注说明'] || row['备注'] || '').trim()
          }
        }).filter(task => task.planDetail) // 过滤掉没有计划明细的行

        resolve(tasks)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

// 解析日期字符串
function parseDate(value: unknown): string {
  if (!value) return ''

  // 如果是 Excel 日期数字
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }

  // 如果是字符串
  const str = String(value).trim()
  if (!str) return ''

  // 尝试多种日期格式
  const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY年M月D日', 'M/D/YYYY', 'D/M/YYYY']
  for (const format of formats) {
    const parsed = dayjs(str, format)
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD')
    }
  }

  return ''
}

// 计算逾期天数
function calculateOverdueDays(task: Task): number {
  if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return 0
  if (!task.dueDate) return 0

  const today = dayjs()
  const dueDate = dayjs(task.dueDate)
  return dueDate.isBefore(today) ? today.diff(dueDate, 'day') : 0
}

// 导出 CSV
export function exportToCSV(tasks: Task[]): void {
  const headers = ['序号', '状态', '逾期天数', '计划明细', '四象限分类', '开始日期', '截至日期', '完成进度', '实际完成日期', '完成情况说明', '备注说明']

  const rows = tasks.map((task, index) => [
    index + 1,
    statusLabels[task.status],
    calculateOverdueDays(task),
    task.planDetail,
    quadrantLabels[task.quadrant],
    task.startDate || '',
    task.dueDate || '',
    task.progress < 0 ? '已取消' : `${task.progress}%`,
    task.actualCompleteDate || '',
    task.completionNote || '',
    task.remark || ''
  ])

  // 添加 BOM 以支持中文
  let csvContent = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(row => {
    csvContent += row.map(cell => {
      // 如果包含逗号或换行，需要用引号包裹
      const str = String(cell)
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `工作计划_${dayjs().format('YYYY-MM-DD')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
