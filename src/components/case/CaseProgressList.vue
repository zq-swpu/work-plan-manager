<template>
  <div class="progress-list">
    <el-timeline v-if="progress.length > 0">
      <el-timeline-item
        v-for="item in progress"
        :key="item.id"
        :timestamp="item.progressDate"
        placement="top"
        :type="getStageColor(item.stage)"
      >
        <el-card>
          <div class="progress-header">
            <el-tag :type="getStageColor(item.stage)" size="small">
              {{ caseStageLabels[item.stage] }}
            </el-tag>
            <span class="handler" v-if="item.handlerName">
              处理人: {{ item.handlerName }}
            </span>
          </div>
          <h4 class="progress-title">{{ item.title }}</h4>
          <p class="progress-content">{{ item.content }}</p>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty v-else description="暂无进展记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCaseStore } from '@/stores'
import { CaseStage, caseStageLabels } from '@/types'
import type { CaseProgress } from '@/types'

const props = defineProps<{
  caseId: number
}>()

const caseStore = useCaseStore()
const progress = ref<CaseProgress[]>([])

const stageColors: Record<CaseStage, '' | 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  [CaseStage.PREPARATION]: 'info',
  [CaseStage.FILED]: 'primary',
  [CaseStage.FIRST_INSTANCE]: 'warning',
  [CaseStage.SECOND_INSTANCE]: 'warning',
  [CaseStage.RETRIAL]: 'danger',
  [CaseStage.EXECUTION]: 'primary',
  [CaseStage.CLOSED]: 'success'
}

function getStageColor(stage: CaseStage) {
  return stageColors[stage] || 'info'
}

onMounted(async () => {
  progress.value = await caseStore.getProgress(props.caseId)
})
</script>

<style scoped>
.progress-list {
  padding: 10px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.handler {
  color: #909399;
  font-size: 13px;
}

.progress-title {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.progress-content {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}
</style>
