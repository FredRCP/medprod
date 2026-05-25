import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, getTipoLabel, getTipoIcone } from '../lib/constants'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

const TIPO_COLORS = {
  consulta_medica: '#1e4f88', retorno: '#1e4f88', interconsulta: '#0e7490',
  consulta_cemig: '#1e4f88', consulta_particular: '#1e4f88', consulta_unimed: '#1e4f88',
  teleconsulta: '#7c3aed', avaliacao_diaria: '#9a4a0a', atendimento_domiciliar: '#9a4a0a',
  hemodialise: '#0e7490', hemodialise_continua: '#0e7490',
  plantao_hd: '#0e7490', plantao_uti: '#b03020', plantao_ps: '#b03020',
  plantao_enfermaria: '#9a4a0a', plantao_regulacao: '#9a4a0a',
  dialise_peritoneal_capd: '#1a7a52', dialise_peritoneal_dpa: '#1a7a52',
  dialise_peritoneal_intermitente: '#1a7a52',
  biopsia_renal: '#b03020', cateter_duplo_lumen: '#b03020', cateter_triplo_lumen: '#b03020',
  permcath: '#b03020', tenckhoff: '#b03020', fav: '#b03020', outros: '#7a94a8',
}
const TIPO_BGS = {
  '#1e4f88': '#e8f0fb', '#0e7490': '#e0f5f9', '#7c3aed': '#ede9fe',
  '#9a4a0a': '#fef3e2', '#1a7a52': '#e8f5ef', '#b03020': '#fdecea', '#7a94a8': '#f0f4f8',
}
function getCfg(tipo) {
  const c = TIPO_COLORS[tipo] || '#7a94a8'
  return { color: c, bg: TIPO_BGS[c] || '#f0f4f8' }
}

