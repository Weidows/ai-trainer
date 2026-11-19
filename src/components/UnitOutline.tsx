import { useMemo, useState } from 'react'
import type { Outline } from '../types'
import { cn, pct } from '../lib/utils'

export type UnitRow = {
  key: string
  name: string
  part: string
  total: number
  judge: number
  single: number
  multi: number
}

const PART_STYLE: Record<string, { dot: string; bar: string; soft: string; text: string }> = {
  基本要求: { dot: 'bg-brand', bar: 'bg-brand/70', soft: 'bg-brandsoft', text: 'text-brand' },
  业务分析: { dot: 'bg-accent', bar: 'bg-accent/75', soft: 'bg-accentsoft', text: 'text-accent' },
  智能训练: { dot: 'bg-ok', bar: 'bg-ok/70', soft: 'bg-oksoft', text: 'text-ok' },
  智能系统设计: { dot: 'bg-teal', bar: 'bg-teal/70', soft: 'bg-[color-mix(in_srgb,var(--teal)_12%,transparent)]', text: 'text-teal' },
  培训与指导: { dot: 'bg-slate', bar: 'bg-slate/60', soft: 'bg-[color-mix(in_srgb,var(--slate)_14%,transparent)]', text: 'text-slate' },
}
const FALLBACK = PART_STYLE['基本要求']
const styleOf = (part: string) => PART_STYLE[part] ?? FALLBACK

const PARTS = ['基本要求', '业务分析', '智能训练', '智能系统设计', '培训与指导']

/** 把「考纲细目」挂到理论单元上。law 这一章在细目表里属于「通用基础知识」单元的第二个分组 */
function useOutlineGroups(outline: Outline) {
  return useMemo(() => {
    const byKey = new Map(outline.theory.map(u => [u.key, u]))
    return (chapterKey: string) => {
      const unit = byKey.get(chapterKey === 'law' ? 'general' : chapterKey)
      if (!unit) return { groups: [] as { name: string; points: string[] }[], pointCount: 0 }
      const groups =
        chapterKey === 'law'
          ? unit.groups.filter(g => g.name.includes('法律'))
          : chapterKey === 'general'
            ? unit.groups.filter(g => !g.name.includes('法律'))
            : unit.groups
      return { groups, pointCount: groups.reduce((a, g) => a + g.points.length, 0) }
    }
  }, [outline])
}

