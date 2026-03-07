<template>
  <div class="review-list">
    <el-timeline v-if="reviews.length > 0">
      <el-timeline-item
        v-for="review in reviews"
        :key="review.id"
        :timestamp="review.reviewDate"
        placement="top"
      >
        <el-card>
          <div class="review-header">
            <span class="reviewer">{{ review.reviewerName }}</span>
            <el-tag :type="resultTagType(review.reviewResult)" size="small">
              {{ resultLabels[review.reviewResult] }}
            </el-tag>
          </div>
          <div class="review-content">
            <p><strong>审核意见:</strong> {{ review.reviewOpinion }}</p>
            <p v-if="review.riskAssessment">
              <strong>风险评估:</strong>
              <RiskBadge :level="review.riskAssessment" class="ml-2" />
            </p>
            <p v-if="review.riskNotes">
              <strong>风险说明:</strong> {{ review.riskNotes }}
            </p>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty v-else description="暂无审核记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useContractStore } from '@/stores'
import type { ContractReview } from '@/types'
import RiskBadge from './RiskBadge.vue'

const props = defineProps<{
  contractId: number
}>()

const contractStore = useContractStore()
const reviews = ref<ContractReview[]>([])

const resultLabels: Record<string, string> = {
  approved: '通过',
  rejected: '驳回',
  revision_required: '需修改'
}

const resultTagType = (result: string): '' | 'success' | 'warning' | 'danger' | 'info' => {
  const types: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    approved: 'success',
    rejected: 'danger',
    revision_required: 'warning'
  }
  return types[result] || 'info'
}

onMounted(async () => {
  reviews.value = await contractStore.getReviews(props.contractId)
})
</script>

<style scoped>
.review-list {
  padding: 10px 0;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reviewer {
  font-weight: bold;
  color: #409eff;
}

.review-content p {
  margin: 8px 0;
  line-height: 1.6;
}

.ml-2 {
  margin-left: 8px;
}
</style>
