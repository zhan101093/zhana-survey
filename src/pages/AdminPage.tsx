import { useState, useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { questions } from '../data/questions'
import { getResponses, clearResponses } from '../utils/storage'
import type { SurveyResponse } from '../types'

const ADMIN_PASSWORD = 'admin2024'

const PALETTE = [
  '#FF6B9D', // қызғылт
  '#6C63FF', // күлгін
  '#00C9A7', // жасыл-бирюза
  '#FF9F43', // қызғылт-сары
  '#4ECDC4', // ашық көк
  '#FF6348', // қызыл-қызғылт
  '#1DD1A1', // жасыл
  '#5F27CD', // қою күлгін
  '#FED330', // сары
  '#2E86DE', // көк
]

interface StatItem {
  name: string
  count: number
  percentage: number
}

interface QuestionStat {
  questionId: number
  questionText: string
  items: StatItem[]
  total: number
}

interface TextEntry {
  id: string
  timestamp: number
  value: string
}

function buildStats(responses: SurveyResponse[]): QuestionStat[] {
  return questions
    .filter(q => q.type === 'radio')
    .map(q => {
      const counts: Record<string, number> = {}
      q.options?.forEach(opt => { counts[opt.label] = 0 })

      responses.forEach(r => {
        const a = r.answers.find(x => x.questionId === q.id)
        if (a && counts[a.value] !== undefined) counts[a.value]++
      })

      const total = Object.values(counts).reduce((s, n) => s + n, 0)
      const items: StatItem[] = (q.options ?? []).map(opt => {
        const count = counts[opt.label] ?? 0
        return {
          name: opt.label,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      })

      return { questionId: q.id, questionText: q.text, items, total }
    })
}

function getTextAnswers(responses: SurveyResponse[], questionId: number): TextEntry[] {
  return responses.flatMap(r => {
    const a = r.answers.find(x => x.questionId === questionId)
    if (!a || !a.value.trim()) return []
    return [{ id: r.id, timestamp: r.timestamp, value: a.value }]
  })
}

// ─── Tooltip ────────────────────────────────────────────

interface PieTipProps {
  active?: boolean
  payload?: Array<{ payload: StatItem }>
}

function PieTip({ active, payload }: PieTipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'white', border: '1.5px solid rgba(255,182,210,0.5)',
      borderRadius: 12, padding: '10px 14px', fontSize: 13,
      boxShadow: '0 4px 16px rgba(196,75,138,0.12)',
    }}>
      <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: '#C44B8A', fontWeight: 700 }}>{d.percentage}%</p>
      <p style={{ color: '#9CA3AF' }}>{d.count} жауап</p>
    </div>
  )
}

// ─── Question Card ───────────────────────────────────────

interface StatCardProps {
  stat: QuestionStat
  mode: 'pie' | 'bar'
  index: number
}

