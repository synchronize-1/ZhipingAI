<template>
  <div class="page-header">
    <!-- 面包屑 -->
    <el-breadcrumb
      v-if="breadcrumbs && breadcrumbs.length"
      :separator="separator"
      :separator-icon="separatorIcon"
      class="page-header__breadcrumb"
    >
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbs"
        :key="index"
        :to="item.to"
      >
        <component v-if="item.icon" :is="item.icon" class="page-header__breadcrumb-icon" />
        <span>{{ item.label }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 主体区域 -->
    <div class="page-header__main">
      <div class="page-header__left">
        <!-- 返回按钮 -->
        <el-button
          v-if="showBack"
          :icon="ArrowLeft"
          text
          class="page-header__back-btn"
          @click="handleBack"
        />

        <!-- 标题 -->
        <h2 v-if="title" class="page-header__title">
          {{ title }}
          <slot name="title-extra" />
        </h2>

        <!-- 默认插槽（标题右侧内容） -->
        <div v-if="$slots.default" class="page-header__content">
          <slot />
        </div>
      </div>

      <!-- 右侧操作按钮区 -->
      <div v-if="$slots.extra" class="page-header__extra">
        <slot name="extra" />
      </div>
    </div>

    <!-- 描述 -->
    <p v-if="description" class="page-header__description">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 描述
  description: {
    type: String,
    default: ''
  },
  // 面包屑 [{ label, to, icon }]
  breadcrumbs: {
    type: Array,
    default: () => []
  },
  // 面包屑分隔符
  separator: {
    type: String,
    default: '/'
  },
  // 面包屑分隔符图标
  separatorIcon: {
    type: [String, Object],
    default: null
  },
  // 是否显示返回按钮
  showBack: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back'])

const router = useRouter()

// 返回
const handleBack = () => {
  emit('back')
  router.back()
}
</script>

<style scoped lang="scss">
.page-header {
  margin-bottom: 20px;

  &__breadcrumb {
    margin-bottom: 12px;

    &-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }

  &__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__back-btn {
    padding: 4px;
    font-size: 20px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__extra {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__description {
    margin: 8px 0 0 0;
    font-size: 14px;
    color: #909399;
    line-height: 1.6;
  }
}
</style>
