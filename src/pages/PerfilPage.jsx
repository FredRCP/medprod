import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { UserCircle, LogOut, Save, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/useToast'

function Accordion({ titulo, conteudo }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom:'1px solid var(--border)', paddingBottom:10, marginBottom:10 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', paddingTop:2 }}>
        <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{titulo}</span>
        <span style={{ fontSize:18, color:'var(--text3)', lineHeight:1 }}>{open ? '−' : '+'}</span>
      </div>
      {open && <p style={{ fontSize:13, color:'var(--text2)', marginTop:8, lineHeight:1.6 }}>{conteudo}</p>}
    </div>
  )
}

export default function PerfilPage({ user, signOut }) {
  const { toast, showToast } = useToast()
  const nomeAtual = user?.user_metadata?.name || user?.user_metadata?.full_name || ''
  const [nome, setNome] = useState(nomeAtual)
  const [saving, setSaving] = useState(false)

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

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <div className="app-header">
        <div style={{ fontSize:22, fontWeight:800 }}>Perfil</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>Suas informações</div>
      </div>

      <div className="app-content" style={{ padding:'20px 16px 40px' }}>

        {/* Avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0 28px' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <UserCircle size={44} color="var(--accent)" />
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>
            {nomeAtual || 'Sem nome'}
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>{user?.email}</div>
        </div>

        {/* Editar nome */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <div className="field" style={{ marginTop:0 }}>
            <label>Nome de exibição</label>
            <input className="input" type="text" placeholder="Dr. Frederico..." value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : <Save size={18} />}
            Salvar nome
          </button>
        </div>

        {/* Info da conta */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Conta</div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:10, borderBottom:'1px solid var(--border)', marginBottom:10 }}>
            <span style={{ fontSize:13, color:'var(--text2)' }}>Email</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{user?.email}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'var(--text2)' }}>Membro desde</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
              {new Date(user?.created_at).toLocaleDateString('pt-BR', { month:'long', year:'numeric' })}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button className="btn btn-danger" onClick={signOut} style={{ width:'100%' }}>
          <LogOut size={16} /> Sair da conta
        </button>

        {/* Sobre */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginTop:12, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Sobre o app</div>
          <Accordion
            titulo="📧 Contato"
            conteudo="fredrcpmed@gmail.com — RCP Creative"
          />
          <Accordion
            titulo="🔒 Privacidade"
            conteudo="O MedProd coleta apenas os dados inseridos pelo próprio usuário. Nenhum dado é compartilhado com terceiros. Os dados são armazenados com segurança e acessíveis apenas pelo usuário autenticado. Você pode solicitar exclusão dos dados pelo email de contato."
          />
          <Accordion
            titulo="📄 Termos de uso"
            conteudo="O MedProd é uma ferramenta de apoio ao controle de produção médica e não substitui sistemas oficiais de faturamento ou prontuário eletrônico. O usuário é responsável pela veracidade das informações inseridas."
          />
          <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', marginTop:8 }}>
            MedProd v1.0 · © 2026 RCP Creative
          </div>
        </div>

      </div>
    </>
  )
}