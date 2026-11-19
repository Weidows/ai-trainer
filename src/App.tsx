import { useEffect, useState, type ReactElement } from 'react'
import { cn } from './lib/utils'
import { useMarks, useTheme } from './lib/store'
import Overview from './pages/Overview'
import Drill from './pages/Drill'
import Cheat from './pages/Cheat'
import Mock from './pages/Mock'
import theory from './data/theory.json'
import practical from './data/practical.json'
import type { Question, Task } from './types'

const THEORY = theory as Question[]
const TASKS = practical as Task[]

type Route = 'overview' | 'drill' | 'cheat' | 'mock'

const NAV: { key: Route; label: string; hint: string; icon: ReactElement }[] = [
  {
    key: 'overview',
    label: '概览',
    hint: '考什么、怎么考',
    icon: (
      <>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z" />
      </>
    ),
  },
  {
    key: 'drill',
    label: '刷题',
    hint: '900 理论 + 40 实操',
    icon: (
      <>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </>
    ),
  },
  {
    key: 'cheat',
    label: '速查',
    hint: '考点 / 易错 / 口诀',
    icon: (
      <>
        <path d="M4 19.5V6a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 1.5z" />
        <path d="M8 8h7M8 12h7" />
      </>
    ),
  },
  {
    key: 'mock',
    label: '模拟考',
    hint: '按真实卷面组卷',
    icon: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2M9 2h6" />
      </>
    ),
  },
]

function routeFromHash(): Route {
  const h = location.hash.replace(/^#\/?/, '')
  return (['overview', 'drill', 'cheat', 'mock'] as Route[]).includes(h as Route) ? (h as Route) : 'overview'
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const { theme, toggle } = useTheme()
  const { marks } = useMarks()

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  const go = (r: Route) => {
    location.hash = `#/${r}`
    setRoute(r)
  }

  const done = Object.keys(marks).length
  const right = Object.values(marks).filter(m => m.r === 'right').length

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
        {/* 侧边栏 */}
        <aside className="sticky top-0 z-30 shrink-0 border-b border-line bg-paper/95 backdrop-blur lg:h-screen lg:w-[236px] lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-3.5 lg:block lg:px-5 lg:py-6">
            <button onClick={() => go('overview')} className="focus-ring flex items-center gap-2.5 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-[13px] font-bold text-paper">
                AI
              </span>
              <span className="leading-tight">
                <span className="block text-[13.5px] font-semibold tracking-tight">人工智能训练师</span>
                <span className="block text-[11px] text-ink3">三级 · 备考工作台</span>
              </span>
            </button>
            <button
              onClick={toggle}
              className="focus-ring rounded-lg border border-line p-1.5 text-ink2 hover:text-ink lg:hidden"
              aria-label="切换主题"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>

          <nav className="hidden gap-1 px-3 pb-0 lg:flex lg:flex-col">
            {NAV.map(n => {
              const active = route === n.key
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className={cn(
                    'focus-ring group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition',
                    active ? 'bg-panel text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)]' : 'text-ink2 hover:bg-panel/70 hover:text-ink',
                  )}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={active ? 'text-accent' : 'text-ink3 group-hover:text-ink2'}
                  >
                    {n.icon}
                  </svg>
                  <span className="text-[13.5px] font-medium">{n.label}</span>
                  <span className="ml-auto hidden text-[10.5px] text-ink3 lg:block">{n.hint}</span>
                </button>
              )
            })}
          </nav>

          <div className="hidden px-4 py-6 lg:block">
            <div className="rounded-lg border border-line bg-panel2 p-3">
              <div className="flex items-baseline justify-between text-[11.5px] text-ink3">
                <span>理论进度</span>
                <span className="tabular text-ink2">
                  {done} / {THEORY.length}
                </span>
              </div>
              <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-brand/70"
                  style={{ width: `${Math.min(100, (done / THEORY.length) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-ink3">
                <span>答对 {right}</span>
                <span>正确率 {done ? Math.round((right / done) * 100) : 0}%</span>
              </div>
            </div>
            <button
              onClick={toggle}
              className="focus-ring mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-[11.5px] text-ink3 hover:text-ink"
            >
              <span>{theme === 'dark' ? '深色模式' : '浅色模式'}</span>
              <span className="rounded border border-line px-1.5 py-0.5 text-[10.5px]">{theme === 'dark' ? '☾' : '☀'}</span>
            </button>
            <div className="mt-4 text-[10.5px] leading-relaxed text-ink3">
              题库 {THEORY.length} 题 · 实操 {TASKS.length} 题
              <br />
              资料：上海交大 gjzs.sjtu.edu.cn
            </div>
          </div>
        </aside>

        {/* 主内容 */}
        <main className="min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 lg:px-10 lg:py-9 lg:pb-9">
          {route === 'overview' && <Overview onGo={go} />}
          {route === 'drill' && <Drill />}
          {route === 'cheat' && <Cheat />}
          {route === 'mock' && <Mock />}
          <footer className="mt-14 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink3">
            题目与素材来自上海交通大学终身教育学院《人工智能训练师（三级）》指导手册、
            <a className="underline decoration-line2 underline-offset-2 hover:text-ink" href="https://gjzs.sjtu.edu.cn/skill" target="_blank" rel="noreferrer">
              gjzs.sjtu.edu.cn
            </a>
            ，解析与图文教程整理自
            <a className="underline decoration-line2 underline-offset-2 hover:text-ink" href="https://ai-trainer.nccloudservice.com/" target="_blank" rel="noreferrer">
              ai-trainer.nccloudservice.com
            </a>
            。仅供个人备考。
          </footer>
        </main>
      </div>

      {/* 移动端底部导航 */}
      <nav
        aria-label="主导航"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-[520px] grid-cols-4">
          {NAV.map(n => {
            const active = route === n.key
            return (
              <button
                key={n.key}
                onClick={() => go(n.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 transition active:scale-95',
                  active ? 'text-accent' : 'text-ink3',
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {n.icon}
                </svg>
                <span className="text-[10.5px] font-medium">{n.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
