export type RandomSource = () => number

export interface CombustionFuel {
  name: string
  formula: string
  carbon: number
  hydrogen: number
  oxygen: number
}

export interface CombustionQuestion {
  id: string
  fuel: CombustionFuel
  coefficients: [number, number, number, number]
  equation: string
  explanation: string
}

// 初版は乙4の基礎で扱いやすい炭化水素・アルコールに限定します。
export const combustionFuels: CombustionFuel[] = [
  { name: 'メタン', formula: 'CH₄', carbon: 1, hydrogen: 4, oxygen: 0 },
  { name: 'エタン', formula: 'C₂H₆', carbon: 2, hydrogen: 6, oxygen: 0 },
  { name: 'プロパン', formula: 'C₃H₈', carbon: 3, hydrogen: 8, oxygen: 0 },
  { name: 'ブタン', formula: 'C₄H₁₀', carbon: 4, hydrogen: 10, oxygen: 0 },
  { name: 'メタノール', formula: 'CH₃OH', carbon: 1, hydrogen: 4, oxygen: 1 },
  { name: 'エタノール', formula: 'C₂H₅OH', carbon: 2, hydrogen: 6, oxygen: 1 },
]

const gcd = (left: number, right: number): number => right === 0 ? left : gcd(right, left % right)
const gcdAll = (values: number[]) => values.reduce((result, value) => gcd(result, value))
const shuffle = <T,>(items: T[], rng: RandomSource) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(rng() * (index + 1))
    ;[result[index], result[selected]] = [result[selected], result[index]]
  }
  return result
}
const coefficientText = (value: number, formula: string) => `${value === 1 ? '' : value}${formula}`

// C→CO₂、H→H₂Oの順に決め、最後にO₂を合わせて最小整数比へ整えます。
export function calculateCombustionCoefficients(fuel: CombustionFuel): [number, number, number, number] {
  const oxygenNeedForOneFuel = 2 * fuel.carbon + fuel.hydrogen / 2 - fuel.oxygen
  const fuelCoefficient = oxygenNeedForOneFuel % 2 === 0 ? 1 : 2
  const oxygenCoefficient = fuelCoefficient * oxygenNeedForOneFuel / 2
  const carbonDioxideCoefficient = fuelCoefficient * fuel.carbon
  const waterCoefficient = fuelCoefficient * fuel.hydrogen / 2
  const divisor = gcdAll([fuelCoefficient, oxygenCoefficient, carbonDioxideCoefficient, waterCoefficient])
  return [fuelCoefficient / divisor, oxygenCoefficient / divisor, carbonDioxideCoefficient / divisor, waterCoefficient / divisor]
}

export const formatCombustionEquation = (fuel: CombustionFuel, [a, b, c, d]: [number, number, number, number]) => `${coefficientText(a, fuel.formula)} + ${coefficientText(b, 'O₂')} → ${coefficientText(c, 'CO₂')} + ${coefficientText(d, 'H₂O')}`

export function createCombustionQuestion(fuel: CombustionFuel, index: number): CombustionQuestion {
  const coefficients = calculateCombustionCoefficients(fuel)
  const [a, b, c, d] = coefficients
  const leftOxygen = a * fuel.oxygen + b * 2
  const rightOxygen = c * 2 + d
  const equation = formatCombustionEquation(fuel, coefficients)
  const explanation = `${equation}\n\nC：左${a * fuel.carbon} → 右${c}\nH：左${a * fuel.hydrogen} → 右${d * 2}\nO：左 ${a * fuel.oxygen}+${b * 2}=${leftOxygen} → 右 ${c * 2}+${d}=${rightOxygen}\n\nしたがって原子数が一致しています。係数は最小の整数比です。`
  return { id: `combustion-${fuel.formula}-${index}`, fuel, coefficients, equation, explanation }
}

export function createCombustionSet(size = 10, rng: RandomSource = Math.random): CombustionQuestion[] {
  const questions: CombustionQuestion[] = []
  while (questions.length < size) {
    for (const fuel of shuffle(combustionFuels, rng)) {
      if (questions.length >= size) break
      const previous = questions[questions.length - 1]
      if (previous?.fuel.formula !== fuel.formula) questions.push(createCombustionQuestion(fuel, questions.length))
    }
  }
  return questions
}

export const isCorrectCombustionAnswer = (inputs: string[], coefficients: number[]) => inputs.length === 4
  && inputs.every((input, index) => /^\d+$/.test(input) && Number(input) > 0 && Number(input) === coefficients[index])

export function validateCombustionQuestion(question: CombustionQuestion): boolean {
  const [a, b, c, d] = question.coefficients
  const { carbon, hydrogen, oxygen } = question.fuel
  return [a, b, c, d].every((value) => Number.isInteger(value) && value > 0)
    && gcdAll([a, b, c, d]) === 1
    && a * carbon === c
    && a * hydrogen === d * 2
    && a * oxygen + b * 2 === c * 2 + d
    && question.equation === formatCombustionEquation(question.fuel, question.coefficients)
}
