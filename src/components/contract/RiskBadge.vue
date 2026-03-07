<template>
  <el-tag :type="tagType" :effect="effect" :size="size">
    <el-icon v-if="showIcon" class="mr-1">
      <component :is="iconComponent" />
    </el-icon>
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Warning, WarningFilled, CircleCheck, InfoFilled } from '@element-plus/icons-vue'
import { RiskLevel, riskLevelLabels } from '@/types'

const props = withDefaults(defineProps<{
  level: RiskLevel
  effect?: 'light' | 'dark' | 'plain'
  size?: 'large' | 'default' | 'small'
  showIcon?: boolean
}>(), {
  effect: 'light',
  size: 'default',
  showIcon: false
})

const label = computed(() => riskLevelLabels[props.level])

const tagType = computed(() => {
  const colors: Record<RiskLevel, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    [RiskLevel.LOW]: 'success',
    [RiskLevel.MEDIUM]: 'warning',
    [RiskLevel.HIGH]: 'danger',
    [RiskLevel.CRITICAL]: 'danger'
  }
  return colors[props.level]
})

const iconComponent = computed(() => {
  const icons = {
    [RiskLevel.LOW]: CircleCheck,
    [RiskLevel.MEDIUM]: InfoFilled,
    [RiskLevel.HIGH]: Warning,
    [RiskLevel.CRITICAL]: WarningFilled
  }
  return icons[props.level]
})
</script>

<style scoped>
.mr-1 {
  margin-right: 4px;
}
</style>
