export type QuantityMode = 'memory' | 'calculation' | 'mix'

export interface QuantityQuestion {
  id: string
  title: string
  choices: string[]
  correctIndex: number
  answer: string
  explanation: string
  wrongLabel: string
}

type QuantityItem = {
  id: string
  label: string
  quantity: number
  material?: string
}

// 指定数量の正本。この配列だけを更新すれば、出題・採点・解説に反映されます。
export const designatedQuantityItems: QuantityItem[] = [
  { id: 'special', label: '特殊引火物', quantity: 50 },
  { id: 'petroleum-1-insoluble', label: '第1石油類・非水溶性', quantity: 200, material: 'ガソリン' },
  { id: 'petroleum-1-soluble', label: '第1石油類・水溶性', quantity: 400, material: 'アセトン' },
  { id: 'alcohol', label: 'アルコール類', quantity: 400, material: 'アルコール類' },
  { id: 'petroleum-2-insoluble', label: '第2石油類・非水溶性', quantity: 1000, material: '灯油' },
  { id: 'petroleum-2-soluble', label: '第2石油類・水溶性', quantity: 2000, material: '酢酸' },
  { id: 'petroleum-3-insoluble', label: '第3石油類・非水溶性', quantity: 2000, material: '重油' },
  { id: 'petroleum-3-soluble', label: '第3石油類・水溶性', quantity: 4000, material: 'グリセリン' },
  { id: 'petroleum-4', label: '第4石油類', quantity: 6000 },
  { id: 'oil', label: '動植物油類', quantity: 10000 },
]

const calculationMaterials = [
  { name: 'ガソリン', itemId: 'petroleum-1-insoluble' },
  { name: 'アセトン', itemId: 'petroleum-1-soluble' },
  { name: '灯油', itemId: 'petroleum-2-insoluble' },
  { name: '軽油', itemId: 'petroleum-2-insoluble' },
  { name: '酢酸', itemId: 'petroleum-2-soluble' },
  { name: '重油', itemId: 'petroleum-3-insoluble' },
  { name: 'グリセリン', itemId: 'petroleum-3-soluble' },
  { name: 'エチレングリコール', itemId: 'petroleum-3-soluble' },
  { name: 'アルコール類', itemId: 'alcohol' },
]

const multiplierValues = [0.5, 0.8, 0.95, 1, 1.05, 1.2]
const answerCandidates = [0.5, 0.8, 0.95, 1, 1.05, 1.2, 1.3, 1.5, 1.6, 1.75, 2, 2.1, 2.2, 2.4]

const byId = (id: string) => designatedQuantityItems.find((item) => item.id === id)!
const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}
const formatMultiple = (value: number) => `${value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}倍`
const choicesFor = (answer: number) => {
  const alternatives = shuffle(answerCandidates.filter((value) => value !== answer)).slice(0, 3)
  return shuffle([answer, ...alternatives]).map(formatMultiple)
}

function memoryQuestion(item: QuantityItem, useMaterial = false): QuantityQuestion {
  const target = useMaterial && item.material ? item.material : item.label
  const answer = `${item.quantity}L`
  const choices = shuffle([...new Set([item.quantity, ...shuffle(designatedQuantityItems.filter((other) => other.quantity !== item.quantity).map((other) => other.quantity)).slice(0, 3)])]).map((value) => `${value}L`)
  return { id: `memory-${item.id}-${useMaterial ? 'material' : 'category'}`, title: `${target}の指定数量は？`, choices, correctIndex: choices.indexOf(answer), answer, explanation: `${item.label}の指定数量は${answer}です。`, wrongLabel: target }
}

function calculationQuestion(index: number, single: boolean): QuantityQuestion {
  const first = calculationMaterials[index % calculationMaterials.length]
  const firstItem = byId(first.itemId)
  const firstMultiple = multiplierValues[index % multiplierValues.length]
  const entries = [{ material: first, item: firstItem, multiple: firstMultiple }]
  if (!single) {
    const second = calculationMaterials[(index + 3) % calculationMaterials.length]
    const secondItem = byId(second.itemId)
    const secondMultiple = multiplierValues[(index + 2) % multiplierValues.length]
    entries.push({ material: second, item: secondItem, multiple: secondMultiple })
  }
  const answerValue = entries.reduce((sum, entry) => sum + entry.multiple, 0)
  const answer = formatMultiple(answerValue)
  const quantities = entries.map((entry) => `${entry.material.name}${entry.item.quantity * entry.multiple}L`).join('と')
  const title = single ? `${quantities}を貯蔵している。指定数量の倍数はいくつ？` : `${quantities}を同一場所で貯蔵している。指定数量の倍数の合計はいくつ？`
  const explanation = `${entries.map((entry) => `${entry.material.name}${entry.item.quantity * entry.multiple}÷${entry.item.quantity}＝${formatMultiple(entry.multiple)}`).join('\n')}\n合計${answer}`
  const choices = choicesFor(answerValue)
  return { id: `calculation-${single ? 'single' : 'multiple'}-${index}`, title, choices, correctIndex: choices.indexOf(answer), answer, explanation, wrongLabel: entries.map((entry) => entry.material.name).join('・') }
}

export function createDesignatedQuantitySet(mode: QuantityMode): QuantityQuestion[] {
  if (mode === 'memory') return shuffle(designatedQuantityItems).map((item) => memoryQuestion(item))
  if (mode === 'calculation') return Array.from({ length: 10 }, (_, index) => calculationQuestion(index, index % 2 === 0))
  const memoryItems = shuffle(designatedQuantityItems.filter((item) => item.material)).slice(0, 3)
  const memory = memoryItems.map((item) => memoryQuestion(item, true))
  const singles = [0, 1, 2].map((index) => calculationQuestion(index, true))
  const multiples = [3, 4, 5, 6].map((index) => calculationQuestion(index, false))
  return shuffle([...memory, ...singles, ...multiples])
}
