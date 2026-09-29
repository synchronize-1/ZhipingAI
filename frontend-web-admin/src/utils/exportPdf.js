import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// A4 纸张尺寸（mm）
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
// 四周边距（mm）
const PAGE_MARGIN_MM = 10
// 标题区与内容之间的间距（mm）
const HEADER_GAP_MM = 4
// 分页时允许向上回退的最大比例（用于把分页点吸附到卡片边界，避免卡片被横向截断）
const SNAP_TOLERANCE_RATIO = 0.3
// 单次导出最多页数，防止异常情况下死循环
const MAX_PAGES = 200

/**
 * 过滤文件名中的非法字符
 * @param {string} name
 * @returns {string}
 */
function sanitizeFileName(name) {
  const fallback = '导出文件'
  if (!name) return fallback
  const safe = String(name).replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim()
  return safe || fallback
}

/**
 * 把标题 / 副标题绘制成图片（jsPDF 内置字体不支持中文，故用 canvas 绘制后以图片形式贴入）
 * @param {string} title
 * @param {string} subtitle
 * @returns {{ dataUrl: string, widthPx: number, heightPx: number }}
 */
function createHeaderImage(title, subtitle) {
  const widthPx = 1200
  const padX = 6
  const padTop = 8
  const titleLineHeight = 46
  const subtitleLineHeight = 28
  const hasSubtitle = !!subtitle
  const heightPx = padTop + titleLineHeight + (hasSubtitle ? subtitleLineHeight : 0) + 10

  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, widthPx, heightPx)

  ctx.textBaseline = 'top'
  ctx.fillStyle = '#1f2937'
  ctx.font =
    'bold 36px "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Heiti SC", sans-serif'
  ctx.fillText(title, padX, padTop)

  if (hasSubtitle) {
    ctx.fillStyle = '#6b7280'
    ctx.font =
      '18px "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Heiti SC", sans-serif'
    ctx.fillText(subtitle, padX, padTop + titleLineHeight)
  }

  // 标题下方的分割线
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, heightPx - 1)
  ctx.lineTo(widthPx, heightPx - 1)
  ctx.stroke()

  return { dataUrl: canvas.toDataURL('image/png'), widthPx, heightPx }
}

/**
 * 采集可用于分页断点的 y 坐标（换算为 canvas 像素坐标）
 * 取容器内所有可见元素的上边缘，作为「不会把卡片截成两半」的候选切分点
 * @param {HTMLElement} el
 * @param {HTMLCanvasElement} canvas
 * @returns {number[]} 升序去重的坐标数组
 */
function collectBreakPoints(el, canvas) {
  const elHeight = el.offsetHeight || el.clientHeight || 0
  if (!elHeight) return []

  const scaleY = canvas.height / elHeight
  const baseRect = el.getBoundingClientRect()
  const scrollTop = el.scrollTop || 0
  const points = []

  const nodes = el.querySelectorAll('*')
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const rect = node.getBoundingClientRect()
    if (rect.height < 1) continue
    const top = Math.round((rect.top - baseRect.top + scrollTop) * scaleY)
    if (top > 0 && top < canvas.height) points.push(top)
  }

  return Array.from(new Set(points)).sort((a, b) => a - b)
}

/**
 * 在候选断点中找出不超过 target、且不小于 minPoint 的最大值
 * @param {number[]} points 升序数组
 * @param {number} target
 * @param {number} minPoint
 * @returns {number|null}
 */
function findSnapPoint(points, target, minPoint) {
  let best = null
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    if (point > target) break
    if (point >= minPoint) best = point
  }
  return best
}

/**
 * 把 canvas 的某一段竖直区域绘制到一张新的 canvas 上
 * @param {HTMLCanvasElement} source
 * @param {number} srcY 起始 y（源 canvas 像素）
 * @param {number} srcH 高度（源 canvas 像素）
 * @returns {HTMLCanvasElement}
 */
function sliceCanvas(source, srcY, srcH) {
  const slice = document.createElement('canvas')
  slice.width = source.width
  slice.height = srcH
  const ctx = slice.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, slice.width, srcH)
  ctx.drawImage(source, 0, srcY, source.width, srcH, 0, 0, source.width, srcH)
  return slice
}

/**
 * 计算分页切片方案（纯函数，便于单测边界情况）
 * @param {object} params
 * @param {number} params.canvasHeight 内容 canvas 总高度（px）
 * @param {number} params.pxToMm canvas 像素 → mm 的换算比例
 * @param {number} params.firstPageAvailableMm 首页可用高度（已扣除标题区，mm）
 * @param {number} params.contentHeightMm 后续页可用高度（mm）
 * @param {number[]} [params.breakPoints] 候选分页断点（canvas 像素，升序）
 * @param {number} [params.snapToleranceRatio] 允许向上回退的比例
 * @param {number} [params.maxPages] 最大页数保护
 * @returns {Array<{srcY:number, srcH:number}>} 每页切片在源 canvas 中的起止
 */
