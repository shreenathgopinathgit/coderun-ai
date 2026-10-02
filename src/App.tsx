import { useRoutes, useLocation } from 'react-router-dom'
import { useAppStore } from './store/store'
import { TopBar } from './components/TopBar'
import { BurgerMenu } from './components/BurgerMenu'
import { ApiKeyModal } from './components/ApiKeyModal'
import { Home } from './pages/Home'
import { PracticePage } from './pages/PracticePage'

function Routes() {
  return useRoutes([
    { path: '/', element: <Home /> },
    { path: '/practice', element: <PracticePage /> },
  ])
}

export default function App() {
  const apiKeyModalOpen = useAppStore((s) => s.ui.apiKeyModalOpen)
  const setApiKeyModalOpen = useAppStore((s) => s.setApiKeyModalOpen)
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex min-h-screen flex-col">
      {isHome && <TopBar />}

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