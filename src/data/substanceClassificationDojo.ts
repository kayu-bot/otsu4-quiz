export type PetroleumClass = 1 | 2 | 3
export type Solubility = 'water' | 'nonWater'
export type SubstanceMode = 'petroleum' | 'solubility' | 'combined'

export interface Substance {
  name: string
  petroleumClass: PetroleumClass
  solubility: Solubility
  designatedQuantity: number
  tags: string[]
}

export interface SubstanceQuestion {
  id: string
  substance: Substance
  title: string
  choices: string[]
  correctIndex: number
  answer: string
  explanation: string
  mistakeType: '石油類' | '水溶性' | '総合'
}

// 物質分類の正本。将来ほかの道場から参照できる独立データです。
export const substances: Substance[] = [
  { name: 'ガソリン', petroleumClass: 1, solubility: 'nonWater', designatedQuantity: 200, tags: ['第1石油類', '非水溶性'] },
  { name: 'ベンゼン', petroleumClass: 1, solubility: 'nonWater', designatedQuantity: 200, tags: ['第1石油類', '非水溶性', '重点'] },
  { name: 'トルエン', petroleumClass: 1, solubility: 'nonWater', designatedQuantity: 200, tags: ['第1石油類', '非水溶性', '重点'] },
  { name: 'アセトン', petroleumClass: 1, solubility: 'water', designatedQuantity: 400, tags: ['第1石油類', '水溶性', '重点'] },
  { name: '灯油', petroleumClass: 2, solubility: 'nonWater', designatedQuantity: 1000, tags: ['第2石油類', '非水溶性', '重点'] },
  { name: '軽油', petroleumClass: 2, solubility: 'nonWater', designatedQuantity: 1000, tags: ['第2石油類', '非水溶性', '重点'] },
  { name: 'キシレン', petroleumClass: 2, solubility: 'nonWater', designatedQuantity: 1000, tags: ['第2石油類', '非水溶性', '重点'] },
  { name: '酢酸', petroleumClass: 2, solubility: 'water', designatedQuantity: 2000, tags: ['第2石油類', '水溶性', '重点'] },
  { name: '重油', petroleumClass: 3, solubility: 'nonWater', designatedQuantity: 2000, tags: ['第3石油類', '非水溶性'] },
  { name: 'アニリン', petroleumClass: 3, solubility: 'nonWater', designatedQuantity: 2000, tags: ['第3石油類', '非水溶性', '重点'] },
  { name: 'ニトロベンゼン', petroleumClass: 3, solubility: 'nonWater', designatedQuantity: 2000, tags: ['第3石油類', '非水溶性', '重点'] },
  { name: 'クレオソート油', petroleumClass: 3, solubility: 'nonWater', designatedQuantity: 2000, tags: ['第3石油類', '非水溶性'] },
  { name: 'グリセリン', petroleumClass: 3, solubility: 'water', designatedQuantity: 4000, tags: ['第3石油類', '水溶性', '重点'] },
  { name: 'エチレングリコール', petroleumClass: 3, solubility: 'water', designatedQuantity: 4000, tags: ['第3石油類', '水溶性', '重点'] },
]

const petroleumChoices = ['第1石油類', '第2石油類', '第3石油類', '第4石油類']
const combinedChoices = ['第1石油類・非水溶性', '第1石油類・水溶性', '第2石油類・非水溶性', '第2石油類・水溶性', '第3石油類・非水溶性', '第3石油類・水溶性']
const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}
const className = (substance: Substance) => `第${substance.petroleumClass}石油類`
const solubilityName = (substance: Substance) => substance.solubility === 'water' ? '水溶性' : '非水溶性'
const classificationName = (substance: Substance) => `${className(substance)}・${solubilityName(substance)}`

function weightedSubstances(): Substance[] {
  const weighted = substances.flatMap((substance) => substance.tags.includes('重点') ? [substance, substance] : [substance])
  const selected: Substance[] = []
  while (selected.length < 10) {
    const candidate = weighted[Math.floor(Math.random() * weighted.length)]
    if (!selected.some((substance) => substance.name === candidate.name)) selected.push(candidate)
  }
  return selected
}

function petroleumQuestion(substance: Substance): SubstanceQuestion {
  const answer = className(substance)
  const choices = shuffle(petroleumChoices)
  return { id: `petroleum-${substance.name}`, substance, title: `${substance.name}は第何石油類？`, choices, correctIndex: choices.indexOf(answer), answer, explanation: `${substance.name}は${classificationName(substance)}です。\n指定数量は${substance.designatedQuantity}Lです。`, mistakeType: '石油類' }
}

function solubilityQuestion(substance: Substance): SubstanceQuestion {
  const answer = solubilityName(substance)
  const choices = shuffle(['水溶性', '非水溶性'])
  return { id: `solubility-${substance.name}`, substance, title: `${substance.name}は？`, choices, correctIndex: choices.indexOf(answer), answer, explanation: `${substance.name}は${classificationName(substance)}です。\n指定数量は${substance.designatedQuantity}Lです。`, mistakeType: '水溶性' }
}

function combinedQuestion(substance: Substance): SubstanceQuestion {
  const answer = classificationName(substance)
  const choices = shuffle([answer, ...shuffle(combinedChoices.filter((choice) => choice !== answer)).slice(0, 3)])
  return { id: `combined-${substance.name}`, substance, title: `${substance.name}の分類として正しいものは？`, choices, correctIndex: choices.indexOf(answer), answer, explanation: `${substance.name}は${answer}です。\n指定数量は${substance.designatedQuantity}Lです。`, mistakeType: '総合' }
}

export function createSubstanceClassificationSet(mode: SubstanceMode): SubstanceQuestion[] {
  const selected = weightedSubstances()
  if (mode === 'petroleum') return selected.map(petroleumQuestion)
  if (mode === 'solubility') return selected.map(solubilityQuestion)
  return selected.map(combinedQuestion)
}
