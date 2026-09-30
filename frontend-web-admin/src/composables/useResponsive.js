import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 视口响应式断点
 *   mobile  : <= 768px
 *   tablet  : 769 ~ 1024px
 *   desktop : > 1024px
 */
export function useResponsive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)

  const update = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  const isMobile = computed(() => width.value <= 768)
  const isTablet = computed(() => width.value > 768 && width.value <= 1024)
  const isDesktop = computed(() => width.value > 1024)
  // 平板与小屏（需要收起侧栏 / 简化布局）
  const isCompact = computed(() => width.value <= 1024)

  return { width, isMobile, isTablet, isDesktop, isCompact }
}

export default useResponsive