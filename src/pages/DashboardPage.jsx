import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, getTipoLabel, getTipoIcone, TIPOS_PRODUCAO, CONVENIOS, LOCAIS_PADRAO } from '../lib/constants'
import { LogOut, Stethoscope, CheckCircle2, SlidersHorizontal, X, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

const TIPO_COLORS = {
  consulta_medica: '#1a6fb5', retorno: '#1a6fb5', interconsulta: '#0e7490',
  consulta_cemig: '#1a6fb5', consulta_particular: '#1a6fb5', consulta_unimed: '#1a6fb5',
  consulta_bradesco: '#1a6fb5', consulta_hapvida: '#1a6fb5', consulta_cassi: '#1a6fb5', consulta_ipsm: '#1a6fb5',
  teleconsulta: '#7c3aed', avaliacao_diaria: '#b45309', atendimento_domiciliar: '#b45309',
  hemodialise: '#0e7490', hemodialise_continua: '#0e7490',
  plantao_hd: '#0e7490', plantao_uti: '#c0392b', plantao_ps: '#c0392b',
  plantao_enfermaria: '#b45309', plantao_regulacao: '#b45309',
  dialise_peritoneal_capd: '#1a8f5e', dialise_peritoneal_dpa: '#1a8f5e',
  dialise_peritoneal_intermitente: '#1a8f5e',
  biopsia_renal: '#c0392b', cateter_duplo_lumen: '#c0392b', cateter_triplo_lumen: '#c0392b',
  permcath: '#c0392b', tenckhoff: '#c0392b', fav: '#c0392b', outros: '#7a94a8',
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
  function limpar() {
    const z = { tipo: '', convenio: '', local: '', nome: '', status: '' }
    setF(z); onChange(z); onClose()
  }
  const temFiltro = Object.values(f).some(v => v)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--card)', borderRadius:'20px 20px 0 0', padding:'8px 20px 32px', maxHeight:'85dvh', overflowY:'auto' }}>
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:99, margin:'10px auto 16px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>Filtros</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
            <X size={20} />
          </button>
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
          <button className="btn btn-primary" style={{ gridColumn: temFiltro ? 'auto' : '1/-1' }} onClick={aplicar}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  )
}

