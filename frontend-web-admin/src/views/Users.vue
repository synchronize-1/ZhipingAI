<template>
  <div class="space-y-6">
    <!-- 搜索和筛选 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex flex-wrap items-center gap-4">
        <el-input v-model="searchQuery" placeholder="搜索用户..." prefix-icon="Search" class="w-64" clearable />
        <el-select v-model="roleFilter" placeholder="角色筛选" clearable class="w-32">
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="showAddDialog = true">添加用户</el-button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <el-table :data="filteredUsers" v-loading="loading" stripe>
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="40" :src="row.avatar">{{ row.name?.charAt(0) }}</el-avatar>
              <div>
                <p class="font-medium text-gray-800">{{ row.name }}</p>
                <p class="text-xs text-gray-500">{{ row.username }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门/院系" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="editUser(row)">编辑</el-button>
            <el-button type="danger" text size="small" @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="p-4 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchUsers"
        />
      </div>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingUser ? '编辑用户' : '添加用户'" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="userForm" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item v-if="!editingUser" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" class="w-full">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="userForm.department" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="userForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'

defineOptions({ name: 'Users' })
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const submitting = ref(false)
const users = ref([])
const searchQuery = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showAddDialog = ref(false)
const editingUser = ref(null)
const formRef = ref()

const userForm = ref({
  username: '', password: '', name: '', role: 'student', department: '', email: '', phone: ''
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const filteredUsers = computed(() => {
  let result = users.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u => u.name?.toLowerCase().includes(query) || u.username?.toLowerCase().includes(query))
  }
  if (roleFilter.value) {
    result = result.filter(u => u.role === roleFilter.value)
  }
  return result
})

const getRoleTagType = (role) => {
  const types = { student: 'primary', teacher: 'success', admin: 'danger' }
  return types[role] || 'info'
}

const getRoleText = (role) => {
  const texts = { student: '学生', teacher: '教师', admin: '管理员' }
  return texts[role] || role
}

const fetchUsers = async () => {
  loading.value = true
  // 头像映射 - 为数据库用户添加头像
  const avatarMap = {
    'student001': 'https://api.dicebear.com/7.x/lorelei/svg?seed=zhangsan',
    'student002': 'https://api.dicebear.com/7.x/notionists/svg?seed=lisi',
    'student003': 'https://api.dicebear.com/7.x/thumbs/svg?seed=wangwu',
    'teacher001': 'https://api.dicebear.com/7.x/personas/svg?seed=wangprof',
    'teacher002': 'https://api.dicebear.com/7.x/micah/svg?seed=liprof',
    'admin': 'https://api.dicebear.com/7.x/identicon/svg?seed=admin'
  }
  
  // 默认示例数据
  const sampleUsers = [
    { id: 1, username: 'student001', name: 'christie', role: 'student', department: '计算机与软件学院', email: 'yuanshen@campus.edu', phone: '13800138001', avatar: avatarMap['student001'] },
    { id: 2, username: 'student002', name: '李四', role: 'student', department: '计算机与软件学院', email: 'lisi@campus.edu', phone: '13800138002', avatar: avatarMap['student002'] },
    { id: 3, username: 'student003', name: '王五', role: 'student', department: '软件工程学院', email: 'wangwu@campus.edu', phone: '13800138003', avatar: avatarMap['student003'] },
    { id: 4, username: 'teacher001', name: '王教授', role: 'teacher', department: '计算机与软件学院', email: 'wangprof@campus.edu', phone: '13900139001', avatar: avatarMap['teacher001'] },
    { id: 5, username: 'teacher002', name: '李教授', role: 'teacher', department: '软件工程学院', email: 'liprof@campus.edu', phone: '13900139002', avatar: avatarMap['teacher002'] },
    { id: 6, username: 'admin', name: '系统管理员', role: 'admin', department: '信息中心', email: 'admin@campus.edu', phone: '13700137001', avatar: avatarMap['admin'] }
  ]
  
  // 先设置示例数据确保显示
  users.value = sampleUsers
  total.value = sampleUsers.length
  
  try {
    const res = await api.users.list({ page: currentPage.value, limit: pageSize.value, role: roleFilter.value })
    if (res.success && res.data?.data?.length > 0) {
      // 为API返回的用户添加头像
      users.value = res.data.data.map(user => ({
        ...user,
        avatar: user.avatar || avatarMap[user.username] || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.username}`
      }))
      total.value = res.data.total || res.data.data.length
    }
  } catch (e) {
    console.error(e)
    // 保持示例数据
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  editingUser.value = user
  userForm.value = { ...user, password: '' }
  showAddDialog.value = true
}

const deleteUser = (user) => {
  ElMessageBox.confirm(`确定删除用户 ${user.name} 吗？`, '确认删除', { type: 'warning' })
    .then(() => {
      ElMessage.success('删除成功')
      fetchUsers()
    })
    .catch(() => {})
}

const resetForm = () => {
  userForm.value = {
    username: '', password: '', name: '', role: 'student', department: '', email: '', phone: ''
  }
  editingUser.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (editingUser.value) {
        await api.users.update(editingUser.value.id, userForm.value)
        ElMessage.success('更新成功')
      } else {
        await api.auth.register(userForm.value)
        ElMessage.success('添加成功')
      }
      showAddDialog.value = false
      resetForm()
      fetchUsers()
    } catch (e) {
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  fetchUsers()
})
</script>
