<template>
  <div class="department-list">
    <div class="page-header">
      <h2>部门管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增部门
      </el-button>
    </div>

    <el-table :data="departments" v-loading="loading" border stripe>
      <el-table-column prop="name" label="部门名称" min-width="150" />
      <el-table-column prop="code" label="部门编码" width="120" />
      <el-table-column label="上级部门" width="150">
        <template #default="{ row }">
          {{ getDepartmentName(row.parentId) }}
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除该部门吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 部门表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select
            v-model="form.parentId"
            :data="departmentTree"
            :props="{ label: 'name', value: 'id' }"
            check-strictly
            clearable
            placeholder="请选择上级部门"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import type { Department, DepartmentFormData } from '@/types'
import { CommonStatus } from '@/types'

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const departments = computed(() => userStore.departments)

const form = reactive<DepartmentFormData>({
  name: '',
  code: '',
  parentId: null,
  sortOrder: 0,
  status: CommonStatus.ENABLED,
  managerId: null,
  description: null
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
}

// 部门树结构
const departmentTree = computed(() => {
  const buildTree = (parentId: number | null): any[] => {
    return departments.value
      .filter(d => d.parentId === parentId)
      .map(d => ({
        id: d.id,
        name: d.name,
        children: buildTree(d.id)
      }))
  }
  return buildTree(null)
})

function getDepartmentName(id: number | null): string {
  return userStore.getDepartmentName(id)
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    name: '',
    code: '',
    parentId: null,
    sortOrder: 0,
    status: CommonStatus.ENABLED,
    managerId: null,
    description: null
  })
  dialogVisible.value = true
}

function handleEdit(row: Department) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    code: row.code,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    status: row.status,
    managerId: row.managerId,
    description: row.description
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      await userStore.updateDepartment(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await userStore.createDepartment(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await userStore.deleteDepartment(id)
  ElMessage.success('删除成功')
}

onMounted(() => {
  userStore.loadDepartments()
})
</script>

<style scoped>
.department-list {
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
</style>
