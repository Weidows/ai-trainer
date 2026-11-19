import { useMemo, useState } from 'react'
import type { Task } from '../types'
import { Badge, Card, CopyButton } from './ui'
import { blankRight, buildIpynb, cn, downloadFile, taskToText } from '../lib/utils'
import { useTaskAnswers } from '../lib/store'

const BLANK = /_{3,}/

function Blocks({ task }: { task: Task }) {
  return (
    <div className="space-y-2.5">
      {task.sections.map(s => (
        <div key={s.title}>
          {s.title !== task.title && (
            <h3 className="mt-3 mb-1.5 text-[13px] font-semibold text-ink">{s.title}</h3>
          )}
          <div className="space-y-2">
            {s.blocks.map((b, i) => {
              if (b.k === 'h1') return null
              if (b.k === 'code') {
                return (
                  <div key={i} className="relative">
                    <pre className="overflow-x-auto rounded-lg border border-line bg-codebg px-3 py-2 text-[12px] leading-[1.6]">
                      <code>{b.t as string}</code>
                    </pre>
                  </div>
                )
              }
              if (b.k === 'table') {
                const rows = b.t as string[][]
                return (
                  <div key={i} className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-[12px]">
                      <tbody>
                        {rows.map((r, ri) => (
                          <tr key={ri} className="border-b border-line/60 last:border-0">
                            {r.map((c, ci) => (
                              <td key={ci} className={cn('px-2.5 py-1.5 align-top', ri === 0 && 'bg-panel2 font-medium')}>
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
              if (b.k === 'li') {
                return (
                  <div key={i} className="flex gap-2 text-[13px] leading-[1.75] text-ink2">
                    <span className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-ink3" />
                    <span>{b.t as string}</span>
                  </div>
                )
              }
              return (
                <p key={i} className="text-[13px] leading-[1.85] text-ink2 whitespace-pre-wrap">
                  {b.t as string}
                </p>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 把骨架渲染成「文字 + 输入框」 */
function SkeletonEditor({
  task,
  filled,
  onChange,
  checked,
  showAnswer,
}: {
  task: Task
  filled: string[]
  onChange: (idx: number, v: string) => void
  checked: boolean
  showAnswer: boolean
}) {
  const cells = useMemo(() => {
    let idx = 0
    return task.skeleton.map((src, ci) => {
      const lines = src.split('\n').map((line, li) => {
        const parts = line.split(BLANK)
        const nBlanks = parts.length - 1
        const myIdx = Array.from({ length: nBlanks }, (_, k) => idx + k)
        idx += nBlanks
        return { parts, myIdx, li, ci }
      })
      return { ci, lines }
    })
  }, [task])

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-codebg">
      <div className="min-w-[520px] px-3 py-2.5 font-mono text-[12px] leading-[2.15]">
        {cells.map(cell => (
          <div key={cell.ci} className={cn(cell.ci > 0 && 'mt-3 border-t border-line/60 pt-2.5')}>
            {cell.lines.map((line, i) => {
              const isComment = line.parts[0].trim().startsWith('#')
              return (
              <div key={i} className="flex flex-wrap items-baseline">
                {line.parts.map((part, pi) => (
                  <span key={pi} className="whitespace-pre-wrap">
                    <span className={isComment ? 'text-ink3' : 'text-ink'}>{part}</span>
                    {pi < line.myIdx.length && (
                      <BlankInput
                        idx={line.myIdx[pi]}
                        value={filled[line.myIdx[pi]] ?? ''}
                        answer={task.blanks[line.myIdx[pi]]?.answer ?? ''}
                        onChange={onChange}
                        checked={checked}
                        showAnswer={showAnswer}
                      />
                    )}
                  </span>
                ))}
              </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function BlankInput({
  idx,
  value,
  answer,
  onChange,
  checked,
  showAnswer,
}: {
  idx: number
  value: string
  answer: string
  onChange: (i: number, v: string) => void
  checked: boolean
  showAnswer: boolean
}) {
  const ok = blankRight(value, answer)
  const width = Math.max(9, Math.min(46, Math.max(value.length, showAnswer ? answer.length : 0) + 2))
  return (
    <span className="inline-flex items-baseline">
      <input
        value={value}
        onChange={e => onChange(idx, e.target.value)}
        spellCheck={false}
        autoComplete="off"
        style={{ width: `${width}ch` }}
        placeholder="________"
        className={cn(
          'mx-[1px] rounded-sm border-b bg-transparent px-1 text-[12px] outline-none transition placeholder:text-ink3/70',
          !checked && 'border-line2 focus:border-accent focus:bg-panel',
          !checked && !value && 'border-dashed bg-panel2/60',
          checked && ok && 'border-ok/60 bg-oksoft text-ok',
          checked && !ok && 'border-bad/60 bg-badsoft text-bad',
        )}
      />
      {showAnswer && !ok && (
        <span className="ml-1 rounded bg-oksoft px-1 text-[11px] text-ok">{answer}</span>
      )}
    </span>
  )
}

export default function TaskDetail({ task }: { task: Task }) {
  const { answers, setBlank, markChecked, clear } = useTaskAnswers()
  const [showAnswer, setShowAnswer] = useState(false)
  const [openSteps, setOpenSteps] = useState(true)
  const mine = answers[task.id]?.blanks ?? []
  const checked = Boolean(answers[task.id]?.checked)

  const total = task.blanks.length
  const right = task.blanks.reduce((a, b, i) => a + (blankRight(mine[i] ?? '', b.answer) ? 1 : 0), 0)
  const filledCount = mine.filter(x => x && x.trim()).length

  const check = () => markChecked(task.id, true)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{task.id}</Badge>
            <Badge tone="neutral">{task.unitName}</Badge>
            <Badge tone="accent">{task.subName}</Badge>
            <Badge tone="neutral">{task.duration}</Badge>
            <Badge tone="neutral">满分 {task.fullScore}</Badge>
            {task.hasCode && <Badge tone="ok">{total} 个空</Badge>}
          </div>
          <h2 className="mt-2 text-[19px] leading-snug font-semibold tracking-tight">{task.title}</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CopyButton text={() => taskToText(task)} label="复制整题" />
          {task.hasCode && (
            <>
              <button
                onClick={() => downloadFile(`${task.id}.ipynb`, buildIpynb(task, mine))}
                className="focus-ring min-h-[36px] rounded-lg border border-line bg-panel2 px-3 py-1.5 text-[12.5px] font-medium text-ink2 hover:border-line2 hover:text-ink sm:min-h-0"
              >
                下载填好的 ipynb
              </button>
              <button
                onClick={() => setShowAnswer(v => !v)}
                className="focus-ring min-h-[36px] rounded-lg border border-line bg-panel2 px-3 py-1.5 text-[12.5px] font-medium text-ink2 hover:border-line2 hover:text-ink sm:min-h-0"
              >
                {showAnswer ? '隐藏答案' : '显示答案'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="p-4 sm:p-5">
          <Blocks task={task} />
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
              <h3 className="text-[13px] font-semibold">评分细则</h3>
              <span className="tabular text-[11.5px] text-ink3">
                合计 {task.rubric.reduce((a, r) => a + r.score, 0)} 分
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-[12px]">
                <tbody>
                  {task.rubric.map(r => (
                    <tr key={r.id} className="border-b border-line/60 last:border-0">
                      <td className="w-[42px] px-2.5 py-1.5 align-top font-mono text-[11px] text-ink3">{r.id}</td>
                      <td className="w-[34px] px-1 py-1.5 align-top text-right font-semibold tabular">{r.score}</td>
                      <td className="px-2.5 py-1.5 leading-relaxed text-ink2">{r.desc}</td>
                    </tr>
                  ))}
                  {!task.rubric.length && (
                    <tr>
                      <td className="px-3 py-4 text-center text-ink3">该题站点未提供逐项细则</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {task.hasCode && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">填空判分</h3>
                <span className="tabular text-[11.5px] text-ink3">
                  已填 {filledCount}/{total}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={check}
                  className="focus-ring rounded-lg bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-paper"
                >
                  检查
                </button>
                <button
                  onClick={() => {
                    clear(task.id)
                    setShowAnswer(false)
                  }}
                  className="focus-ring rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink2 hover:border-line2 hover:text-ink"
                >
                  清空
                </button>
                {checked && (
                  <span className={cn('text-[12.5px] font-semibold', right === total ? 'text-ok' : 'text-accent')}>
                    {right} / {total} 空正确
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink3">
                判分只比对代码写法（忽略空格与引号风格），不执行代码。真实评分看运行结果和截图，
                所以填完记得在 Jupyter 里跑一遍。
              </p>
            </Card>
          )}
        </div>
      </div>

      {task.hasCode && (
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">代码骨架 · 直接在空里敲</h3>
            <span className="text-right text-[11.5px] text-ink3">
              <span className="hidden sm:inline">下划线处就是考场上要补的部分</span>
              <span className="sm:hidden">可左右滑动</span>
            </span>
          </div>
          <SkeletonEditor
            task={task}
            filled={mine}
            onChange={(i, v) => setBlank(task.id, i, v)}
            checked={checked}
            showAnswer={showAnswer}
          />
        </Card>
      )}

      {task.steps.length > 0 && (
        <Card>
          <button
            onClick={() => setOpenSteps(v => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            <span className={cn('text-ink3 transition-transform', openSteps && 'rotate-90')}>▸</span>
            <h3 className="text-[13px] font-semibold">图文教程 · 参考实现逐段讲解</h3>
            <span className="ml-auto text-[11.5px] text-ink3">{task.steps.length} 个步骤</span>
          </button>
          {openSteps && (
            <div className="border-t border-line/70 px-4 py-3">
              {task.steps.map((st, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded bg-brandsoft text-[10.5px] font-semibold text-brand">
                      {i + 1}
                    </span>
                    <h4 className="text-[12.5px] font-semibold text-ink">{st.title}</h4>
                  </div>
                  {st.lead?.map((l, li) => (
                    <p key={li} className="mb-1 text-[12px] text-ink2">
                      {l}
                    </p>
                  ))}
                  {st.items.map((it, ii) => (
                    <div key={ii} className="mb-2">
                      <div className="group relative">
                        <pre className="overflow-x-auto rounded-md border border-line bg-codebg px-2.5 py-1.5 text-[12px] leading-[1.6]">
                          <code>{it.code}</code>
                        </pre>
                        <div className="absolute top-1 right-1 opacity-0 transition group-hover:opacity-100">
                          <CopyButton text={it.code} label="" small />
                        </div>
                      </div>
                      {it.notes.length > 0 && (
                        <ul className="mt-1 space-y-0.5 pl-1">
                          {it.notes.map((n, ni) => (
                            <li key={ni} className="text-[11.5px] leading-relaxed text-ink3">
                              · {n}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
