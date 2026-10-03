<template>
  <div class="home-container">
    <!-- 根据用户角色动态加载对应首页 -->
    <component :is="roleHomeComponent" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useUserStore } from '@/stores/user'

defineOptions({ name: 'Home' })

const userStore = useUserStore()

// 根据角色动态加载对应的首页组件
const roleHomeComponent = computed(() => {
  const role = userStore.user?.role
  
  switch (role) {
    case 'student':
      return defineAsyncComponent(() => import('@/views/home/StudentHome.vue'))
    case 'teacher':
      return defineAsyncComponent(() => import('@/views/home/TeacherHome.vue'))
    case 'admin':
      return defineAsyncComponent(() => import('@/views/home/AdminHome.vue'))
    default:
      return defineAsyncComponent(() => import('@/views/home/StudentHome.vue'))
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100%;
}
</style>
