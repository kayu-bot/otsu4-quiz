import { useMemo, useState } from 'react'
import { questions } from './data/questions'
import { createFlashPointDojoSet, type FlashPointQuestion } from './data/flashPointDojo'
import type { Category, History, Question } from './types'

type Screen = 'home' | 'category' | 'quiz' | 'result' | 'dojo' | 'dojo-result'
type Mode = 'ten' | 'random' | 'mistakes' | 'category'
type Answer = { question: Question; selected: number; correct: boolean }
type DojoAnswer = { question: FlashPointQuestion; selected: number; correct: boolean }
const historyKey = 'otsu4-quiz-learning-history'
const categories: Category[] = ['法令', '物理化学', '性質消火']
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
const readHistory = (): History => { try { return JSON.parse(localStorage.getItem(historyKey) ?? '{}') as History } catch { return {} } }

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

  const current = quiz[index]
  const start = (nextMode: Mode, category?: Category) => {
    let pool = category ? questions.filter((q) => q.category === category) : [...questions]
    if (nextMode === 'mistakes') {
      const experienced = pool.filter((q) => history[q.id] && history[q.id].incorrect > 0)
      if (experienced.length === 0) { window.alert('まだ間違えた問題がありません。まず通常のクイズに挑戦してみましょう。'); return }
      pool = experienced
    }
    const count = nextMode === 'ten' ? Math.min(10, pool.length) : pool.length
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
  const startDojo = () => { setDojoQuiz(createFlashPointDojoSet()); setDojoIndex(0); setDojoSelected(null); setDojoAnswers([]); setScreen('dojo') }
  const answerDojo = (choice: number) => {
    const question = dojoQuiz[dojoIndex]
    if (dojoSelected !== null || !question) return
    const correct = choice === question.correctIndex
    setDojoSelected(choice)
    setDojoAnswers((previous) => [...previous, { question, selected: choice, correct }])
  }
  const nextDojo = () => { if (dojoIndex + 1 >= dojoQuiz.length) setScreen('dojo-result'); else { setDojoIndex(dojoIndex + 1); setDojoSelected(null) } }

  return <main className="app"><header><span className="badge">乙4</span><div><h1>危険物取扱者 クイズ</h1><p>短時間で、確実に復習。</p></div></header>
    {screen === 'home' && <section className="home"><h2>今日の学習を選ぶ</h2><div className="menu">
      <button onClick={() => start('ten')}><b>10問クイズ</b><span>まずは短く腕試し</span></button>
      <button onClick={() => setScreen('category')}><b>分野別</b><span>苦手な分野を重点復習</span></button>
      <button onClick={() => start('mistakes')}><b>間違えた問題</b><span>不正解だった問題を優先</span></button>
      <button onClick={() => start('random')}><b>全問題からランダム</b><span>全{questions.length}問をランダム出題</span></button>
      <button className="dojo-menu" onClick={startDojo}><b>引火点道場</b><span>石油類の区分を10問で特訓</span></button>
    </div><p className="note">回答履歴はこの端末内に保存されます。</p></section>}
    {screen === 'category' && <section><button className="back" onClick={() => setScreen('home')}>← トップへ戻る</button><h2>分野を選ぶ</h2><div className="menu">{categories.map((category) => <button key={category} onClick={() => start('category', category)}><b>{category}</b><span>{questions.filter((q) => q.category === category).length}問からランダム出題</span></button>)}</div></section>}
    {screen === 'quiz' && current && <Quiz question={current} index={index} total={quiz.length} selected={selected} onAnswer={answer} onNext={next} onQuit={() => setScreen('home')} />}
    {screen === 'result' && <Results answers={answers} mode={mode} onHome={() => setScreen('home')} onRetry={() => start(mode, categoryScope)} onMistakes={() => start('mistakes')} />}
    {screen === 'dojo' && dojoQuiz[dojoIndex] && <DojoQuiz question={dojoQuiz[dojoIndex]} index={dojoIndex} total={dojoQuiz.length} selected={dojoSelected} onAnswer={answerDojo} onNext={nextDojo} onQuit={() => setScreen('home')} />}
    {screen === 'dojo-result' && <DojoResults answers={dojoAnswers} onHome={() => setScreen('home')} onRetry={startDojo} />}
  </main>
}

