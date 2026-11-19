import { useEffect, useMemo, useState } from 'react'
import type { Question } from '../types'
import { Badge, Card, CopyButton } from './ui'
import { cn, isRight, questionToText } from '../lib/utils'

type Props = {
  q: Question
  picked?: string
  revealed?: boolean
  onAnswer: (picked: string) => void
  onNext?: () => void
  nextLabel?: string
  compact?: boolean
  label?: string
}

export default function QuestionCard({ q, picked, revealed, onAnswer, onNext, nextLabel = '下一题', compact, label }: Props) {
  const [sel, setSel] = useState<string[]>(picked ? picked.split('') : [])
  const answered = revealed ?? (picked !== undefined && picked !== '')

  useEffect(() => {
    setSel(picked ? picked.split('') : [])
  }, [q.id, picked])

  const isMulti = q.kind === 'multi'
  const correct = answered && picked ? isRight(q, picked) : false
  const keys = useMemo(() => q.options.map(o => o.k), [q.options])

  const choose = (k: string) => {
    if (answered) return
    if (isMulti) {
      const next = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k].sort()
      setSel(next)
    } else {
      setSel([k])
      onAnswer(k)
    }
  }

  const submitMulti = () => {
    if (!sel.length) return
    onAnswer(sel.sort().join(''))
  }

  // 键盘：1-5 选，回车提交/下一题
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      const n = Number(e.key)
      if (n >= 1 && n <= keys.length) {
        e.preventDefault()
        choose(keys[n - 1])
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (answered) onNext?.()
        else if (isMulti) submitMulti()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <Card className={cn('overflow-hidden', compact && 'rounded-lg')} data-qid={q.id}>
      <div className="flex items-center gap-2 border-b border-line bg-panel2 px-4 py-2.5">
        <Badge tone={q.kind === 'judge' ? 'accent' : q.kind === 'single' ? 'brand' : 'ok'}>{q.kindName}</Badge>
        <span className="tabular text-[12px] text-ink3">{label ?? `第 ${q.no} 题`}</span>
        <span className="text-[12px] text-ink3">·</span>
        <span className="text-[12px] text-ink2">{q.chapterName}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <CopyButton text={() => questionToText(q)} label="复制题目" small />
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-[15px] leading-[1.85] font-medium text-ink">{q.stem}</p>

        {q.options.length > 0 && (
          <div className="mt-3.5 space-y-1.5">
            {q.options.map(o => {
              const chosen = sel.includes(o.k)
              const isAns = q.answer.includes(o.k)
              const showRight = answered && isAns
              const showWrong = answered && chosen && !isAns
              return (
                <button
                  key={o.k}
                  onClick={() => choose(o.k)}
                  disabled={answered}
                  className={cn(
                    'focus-ring flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition',
                    !answered && 'border-line bg-panel hover:border-line2 hover:bg-panel2',
                    !answered && chosen && 'border-ink/40 bg-panel2',
                    showRight && 'border-ok/45 bg-oksoft',
                    showWrong && 'border-bad/45 bg-badsoft',
                    answered && !showRight && !showWrong && 'border-line/70 bg-panel opacity-70',
                  )}
                >
                  <span
                    className={cn(
                      'mt-[1px] grid h-[21px] w-[21px] shrink-0 place-items-center rounded border text-[11.5px] font-semibold',
                      showRight && 'border-ok/50 bg-ok text-white',
                      showWrong && 'border-bad/50 bg-bad text-white',
                      !showRight && !showWrong && chosen && 'border-ink/40 bg-ink text-paper',
                      !showRight && !showWrong && !chosen && 'border-line2 text-ink3',
                    )}
                  >
                    {o.k}
                  </span>
                  <span className="text-[13.5px] leading-[1.7] text-ink">{o.t}</span>
                </button>
              )
            })}
          </div>
        )}

        {q.kind === 'judge' && (
          <div className="mt-3.5 flex gap-2">
            {['√', '×'].map(k => {
              const chosen = picked === k
              const isAns = q.answer === k
              return (
                <button
                  key={k}
                  onClick={() => choose(k)}
                  disabled={answered}
                  className={cn(
                    'focus-ring h-10 w-[76px] rounded-lg border text-[17px] font-semibold transition',
                    !answered && 'border-line bg-panel hover:border-line2 hover:bg-panel2',
                    answered && isAns && 'border-ok/45 bg-oksoft text-ok',
                    answered && chosen && !isAns && 'border-bad/45 bg-badsoft text-bad',
                    answered && !isAns && !chosen && 'border-line/70 opacity-60',
                  )}
                >
                  {k}
                </button>
              )
            })}
          </div>
        )}

        {isMulti && !answered && (
          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={submitMulti}
              disabled={!sel.length}
              className="focus-ring rounded-lg bg-ink px-4 py-1.5 text-[12.5px] font-medium text-paper disabled:opacity-40"
            >
              提交（已选 {sel.length} 项）
            </button>
            <span className="text-[11.5px] text-ink3">多选题错选、漏选都不得分</span>
          </div>
        )}

        {answered && (
          <div className="enter mt-4 border-t border-line pt-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-md px-2 py-[3px] text-[12px] font-semibold',
                  correct ? 'bg-oksoft text-ok' : 'bg-badsoft text-bad',
                )}
              >
                {correct ? '答对了' : '答错了'}
              </span>
              <span className="text-[12.5px] text-ink2">
                正确答案 <span className="font-mono font-semibold text-ink">{q.answer}</span>
                {picked && !correct && (
                  <>
                    <span className="mx-1.5 text-ink3">·</span>
                    你选了 <span className="font-mono text-bad">{picked}</span>
                  </>
                )}
              </span>
              <div className="ml-auto flex gap-1.5">
                <CopyButton text={() => questionToText(q, true)} label="复制含答案" small />
                {onNext && (
                  <button
                    onClick={onNext}
                    className="focus-ring rounded-lg border border-line bg-panel px-2.5 py-1 text-[11.5px] font-medium text-ink2 hover:border-line2 hover:text-ink"
                  >
                    {nextLabel} ↵
                  </button>
                )}
              </div>
            </div>
            {q.explain && (
              <div className="mt-2.5 rounded-lg border border-line bg-panel2 px-3 py-2.5">
                <div className="mb-1 text-[11px] font-semibold tracking-wider text-ink3">解析</div>
                <p className="text-[13px] leading-[1.8] text-ink2">{q.explain}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
