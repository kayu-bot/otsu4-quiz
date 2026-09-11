import { useMemo, useState, type FormEvent } from 'react'
import { questions } from './data/questions'
import { createFlashPointDojoSet, type FlashPointQuestion } from './data/flashPointDojo'
import { createDesignatedQuantitySet, type QuantityMode, type QuantityQuestion } from './data/designatedQuantityDojo'
import { createSubstanceClassificationSet, type SubstanceMode, type SubstanceQuestion } from './data/substanceClassificationDojo'
import { createFunctionalGroupSet, type FunctionalGroupQuestion } from './data/functionalGroupDojo'
import { createMolCalculationSet, isCorrectMolAnswer, type MolDifficulty, type MolQuestion } from './data/molCalculationDojo'
import type { Category, History, Question } from './types'

type Screen = 'home' | 'normal-options' | 'category' | 'category-options' | 'quiz' | 'result' | 'flash-options' | 'dojo' | 'dojo-result' | 'quantity-menu' | 'quantity' | 'quantity-result' | 'substance-menu' | 'substance' | 'substance-result' | 'functional-options' | 'functional' | 'functional-result' | 'mol-menu' | 'mol' | 'mol-result'
type Mode = 'ten' | 'random' | 'mistakes' | 'category'
type SetSize = 10 | 20 | 30
type NormalSize = 10 | 20 | 35 | 50 | 'all'
type Answer = { question: Question; selected: number; correct: boolean }
type DojoAnswer = { question: FlashPointQuestion; selected: number; correct: boolean }
type QuantityAnswer = { question: QuantityQuestion; selected: number; correct: boolean }
type SubstanceAnswer = { question: SubstanceQuestion; selected: number; correct: boolean }
type FunctionalAnswer = { question: FunctionalGroupQuestion; selected: number; correct: boolean }
type MolAnswer = { question: MolQuestion; input: string; correct: boolean }
const historyKey = 'otsu4-quiz-learning-history'
const explanationSettingKey = 'otsu4-quiz-show-explanation'
const categories: Category[] = ['法令', '物理化学', '性質消火']
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
const readHistory = (): History => { try { return JSON.parse(localStorage.getItem(historyKey) ?? '{}') as History } catch { return {} } }
const readShowExplanation = () => localStorage.getItem(explanationSettingKey) !== 'false'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [history, setHistory] = useState<History>(readHistory)
  const [quiz, setQuiz] = useState<Question[]>([])
  const [mode, setMode] = useState<Mode>('ten')
  const [categoryScope, setCategoryScope] = useState<Category | undefined>()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [dojoQuiz, setDojoQuiz] = useState<FlashPointQuestion[]>([])
  const [dojoIndex, setDojoIndex] = useState(0)
  const [dojoSelected, setDojoSelected] = useState<number | null>(null)
  const [dojoAnswers, setDojoAnswers] = useState<DojoAnswer[]>([])
  const [quantityQuiz, setQuantityQuiz] = useState<QuantityQuestion[]>([])
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('memory')
  const [quantityIndex, setQuantityIndex] = useState(0)
  const [quantitySelected, setQuantitySelected] = useState<number | null>(null)
  const [quantityAnswers, setQuantityAnswers] = useState<QuantityAnswer[]>([])
  const [substanceQuiz, setSubstanceQuiz] = useState<SubstanceQuestion[]>([])
  const [substanceMode, setSubstanceMode] = useState<SubstanceMode>('petroleum')
  const [substanceIndex, setSubstanceIndex] = useState(0)
  const [substanceSelected, setSubstanceSelected] = useState<number | null>(null)
  const [substanceAnswers, setSubstanceAnswers] = useState<SubstanceAnswer[]>([])
  const [functionalQuiz, setFunctionalQuiz] = useState<FunctionalGroupQuestion[]>([])
  const [functionalIndex, setFunctionalIndex] = useState(0)
  const [functionalSelected, setFunctionalSelected] = useState<number | null>(null)
  const [functionalAnswers, setFunctionalAnswers] = useState<FunctionalAnswer[]>([])
  const [molQuiz, setMolQuiz] = useState<MolQuestion[]>([])
  const [molDifficulty, setMolDifficulty] = useState<MolDifficulty>('basic')
  const [molIndex, setMolIndex] = useState(0)
  const [molInput, setMolInput] = useState('')
  const [molAnswered, setMolAnswered] = useState(false)
  const [molAnswers, setMolAnswers] = useState<MolAnswer[]>([])
  const [setSize, setSetSize] = useState<SetSize>(10)
  const [normalSize, setNormalSize] = useState<NormalSize>(10)
  const [showExplanation, setShowExplanation] = useState(readShowExplanation)

  const current = quiz[index]
  const start = (nextMode: Mode, category?: Category, requestedSize: NormalSize = 10) => {
    let pool = category ? questions.filter((q) => q.category === category) : [...questions]
    if (nextMode === 'mistakes') {
      const experienced = pool.filter((q) => history[q.id] && history[q.id].incorrect > 0)
      if (experienced.length === 0) { window.alert('まだ間違えた問題がありません。まず通常のクイズに挑戦してみましょう。'); return }
      pool = experienced
    }
    const count = requestedSize === 'all' ? pool.length : Math.min(requestedSize, pool.length)
    setQuiz(shuffle(pool).slice(0, count)); setMode(nextMode); setCategoryScope(category); setIndex(0); setSelected(null); setAnswers([]); setScreen('quiz')
  }
  const answer = (choice: number) => {
    if (selected !== null || !current) return
    const correct = choice === current.correctIndex
    setSelected(choice); setAnswers((previous) => [...previous, { question: current, selected: choice, correct }])
    const updated = { ...history, [current.id]: { correct: (history[current.id]?.correct ?? 0) + (correct ? 1 : 0), incorrect: (history[current.id]?.incorrect ?? 0) + (correct ? 0 : 1), lastAnsweredAt: new Date().toISOString() } }
    setHistory(updated); localStorage.setItem(historyKey, JSON.stringify(updated))
  }
  const next = () => { if (index + 1 >= quiz.length) setScreen('result'); else { setIndex(index + 1); setSelected(null) } }
  const startDojo = (size: SetSize) => { setDojoQuiz(createFlashPointDojoSet(size)); setDojoIndex(0); setDojoSelected(null); setDojoAnswers([]); setScreen('dojo') }
  const answerDojo = (choice: number) => {
    const question = dojoQuiz[dojoIndex]
    if (dojoSelected !== null || !question) return
    const correct = choice === question.correctIndex
    setDojoSelected(choice)
    setDojoAnswers((previous) => [...previous, { question, selected: choice, correct }])
  }
  const nextDojo = () => { if (dojoIndex + 1 >= dojoQuiz.length) setScreen('dojo-result'); else { setDojoIndex(dojoIndex + 1); setDojoSelected(null) } }
  const startQuantity = (nextMode: QuantityMode, size: SetSize) => { setQuantityQuiz(createDesignatedQuantitySet(nextMode, size)); setQuantityMode(nextMode); setQuantityIndex(0); setQuantitySelected(null); setQuantityAnswers([]); setScreen('quantity') }
  const answerQuantity = (choice: number) => {
    const question = quantityQuiz[quantityIndex]
    if (quantitySelected !== null || !question) return
    const correct = choice === question.correctIndex
    setQuantitySelected(choice)
    setQuantityAnswers((previous) => [...previous, { question, selected: choice, correct }])
  }
  const nextQuantity = () => { if (quantityIndex + 1 >= quantityQuiz.length) setScreen('quantity-result'); else { setQuantityIndex(quantityIndex + 1); setQuantitySelected(null) } }
  const startSubstance = (nextMode: SubstanceMode, size: SetSize) => { setSubstanceQuiz(createSubstanceClassificationSet(nextMode, size)); setSubstanceMode(nextMode); setSubstanceIndex(0); setSubstanceSelected(null); setSubstanceAnswers([]); setScreen('substance') }
  const answerSubstance = (choice: number) => {
    const question = substanceQuiz[substanceIndex]
    if (substanceSelected !== null || !question) return
    const correct = choice === question.correctIndex
    setSubstanceSelected(choice)
    setSubstanceAnswers((previous) => [...previous, { question, selected: choice, correct }])
  }
  const nextSubstance = () => { if (substanceIndex + 1 >= substanceQuiz.length) setScreen('substance-result'); else { setSubstanceIndex(substanceIndex + 1); setSubstanceSelected(null) } }
  const startFunctional = (size: SetSize) => { setFunctionalQuiz(createFunctionalGroupSet(size)); setFunctionalIndex(0); setFunctionalSelected(null); setFunctionalAnswers([]); setScreen('functional') }
  const answerFunctional = (choice: number) => {
    const question = functionalQuiz[functionalIndex]
    if (functionalSelected !== null || !question) return
    const correct = choice === question.correctIndex
    setFunctionalSelected(choice)
    setFunctionalAnswers((previous) => [...previous, { question, selected: choice, correct }])
  }
  const nextFunctional = () => { if (functionalIndex + 1 >= functionalQuiz.length) setScreen('functional-result'); else { setFunctionalIndex(functionalIndex + 1); setFunctionalSelected(null) } }
  const startMol = (difficulty: MolDifficulty, size: SetSize) => { setMolQuiz(createMolCalculationSet(difficulty, size)); setMolDifficulty(difficulty); setMolIndex(0); setMolInput(''); setMolAnswered(false); setMolAnswers([]); setScreen('mol') }
  const answerMol = () => {
    const question = molQuiz[molIndex]
    if (!question || molAnswered || molInput.trim() === '' || !Number.isFinite(Number(molInput))) return
    const correct = isCorrectMolAnswer(molInput, question.answerValue)
    setMolAnswered(true); setMolAnswers((previous) => [...previous, { question, input: molInput, correct }])
  }
  const nextMol = () => { if (molIndex + 1 >= molQuiz.length) setScreen('mol-result'); else { setMolIndex(molIndex + 1); setMolInput(''); setMolAnswered(false) } }
  const toggleExplanation = () => setShowExplanation((previous) => {
    const nextValue = !previous
    localStorage.setItem(explanationSettingKey, String(nextValue))
    return nextValue
  })

  return <main className="app"><header><span className="badge">乙4</span><div><h1>危険物取扱者 クイズ</h1><p>短時間で、確実に復習。</p></div></header>
    {screen === 'home' && <section className="home"><h2>今日の学習を選ぶ</h2><div className="menu">
      <button onClick={() => { setNormalSize(10); setScreen('normal-options') }}><b>通常テスト</b><span>10・20・35・50問から選択</span></button>
      <button onClick={() => setScreen('category')}><b>分野別</b><span>苦手な分野を重点復習</span></button>
      <button onClick={() => start('mistakes', undefined, normalSize)}><b>間違えた問題</b><span>不正解だった問題を優先</span></button>
      <button onClick={() => start('random', undefined, 'all')}><b>全問題からランダム</b><span>全{questions.length}問をランダム出題</span></button>
      <button className="dojo-menu" onClick={() => setScreen('flash-options')}><b>引火点道場</b><span>石油類の区分を反復特訓</span></button>
      <button className="quantity-menu" onClick={() => setScreen('quantity-menu')}><b>指定数量道場</b><span>指定数量の暗記と倍数計算を特訓</span></button>
      <button className="substance-menu" onClick={() => setScreen('substance-menu')}><b>物質分類道場</b><span>石油類と水溶性を代表物質から判定</span></button>
      <button className="functional-menu" onClick={() => setScreen('functional-options')}><b>官能基道場</b><span>物質名と官能基を5肢択一で反復</span></button>
      <button className="mol-menu" onClick={() => setScreen('mol-menu')}><b>mol計算道場</b><span>数値入力でmol計算を反復</span></button>
    </div><ExplanationToggle enabled={showExplanation} onToggle={toggleExplanation} /><p className="note">回答履歴はこの端末内に保存されます。</p></section>}
    {screen === 'normal-options' && <NormalTestMenu size={normalSize} onSizeChange={setNormalSize} onBack={() => setScreen('home')} onStart={() => start('random', undefined, normalSize)} />}
    {screen === 'category' && <section><button className="back" onClick={() => setScreen('home')}>← トップへ戻る</button><h2>分野を選ぶ</h2><div className="menu">{categories.map((category) => <button key={category} onClick={() => { setCategoryScope(category); setNormalSize(10); setScreen('category-options') }}><b>{category}</b><span>{questions.filter((q) => q.category === category).length}問から出題</span></button>)}</div></section>}
    {screen === 'category-options' && categoryScope && <CategoryTestMenu category={categoryScope} available={questions.filter((q) => q.category === categoryScope).length} size={normalSize === 35 || normalSize === 50 ? 10 : normalSize} onSizeChange={setNormalSize} onBack={() => setScreen('category')} onStart={() => start('category', categoryScope, normalSize)} />}
    {screen === 'quiz' && current && <Quiz question={current} index={index} total={quiz.length} selected={selected} showExplanation={showExplanation} onToggleExplanation={toggleExplanation} onAnswer={answer} onNext={next} onQuit={() => setScreen('home')} />}
    {screen === 'result' && <Results answers={answers} mode={mode} onHome={() => setScreen('home')} onRetry={() => start(mode, categoryScope, quiz.length as NormalSize)} onMistakes={() => start('mistakes', undefined, normalSize)} />}
    {screen === 'dojo' && dojoQuiz[dojoIndex] && <DojoQuiz question={dojoQuiz[dojoIndex]} index={dojoIndex} total={dojoQuiz.length} selected={dojoSelected} showExplanation={showExplanation} onToggleExplanation={toggleExplanation} onAnswer={answerDojo} onNext={nextDojo} onQuit={() => setScreen('home')} />}
    {screen === 'flash-options' && <SetLengthMenu title="引火点道場" description="石油類の引火点区分を反復します。" size={setSize} onSizeChange={setSetSize} onBack={() => setScreen('home')} onStart={() => startDojo(setSize)} />}
    {screen === 'dojo-result' && <DojoResults answers={dojoAnswers} onHome={() => setScreen('home')} onRetry={() => startDojo(dojoQuiz.length as SetSize)} />}
    {screen === 'quantity-menu' && <QuantityMenu size={setSize} onSizeChange={setSetSize} onBack={() => setScreen('home')} onStart={startQuantity} />}
    {screen === 'quantity' && quantityQuiz[quantityIndex] && <QuantityQuiz question={quantityQuiz[quantityIndex]} index={quantityIndex} total={quantityQuiz.length} selected={quantitySelected} showExplanation={showExplanation} onToggleExplanation={toggleExplanation} onAnswer={answerQuantity} onNext={nextQuantity} onQuit={() => setScreen('home')} />}
    {screen === 'quantity-result' && <QuantityResults answers={quantityAnswers} onHome={() => setScreen('home')} onRetry={() => startQuantity(quantityMode, quantityQuiz.length as SetSize)} />}
    {screen === 'substance-menu' && <SubstanceMenu size={setSize} onSizeChange={setSetSize} onBack={() => setScreen('home')} onStart={startSubstance} />}
    {screen === 'substance' && substanceQuiz[substanceIndex] && <SubstanceQuiz question={substanceQuiz[substanceIndex]} index={substanceIndex} total={substanceQuiz.length} selected={substanceSelected} showExplanation={showExplanation} onToggleExplanation={toggleExplanation} onAnswer={answerSubstance} onNext={nextSubstance} onQuit={() => setScreen('home')} />}
    {screen === 'substance-result' && <SubstanceResults answers={substanceAnswers} onHome={() => setScreen('home')} onRetry={() => startSubstance(substanceMode, substanceQuiz.length as SetSize)} />}
    {screen === 'functional-options' && <SetLengthMenu title="官能基道場" description="物質名と官能基を5肢択一で反復します。" size={setSize} onSizeChange={setSetSize} onBack={() => setScreen('home')} onStart={() => startFunctional(setSize)} />}
    {screen === 'functional' && functionalQuiz[functionalIndex] && <FunctionalQuiz question={functionalQuiz[functionalIndex]} index={functionalIndex} total={functionalQuiz.length} selected={functionalSelected} showExplanation={showExplanation} onToggleExplanation={toggleExplanation} onAnswer={answerFunctional} onNext={nextFunctional} onQuit={() => setScreen('home')} />}
    {screen === 'functional-result' && <FunctionalResults answers={functionalAnswers} onHome={() => setScreen('home')} onRetry={() => startFunctional(functionalQuiz.length as SetSize)} />}
    {screen === 'mol-menu' && <MolMenu size={setSize} onSizeChange={setSetSize} onBack={() => setScreen('home')} onStart={startMol} />}
    {screen === 'mol' && molQuiz[molIndex] && <MolQuiz question={molQuiz[molIndex]} index={molIndex} total={molQuiz.length} input={molInput} answered={molAnswered} onInput={setMolInput} onAnswer={answerMol} onNext={nextMol} onQuit={() => setScreen('home')} />}
    {screen === 'mol-result' && <MolResults answers={molAnswers} onHome={() => setScreen('home')} onRetry={() => startMol(molDifficulty, molQuiz.length as SetSize)} />}
  </main>
}

function ExplanationToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return <button className="explanation-toggle" type="button" role="switch" aria-checked={enabled} onClick={onToggle}><span>解説を表示</span><i className={enabled ? 'on' : ''}><b /></i><em>{enabled ? 'ON' : 'OFF'}</em></button>
}

function SetLengthPicker({ size, onSizeChange }: { size: SetSize; onSizeChange: (size: SetSize) => void }) {
  return <div className="set-length-picker"><span>問題数</span><div>{([10, 20, 30] as SetSize[]).map((value) => <button key={value} className={size === value ? 'selected' : ''} onClick={() => onSizeChange(value)}>{value}問</button>)}</div></div>
}

function NormalTestMenu({ size, onSizeChange, onBack, onStart }: { size: NormalSize; onSizeChange: (size: NormalSize) => void; onBack: () => void; onStart: () => void }) {
  const options: NormalSize[] = [10, 20, 35, 50]
  return <section><button className="back" onClick={onBack}>← トップへ戻る</button><h2>通常テスト</h2><p className="menu-intro">5肢択一で、全{questions.length}問からランダムに出題します。</p><div className="set-length-picker normal-length-picker"><span>問題数</span><div>{options.map((value) => <button key={value} className={size === value ? 'selected' : ''} onClick={() => onSizeChange(value)}>{value}問</button>)}</div></div><button className="next start-dojo" onClick={onStart}>{size}問で始める</button></section>
}

