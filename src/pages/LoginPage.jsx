import { useState } from 'react'
import { Stethoscope, Loader2 } from 'lucide-react'

export default function LoginPage({ signIn, signUp, showToast }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { showToast('Preencha email e senha'); return }
    setLoading(true)
    try {
      const fn = mode === 'login' ? signIn : signUp
      const { error } = await fn(email, password)
      if (error) throw error
      if (mode === 'signup') showToast('Conta criada! Verifique seu email.')
    } catch (err) {
      showToast(err.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stethoscope size={24} color="var(--accent2)" />
        </div>
        <div className="login-logo">MedProd</div>
      </div>
      <div className="login-sub">Controle de produção médica</div>

      <div className="login-card">
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg3)', borderRadius: 10, padding: 3 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? 'white' : 'var(--text2)',
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14, transition: 'all 0.2s'
            }}>
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <Loader2 size={18} className="spinner" style={{ border: 'none', borderTop: 'none', animation: 'spin 0.7s linear infinite' }} /> : (mode === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>
      </div>

      <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        MedProd · RCP Creative
      </p>
    </div>
  )
}