function Quiz({ question, index, total, selected, onAnswer, onNext, onQuit }: { question: Question; index: number; total: number; selected: number | null; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz"><div className="progress"><span>問題 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
    <div className="meta"><span>{question.category}</span><span>{question.subcategory}</span></div><h2 className="question">{question.question}</h2>
    <div className="choices">{question.choices.map((choice, i) => <button key={choice} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p>{question.explanation}</p><button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>クイズを中止してトップへ</button>}
  </section>
}

function DojoQuiz({ question, index, total, selected, onAnswer, onNext, onQuit }: { question: FlashPointQuestion; index: number; total: number; selected: number | null; onAnswer: (n: number) => void; onNext: () => void; onQuit: () => void }) {
  const correct = selected === question.correctIndex
  return <section className="quiz dojo"><div className="progress"><span>引火点道場 {index + 1} / {total}</span><span>残り {total - index - 1} 問</span></div><div className="bar"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
    <div className="meta"><span>石油類</span><span>引火点区分</span></div><h2 className="question">引火点 <em>{question.temperature}℃</em> の物質は第何石油類？</h2>
    <div className="choices">{question.choices.map((choice, i) => <button key={choice} className={selected === null ? '' : i === question.correctIndex ? 'correct' : i === selected ? 'incorrect' : 'muted'} onClick={() => onAnswer(i)}><strong>{String.fromCharCode(65 + i)}</strong>{choice}</button>)}</div>
    {selected !== null && <div className={`feedback ${correct ? 'yes' : 'no'}`}><b>{correct ? '正解！' : '不正解'}</b><p className="range">{question.range}</p><button className="next" onClick={onNext}>{index + 1 === total ? '結果を見る' : '次へ'}</button></div>}
    {selected === null && <button className="quit" onClick={onQuit}>道場を中止してトップへ</button>}
  </section>
}

function Results({ answers, mode, onHome, onRetry, onMistakes }: { answers: Answer[]; mode: Mode; onHome: () => void; onRetry: () => void; onMistakes: () => void }) {
  const score = answers.filter((a) => a.correct).length
  const stats = useMemo(() => categories.map((category) => { const list = answers.filter((a) => a.question.category === category); return { category, total: list.length, correct: list.filter((a) => a.correct).length } }), [answers])
  const incorrect = answers.filter((a) => !a.correct)
  // The original result text contains a Japanese ideographic space for readability.
  // eslint-disable-next-line no-irregular-whitespace
  return <section className="result"><div className="score"><p>結果</p><h2>{score}<small> / {answers.length} 問正解</small></h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div><h3>分野ごとの成績</h3><div className="stats">{stats.map((s) => <div key={s.category}><span>{s.category}</span><b>{s.total ? `${s.correct} / ${s.total}` : '出題なし'}</b></div>)}</div>
    {incorrect.length > 0 && <><h3>間違えた問題</h3><div className="wrong">{incorrect.map((a) => <article key={a.question.id}><span>{a.question.category}</span><p>{a.question.question}</p><small>正解：{String.fromCharCode(65 + a.question.correctIndex)}　{a.question.choices[a.question.correctIndex]}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>もう一度</button>{incorrect.length > 0 && mode !== 'mistakes' && <button onClick={onMistakes}>間違えた問題だけ復習</button>}<button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}

function DojoResults({ answers, onHome, onRetry }: { answers: DojoAnswer[]; onHome: () => void; onRetry: () => void }) {
  const score = answers.filter((answer) => answer.correct).length
  const incorrect = answers.filter((answer) => !answer.correct)
  const perfect = score === 10
  return <section className="result dojo-result"><div className={`score ${perfect ? 'perfect' : ''}`}><p>引火点道場 結果</p><h2>{perfect ? '10 / 10 全問正解' : <>{score}<small> / 10 問正解</small></>}</h2><b>正答率 {answers.length ? Math.round((score / answers.length) * 100) : 0}%</b></div>
    {incorrect.length > 0 && <><h3>間違えた温度</h3><div className="wrong">{incorrect.map((answer) => <article key={answer.question.temperature}><span>引火点 {answer.question.temperature}℃</span><p>正解：{answer.question.answer}</p><small>{answer.question.range}</small></article>)}</div></>}
    <div className="actions"><button className="next" onClick={onRetry}>もう一度 道場に挑戦</button><button className="back" onClick={onHome}>トップへ戻る</button></div></section>
}