// Busca global
function BuscaGlobal({ registros, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  const resultados = useMemo(() => {
    if (!q.trim() || q.length < 2) return []
    const ql = q.toLowerCase()
    return registros.filter(r =>
      r.paciente_nome?.toLowerCase().includes(ql) ||
      getTipoLabel(r.tipo_producao).toLowerCase().includes(ql) ||
      r.convenio?.toLowerCase().includes(ql) ||
      r.procedimento_custom?.toLowerCase().includes(ql)
    ).slice(0, 20)
  }, [q, registros])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:400, display:'flex', flexDirection:'column' }}>
      <div style={{ background:'var(--card)', padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
        <Search size={18} color="var(--text3)" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nome, tipo, convênio..."
          style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:16, color:'var(--text)', fontFamily:'var(--font)' }}
        />
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
        {q.length < 2 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text3)', fontSize:14 }}>
            Digite pelo menos 2 caracteres
          </div>
        ) : resultados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text3)', fontSize:14 }}>
            Nenhum resultado encontrado
          </div>
        ) : (
          resultados.map(reg => {
            const cfg = getCfg(reg.tipo_producao)
            return (
              <div key={reg.id} onClick={() => { onSelect(reg); onClose() }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--card)', cursor:'pointer' }}>
                <div style={{ width:34, height:34, borderRadius:9, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Stethoscope size={16} color={cfg.color} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'uppercase' }}>
                    {reg.paciente_nome || '—'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>
                    {getTipoLabel(reg.tipo_producao)} · {formatDate(reg.data)}
                  </div>
                </div>
                <span className={`badge ${reg.pago ? 'badge-green' : 'badge-amber'}`}>
                  {reg.pago ? 'Pago' : 'Pendente'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function DashboardPage({ user, signOut }) {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([])
  const [todosRegistros, setTodosRegistros] = useState([]) // para busca global e sugestões
  const [loading, setLoading] = useState(true)
  const [showFiltro, setShowFiltro] = useState(false)
  const [showBusca, setShowBusca] = useState(false)
  const [filtros, setFiltros] = useState({ tipo:'', convenio:'', local:'', nome:'', status:'' })
  const [mesOffset, setMesOffset] = useState(0)

  const getMes = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes     = getMes()
  const mesStr  = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`
  const mesLabel = mes.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })

  const nomeCompleto = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Médico'
  const nomeUsuario  = nomeCompleto.split(' ')[0].charAt(0).toUpperCase() + nomeCompleto.split(' ')[0].slice(1).toLowerCase()
  const hora         = new Date().getHours()
  const saudacao     = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => { fetchRegistros() }, [mesOffset])

  useEffect(() => {
    // Carrega todos os registros para busca global e sugestões de pacientes
    supabase.from('registros').select('id,paciente_nome,tipo_producao,convenio,local_atendimento,data,pago,procedimento_custom')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => setTodosRegistros(data || []))
  }, [])

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
      {showBusca && (
        <BuscaGlobal
          registros={todosRegistros}
          onSelect={reg => navigate('/registrar', { state: { edit: reg } })}
          onClose={() => setShowBusca(false)}
        />
      )}

      <div className="app-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, color:'var(--text3)', fontWeight:500 }}>
              {saudacao},{' '}
              <strong style={{ color:'var(--green)', fontWeight:700 }}>{nomeUsuario}</strong>{' '}!
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', textTransform:'capitalize', marginTop:1 }}>
              {mesLabel}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {/* Botão busca */}
            <button
              onClick={() => setShowBusca(true)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--card)', cursor:'pointer', color:'var(--text2)' }}
            >
              <Search size={16} />
            </button>
            <button className="btn btn-ghost" onClick={signOut} style={{ padding:'7px 12px', fontSize:13 }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', background:'var(--bg2)', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden' }}>
            <button onClick={() => setMesOffset(m => m-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', padding:'6px 12px', fontSize:18, lineHeight:1 }}>‹</button>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)', padding:'6px 2px', whiteSpace:'nowrap' }}>
              {mesOffset === 0 ? 'Este mês' : mesLabel}
            </span>
            <button onClick={() => setMesOffset(m => m+1)} disabled={mesOffset >= 0}
              style={{ background:'none', border:'none', cursor: mesOffset >= 0 ? 'default' : 'pointer', color: mesOffset >= 0 ? 'var(--border)' : 'var(--text2)', padding:'6px 12px', fontSize:18, lineHeight:1 }}>›</button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, color:'var(--text3)', fontWeight:500 }}>
              {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
              {temFiltroAtivo && <span style={{ color:'var(--accent)' }}> · filtrado</span>}
            </span>
            <button onClick={() => setShowFiltro(true)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
              borderRadius:'var(--radius)', border:'1.5px solid',
              borderColor: temFiltroAtivo ? 'var(--accent)' : 'var(--border)',
              background: temFiltroAtivo ? 'var(--accent-dim)' : 'var(--card)',
              color: temFiltroAtivo ? 'var(--accent)' : 'var(--text2)',
              fontSize:13, fontWeight:700, cursor:'pointer'
            }}>
              <SlidersHorizontal size={14} />
              {temFiltroAtivo ? '●' : 'Filtrar'}
            </button>
          </div>
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
              ? <button className="btn btn-ghost" style={{ margin:'16px auto 0', width:'auto' }} onClick={() => setFiltros({ tipo:'', convenio:'', local:'', nome:'', status:'' })}>
                  <X size={14} /> Limpar filtros
                </button>
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
                      {(() => { const Icone = getTipoIcone(reg.tipo_producao); return <Icone size={18} color={cfg.color} /> })()}
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

      <button className="fab" onClick={() => navigate('/registrar')}
  style={{ background:'var(--accent)', boxShadow:'0 4px 16px rgba(26,111,181,0.4)' }}>
  <Plus size={22} color="white" />
</button>
    </>
  )
}