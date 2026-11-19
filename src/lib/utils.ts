import type { Question, Task } from '../types'

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

/** 代码填空判分：忽略空白、引号样式、行尾注释 */
export function normalizeCode(s: string) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, '')
    .replace(/,(?=\))/g, '') // f(a,) -> f(a)
    .replace(/['"]/g, '"')
    .toLowerCase()
}

export function blankRight(input: string, answer: string) {
  if (!input.trim()) return false
  const a = normalizeCode(input)
  const b = normalizeCode(answer)
  if (a === b) return true
  // 答案里带换行的多行填空，允许只写第一行等价的写法
  return b.includes(a) && a.length >= Math.min(6, b.length * 0.5)
}

export function multiRight(picked: string, answer: string) {
  const p = picked.split('').sort().join('')
  const a = answer.split('').sort().join('')
  return p === a
}

export function isRight(q: Question, picked: string) {
  if (q.kind === 'multi') return multiRight(picked, q.answer)
  return picked === q.answer
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

/** 复制成「题目 + 选项」的纯文本，方便丢给别的 AI */
export function questionToText(q: Question, withAnswer = false) {
  const lines: string[] = []
  lines.push(`【${q.kindName} · 第 ${q.no} 题 · ${q.chapterName}】`)
  lines.push(q.stem)
  if (q.options.length) {
    lines.push('')
    for (const o of q.options) lines.push(`${o.k}．${o.t}`)
  }
  if (withAnswer) {
    lines.push('')
    lines.push(`答案：${q.answer}`)
    if (q.explain) lines.push(`解析：${q.explain}`)
  } else {
    lines.push('')
    lines.push('请给出正确答案，并逐项说明为什么对、为什么错。')
  }
  return lines.join('\n')
}

export function taskToText(task: Task) {
  const lines = [`【实操 ${task.id} · ${task.title}】`, `考核时间 ${task.duration} · 满分 ${task.fullScore} 分`]
  for (const s of task.sections) {
    lines.push('', `## ${s.title}`)
    for (const b of s.blocks) {
      if (b.k === 'code') lines.push('```', b.t as string, '```')
      else if (b.k === 'table') {
        for (const row of b.t as string[][]) lines.push('| ' + row.join(' | ') + ' |')
      } else lines.push(b.t as string)
    }
  }
  if (task.rubric.length) {
    lines.push('', '## 评分细则')
    for (const r of task.rubric) lines.push(`${r.id} ${r.score} 分：${r.desc}`)
  }
  if (task.skeleton.length) {
    lines.push('', '## 代码骨架（下划线处需补全）')
    for (const c of task.skeleton) lines.push('```python', c, '```')
  }
  lines.push('', '请逐空给出应填写的代码，并解释每一步的作用。')
  return lines.join('\n')
}

export function fmtClock(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function pct(a: number, b: number) {
  if (!b) return 0
  return Math.round((a / b) * 100)
}

/** 把填空填好的骨架导出成可运行的 ipynb */
export function buildIpynb(task: Task, filled: string[]) {
  const cells = task.skeleton.map((src, ci) => {
    const lines = src.split('\n').map((line, li) => {
      let cur = 0
      return line.replace(/_{3,}/g, () => {
        const idx = task.blanks.findIndex(
          (b, i) => b.cell === ci && b.line === li && i >= cur,
        )
        const useIdx = idx >= 0 ? idx : cur
        cur = useIdx + 1
        const v = filled[useIdx]
        return v && v.trim() ? v.trim() : '# TODO'
      })
    })
    const out = lines.join('\n')
    return {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: out.split('\n').map((l, i, arr) => (i < arr.length - 1 ? l + '\n' : l)),
    }
  })
  return JSON.stringify(
    {
      cells,
      metadata: {
        kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
        language_info: { name: 'python', version: '3.11' },
      },
      nbformat: 4,
      nbformat_minor: 5,
    },
    null,
    1,
  )
}

export function downloadFile(name: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 可复现的洗牌：同一个 seed 得到同一个顺序，翻页/重渲染不会跳题 */
export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = arr.slice()
  let s = (seed >>> 0) || 1
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
