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
    <div
      className="bg-survey flex flex-col items-center min-h-screen"
      style={{ padding: '24px 16px 32px' }}
    >
      {/* Floating blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, overflow: 'hidden',
          pointerEvents: 'none', zIndex: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '-8rem', right: '-6rem',
          width: '20rem', height: '20rem',
          background: 'rgba(255,182,210,0.25)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8rem', left: '-6rem',
          width: '20rem', height: '20rem',
          background: 'rgba(216,180,254,0.22)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
      </div>

      <div className="relative w-full z-10" style={{ maxWidth: 560 }}>

        {/* Brand header */}
        <div className="text-center" style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#F472B6', marginBottom: 6,
          }}>
            ✨ Шамшат ұстаз ✨
          </p>
          <h1 style={{
            fontSize: 'clamp(22px, 6vw, 30px)',
            fontWeight: 800,
            lineHeight: 1.2,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #C44B8A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
            paddingBottom: 2,
          }}>
            Сауалнама
          </h1>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#F472B6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Прогресс
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#C44B8A' }}>
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#FCE7F3', borderRadius: 99, overflow: 'hidden' }}>
            <div className="progress-fill" style={{ height: '100%', borderRadius: 99, width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div
          key={animKey}
          className="glass-card fade-in-up"
          style={{ borderRadius: 24, padding: 'clamp(16px, 4vw, 32px)' }}
        >
          {/* Badge */}
          <span style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 700, color: 'white',
            padding: '4px 12px', borderRadius: 99, marginBottom: 12,
            background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
          }}>
            {currentIndex + 1}-сұрақ
          </span>

          {/* Question text */}
          <h2 style={{
            fontSize: 'clamp(14px, 4vw, 18px)',
            fontWeight: 600,
            color: '#1F2937',
            lineHeight: 1.6,
            marginBottom: 20,
          }}>
            {question.text}
          </h2>

          {/* Radio options */}
          {question.type === 'radio' && question.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {question.options.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectOption(opt.label)}
                  className={`option-btn ${answer === opt.label ? 'chosen' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 16,
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: answer === opt.label ? '2px solid #C44B8A' : '2px solid #FFB3D1',
                    background: answer === opt.label
                      ? 'linear-gradient(135deg, #FF6B9D, #C44B8A)'
                      : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {answer === opt.label && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />
                    )}
                  </span>
                  <span style={{
                    fontSize: 'clamp(13px, 3.5vw, 15px)',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: answer === opt.label ? '#9D174D' : '#374151',
                    textAlign: 'left',
                  }}>
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
              onChange={e => {
                selectOption(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Жауабыңызды осында жазыңыз..."
              rows={6}
              style={{
                width: '100%',
                minHeight: 140,
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                color: '#374151',
                resize: 'none',
                outline: 'none',
                border: `2px solid ${answer ? '#FF6B9D' : 'rgba(255,182,210,0.5)'}`,
                background: 'rgba(255, 240, 247, 0.5)',
                fontFamily: 'inherit',
                lineHeight: 1.7,
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                overflow: 'hidden',
              }}
            />
          )}

          {/* Navigation buttons */}
          <div
            className="flex items-center"
            style={{ marginTop: 20, justifyContent: 'space-between' }}
          >
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(i => i - 1)
                  setAnimKey(k => k + 1)
                }}
                style={{
                  fontSize: 13, fontWeight: 500, color: '#F472B6',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0',
                }}
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
              className="pink-btn"
              style={{
                color: 'white', fontWeight: 600,
                padding: '11px 24px', borderRadius: 16,
                fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {isLast ? 'Жіберу' : 'Далее'}
              <span>{isLast ? '✓' : '→'}</span>
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div
          aria-hidden="true"
          style={{
            display: 'flex', justifyContent: 'center',
            gap: 6, marginTop: 16, flexWrap: 'wrap',
          }}
        >
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
                flexShrink: 0,
              }}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
