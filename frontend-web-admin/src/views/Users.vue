<template>
  <div class="user-manage">
    <PageHeader title="用户管理" description="管理系统用户、角色分配与权限控制" :breadcrumbs="breadcrumbs">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
      </template>
    </PageHeader>

    <!-- 筛选区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchParams" inline>
        <el-form-item label="角色">
          <el-select v-model="searchParams.role" placeholder="全部角色" clearable style="width: 140px">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="searchParams.classId" placeholder="全部班级" clearable filterable style="width: 180px">
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="searchParams.keyword"
            placeholder="姓名/学号/用户名"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 + 表格 -->
    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button :icon="Upload" type="success" plain @click="importDialogVisible = true">批量导入</el-button>
          <el-button
            :icon="School"
            type="warning"
            plain
            :disabled="selectedUsers.length === 0"
            @click="batchClassDialogVisible = true"
          >
            批量分配班级
          </el-button>
          <el-button
            :icon="Key"
            type="info"
            plain
            :disabled="selectedUsers.length === 0"
            @click="handleBatchResetPassword"
          >
            批量重置密码
          </el-button>
        </div>
        <div class="toolbar-right" v-if="selectedUsers.length > 0">
          <span class="selected-count">已选 <b>{{ selectedUsers.length }}</b> 项</span>
          <el-button link type="primary" @click="clearSelection">取消选择</el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        :data="dataList"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" fixed="left" />
        <el-table-column type="index" label="序号" width="60" align="center" fixed="left">
          <template #default="{ $index }">
            {{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名/学号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-username">
              <span class="username">{{ row.username }}</span>
              <span class="sid" v-if="row.studentId || row.employeeId">
                {{ row.studentId || row.employeeId }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="role" label="角色" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="className" label="班级" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.className || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'disabled'"
              :loading="row._statusLoading"
              @change="(val) => handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="handleResetPassword(row)">重置密码</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无用户数据" :image-size="80" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          :disabled="loading"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialogVisible"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="dialog.formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="dialog.formData.username" placeholder="请输入用户名" :disabled="dialog.mode.value === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="dialog.formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="dialog.formData.role" placeholder="请选择角色" style="width: 100%" @change="handleRoleChange">
                <el-option label="管理员" value="admin" />
                <el-option label="教师" value="teacher" />
                <el-option label="学生" value="student" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialog.mode.value === 'add'">
            <el-form-item label="密码" prop="password">
              <el-input v-model="dialog.formData.password" type="password" placeholder="请输入初始密码" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12" v-if="dialog.formData.role === 'student'">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="dialog.formData.studentId" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialog.formData.role === 'teacher'">
            <el-form-item label="工号" prop="employeeId">
              <el-input v-model="dialog.formData.employeeId" placeholder="请输入工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialog.formData.role === 'student'">
            <el-form-item label="班级" prop="classId">
              <el-select v-model="dialog.formData.classId" placeholder="请选择班级" filterable style="width: 100%">
                <el-option
                  v-for="cls in classList"
                  :key="cls.id"
                  :label="cls.name"
                  :value="cls.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialog.formData.role === 'teacher'">
            <el-form-item label="部门" prop="department">
              <el-input v-model="dialog.formData.department" placeholder="请输入部门" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="dialog.formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="dialog.formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.close()">取消</el-button>
          <el-button type="primary" :loading="dialog.loading.value" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码结果弹窗 -->
    <el-dialog title="密码重置成功" v-model="resetPwdDialogVisible" width="420px">
      <div class="reset-pwd-result">
        <el-result icon="success" title="密码已重置" sub-title="请将新密码告知用户">
          <template #extra>
            <div class="new-password-box">
              <span class="label">新密码：</span>
              <span class="pwd">{{ resetPwdResult.newPassword }}</span>
              <el-button
                size="small"
                type="primary"
                :icon="CopyDocument"
                @click="copyPassword"
              >
                复制
              </el-button>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button type="primary" @click="resetPwdDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>

    <!-- 批量分配班级弹窗 -->
    <el-dialog title="批量分配班级" v-model="batchClassDialogVisible" width="480px">
      <el-form label-width="100px">
        <el-form-item label="已选用户">
          <el-tag type="info">{{ selectedUsers.length }} 位用户</el-tag>
        </el-form-item>
        <el-form-item label="目标班级" required>
          <el-select
            v-model="batchClassId"
            placeholder="请选择目标班级"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="">
          <el-alert
            title="此操作将把所选用户全部调整到目标班级，确定要继续吗？"
            type="warning"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchClassDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchClassLoading" @click="handleBatchUpdateClass">确定分配</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog title="批量导入用户" v-model="importDialogVisible" width="560px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="用户角色" required>
          <el-radio-group v-model="importRole">
            <el-radio value="student">学生</el-radio>
            <el-radio value="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Excel 文件" required>
          <el-upload
            class="import-uploader"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleImportFileChange"
            :on-exceed="handleImportExceed"
            :file-list="importFileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将 Excel 文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xlsx / .xls 格式，单次最多导入 500 条
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="导入模板">
          <el-button type="primary" link :icon="Download" @click="handleDownloadTemplate">
            下载{{ importRole === 'student' ? '学生' : '教师' }}导入模板
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 导入结果 -->
      <div v-if="importResult" class="import-result">
        <el-divider content-position="left">导入结果</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="成功数量">
            <el-tag type="success" size="large">{{ importResult.successCount || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败数量">
            <el-tag type="danger" size="large">{{ importResult.failCount || 0 }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="importResult.failList && importResult.failList.length" class="fail-list">
          <div class="fail-title">失败明细：</div>
          <el-table :data="importResult.failList" size="small" border max-height="200">
            <el-table-column prop="row" label="行号" width="60" align="center" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="reason" label="失败原因" show-overflow-tooltip />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeImportDialog">关闭</el-button>
        <el-button type="primary" :loading="importLoading" :disabled="!importFile" @click="handleImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Plus, Search, RefreshLeft, Upload, School, Key, CopyDocument, Download, UploadFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminUserAPI } from '@/api/adminUsers'
import { classAPI } from '@/api/teaching'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'

const breadcrumbs = [
  { label: '系统管理' },
  { label: '用户管理' }
]

// ========== 搜索与表格 ==========
const loading = ref(false)
const dataList = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const searchParams = reactive({
  role: '',
  classId: '',
  status: '',
  keyword: ''
})

const tableRef = ref(null)
const selectedUsers = ref([])

// 班级列表
const classList = ref([])

const fetchClassList = async () => {
  try {
    const res = await classAPI.list({ pageSize: 999 })
    if (res.data?.list) {
      classList.value = res.data.list
    } else if (Array.isArray(res.data)) {
      classList.value = res.data
    }
  } catch (e) {
    console.error('获取班级列表失败:', e)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    // 清除空字符串参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    const res = await adminUserAPI.list(params)
    if (res.data?.list !== undefined) {
      dataList.value = res.data.list
      pagination.total = res.data.total || 0
    }
  } catch (e) {
    console.error('获取用户列表失败:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchParams.role = ''
  searchParams.classId = ''
  searchParams.status = ''
  searchParams.keyword = ''
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

// ========== 角色映射 ==========
const getRoleLabel = (role) => {
  const map = { admin: '管理员', teacher: '教师', student: '学生' }
  return map[role] || role
}

const getRoleTagType = (role) => {
  const map = { admin: 'danger', teacher: 'primary', student: 'success' }
  return map[role] || 'info'
}

// ========== 新增/编辑弹窗 ==========
const dialog = useDialog({
  id: null,
  username: '',
  password: '',
  name: '',
  role: 'student',
  email: '',
  phone: '',
  classId: null,
  department: '',
  studentId: '',
  employeeId: '',
  status: 'active'
})

const dialogVisible = computed({
  get: () => dialog.visible.value,
  set: (val) => { if (!val) dialog.close() }
})

const formRef = ref(null)

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const handleRoleChange = () => {
  // 切换角色时清空相关字段
  if (dialog.formData.role !== 'student') {
    dialog.formData.classId = null
    dialog.formData.studentId = ''
  }
  if (dialog.formData.role !== 'teacher') {
    dialog.formData.department = ''
    dialog.formData.employeeId = ''
  }
}

const handleAdd = () => {
  dialog.openAdd()
}

const handleEdit = (row) => {
  dialog.openEdit(row)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善表单信息')
    return
  }

  dialog.setLoading(true)
  try {
    // 构建提交数据
    const submitData = { ...dialog.formData }
    // 编辑时移除密码字段
    if (dialog.mode.value === 'edit') {
      delete submitData.password
    }
    // 根据角色移除不相关字段
    if (submitData.role !== 'student') {
      delete submitData.classId
      delete submitData.studentId
    }
    if (submitData.role !== 'teacher') {
      delete submitData.department
      delete submitData.employeeId
    }
    delete submitData.id

    if (dialog.mode.value === 'add') {
      await adminUserAPI.create(submitData)
      ElMessage.success('创建成功')
    } else {
      await adminUserAPI.update(dialog.formData.id, submitData)
      ElMessage.success('更新成功')
    }
    dialog.close()
    fetchData()
  } catch (error) {
    ElMessage.error(dialog.mode.value === 'add' ? '创建失败' : '更新失败')
  } finally {
    dialog.setLoading(false)
  }
}

// ========== 删除 ==========
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户「${row.name}」吗？删除后数据无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await adminUserAPI.delete(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// ========== 状态切换 ==========
const handleToggleStatus = async (row) => {
  row._statusLoading = true
  try {
    await adminUserAPI.toggleStatus(row.id)
    ElMessage.success(row.status === 'active' ? '已启用' : '已禁用')
  } catch (error) {
    // 回滚状态
    row.status = row.status === 'active' ? 'disabled' : 'active'
    ElMessage.error('操作失败')
  } finally {
    row._statusLoading = false
  }
}

// ========== 重置密码 ==========
const resetPwdDialogVisible = ref(false)
const resetPwdResult = reactive({ newPassword: '' })

const handleResetPassword = (row) => {
  ElMessageBox.confirm(`确定要重置用户「${row.name}」的密码吗？`, '重置密码确认', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await adminUserAPI.resetPassword(row.id)
      if (res.data?.newPassword) {
        resetPwdResult.newPassword = res.data.newPassword
        resetPwdDialogVisible.value = true
      } else {
        ElMessage.success('密码重置成功')
      }
    } catch (error) {
      ElMessage.error('重置失败')
    }
  }).catch(() => {})
}

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(resetPwdResult.newPassword)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// ========== 批量重置密码 ==========
const handleBatchResetPassword = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  ElMessageBox.confirm(
    `确定要重置选中的 ${selectedUsers.value.length} 位用户的密码吗？重置后密码将变为默认密码。`,
    '批量重置密码确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const ids = selectedUsers.value.map(u => u.id)
      await adminUserAPI.batchResetPassword(ids)
      ElMessage.success(`已批量重置 ${ids.length} 位用户的密码`)
      clearSelection()
    } catch (error) {
      ElMessage.error('批量重置失败')
    }
  }).catch(() => {})
}

// ========== 批量分配班级 ==========
const batchClassDialogVisible = ref(false)
const batchClassId = ref(null)
const batchClassLoading = ref(false)

const handleBatchUpdateClass = async () => {
  if (!batchClassId.value) {
    ElMessage.warning('请选择目标班级')
    return
  }
  batchClassLoading.value = true
  try {
    const ids = selectedUsers.value.map(u => u.id)
    await adminUserAPI.batchUpdateClass(ids, batchClassId.value)
    ElMessage.success(`已成功分配 ${ids.length} 位用户到目标班级`)
    batchClassDialogVisible.value = false
    batchClassId.value = null
    clearSelection()
    fetchData()
  } catch (error) {
    ElMessage.error('批量分配失败')
  } finally {
    batchClassLoading.value = false
  }
}

// ========== 批量导入 ==========
const importDialogVisible = ref(false)
const importRole = ref('student')
const importFile = ref(null)
const importFileList = ref([])
const importLoading = ref(false)
const importResult = ref(null)

const handleImportFileChange = (file) => {
  importFile.value = file.raw
  importResult.value = null
}

const handleImportExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

const handleDownloadTemplate = async () => {
  try {
    const res = await adminUserAPI.downloadTemplate(importRole.value)
    // 处理 blob 下载
    const blob = res.data
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    // 从 headers 中获取文件名或使用默认名
    const disposition = res.headers['content-disposition']
    let fileName = `${importRole.value === 'student' ? '学生' : '教师'}导入模板.xlsx`
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].replace(/['"]/g, ''))
      }
    }
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('下载模板失败')
  }
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  importLoading.value = true
  try {
    const res = await adminUserAPI.importUsers(importFile.value, importRole.value)
    importResult.value = res.data || { successCount: 0, failCount: 0, failList: [] }
    ElMessage.success('导入完成')
    fetchData()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importLoading.value = false
  }
}

const closeImportDialog = () => {
  importDialogVisible.value = false
  importFile.value = null
  importFileList.value = []
  importResult.value = null
}

// ========== 初始化 ==========
onMounted(() => {
  fetchClassList()
  fetchData()
})
</script>

<style scoped lang="scss">
.user-manage {
  padding: 20px;

  .search-card {
    margin-bottom: 16px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }

  .table-card {
    margin-bottom: 16px;
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .selected-count {
        font-size: 13px;
        color: #606266;

        b {
          color: #409eff;
          font-size: 14px;
        }
      }
    }
  }

  .cell-username {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .username {
      font-weight: 500;
      color: #303133;
    }

    .sid {
      font-size: 12px;
      color: #909399;
      font-family: monospace;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .reset-pwd-result {
    .new-password-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;

      .label {
        font-size: 14px;
        color: #606266;
      }

      .pwd {
        font-size: 18px;
        font-weight: 600;
        color: #409eff;
        font-family: monospace;
        letter-spacing: 1px;
      }
    }
  }

  .import-uploader {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }

  .import-result {
    .fail-list {
      margin-top: 12px;

      .fail-title {
        font-size: 13px;
        color: #f56c6c;
        margin-bottom: 8px;
        font-weight: 500;
      }
    }
  }
}
</style>