export default function UnitOutline({ chapters, outline }: { chapters: UnitRow[]; outline: Outline }) {
  const groupsOf = useOutlineGroups(outline)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [hover, setHover] = useState<string | null>(null)
  const [sort, setSort] = useState<'exam' | 'count'>('exam')

  const total = chapters.reduce((a, c) => a + c.total, 0)
  const rows = useMemo(
    () => (sort === 'count' ? [...chapters].sort((a, b) => b.total - a.total) : chapters),
    [chapters, sort],
  )
  const max = Math.max(...chapters.map(c => c.total))
  const allOpen = open.size === chapters.length

  const toggle = (key: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const hovered = hover ? chapters.find(c => c.key === hover) : null

  return (
    <div className="space-y-3">
      {/* 全局占比条 */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-[11.5px]">
          <span className="text-ink3">
            {hovered ? (
              <span className="text-ink">
                <span className={cn('mr-1.5 inline-block h-2 w-2 rounded-sm align-middle', styleOf(hovered.part).dot)} />
                {hovered.name} · <span className="tabular">{hovered.total} 题</span> · {pct(hovered.total, total)}%
              </span>
            ) : (
              '悬停看单元占比，点击行看知识点'
            )}
          </span>
          <span className="tabular text-ink3">共 {total} 题</span>
        </div>
        <div className="flex h-[10px] w-full overflow-hidden rounded-full bg-line/50">
          {chapters.map(c => (
            <button
              key={c.key}
              onMouseEnter={() => setHover(c.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(c.key)}
              onBlur={() => setHover(null)}
              onClick={() => toggle(c.key)}
              style={{ width: `${(c.total / total) * 100}%` }}
              className={cn(
                'group relative h-full border-r border-panel transition-[filter,opacity] last:border-r-0',
                styleOf(c.part).bar,
                hover && hover !== c.key ? 'opacity-35' : 'opacity-100',
                open.has(c.key) && 'ring-1 ring-ink/20 ring-inset',
              )}
              aria-label={`${c.name} ${c.total} 题`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-ink3">
          {PARTS.map(p => (
            <span key={p} className="flex items-center gap-1.5">
              <i className={cn('h-2 w-2 rounded-sm', styleOf(p).dot)} />
              {p}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setOpen(allOpen ? new Set() : new Set(chapters.map(c => c.key)))}
              className="hover:text-ink"
            >
              {allOpen ? '全部收起' : '全部展开'}
            </button>
            <span className="text-line2">|</span>
            <button
              onClick={() => setSort(sort === 'exam' ? 'count' : 'exam')}
              className="hover:text-ink"
              title="切换排序"
            >
              排序：{sort === 'exam' ? '考纲顺序' : '题量降序'}
            </button>
          </span>
        </div>
      </div>

      {/* 列头 */}
      <div className="hidden grid-cols-[28px_minmax(0,1fr)_74px_84px_16px] gap-x-3 px-4 text-[10.5px] tracking-wide text-ink3 sm:grid">
        <span />
        <span>单元 · 题量条</span>
        <span className="text-right">题量 / 占比</span>
        <span className="text-right">细目点</span>
        <span />
      </div>

      {/* 单元行 */}
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        {rows.map((c, i) => {
          const isOpen = open.has(c.key)
          const st = styleOf(c.part)
          const { groups, pointCount } = groupsOf(c.key)
          const perPoint = pointCount ? (c.total / pointCount).toFixed(1) : '—'
          return (
            <div
              key={c.key}
              onMouseEnter={() => setHover(c.key)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                'relative border-b border-line/70 transition-colors last:border-0',
                hover === c.key ? 'bg-panel2' : 'bg-transparent',
                isOpen && 'bg-panel2/50',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute top-0 bottom-0 left-0 w-[2px] transition-opacity',
                  st.dot,
                  hover === c.key || isOpen ? 'opacity-100' : 'opacity-0',
                )}
              />
              <button
                onClick={() => toggle(c.key)}
                aria-expanded={isOpen}
                className="focus-ring grid w-full grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left sm:grid-cols-[28px_minmax(0,1fr)_74px_84px_16px]"
              >
                <span className="tabular text-[11px] text-ink3">{String(i + 1).padStart(2, '0')}</span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[13px] font-medium text-ink">{c.name}</span>
                    <span className={cn('rounded px-1.5 py-[1px] text-[10.5px] font-medium', st.soft, st.text)}>
                      {c.part}
                    </span>
                    <span className="tabular text-[11px] text-ink3 sm:hidden">{c.total} 题</span>
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-line/50">
                      <span
                        className={cn('block h-full rounded-full transition-[width] duration-500', st.bar)}
                        style={{ width: `${Math.max(2, (c.total / max) * 100)}%` }}
                      />
                    </span>
                    <span className="tabular hidden shrink-0 text-[11px] text-ink3 sm:inline">
                      判 {c.judge} · 单 {c.single} · 多 {c.multi}
                    </span>
                  </span>
                </span>

                <span className="tabular hidden text-right text-[12px] text-ink2 sm:block">
                  <span className="font-semibold text-ink">{c.total}</span> 题
                  <span className="ml-1 text-[10.5px] text-ink3">{pct(c.total, total)}%</span>
                </span>
                <span className="hidden text-right text-[11px] text-ink3 sm:block">
                  {pointCount} 细目点
                </span>
                <span className={cn('hidden text-ink3 transition-transform sm:block', isOpen && 'rotate-90')}>
                  ▸
                </span>
                <span className="col-span-2 col-start-2 flex items-center justify-between text-[11px] text-ink3 sm:hidden">
                  <span>{pointCount} 细目点 · 约 {Math.round((c.total / total) * 100)} 分</span>
                  <span className={cn('transition-transform', isOpen && 'rotate-90')}>▸</span>
                </span>
              </button>

              {isOpen && (
                <div className="bg-panel2/70 px-4 pt-1 pb-3.5 pl-[42px] sm:pl-[50px]">
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink3">
                    <span>{pointCount} 个细目点</span>
                    <span className="text-line2">·</span>
                    <span>平均每个细目点 {perPoint} 道复习题</span>
                    {groups.length > 1 && (
                      <>
                        <span className="text-line2">·</span>
                        <span>{groups.length} 个知识分组</span>
                      </>
                    )}
                  </div>
                  {groups.map(g => (
                    <div key={g.name} className="mb-2.5 last:mb-0">
                      <div className="mb-1 flex items-baseline gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                        <span className="text-[11.5px] font-semibold text-ink2">{g.name}</span>
                        <span className="tabular text-[10.5px] text-ink3">{g.points.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {g.points.map(p => (
                          <span
                            key={p}
                            className="rounded border border-line bg-panel px-1.5 py-[1px] text-[11.5px] leading-[1.6] text-ink2"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
