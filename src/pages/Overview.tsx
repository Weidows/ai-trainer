import { useMemo } from 'react'
import theory from '../data/theory.json'
import practical from '../data/practical.json'
import outline from '../data/outline.json'
import type { Outline, Question, Task } from '../types'
import { Badge, Bar, Card, SectionTitle, Stat } from '../components/ui'
import UnitOutline from '../components/UnitOutline'
import { cn } from '../lib/utils'

const THEORY = theory as Question[]
const TASKS = practical as Task[]
const OUTLINE = outline as Outline

const CHAPTER_ORDER = [
  'career',
  'general',
  'law',
  'biz-flow',
  'biz-module',
  'data-spec',
  'algo-test',
  'sys-monitor',
  'hci',
  'training',
]

const THEORY_BLUEPRINT = [
  { kind: '判断题', count: 40, each: 0.5, score: 20, note: '打对错，40 题里绝大多数是概念判断' },
  { kind: '单选题', count: 140, each: 0.5, score: 70, note: '四选一，占分最大的一块，也是主战场' },
  { kind: '多选题', count: 10, each: 1, score: 10, note: '五选多，错选/漏选都不得分' },
]

const SKILL_ROWS = [
  { part: '业务分析', unit: '业务流程设计', code: '1.1', pick: '抽一', min: 30, score: 25, pool: 5, code_task: true },
  { part: '业务分析', unit: '业务模块效果优化', code: '1.2', pick: '抽一', min: 30, score: 25, pool: 5, code_task: false },
  { part: '智能训练', unit: '数据处理规范制定', code: '2.1', pick: '必考', min: 20, score: 15, pool: 5, code_task: true },
  { part: '智能训练', unit: '算法测试', code: '2.2', pick: '必考', min: 20, score: 20, pool: 5, code_task: true },
  { part: '智能系统设计', unit: '智能系统监控和优化', code: '3.1', pick: '必考', min: 20, score: 15, pool: 5, code_task: false },
  { part: '智能系统设计', unit: '人机交互流程设计', code: '3.2', pick: '必考', min: 20, score: 20, pool: 5, code_task: true },
  { part: '培训与指导', unit: '培训', code: '4.1', pick: '抽一', min: 10, score: 5, pool: 5, code_task: false },
  { part: '培训与指导', unit: '指导', code: '4.2', pick: '抽一', min: 10, score: 5, pool: 5, code_task: false },
]

const ROADMAP = [
  {
    week: '第 1 周',
    title: '摸清卷面 + 理论第一遍',
    items: [
      '通读本页「理论卷面」「实操卷面」，把 10 个单元的权重看明白',
      '刷判断题 300 道（一题约 15 秒，两天能过完）',
      '实操先啃 1.1.1–1.1.5（数据分析 5 题），重点是 pd.cut / groupby / value_counts',
    ],
  },
  {
    week: '第 2 周',
    title: '单选题 300 道 + 清洗建模',
    items: [
      '单选题按章节刷，错题立刻看解析并记下考点关键词',
      '实操 2.1.x（数据清洗 5 题）+ 2.2.x（建模 5 题），把 sklearn 的 fit/predict/评估走顺',
      '开始用「速查」里的代码速记表默写 API',
    ],
  },
  {
    week: '第 3 周',
    title: '多选题 + 部署类实操',
    items: [
      '多选题全刷（只有 300 道，考场只考 10 道，但每道 1 分）',
      '实操 3.2.x（onnx 推理 5 题）+ 3.1.x（Excel 类 5 题）+ 4.x（培训/指导 10 题）',
      '做 2 次理论模拟考，看章节正确率决定补哪块',
    ],
  },
  {
    week: '第 4 周',
    title: '全真模拟 + 交付细节',
    items: [
      '每天 1 套理论模拟（190 题 / 90 分钟），把速度压到 80 分钟以内',
      '实操按考场流程走一遍：填空 → 运行 → 截图 → 命名 → 导出 HTML',
      '把「速查 → 高频易错点」过两遍，尤其是文件名、文件夹名、上传要求',
    ],
  },
]

