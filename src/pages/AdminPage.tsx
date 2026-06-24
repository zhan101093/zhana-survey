import { useState, useMemo, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { questions } from '../data/questions'
import { getResponses, clearResponses } from '../utils/storage'
import type { SurveyResponse } from '../types'

const ADMIN_PASSWORD = 'admin2024'

const PALETTE = [
  '#FF6B9D', '#C44B8A', '#FF85B3', '#E91E8C',
  '#FF4D8B', '#D63BAA', '#FF9BC7', '#B5368A',
  '#FFAFD5', '#9C2378',
]

interface StatItem {
  name: string
  count: number
  percentage: number
  index: number
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
      const items: StatItem[] = (q.options ?? []).map((opt, i) => {
        const count = counts[opt.label] ?? 0
        return {
          name: opt.label,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          index: i + 1,
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

// ---- Tooltip components ----

interface PiePayload {
  name: string
  count: number
  percentage: number
}

interface PieTipProps {
  active?: boolean
  payload?: Array<{ payload: PiePayload }>
}

function PieTip({ active, payload }: PieTipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-card rounded-xl p-3 text-sm max-w-52">
      <p className="font-semibold text-gray-800 leading-snug mb-1">{d.name}</p>
      <p className="text-pink-600 font-bold">{d.percentage}%</p>
      <p className="text-gray-500">{d.count} жауап</p>
    </div>
  )
}

interface BarTipProps {
  active?: boolean
  payload?: Array<{ payload: StatItem }>
}

function BarTip({ active, payload }: BarTipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-card rounded-xl p-3 text-sm max-w-52">
      <p className="font-semibold text-gray-800 leading-snug mb-1">{d.name}</p>
      <p className="text-pink-600 font-bold">{d.percentage}%</p>
      <p className="text-gray-500">{d.count} жауап</p>
    </div>
  )
}

// ---- Pie label ----

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percentage: number
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: PieLabelProps) {
  if (percentage < 7) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.52
  const x = cx + r * Math.cos(-midAngle * R)
  const y = cy + r * Math.sin(-midAngle * R)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {percentage}%
    </text>
  )
}

// ---- Question stat card ----

interface StatCardProps {
  stat: QuestionStat
  mode: 'donut' | 'bar'
}

function StatCard({ stat, mode }: StatCardProps) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-1">
          <span className="pink-gradient-text font-bold mr-1">{stat.questionId}.</span>
          {stat.questionText}
        </h3>
      </div>
      <p className="text-xs text-pink-400 mb-4">{stat.total} жауап жиналды</p>

      {stat.total === 0 ? (
        <div className="flex items-center justify-center h-28 text-gray-400 text-sm">
          Әлі жауап жоқ
        </div>
      ) : mode === 'donut' ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stat.items}
                dataKey="count"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
                labelLine={false}
                label={(props: PieLabelProps) => <PieLabel {...props} />}
              >
                {stat.items.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={(props) => <PieTip {...(props as PieTipProps)} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {stat.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <span className="text-xs text-gray-600 flex-1 leading-snug">{item.name}</span>
                <span className="text-xs font-bold text-pink-600">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stat.items} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,182,210,0.3)" vertical={false} />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={(props) => <BarTip {...(props as BarTipProps)} />} />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                {stat.items.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {stat.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: PALETTE[i % PALETTE.length] }}>
                  {item.index}.
                </span>
                <span className="text-gray-600 flex-1 leading-snug">{item.name}</span>
                <span className="font-bold text-pink-600 flex-shrink-0">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---- Admin login ----

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
    <div className="bg-survey flex items-center justify-center min-h-screen p-4">
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <div style={{
          position: 'absolute', top: '-8rem', right: '-6rem',
          width: '22rem', height: '22rem',
          background: 'rgba(255,182,210,0.25)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8rem', left: '-6rem',
          width: '22rem', height: '22rem',
          background: 'rgba(216,180,254,0.22)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
      </div>

      <div className="relative glass-card rounded-3xl p-8 w-full max-w-sm pop-in">
        <div className="text-center mb-6">
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
          <h1 className="text-2xl font-bold pink-gradient-text">Админ панель</h1>
          <p className="text-gray-400 text-sm mt-1">Нәтижелерді көру үшін кіріңіз</p>
        </div>

        <input
          type="password"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Құпия сөз"
          className="w-full rounded-2xl p-4 text-sm text-gray-700 focus:outline-none mb-3"
          style={{
            border: `2px solid ${err ? '#FCA5A5' : 'rgba(255,182,210,0.5)'}`,
            background: 'rgba(255, 240, 247, 0.55)',
            fontFamily: 'inherit',
          }}
          aria-label="Құпия сөз"
        />

        {err && (
          <p className="text-red-400 text-xs mb-3 text-center">Құпия сөз дұрыс емес</p>
        )}

        <button
          type="button"
          onClick={submit}
          className="pink-btn w-full text-white font-semibold py-3 rounded-2xl text-sm"
        >
          Кіру →
        </button>
      </div>
    </div>
  )
}

// ---- Main Admin ----

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [mode, setMode] = useState<'donut' | 'bar'>('donut')
  const [tick, setTick] = useState(0)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getResponses()
      .then(data => setResponses(data))
      .finally(() => setLoading(false))
  }, [tick])

  const stats = useMemo(() => buildStats(responses), [responses])
  const textQ11 = useMemo(() => getTextAnswers(responses, 11), [responses])
  const textQ12 = useMemo(() => getTextAnswers(responses, 12), [responses])

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />

  function handleClear() {
    if (window.confirm('Барлық жауаптарды жою керек пе?')) {
      clearResponses().then(() => setTick(t => t + 1))
    }
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="bg-survey min-h-screen">
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
      >
        <div style={{
          position: 'absolute', top: '-6rem', right: '-6rem',
          width: '22rem', height: '22rem',
          background: 'rgba(255,182,210,0.18)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-6rem', left: '-6rem',
          width: '22rem', height: '22rem',
          background: 'rgba(216,180,254,0.15)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-0.5">
              ✨ Шамшат ұстаз
            </p>
            <h1 className="text-3xl font-bold pink-gradient-text">Дашборд</h1>
            <p className="text-gray-400 text-sm mt-0.5">Сауалнама нәтижелері</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart mode toggle */}
            <div
              className="flex p-1 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,182,210,0.4)' }}
            >
              {(['donut', 'bar'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={mode === m ? {
                    background: 'linear-gradient(135deg, #FF6B9D, #C44B8A)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(196,75,138,0.3)',
                  } : { color: '#9CA3AF' }}
                  aria-pressed={mode === m}
                >
                  {m === 'donut' ? '🍩 Доңғалақ' : '📊 Баған'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setTick(t => t + 1)}
              title="Жаңарту"
              className="p-2.5 rounded-xl text-pink-400 hover:bg-pink-50 transition-colors"
              style={{ border: '1.5px solid rgba(255,182,210,0.45)' }}
              aria-label="Жаңарту"
            >
              🔄
            </button>

            <button
              type="button"
              onClick={handleClear}
              title="Барлық жауаптарды жою"
              className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
              style={{ border: '1.5px solid rgba(252,165,165,0.45)' }}
              aria-label="Жауаптарды тазалау"
            >
              🗑️
            </button>

            <button
              type="button"
              onClick={() => setAuthed(false)}
              className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors"
              style={{ border: '1.5px solid rgba(209,213,219,0.6)' }}
              aria-label="Шығу"
              title="Шығу"
            >
              🚪
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-16 text-pink-400 font-medium">
            Жүктелуде...
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Қатысушылар', value: responses.length, emoji: '👥' },
            { label: '11-сұрақ жауаптары', value: textQ11.length, emoji: '💬' },
            { label: '12-сұрақ сұрақтары', value: textQ12.length, emoji: '❓' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="glass-card rounded-3xl p-5 text-center">
              <div style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</div>
              <div className="text-3xl font-bold pink-gradient-text leading-none">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {stats.map(stat => (
            <StatCard key={stat.questionId} stat={stat} mode={mode} />
          ))}
        </div>

        {/* Q11 — text chips */}
        <div className="glass-card rounded-3xl p-6 mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-0.5">
            <span className="pink-gradient-text">11.</span> Бір сөзбен жауап
          </h2>
          <p className="text-xs text-pink-400 mb-4">
            Қазір жүрегіңіз ең қатты нені аңсап жүр?
          </p>
          {textQ11.length === 0 ? (
            <p className="text-gray-400 text-sm">Жауаптар жоқ</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {textQ11.map((entry, i) => (
                <span
                  key={entry.id}
                  className="text-sm font-medium text-white px-4 py-1.5 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 2) % PALETTE.length]})` }}
                >
                  {entry.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Q12 — question cards */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-0.5">
            <span className="pink-gradient-text">12.</span> Шамшат ұстазға сұрақтар
          </h2>
          <p className="text-xs text-pink-400 mb-4">{textQ12.length} сұрақ жиналды</p>
          {textQ12.length === 0 ? (
            <p className="text-gray-400 text-sm">Жауаптар жоқ</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {textQ12.map((entry, i) => (
                <div
                  key={entry.id}
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,240,247,0.9), rgba(248,232,255,0.9))',
                    border: '1.5px solid rgba(255,182,210,0.4)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 3) % PALETTE.length]})` }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed flex-1">{entry.value}</p>
                  </div>
                  <p className="text-xs text-gray-400 text-right">{formatDate(entry.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
