<template>
  <el-config-provider :locale="epLocale">
    <RouteProgress />
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import RouteProgress from '@/components/common/RouteProgress.vue'
import { useI18n } from '@/i18n'

const { locale } = useI18n()
const epLocale = computed(() => (locale.value === 'en-US' ? en : zhCn))
</script>

<style>
#app {
  min-height: 100vh;
}
</style>