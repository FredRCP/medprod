import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, getTipoLabel, TIPOS_PRODUCAO, CONVENIOS, LOCAIS_PADRAO } from '../lib/constants'
import { LogOut, Stethoscope, CheckCircle2, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'

const TIPO_COLORS = {
  consulta_medica: '#1a6fb5', retorno: '#1a6fb5', interconsulta: '#0e7490',
  teleconsulta: '#7c3aed', avaliacao_diaria: '#b45309', atendimento_domiciliar: '#b45309',
  hemodialise: '#0e7490', hemodialise_continua: '#0e7490',
  dialise_peritoneal_capd: '#1a8f5e', dialise_peritoneal_dpa: '#1a8f5e',
  dialise_peritoneal_intermitente: '#1a8f5e',
  biopsia_renal: '#c0392b', cateter_duplo_lumen: '#c0392b', permcath: '#c0392b',
  tenckhoff: '#c0392b', fav: '#c0392b', outros: '#7a94a8',
}
const TIPO_BGS = {
  '#1a6fb5': '#e8f2fc', '#0e7490': '#e0f5f9', '#7c3aed': '#ede9fe',
  '#b45309': '#fef3e2', '#1a8f5e': '#e6f7f1', '#c0392b': '#fdecea', '#7a94a8': '#f0f4f8',
}
function getCfg(tipo) {
  const c = TIPO_COLORS[tipo] || '#7a94a8'
  return { color: c, bg: TIPO_BGS[c] || '#f0f4f8' }
}

function FiltroPanel({ filtros, onChange, onClose }) {
  const [f, setF] = useState(filtros)
  function update(k, v) { setF(prev => ({ ...prev, [k]: v })) }
  function aplicar() { onChange(f); onClose() }
  function limpar() { const z = { tipo:'', convenio:'', local:'', nome:'', status:'' }; setF(z); onChange(z); onClose() }
  const temFiltro = Object.values(f).some(v => v)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--card)', borderRadius:'20px 20px 0 0', padding:'8px 20px 32px', maxHeight:'85dvh', overflowY:'auto' }}>
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:99, margin:'10px auto 16px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>Filtros</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={20} /></button>
        </div>

        <div className="field">
          <label>Nome do paciente</label>
          <input className="input" placeholder="Buscar por nome..." value={f.nome} onChange={e => update('nome', e.target.value)} />
        </div>

        <div className="field">
          <label>Status de pagamento</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['','Todos'],['pago','Pagos'],['pendente','Pendentes']].map(([v,l]) => (
              <span key={v} className={`chip ${f.status === v ? 'active' : ''}`} onClick={() => update('status', v)}>{l}</span>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Tipo de produção</label>
          <select className="input" value={f.tipo} onChange={e => update('tipo', e.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS_PRODUCAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Convênio</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[{value:'',label:'Todos'}, ...CONVENIOS].map(c => (
              <span key={c.value} className={`chip ${f.convenio === c.value ? 'active' : ''}`} onClick={() => update('convenio', c.value)}>{c.label}</span>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Local</label>
          <select className="input" value={f.local} onChange={e => update('local', e.target.value)}>
            <option value="">Todos os locais</option>
            {LOCAIS_PADRAO.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
          {temFiltro && <button className="btn btn-ghost" onClick={limpar}><X size={15} /> Limpar</button>}
          <button className="btn btn-primary" style={{ gridColumn: temFiltro ? 'auto' : '1/-1' }} onClick={aplicar}>Aplicar filtros</button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage({ user, signOut }) {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFiltro, setShowFiltro] = useState(false)
  const [filtros, setFiltros] = useState({ tipo:'', convenio:'', local:'', nome:'', status:'' })
  const [mesOffset, setMesOffset] = useState(0)

  const getMes = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes = getMes()
  const mesStr = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`
  const mesLabel = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const nomeUsuario = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Médico'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => { fetchRegistros() }, [mesOffset])

  async function fetchRegistros() {
    setLoading(true)
    const fimMes = new Date(mes.getFullYear(), mes.getMonth()+1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase.from('registros').select('*')
      .eq('user_id', user.id)
      .gte('data', `${mesStr}-01`)
      .lte('data', fimMes)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setRegistros(data || [])
    setLoading(false)
  }

  async function togglePago(id, pago) {
    await supabase.from('registros').update({ pago: !pago }).eq('id', id)
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, pago: !r.pago } : r))
  }

  const temFiltroAtivo = Object.values(filtros).some(v => v)

  const filtrados = useMemo(() => registros.filter(r => {
    if (filtros.nome && !r.paciente_nome?.toLowerCase().includes(filtros.nome.toLowerCase())) return false
    if (filtros.tipo && r.tipo_producao !== filtros.tipo) return false
    if (filtros.convenio && r.convenio !== filtros.convenio) return false
    if (filtros.local && r.local_atendimento !== filtros.local) return false
    if (filtros.status === 'pago' && !r.pago) return false
    if (filtros.status === 'pendente' && r.pago) return false
    return true
  }), [registros, filtros])

  const grouped = filtrados.reduce((acc, r) => {
    if (!acc[r.data]) acc[r.data] = []
    acc[r.data].push(r)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a,b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]

  const getTipoDisplay = (r) =>
    r.tipo_producao === 'outros' && r.procedimento_custom ? r.procedimento_custom : getTipoLabel(r.tipo_producao)

  return (
    <>
      {showFiltro && <FiltroPanel filtros={filtros} onChange={setFiltros} onClose={() => setShowFiltro(false)} />}

      <div className="app-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:12, color:'var(--text3)', fontWeight:600, marginBottom:2 }}>
              {saudacao}, <strong style={{ color:'var(--accent)' }}>{nomeUsuario}</strong> 👋
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', textTransform:'capitalize' }}>{mesLabel}</div>
          </div>
          <button className="btn btn-ghost" onClick={signOut} style={{ padding:'8px 12px', fontSize:13 }}>
            <LogOut size={15} /> Sair
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
          <button onClick={() => setMesOffset(m => m-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', padding:4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex:1, textAlign:'center', fontSize:13, color:'var(--text2)', fontWeight:600 }}>
            {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
            {temFiltroAtivo && <span style={{ color:'var(--accent)', marginLeft:6 }}>· filtrado</span>}
          </div>
          <button onClick={() => setMesOffset(m => m+1)} disabled={mesOffset >= 0} style={{ background:'none', border:'none', cursor:'pointer', color: mesOffset >= 0 ? 'var(--border)' : 'var(--text2)', padding:4 }}>
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setShowFiltro(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:'var(--radius)', border:'1.5px solid', borderColor: temFiltroAtivo ? 'var(--accent)' : 'var(--border)', background: temFiltroAtivo ? 'var(--accent-dim)' : 'var(--card)', color: temFiltroAtivo ? 'var(--accent)' : 'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer' }}
          >
            <SlidersHorizontal size={15} />
            Filtrar{temFiltroAtivo ? ' ●' : ''}
          </button>
        </div>
      </div>

      <div className="app-content">
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div className="spinner" style={{ width:32, height:32 }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
            <Stethoscope size={40} style={{ marginBottom:12, opacity:0.3 }} />
            <div style={{ fontSize:15, fontWeight:600 }}>
              {temFiltroAtivo ? 'Nenhum resultado para os filtros' : 'Nenhum registro este mês'}
            </div>
            {temFiltroAtivo
              ? <button className="btn btn-ghost" style={{ margin:'16px auto 0', width:'auto' }} onClick={() => setFiltros({ tipo:'', convenio:'', local:'', nome:'', status:'' })}><X size={14} /> Limpar filtros</button>
              : <div style={{ fontSize:13, marginTop:6 }}>Toque em Registrar para começar</div>
            }
          </div>
        ) : (
          sortedDates.map(data => (
            <div key={data}>
              <div className="section-label">{data === today ? '📅 Hoje' : formatDate(data)}</div>
              {grouped[data].map(reg => {
                const cfg = getCfg(reg.tipo_producao)
                return (
                  <div key={reg.id} className="reg-item" onClick={() => navigate('/registrar', { state: { edit: reg } })}>
                    <div className="reg-icon" style={{ background: cfg.bg }}>
                      <Stethoscope size={18} color={cfg.color} />
                    </div>
                    <div className="reg-info">
                      <div className="reg-paciente">{reg.paciente_nome || '—'}</div>
                      <div className="reg-tipo">{getTipoDisplay(reg)}</div>
                      {(reg.convenio || reg.local_atendimento) && (
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                          {[reg.convenio?.toUpperCase(), reg.local_custom || reg.local_atendimento?.replace(/_/g,' ')].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="reg-right">
                      <span className={`badge ${reg.pago ? 'badge-green' : 'badge-amber'}`}>
                        {reg.pago ? 'Pago' : 'Pendente'}
                      </span>
                      <button
                        className={`toggle-pay ${reg.pago ? 'pago' : ''}`}
                        style={{ marginTop:6, marginLeft:'auto' }}
                        onClick={e => { e.stopPropagation(); togglePago(reg.id, reg.pago) }}
                        title={reg.pago ? 'Marcar pendente' : 'Marcar pago'}
                      >
                        {reg.pago && <CheckCircle2 size={14} color="white" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </>
  )
}