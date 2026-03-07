<template>
  <div class="role-list">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <el-table :data="roles" v-loading="loading" border stripe>
      <el-table-column prop="name" label="角色名称" min-width="120" />
      <el-table-column prop="code" label="角色编码" width="150">
        <template #default="{ row }">
          <el-tag>{{ roleTypeLabels[row.code as RoleType] || row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="权限数量" width="100" align="center">
        <template #default="{ row }">
          {{ row.permissions.length }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除该角色吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-select v-model="form.code" placeholder="请选择角色编码" style="width: 100%">
            <el-option
              v-for="(label, code) in roleTypeLabels"
              :key="code"
              :label="label"
              :value="code"
            />
          </el-select>
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
        <el-form-item label="权限配置">
          <el-checkbox-group v-model="form.permissions">
            <div v-for="group in permissionGroups" :key="group.label" class="permission-group">
              <div class="group-label">{{ group.label }}</div>
              <el-checkbox
                v-for="perm in group.permissions"
                :key="perm.value"
                :value="perm.value"
              >
                {{ perm.label }}
              </el-checkbox>
            </div>
          </el-checkbox-group>
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
import type { Role, RoleFormData } from '@/types'
import { CommonStatus, RoleType, roleTypeLabels, Permissions } from '@/types'

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const roles = computed(() => userStore.roles)

const form = reactive<RoleFormData>({
  name: '',
  code: RoleType.VIEWER,
  description: null,
  status: CommonStatus.ENABLED,
  permissions: []
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请选择角色编码', trigger: 'change' }]
}

// 权限分组
const permissionGroups = [
  {
    label: '用户管理',
    permissions: [
      { value: Permissions.USER_VIEW, label: '查看用户' },
      { value: Permissions.USER_CREATE, label: '创建用户' },
      { value: Permissions.USER_UPDATE, label: '编辑用户' },
      { value: Permissions.USER_DELETE, label: '删除用户' }
    ]
  },
  {
    label: '部门管理',
    permissions: [
      { value: Permissions.DEPARTMENT_VIEW, label: '查看部门' },
      { value: Permissions.DEPARTMENT_CREATE, label: '创建部门' },
      { value: Permissions.DEPARTMENT_UPDATE, label: '编辑部门' },
      { value: Permissions.DEPARTMENT_DELETE, label: '删除部门' }
    ]
  },
  {
    label: '合同管理',
    permissions: [
      { value: Permissions.CONTRACT_VIEW, label: '查看合同' },
      { value: Permissions.CONTRACT_CREATE, label: '创建合同' },
      { value: Permissions.CONTRACT_UPDATE, label: '编辑合同' },
      { value: Permissions.CONTRACT_DELETE, label: '删除合同' },
      { value: Permissions.CONTRACT_REVIEW, label: '审核合同' }
    ]
  },
  {
    label: '案件管理',
    permissions: [
      { value: Permissions.CASE_VIEW, label: '查看案件' },
      { value: Permissions.CASE_CREATE, label: '创建案件' },
      { value: Permissions.CASE_UPDATE, label: '编辑案件' },
      { value: Permissions.CASE_DELETE, label: '删除案件' }
    ]
  },
  {
    label: '工作任务',
    permissions: [
      { value: Permissions.TASK_VIEW, label: '查看任务' },
      { value: Permissions.TASK_CREATE, label: '创建任务' },
      { value: Permissions.TASK_UPDATE, label: '编辑任务' },
      { value: Permissions.TASK_DELETE, label: '删除任务' }
    ]
  },
  {
    label: '数据看板',
    permissions: [
      { value: Permissions.DASHBOARD_VIEW, label: '查看看板' }
    ]
  }
]

function handleAdd() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    name: '',
    code: RoleType.VIEWER,
    description: null,
    status: CommonStatus.ENABLED,
    permissions: []
  })
  dialogVisible.value = true
}

function handleEdit(row: Role) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    code: row.code,
    description: row.description,
    status: row.status,
    permissions: [...row.permissions]
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      await userStore.updateRole(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await userStore.createRole(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await userStore.deleteRole(id)
  ElMessage.success('删除成功')
}

onMounted(() => {
  userStore.loadRoles()
})
</script>

<style scoped>
.role-list {
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

.permission-group {
  margin-bottom: 15px;
}

.group-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #409eff;
}
</style>
