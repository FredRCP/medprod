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
          <a href="mailto:fredrcpmed@gmail.com" style={{ color:'var(--accent)', fontWeight:600, display:'block', marginTop:8 }}>
            fredrcpmed@gmail.com
          </a>
          <p style={{ marginTop:8 }}>Desenvolvido por <strong>RCP Creative</strong></p>
        </Accordion>

        <Accordion icon={Shield} title="Política de Privacidade">
          <p style={{ marginTop: 12 }}>
            O <strong>MedProd</strong> preza pela total privacidade e segurança dos seus dados, atuando em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>1. Coleta de Dados:</strong> O aplicativo armazena exclusivamente as informações de produção médica inseridas diretamente por você. Não coletamos, rastreamos ou armazenamos dados sensíveis de pacientes.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>2. Armazenamento e Segurança:</strong> Seus dados são integrados ao ecossistema Supabase, contando com criptografia de ponta e isolamento de banco de dados por regras de autenticação (RLS). Nenhuma informação é compartilhada com terceiros ou utilizada para fins comerciais.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>3. Seus Direitos:</strong> Como titular dos dados, você tem total controle sobre suas informações. A exclusão definitiva da sua conta e de todo o histórico de produção pode ser solicitada a qualquer momento através do e-mail de suporte.
          </p>
        </Accordion>

        <Accordion icon={FileText} title="Termos de Uso">
          <p style={{ marginTop: 12 }}>
            Ao utilizar o <strong>MedProd</strong>, você concorda com os seguintes termos de serviço:
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>1. Escopo do Serviço:</strong> O MedProd é uma ferramenta de uso pessoal destinada exclusivamente ao apoio, planejamento e controle de produtividade médica mensal. Ele <u>não</u> substitui sistemas oficiais de faturamento hospitalar, prontuários eletrônicos (PEP) ou obrigações fiscais.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>2. Responsabilidade do Usuário:</strong> O lançamento, a exatidão e a veracidade dos valores e procedimentos inseridos são de inteira responsabilidade do médico usuário.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>3. Limitação de Responsabilidade:</strong> O aplicativo é fornecido "como está". A RCP Creative não se responsabiliza por eventuais divergências financeiras entre os relatórios gerados e os repasses efetivos de fontes pagadoras, nem por falhas decorrentes de mau uso do dispositivo.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>4. Propriedade Intelectual:</strong> É proibida a engenharia reversa, cópia ou comercialização não autorizada desta ferramenta.
          </p>
        </Accordion>

        <div style={{ textAlign:'center', marginTop:24, fontSize:12, color:'var(--text3)' }}>
          © 2026 RCP Creative · Todos os direitos reservados
        </div>
      </div>
    </>
  )
}