export default function ChecklistPage({ user }) {
  const [registros,  setRegistros]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtro,     setFiltro]     = useState('todos')
  const [mesOffset,  setMesOffset]  = useState(0)

  const getMes = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes      = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })
  const mesStr   = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`

  useEffect(() => { fetchRegistros() }, [mesOffset])

  async function fetchRegistros() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes    = new Date(mes.getFullYear(), mes.getMonth()+1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase.from('registros').select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes).lte('data', fimMes)
      .order('data', { ascending: false })
    if (!error) setRegistros(data || [])
    setLoading(false)
  }

  async function togglePago(id, pago) {
    await supabase.from('registros').update({ pago: !pago }).eq('id', id)
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, pago: !r.pago } : r))
  }

  const filtrados = registros.filter(r => {
    if (filtro === 'pagos')     return r.pago
    if (filtro === 'pendentes') return !r.pago
    return true
  })

  const totalGeral    = registros.filter(r => r.valor).reduce((s,r) => s + r.valor, 0)
  const totalPago     = registros.filter(r => r.pago && r.valor).reduce((s,r) => s + r.valor, 0)
  const totalPendente = registros.filter(r => !r.pago && r.valor).reduce((s,r) => s + r.valor, 0)
  const qtdPendentes  = registros.filter(r => !r.pago).length

  return (
    <>
      <div className="app-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => setMesOffset(m => m-1)}
            style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', padding:4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Pagamentos
            </div>
            <div style={{ fontSize:16, fontWeight:700, textTransform:'capitalize' }}>{mesLabel}</div>
          </div>
          <button onClick={() => setMesOffset(m => m+1)} disabled={mesOffset >= 0}
            style={{ background:'none', border:'none', color: mesOffset >= 0 ? 'var(--border)':'var(--text2)', cursor: mesOffset >= 0 ? 'default':'pointer', padding:4 }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:6, marginTop:10 }}>
          {[['todos','Todos'],['pendentes','Pendentes'],['pagos','Pagos']].map(([v,l]) => (
            <button key={v} onClick={() => setFiltro(v)} className={`chip ${filtro === v ? 'active' : ''}`}
              style={{ fontSize:12, padding:'5px 12px' }}>
              {l}
              {v === 'pendentes' && qtdPendentes > 0 && (
                <span style={{
                  marginLeft:5,
                  background: filtro === v ? 'rgba(255,255,255,0.3)' : 'var(--amber-dim)',
                  color: filtro === v ? 'white' : 'var(--amber)',
                  borderRadius:99, padding:'1px 6px', fontSize:11, fontWeight:700
                }}>{qtdPendentes}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="app-content">
        {/* Cards resumo */}
        <div style={{ padding:'12px 16px 0', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:4 }}>
          <div className="stat-card" style={{ textAlign:'center' }}>
            <div className="stat-label">Total</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', fontFamily:'var(--mono)' }}>{formatCurrency(totalGeral)}</div>
          </div>
          <div className="stat-card" style={{ textAlign:'center' }}>
            <div className="stat-label">Recebido</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--green)', fontFamily:'var(--mono)' }}>{formatCurrency(totalPago)}</div>
          </div>
          <div className="stat-card" style={{ textAlign:'center' }}>
            <div className="stat-label">Pendente</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--amber)', fontFamily:'var(--mono)' }}>{formatCurrency(totalPendente)}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div className="spinner" style={{ width:32, height:32 }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
            <CheckCircle2 size={44} style={{ marginBottom:14, opacity:0.2 }} />
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>
              {filtro === 'pendentes' ? 'Tudo pago! 🎉' : 'Nenhum registro encontrado'}
            </div>
            <div style={{ fontSize:13 }}>
              {filtro === 'pendentes' ? 'Nenhum pagamento pendente este mês.' : 'Registre atendimentos para acompanhar aqui.'}
            </div>
          </div>
        ) : (
          filtrados.map(reg => {
            const cfg   = getCfg(reg.tipo_producao)
            const Icone = getTipoIcone(reg.tipo_producao)
            return (
              <div key={reg.id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'11px 16px', borderBottom:'1px solid var(--border)',
                background:'var(--card)', transition:'background 0.15s',
                borderLeft:`3px solid ${reg.pago ? 'var(--green)' : 'var(--amber)'}`,
              }}>
                {/* Toggle */}
                <button className={`toggle-pay ${reg.pago ? 'pago' : ''}`}
                  onClick={() => togglePago(reg.id, reg.pago)}
                  title={reg.pago ? 'Marcar pendente' : 'Marcar pago'}
                  style={{ flexShrink:0 }}>
                  {reg.pago && <CheckCircle2 size={14} color="white" />}
                </button>

                {/* Ícone do tipo */}
                <div style={{
                  width:32, height:32, borderRadius:8, flexShrink:0,
                  background: reg.pago ? 'var(--bg2)' : cfg.bg,
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <Icone size={16} color={reg.pago ? 'var(--text3)' : cfg.color} />
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontSize:13, fontWeight:700,
                    color: reg.pago ? 'var(--text3)' : 'var(--text)',
                    textDecoration: reg.pago ? 'line-through' : 'none',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    textTransform:'uppercase', letterSpacing:'0.02em'
                  }}>
                    {reg.paciente_nome || '—'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    {reg.tipo_producao === 'outros' && reg.procedimento_custom
                      ? reg.procedimento_custom
                      : getTipoLabel(reg.tipo_producao)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                    {formatDate(reg.data)}{reg.convenio ? ` · ${reg.convenio.toUpperCase()}` : ''}
                  </div>
                </div>

                {/* Valor + badge */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {reg.valor ? (
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--mono)', color: reg.pago ? 'var(--green)':'var(--text)' }}>
                      {formatCurrency(reg.valor)}
                    </div>
                  ) : (
                    <div style={{ fontSize:13, color:'var(--text3)' }}>—</div>
                  )}
                  <span className={`badge ${reg.pago ? 'badge-green' : 'badge-amber'}`} style={{ marginTop:4, display:'inline-flex' }}>
                    {reg.pago ? '✓ Pago' : '⏳ Pendente'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}