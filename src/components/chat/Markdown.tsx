import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check } from 'lucide-react'
import type { Components } from 'react-markdown'

/** Render markdown with GFM tables and syntax-highlighted code blocks. */
export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      skipHtml
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
})

/** Pull plain text out of the highlighted code tree so the copy button works. */
function codeText(children: React.ReactNode): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(codeText).join('')
  if (typeof children === 'object' && 'props' in children) {
    return codeText((children as { props: { children: React.ReactNode } }).props.children)
  }
  return ''
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    const mark = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    // navigator.clipboard needs a secure context and is absent in some
    // headless environments; fall back to the execCommand path.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(mark).catch(() => fallbackCopy(code, mark))
    } else {
      fallbackCopy(code, mark)
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy code"
      className="absolute right-1.5 top-1.5 inline-flex h-6 items-center gap-1 rounded bg-black/40 px-1.5 text-xs text-[var(--color-text)] opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/** Copy via a hidden textarea so it works without a secure context. */
function fallbackCopy(code: string, mark: () => void) {
  const ta = document.createElement('textarea')
  ta.value = code
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    mark()
  } catch {
    /* clipboard unavailable; leave the button showing Copy */
  }
  document.body.removeChild(ta)
}

const components: Components = {
  code({ className, children, ...props }) {
    const isBlock = className?.includes('language-')
    if (!isBlock) {
      return (
        <code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[0.85em] text-[var(--color-text)]">
          {children}
        </code>
      )
    }
    return (
      <div className="group relative">
        <CopyButton code={codeText(children)} />
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    )
  },
}