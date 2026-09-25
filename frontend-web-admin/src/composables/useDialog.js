import { ref, reactive, nextTick } from 'vue'

export function useDialog(initialForm = {}) {
  const visible = ref(false)
  const title = ref('')
  const mode = ref('add') // add / edit / view
  const formData = reactive({ ...initialForm })
  const formRef = ref(null)
  const loading = ref(false)

  const openAdd = (defaultData = {}) => {
    mode.value = 'add'
    title.value = '新增'
    Object.assign(formData, { ...initialForm, ...defaultData })
    visible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const openEdit = (rowData) => {
    mode.value = 'edit'
    title.value = '编辑'
    Object.assign(formData, { ...initialForm, ...rowData })
    visible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const openView = (rowData) => {
    mode.value = 'view'
    title.value = '查看详情'
    Object.assign(formData, { ...initialForm, ...rowData })
    visible.value = true
  }

  const close = () => {
    visible.value = false
    formData && Object.assign(formData, { ...initialForm })
    formRef.value?.clearValidate()
  }

  const setLoading = (val) => {
    loading.value = val
  }

  return {
    visible,
    title,
    mode,
    formData,
    formRef,
    loading,
    openAdd,
    openEdit,
    openView,
    close,
    setLoading
  }
}
