import { Group, Panel, Separator, type Layout } from 'react-resizable-panels'
import { useAppStore } from '../store/store'
import { PracticeTopBar } from '../components/practice/PracticeTopBar'
import { LeftPane } from '../components/practice/LeftPane'
import { Toolbar } from '../components/practice/Toolbar'
import { CodeEditor } from '../components/practice/CodeEditor'
import { OutputPanel } from '../components/practice/OutputPanel'
import { starterCode } from '../components/practice/starterCode'

/** Fixed scratch id used for code while no questions exist yet. */
const SCRATCH_ID = '__scratch__'
const MIN_PANE = 25
const CARD_RADIUS = '16px'

const noop = () => undefined

export function PracticePage() {
  const { paneSizes, editorHeight, lastLanguage, codeByQuestion } =
    useAppStore((s) => s.practice)
  const setPaneSizes = useAppStore((s) => s.setPaneSizes)
  const setEditorHeight = useAppStore((s) => s.setEditorHeight)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setCode = useAppStore((s) => s.setCode)
  const code = codeByQuestion[SCRATCH_ID]?.[lastLanguage] ?? starterCode[lastLanguage]

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
    <div className="relative h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <PracticeTopBar />
      <div className="absolute left-4 right-4 bottom-4 top-14">
        <Group
          orientation="horizontal"
          defaultLayout={{ left: paneSizes.left, right: paneSizes.right }}
          onLayoutChanged={onH}
        >
          <Panel id="left" minSize={MIN_PANE} className="flex flex-col">
            <div
              className="h-full flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3"
              style={{ borderRadius: CARD_RADIUS }}
            >
              <LeftPane />
            </div>
          </Panel>
          <Separator
            id="pane-divider"
            className="flex w-2 items-center justify-center bg-transparent hover:bg-[var(--color-border)] focus-visible:bg-[var(--color-accent)]"
          >
            <div className="h-6 w-1 rounded-full bg-[var(--color-border)] transition-colors group-data-[separator=active]:bg-[var(--color-accent)] group-data-[separator=focus]:bg-[var(--color-accent)]" />
          </Separator>
          <Panel id="right" minSize={MIN_PANE} className="flex flex-col">
            <div
              className="h-full flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3"
              style={{ borderRadius: CARD_RADIUS }}
            >
              <Toolbar
                language={lastLanguage}
                onLanguageChange={setLanguage}
                onRun={noop}
                onSubmit={noop}
                onReset={() => setCode(SCRATCH_ID, lastLanguage, starterCode[lastLanguage])}
                onAddLibrary={noop}
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
                      onRun={noop}
                      onChange={(value) => setCode(SCRATCH_ID, lastLanguage, value)}
                    />
                  </Panel>
                  <Separator className="flex h-1 items-center justify-center bg-transparent hover:bg-[var(--color-border)] focus-visible:bg-[var(--color-accent)]">
                    <div className="h-1 w-full max-w-[60px] rounded-full bg-[var(--color-border)] transition-colors group-data-[separator=active]:bg-[var(--color-accent)] group-data-[separator=focus]:bg-[var(--color-accent)]" />
                  </Separator>
                  <Panel id="output" minSize={MIN_PANE} className="flex flex-col">
                    <OutputPanel consoleOutput="" testResults="" onClear={noop} />
                  </Panel>
                </Group>
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  )
}