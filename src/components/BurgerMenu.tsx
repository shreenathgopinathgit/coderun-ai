import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Key, Home as HomeIcon } from 'lucide-react'
import { useAppStore } from '../store/store'

export function BurgerMenu() {
  const menuOpen = useAppStore((s) => s.ui.burgerMenuOpen)
  const setMenuOpen = useAppStore((s) => s.setBurgerMenuOpen)
  const location = useLocation()
  const navigate = useNavigate()

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
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              navigate('/')
            }}
            className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          >
            <HomeIcon size={16} />
            Home
          </button>
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