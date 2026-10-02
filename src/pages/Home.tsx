import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/store'
import { Button } from '../components/ui/Button'

export function Home() {
  const navigate = useNavigate()

  return (
    <main className="hero-bg relative z-10 flex min-h-screen flex-col">
      <div className="hero-bg__glow hero-bg__glow--one" />
      <div className="hero-bg__glow hero-bg__glow--two" />
      <div className="hero-bg__glow hero-bg__glow--three" />
      <div className="hero-bg__grain" />
      <div className="hero-bg__vignette" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="hero-pill mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-[var(--color-hero-text)]">
          Runs in your browser. No sign-up.
        </span>

        <h1 className="hero-headline max-w-3xl text-4xl sm:text-5xl md:text-6xl">
          Practice coding with an AI that sees your code
        </h1>

        <p className="mt-4 max-w-xl text-[var(--color-hero-muted)]">
          Solve problems, run tests instantly, and ask questions about your own solution. Bring your own free API key.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="white"
            size="md"
            pill
            onClick={() => navigate('/practice')}
          >
            Start now
          </Button>
          <Button
            variant="secondary"
            size="md"
            pill
            onClick={() => useAppStore.getState().setApiKeyModalOpen(true)}
          >
            Add API key
          </Button>
        </div>
      </div>
    </main>
  )
}