// useMarkdownRenderer.js
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// 配置 marked
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
    },
    breaks: true,
    gfm: true
})

// 清理文本中的乱码字符和修复常见LaTeX问题
const cleanText = (content) => {
    if (!content) return ''

    let cleaned = content
        // 移除各种乱码字符
        .replace(/�/g, '')
        .replace(/[\uFFFD]/g, '')
        .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/g, '')

    return cleaned
}

// 预处理 LaTeX 公式，修复常见问题
const fixLatexFormula = (formula) => {
    if (!formula) return formula

    // 关键修复：处理被转义的反斜杠
    let fixed = formula
        // 修复 \\[ 变成 \[（双反斜杠变单反斜杠）
        .replace(/\\\\/g, '\\')
        // 修复 \{ 和 \}
        .replace(/\\{/g, '{')
        .replace(/\\}/g, '}')

    return fixed
}

// 渲染 Markdown 和 LaTeX
export const renderMarkdown = (content) => {
    if (!content) return ''

    // 先清理乱码字符
    let rendered = cleanText(content)

    // 处理块级公式 $$ ... $$
    rendered = rendered.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        try {
            const fixedFormula = fixLatexFormula(formula)
            return katex.renderToString(fixedFormula, {
                displayMode: true,
                throwOnError: false,
                strict: false,
                output: 'html'
            })
        } catch (e) {
            console.warn('KaTeX 块级公式渲染失败:', e.message)
            // 返回原始公式作为代码块
            return `<div class="katex-error-block"><pre><code>${escapeHtml(formula)}</code></pre></div>`
        }
    })

    // 处理行内公式 $ ... $
    rendered = rendered.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
        try {
            const fixedFormula = fixLatexFormula(formula)
            return katex.renderToString(fixedFormula, {
                displayMode: false,
                throwOnError: false,
                strict: false,
                output: 'html'
            })
        } catch (e) {
            console.warn('KaTeX 行内公式渲染失败:', e.message)
            // 返回原始公式作为行内代码
            return `<code class="latex-inline">${escapeHtml(formula)}</code>`
        }
    })

    // 渲染 Markdown
    try {
        return marked.parse(rendered)
    } catch (e) {
        console.error('Markdown 渲染失败:', e)
        // 如果 Markdown 渲染失败，用代码块包裹
        return `<pre><code>${escapeHtml(rendered)}</code></pre>`
    }
}

// HTML 转义
const escapeHtml = (text) => {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// 格式化聊天消息（优化版本）
export const formatChatMessage = (content) => {
    if (!content) return ''

    // 直接使用 renderMarkdown，保持渲染一致性
    return renderMarkdown(content)
}

// 复制文本
export const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (err) {
        console.error('复制失败:', err)
        return false
    }
}

// 带提示的复制
export const copyWithMessage = async (text, ElMessage) => {
    const success = await copyText(text)
    if (success && ElMessage) {
        ElMessage.success('已复制到剪贴板')
    } else if (!success && ElMessage) {
        ElMessage.error('复制失败')
    }
    return success
}