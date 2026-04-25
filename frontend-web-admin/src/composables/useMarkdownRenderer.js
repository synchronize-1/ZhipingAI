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

// 清理文本中的乱码字符
const cleanText = (content) => {
    if (!content) return ''
    // 移除各种乱码字符
    return content
        .replace(/�/g, '')           // 替换字符
        .replace(/[\uFFFD]/g, '')    // Unicode 替换字符
        .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/g, '') // 控制字符
}

// 渲染 Markdown 和 LaTeX
export const renderMarkdown = (content) => {
    if (!content) return ''

    // 先清理乱码字符
    let rendered = cleanText(content)

    // 处理块级公式 $$ ... $$
    rendered = rendered.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula, {
                displayMode: true,
                throwOnError: false
            })
        } catch (e) {
            return match
        }
    })

    // 处理行内公式 $ ... $
    rendered = rendered.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula, {
                displayMode: false,
                throwOnError: false
            })
        } catch (e) {
            return match
        }
    })

    // 渲染 Markdown
    return marked.parse(rendered)
}

// 简单格式化的消息（用于聊天场景）
export const formatChatMessage = (content) => {
    if (!content) return ''

    let formatted = cleanText(content)

    // 1. 转义 HTML 特殊字符（防止 XSS）
    formatted = formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // 2. 处理标题
    formatted = formatted.replace(/^### (.*?)$/gm, '<h4 class="md-h4">$1</h4>')
    formatted = formatted.replace(/^## (.*?)$/gm, '<h3 class="md-h3">$1</h3>')
    formatted = formatted.replace(/^# (.*?)$/gm, '<h2 class="md-h2">$1</h2>')

    // 3. 处理粗体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>')

    // 4. 处理斜体
    formatted = formatted.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>')
    formatted = formatted.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')

    // 5. 处理行内代码
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

    // 6. 处理代码块
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')

    // 7. 处理无序列表
    formatted = formatted.replace(/^[\-\*]\s+(.*?)$/gm, '<li class="md-li">$1</li>')
    formatted = formatted.replace(/(<li class="md-li">.*?<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>')

    // 8. 处理有序列表
    formatted = formatted.replace(/^\d+\.\s+(.*?)$/gm, '<li class="md-li-ordered">$1</li>')
    formatted = formatted.replace(/(<li class="md-li-ordered">.*?<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>')

    // 9. 处理引用
    formatted = formatted.replace(/^>\s+(.*?)$/gm, '<blockquote class="md-quote">$1</blockquote>')

    // 10. 处理分割线
    formatted = formatted.replace(/^---$/gm, '<hr class="md-hr" />')
    formatted = formatted.replace(/^\*\*\*$/gm, '<hr class="md-hr" />')

    // 11. 处理换行
    formatted = formatted.replace(/\n\n+/g, '</p><p class="md-p">')
    formatted = formatted.replace(/\n/g, '<br/>')

    // 12. 包裹段落
    if (!formatted.startsWith('<h') && !formatted.startsWith('<ul') &&
        !formatted.startsWith('<ol') && !formatted.startsWith('<pre') &&
        !formatted.startsWith('<blockquote')) {
        formatted = '<p class="md-p">' + formatted + '</p>'
    }

    // 13. 清理空段落
    formatted = formatted.replace(/<p class="md-p"><br\/?><\/p>/g, '')
    formatted = formatted.replace(/<p class="md-p">\s*<\/p>/g, '')

    return formatted
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

// 带提示的复制（需要在组件中传入 ElMessage）
export const copyWithMessage = async (text, ElMessage) => {
    const success = await copyText(text)
    if (success && ElMessage) {
        ElMessage.success('已复制到剪贴板')
    } else if (!success && ElMessage) {
        ElMessage.error('复制失败')
    }
    return success
}