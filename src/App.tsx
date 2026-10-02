import { useEffect } from 'react'
import { useRoutes, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Key, Home as HomeIcon, ChevronRight } from 'lucide-react'
import { useAppStore } from './store/store'
import { ApiKeyModal } from './components/ApiKeyModal'
import { Button } from './components/ui/Button'

function BurgerMenu() {
  const menuOpen = useAppStore((s) => s.ui.burgerMenuOpen)
  const setMenuOpen = useAppStore((s) => s.setBurgerMenuOpen)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, setMenuOpen])

  if (!menuOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setMenuOpen(false)}
      />
      <aside className="fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            CodeForge AI
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="rounded p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
          >
            <Menu size={16} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          <LinkHome />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              useAppStore.getState().setApiKeyModalOpen(true)
            }}
            className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          >
            <Key size={16} />
            API Keys
          </button>
        </nav>
      </aside>
    </>
  )
}

function LinkHome() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
    >
      <HomeIcon size={16} />
      Home
    </button>
  )
}

function Home() {
  const navigate = useNavigate()
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
          CodeForge AI
        </h1>
        <p className="mt-3 text-[var(--color-text-dim)]">
          LeetCode-style practice with a built-in AI tutor.
        </p>
        <div className="mt-6">
          <Button size="md" onClick={() => navigate('/practice')}>
            Start now
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </main>
  )
}

function PracticePlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <p className="text-sm text-[var(--color-text-dim)]">
        Practice page is built in Phase 2.
      </p>
    </div>
  )
}

function Routes() {
  return useRoutes([
    { path: '/', element: <Home /> },
    { path: '/practice', element: <PracticePlaceholder /> },
  ])
}

export default function App() {
  const apiKeyModalOpen = useAppStore((s) => s.ui.apiKeyModalOpen)
  const setApiKeyModalOpen = useAppStore((s) => s.setApiKeyModalOpen)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center border-b border-[var(--color-border)] px-3 py-2">
        <button
          type="button"
          onClick={() => useAppStore.getState().setBurgerMenuOpen(true)}
          aria-label="Open menu"
          className="rounded p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
        >
          <Menu size={20} />
        </button>
      </header>

      <BurgerMenu />

      <ApiKeyModal
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />

      <main className="flex-1">
        <Routes />
      </main>
    </div>
  )
}