import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { questions } from '../data/questions'
import { saveResponse } from '../utils/storage'
import type { Answer, SurveyResponse } from '../types'

export default function SurveyPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [animKey, setAnimKey] = useState(0)

  const question = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const answer = answers[question.id] ?? ''
  const canProceed = answer.trim() !== ''
  const progress = (currentIndex / questions.length) * 100

  function selectOption(value: string) {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
  }

  function handleNext() {
    if (!canProceed) return

    if (isLast) {
      const answerList: Answer[] = Object.entries(answers).map(([qId, value]) => ({
        questionId: Number(qId),
        value,
      }))
      const response: SurveyResponse = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        answers: answerList,
      }
      saveResponse(response)
      navigate('/thank-you')
      return
    }

    setCurrentIndex(i => i + 1)
    setAnimKey(k => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bg-survey flex flex-col items-center justify-center min-h-screen p-4 py-10">
      {/* Floating blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '-10rem', right: '-8rem',
          width: '26rem', height: '26rem',
          background: 'rgba(255,182,210,0.25)', borderRadius: '50%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10rem', left: '-8rem',
          width: '26rem', height: '26rem',
          background: 'rgba(216,180,254,0.22)', borderRadius: '50%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '32rem', height: '32rem',
          background: 'rgba(255,228,240,0.15)', borderRadius: '50%', filter: 'blur(80px)',
        }} />
      </div>

      <div className="relative w-full max-w-xl z-10">
        {/* Brand header */}
        <div className="text-center mb-7">
          <p className="text-sm font-medium text-pink-400 tracking-widest uppercase mb-1">✨ Шамшат ұстаз ✨</p>
          <h1 className="text-3xl font-bold pink-gradient-text">Сауалнама</h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Прогресс</span>
            <span className="text-xs font-bold text-pink-600">{currentIndex + 1} / {questions.length}</span>
          </div>
          <div className="w-full h-2.5 bg-pink-100 rounded-full overflow-hidden">
            <div className="progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div key={animKey} className="glass-card rounded-3xl p-8 fade-in-up">
          {/* Badge */}
          <span
            className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)' }}
          >
            {currentIndex + 1}-сұрақ
          </span>

          {/* Question text */}
          <h2 className="text-lg font-semibold text-gray-800 leading-relaxed mb-6">
            {question.text}
          </h2>

          {/* Radio options */}
          {question.type === 'radio' && question.options && (
            <div className="space-y-3">
              {question.options.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectOption(opt.label)}
                  className={`option-btn flex items-center gap-3 px-4 py-3.5 rounded-2xl ${
                    answer === opt.label ? 'chosen' : ''
                  }`}
                >
                  {/* Radio circle */}
                  <span
                    style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: answer === opt.label ? '2px solid #C44B8A' : '2px solid #FFB3D1',
                      background: answer === opt.label
                        ? 'linear-gradient(135deg, #FF6B9D, #C44B8A)'
                        : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {answer === opt.label && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />
                    )}
                  </span>
                  <span className={`text-sm font-medium leading-snug ${
                    answer === opt.label ? 'text-pink-700' : 'text-gray-700'
                  }`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Text input */}
          {question.type === 'text' && (
            <textarea
              value={answer}
              onChange={e => selectOption(e.target.value)}
              placeholder="Жауабыңызды осында жазыңыз..."
              rows={4}
              className="w-full rounded-2xl p-4 text-sm text-gray-700 resize-none focus:outline-none transition-colors"
              style={{
                border: '2px solid',
                borderColor: answer ? '#FF6B9D' : 'rgba(255,182,210,0.5)',
                background: 'rgba(255, 240, 247, 0.5)',
                fontFamily: 'inherit',
              }}
            />
          )}

          {/* Next / Submit button */}
          <div className="flex justify-between items-center mt-8">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(i => i - 1)
                  setAnimKey(k => k + 1)
                }}
                className="text-sm text-pink-400 hover:text-pink-600 font-medium transition-colors flex items-center gap-1"
              >
                ← Артқа
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="pink-btn text-white font-semibold px-7 py-3 rounded-2xl flex items-center gap-2 text-sm"
            >
              {isLast ? 'Жіберу' : 'Далее'}
              <span>{isLast ? '✓' : '→'}</span>
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center mt-5 gap-1.5" aria-hidden="true">
          {questions.map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 99,
                height: 6,
                width: i === currentIndex ? 20 : 6,
                background: i < currentIndex
                  ? 'linear-gradient(90deg, #FF9BC7, #C44B8A)'
                  : i === currentIndex
                    ? 'linear-gradient(90deg, #FF6B9D, #C44B8A)'
                    : 'rgba(255,182,210,0.35)',
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
