import { useNavigate } from 'react-router-dom'

export default function ThankYouPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-survey flex flex-col items-center justify-center min-h-screen p-4">
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <div style={{
          position: 'absolute', top: '-8rem', right: '-6rem',
          width: '24rem', height: '24rem',
          background: 'rgba(255,182,210,0.28)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8rem', left: '-6rem',
          width: '24rem', height: '24rem',
          background: 'rgba(216,180,254,0.22)', borderRadius: '50%', filter: 'blur(55px)',
        }} />
      </div>

      <div className="relative glass-card rounded-3xl p-10 text-center max-w-md w-full pop-in">
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 20 }}>🌸</div>

        <h1 className="text-3xl font-bold pink-gradient-text mb-3">Рахмет!</h1>

        <p className="text-gray-600 leading-relaxed mb-2">
          Сіздің жауаптарыңыз сәтті жіберілді.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Семинарда кездескенше! ✨
        </p>

        <div
          className="w-16 h-0.5 mx-auto mb-8 rounded-full"
          style={{ background: 'linear-gradient(90deg, #FF9BC7, #C44B8A)' }}
        />

        <button
          type="button"
          onClick={() => navigate('/')}
          className="pink-btn text-white font-semibold px-8 py-3 rounded-2xl text-sm"
        >
          Қайта бастау
        </button>
      </div>
    </div>
  )
}