function CategoryTestMenu({ category, available, size, onSizeChange, onBack, onStart }: { category: Category; available: number; size: 10 | 20 | 'all'; onSizeChange: (size: NormalSize) => void; onBack: () => void; onStart: () => void }) {
  const options: (10 | 20 | 'all')[] = [10, 20, 'all']
  return <section><button className="back" onClick={onBack}>← 分野を選ぶ</button><h2>{category}</h2><p className="menu-intro">全{available}問から5肢択一で出題します。</p><div className="set-length-picker normal-length-picker"><span>問題数</span><div>{options.map((value) => <button key={value} className={size === value ? 'selected' : ''} onClick={() => onSizeChange(value)}>{value === 'all' ? '全問' : `${value}問`}</button>)}</div></div><button className="next start-dojo" onClick={onStart}>{size === 'all' ? '全問で始める' : `${size}問で始める`}</button></section>
}

function SetLengthMenu({ title, description, size, onSizeChange, onBack, onStart }: { title: string; description: string; size: SetSize; onSizeChange: (size: SetSize) => void; onBack: () => void; onStart: () => void }) {
  return <section><button className="back" onClick={onBack}>← トップへ戻る</button><h2>{title}</h2><p className="menu-intro">{description}</p><SetLengthPicker size={size} onSizeChange={onSizeChange} /><button className="next start-dojo" onClick={onStart}>{size}問で始める</button></section>
}

