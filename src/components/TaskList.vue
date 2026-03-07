<template>
  <div class="task-list">
    <el-table
      :data="tasks"
      style="width: 100%"
      :row-class-name="tableRowClassName"
      highlight-current-row
    >
      <el-table-column prop="id" label="序号" width="70" align="center" />

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <StatusBadge :status="row.status" />
        </template>
      </el-table-column>

      <el-table-column label="逾期" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="getOverdueDays(row) > 0" type="danger" size="small">
            {{ getOverdueDays(row) }}天
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column prop="planDetail" label="计划明细" min-width="200">
        <template #default="{ row }">
          <div class="text-wrap" :class="{ 'line-through text-gray-400': row.status === TaskStatus.CANCELLED }">
            {{ row.planDetail }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="四象限" width="120" align="center">
        <template #default="{ row }: { row: Task }">
          <el-tag :type="quadrantColorMap[row.quadrant]" size="small">
            {{ quadrantLabels[row.quadrant] }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="开始日期" width="110" align="center">
        <template #default="{ row }">
          {{ row.startDate || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="截至日期" width="110" align="center">
        <template #default="{ row }">
          <span :class="{ 'text-red-500': isOverdue(row) }">
            {{ row.dueDate || '-' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="进度" width="120" align="center">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress < 0 ? 0 : row.progress"
            :status="getProgressStatus(row)"
            :stroke-width="10"
          />
        </template>
      </el-table-column>

      <el-table-column label="实际完成" width="110" align="center">
        <template #default="{ row }">
          {{ row.actualCompleteDate || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click.stop="$emit('edit', row)">
            编辑
          </el-button>
          <el-popconfirm
            title="确定删除此任务吗？"
            @confirm="$emit('delete', row.id)"
          >
            <template #reference>
              <el-button type="danger" link size="small" @click.stop>
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { TaskStatus, QuadrantType, quadrantLabels } from '@/types'
import type { Task } from '@/types'
import StatusBadge from './StatusBadge.vue'
import dayjs from 'dayjs'

defineProps<{
  tasks: Task[]
}>()

defineEmits<{
  (e: 'edit', task: Task): void
  (e: 'delete', id: number): void
}>()

const quadrantColorMap: Record<QuadrantType, '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
  [QuadrantType.IMPORTANT_URGENT]: 'danger',
  [QuadrantType.IMPORTANT_NOT_URGENT]: 'warning',
  [QuadrantType.NOT_IMPORTANT_URGENT]: 'primary',
  [QuadrantType.NOT_IMPORTANT_NOT_URGENT]: 'success'
}

function tableRowClassName({ row }: { row: Task }): string {
  if (row.status === TaskStatus.CANCELLED) return 'cancelled-row'
  if (isOverdue(row)) return 'overdue-row'
  return ''
}

function isOverdue(task: Task): boolean {
  if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false
  if (!task.dueDate) return false
  return dayjs(task.dueDate).isBefore(dayjs(), 'day')
}

function getOverdueDays(task: Task): number {
  if (!task.dueDate) return 0
  if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return 0
  const today = dayjs()
  const dueDate = dayjs(task.dueDate)
  return dueDate.isBefore(today, 'day') ? today.diff(dueDate, 'day') : 0
}

function getProgressStatus(task: Task): '' | 'success' | 'warning' | 'exception' {
  if (task.status === TaskStatus.COMPLETED) return 'success'
  if (task.status === TaskStatus.CANCELLED) return 'exception'
  if (isOverdue(task)) return 'warning'
  return ''
}
</script>

<style scoped>
.task-list :deep(.cancelled-row) {
  background-color: #f5f5f5;
}

.task-list :deep(.overdue-row) {
  background-color: #fef0f0;
}

.text-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
