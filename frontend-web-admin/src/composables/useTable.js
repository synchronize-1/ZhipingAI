import { ref, reactive, onMounted } from 'vue'

export function useTable(fetchAPI, defaultParams = {}) {
  const loading = ref(false)
  const dataList = ref([])
  const total = ref(0)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const searchParams = reactive({ ...defaultParams })

  const fetchData = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...searchParams
      }
      const res = await fetchAPI(params)
      // 兼容两种响应格式
      if (res.data?.list !== undefined) {
        dataList.value = res.data.list
        total.value = res.data.total
        pagination.total = res.data.total
      } else if (res.data?.data) {
        dataList.value = res.data.data
        total.value = res.data.total || res.data.data.length
        pagination.total = res.data.total || res.data.data.length
      } else if (Array.isArray(res.data)) {
        dataList.value = res.data
        total.value = res.data.length
        pagination.total = res.data.length
      }
      return res
    } catch (error) {
      console.error('获取列表数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    pagination.page = 1
    fetchData()
  }

  const handleReset = () => {
    Object.keys(searchParams).forEach(key => {
      searchParams[key] = defaultParams[key] !== undefined ? defaultParams[key] : ''
    })
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

  const refresh = () => {
    fetchData()
  }

  onMounted(() => {
    fetchData()
  })

  return {
    loading,
    dataList,
    total,
    pagination,
    searchParams,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange,
    refresh
  }
}
