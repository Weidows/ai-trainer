export type Kind = 'judge' | 'single' | 'multi'

export type Option = { k: string; t: string }

export type Question = {
  id: string
  kind: Kind
  kindName: string
  no: number
  chapter: string
  chapterName: string
  part: string
  stem: string
  options: Option[]
  answer: string
  explain: string
}

export type Block = { k: string; t: string | string[][] }

export type Section = { title: string; blocks: Block[] }

export type RubricRow = { id: string; score: number; desc: string; ref: string }

export type Blank = { cell: number; line: number; answer: string }

export type StepItem = { code: string; notes: string[] }
export type Step = { title: string; items: StepItem[]; lead?: string[] }

export type Task = {
  id: string
  unit: string
  unitName: string
  subName: string
  part: string
  title: string
  duration: string
  fullScore: number
  sections: Section[]
  rubric: RubricRow[]
  skeleton: string[]
  blanks: Blank[]
  steps: Step[]
  hasCode: boolean
}

export type OutlineGroup = { name: string; points: string[] }
export type OutlineUnit = {
  key: string
  name: string
  part: string
  groups: OutlineGroup[]
  pointCount: number
}
export type Outline = {
  theory: OutlineUnit[]
  skills: { unit: string; points: string[] }[]
}

export type MemoRow = {
  chapter: string
  point: string
  meaning: string
  code: string
  analogy: string
  mnemonic: string
}

export type CheatStats = {
  count: number
  kinds: Record<string, number>
  judgeAnswer: Record<string, number>
  multiAnswerLen: Record<string, number>
  singleAnswer: Record<string, number>
  judgeAbsolute: { total: number; wrong: number; rate: number; words: string[] }
}

export type Pitfall = {
  tag: string
  level: string
  title: string
  body: string
  code: string | null
}

export type Cheat = {
  memo: { name: string; rows: MemoRow[] }[]
  memoCount: number
  stats: CheatStats
  pitfalls: Pitfall[]
  practicalCount: number
  blankCount: number
}
