<template>
  <transition name="route-progress-fade">
    <div v-if="visible" class="route-progress" role="progressbar" aria-label="页面加载中">
      <div class="route-progress__bar" :style="{ width: percent + '%' }" />
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)
const percent = ref(0)

let tickTimer = null
let hideTimer = null
let removeBefore = null
let removeAfter = null
let removeError = null

function start() {
  clearTimeout(hideTimer)
  visible.value = true
  percent.value = 8
  clearInterval(tickTimer)
  tickTimer = setInterval(() => {
    // 渐进逼近 90%，等待路由完成后冲到 100%
    if (percent.value < 90) {
      percent.value = Math.min(90, percent.value + Math.random() * 12)
    }
  }, 180)
}

function finish() {
  clearInterval(tickTimer)
  percent.value = 100
  hideTimer = setTimeout(() => {
    visible.value = false
    hideTimer = setTimeout(() => {
      percent.value = 0
    }, 220)
  }, 260)
}

onMounted(() => {
  removeBefore = router.beforeEach((to, from, next) => {
    if (to.path !== from.path) start()
    next()
  })
  removeAfter = router.afterEach(finish)
  removeError = router.onError(finish)
})

onUnmounted(() => {
  clearInterval(tickTimer)
  clearTimeout(hideTimer)
  if (removeBefore) removeBefore()
  if (removeAfter) removeAfter()
  if (removeError) removeError()
})
</script>

<style scoped>
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: transparent;
  pointer-events: none;
}

.route-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #22d3ee 100%);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
  transition: width 0.2s ease;
}

.route-progress-fade-leave-active {
  transition: opacity 0.25s ease;
}

.route-progress-fade-leave-to {
  opacity: 0;
}
</style>