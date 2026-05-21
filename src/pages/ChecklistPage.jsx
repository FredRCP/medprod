import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, getTipoLabel } from '../lib/constants'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ChecklistPage({ user }) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos') // todos | pendentes | pagos
  const [mesOffset, setMesOffset] = useState(0)

  const getMes = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + mesOffset)
    return d
  }
  const mes = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    fetchRegistros()
  }, [mesOffset])

  async function fetchRegistros() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false })
    if (!error) setRegistros(data || [])
    setLoading(false)
  }

  async function togglePago(id, pago) {
    await supabase.from('registros').update({ pago: !pago }).eq('id', id)
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, pago: !r.pago } : r))
  }

  const filtrados = registros.filter(r => {
    if (filtro === 'pagos') return r.pago
    if (filtro === 'pendentes') return !r.pago
    return true
  })

  const totalGeral = registros.filter(r => r.valor).reduce((s, r) => s + r.valor, 0)
  const totalPago = registros.filter(r => r.pago && r.valor).reduce((s, r) => s + r.valor, 0)
  const totalPendente = registros.filter(r => !r.pago && r.valor).reduce((s, r) => s + r.valor, 0)

  return (
    <>
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMesOffset(m => m - 1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pagamentos</div>
            <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{mesLabel}</div>
          </div>
          <button onClick={() => setMesOffset(m => m + 1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }} disabled={mesOffset >= 0}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="app-content">
        {/* Totais */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Total</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{formatCurrency(totalGeral)}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Pago</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(totalPago)}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Pendente</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber)' }}>{formatCurrency(totalPendente)}</div>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[['todos', 'Todos'], ['pendentes', 'Pendentes'], ['pagos', 'Pagos']].map(([v, l]) => (
              <button key={v} onClick={() => setFiltro(v)} style={{
                padding: '6px 14px', borderRadius: 99, border: '1px solid',
                borderColor: filtro === v ? 'var(--accent)' : 'var(--border2)',
                background: filtro === v ? 'var(--accent-dim)' : 'transparent',
                color: filtro === v ? 'var(--accent2)' : 'var(--text2)',
                fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600, cursor: 'pointer'
              }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <CheckCircle2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>{filtro === 'pendentes' ? 'Nenhum pagamento pendente!' : 'Nenhum registro encontrado'}</div>
          </div>
        ) : (
          filtrados.map(reg => (
            <div key={reg.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <button
                className={`toggle-pay ${reg.pago ? 'pago' : ''}`}
                onClick={() => togglePago(reg.id, reg.pago)}
                title={reg.pago ? 'Marcar como pendente' : 'Marcar como pago'}
              >
                {reg.pago ? <CheckCircle2 size={14} color="white" /> : null}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: reg.pago ? 'var(--text3)' : 'var(--text)', textDecoration: reg.pago ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {reg.tipo_producao === 'outros' && reg.procedimento_custom ? reg.procedimento_custom : getTipoLabel(reg.tipo_producao)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  {formatDate(reg.data)}{reg.paciente_nome ? ` · ${reg.paciente_nome}` : ''}{reg.convenio ? ` · ${reg.convenio.toUpperCase()}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {reg.valor ? (
                  <div style={{ fontSize: 14, fontWeight: 700, color: reg.pago ? 'var(--green)' : 'var(--text)', fontFamily: 'var(--mono)' }}>
                    {formatCurrency(reg.valor)}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>—</div>
                )}
                <span className={`badge ${reg.pago ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: 4 }}>
                  {reg.pago ? 'Pago' : 'Pendente'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
