<template>
  <el-tag :type="tagType" :effect="effect" size="small">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TaskStatus, statusLabels, statusColors } from '@/types'

const props = defineProps<{
  status: TaskStatus
  effect?: 'light' | 'dark' | 'plain'
}>()

const label = computed(() => statusLabels[props.status] || '未知')

const tagType = computed(() => {
  const color = statusColors[props.status]
  return color as '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'
})
</script>
