import { useMemo, useState } from 'react'
import cheat from '../data/cheatsheet.json'
import type { Cheat } from '../types'
import { Badge, Bar, Card, CopyButton, Empty, SectionTitle } from '../components/ui'
import { cn, pct } from '../lib/utils'

const C = cheat as Cheat

export default function CheatPage() {
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<'all' | '致命' | '高' | '中'>('all')

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return C.memo
    return C.memo
      .map(g => ({
        ...g,
        rows: g.rows.filter(
          r =>
            r.point.toLowerCase().includes(kw) ||
            r.code.toLowerCase().includes(kw) ||
            r.meaning.toLowerCase().includes(kw) ||
            r.mnemonic.toLowerCase().includes(kw),
        ),
      }))
      .filter(g => g.rows.length)
  }, [q])

  const pitfalls = C.pitfalls.filter(p => level === 'all' || p.level === level)
  const st = C.stats
  const judgeTotal = st.judgeAnswer['√'] + st.judgeAnswer['×']
  const multiTotal = Object.values(st.multiAnswerLen).reduce((a, b) => a + b, 0)
  const singleTotal = Object.values(st.singleAnswer).reduce((a, b) => a + b, 0)

  return (
    <div className="enter space-y-10">
      <h1 className="sr-only">速查</h1>

      {/* 高频易错 */}
      <section>
        <SectionTitle
          eyebrow="最容易丢分的地方"
          title="高频易错点"
          desc="实操的扣分点极其细碎，一道题拆成 8–18 个评分项，最小 1 分。下面这些是最常出错的。"
          right={
            <div className="flex gap-1">
              {(['all', '致命', '高', '中'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    'min-h-[34px] rounded-md border px-2.5 py-1.5 text-[11.5px] transition sm:min-h-0 sm:py-1',
                    level === l ? 'border-ink/30 bg-panel2 font-medium text-ink' : 'border-line text-ink3 hover:text-ink2',
                  )}
                >
                  {l === 'all' ? '全部' : l}
                </button>
              ))}
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {pitfalls.map(p => (
            <Card key={p.title} className="min-w-0 p-3.5">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-[3px] shrink-0 rounded px-1.5 py-[1px] text-[10.5px] font-semibold',
                    p.level === '致命'
                      ? 'bg-badsoft text-bad'
                      : p.level === '高'
                        ? 'bg-accentsoft text-accent'
                        : 'bg-panel2 text-ink2',
                  )}
                >
                  {p.level}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] leading-snug font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1 text-[12px] leading-[1.8] text-ink2">{p.body}</p>
                  {p.code && (
                    <div className="group relative mt-1.5">
                      <pre className="overflow-x-auto rounded-md border border-line bg-codebg px-2 py-1.5 text-[11.5px] leading-[1.6]">
                        <code>{p.code}</code>
                      </pre>
                      <div className="absolute top-1 right-1 opacity-0 transition group-hover:opacity-100">
                        <CopyButton text={p.code} label="" small />
                      </div>
                    </div>
                  )}
                  <div className="mt-1.5">
                    <Badge tone="neutral">{p.tag}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 应试统计 */}
      <section>
        <SectionTitle
          eyebrow="数据"
          title="本地 900 道题库的答案分布"
          desc="这不是考场统计，是这套复习题的分布。用来校准「完全不会时怎么猜」，别用来代替判断。"
        />
        <div className="grid gap-2.5 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="text-[12.5px] font-semibold">判断题 {judgeTotal} 道</h3>
            <div className="mt-3 space-y-2">
              {(['√', '×'] as const).map(k => {
                const v = st.judgeAnswer[k] ?? 0
                return (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-[11.5px]">
                      <span className="font-mono text-ink2">{k}</span>
                      <span className="tabular text-ink3">
                        {v} · {pct(v, judgeTotal)}%
                      </span>
                    </div>
                    <Bar value={v} max={judgeTotal} tone={k === '√' ? 'ok' : 'bad'} />
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
              含「只有/一定/所有/唯一」等绝对化措辞的判断共 {st.judgeAbsolute.total} 道，
              其中答案为 × 的 {st.judgeAbsolute.wrong} 道（{st.judgeAbsolute.rate}%）——所以别把「绝对化就是错」当铁律。
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-[12.5px] font-semibold">多选题 {multiTotal} 道</h3>
            <div className="mt-3 space-y-2">
              {['2', '3', '4', '5'].map(k => {
                const v = st.multiAnswerLen[k] ?? 0
                return (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-[11.5px]">
                      <span className="text-ink2">正解 {k} 项</span>
                      <span className="tabular text-ink3">
                        {v} · {pct(v, multiTotal)}%
                      </span>
                    </div>
                    <Bar value={v} max={multiTotal} tone="accent" />
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
              近 6 成题目正解是 3–4 项；只选 2 项的不到 1/10。拿不准时凑到 3 项以上更划算（错选仍不得分）。
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-[12.5px] font-semibold">单选题 {singleTotal} 道</h3>
            <div className="mt-3 space-y-2">
              {['A', 'B', 'C', 'D'].map(k => {
                const v = st.singleAnswer[k] ?? 0
                return (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-[11.5px]">
                      <span className="font-mono text-ink2">{k}</span>
                      <span className="tabular text-ink3">
                        {v} · {pct(v, singleTotal)}%
                      </span>
                    </div>
                    <Bar value={v} max={singleTotal} tone="brand" />
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
              四个选项分布不算均匀（A 最多、D 最少），但别据此硬猜——按题意排除通常更准。
            </p>
          </Card>
        </div>
      </section>

      {/* 代码速记 */}
      <section>
        <SectionTitle
          eyebrow="代码"
          title="实操代码速记表"
          desc="按四个代码类单元分组：技术点 → 关键代码 → 记忆口诀。点代码块右上角可以直接复制。"
          right={
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索：groupby / 缺失值 / dropna…"
              className="focus-ring w-[220px] rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink placeholder:text-ink3"
            />
          }
        />
        <div className="space-y-4">
          {rows.length === 0 && <Empty>没找到匹配的条目。</Empty>}
          {rows.map(g => (
            <Card key={g.name} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line bg-panel2 px-4 py-2.5">
                <h3 className="text-[12.5px] font-semibold">{g.name}</h3>
                <span className="tabular text-[11px] text-ink3">{g.rows.length} 条</span>
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[620px] text-[12px]">
                  <thead>
                    <tr className="border-b border-line/70 text-left text-[10.5px] tracking-wide text-ink3">
                      <th className="w-[92px] px-3 py-1.5 font-medium">技术点</th>
                      <th className="px-2 py-1.5 font-medium">关键代码</th>
                      <th className="w-[210px] px-2 py-1.5 font-medium">含义</th>
                      <th className="w-[150px] px-2 py-1.5 font-medium">记忆口诀</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr key={i} className="border-b border-line/50 last:border-0 hover:bg-panel2/60">
                        <td className="px-3 py-2 align-top font-medium text-ink">{r.point}</td>
                        <td className="px-2 py-2 align-top">
                          <div className="group flex items-start gap-1">
                            <code className="rounded bg-codebg px-1.5 py-0.5 font-mono text-[11.5px] break-all text-ink">
                              {r.code}
                            </code>
                            <span className="opacity-0 transition group-hover:opacity-100">
                              <CopyButton text={r.code} label="" small />
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top leading-relaxed text-ink2">{r.meaning}</td>
                        <td className="px-2 py-2 align-top text-[11.5px] text-ink3">{r.mnemonic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端：一行一条的卡片式速记 */}
              <div className="divide-y divide-line/60 sm:hidden">
                {g.rows.map((r, i) => (
                  <div key={i} className="px-3 py-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12.5px] font-medium text-ink">{r.point}</span>
                      <span className="ml-auto shrink-0 text-right text-[10.5px] text-ink3">{r.mnemonic}</span>
                    </div>
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <code className="min-w-0 flex-1 rounded bg-codebg px-1.5 py-1 font-mono text-[11.5px] leading-[1.6] break-all text-ink">
                        {r.code}
                      </code>
                      <CopyButton text={r.code} label="" small />
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink3">{r.meaning}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 交付清单 */}
      <section>
        <SectionTitle eyebrow="考场" title="实操交付清单" desc="做完题别急着交，按这个顺序对一遍。" />
        <Card className="p-4">
          <ol className="grid gap-2 sm:grid-cols-2">
            {[
              '在桌面建考生文件夹：准考证号 + 身份证后六位',
              '每个 notebook 只在横线上填空，不改动其他代码',
              '跑通每个 cell，确认没有红色报错',
              '截图只截输出结果部分，用 Windows 附件 → 截图工具',
              '截图存成 jpg，文件名严格按题干（如 1.1.1-1.jpg）',
              'notebook 导出 HTML：File → Download as → HTML(.html)',
              '按「答案上传」表逐个上传，确认每一项都有文件',
              '文字题（3.1.x / 4.x）按评分细则的分点写，宁可多写一条',
            ].map((t, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-panel2 text-[10.5px] font-semibold text-ink3">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  )
}
