import { useCallback, useEffect, useState } from 'react'
import type { Task } from '../types'

const PREFIX = 'aitrainer.v1.'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* 配额满了就算了 */
  }
}

export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial))
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue(prev => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        write(key, v)
        return v
      })
    },
    [key],
  )
  return [value, set] as const
}

/* ---------- 做题记录 ---------- */
export type Mark = { r: 'right' | 'wrong'; t: number; picked: string }
export type Marks = Record<string, Mark>

export function useMarks() {
  const [marks, setMarks] = useStored<Marks>('marks', {})
  const record = useCallback(
    (id: string, right: boolean, picked: string) =>
      setMarks(prev => ({ ...prev, [id]: { r: right ? 'right' : 'wrong', t: Date.now(), picked } })),
    [setMarks],
  )
  const reset = useCallback(() => setMarks({}), [setMarks])
  return { marks, record, reset }
}

/* ---------- 实操填空作答 ---------- */
export type TaskAnswer = { blanks: string[]; checked?: boolean }
export type TaskAnswers = Record<string, TaskAnswer>

export function useTaskAnswers() {
  const [answers, setAnswers] = useStored<TaskAnswers>('taskAnswers', {})
  const setBlank = useCallback(
    (taskId: string, idx: number, text: string) =>
      setAnswers(prev => {
        const cur = prev[taskId] ?? { blanks: [] }
        const blanks = [...cur.blanks]
        blanks[idx] = text
        return { ...prev, [taskId]: { ...cur, blanks, checked: false } }
      }),
    [setAnswers],
  )
  const markChecked = useCallback(
    (taskId: string, checked: boolean) =>
      setAnswers(prev => {
        const cur = prev[taskId] ?? { blanks: [] }
        return { ...prev, [taskId]: { ...cur, checked } }
      }),
    [setAnswers],
  )
  const clear = useCallback(
    (taskId: string) => setAnswers(prev => ({ ...prev, [taskId]: { blanks: [] } })),
    [setAnswers],
  )
  return { answers, setBlank, markChecked, clear }
}

/* ---------- 主题 ---------- */
export function useTheme() {
  const [theme, setTheme] = useStored<'light' | 'dark'>('theme', 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return { theme, setTheme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }
}

/* ---------- 模拟考成绩 ---------- */
export type MockResult = {
  id: string
  at: number
  kind: 'theory' | 'practical'
  score: number
  total: number
  seconds: number
  detail: Record<string, { right: number; total: number }>
  wrongIds: string[]
  title: string
}

export function useMockHistory() {
  const [history, setHistory] = useStored<MockResult[]>('mockHistory', [])
  const push = useCallback(
    (r: MockResult) => setHistory(prev => [r, ...prev].slice(0, 40)),
    [setHistory],
  )
  const clear = useCallback(() => setHistory([]), [setHistory])
  return { history, push, clear }
}

/* ---------- 工具：从 Task 生成初始空答案 ---------- */
export function blankCount(task: Task) {
  return task.blanks.length
}
