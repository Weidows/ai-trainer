import { useEffect, useMemo, useState } from 'react'
import theory from '../data/theory.json'
import practical from '../data/practical.json'
import type { Kind, Question, Task } from '../types'
import { Badge, Bar, Card, Empty, SectionTitle } from '../components/ui'
import QuestionCard from '../components/QuestionCard'
import TaskDetail from '../components/TaskDetail'
import { cn, isRight, pct, shuffleWithSeed } from '../lib/utils'
import { useMarks, useTaskAnswers } from '../lib/store'

const THEORY = theory as Question[]
const TASKS = practical as Task[]

type Filter = 'all' | Kind
const KIND_LABEL: Record<Filter, string> = { all: '全部', judge: '判断题', single: '单选题', multi: '多选题' }

export default function Drill() {
  const [tab, setTab] = useState<'theory' | 'practical'>('theory')
  return (
    <div className="enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-ink3 uppercase">Drill</div>
          <h1 className="text-[24px] font-semibold tracking-tight">刷题</h1>
          <p className="mt-1 text-[13px] text-ink2">
            理论 {THEORY.length} 道（官方复习题）+ 实操 {TASKS.length} 道（官方题库全部题目）。
          </p>
        </div>
        <div className="flex rounded-lg border border-line bg-panel p-0.5">
          {(
            [
              ['theory', `理论 ${THEORY.length}`],
              ['practical', `实操 ${TASKS.length}`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                'focus-ring min-h-[36px] rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition sm:min-h-0',
                tab === k ? 'bg-ink text-paper' : 'text-ink2 hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'theory' ? <TheoryDrill /> : <PracticalDrill />}
    </div>
  )
}

/* ----------------------------- 理论 ----------------------------- */

function TheoryDrill() {
  const { marks, record, reset } = useMarks()
  const [filter, setFilter] = useState<Filter>('all')
  const [chapter, setChapter] = useState('all')
  const [scope, setScope] = useState<'all' | 'wrong' | 'todo'>('all')
  const [mix, setMix] = useState(false)
  const [seed, setSeed] = useState(() => Date.now())
  const [idx, setIdx] = useState(0)

  const chapters = useMemo(() => {
    const seen: { key: string; name: string; n: number }[] = []
    for (const q of THEORY) {
      const cur = seen.find(s => s.key === q.chapter)
      if (cur) cur.n++
      else seen.push({ key: q.chapter, name: q.chapterName, n: 1 })
    }
    return seen
  }, [])

  const list = useMemo(() => {
    let arr = THEORY
    if (filter !== 'all') arr = arr.filter(q => q.kind === filter)
    if (chapter !== 'all') arr = arr.filter(q => q.chapter === chapter)
    if (scope === 'wrong') arr = arr.filter(q => marks[q.id]?.r === 'wrong')
    if (scope === 'todo') arr = arr.filter(q => !marks[q.id])
    return mix ? shuffleWithSeed(arr, seed) : arr
  }, [filter, chapter, scope, marks, mix, seed])

  useEffect(() => {
    setIdx(0)
  }, [filter, chapter, scope, mix, seed])

  const q = list[Math.min(idx, list.length - 1)]
  const mark = q ? marks[q.id] : undefined
  const doneInList = list.filter(x => marks[x.id]).length
  const rightInList = list.filter(x => marks[x.id]?.r === 'right').length

  const next = () => setIdx(i => Math.min(list.length - 1, i + 1))
  const prev = () => setIdx(i => Math.max(0, i - 1))

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-line bg-panel2 p-0.5">
            {(['all', 'judge', 'single', 'multi'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'min-h-[34px] rounded px-2.5 py-1 text-[12px] font-medium transition sm:min-h-0',
                  filter === f ? 'bg-panel text-ink shadow-sm' : 'text-ink3 hover:text-ink2',
                )}
              >
                {KIND_LABEL[f]}
              </button>
            ))}
          </div>

          <select
            value={chapter}
            onChange={e => setChapter(e.target.value)}
            className="focus-ring min-h-[34px] max-w-[52%] flex-1 rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] text-ink2 sm:flex-none"
          >
            <option value="all">全部单元（{THEORY.length}）</option>
            {chapters.map(c => (
              <option key={c.key} value={c.key}>
                {c.name}（{c.n}）
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            {(
              [
                ['all', '全部'],
                ['todo', '未做'],
                ['wrong', `错题 ${Object.values(marks).filter(m => m.r === 'wrong').length}`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setScope(k)}
                className={cn(
                  'min-h-[34px] rounded-md border px-2.5 py-1 text-[12px] transition sm:min-h-0',
                  scope === k ? 'border-ink/30 bg-panel2 font-medium text-ink' : 'border-line text-ink3 hover:text-ink2',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMix(v => !v)}
              aria-pressed={mix}
              title="打散题目顺序，跨题型、跨单元随机排列"
              className={cn(
                'focus-ring flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition sm:min-h-0',
                mix
                  ? 'border-accent/40 bg-accentsoft font-medium text-accent'
                  : 'border-line text-ink3 hover:text-ink2',
              )}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              混排
            </button>
            {mix && (
              <button
                onClick={() => setSeed(Date.now())}
                title="重新洗一副"
                className="focus-ring min-h-[34px] rounded-md border border-line px-2 py-1 text-[11.5px] text-ink3 hover:text-ink sm:min-h-0"
              >
                ↻ 重洗
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3 text-[11.5px] text-ink3">
            <span className="tabular">
              本组 {doneInList}/{list.length} · 正确率 {doneInList ? pct(rightInList, doneInList) : 0}%
            </span>
            <button onClick={reset} className="hover:text-bad">
              重置进度
            </button>
          </div>
        </div>
        <div className="mt-2.5">
          <Bar value={doneInList} max={list.length || 1} />
        </div>
      </Card>

      {!q ? (
        <Empty>{scope === 'wrong' ? '还没有错题，继续刷。' : '这个筛选条件下没有题目。'}</Empty>
      ) : (
        <>
          <QuestionCard
            q={q}
            picked={mark?.picked}
            revealed={Boolean(mark)}
            onAnswer={picked => record(q.id, isRight(q, picked), picked)}
            onNext={next}
            onPrev={prev}
          />

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="focus-ring min-h-[40px] rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 disabled:opacity-40 sm:min-h-0"
            >
              ← 上一题
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={list.length}
                value={idx + 1}
                onChange={e => setIdx(Math.max(0, Math.min(list.length - 1, Number(e.target.value) - 1)))}
                className="tabular w-[68px] rounded-md border border-line bg-panel px-2 py-1 text-center text-[12px]"
              />
              <span className="tabular text-[12px] text-ink3">/ {list.length}</span>
            </div>
            <button
              onClick={next}
              disabled={idx >= list.length - 1}
              className="focus-ring min-h-[40px] rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 disabled:opacity-40 sm:min-h-0"
            >
              下一题 →
            </button>
          </div>

          <p className="text-center text-[11px] text-ink3">
            快捷键：← → 翻题 · 1–5 选选项 · Enter 提交多选或进下一题
          </p>
        </>
      )}
    </div>
  )
}

/* ----------------------------- 实操 ----------------------------- */

function PracticalDrill() {
  const { answers } = useTaskAnswers()
  const [openId, setOpenId] = useState<string | null>(null)
  const [unit, setUnit] = useState<string>('all')
  const [mix, setMix] = useState(false)
  const [seed, setSeed] = useState(() => Date.now())

  const units = useMemo(() => {
    const seen: string[] = []
    for (const t of TASKS) if (!seen.includes(t.unit)) seen.push(t.unit)
    return seen
  }, [])

  const list = useMemo(() => {
    const arr = unit === 'all' ? TASKS : TASKS.filter(t => t.unit === unit)
    return mix ? shuffleWithSeed(arr, seed) : arr
  }, [unit, mix, seed])
  const task = TASKS.find(t => t.id === openId)

  if (task) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpenId(null)}
          className="focus-ring rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 hover:text-ink"
        >
          ← 返回题目列表
        </button>
        <TaskDetail task={task} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setUnit('all')}
          className={cn(
            'min-h-[34px] rounded-md border px-2.5 py-1 text-[12px] transition sm:min-h-0',
            unit === 'all' ? 'border-ink/30 bg-panel2 font-medium text-ink' : 'border-line text-ink3 hover:text-ink2',
          )}
        >
          全部 40 题
        </button>
        {units.map(u => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={cn(
              'min-h-[34px] rounded-md border px-2.5 py-1 text-[12px] transition sm:min-h-0',
              unit === u ? 'border-ink/30 bg-panel2 font-medium text-ink' : 'border-line text-ink3 hover:text-ink2',
            )}
          >
            {u}
          </button>
        ))}

        <button
          onClick={() => setMix(v => !v)}
          aria-pressed={mix}
          title="打散题目顺序"
          className={cn(
            'focus-ring ml-auto flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition sm:min-h-0',
            mix ? 'border-accent/40 bg-accentsoft font-medium text-accent' : 'border-line text-ink3 hover:text-ink2',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          混排
        </button>
        {mix && (
          <button
            onClick={() => setSeed(Date.now())}
            className="focus-ring min-h-[34px] rounded-md border border-line px-2 py-1 text-[11.5px] text-ink3 hover:text-ink sm:min-h-0"
          >
            ↻ 重洗
          </button>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(t => {
          const mine = answers[t.id]?.blanks ?? []
          const total = t.blanks.length
          const filled = mine.filter(x => x && x.trim()).length
          const checked = Boolean(answers[t.id]?.checked)
          return (
            <button
              key={t.id}
              onClick={() => setOpenId(t.id)}
              className="focus-ring group rounded-xl border border-line bg-panel p-3.5 text-left transition hover:-translate-y-0.5 hover:border-line2 hover:shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11.5px] font-semibold text-accent">{t.id}</span>
                <Badge tone="neutral">{t.duration}</Badge>
                <Badge tone={t.hasCode ? 'brand' : 'neutral'}>{t.hasCode ? `${total} 空` : '非代码'}</Badge>
                <span className="tabular ml-auto text-[11px] text-ink3">{t.fullScore} 分</span>
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-medium text-ink">{t.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-ink3">
                <span>{t.subName}</span>
                {t.hasCode && (
                  <span className="ml-auto tabular">
                    {checked ? <span className="text-ok">已检查</span> : filled ? `已填 ${filled}/${total}` : '未开始'}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <SectionTitle
        eyebrow="说明"
        title="怎么练这 40 道题"
        desc="先看题干和评分细则，自己想代码，然后在空白里敲；敲完点「检查」对写法，再去 Jupyter 里跑一遍确认输出，最后按考场的命名要求截图。"
      />
    </div>
  )
}
