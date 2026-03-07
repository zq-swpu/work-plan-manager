<template>
  <el-select v-model="selectedValue" :placeholder="placeholder" :disabled="disabled" style="width: 100%">
    <el-option
      v-for="(label, key) in quadrantLabels"
      :key="key"
      :label="label"
      :value="Number(key)"
    >
      <div class="flex items-center">
        <el-tag :type="quadrantColorMap[Number(key)]" size="small" class="mr-2">
          {{ label }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuadrantType, quadrantLabels } from '@/types'

const props = defineProps<{
  modelValue: QuadrantType
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: QuadrantType): void
}>()

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value as QuadrantType)
})

const quadrantColorMap: Record<number, '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
  [QuadrantType.IMPORTANT_URGENT]: 'danger',
  [QuadrantType.IMPORTANT_NOT_URGENT]: 'warning',
  [QuadrantType.NOT_IMPORTANT_URGENT]: 'primary',
  [QuadrantType.NOT_IMPORTANT_NOT_URGENT]: 'success'
}
</script>
