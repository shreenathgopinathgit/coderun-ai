import { Menu, Key } from 'lucide-react'
import { useAppStore } from '../store/store'

export function TopBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="hero-pill pointer-events-auto flex items-center gap-2 rounded-full px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => useAppStore.getState().setBurgerMenuOpen(true)}
          aria-label="Open menu"
          className="focus-ring rounded-full p-1.5 text-[var(--color-hero-text)] hover:bg-white/10"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold tracking-tight text-[var(--color-hero-text)]">
          CodeForge AI
        </span>
      </div>

      <button
        type="button"
        onClick={() => useAppStore.getState().setApiKeyModalOpen(true)}
        aria-label="Open API keys"
        className="focus-ring hero-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-[var(--color-hero-text)] hover:bg-white/10"
      >
        <Key size={14} />
        API Keys
      </button>
    </div>
  )
}