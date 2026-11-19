import { useEffect, useMemo, useRef, useState } from 'react'
import theory from '../data/theory.json'
import practical from '../data/practical.json'
import type { Question, Task } from '../types'
import { Badge, Bar, Card, Empty, SectionTitle, Stat } from '../components/ui'
import QuestionCard from '../components/QuestionCard'
import TaskDetail from '../components/TaskDetail'
import { blankRight, cn, fmtClock, isRight, pct, shuffle } from '../lib/utils'
import { useMockHistory, useTaskAnswers, type MockResult } from '../lib/store'

const THEORY = theory as Question[]
const TASKS = practical as Task[]

type Stage = 'idle' | 'theory' | 'practical'

type PaperItem = { q: Question; picked: string }

export default function Mock() {
  const [stage, setStage] = useState<Stage>('idle')
  const [report, setReport] = useState<MockResult | null>(null)
  const { history, push, clear } = useMockHistory()

  if (report) {
    return (
      <Report
        report={report}
        onBack={() => {
          setReport(null)
          setStage('idle')
        }}
      />
    )
  }

  if (stage === 'theory')
    return (
      <TheoryExam
        onSubmit={r => {
          push(r)
          setReport(r)
        }}
        onQuit={() => setStage('idle')}
      />
    )

  if (stage === 'practical')
    return (
      <PracticalExam
        onSubmit={r => {
          push(r)
          setReport(r)
        }}
        onQuit={() => setStage('idle')}
      />
    )

  return (
    <div className="enter space-y-6">
      <h1 className="sr-only">模拟考</h1>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">理论知识模拟卷</h2>
              <p className="mt-1 text-[12.5px] text-ink2">190 题 · 100 分 · 90 分钟 · 60 分合格</p>
            </div>
            <Badge tone="brand">机考</Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11.5px]">
            {[
              ['判断', '40 × 0.5'],
              ['单选', '140 × 0.5'],
              ['多选', '10 × 1'],
            ].map(([a, b]) => (
              <div key={a} className="rounded-lg bg-panel2 py-2">
                <div className="text-ink3">{a}</div>
                <div className="tabular mt-0.5 font-semibold text-ink">{b}</div>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-1 text-[12px] text-ink2">
            <li>· 从 900 道题库随机抽取，题型顺序和考场一致</li>
            <li>· 时间到自动交卷，中途可以翻回答题卡</li>
          </ul>
          <button
            onClick={() => setStage('theory')}
            className="focus-ring mt-4 w-full rounded-lg bg-ink py-2 text-[13px] font-medium text-paper hover:opacity-90"
          >
            开始理论模拟（90:00）
          </button>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">操作技能模拟卷</h2>
              <p className="mt-1 text-[12.5px] text-ink2">6 题 · 100 分 · 120 分钟</p>
            </div>
            <Badge tone="accent">连线考场结构</Badge>
          </div>
          <div className="mt-3 space-y-1.5 text-[11.5px] text-ink2">
            {[
              ['业务分析', '随机 1 题（1.1 / 1.2）', '25 分'],
              ['数据处理规范制定', '必考 2.1.x', '15 分'],
              ['算法测试', '必考 2.2.x', '20 分'],
              ['智能系统监控和优化', '必考 3.1.x', '15 分'],
              ['人机交互流程设计', '必考 3.2.x', '20 分'],
              ['培训与指导', '随机 1 题（4.1 / 4.2）', '5 分'],
            ].map(([a, b, c]) => (
              <div key={a} className="flex items-center gap-2">
                <span className="w-[112px] shrink-0 text-ink3">{a}</span>
                <span className="flex-1 truncate">{b}</span>
                <span className="tabular shrink-0 font-semibold text-ink">{c}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink3">
            判分按「填对的空数 / 总空数」折算到该题配分，不是官方评分（官方看运行结果和截图）。
          </p>
          <button
            onClick={() => setStage('practical')}
            className="focus-ring mt-3 w-full rounded-lg border border-line bg-panel py-2 text-[13px] font-medium text-ink hover:border-line2"
          >
            开始实操模拟（120:00）
          </button>
        </Card>
      </div>

      <section>
        <SectionTitle
          eyebrow="历史"
          title="最近成绩"
          right={
            history.length > 0 ? (
              <button onClick={clear} className="text-[11.5px] text-ink3 hover:text-bad">
                清空
              </button>
            ) : undefined
          }
        />
        {history.length === 0 ? (
          <Empty>还没有模拟记录。做完一套会存在本机浏览器里。</Empty>
        ) : (
          <Card className="divide-y divide-line/70">
            {history.map(h => (
              <div key={h.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[12.5px]">
                <Badge tone={h.kind === 'theory' ? 'brand' : 'accent'}>{h.kind === 'theory' ? '理论' : '实操'}</Badge>
                <span className="font-medium">{h.title}</span>
                <span className="tabular text-ink3">{new Date(h.at).toLocaleString('zh-CN', { hour12: false })}</span>
                <span className="ml-auto tabular">
                  <span
                    className={cn(
                      'text-[15px] font-semibold',
                      h.score >= 60 ? 'text-ok' : 'text-bad',
                    )}
                  >
                    {h.score}
                  </span>
                  <span className="text-ink3"> / {h.total}</span>
                </span>
                <span className="tabular w-[64px] text-right text-ink3">用时 {fmtClock(h.seconds)}</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}

/* ----------------------------- 理论模拟 ----------------------------- */

function useCountdown(seconds: number, onEnd: () => void) {
  const [left, setLeft] = useState(seconds)
  const done = useRef(false)
  useEffect(() => {
    const t = window.setInterval(() => {
      setLeft(v => {
        if (v <= 1) {
          window.clearInterval(t)
          if (!done.current) {
            done.current = true
            onEnd()
          }
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return left
}

function buildTheoryPaper(): Question[] {
  const pick = (kind: 'judge' | 'single' | 'multi', n: number) =>
    shuffle(THEORY.filter(q => q.kind === kind)).slice(0, n)
  return [...pick('judge', 40), ...pick('single', 140), ...pick('multi', 10)]
}

function TheoryExam({ onSubmit, onQuit }: { onSubmit: (r: MockResult) => void; onQuit: () => void }) {
  const paper = useMemo(buildTheoryPaper, [])
  const [items, setItems] = useState<PaperItem[]>(() => paper.map(q => ({ q, picked: '' })))
  const [cur, setCur] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const submitted = useRef(false)

  const finish = () => {
    if (submitted.current) return
    submitted.current = true
    let score = 0
    const detail: Record<string, { right: number; total: number }> = {}
    const wrongIds: string[] = []
    for (const it of items) {
      const ch = it.q.chapterName
      detail[ch] ??= { right: 0, total: 0 }
      detail[ch].total++
      const ok = it.picked ? isRight(it.q, it.picked) : false
      if (ok) {
        score += it.q.kind === 'multi' ? 1 : 0.5
        detail[ch].right++
      } else wrongIds.push(it.q.id)
    }
    onSubmit({
      id: `t-${Date.now()}`,
      at: Date.now(),
      kind: 'theory',
      score: Math.round(score * 10) / 10,
      total: 100,
      seconds: Math.max(0, left0 - leftRef.current),
      detail,
      wrongIds,
      title: '理论模拟卷',
    })
  }

  const left0 = 90 * 60
  const left = useCountdown(left0, finish)
  const leftRef = useRef(left)
  leftRef.current = left

  const answeredCount = items.filter(i => i.picked).length
  const it = items[cur]

  const setPicked = (picked: string) =>
    setItems(prev => prev.map((x, i) => (i === cur ? { ...x, picked } : x)))

  return (
    <div className="enter">
      {/* 顶栏 */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
        <Badge tone="brand">理论模拟</Badge>
        <span className="tabular text-[12px] text-ink2">
          已答 {answeredCount}/{items.length}
        </span>
        <div className="tabular rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[13px] font-semibold">
          {fmtClock(left)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-[11.5px] text-ink3">未答 {items.length - answeredCount} 题按错算</span>
              <button
                onClick={finish}
                className="focus-ring rounded-lg bg-bad px-3.5 py-1.5 text-[12.5px] font-medium text-white"
              >
                确认交卷
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink3 hover:text-ink"
              >
                继续答题
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="focus-ring rounded-lg bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-paper"
            >
              交卷
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('退出模拟考？本次作答不会保存。')) onQuit()
            }}
            className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink3 hover:text-ink"
          >
            退出
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_216px]">
        <div className="space-y-3">
          <QuestionCard
            q={it.q}
            picked={it.picked}
            revealed={false}
            onAnswer={setPicked}
            onNext={() => setCur(c => Math.min(items.length - 1, c + 1))}
            onPrev={() => setCur(c => Math.max(0, c - 1))}
            nextLabel="下一题"
            label={`第 ${cur + 1} 题 · 共 ${items.length}`}
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCur(c => Math.max(0, c - 1))}
              disabled={cur === 0}
              className="focus-ring rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 disabled:opacity-40"
            >
              ← 上一题
            </button>
            <span className="tabular text-[12px] text-ink3">
              {cur + 1} / {items.length}
            </span>
            <button
              onClick={() => setCur(c => Math.min(items.length - 1, c + 1))}
              disabled={cur === items.length - 1}
              className="focus-ring rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 disabled:opacity-40"
            >
              下一题 →
            </button>
          </div>
        </div>

        <Card className="h-fit p-3">
          <div className="mb-2 flex items-center justify-between text-[11.5px] text-ink3">
            <span>答题卡</span>
            <span className="tabular">{answeredCount} 已答</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5 text-[10.5px] text-ink3">
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-sm bg-ink" />已答
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-sm border border-line2" />未答
            </span>
            <button
              onClick={() => {
                const i = items.findIndex((x, k) => k > cur && !x.picked)
                setCur(i >= 0 ? i : items.findIndex(x => !x.picked))
              }}
              className="ml-auto text-[10.5px] text-accent hover:underline"
            >
              跳到未答 →
            </button>
          </div>
          <div className="grid max-h-[420px] grid-cols-7 gap-1 overflow-y-auto pr-1">
            {items.map((x, i) => (
              <button
                key={x.q.id}
                onClick={() => setCur(i)}
                className={cn(
                  'tabular h-6 rounded text-[10.5px] font-medium transition',
                  i === cur
                    ? 'ring-2 ring-accent ring-offset-1 ring-offset-panel'
                    : '',
                  x.picked ? 'bg-ink text-paper' : 'border border-line bg-panel text-ink3 hover:border-line2',
                )}
                title={`${i + 1} · ${x.q.kindName}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ----------------------------- 实操模拟 ----------------------------- */

function buildPracticalPaper(): Task[] {
  const one = (unit: string) => shuffle(TASKS.filter(t => t.unit === unit))[0]
  const bizUnit = Math.random() < 0.5 ? '1.1' : '1.2'
  const trainUnit = Math.random() < 0.5 ? '4.1' : '4.2'
  return [one(bizUnit), one('2.1'), one('2.2'), one('3.1'), one('3.2'), one(trainUnit)]
}

function PracticalExam({ onSubmit, onQuit }: { onSubmit: (r: MockResult) => void; onQuit: () => void }) {
  const paper = useMemo(buildPracticalPaper, [])
  const [cur, setCur] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const { answers } = useTaskAnswers()
  const submitted = useRef(false)

  const totalBlanks = paper.reduce((a, t) => a + t.blanks.length, 0)
  const doneBlanks = paper.reduce(
    (a, t) => a + t.blanks.filter((_b, i) => {
      const v = answers[t.id]?.blanks?.[i]
      return v && v.trim()
    }).length,
    0,
  )

  const finish = () => {
    if (submitted.current) return
    submitted.current = true
    let score = 0
    const detail: Record<string, { right: number; total: number }> = {}
    const wrongIds: string[] = []
    for (const t of paper) {
      const mine = answers[t.id]?.blanks ?? []
      let right = 0
      t.blanks.forEach((b, i) => {
        if (blankRight(mine[i] ?? '', b.answer)) right++
      })
      const ratio = t.blanks.length ? right / t.blanks.length : 0
      score += ratio * t.fullScore
      detail[`${t.id} · ${t.unitName}`] = { right, total: t.blanks.length }
      if (t.blanks.length && ratio < 0.6) wrongIds.push(t.id)
    }
    onSubmit({
      id: `p-${Date.now()}`,
      at: Date.now(),
      kind: 'practical',
      score: Math.round(score * 10) / 10,
      total: paper.reduce((a, t) => a + t.fullScore, 0),
      seconds: Math.max(0, left0 - leftRef.current),
      detail,
      wrongIds,
      title: '实操模拟卷',
    })
  }

  const left0 = 120 * 60
  const left = useCountdown(left0, finish)
  const leftRef = useRef(left)
  leftRef.current = left
  const task = paper[cur]

  return (
    <div className="enter">
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
        <Badge tone="accent">实操模拟</Badge>
        <span className="tabular text-[12px] text-ink2">
          第 {cur + 1}/6 题 · 已填 {doneBlanks}/{totalBlanks} 空
        </span>
        <div className="tabular rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[13px] font-semibold">
          {fmtClock(left)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <button
                onClick={finish}
                className="focus-ring rounded-lg bg-bad px-3.5 py-1.5 text-[12.5px] font-medium text-white"
              >
                确认交卷
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink3 hover:text-ink"
              >
                继续
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="focus-ring rounded-lg bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-paper"
            >
              交卷
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('退出模拟考？')) onQuit()
            }}
            className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink3 hover:text-ink"
          >
            退出
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {paper.map((t, i) => {
          const mine = answers[t.id]?.blanks ?? []
          const filled = t.blanks.filter((_, bi) => mine[bi] && mine[bi].trim()).length
          return (
            <button
              key={t.id}
              onClick={() => setCur(i)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11.5px] transition',
                i === cur ? 'border-ink/40 bg-panel2 font-medium text-ink' : 'border-line text-ink3 hover:text-ink2',
              )}
            >
              <span className="font-mono">{t.id}</span>
              {t.blanks.length > 0 && (
                <span className="tabular ml-1 text-[10.5px] text-ink3">
                  {filled}/{t.blanks.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <TaskDetail key={task.id} task={task} />

      <div className="mt-3 flex justify-between">
        <button
          onClick={() => setCur(c => Math.max(0, c - 1))}
          disabled={cur === 0}
          className="focus-ring rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 disabled:opacity-40"
        >
          ← 上一题
        </button>
        <button
          onClick={() => setCur(c => Math.min(paper.length - 1, c + 1))}
          disabled={cur === paper.length - 1}
          className="focus-ring rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 disabled:opacity-40"
        >
          下一题 →
        </button>
      </div>
    </div>
  )
}

/* ----------------------------- 成绩单 ----------------------------- */

function Report({ report, onBack }: { report: MockResult; onBack: () => void }) {
  const passed = report.score >= 60
  const entries = Object.entries(report.detail)
  const max = Math.max(...entries.map(([, v]) => v.total), 1)

  return (
    <div className="enter space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-ink3 uppercase">Report</div>
          <h1 className="text-[24px] font-semibold tracking-tight">成绩单 · {report.title}</h1>
        </div>
        <button
          onClick={onBack}
          className="focus-ring rounded-lg border border-line bg-panel px-3 py-1.5 text-[12.5px] text-ink2 hover:text-ink"
        >
          返回模拟考
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="得分" value={report.score} unit={`/ ${report.total}`} tone="accent" />
        <Stat label="结果" value={passed ? '合格' : '不合格'} hint={passed ? '60 分及以上' : '差 60 分还有距离'} />
        <Stat label="用时" value={fmtClock(report.seconds)} hint={report.kind === 'theory' ? '限时 90:00' : '限时 120:00'} />
        <Stat
          label={report.kind === 'theory' ? '错题' : '不熟题'}
          value={report.wrongIds.length}
          hint={report.kind === 'theory' ? '含未作答' : '正确率低于 60% 的题'}
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-[13px] font-semibold">分块正确率</h3>
        <div className="space-y-2.5">
          {entries.map(([name, v]) => (
            <div key={name} className="flex items-center gap-3">
              <div className="w-[190px] shrink-0 truncate text-[12px] text-ink2">{name}</div>
              {v.total === 0 ? (
                <div className="flex-1 text-[11.5px] text-ink3">非代码题，无填空可判</div>
              ) : (
                <div className="min-w-0 flex-1">
                  <Bar value={v.right} max={max} tone={pct(v.right, v.total) >= 60 ? 'ok' : 'bad'} />
                </div>
              )}
              <div className="tabular w-[92px] shrink-0 text-right text-[11.5px] text-ink3">
                {v.total === 0 ? '—' : `${v.right}/${v.total} · ${pct(v.right, v.total)}%`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {report.wrongIds.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 text-[13px] font-semibold">
            {report.kind === 'theory' ? '错题回顾' : '需要再过一遍的题'}
          </h3>
          <div className="space-y-2">
            {report.wrongIds.slice(0, 60).map(id => {
              const q = report.kind === 'theory' ? THEORY.find(x => x.id === id) : undefined
              const t = report.kind === 'practical' ? TASKS.find(x => x.id === id) : undefined
              if (q)
                return (
                  <div key={id} className="rounded-lg border border-line bg-panel2 px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] text-ink3">
                      <Badge tone="neutral">{q.kindName}</Badge>
                      <span>{q.chapterName}</span>
                      <span className="ml-auto font-mono">答案 {q.answer}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{q.stem}</p>
                    {q.explain && <p className="mt-1 text-[11.5px] leading-relaxed text-ink3">{q.explain}</p>}
                  </div>
                )
              if (t)
                return (
                  <div key={id} className="rounded-lg border border-line bg-panel2 px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] text-ink3">
                      <Badge tone="neutral">{t.id}</Badge>
                      <span>{t.unitName}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink">{t.title}</p>
                  </div>
                )
              return null
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
