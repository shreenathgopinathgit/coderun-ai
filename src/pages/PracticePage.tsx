import { Group, Panel, Separator, type Layout } from 'react-resizable-panels'
import { useAppStore } from '../store/store'
import { LeftPane } from '../components/practice/LeftPane'
import { Toolbar } from '../components/practice/Toolbar'
import { CodeEditor } from '../components/practice/CodeEditor'
import { OutputPanel } from '../components/practice/OutputPanel'
import { starterCode } from '../components/practice/starterCode'
import type { EditorHeight, PaneSizes } from '../store/types'

/** Fixed scratch id used for code while no questions exist yet. */
const SCRATCH_ID = '__scratch__'

const MIN_PANE = 25

function toPaneSizes(layout: Layout, fallback: PaneSizes): PaneSizes {
  return {
    left: layout.left ?? fallback.left,
    right: layout.right ?? fallback.right,
  }
}

function toEditorHeight(layout: Layout, fallback: EditorHeight): EditorHeight {
  return {
    editor: layout.editor ?? fallback.editor,
    output: layout.output ?? fallback.output,
  }
}

export function PracticePage() {
  const { paneSizes, editorHeight, lastLanguage, codeByQuestion } =
    useAppStore((s) => s.practice)
  const setPaneSizes = useAppStore((s) => s.setPaneSizes)
  const setEditorHeight = useAppStore((s) => s.setEditorHeight)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setCode = useAppStore((s) => s.setCode)

  const code =
    codeByQuestion[SCRATCH_ID]?.[lastLanguage] ?? starterCode[lastLanguage]

  return (
    <div className="h-[calc(100vh-41px)] bg-[var(--color-bg)] text-[var(--color-text)]">
      <Group
        orientation="horizontal"
        defaultLayout={{ left: paneSizes.left, right: paneSizes.right }}
        onLayoutChanged={(layout) => setPaneSizes(toPaneSizes(layout, paneSizes))}
      >
        <Panel id="left" minSize={MIN_PANE} className="flex flex-col">
          <LeftPane />
        </Panel>
        <Separator className="h-full w-1 bg-[var(--color-border)] hover:bg-[var(--color-accent)]" />
        <Panel id="right" minSize={MIN_PANE} className="flex flex-col">
          <Toolbar
            language={lastLanguage}
            onLanguageChange={setLanguage}
            onRun={() => {
              /* Code runner is built in Phase 3. */
            }}
            onSubmit={() => {
              /* Test runner is built in Phase 3. */
            }}
            onReset={() => setCode(SCRATCH_ID, lastLanguage, starterCode[lastLanguage])}
            onAddLibrary={() => {
              /* Library loader is built in Phase 4. */
            }}
          />

          <Group
            orientation="vertical"
            defaultLayout={{ editor: editorHeight.editor, output: editorHeight.output }}
            onLayoutChanged={(layout) =>
              setEditorHeight(toEditorHeight(layout, editorHeight))
            }
          >
            <Panel id="editor" minSize={MIN_PANE}>
              <CodeEditor
                language={lastLanguage}
                code={code}
                onRun={() => {
                  /* Code runner is built in Phase 3. */
                }}
                onChange={(value) => setCode(SCRATCH_ID, lastLanguage, value)}
              />
            </Panel>
            <Separator className="h-1 w-full bg-[var(--color-border)] hover:bg-[var(--color-accent)]" />
            <Panel id="output" minSize={MIN_PANE}>
              <OutputPanel
                consoleOutput=""
                testResults=""
                onClear={() => {
                  /* Output is captured by the runner in Phase 3. */
                }}
              />
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  )
}