export function computePageSlices({
  canvasHeight,
  pxToMm,
  firstPageAvailableMm,
  contentHeightMm,
  breakPoints = [],
  snapToleranceRatio = SNAP_TOLERANCE_RATIO,
  maxPages = MAX_PAGES
}) {
  const slices = []
  if (!(canvasHeight > 0) || !(pxToMm > 0)) return slices

  // 首页可用高度（需扣除标题区），其余页可用高度
  const maxFirstPx = Math.floor(firstPageAvailableMm / pxToMm)
  const maxOtherPx = Math.floor(contentHeightMm / pxToMm)
  if (maxFirstPx <= 0 || maxOtherPx <= 0) return slices

  // 1. 先求最少页数
  let pageCount = 1
  if (canvasHeight > maxFirstPx) {
    pageCount = 1 + Math.ceil((canvasHeight - maxFirstPx) / maxOtherPx)
  }
  pageCount = Math.min(pageCount, maxPages)

  // 2. 逐页计算切片，尽量均分，避免最后一页只剩极少内容（大片空白）
  let srcY = 0
  for (let i = 0; i < pageCount; i++) {
    const remainingPx = canvasHeight - srcY
    if (remainingPx <= 0) break

    const remainingPages = pageCount - i
    const maxSlicePx = i === 0 ? maxFirstPx : maxOtherPx
    let slicePx = Math.min(maxSlicePx, Math.ceil(remainingPx / remainingPages))

    // 下限：必须给本页留够内容，否则后续页面容量不足会导致内容丢失
    const capacityAfterPx = (remainingPages - 1) * maxOtherPx
    const minSlicePx = Math.max(1, remainingPx - capacityAfterPx)

    // 断点吸附：把分页点挪到元素边界，避免卡片被截成两半（仅非末页尝试）
    if (i < pageCount - 1 && breakPoints.length) {
      const target = srcY + slicePx
      const minPoint = Math.max(srcY + minSlicePx, srcY + Math.floor(slicePx * (1 - snapToleranceRatio)))
      const snapped = findSnapPoint(breakPoints, target, minPoint)
      if (snapped && snapped > srcY && snapped <= srcY + maxSlicePx) {
        slicePx = snapped - srcY
      }
    }

    slicePx = Math.min(maxSlicePx, Math.max(slicePx, minSlicePx), remainingPx)
    if (slicePx <= 0) break

    slices.push({ srcY, srcH: slicePx })
    srcY += slicePx
  }

  return slices
}

/**
 * 将指定 DOM 元素导出为 PDF
 * @param {HTMLElement} el - 要导出的 DOM 元素
 * @param {string} fileName - 文件名（不含扩展名）
 * @param {object} options - { title, subtitle }
 * @returns {Promise<void>}
 */
export async function exportElementToPdf(el, fileName, options = {}) {
  if (!el || typeof el.getBoundingClientRect !== 'function') {
    throw new Error('导出失败：未找到要导出的内容')
  }
  if (!el.offsetWidth && !el.offsetHeight) {
    throw new Error('导出失败：导出内容尺寸为 0，请稍后重试')
  }

  const { title = '', subtitle = '' } = options

  // 1. 渲染为 canvas
  let canvas
  try {
    canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      // 忽略 loading 遮罩等临时元素
      ignoreElements: (node) =>
        !!node.classList &&
        (node.classList.contains('pdf-ignore') || node.classList.contains('el-loading-mask'))
    })
  } catch (error) {
    throw new Error(`导出失败：页面内容渲染失败（${error?.message || error}）`)
  }

  if (!canvas || !canvas.width || !canvas.height) {
    throw new Error('导出失败：页面内容渲染结果为空')
  }

  // 2. 计算尺寸（canvas 像素 → mm）
  const contentWidthMm = A4_WIDTH_MM - PAGE_MARGIN_MM * 2
  const contentHeightMm = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2
  const pxToMm = contentWidthMm / canvas.width

  // 3. 标题区（以图片形式贴入，规避 jsPDF 内置字体不支持中文的问题）
  let header = null
  let headerHeightMm = 0
  if (title) {
    const headerImage = createHeaderImage(title, subtitle)
    header = headerImage
    headerHeightMm = (headerImage.heightPx / headerImage.widthPx) * contentWidthMm + HEADER_GAP_MM
  }

  const firstPageAvailableMm = contentHeightMm - headerHeightMm
  if (firstPageAvailableMm <= 10) {
    throw new Error('导出失败：页面可用高度不足')
  }

  // 4. 分页断点
  const breakPoints = collectBreakPoints(el, canvas)

  // 5. 计算分页方案
  const slices = computePageSlices({
    canvasHeight: canvas.height,
    pxToMm,
    firstPageAvailableMm,
    contentHeightMm,
    breakPoints
  })
  if (!slices.length) {
    throw new Error('导出失败：内容分页失败')
  }

  // 6. 逐页绘制
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  slices.forEach((slice, pageIndex) => {
    if (pageIndex > 0) pdf.addPage()

    let cursorY = PAGE_MARGIN_MM
    if (pageIndex === 0 && header) {
      const headerDrawHeightMm = headerHeightMm - HEADER_GAP_MM
      pdf.addImage(
        header.dataUrl,
        'PNG',
        PAGE_MARGIN_MM,
        cursorY,
        contentWidthMm,
        headerDrawHeightMm
      )
      cursorY += headerHeightMm
    }

    const sliceCanvasEl = sliceCanvas(canvas, slice.srcY, slice.srcH)
    pdf.addImage(
      sliceCanvasEl.toDataURL('image/jpeg', 0.92),
      'JPEG',
      PAGE_MARGIN_MM,
      cursorY,
      contentWidthMm,
      slice.srcH * pxToMm
    )
  })

  // 7. 保存
  pdf.save(`${sanitizeFileName(fileName)}.pdf`)
}

export default exportElementToPdf