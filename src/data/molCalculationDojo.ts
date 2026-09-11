export type MolDifficulty = 'basic' | 'standard'
export type MolQuestionType = 'g-to-mol' | 'mol-to-g' | 'mol-to-liter' | 'liter-to-mol' | 'g-to-liter' | 'liter-to-g'
export type RandomSource = () => number

export interface MolQuestion {
  id: string
  type: MolQuestionType
  difficulty: MolDifficulty
  title: string
  unit: 'mol' | 'g' | 'L'
  answerValue: number
  answer: string
  explanation: string
}

type Material = { name: string; formula: string; molarMass: number; atomHint: string; massFormula: string }

// 初版で使う物質と原子量の正本です。
const materials: Material[] = [
  { name: '水素', formula: 'H₂', molarMass: 2, atomHint: 'H=1', massFormula: '1 × 2 = 2' },
  { name: '酸素', formula: 'O₂', molarMass: 32, atomHint: 'O=16', massFormula: '16 × 2 = 32' },
  { name: '水', formula: 'H₂O', molarMass: 18, atomHint: 'H=1、O=16', massFormula: '1 × 2 + 16 = 18' },
  { name: '二酸化炭素', formula: 'CO₂', molarMass: 44, atomHint: 'C=12、O=16', massFormula: '12 + 16 × 2 = 44' },
  { name: 'メタン', formula: 'CH₄', molarMass: 16, atomHint: 'C=12、H=1', massFormula: '12 + 1 × 4 = 16' },
]
const gasMaterials = materials.filter((material) => material.formula !== 'H₂O')

const molValues = [0.5, 1, 1.5, 2, 2.5, 3, 4]
const gasMolarVolume = 22.4
const format = (value: number) => Number(value.toFixed(2)).toString()
const pick = <T,>(items: T[], rng: RandomSource) => items[Math.floor(rng() * items.length)]
const shuffle = <T,>(items: T[], rng: RandomSource) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const picked = Math.floor(rng() * (index + 1))
    ;[result[index], result[picked]] = [result[picked], result[index]]
  }
  return result
}
const materialLabel = (material: Material, difficulty: MolDifficulty) => difficulty === 'basic'
  ? `${material.formula}（モル質量${material.molarMass}g/mol）`
  : `${material.formula}（${material.atomHint}とする）`
const molarMassStep = (material: Material, difficulty: MolDifficulty) => difficulty === 'basic'
  ? `${material.formula}のモル質量：${material.molarMass}g/mol（問題文より）`
  : `${material.formula}のモル質量：${material.massFormula}g/mol`
const build = (type: MolQuestionType, difficulty: MolDifficulty, material: Material, mol: number): MolQuestion => {
  const mass = Number((material.molarMass * mol).toFixed(2))
  const liter = Number((gasMolarVolume * mol).toFixed(2))
  const label = materialLabel(material, difficulty)
  const molText = format(mol)
  const massText = format(mass)
  const literText = format(liter)
  const massStep = molarMassStep(material, difficulty)
  const common = { id: `mol-${type}-${difficulty}`, type, difficulty }

  if (type === 'g-to-mol') return { ...common, title: `${label} ${massText}gは何mol？`, unit: 'mol', answerValue: mol, answer: `${molText}mol`, explanation: `${massStep}\n${massText} ÷ ${material.molarMass} = ${molText}mol\n答え：${molText}mol` }
  if (type === 'mol-to-g') return { ...common, title: `${label} ${molText}molは何g？`, unit: 'g', answerValue: mass, answer: `${massText}g`, explanation: `${massStep}\n${material.molarMass} × ${molText} = ${massText}g\n答え：${massText}g` }
  if (type === 'mol-to-liter') return { ...common, title: `標準状態で、${material.formula} ${molText}molの体積は何L？`, unit: 'L', answerValue: liter, answer: `${literText}L`, explanation: `標準状態では1mol = 22.4L\n${molText} × 22.4 = ${literText}L\n答え：${literText}L` }
  if (type === 'liter-to-mol') return { ...common, title: `標準状態で、${material.formula} ${literText}Lは何mol？`, unit: 'mol', answerValue: mol, answer: `${molText}mol`, explanation: `標準状態では1mol = 22.4L\n${literText} ÷ 22.4 = ${molText}mol\n答え：${molText}mol` }
  if (type === 'g-to-liter') return { ...common, title: `${label} ${massText}gは、標準状態で何L？`, unit: 'L', answerValue: liter, answer: `${literText}L`, explanation: `${massStep}\n${massText} ÷ ${material.molarMass} = ${molText}mol\n${molText} × 22.4 = ${literText}L\n答え：${literText}L` }
  return { ...common, title: `標準状態で${material.formula} ${literText}Lは何g？（${difficulty === 'basic' ? `モル質量${material.molarMass}g/mol` : `${material.atomHint}とする`}）`, unit: 'g', answerValue: mass, answer: `${massText}g`, explanation: `${massStep}\n${literText} ÷ 22.4 = ${molText}mol\n${molText} × ${material.molarMass} = ${massText}g\n答え：${massText}g` }
}

const typeCycle = (difficulty: MolDifficulty): MolQuestionType[] => difficulty === 'basic'
  ? ['g-to-mol', 'mol-to-g', 'mol-to-liter', 'liter-to-mol', 'g-to-liter', 'liter-to-g', 'g-to-mol', 'mol-to-g', 'mol-to-liter', 'liter-to-mol']
  : ['g-to-mol', 'mol-to-g', 'mol-to-liter', 'liter-to-mol', 'g-to-liter', 'liter-to-g', 'g-to-liter', 'liter-to-g', 'g-to-mol', 'mol-to-g']

// セット開始時に数値を確定する純粋な生成関数です。再レンダリングでは値が変わりません。
export function createMolCalculationSet(difficulty: MolDifficulty, size = 10, rng: RandomSource = Math.random): MolQuestion[] {
  const questions: MolQuestion[] = []
  const usedCombinations = new Set<string>()
  while (questions.length < size) {
    for (const type of shuffle(typeCycle(difficulty), rng)) {
      if (questions.length >= size) break
      const candidates = (type.includes('liter') ? gasMaterials : materials).flatMap((material) => molValues.map((mol) => ({ material, mol, key: `${type}:${material.formula}:${mol}` })))
        .filter((candidate) => !usedCombinations.has(candidate.key))
      if (candidates.length === 0) throw new Error(`mol計算道場の出題候補が不足しています: ${type}`)
      const { material, mol, key } = pick(candidates, rng)
      usedCombinations.add(key)
      questions.push({ ...build(type, difficulty, material, mol), id: `mol-${type}-${difficulty}-${questions.length}` })
    }
  }
  return questions
}

export const isCorrectMolAnswer = (input: string, answerValue: number) => {
  if (input.trim() === '') return false
  const parsed = Number(input)
  return Number.isFinite(parsed) && Math.abs(parsed - answerValue) < 0.001
}

export function validateMolQuestion(question: MolQuestion): boolean {
  const expectedUnit = question.type === 'mol-to-g' || question.type === 'liter-to-g' ? 'g' : question.type === 'mol-to-liter' || question.type === 'g-to-liter' ? 'L' : 'mol'
  return question.unit === expectedUnit
    && Number.isFinite(question.answerValue)
    && question.answer === `${format(question.answerValue)}${question.unit}`
    && question.explanation.endsWith(`答え：${question.answer}`)
    && ((question.type.includes('liter')) ? question.title.includes('標準状態') : true)
}
