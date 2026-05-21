import { useState } from 'react'
import { Stethoscope, Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage({ signIn, signUp, showToast }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || (!password && mode !== 'forgot')) { showToast('Preencha os campos'); return }
    setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password'
        })
        if (error) throw error
        showToast('Email de recuperação enviado!')
        setMode('login')
      } else if (mode === 'signup') {
        if (!nome.trim()) { showToast('Informe seu nome'); setLoading(false); return }
        const { error } = await signUp(email, password, { data: { name: nome.trim() } })
        if (error) throw error
        showToast('Conta criada! Verifique seu email.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
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
          <Stethoscope size={24} color="var(--accent)" />
        </div>
        <div className="login-logo">MedProd</div>
      </div>
      <div className="login-sub">Controle de produção médica</div>

      <div className="login-card">
        {mode === 'forgot' ? (
          <>
            <button onClick={() => setMode('login')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, marginBottom:16, padding:0 }}>
              <ArrowLeft size={15} /> Voltar
            </button>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:6 }}>Recuperar senha</div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>Enviaremos um link para seu email</div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        ) : (
          <>
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
              {mode === 'signup' && (
                <div className="field">
                  <label>Seu nome</label>
                  <input className="input" type="text" placeholder="Dr. Frederico..." value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" />
                </div>
              )}
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="field">
                <label>Senha</label>
                <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : (mode === 'login' ? 'Entrar' : 'Criar conta')}
              </button>
              {mode === 'login' && (
                <button type="button" onClick={() => setMode('forgot')} style={{ display:'block', width:'100%', textAlign:'center', marginTop:14, background:'none', border:'none', color:'var(--text3)', fontSize:13, cursor:'pointer' }}>
                  Esqueci minha senha
                </button>
              )}
            </form>
          </>
        )}
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        MedProd · RCP Creative
      </p>
    </div>
  )
}