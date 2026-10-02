import { useRoutes, useLocation } from 'react-router-dom'
import { useAppStore } from './store/store'
import { TopBar } from './components/TopBar'
import { BurgerMenu } from './components/BurgerMenu'
import { ApiKeyModal } from './components/ApiKeyModal'
import { Home } from './pages/Home'

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
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />

      <BurgerMenu />

      <ApiKeyModal
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />

      <main className={`flex-1 ${isHome ? '' : 'bg-[var(--color-bg)] text-[var(--color-text)]'}`}>
        <Routes />
      </main>
    </div>
  )
}