function StatCard({ stat, mode, index }: StatCardProps) {
  const sorted = [...stat.items].sort((a, b) => b.count - a.count)
  const displayItems = mode === 'pie' ? stat.items : sorted

  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)',
      border: '1.5px solid rgba(255,182,210,0.35)',
      borderRadius: 24,
      padding: 'clamp(20px,4vw,32px)',
      boxShadow: '0 4px 24px rgba(196,75,138,0.07)',
    }}>
      {/* Question header */}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'white',
          padding: '3px 10px', borderRadius: 99,
          background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
          marginRight: 8,
        }}>
          {index}-сұрақ
        </span>
      </div>
      <h3 style={{
        fontSize: 'clamp(14px,3vw,17px)', fontWeight: 600,
        color: '#1F2937', lineHeight: 1.5, marginBottom: 4,
      }}>
        {stat.questionText}
      </h3>
      <p style={{ fontSize: 13, color: '#F472B6', marginBottom: 24 }}>
        {stat.total} жауап
      </p>

      {stat.total === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#D1D5DB', fontSize: 14 }}>
          Әлі жауап жоқ
        </div>
      ) : mode === 'pie' ? (
        /* ── PIE MODE ── */
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', overflow: 'hidden' }}>
          {/* Pie chart — fixed size, never wraps */}
          <div style={{ flexShrink: 0, width: 160, height: 160 }}>
            <PieChart width={160} height={160}>
              <Pie
                data={stat.items}
                dataKey="count"
                cx={80}
                cy={80}
                outerRadius={72}
                paddingAngle={2}
              >
                {stat.items.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={(props) => <PieTip {...(props as PieTipProps)} />} />
            </PieChart>
          </div>

          {/* Legend — always to the right of pie */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {stat.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9,
              }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: PALETTE[i % PALETTE.length],
                }} />
                <span style={{
                  flex: 1, fontSize: 'clamp(11px,2.5vw,13px)',
                  color: '#374151', lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={item.name}>
                  {item.name}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: PALETTE[i % PALETTE.length],
                  flexShrink: 0, marginLeft: 4,
                }}>
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── BAR MODE ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayItems.map((item, i) => {
            const colorIdx = stat.items.findIndex(x => x.name === item.name)
            const color = PALETTE[colorIdx % PALETTE.length]
            return (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', marginBottom: 6, gap: 8,
                }}>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4, flex: 1 }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
                    {item.percentage}%
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                    {item.count} жауап
                  </span>
                </div>
                <div style={{
                  height: 10, borderRadius: 99,
                  background: 'rgba(255,182,210,0.2)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${item.percentage}%`,
                    background: color,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Login ───────────────────────────────────────────────

interface LoginProps {
  onLogin: () => void
}

function LoginGate({ onLogin }: LoginProps) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState(false)

  function submit() {
    if (pwd === ADMIN_PASSWORD) { onLogin() }
    else { setErr(true); setPwd('') }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFF0F7, #FFEAF4, #F5E8FF)',
      padding: 16,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,182,210,0.4)',
        borderRadius: 28, padding: 36, width: '100%', maxWidth: 360,
        boxShadow: '0 8px 32px rgba(196,75,138,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
          <h1 style={{
            fontSize: 24, fontWeight: 800,
            background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Админ панель
          </h1>
        </div>

        <input
          type="password"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Құпия сөз"
          style={{
            width: '100%', borderRadius: 16, padding: '14px 16px',
            fontSize: 16, border: `2px solid ${err ? '#FCA5A5' : 'rgba(255,182,210,0.5)'}`,
            background: 'rgba(255,240,247,0.5)', outline: 'none',
            fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box',
          }}
        />
        {err && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>Құпия сөз дұрыс емес</p>}

        <button
          type="button"
          onClick={submit}
          style={{
            width: '100%', padding: '14px', borderRadius: 16,
            background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
            color: 'white', fontWeight: 700, fontSize: 15,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(196,75,138,0.3)',
          }}
        >
          Кіру →
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin ───────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [mode, setMode] = useState<'pie' | 'bar'>('bar')
  const [tick, setTick] = useState(0)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    getResponses()
      .then(data => setResponses(data))
      .catch(() => setResponses([]))
      .finally(() => setLoading(false))
  }, [tick, authed])

  const stats = useMemo(() => buildStats(responses), [responses])
  const textQ11 = useMemo(() => getTextAnswers(responses, 11), [responses])
  const textQ12 = useMemo(() => getTextAnswers(responses, 12), [responses])

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />

  function handleClear() {
    if (window.confirm('Барлық жауаптарды жою керек пе?')) {
      clearResponses().then(() => setTick(t => t + 1))
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF0F7, #FFEAF4 40%, #F5E8FF 70%, #FFF0F7)',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(16px,4vw,32px)' }}>

        {/* Header */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#F472B6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              ✨ Шамшат ұстаз
            </p>
            <h1 style={{
              fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800,
              background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Сауалнама нәтижелері
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Toggle */}
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.8)',
              border: '1.5px solid rgba(255,182,210,0.4)', borderRadius: 16, padding: 4,
            }}>
              {([['pie', '🍩 Диаграмма'], ['bar', '📊 Кесте']] as const).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    padding: '8px 16px', borderRadius: 12, border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    background: mode === m ? 'linear-gradient(135deg,#FF6B9D,#C44B8A)' : 'transparent',
                    color: mode === m ? 'white' : '#9CA3AF',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setTick(t => t + 1)}
              title="Жаңарту"
              style={{ padding: 10, borderRadius: 12, border: '1.5px solid rgba(255,182,210,0.4)', background: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 16 }}>
              🔄
            </button>
            <button type="button" onClick={handleClear}
              title="Тазалау"
              style={{ padding: 10, borderRadius: 12, border: '1.5px solid rgba(252,165,165,0.4)', background: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 16 }}>
              🗑️
            </button>
            <button type="button" onClick={() => setAuthed(false)}
              title="Шығу"
              style={{ padding: 10, borderRadius: 12, border: '1.5px solid rgba(209,213,219,0.5)', background: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 16 }}>
              🚪
            </button>
          </div>
        </div>

        {/* Summary — total only */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,182,210,0.35)',
            borderRadius: 20, padding: '14px 24px',
            boxShadow: '0 2px 12px rgba(196,75,138,0.06)',
          }}>
            <span style={{ fontSize: 28 }}>👥</span>
            <div>
              <div style={{
                fontSize: 36, fontWeight: 800, lineHeight: 1,
                background: 'linear-gradient(135deg,#FF6B9D,#C44B8A)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{responses.length}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>қатысушы</div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#F472B6', fontSize: 15 }}>
            Жүктелуде...
          </div>
        )}

        {/* Question stats */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats.map(stat => (
              <StatCard key={stat.questionId} stat={stat} mode={mode} index={stat.questionId} />
            ))}

            {/* Q11 */}
            <div style={{
              background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,182,210,0.35)',
              borderRadius: 24, padding: 'clamp(20px,4vw,32px)',
              boxShadow: '0 4px 24px rgba(196,75,138,0.07)',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'white',
                padding: '3px 10px', borderRadius: 99, marginBottom: 8, display: 'inline-block',
                background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
              }}>11-сұрақ</span>
              <h3 style={{ fontSize: 'clamp(14px,3vw,17px)', fontWeight: 600, color: '#1F2937', lineHeight: 1.5, marginBottom: 4 }}>
                Бір сөзбен жауап: Қазір жүрегіңіз ең қатты нені аңсап жүр?
              </h3>
              <p style={{ fontSize: 13, color: '#F472B6', marginBottom: 20 }}>{textQ11.length} жауап</p>

              {textQ11.length === 0 ? (
                <p style={{ color: '#D1D5DB', fontSize: 14 }}>Жауаптар жоқ</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {textQ11.map((entry, i) => (
                    <span key={entry.id} style={{
                      padding: '8px 18px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                      color: 'white',
                      background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 3) % PALETTE.length]})`,
                    }}>
                      {entry.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Q12 */}
            <div style={{
              background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,182,210,0.35)',
              borderRadius: 24, padding: 'clamp(20px,4vw,32px)',
              boxShadow: '0 4px 24px rgba(196,75,138,0.07)',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'white',
                padding: '3px 10px', borderRadius: 99, marginBottom: 8, display: 'inline-block',
                background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
              }}>12-сұрақ</span>
              <h3 style={{ fontSize: 'clamp(14px,3vw,17px)', fontWeight: 600, color: '#1F2937', lineHeight: 1.5, marginBottom: 4 }}>
                Шамшат ұстазға қояр сұрақтар
              </h3>
              <p style={{ fontSize: 13, color: '#F472B6', marginBottom: 20 }}>{textQ12.length} сұрақ</p>

              {textQ12.length === 0 ? (
                <p style={{ color: '#D1D5DB', fontSize: 14 }}>Жауаптар жоқ</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {textQ12.map((entry, i) => (
                    <div key={entry.id} style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      padding: '14px 16px', borderRadius: 16,
                      background: 'linear-gradient(135deg,rgba(255,240,247,0.8),rgba(248,232,255,0.8))',
                      border: '1px solid rgba(255,182,210,0.3)',
                    }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                        background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 3) % PALETTE.length]})`,
                      }}>
                        {i + 1}
                      </span>
                      <p style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                        {entry.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
