import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import type { Language } from '../../store/types'

export interface CodeEditorProps {
  language: Language
  code: string
  onRun: () => void
  onChange: (value: string) => void
}

const monacoLanguage: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  c: 'cpp',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
}

const editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontLigatures: false,
  minimap: { enabled: false },
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  autoClosingBrackets: 'always',
  autoClosingDelete: 'always',
  autoSurround: 'languageDefined',
  formatOnPaste: true,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: 'on',
  wrappingIndent: 'indent',
  renderWhitespace: 'selection',
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto',
    useShadows: true,
  },
  padding: { top: 8, bottom: 8 },
}

export function CodeEditor({ language, code, onRun, onChange }: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const actionDisposableRef = useRef<ReturnType<
    Monaco.editor.IStandaloneCodeEditor['addAction']
  > | null>(null)
  const onRunRef = useRef(onRun)

  // Keep onRunRef up to date if the prop changes
  useEffect(() => {
    onRunRef.current = onRun
  }, [onRun])

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Ctrl/Cmd+Enter runs the current code. The action's disposable is
    // released together with the editor on unmount.
    actionDisposableRef.current = editor.addAction({
      id: 'codeforge-run',
      label: 'Run',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRunRef.current(),
    })
  }

  useEffect(() => {
    return () => {
      actionDisposableRef.current?.dispose()
      actionDisposableRef.current = null
      editorRef.current?.dispose()
      editorRef.current = null
    }
  }, [])

  return (
    <div data-testid="editor" className="flex-1">
      <Editor
        height="100%"
        width="100%"
        language={monacoLanguage[language]}
        theme="vs-dark"
        value={code}
        beforeMount={(monaco) => {
          monaco.editor.setTheme('vs-dark')
        }}
        onMount={handleMount}
        onChange={(value) => onChange(value ?? '')}
        options={editorOptions}
        loading={
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-dim)]">
            Loading editor…
          </div>
        }
      />
    </div>
  )
}