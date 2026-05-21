import { Mail, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function Accordion({ icon: Icon, title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', marginBottom:10, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={18} color="var(--accent)" />
        </div>
        <span style={{ flex:1, fontSize:15, fontWeight:700 }}>{title}</span>
        {open ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
      </div>
      {open && (
        <div style={{ padding:'0 16px 16px', fontSize:13, color:'var(--text2)', lineHeight:1.7, borderTop:'1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function SobrePage() {
  return (
    <>
      <div className="app-header">
        <div style={{ fontSize:22, fontWeight:800 }}>Sobre</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>MedProd · v1.0 · RCP Creative</div>
      </div>
      <div className="app-content" style={{ padding:'16px 20px 40px' }}>

        <div style={{ textAlign:'center', padding:'20px 0 24px' }}>
          <div style={{ fontSize:36, fontWeight:800, color:'var(--accent)', letterSpacing:-1 }}>MedProd</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>Controle de produção médica mensal</div>
        </div>

        <Accordion icon={Mail} title="Contato">
          <p style={{ marginTop:12 }}>Dúvidas, sugestões ou suporte:</p>
          <a href="mailto:contato@rcpcreative.com.br" style={{ color:'var(--accent)', fontWeight:600, display:'block', marginTop:8 }}>
            fredrcpmed@gmail.com
          </a>
          <p style={{ marginTop:8 }}>Desenvolvido por <strong>RCP Creative</strong></p>
        </Accordion>

        <Accordion icon={Shield} title="Política de Privacidade">
          <p style={{ marginTop:12 }}>
            O MedProd coleta apenas os dados inseridos pelo próprio usuário para fins de controle de produção médica pessoal. Nenhum dado é compartilhado com terceiros. Os dados são armazenados de forma segura no Supabase e acessíveis apenas pelo usuário autenticado. Você pode solicitar a exclusão de todos os seus dados a qualquer momento pelo email de contato.
          </p>
        </Accordion>

        <Accordion icon={FileText} title="Termos de Uso">
          <p style={{ marginTop:12 }}>
            O MedProd é uma ferramenta de apoio ao controle de produção médica e não substitui sistemas oficiais de faturamento ou prontuário eletrônico. O usuário é responsável pela veracidade das informações inseridas. O aplicativo é fornecido "como está", sem garantias de disponibilidade contínua. O uso indevido ou comercialização não autorizada é proibido.
          </p>
        </Accordion>

        <div style={{ textAlign:'center', marginTop:24, fontSize:12, color:'var(--text3)' }}>
          © 2026 RCP Creative · Todos os direitos reservados
        </div>
      </div>
    </>
  )
}