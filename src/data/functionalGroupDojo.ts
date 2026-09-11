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

function correctCombination(item: FunctionalGroup, wrong: FunctionalGroup) {
  const answer = `${item.substance}：${item.group}`
  const choices = [answer, `${wrong.substance}：${item.group}`, `${item.substance}：${wrong.group}`, ...functionalGroups.filter((candidate) => candidate !== item && candidate !== wrong).slice(0, 2).map((candidate) => `${candidate.substance}：${candidate.group}`)]
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

export function createFunctionalGroupSet(): FunctionalGroupQuestion[] {
  const items = shuffle(functionalGroups)
  const questions = [
    substanceToGroup(items[0], false),
    substanceToGroup(items[1], true),
    groupToSubstance(items[2]),
    correctCombination(items[3], items[4]),
    incorrectCombination(items[4], items[0]),
    symbolToGroup(items[1]),
    groupToSubstance(items[0]),
    substanceToGroup(items[2], true),
    correctCombination(items[1], items[3]),
    incorrectCombination(items[3], items[2]),
  ]
  return shuffle(questions)
}
