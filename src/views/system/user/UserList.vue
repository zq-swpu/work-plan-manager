<template>
  <div class="user-list">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
    </div>

    <el-table :data="users" v-loading="loading" border stripe>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="姓名" width="120" />
      <el-table-column label="部门" width="120">
        <template #default="{ row }">
          {{ getDepartmentName(row.departmentId) }}
        </template>
      </el-table-column>
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          {{ getRoleName(row.roleId) }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginAt" label="最后登录" width="160" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link @click="handleResetPassword(row)">重置密码</el-button>
          <el-popconfirm title="确定删除该用户吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码 (默认123456)" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="form.departmentId" placeholder="请选择部门" clearable style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleId" placeholder="请选择角色" clearable style="width: 100%">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import type { User, UserFormData } from '@/types'
import { CommonStatus } from '@/types'

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const users = computed(() => userStore.users)
const departments = computed(() => userStore.departments)
const roles = computed(() => userStore.roles)

const form = reactive<UserFormData>({
  username: '',
  password: '',
  realName: '',
  email: null,
  phone: null,
  departmentId: null,
  roleId: null,
  status: CommonStatus.ENABLED,
  avatar: null
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

function getDepartmentName(id: number | null): string {
  return userStore.getDepartmentName(id)
}

function getRoleName(id: number | null): string {
  return userStore.getRoleName(id)
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    username: '',
    password: '',
    realName: '',
    email: null,
    phone: null,
    departmentId: null,
    roleId: null,
    status: CommonStatus.ENABLED,
    avatar: null
  })
  dialogVisible.value = true
}

function handleEdit(row: User) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    username: row.username,
    password: '',
    realName: row.realName,
    email: row.email,
    phone: row.phone,
    departmentId: row.departmentId,
    roleId: row.roleId,
    status: row.status,
    avatar: row.avatar
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      await userStore.updateUser(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await userStore.createUser(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
  } finally {
    submitting.value = false
  }
}

async function handleResetPassword(row: User) {
  try {
    await ElMessageBox.confirm('确定将该用户的密码重置为 123456 吗？', '提示', {
      type: 'warning'
    })
    await userStore.updateUser(row.id, { password: '123456' })
    ElMessage.success('密码已重置为 123456')
  } catch {
    // 取消操作
  }
}

async function handleDelete(id: number) {
  await userStore.deleteUser(id)
  ElMessage.success('删除成功')
}

onMounted(() => {
  userStore.loadUsers()
})
</script>

<style scoped>
.user-list {
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
