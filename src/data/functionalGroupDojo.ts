export interface FunctionalGroup {
  substance: string
  formula: string
  group: string
  symbol: string
}

export interface FunctionalGroupQuestion {
  id: string
  title: string
  choices: string[]
  correctIndex: number
  answer: string
  explanation: string
}

// 官能基対応の正本。乙四の基礎化学で扱う5組だけに限定しています。
export const functionalGroups: FunctionalGroup[] = [
  { substance: 'プロパノール', formula: 'C3H7OH', group: 'ヒドロキシ基', symbol: '－OH' },
  { substance: '酢酸', formula: 'CH3COOH', group: 'カルボキシ基', symbol: '－COOH' },
  { substance: 'アニリン', formula: 'C6H5NH2', group: 'アミノ基', symbol: '－NH2' },
  { substance: 'ニトロベンゼン', formula: 'C6H5NO2', group: 'ニトロ基', symbol: '－NO2' },
  { substance: 'アセトン', formula: 'CH3COCH3', group: 'カルボニル基', symbol: '＞C=O' },
]

const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}

const groupChoices = () => functionalGroups.map((item) => item.group)
const withChoices = (id: string, title: string, answer: string, explanation: string, choices: string[]): FunctionalGroupQuestion => {
  const randomized = shuffle(choices)
  return { id, title, choices: randomized, correctIndex: randomized.indexOf(answer), answer, explanation }
}

function substanceToGroup(item: FunctionalGroup, formulaVisible: boolean) {
  const formula = formulaVisible ? ` ${item.formula}` : ''
  return withChoices(`substance-${item.substance}-${formulaVisible ? 'formula' : 'name'}`, `${item.substance}${formula} がもつ代表的な官能基はどれ？`, item.group, `${item.substance} ${item.formula} の ${item.symbol.replace('－', '')} が${item.group}です。`, groupChoices())
}

function groupToSubstance(item: FunctionalGroup) {
  return withChoices(`group-${item.group}`, `${item.group}をもつ物質はどれ？`, item.substance, `${item.group}（${item.symbol}）をもつのは${item.substance}です。`, functionalGroups.map((candidate) => candidate.substance))
}

function groupToSymbol(item: FunctionalGroup) {
  return withChoices(`group-symbol-${item.group}`, `${item.group}を表す式はどれ？`, item.symbol, `${item.group}は${item.symbol}で表します。`, functionalGroups.map((candidate) => candidate.symbol))
}

function correctCombination(item: FunctionalGroup) {
  const answer = `${item.substance}：${item.group}`
  const wrongChoices = functionalGroups.filter((candidate) => candidate !== item).map((candidate) => {
    const wrongGroup = shuffle(functionalGroups.filter((group) => group.group !== candidate.group))[0].group
    return `${candidate.substance}：${wrongGroup}`
  })
  const choices = [answer, ...wrongChoices]
  return withChoices(`correct-combination-${item.substance}`, '次の組み合わせで正しいものはどれ？', answer, `${item.substance} ${item.formula} の ${item.symbol.replace('－', '')} が${item.group}です。`, choices)
}

function incorrectCombination(item: FunctionalGroup, wrong: FunctionalGroup) {
  const answer = `${item.substance}：${wrong.group}`
  const correctChoices = functionalGroups.filter((candidate) => candidate !== item).slice(0, 4).map((candidate) => `${candidate.substance}：${candidate.group}`)
  return withChoices(`incorrect-combination-${item.substance}`, '次の組み合わせで誤っているものはどれ？', answer, `${item.substance} ${item.formula} は${item.group}（${item.symbol}）をもちます。`, [answer, ...correctChoices])
}

function symbolToGroup(item: FunctionalGroup) {
  return withChoices(`symbol-${item.symbol}`, `${item.symbol} は何基か。`, item.group, `${item.symbol} は${item.group}を表します。`, groupChoices())
}

function createFunctionalGroupCycle(): FunctionalGroupQuestion[] {
  const items = shuffle(functionalGroups)
  return [
    substanceToGroup(items[0], false),
    substanceToGroup(items[1], true),
    groupToSubstance(items[2]),
    correctCombination(items[3]),
    incorrectCombination(items[4], items[0]),
    symbolToGroup(items[1]),
    groupToSymbol(items[4]),
    substanceToGroup(items[2], true),
    correctCombination(items[1]),
    incorrectCombination(items[3], items[2]),
  ]
}

export function createFunctionalGroupSet(size = 10): FunctionalGroupQuestion[] {
  const questions: FunctionalGroupQuestion[] = []
  while (questions.length < size) {
    const cycle = shuffle(createFunctionalGroupCycle())
    for (const question of cycle) {
    const previous = questions[questions.length - 1]
      const sameConfiguration = previous?.title === question.title && previous.choices.join('|') === question.choices.join('|')
      if (!sameConfiguration && questions.length < size) questions.push({ ...question, id: `${question.id}-${questions.length}` })
    }
  }
  return questions
}

const pairIsCorrect = (choice: string) => {
  const [substance, group] = choice.split('：')
  return functionalGroups.some((item) => item.substance === substance && item.group === group)
}

// 既知の対応表から意味上の正解を再計算し、生成ロジックの不整合を検出します。
export function validateFunctionalGroupQuestion(question: FunctionalGroupQuestion): boolean {
  let semanticAnswers: string[]
  if (question.id.startsWith('correct-combination-')) semanticAnswers = question.choices.filter(pairIsCorrect)
  else if (question.id.startsWith('incorrect-combination-')) semanticAnswers = question.choices.filter((choice) => !pairIsCorrect(choice))
  else if (question.id.startsWith('group-symbol-')) {
    const item = functionalGroups.find((candidate) => question.id.startsWith(`group-symbol-${candidate.group}`))
    semanticAnswers = item ? question.choices.filter((choice) => choice === item.symbol) : []
  } else if (question.id.startsWith('group-')) {
    const item = functionalGroups.find((candidate) => question.id.startsWith(`group-${candidate.group}`))
    semanticAnswers = item ? question.choices.filter((choice) => choice === item.substance) : []
  } else if (question.id.startsWith('symbol-')) {
    const item = functionalGroups.find((candidate) => question.id.startsWith(`symbol-${candidate.symbol}`))
    semanticAnswers = item ? question.choices.filter((choice) => choice === item.group) : []
  } else {
    const item = functionalGroups.find((candidate) => question.id.startsWith(`substance-${candidate.substance}-`))
    semanticAnswers = item ? question.choices.filter((choice) => choice === item.group) : []
  }
  return semanticAnswers.length === 1
    && semanticAnswers[0] === question.answer
    && question.choices[question.correctIndex] === question.answer
    && new Set(question.choices).size === question.choices.length
}