export default function Overview({ onGo }: { onGo: (r: 'drill' | 'cheat' | 'mock') => void }) {

  const byChapter = useMemo(() => {
    const map = new Map<string, { key: string; name: string; part: string; total: number; judge: number; single: number; multi: number }>()
    for (const q of THEORY) {
      const cur = map.get(q.chapter) ?? { key: q.chapter, name: q.chapterName, part: q.part, total: 0, judge: 0, single: 0, multi: 0 }
      cur.total++
      if (q.kind === 'judge') cur.judge++
      if (q.kind === 'single') cur.single++
      if (q.kind === 'multi') cur.multi++
      map.set(q.chapter, cur)
    }
    return CHAPTER_ORDER.map(k => map.get(k)!).filter(Boolean)
  }, [])

  const byUnit = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of TASKS) m.set(t.subName, (m.get(t.subName) ?? 0) + 1)
    return m
  }, [])

  const codeTasks = TASKS.filter(t => t.hasCode).length

  return (
    <div className="enter space-y-12">
      {/* HERO */}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">上海交通大学 · 社会化职业技能等级认定</Badge>
          <Badge tone="neutral">职业代码 4-04-05-05</Badge>
          <Badge tone="accent">三级 / 高级工</Badge>
        </div>
        <h1 className="mt-4 max-w-[24ch] text-[30px] leading-[1.25] font-semibold tracking-tight sm:text-[36px]">
          人工智能训练师（三级）
          <span className="block text-ink3">考什么、怎么考、先背哪一段</span>
        </h1>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.8] text-ink2">
          两场考试：理论知识 190 题 90 分钟，操作技能 6 题 120 分钟，各 100 分、60 分合格。
          理论的判断题和单选题占了 90 分，实操则几乎全是 pandas / sklearn / onnxruntime 的代码填空。
          这份工作台把官方指导手册、40 道实操题和 900 道复习题整理成可以直接练的四个页面。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => onGo('mock')}
            className="focus-ring rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:opacity-90 active:translate-y-px"
          >
            直接做一套模拟卷
          </button>
          <button
            onClick={() => onGo('drill')}
            className="focus-ring rounded-lg border border-line bg-panel px-4 py-2 text-[13px] font-medium text-ink transition hover:border-line2 active:translate-y-px"
          >
            从判断题开始刷
          </button>
          <button
            onClick={() => onGo('cheat')}
            className="focus-ring rounded-lg border border-line bg-panel px-4 py-2 text-[13px] font-medium text-ink transition hover:border-line2 active:translate-y-px"
          >
            先看速查表
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="理论卷面" value="190" unit="题 / 90 分钟" hint="判断 40 · 单选 140 · 多选 10" />
          <Stat label="实操卷面" value="6" unit="题 / 120 分钟" hint="必考 4 项 + 抽考 2 项" />
          <Stat label="合格线" value="60" unit="分 / 100" hint="两场分别算，不及格可按规定补考" />
          <Stat label="本地题库" value={THEORY.length} unit="理论题" hint={`另含 ${TASKS.length} 道实操题、${codeTasks} 道代码题`} tone="accent" />
        </div>
      </header>

      {/* 两条通道 */}
      <section>
        <SectionTitle
          eyebrow="先选通道"
          title="认定和竞赛是两套算法，别把权重记混"
          desc="同一个细目表、同一套题库，但成绩怎么算不一样。多数人走的是「社会化等级认定」。"
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">社会化职业技能等级认定</h3>
              <Badge tone="ok">常见</Badge>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink2">
              理论 100 分 + 实操 100 分，<strong className="font-semibold text-ink">两场都要 60 分</strong>才算合格。
              理论或实操单科不及格，可以按规定分别补考。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg bg-panel2 px-3 py-2">
                <div className="text-ink3">理论</div>
                <div className="tabular mt-0.5 text-[15px] font-semibold">100 分 / 90 min</div>
              </div>
              <div className="rounded-lg bg-panel2 px-3 py-2">
                <div className="text-ink3">实操</div>
                <div className="tabular mt-0.5 text-[15px] font-semibold">100 分 / 120 min</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">竞赛（J1.1 方案，2025-09 版）</h3>
              <Badge tone="accent">不设补考</Badge>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink2">
              理论占 30%、实操占 70% 合成总分，<strong className="font-semibold text-ink">60 分合格，没有补考</strong>。
              卷面结构和认定一致，等于把实操的分量又放大了一倍。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg bg-panel2 px-3 py-2">
                <div className="text-ink3">理论权重</div>
                <div className="tabular mt-0.5 text-[15px] font-semibold">30%</div>
              </div>
              <div className="rounded-lg bg-panel2 px-3 py-2">
                <div className="text-ink3">实操权重</div>
                <div className="tabular mt-0.5 text-[15px] font-semibold">70%</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 理论卷面 */}
      <section>
        <SectionTitle
          eyebrow="理论知识"
          title="190 道题、90 分钟、每题不到 30 秒"
          desc="三种题型，判断和单选都是 0.5 分一题，所以「快」比「想透」值钱；多选只有 10 题但要留时间。"
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-panel2 text-left text-[11.5px] text-ink3">
                  <th className="px-4 py-2.5 font-medium">题型</th>
                  <th className="px-2 py-2.5 font-medium">题量</th>
                  <th className="px-2 py-2.5 font-medium">每题</th>
                  <th className="px-2 py-2.5 font-medium">配分</th>
                  <th className="px-4 py-2.5 font-medium">特点</th>
                </tr>
              </thead>
              <tbody>
                {THEORY_BLUEPRINT.map(r => (
                  <tr key={r.kind} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 font-medium">{r.kind}</td>
                    <td className="tabular px-2 py-3">{r.count}</td>
                    <td className="tabular px-2 py-3 text-ink2">{r.each}</td>
                    <td className="tabular px-2 py-3 font-semibold">{r.score}</td>
                    <td className="px-4 py-3 text-[12px] text-ink3">{r.note}</td>
                  </tr>
                ))}
                <tr className="bg-panel2">
                  <td className="px-4 py-3 font-semibold">合计</td>
                  <td className="tabular px-2 py-3 font-semibold">190</td>
                  <td className="px-2 py-3 text-ink3">—</td>
                  <td className="tabular px-2 py-3 font-semibold">100</td>
                  <td className="px-4 py-3 text-[12px] text-ink3">闭卷机考，60 分合格</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold">按题型分配的分值</h3>
            <div className="mt-4 space-y-3.5">
              {THEORY_BLUEPRINT.map(r => (
                <div key={r.kind}>
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span className="text-ink2">{r.kind}</span>
                    <span className="tabular text-ink">{r.score} 分</span>
                  </div>
                  <Bar value={r.score} max={100} tone={r.kind === '单选题' ? 'brand' : r.kind === '判断题' ? 'accent' : 'ok'} />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-line bg-panel2 p-3 text-[12px] leading-relaxed text-ink2">
              <span className="font-semibold text-ink">一句话：</span>
              判断+单选 180 题只值 90 分，但决定你过不过；多选 10 题 10 分，是唯一“错一个就没分”的地方。
            </div>
          </Card>
        </div>

      </section>

      {/* 实操卷面 */}
      <section>
        <SectionTitle
          eyebrow="操作技能"
          title="6 道题，4 道必须做的代码题"
          desc="8 个单元各备 5 题，考 6 题：判断题型的单元里「业务分析」「培训与指导」各抽一题，其余四项必考。"
        />
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-[13px]">
            <thead>
              <tr className="border-b border-line bg-panel2 text-left text-[11.5px] text-ink3">
                <th className="px-4 py-2.5 font-medium">项目</th>
                <th className="px-2 py-2.5 font-medium">单元内容</th>
                <th className="px-2 py-2.5 font-medium">抽考</th>
                <th className="px-2 py-2.5 font-medium">时长</th>
                <th className="px-2 py-2.5 font-medium">配分</th>
                <th className="px-2 py-2.5 font-medium">题型</th>
              </tr>
            </thead>
            <tbody>
              {SKILL_ROWS.map((r, i) => (
                <tr key={r.code} className={cn('border-b border-line/70 last:border-0', i === 0 && 'border-t-0')}>
                  <td className="px-4 py-2.5 text-[12px] text-ink3">{r.part}</td>
                  <td className="px-2 py-2.5 font-medium">
                    {r.unit}
                    <span className="ml-2 font-mono text-[11px] text-ink3">{r.code}</span>
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge tone={r.pick === '必考' ? 'brand' : 'accent'}>{r.pick}</Badge>
                  </td>
                  <td className="tabular px-2 py-2.5 text-ink2">{r.min} min</td>
                  <td className="tabular px-2 py-2.5 font-semibold">{r.score}</td>
                  <td className="px-2 py-2.5 text-[12px] text-ink3">
                    {r.code_task ? 'Python 代码填空' : r.code === '3.1' ? 'Excel 操作' : '文字/方案类'}
                  </td>
                </tr>
              ))}
              <tr className="bg-panel2">
                <td className="px-4 py-2.5 font-semibold" colSpan={3}>
                  合计（2 项抽考只考 1 题）
                </td>
                <td className="tabular px-2 py-2.5 font-semibold">120 min</td>
                <td className="tabular px-2 py-2.5 font-semibold">100</td>
                <td className="px-2 py-2.5 text-[12px] text-ink3">题库 40 题</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <h4 className="text-[12.5px] font-semibold">题目从哪来</h4>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink2">
              8 个单元 × 5 道题 = 40 道题的题库，本页「刷题 → 实操」里全都收了。
              考场上按上面的规则抽 6 道，所以你至少要保证 4 道必考题型的题做熟。
            </p>
          </Card>
          <Card className="p-4">
            <h4 className="text-[12.5px] font-semibold">交什么</h4>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink2">
              填空后的 notebook 导成 HTML、按题目要求截的输出图（jpg）、以及文字方案文档。
              文件名和「准考证号 + 身份证后六位」的考生文件夹几乎是零容忍项。
            </p>
          </Card>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
          {[...byUnit.entries()].map(([unit, n]) => (
            <span key={unit} className="rounded-md border border-line bg-panel px-2.5 py-1 text-ink2">
              {unit} <span className="tabular text-ink3">× {n}</span>
            </span>
          ))}
        </div>
      </section>

      {/* 考纲 × 题量 */}
      <section>
        <SectionTitle
          eyebrow="考纲 × 题量"
          title="10 个理论单元，308 个细目点"
          desc="每行是这个单元在 900 道复习题里占的分量，点开就是官方《认定要素细目表》里它下面的知识点。考场按细目点随机抽 190 题，所以题量占比≈分值占比。"
          right={
            <span className="text-[11.5px] text-ink3">
              细目点共 {OUTLINE.theory.reduce((a, u) => a + u.pointCount, 0)} 个
            </span>
          }
        />
        <UnitOutline chapters={byChapter} outline={OUTLINE} />
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink3">
          智能系统监控和优化、算法测试、数据处理规范制定三个单元就占了 432 题（48%）。这三块是「术语 + 流程」，
          不理解光背答案会很痛苦，但恰好也是重复率最高的部分；反过来，职业道德 + 通用办公 + 法律法规 135 题基本是常识，别在这上面耗时间。
        </p>
      </section>

      {/* 难度 */}
      <section>
        <SectionTitle eyebrow="难度" title="理论不难但很赶，实操是真门槛" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold">理论：中等偏易</h3>
              <Badge tone="ok">60 分可得</Badge>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-ink2">
              <li>· 没有计算题，没有主观题，全是记忆和理解</li>
              <li>· 职业道德 + 通用办公 + 法律法规 135 题，基本是常识</li>
              <li>· 真正的难点是 432 题的「术语密度」，以及平均 28 秒/题的速度</li>
            </ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold">实操：需要手速</h3>
              <Badge tone="bad">主要卡人</Badge>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-ink2">
              <li>· 4 道代码题要现场补全 pandas / sklearn / onnxruntime</li>
              <li>· 评分细则拆到 1 分一个小项（一道题 8–18 项），漏一步就扣</li>
              <li>· 还要截图、改名、导 HTML，这些「非技术动作」占比不小</li>
            </ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold">结论</h3>
              <Badge tone="brand">2–3 周够用</Badge>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-ink2">
              <li>· 理论刷两遍题库、模拟考能稳定 80 分就够</li>
              <li>· 实操必须把 20 道代码题的骨架亲手敲一遍，看着答案敲不算</li>
              <li>· 有 Python 基础的人，卡点通常在 pd.cut / groupby 的比例口径</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* 路线 */}
      <section>
        <SectionTitle eyebrow="备考路线" title="四周，按天排得下" desc="按每天 1.5–2 小时估的；如果你有 Python 底子，第三、四周可以合并。" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map(w => (
            <Card key={w.week} className="p-4">
              <div className="text-[11px] font-semibold tracking-wider text-accent">{w.week}</div>
              <h3 className="mt-1 text-[13.5px] font-semibold">{w.title}</h3>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink2">
                {w.items.map(i => (
                  <li key={i} className="flex gap-1.5">
                    <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-ink3" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* 覆盖说明 */}
      <section>
        <SectionTitle eyebrow="诚实说明" title="这个题库能覆盖什么、不能覆盖什么" />
        <Card className="p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h4 className="text-[12.5px] font-semibold">能覆盖</h4>
              <ul className="mt-1.5 space-y-1.5 text-[12.5px] leading-relaxed text-ink2">
                <li>· 900 道复习题就是官方指导手册里的那 900 道，按细目点均匀分布（每个点约 3 题），考场从同一套题库里抽 190 题</li>
                <li>· 40 道实操题是官方题库的全部题量，考场不出这 40 道之外的题</li>
                <li>· 每道实操题的评分细则（M1…Mn 配分）都来自官方</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12.5px] font-semibold">不能覆盖</h4>
              <ul className="mt-1.5 space-y-1.5 text-[12.5px] leading-relaxed text-ink2">
                <li>· 考场是随机组卷，原题命中率不可预期——记的是考点，不是答案</li>
                <li>· 实操的真实评分由考评员按截图和运行结果打，本页的填空判分只看代码写法</li>
                <li>· 虚拟机环境、Jupyter 目录（D:\jupyter_notebook）等细节以官方通知为准</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
