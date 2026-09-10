export type Category = '法令' | '物理化学' | '性質消火'

export interface Question {
  id: string
  category: Category
  subcategory: string
  question: string
  choices: [string, string, string, string]
  correctIndex: number
  explanation: string
  tags: string[]
  difficulty: 1 | 2 | 3
}

export interface LearningRecord {
  correct: number
  incorrect: number
  lastAnsweredAt: string
}

export type History = Record<string, LearningRecord>
