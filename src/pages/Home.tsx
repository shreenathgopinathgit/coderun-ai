import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/store'
import { Button } from '../components/ui/Button'

export function Home() {
  const navigate = useNavigate()

  return (
    <main className="hero-bg relative z-10 flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hero-badge-border)] bg-[var(--color-hero-badge)] px-3 py-1 text-xs font-medium text-[var(--color-hero-text)]">
          Runs in your browser. No sign-up.
        </span>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[var(--color-hero-text)] sm:text-5xl md:text-6xl">
          Practice coding with an AI that sees your code
        </h1>

        <p className="mt-4 max-w-xl text-[var(--color-hero-muted)]">
          Solve problems, run tests instantly, and ask questions about your own solution. Bring your own free API key.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="white"
            size="md"
            onClick={() => navigate('/practice')}
          >
            Start now
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => useAppStore.getState().setApiKeyModalOpen(true)}
          >
            Add API key
          </Button>
        </div>
      </div>
    </main>
  )
}