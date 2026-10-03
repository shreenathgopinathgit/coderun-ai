import { Group, Panel, Separator, type Layout } from 'react-resizable-panels'
import { useAppStore } from '../store/store'
import { HeroBackground } from '../components/hero/HeroBackground'
import { PracticeTopBar } from '../components/practice/PracticeTopBar'
import { LeftPane } from '../components/practice/LeftPane'
import { Toolbar } from '../components/practice/Toolbar'
import { CodeEditor } from '../components/practice/CodeEditor'
import { OutputPanel } from '../components/practice/OutputPanel'
import { useRunner } from '../runner/useRunner'
import { starterCode } from '../components/practice/starterCode'

/** Fixed scratch id used for code while no questions exist yet. */
const SCRATCH_ID = '__scratch__'
const MIN_PANE = 25
const CARD_RADIUS = '16px'

/** Languages without a configured executor. */
const STUB_LANGUAGES = new Set(['java', 'c', 'cpp', 'go', 'rust'])

export function PracticePage() {
  const { paneSizes, editorHeight, lastLanguage, codeByQuestion } =
    useAppStore((s) => s.practice)
  const setPaneSizes = useAppStore((s) => s.setPaneSizes)
  const setEditorHeight = useAppStore((s) => s.setEditorHeight)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setCode = useAppStore((s) => s.setCode)
  const code = codeByQuestion[SCRATCH_ID]?.[lastLanguage] ?? starterCode[lastLanguage]

  const { state, run, stop, clear, report } = useRunner()
  const isStub = STUB_LANGUAGES.has(lastLanguage)

  const NO_EXECUTOR =
    'No executor is configured for this language. Configure a Judge0 or Piston compatible endpoint in settings.'

  const runCode = (): void => {
    if (state.loading) return
    // Stub languages have no executor: show the honest message in the
    // Console tab instead of silently doing nothing.
    if (isStub) {
      report(NO_EXECUTOR)
      return
    }
    run({
      code,
      functionName: 'main',
      cases: [],
      language: lastLanguage as 'python' | 'javascript' | 'typescript',
    })
  }

  const submitCode = (): void => {
    if (state.loading) return
    if (isStub) {
      report(NO_EXECUTOR)
      return
    }
    run({
      code,
      functionName: 'main',
      cases: [],
      language: lastLanguage as 'python' | 'javascript' | 'typescript',
    })
  }

  const onRunStop = (): void => stop(lastLanguage as 'python' | 'javascript' | 'typescript')

  const onH = (layout: Layout) =>
    setPaneSizes({
      left: layout.left ?? paneSizes.left,
      right: layout.right ?? paneSizes.right,
    })
  const onV = (layout: Layout) =>
    setEditorHeight({
      editor: layout.editor ?? editorHeight.editor,
      output: layout.output ?? editorHeight.output,
    })

  return (
    <div className="relative h-screen text-[var(--color-text)]">
      <HeroBackground dim />
      <div className="relative z-10 flex h-full flex-col">
        <PracticeTopBar />
        <div className="absolute left-4 right-4 bottom-4 top-14">
          <Group
            orientation="horizontal"
            defaultLayout={{ left: paneSizes.left, right: paneSizes.right }}
            onLayoutChanged={onH}
          >
            <Panel id="left" minSize={MIN_PANE} className="flex flex-col">
              <div className="card" style={{ borderRadius: CARD_RADIUS }}>
                <LeftPane />
              </div>
            </Panel>
            <Separator id="pane-divider" className="divider-horizontal">
              <div className="handle-vertical" />
            </Separator>
            <Panel id="right" minSize={MIN_PANE} className="flex flex-col">
              <div className="card" style={{ borderRadius: CARD_RADIUS }}>
                <Toolbar
                  language={lastLanguage}
                  onLanguageChange={setLanguage}
                  onRun={runCode}
                  onRunStop={onRunStop}
                  onSubmit={submitCode}
                  onReset={() => setCode(SCRATCH_ID, lastLanguage, starterCode[lastLanguage])}
                  onAddLibrary={() => undefined}
                  disabled={state.loading}
                  stopDisabled={isStub}
                  stopTitle={
                    isStub
                      ? 'No executor is configured for this language. Configure a Judge0 or Piston compatible endpoint in settings.'
                      : undefined
                  }
                  submitDisabled={isStub || state.loading}
                  submitTitle={
                    isStub
                      ? NO_EXECUTOR
                      : 'Needs a question with test cases'
                  }
                />
                <div className="flex-1 overflow-hidden">
                  <Group
                    orientation="vertical"
                    defaultLayout={{ editor: editorHeight.editor, output: editorHeight.output }}
                    onLayoutChanged={onV}
                  >
                    <Panel id="editor" minSize={MIN_PANE} className="flex flex-col">
                      <CodeEditor
                        language={lastLanguage}
                        code={code}
                        onRun={runCode}
                        onChange={(value) => setCode(SCRATCH_ID, lastLanguage, value)}
                      />
                    </Panel>
                    <Separator className="divider-vertical">
                      <div className="handle-horizontal" />
                    </Separator>
                    <Panel id="output" minSize={MIN_PANE} className="flex flex-col">
                      <OutputPanel
                        result={state.result}
                        error={state.error}
                        timedOut={state.timedOut}
                        pyLoading={state.pyLoading}
                        pyError={state.pyError}
                        onClear={clear}
                      />
                    </Panel>
                  </Group>
                </div>
              </div>
            </Panel>
          </Group>
        </div>
      </div>
    </div>
  )
}