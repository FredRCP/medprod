import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogOut, Save, Loader2, Mail, Shield, FileText, Cloud, Trash2, CheckCircle } from 'lucide-react'
import { useToast } from '../hooks/useToast'

function Accordion({ titulo, icone: Icone, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderRadius: 'var(--radius)', overflow:'hidden',
      border: '1px solid var(--border)', marginBottom: 8,
      transition: 'box-shadow 0.2s',
      boxShadow: open ? 'var(--shadow-sm)' : 'none'
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        cursor:'pointer', padding:'12px 14px',
        background: open ? 'var(--accent-dim)' : 'var(--card2)',
        transition: 'background 0.15s', userSelect: 'none'
      }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg3)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'var(--card2)' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {Icone && <Icone size={15} color={open ? 'var(--accent)' : 'var(--text3)'} />}
          <span style={{ fontSize:13, fontWeight:700, color: open ? 'var(--accent)' : 'var(--text)' }}>
            {titulo}
          </span>
        </div>
        <span style={{
          fontSize:18, color: open ? 'var(--accent)' : 'var(--text3)',
          lineHeight:1, display:'inline-block', transform: open ? 'rotate(45deg)' : 'none'
        }}>+</span>
      </div>
      {open && (
        <div style={{ padding:'14px', background:'var(--card)', borderTop:'1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function PerfilPage({ user, signOut }) {
  const { toast, showToast } = useToast()
  const nomeAtual = user?.user_metadata?.name || user?.user_metadata?.full_name || ''
  const [nome,          setNome]          = useState(nomeAtual)
  const [saving,        setSaving]        = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [senhaDelete,   setSenhaDelete]   = useState('')
  const [deleting,      setDeleting]      = useState(false)

  const membroDesde = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month:'long', year:'numeric' })
    : '—'

  async function handleSave() {
    if (!nome.trim()) { showToast('Informe seu nome'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { name: nome.trim() } })
      if (error) throw error
      showToast('Nome atualizado! Faça logout e login para ver.')
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!senhaDelete.trim()) { showToast('Digite sua senha'); return }
    setDeleting(true)
    try {
      // Verifica senha com re-autenticação
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaDelete
      })
      if (authError) { showToast('Senha incorreta'); setDeleting(false); return }

      // Deleta todos os dados
      await supabase.from('registros').delete().eq('user_id', user.id)
      await supabase.from('despesas').delete().eq('user_id', user.id)
      await supabase.from('receitas').delete().eq('user_id', user.id)
      showToast('Dados excluídos. Até logo!')
      setTimeout(() => signOut(), 1500)
    } catch (err) {
      showToast('Erro ao excluir conta')
      setDeleting(false)
    }
  }

  const textoStyle = { fontSize:13, color:'var(--text2)', lineHeight:1.7, marginBottom:8 }

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <div className="app-header">
        <div style={{ fontSize:22, fontWeight:800 }}>Perfil</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>Suas informações e configurações</div>
      </div>

      <div className="app-content" style={{ padding:'16px 16px 40px' }}>

        {/* Hero card */}
        <div style={{
          background:'linear-gradient(135deg, #1e3a5f 0%, #1e4f88 100%)',
          borderRadius:'var(--radius-lg)', padding:'24px 20px',
          marginBottom:16, boxShadow:'0 6px 24px rgba(30,58,95,0.3)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:12
        }}>
          <div style={{
            width:68, height:68, borderRadius:'50%',
            background:'rgba(255,255,255,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid rgba(255,255,255,0.3)'
          }}>
            <span style={{ fontSize:28, fontWeight:800, color:'white' }}>
              {(nomeAtual || user?.email || 'M')[0].toUpperCase()}
            </span>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'white', marginBottom:4 }}>
              {nomeAtual || 'Sem nome'}
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>{user?.email}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
            <span style={{
              background:'rgba(255,255,255,0.15)', borderRadius:99,
              padding:'4px 12px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.9)'
            }}>
              Membro desde {membroDesde}
            </span>
            <span style={{
              background:'rgba(26,143,94,0.4)', borderRadius:99,
              padding:'4px 12px', fontSize:11, fontWeight:700, color:'#7effd4'
            }}>
              ✓ Conta ativa
            </span>
          </div>
        </div>

        {/* Editar nome */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
            Nome de exibição
          </div>
          <div className="field" style={{ marginTop:0, marginBottom:12 }}>
            <input className="input" type="text" placeholder="Dr. Frederico..." value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : <Save size={18} />}
            Salvar nome
          </button>
        </div>

        {/* Info da conta */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>
            Conta
          </div>
          {[
            ['Email', user?.email],
            ['Membro desde', membroDesde],
            ['Sincronização', 'Ativa'],
            ['Armazenamento', 'Supabase Cloud'],
          ].map(([label, valor]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, marginBottom:10, borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', display:'flex', alignItems:'center', gap:5 }}>
                {label === 'Sincronização' && <CheckCircle size={13} color="var(--green)" />}
                {label === 'Armazenamento' && <Cloud size={13} color="var(--accent)" />}
                {valor}
              </span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'var(--text2)' }}>Versão</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>MedProd v1.0</span>
          </div>
        </div>

        {/* Logout */}
        <button onClick={signOut} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'11px 20px', borderRadius:'var(--radius)',
          border:'1.5px solid var(--border)', background:'transparent',
          color:'var(--text2)', fontSize:15, fontWeight:600,
          cursor:'pointer', fontFamily:'var(--font)', marginBottom:12, transition:'all 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text3)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
        >
          <LogOut size={16} /> Sair da conta
        </button>

        {/* Sobre */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
            Sobre o app
          </div>
          <Accordion titulo="Contato" icone={Mail}>
            <p style={textoStyle}>Para dúvidas, sugestões ou solicitações de suporte, entre em contato pelo e-mail:</p>
            <p style={{ ...textoStyle, fontWeight:700, color:'var(--accent)' }}>fredrcpmed@gmail.com</p>
            <p style={{ ...textoStyle, marginBottom:0 }}>RCP Creative · Uberaba, MG</p>
          </Accordion>
          <Accordion titulo="Política de Privacidade" icone={Shield}>
            <p style={textoStyle}>O MedProd atua em conformidade com a LGPD, coletando exclusivamente os dados de produção inseridos diretamente por você.</p>
            <p style={textoStyle}>Não armazenamos informações sensíveis de pacientes. Todos os dados são guardados de forma segura no ecossistema Supabase, protegidos por mecanismos modernos de autenticação e controle de acesso, sem qualquer compartilhamento com terceiros ou uso comercial.</p>
            <p style={{ ...textoStyle, marginBottom:0 }}>O usuário mantém total controle sobre suas informações, podendo solicitar a exclusão definitiva de sua conta e histórico a qualquer momento pelo e-mail de contato.</p>
          </Accordion>
          <Accordion titulo="Termos de Uso" icone={FileText}>
            <p style={textoStyle}>Ao utilizar o MedProd, você concorda que esta é uma ferramenta de uso estritamente pessoal para apoio, planejamento e controle de produtividade médica mensal, não substituindo sistemas oficiais de faturamento hospitalar, prontuários eletrônicos (PEP) ou obrigações fiscais.</p>
            <p style={textoStyle}>A exatidão dos lançamentos é de inteira responsabilidade do médico usuário. O aplicativo é fornecido "como está"; a RCP Creative não se responsabiliza por eventuais divergências financeiras com fontes pagadoras ou interrupções temporárias, manutenções ou atualizações do sistema.</p>
            <p style={{ ...textoStyle, marginBottom:0 }}>É proibida a cópia ou comercialização não autorizada deste software.</p>
          </Accordion>
          <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', marginTop:12 }}>
            MedProd v1.0 · © 2026 RCP Creative
          </div>
        </div>

        {/* Zona de perigo */}
        <div style={{ background:'var(--card)', border:'1px solid rgba(176,48,32,0.25)', borderRadius:'var(--radius-lg)', padding:16, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--red)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
            Zona de perigo
          </div>
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14, lineHeight:1.6 }}>
            A exclusão remove permanentemente todos os seus registros, receitas e despesas. Esta ação não pode ser desfeita.
          </p>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'10px 20px', borderRadius:'var(--radius)',
              border:'1.5px solid rgba(176,48,32,0.3)', background:'transparent',
              color:'var(--red)', fontSize:14, fontWeight:600,
              cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s'
            }}>
              <Trash2 size={15} /> Excluir minha conta
            </button>
          ) : (
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10, textAlign:'center' }}>
                Digite sua senha para confirmar
              </p>
              <input
                className="input"
                type="password"
                placeholder="Sua senha atual..."
                value={senhaDelete}
                onChange={e => setSenhaDelete(e.target.value)}
                style={{ marginBottom:10 }}
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <button
                  onClick={() => { setConfirmDelete(false); setSenhaDelete('') }}
                  className="btn btn-ghost"
                  style={{ fontSize:13 }}
                >
                  Cancelar
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting} style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'10px', borderRadius:'var(--radius)',
                  border:'none', background:'var(--red)',
                  color:'white', fontSize:13, fontWeight:700,
                  cursor: deleting ? 'default':'pointer',
                  fontFamily:'var(--font)', opacity: deleting ? 0.7 : 1
                }}>
                  {deleting ? <Loader2 size={15} style={{ animation:'spin 0.7s linear infinite' }} /> : <Trash2 size={15} />}
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}