function Quiz({ question, index, total, selected, showExplanation, onToggleExplanation, onAnswer, onNext, onQuit }: { question: Question; index: number; total: number; selected: number | null; showExplanation: boolean; onToggleExplanation: () => void; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz"><div className="progress"><span>問題 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div><ExplanationToggle enabled={showExplanation} onToggle={onToggleExplanation} />
    <div className="meta"><span>{question.category}</span><span>{question.subcategory}</span></div><h2 className="question">{question.question}</h2>
    <div className="choices">{question.choices.map((choice, i) => <button key={choice} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="answer-line">正解：{String.fromCharCode(65 + question.correctIndex)} {' '}{question.choices[question.correctIndex]}</p>{showExplanation && <p>{question.explanation}</p>}<button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>クイズを中止してトップへ</button>}
  </section>
}

function DojoQuiz({ question, index, total, selected, showExplanation, onToggleExplanation, onAnswer, onNext, onQuit }: { question: FlashPointQuestion; index: number; total: number; selected: number | null; showExplanation: boolean; onToggleExplanation: () => void; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz dojo"><div className="progress"><span>引火点道場 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div><ExplanationToggle enabled={showExplanation} onToggle={onToggleExplanation} />
    <div className="meta"><span>石油類</span><span>引火点区分</span></div><h2 className="question">引火点 <em>{question.temperature}℃</em> の物質は第何石油類？</h2>
    <div className="choices">{question.choices.map((choice, i) => <button key={choice} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="answer-line">正解：{question.answer}</p>{showExplanation && <p className="range">{question.range}</p>}<button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>道場を中止してトップへ</button>}
  </section>
}

function QuantityMenu({ size, onSizeChange, onBack, onStart }: { size: SetSize; onSizeChange: (size: SetSize) => void; onBack: () => void; onStart: (mode: QuantityMode, size: SetSize) => void }) {
  return <section><button className="back" onClick={onBack}>← トップへ戻る</button><h2>指定数量道場</h2><p className="menu-intro">指定数量を答えに表示せず、暗記と倍数計算を繰り返します。</p><SetLengthPicker size={size} onSizeChange={onSizeChange} /><div className="menu quantity-mode-menu">
    <button onClick={() => onStart('memory', size)}><b>指定数量暗記</b><span>区分や物質から指定数量を答える</span></button>
    <button onClick={() => onStart('calculation', size)}><b>倍数計算</b><span>指定数量を思い出して倍数を計算する</span></button>
    <button onClick={() => onStart('mix', size)}><b>ミックス</b><span>暗記と単一・複数の倍数計算を実戦形式で</span></button>
  </div></section>
}

function QuantityQuiz({ question, index, total, selected, showExplanation, onToggleExplanation, onAnswer, onNext, onQuit }: { question: QuantityQuestion; index: number; total: number; selected: number | null; showExplanation: boolean; onToggleExplanation: () => void; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz quantity-quiz"><div className="progress"><span>指定数量道場 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div><ExplanationToggle enabled={showExplanation} onToggle={onToggleExplanation} />
    <div className="meta"><span>第4類危険物</span><span>指定数量</span></div><h2 className="question">{question.title}</h2>
    <div className="choices">{question.choices.map((choice, i) => <button key={`${question.id}-${choice}`} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="answer-line">正解：{question.answer}</p>{showExplanation && <p className="calculation-explanation">{question.explanation}</p>}<button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>道場を中止してトップへ</button>}
  </section>
}

function SubstanceMenu({ size, onSizeChange, onBack, onStart }: { size: SetSize; onSizeChange: (size: SetSize) => void; onBack: () => void; onStart: (mode: SubstanceMode, size: SetSize) => void }) {
  return <section><button className="back" onClick={onBack}>← トップへ戻る</button><h2>物質分類道場</h2><p className="menu-intro">代表物質から、石油類と水溶性を反射的に判定します。</p><SetLengthPicker size={size} onSizeChange={onSizeChange} /><div className="menu substance-mode-menu">
    <button onClick={() => onStart('petroleum', size)}><b>石油類判定</b><span>第1〜第3石油類を答える</span></button>
    <button onClick={() => onStart('solubility', size)}><b>水溶性判定</b><span>水溶性か非水溶性かを2択で答える</span></button>
    <button onClick={() => onStart('combined', size)}><b>総合判定</b><span>石油類と水溶性を同時に答える</span></button>
  </div></section>
}

function SubstanceQuiz({ question, index, total, selected, showExplanation, onToggleExplanation, onAnswer, onNext, onQuit }: { question: SubstanceQuestion; index: number; total: number; selected: number | null; showExplanation: boolean; onToggleExplanation: () => void; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz substance-quiz"><div className="progress"><span>物質分類道場 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div><ExplanationToggle enabled={showExplanation} onToggle={onToggleExplanation} />
    <div className="meta"><span>第4類危険物</span><span>物質分類</span></div><h2 className="question">{question.title}</h2>
    <div className={`choices ${question.choices.length === 2 ? 'two-choice' : ''}`}>{question.choices.map((choice, i) => <button key={`${question.id}-${choice}`} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="answer-line">正解：{question.answer}</p>{showExplanation && <p className="calculation-explanation">{question.explanation}</p>}<button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>道場を中止してトップへ</button>}
  </section>
}

function FunctionalQuiz({ question, index, total, selected, showExplanation, onToggleExplanation, onAnswer, onNext, onQuit }: { question: FunctionalGroupQuestion; index: number; total: number; selected: number | null; showExplanation: boolean; onToggleExplanation: () => void; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz functional-quiz"><div className="progress"><span>官能基道場 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div><ExplanationToggle enabled={showExplanation} onToggle={onToggleExplanation} />
    <div className="meta"><span>基礎化学</span><span>官能基</span><span>5肢択一</span></div><h2 className="question">{question.title}</h2>
    <div className="choices five-choice">{question.choices.map((choice, i) => <button key={`${question.id}-${choice}`} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="answer-line">正解：{question.answer}</p>{showExplanation && <p className="calculation-explanation">{question.explanation}</p>}<button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>道場を中止してトップへ</button>}
  </section>
}

function MolMenu({ size, onSizeChange, onBack, onStart }: { size: SetSize; onSizeChange: (size: SetSize) => void; onBack: () => void; onStart: (difficulty: MolDifficulty, size: SetSize) => void }) {
  return <section><button className="back" onClick={onBack}>← トップへ戻る</button><h2>mol計算道場</h2><p className="menu-intro">選択肢を使わず、数値を入力してmol計算を練習します。</p><SetLengthPicker size={size} onSizeChange={onSizeChange} /><div className="menu mol-mode-menu">
    <button onClick={() => onStart('basic', size)}><b>基礎</b><span>問題文にモル質量を示して計算を練習</span></button>
    <button onClick={() => onStart('standard', size)}><b>標準</b><span>原子量からモル質量も求める</span></button>
  </div></section>
}

function MolQuiz({ question, index, total, input, answered, onInput, onAnswer, onNext, onQuit }: { question: MolQuestion; index: number; total: number; input: string; answered: boolean; onInput: (value: string) => void; onAnswer: () => void; onNext: () => void; onQuit: () => void }) {
  const correct = isCorrectMolAnswer(input, question.answerValue)
  const canSubmit = input.trim() !== '' && Number.isFinite(Number(input))
  const submit = (event: FormEvent) => { event.preventDefault(); if (canSubmit) onAnswer() }
  return <section className="quiz mol-quiz"><div className="progress"><span>mol計算道場 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
    <div className="meta"><span>{question.difficulty === 'basic' ? '基礎' : '標準'}</span><span>数値入力</span></div><h2 className="question">{question.title}</h2>
    <details className="mol-hint"><summary>計算のヒント</summary><p>g → mol：モル質量で割る<br />mol → g：モル質量を掛ける<br />mol → L：22.4を掛ける（標準状態）<br />L → mol：22.4で割る（標準状態）</p></details>
    <form className="mol-answer" onSubmit={submit}><label htmlFor="mol-input">答え</label><div><input id="mol-input" type="text" inputMode="decimal" autoComplete="off" disabled={answered} value={input} onChange={(event) => onInput(event.target.value)} aria-describedby="mol-unit" /><span id="mol-unit">{question.unit}</span></div>{!answered && <button className="next" type="submit" disabled={!canSubmit}>回答を確定</button>}</form>
    {answered && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="answer-line">正解：{question.answer}</p><p className="calculation-explanation">{question.explanation}</p><button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {!answered && <button className="quit" onClick={onQuit}>道場を中止してトップへ</button>}
  </section>
}

function Results({ answers, mode, onHome, onRetry, onMistakes }: { answers: Answer[]; mode: Mode; onHome: () => void; onRetry: () => void; onMistakes: () => void }) {
  const score = answers.filter((a) => a.correct).length
  const stats = useMemo(() => categories.map((category) => { const list = answers.filter((a) => a.question.category === category); return { category, total: list.length, correct: list.filter((a) => a.correct).length } }), [answers])
  const incorrect = answers.filter((a) => !a.correct)
  return <section className="result"><div className="score"><p>結果</p><h2>{score}<small> / {answers.length} 問正解</small></h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div><h3>分野ごとの成績</h3><div className="stats">{stats.map((s) => <div key={s.category}><span>{s.category}</span><b>{s.total ? `${s.correct} / ${s.total}` : '出題なし'}</b></div>)}</div>
    {incorrect.length > 0 && <><h3>間違えた問題</h3><div className="wrong">{incorrect.map((a) => <article key={a.question.id}><span>{a.question.category}</span><p>{a.question.question}</p><small>正解：{String.fromCharCode(65 + a.question.correctIndex)} {' '}{a.question.choices[a.question.correctIndex]}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>もう一度</button>{incorrect.length > 0 && mode !== 'mistakes' && <button onClick={onMistakes}>間違えた問題だけ復習</button>}<button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}

function DojoResults({ answers, onHome, onRetry }: { answers: DojoAnswer[]; onHome: () => void; onRetry: () => void }) {
  const score = answers.filter((answer) => answer.correct).length
  const incorrect = answers.filter((answer) => !answer.correct)
  const perfect = answers.length > 0 && score === answers.length
  return <section className="result dojo-result"><div className={`score ${perfect ? 'perfect' : ''}`}><p>引火点道場 結果</p><h2>{perfect ? `${score} / ${answers.length} 全問正解` : <>{score}<small> / {answers.length} 問正解</small></>}</h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div>
    {incorrect.length > 0 && <><h3>間違えた温度</h3><div className="wrong">{incorrect.map((answer) => <article key={answer.question.temperature}><span>引火点 {answer.question.temperature}℃</span><p>正解：{answer.question.answer}</p><small>{answer.question.range}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>もう一度 道場に挑戦</button><button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}

function QuantityResults({ answers, onHome, onRetry }: { answers: QuantityAnswer[]; onHome: () => void; onRetry: () => void }) {
  const score = answers.filter((answer) => answer.correct).length
  const incorrect = answers.filter((answer) => !answer.correct)
  const perfect = answers.length > 0 && score === answers.length
  return <section className="result quantity-result"><div className={`score ${perfect ? 'perfect' : ''}`}><p>指定数量道場 結果</p><h2>{perfect ? `${score} / ${answers.length} 全問正解` : <>{score}<small> / {answers.length} 問正解</small></>}</h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div>
    {incorrect.length > 0 && <><h3>間違えた問題</h3><div className="wrong">{incorrect.map((answer) => <article key={answer.question.id}><span>{answer.question.wrongLabel}</span><p>{answer.question.title}</p><small>正解：{answer.question.answer}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>同じモードでもう一度</button><button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}

function SubstanceResults({ answers, onHome, onRetry }: { answers: SubstanceAnswer[]; onHome: () => void; onRetry: () => void }) {
  const score = answers.filter((answer) => answer.correct).length
  const incorrect = answers.filter((answer) => !answer.correct)
  const petroleumMistakes = incorrect.filter((answer) => answer.question.mistakeType === '石油類').length
  const solubilityMistakes = incorrect.filter((answer) => answer.question.mistakeType === '水溶性').length
  const combinedMistakes = incorrect.filter((answer) => answer.question.mistakeType === '総合').length
  const perfect = answers.length > 0 && score === answers.length
  return <section className="result substance-result"><div className={`score ${perfect ? 'perfect' : ''}`}><p>物質分類道場 結果</p><h2>{perfect ? `${score} / ${answers.length} 全問正解` : <>{score}<small> / {answers.length} 問正解</small></>}</h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div>
    {incorrect.length > 0 && <><h3>間違えた物質</h3><div className="wrong">{incorrect.map((answer) => <article key={answer.question.id}><span>{answer.question.substance.name}・{answer.question.mistakeType}を間違えた</span><p>{answer.question.title}</p><small>正解：{answer.question.answer}</small></article>)}</div><p className="mistake-summary">石油類を間違えた：{petroleumMistakes}問 {' '}水溶性を間違えた：{solubilityMistakes}問 {' '}総合判定を間違えた：{combinedMistakes}問</p></>}
    <div className="actions"><button className="next" onClick={onRetry}>同じモードでもう一度</button><button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}

function FunctionalResults({ answers, onHome, onRetry }: { answers: FunctionalAnswer[]; onHome: () => void; onRetry: () => void }) {
  const score = answers.filter((answer) => answer.correct).length
  const incorrect = answers.filter((answer) => !answer.correct)
  const perfect = answers.length > 0 && score === answers.length
  return <section className="result functional-result"><div className={`score ${perfect ? 'perfect' : ''}`}><p>官能基道場 結果</p><h2>{perfect ? `${score} / ${answers.length} 全問正解` : <>{score}<small> / {answers.length} 問正解</small></>}</h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div>
    {incorrect.length > 0 && <><h3>間違えた問題</h3><div className="wrong">{incorrect.map((answer) => <article key={answer.question.id}><span>官能基</span><p>{answer.question.title}</p><small>正解：{answer.question.answer}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>もう一度 道場に挑戦</button><button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}

function MolResults({ answers, onHome, onRetry }: { answers: MolAnswer[]; onHome: () => void; onRetry: () => void }) {
  const score = answers.filter((answer) => answer.correct).length
  const incorrect = answers.filter((answer) => !answer.correct)
  const perfect = answers.length > 0 && score === answers.length
  return <section className="result mol-result"><div className={`score ${perfect ? 'perfect' : ''}`}><p>mol計算道場 結果</p><h2>{perfect ? `${score} / ${answers.length} 全問正解` : <>{score}<small> / {answers.length} 問正解</small></>}</h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div>
    {incorrect.length > 0 && <><h3>間違えた問題</h3><div className="wrong">{incorrect.map((answer) => <article key={`${answer.question.id}-${answer.input}`}><span>{answer.question.unit}を答える問題</span><p>{answer.question.title}</p><small>入力：{answer.input} / 正解：{answer.question.answer}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>同じ難易度でもう一度</button><button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}
