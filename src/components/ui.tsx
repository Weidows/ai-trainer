import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn, copyText } from '../lib/utils'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'accent' | 'ok' | 'bad'
  className?: string
}) {
  const tones = {
    neutral: 'bg-panel2 text-ink2 border-line',
    brand: 'bg-brandsoft text-brand border-transparent',
    accent: 'bg-accentsoft text-accent border-transparent',
    ok: 'bg-oksoft text-ok border-transparent',
    bad: 'bg-badsoft text-bad border-transparent',
  } as const
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-[2px] text-[11.5px] font-medium leading-5 whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <As className={cn('rounded-xl border border-line bg-panel', className)}>{children}</As>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow?: string
  title: string
  desc?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-ink3 uppercase">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[19px] font-semibold tracking-tight text-ink">{title}</h2>
        {desc && <div className="mt-1 max-w-[62ch] text-[13.5px] leading-relaxed text-ink2">{desc}</div>}
      </div>
      {right}
    </div>
  )
}

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: string
  tone?: 'default' | 'accent'
}) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3.5">
      <div className="text-[11.5px] font-medium text-ink3">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            'tabular text-[26px] font-semibold leading-none tracking-tight',
            tone === 'accent' ? 'text-accent' : 'text-ink',
          )}
        >
          {value}
        </span>
        {unit && <span className="text-[12px] text-ink3">{unit}</span>}
      </div>
      {hint && <div className="mt-1.5 text-[11.5px] leading-snug text-ink3">{hint}</div>}
    </div>
  )
}

export function CopyButton({
  text,
  label = '复制',
  className,
  small,
}: {
  text: string | (() => string)
  label?: string
  className?: string
  small?: boolean
}) {
  const [done, setDone] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      onClick={async e => {
        e.stopPropagation()
        const t = typeof text === 'function' ? text() : text
        const ok = await copyText(t)
        if (ok) {
          setDone(true)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setDone(false), 1400)
        }
      }}
      className={cn(
        'focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel2 font-medium text-ink2 transition hover:border-line2 hover:text-ink active:translate-y-px',
        small ? 'min-h-[30px] px-2 py-1 text-[11.5px] sm:min-h-0' : 'min-h-[36px] px-3 py-1.5 text-[12.5px] sm:min-h-0',
        done && 'border-ok/40 text-ok',
        className,
      )}
      title="复制到剪贴板"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {done ? (
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h7" strokeLinecap="round" />
          </>
        )}
      </svg>
      {done ? '已复制' : label}
    </button>
  )
}

export function Code({ children, className }: { children: string; className?: string }) {
  return (
    <pre
      className={cn(
        'overflow-x-auto rounded-lg border border-line bg-codebg px-3 py-2.5 text-[12.5px] leading-[1.65] text-ink',
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  )
}

export function Bar({ value, max, tone = 'brand' }: { value: number; max: number; tone?: 'brand' | 'accent' | 'ok' | 'bad' }) {
  const w = max ? Math.max(1.5, (value / max) * 100) : 0
  const bg = { brand: 'bg-brand/75', accent: 'bg-accent/80', ok: 'bg-ok/70', bad: 'bg-bad/70' }[tone]
  return (
    <div className="h-[7px] w-full overflow-hidden rounded-full bg-line/60">
      <div className={cn('h-full rounded-full transition-[width] duration-500', bg)} style={{ width: `${w}%` }} />
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line2 px-4 py-10 text-center text-[13px] text-ink3">{children}</div>
}
