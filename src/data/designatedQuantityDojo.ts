export type QuantityMode = 'memory' | 'calculation' | 'mix'
export type RandomSource = () => number

export interface QuantityQuestion {
  id: string
  title: string
  choices: string[]
  correctIndex: number
  answer: string
  explanation: string
  wrongLabel: string
}

type QuantityItem = { id: string; label: string; quantity: number; material?: string }
type CalculationMaterial = { name: string; itemId: string }
type CalculationEntry = { material: CalculationMaterial; item: QuantityItem; multiple: number }

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

const calculationMaterials: CalculationMaterial[] = [
  { name: 'ガソリン', itemId: 'petroleum-1-insoluble' }, { name: 'アセトン', itemId: 'petroleum-1-soluble' }, { name: '灯油', itemId: 'petroleum-2-insoluble' }, { name: '軽油', itemId: 'petroleum-2-insoluble' }, { name: '酢酸', itemId: 'petroleum-2-soluble' }, { name: '重油', itemId: 'petroleum-3-insoluble' }, { name: 'グリセリン', itemId: 'petroleum-3-soluble' }, { name: 'エチレングリコール', itemId: 'petroleum-3-soluble' }, { name: 'アルコール類', itemId: 'alcohol' },
]

// 計算しやすく、1倍前後の判定も練習できる倍率だけを使います。
const multiplierValues = [0.5, 0.8, 0.95, 1, 1.05, 1.2]
const byId = (id: string) => designatedQuantityItems.find((item) => item.id === id)!
const pick = <T,>(items: T[], rng: RandomSource) => items[Math.floor(rng() * items.length)]
const shuffle = <T,>(items: T[], rng: RandomSource) => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}
const formatMultiple = (value: number) => `${Number(value.toFixed(2))}倍`

function multipleChoices(answer: number, entries: CalculationEntry[], rng: RandomSource): string[] {
  const totalAmount = entries.reduce((sum, entry) => sum + entry.item.quantity * entry.multiple, 0)
  const firstOnly = entries[0].multiple
  const denominatorMistake = entries.length > 1 ? entries.reduce((sum, entry) => sum + entry.item.quantity * entry.multiple, 0) / entries[0].item.quantity : entries[0].item.quantity
  const candidates = [answer, firstOnly, denominatorMistake, totalAmount, answer + 0.5, Math.max(0.1, answer - 0.2)]
    .map((value) => Math.round(value * 100) / 100)
  const unique = [...new Set(candidates)].filter((value) => value >= 0)
  while (unique.length < 4) unique.push(Math.round((answer + 0.3 + unique.length * 0.2) * 100) / 100)
  return shuffle(unique.slice(0, 4), rng).map(formatMultiple)
}

function memoryQuestion(item: QuantityItem, useMaterial: boolean, rng: RandomSource): QuantityQuestion {
  const target = useMaterial && item.material ? item.material : item.label
  const answer = `${item.quantity}L`
  const values = [item.quantity, ...shuffle(designatedQuantityItems.filter((other) => other.quantity !== item.quantity).map((other) => other.quantity), rng).slice(0, 3)]
  const choices = shuffle([...new Set(values)], rng).map((value) => `${value}L`)
  return { id: `memory-${item.id}-${useMaterial ? 'material' : 'category'}`, title: `${target}の指定数量は？`, choices, correctIndex: choices.indexOf(answer), answer, explanation: `${item.label}の指定数量は${answer}です。`, wrongLabel: target }
}

// 安定IDを持つテンプレート。数値だけはセット開始時に生成し、出題中は同じオブジェクトを保持します。
export function createDesignatedCalculationQuestion(templateIndex: number, rng: RandomSource = Math.random): QuantityQuestion {
  const entryCount = templateIndex % 3 === 0 ? 1 : templateIndex % 3 === 1 ? 2 : 3
  const offset = Math.floor(rng() * calculationMaterials.length)
  const entries: CalculationEntry[] = Array.from({ length: entryCount }, (_, entryIndex) => {
    const material = calculationMaterials[(offset + templateIndex + entryIndex * 3) % calculationMaterials.length]
    return { material, item: byId(material.itemId), multiple: pick(multiplierValues, rng) }
  })
  const answerValue = Math.round(entries.reduce((sum, entry) => sum + entry.multiple, 0) * 100) / 100
  const answer = formatMultiple(answerValue)
  const quantities = entries.map((entry) => `${entry.material.name}${entry.item.quantity * entry.multiple}L`).join('と')
  const title = entryCount === 1
    ? `${quantities}を貯蔵している。指定数量の倍数はいくつ？`
    : `${quantities}を同一場所で貯蔵している。指定数量の倍数の合計はいくつ？`
  const explanation = `${entries.map((entry) => `${entry.material.name}${entry.item.quantity * entry.multiple}÷${entry.item.quantity}＝${formatMultiple(entry.multiple)}`).join('\n')}\n合計${answer}`
  const choices = multipleChoices(answerValue, entries, rng)
  return { id: `calculation-template-${templateIndex}`, title, choices, correctIndex: choices.indexOf(answer), answer, explanation, wrongLabel: entries.map((entry) => entry.material.name).join('・') }
}

export function createDesignatedQuantitySet(mode: QuantityMode, rng: RandomSource = Math.random): QuantityQuestion[] {
  if (mode === 'memory') return shuffle(designatedQuantityItems, rng).map((item) => memoryQuestion(item, false, rng))
  if (mode === 'calculation') return Array.from({ length: 10 }, (_, index) => createDesignatedCalculationQuestion(index, rng))
  const memoryItems = shuffle(designatedQuantityItems.filter((item) => item.material), rng).slice(0, 3)
  const memory = memoryItems.map((item) => memoryQuestion(item, true, rng))
  const calculations = [0, 1, 2, 3, 4, 5, 6].map((index) => createDesignatedCalculationQuestion(index, rng))
  return shuffle([...memory, ...calculations], rng)
}
