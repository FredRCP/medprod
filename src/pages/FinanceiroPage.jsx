import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, CATEGORIAS_DESPESA, getCategoriaLabel } from '../lib/constants'
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, Trash2, RefreshCw, AlertCircle, X, Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { useToast } from '../hooks/useToast'

const CATEGORIA_COLORS = {
  crm_cfm:        { color: '#7c3aed', bg: '#ede9fe' },
  plano_saude:    { color: '#0e7490', bg: '#e0f5f9' },
  aluguel:        { color: '#b45309', bg: '#fef3e2' },
  material:       { color: '#1a6fb5', bg: '#e8f2fc' },
  cursos:         { color: '#1a8f5e', bg: '#e6f7f1' },
  imposto:        { color: '#c0392b', bg: '#fdecea' },
  celular:        { color: '#7c3aed', bg: '#ede9fe' },
  internet:       { color: '#0e7490', bg: '#e0f5f9' },
  condominio:     { color: '#b45309', bg: '#fef3e2' },
  cartao_credito: { color: '#c0392b', bg: '#fdecea' },
  outros:         { color: '#7a94a8', bg: '#f0f4f8' },
}

function getCfg(cat) {
  return CATEGORIA_COLORS[cat] || CATEGORIA_COLORS.outros
}

function FormDespesa({ onSave, onClose, editData }) {
  const [descricao, setDescricao] = useState(editData?.descricao || '')
  const [categoria, setCategoria] = useState(editData?.categoria || '')
  const [categoriaCustom, setCategoriaCustom] = useState('')
  const [valor, setValor] = useState(editData?.valor ? String(editData.valor) : '')
  const [data, setData] = useState(editData?.data || new Date().toISOString().split('T')[0])
  const [pago, setPago] = useState(editData?.pago ?? false)
  const [recorrente, setRecorrente] = useState(editData?.recorrente ?? false)
  const [diaVencimento, setDiaVencimento] = useState(editData?.dia_vencimento ? String(editData.dia_vencimento) : '')
  const [observacoes, setObservacoes] = useState(editData?.observacoes || '')
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  async function handleSave() {
    if (!descricao.trim()) { showToast('Informe a descrição'); return }
    if (!categoria) { showToast('Selecione a categoria'); return }
    if (!valor) { showToast('Informe o valor'); return }
    setSaving(true)
    try {
      await onSave({
        descricao: descricao.trim(),
        categoria,
        categoria_custom: categoria === 'outros' ? categoriaCustom : null,
        valor: parseFloat(valor.replace(',', '.')),
        data,
        pago,
        recorrente,
        dia_vencimento: recorrente && diaVencimento ? parseInt(diaVencimento) : null,
        observacoes: observacoes || null,
      })
      onClose()
    } catch (err) {
      showToast(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--card)', borderRadius:'20px 20px 0 0', padding:'8px 20px 32px', maxHeight:'92dvh', overflowY:'auto' }}>
        {toast && <div className="toast">{toast}</div>}
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:99, margin:'10px auto 16px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>{editData ? 'Editar despesa' : 'Nova despesa'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={20} /></button>
        </div>

        <div className="field">
          <label>Descrição *</label>
          <input className="input" placeholder="Ex: Aluguel sala consultório..." value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>

        <div className="field">
          <label>Categoria *</label>
          <select className="input" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Selecione...</option>
            {CATEGORIAS_DESPESA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {categoria === 'outros' && (
            <input className="input" style={{ marginTop:8 }} placeholder="Especifique a categoria..." value={categoriaCustom} onChange={e => setCategoriaCustom(e.target.value)} />
          )}
        </div>

        <div className="field">
          <label>Valor (R$) *</label>
          <input className="input" type="text" inputMode="decimal" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} />
        </div>

        <div className="field">
          <label>Data</label>
          <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} />
        </div>

        {/* Recorrente */}
        <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
          <div className="switch-wrap">
            <div>
              <div className="switch-label">Despesa recorrente</div>
              <div className="switch-sub">Aparece todo mês automaticamente</div>
            </div>
            <button className={`switch ${recorrente ? 'on' : ''}`} onClick={() => setRecorrente(r => !r)}>
              <div className="switch-knob" />
            </button>
          </div>
          {recorrente && (
            <div style={{ marginTop:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Dia do vencimento</label>
              <input className="input" type="number" min="1" max="31" placeholder="Ex: 10" value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)} />
            </div>
          )}
        </div>

        {/* Pago */}
        <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
          <div className="switch-wrap">
            <div>
              <div className="switch-label">Marcar como pago</div>
              <div className="switch-sub">Já foi pago este mês?</div>
            </div>
            <button className={`switch ${pago ? 'on' : ''}`} onClick={() => setPago(p => !p)}>
              <div className="switch-knob" />
            </button>
          </div>
        </div>

        <div className="field">
          <label>Observações</label>
          <textarea className="input" placeholder="Anotações..." value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : null}
          {editData ? 'Atualizar' : 'Salvar despesa'}
        </button>
      </div>
    </div>
  )
}

