<template>
  <div class="data-table">
    <!-- 工具栏插槽 -->
    <div v-if="$slots.toolbar" class="data-table__toolbar">
      <slot name="toolbar" />
    </div>

    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      :data="data"
      v-loading="loading"
      :border="border"
      :stripe="stripe"
      :height="height"
      :size="size"
      :row-key="rowKey"
      :tree-props="treeProps"
      :default-sort="defaultSort"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :empty-text="emptyText"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
    >
      <!-- 多选列 -->
      <el-table-column
        v-if="selection"
        type="selection"
        :width="selectionWidth"
        :selectable="selectable"
        reserve-selection
        fixed="left"
      />

      <!-- 序号列 -->
      <el-table-column
        v-if="index"
        type="index"
        :label="indexLabel"
        :width="indexWidth"
        fixed="left"
        align="center"
      >
        <template #default="{ $index }">
          {{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}
        </template>
      </el-table-column>

      <!-- 动态列 -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.slot"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        :fixed="col.fixed"
        :sortable="col.sortable"
        :show-overflow-tooltip="col.showOverflowTooltip !== false"
        :formatter="col.formatter"
      >
        <!-- 自定义插槽列 -->
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="scope.row" :index="scope.$index" :column="col" />
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column
        v-if="$slots.action"
        label="操作"
        :width="actionWidth"
        :fixed="actionFixed || 'right'"
        align="center"
      >
        <template #default="scope">
          <slot name="action" :row="scope.row" :index="scope.$index" />
        </template>
      </el-table-column>

      <!-- 底部追加 -->
      <template #append>
        <slot name="append" />
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="data-table__pagination">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="pageSizes"
        :total="pagination.total"
        :layout="layout"
        :background="paginationBackground"
        :disabled="loading"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 表格 ref
const tableRef = ref(null)

const props = defineProps({
  // 列配置 [{ prop, label, width, minWidth, align, slot, fixed, sortable, formatter, showOverflowTooltip }]
  columns: {
    type: Array,
    default: () => []
  },
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 分页信息 { page, pageSize, total }
  pagination: {
    type: Object,
    default: () => ({ page: 1, pageSize: 10, total: 0 })
  },
  // 是否显示多选列
  selection: {
    type: Boolean,
    default: false
  },
  // 多选列宽度
  selectionWidth: {
    type: [Number, String],
    default: 50
  },
  // 多选过滤函数
  selectable: {
    type: Function,
    default: null
  },
  // 是否显示序号列
  index: {
    type: Boolean,
    default: false
  },
  // 序号列标题
  indexLabel: {
    type: String,
    default: '序号'
  },
  // 序号列宽度
  indexWidth: {
    type: [Number, String],
    default: 60
  },
  // 是否显示边框
  border: {
    type: Boolean,
    default: true
  },
  // 是否斑马纹
  stripe: {
    type: Boolean,
    default: true
  },
  // 表格高度
  height: {
    type: [Number, String],
    default: null
  },
  // 表格尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 行数据的 Key
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  // 树形数据配置
  treeProps: {
    type: Object,
    default: () => ({ children: 'children', hasChildren: 'hasChildren' })
  },
  // 默认排序
  defaultSort: {
    type: Object,
    default: null
  },
  // 是否显示表头
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否高亮当前行
  highlightCurrentRow: {
    type: Boolean,
    default: false
  },
  // 空数据文案
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true
  },
  // 每页条数选项
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  // 分页布局
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  // 分页是否有背景色
  paginationBackground: {
    type: Boolean,
    default: true
  },
  // 操作列宽度
  actionWidth: {
    type: [Number, String],
    default: 180
  },
  // 操作列固定方向
  actionFixed: {
    type: [String, Boolean],
    default: 'right'
  }
})

const emit = defineEmits([
  'update:page',
  'update:pageSize',
  'selection-change',
  'sort-change',
  'row-click'
])

// 页码变化
const handlePageChange = (page) => {
  emit('update:page', page)
}

// 每页条数变化
const handleSizeChange = (size) => {
  emit('update:pageSize', size)
}

// 选中项变化
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 排序变化
const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

// 行点击
const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

// 暴露方法
defineExpose({
  tableRef,
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row, selected) => tableRef.value?.toggleRowSelection(row, selected),
  toggleAllSelection: () => tableRef.value?.toggleAllSelection(),
  setCurrentRow: (row) => tableRef.value?.setCurrentRow(row),
  clearSort: () => tableRef.value?.clearSort(),
  clearFilter: () => tableRef.value?.clearFilter(),
  doLayout: () => tableRef.value?.doLayout()
})
</script>

<style scoped lang="scss">
.data-table {
  width: 100%;

  &__toolbar {
    margin-bottom: 16px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
