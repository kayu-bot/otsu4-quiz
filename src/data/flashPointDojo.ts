export type PetroleumClass = '第1石油類' | '第2石油類' | '第3石油類' | '第4石油類'

export interface FlashPointQuestion {
  temperature: number
  choices: PetroleumClass[]
  correctIndex: number
  answer: PetroleumClass
  range: string
}

const classes: PetroleumClass[] = ['第1石油類', '第2石油類', '第3石油類', '第4石油類']
// 境界値は重みを付け、通常値より抽選されやすくしています。
const weightedTemperatures = [20, 20, 20, 21, 21, 21, 22, 22, 69, 69, 69, 70, 70, 70, 71, 71, 199, 199, 199, 200, 200, 200, 201, 201, 249, 249, 5, 35, 50, 100, 150, 180, 220, 240]

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function classifyFlashPoint(temperature: number): Pick<FlashPointQuestion, 'answer' | 'range'> {
  if (temperature < 21) return { answer: '第1石油類', range: '21℃未満なので第1石油類' }
  if (temperature < 70) return { answer: '第2石油類', range: '21℃以上70℃未満なので第2石油類' }
  if (temperature < 200) return { answer: '第3石油類', range: '70℃以上200℃未満なので第3石油類' }
  return { answer: '第4石油類', range: '200℃以上250℃未満なので第4石油類' }
}

export function createFlashPointDojoSet(size = 10): FlashPointQuestion[] {
  const selected: number[] = []
  while (selected.length < size) {
    const temperature = weightedTemperatures[Math.floor(Math.random() * weightedTemperatures.length)]
    if (selected[selected.length - 1] !== temperature) selected.push(temperature)
  }
  return selected.map((temperature) => {
    const { answer, range } = classifyFlashPoint(temperature)
    const choices = shuffle(classes)
    return { temperature, choices, correctIndex: choices.indexOf(answer), answer, range }
  })
}
