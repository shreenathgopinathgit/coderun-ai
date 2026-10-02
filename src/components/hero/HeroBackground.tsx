import { type ReactNode } from 'react'

export interface HeroBackgroundProps {
  /** Dim the layers so content on top stays readable. */
  dim?: boolean
  children?: ReactNode
}

/**
 * Shared animated background: near-black base, three drifting radial glow
 * blobs, a subtle grain overlay and a vignette. Only transform and opacity
 * are animated; prefers-reduced-motion disables the motion and keeps a
 * static gradient plus grain.
 */
export function HeroBackground({ dim = false, children }: HeroBackgroundProps) {
  return (
    <div className={`hero-bg${dim ? ' hero-bg--dim' : ''}`}>
      <div className="hero-bg__glow hero-bg__glow--one" />
      <div className="hero-bg__glow hero-bg__glow--two" />
      <div className="hero-bg__glow hero-bg__glow--three" />
      <div className="hero-bg__grain" />
      <div className="hero-bg__vignette" />
      {children}
    </div>
  )
}