export default function FinanceiroPage({ user }) {
  const [despesas, setDespesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [mesOffset, setMesOffset] = useState(0)
  const [aba, setAba] = useState('despesas') // 'despesas' | 'resumo'
  const { toast, showToast } = useToast()

  const getMes = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesStr = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`
  const hoje = new Date().getDate()

  useEffect(() => { fetchDespesas() }, [mesOffset])

  async function fetchDespesas() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes = new Date(mes.getFullYear(), mes.getMonth()+1, 0).toISOString().split('T')[0]

    // Busca despesas do mês
    const { data: despMes } = await supabase.from('despesas').select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false })

    // Busca despesas recorrentes de outros meses que ainda não foram clonadas
    const { data: recorrentes } = await supabase.from('despesas').select('*')
      .eq('user_id', user.id)
      .eq('recorrente', true)
      .lt('data', inicioMes)

    // Para cada recorrente, verifica se já existe no mês atual
    const recorrentesParaClonar = (recorrentes || []).filter(r => {
      const jaExiste = (despMes || []).some(d => d.descricao === r.descricao && d.recorrente === true)
      return !jaExiste
    })

    // Clona recorrentes no mês atual
    if (recorrentesParaClonar.length > 0) {
      const clones = recorrentesParaClonar.map(r => ({
        user_id: user.id,
        descricao: r.descricao,
        categoria: r.categoria,
        valor: r.valor,
        data: `${mesStr}-${String(r.dia_vencimento || 1).padStart(2,'0')}`,
        pago: false,
        recorrente: true,
        dia_vencimento: r.dia_vencimento,
        observacoes: r.observacoes,
      }))
      await supabase.from('despesas').insert(clones)
      // Recarrega
      const { data: atualizado } = await supabase.from('despesas').select('*')
        .eq('user_id', user.id)
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false })
      setDespesas(atualizado || [])
    } else {
      setDespesas(despMes || [])
    }
    setLoading(false)
  }

  async function handleSave(payload) {
    if (editData) {
      const { error } = await supabase.from('despesas').update(payload).eq('id', editData.id)
      if (error) throw error
      showToast('Despesa atualizada!')
    } else {
      const { error } = await supabase.from('despesas').insert({ ...payload, user_id: user.id })
      if (error) throw error
      showToast('Despesa salva!')
    }
    fetchDespesas()
  }

  async function togglePago(id, pago) {
    await supabase.from('despesas').update({ pago: !pago }).eq('id', id)
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, pago: !d.pago } : d))
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('despesas').delete().eq('id', id)
    setDespesas(prev => prev.filter(d => d.id !== id))
    showToast('Despesa excluída')
  }

  // Totais
  const totalDespesas = despesas.reduce((s, d) => s + (d.valor || 0), 0)
  const totalPago = despesas.filter(d => d.pago).reduce((s, d) => s + (d.valor || 0), 0)
  const totalPendente = despesas.filter(d => !d.pago).reduce((s, d) => s + (d.valor || 0), 0)

  // Alertas — vence hoje ou nos próximos 3 dias e não pago
  const alertas = despesas.filter(d => {
    if (d.pago || !d.dia_vencimento) return false
    const diff = d.dia_vencimento - hoje
    return diff >= 0 && diff <= 3
  })

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      {(showForm || editData) && (
        <FormDespesa
          editData={editData}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditData(null) }}
        />
      )}

      <div className="app-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => setMesOffset(m => m-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', padding:4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Financeiro</div>
            <div style={{ fontSize:15, fontWeight:700, textTransform:'capitalize' }}>{mesLabel}</div>
          </div>
          <button onClick={() => setMesOffset(m => m+1)} disabled={mesOffset >= 0} style={{ background:'none', border:'none', cursor: mesOffset >= 0 ? 'default' : 'pointer', color: mesOffset >= 0 ? 'var(--border)' : 'var(--text2)', padding:4 }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Abas */}
        <div style={{ display:'flex', gap:0, marginTop:10, background:'var(--bg2)', borderRadius:'var(--radius)', padding:3 }}>
          {[['despesas','Despesas'],['resumo','Resumo']].map(([v,l]) => (
            <button key={v} onClick={() => setAba(v)} style={{
              flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer',
              background: aba === v ? 'var(--card)' : 'transparent',
              color: aba === v ? 'var(--accent)' : 'var(--text3)',
              fontFamily:'var(--font)', fontWeight:700, fontSize:13,
              boxShadow: aba === v ? 'var(--shadow-sm)' : 'none', transition:'all 0.15s'
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="app-content" style={{ padding:'0 0 80px' }}>

        {/* Alertas de vencimento */}
        {alertas.length > 0 && (
          <div style={{ margin:'12px 16px 0', background:'var(--amber-dim)', border:'1px solid var(--amber)', borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <AlertCircle size={16} color="var(--amber)" />
              <span style={{ fontSize:13, fontWeight:700, color:'var(--amber-text)' }}>
                {alertas.length} despesa{alertas.length > 1 ? 's' : ''} vencendo em breve
              </span>
            </div>
            {alertas.map(a => (
              <div key={a.id} style={{ fontSize:12, color:'var(--amber-text)', marginTop:2 }}>
                · {a.descricao} — dia {a.dia_vencimento} · {formatCurrency(a.valor)}
              </div>
            ))}
          </div>
        )}

        {/* Cards de resumo */}
        <div style={{ padding:'12px 16px 0', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:4 }}>
          <div className="stat-card" style={{ textAlign:'center' }}>
            <div className="stat-label">Total</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{formatCurrency(totalDespesas)}</div>
          </div>
          <div className="stat-card" style={{ textAlign:'center' }}>
            <div className="stat-label">Pago</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--green)' }}>{formatCurrency(totalPago)}</div>
          </div>
          <div className="stat-card" style={{ textAlign:'center' }}>
            <div className="stat-label">Pendente</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--amber)' }}>{formatCurrency(totalPendente)}</div>
          </div>
        </div>

        {aba === 'despesas' && (
          <>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                <div className="spinner" style={{ width:32, height:32 }} />
              </div>
            ) : despesas.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
                <TrendingDown size={40} style={{ marginBottom:12, opacity:0.3 }} />
                <div style={{ fontSize:15, fontWeight:600 }}>Nenhuma despesa este mês</div>
                <div style={{ fontSize:13, marginTop:6 }}>Toque em + para adicionar</div>
              </div>
            ) : (
              despesas.map(desp => {
                const cfg = getCfg(desp.categoria)
                const venceHoje = desp.dia_vencimento === hoje && !desp.pago
                const venceEmBreve = desp.dia_vencimento && (desp.dia_vencimento - hoje) <= 3 && (desp.dia_vencimento - hoje) >= 0 && !desp.pago
                return (
                  <div key={desp.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background: venceHoje ? 'rgba(180,83,9,0.04)' : 'var(--card)', cursor:'pointer' }}
                    onClick={() => setEditData(desp)}>
                    <div style={{ width:34, height:34, borderRadius:9, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <TrendingDown size={16} color={cfg.color} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {desp.descricao}
                        </span>
                        {desp.recorrente && <RefreshCw size={11} color="var(--text3)" />}
                        {venceEmBreve && <AlertCircle size={11} color="var(--amber)" />}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                        {getCategoriaLabel(desp.categoria)}
                        {desp.dia_vencimento ? ` · vence dia ${desp.dia_vencimento}` : ` · ${formatDate(desp.data)}`}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color: desp.pago ? 'var(--green)' : 'var(--text)' }}>
                        {formatCurrency(desp.valor)}
                      </span>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button
                          className={`toggle-pay ${desp.pago ? 'pago' : ''}`}
                          onClick={e => { e.stopPropagation(); togglePago(desp.id, desp.pago) }}
                          title={desp.pago ? 'Marcar pendente' : 'Marcar pago'}
                        >
                          {desp.pago && <CheckCircle2 size={14} color="white" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(desp.id) }}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {aba === 'resumo' && (
          <div style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
              Por categoria
            </div>
            {CATEGORIAS_DESPESA.map(cat => {
              const itens = despesas.filter(d => d.categoria === cat.value)
              if (itens.length === 0) return null
              const total = itens.reduce((s, d) => s + (d.valor || 0), 0)
              const pago = itens.filter(d => d.pago).reduce((s, d) => s + (d.valor || 0), 0)
              const cfg = getCfg(cat.value)
              return (
                <div key={cat.value} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:'var(--card)', borderRadius:'var(--radius-lg)', marginBottom:8, border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <TrendingDown size={15} color={cfg.color} />
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{cat.label}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{itens.length} lançamento{itens.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)' }}>{formatCurrency(total)}</div>
                    <div style={{ fontSize:11, color:'var(--green)', marginTop:1 }}>pago {formatCurrency(pago)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditData(null); setShowForm(true) }}
        style={{
          position:'fixed', bottom:80, right: 'max(20px, calc(50% - 220px))',
          width:52, height:52, borderRadius:'50%',
          background:'var(--red)', color:'white',
          display:'flex', alignItems:'center', justifyContent:'center',
          border:'none', cursor:'pointer', zIndex:90,
          boxShadow:'0 4px 16px rgba(192,57,43,0.4)',
          transition:'all 0.2s'
        }}
      >
        <Plus size={22} />
      </button>
    </>
  )
}