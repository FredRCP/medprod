import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, getCategoriaLabel, getCategoriaReceitaLabel } from '../lib/constants'
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, Trash2, RefreshCw, AlertCircle, X, Loader2, TrendingDown, TrendingUp, Download } from 'lucide-react'
import { useToast } from '../hooks/useToast'

const CATEGORIA_COLORS = {
  // despesas
  aluguel:         { color: '#b45309', bg: '#fef3e2' },
  cartao_credito:  { color: '#c0392b', bg: '#fdecea' },
  celular:         { color: '#7c3aed', bg: '#ede9fe' },
  cemig_ap:        { color: '#b45309', bg: '#fef3e2' },
  cemig_casa:      { color: '#b45309', bg: '#fef3e2' },
  condominio_ap:   { color: '#b45309', bg: '#fef3e2' },
  condominio_casa: { color: '#b45309', bg: '#fef3e2' },
  crm_pf:          { color: '#7c3aed', bg: '#ede9fe' },
  crm_pj:          { color: '#7c3aed', bg: '#ede9fe' },
  cursos:          { color: '#1a8f5e', bg: '#e6f7f1' },
  imposto:         { color: '#c0392b', bg: '#fdecea' },
  internet_1:      { color: '#0e7490', bg: '#e0f5f9' },
  internet_2:      { color: '#0e7490', bg: '#e0f5f9' },
  material:        { color: '#1a6fb5', bg: '#e8f2fc' },
  plano_saude:     { color: '#0e7490', bg: '#e0f5f9' },
  sbn:             { color: '#7c3aed', bg: '#ede9fe' },
  // receitas
  aluguel_apa:     { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa1:   { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa2:   { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa3:   { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa4:   { color: '#b45309', bg: '#fef3e2' },
  ebserh:          { color: '#1a6fb5', bg: '#e8f2fc' },
  ihtru:           { color: '#7c3aed', bg: '#ede9fe' },
  particular:      { color: '#1a8f5e', bg: '#e6f7f1' },
  uftm:            { color: '#0e7490', bg: '#e0f5f9' },
  unimed:          { color: '#1a8f5e', bg: '#e6f7f1' },
  outros:          { color: '#7a94a8', bg: '#f0f4f8' },
}
function getCfg(cat) { return CATEGORIA_COLORS[cat] || { color: '#7a94a8', bg: '#f0f4f8' } }

// ── Formulário genérico (despesa ou receita) ──
function FormLancamento({ tipo, onSave, onClose, editData }) {
  const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA
  const [categoria, setCategoria]           = useState(editData?.categoria || '')
  const [categoriaCustom, setCategoriaCustom] = useState('')
  const [valor, setValor]                   = useState(editData?.valor ? String(editData.valor) : '')
  const [data, setData]                     = useState(editData?.data || new Date().toISOString().split('T')[0])
  const [pago, setPago]                     = useState(editData?.pago ?? false)
  const [recorrente, setRecorrente]         = useState(editData?.recorrente ?? false)
  const [diaRef, setDiaRef]                 = useState(
    editData?.dia_vencimento || editData?.dia_recebimento
      ? String(editData.dia_vencimento || editData.dia_recebimento)
      : ''
  )
  const [observacoes, setObservacoes]       = useState(editData?.observacoes || '')
  const [saving, setSaving]                 = useState(false)
  const { toast, showToast }                = useToast()

  const isReceita = tipo === 'receita'

  async function handleSave() {
    if (!categoria)        { showToast('Selecione a categoria'); return }
    if (!valor)            { showToast('Informe o valor'); return }
    setSaving(true)
    try {
      await onSave({
        descricao: categorias.find(c => c.value === categoria)?.label || categoria,
        categoria,
        valor: parseFloat(valor.replace(',', '.')),
        data,
        pago,
        recorrente,
        ...(isReceita
          ? { dia_recebimento: recorrente && diaRef ? parseInt(diaRef) : null }
          : { dia_vencimento:  recorrente && diaRef ? parseInt(diaRef) : null }
        ),
        observacoes: observacoes || null,
        origem: 'manual',
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
          <div style={{ fontSize:17, fontWeight:800 }}>
            {editData ? `Editar ${isReceita ? 'receita' : 'despesa'}` : `Nova ${isReceita ? 'receita' : 'despesa'}`}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="field">
          <label>Categoria *</label>
          <select className="input" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Selecione...</option>
            {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {categoria === 'outros' && (
            <input className="input" style={{ marginTop:8 }} placeholder="Especifique..." value={categoriaCustom} onChange={e => setCategoriaCustom(e.target.value)} />
          )}
        </div>

        <div className="field">
          <label>Valor (R$) *</label>
          <input className="input" type="text" inputMode="decimal" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} />
        </div>

        <div className="field">
          <label>Data</label>
          <input 
            className="input" 
            type="date" 
            value={data} 
            onChange={e => setData(e.target.value)}
            style={{ maxWidth:'100%', minWidth:0, width:'100%' }}
          />
        </div>

        {/* Recorrente */}
        <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
          <div className="switch-wrap">
            <div>
              <div className="switch-label">{isReceita ? 'Receita recorrente' : 'Despesa recorrente'}</div>
              <div className="switch-sub">Aparece todo mês automaticamente</div>
            </div>
            <button className={`switch ${recorrente ? 'on' : ''}`} onClick={() => setRecorrente(r => !r)}>
              <div className="switch-knob" />
            </button>
          </div>
          {recorrente && (
            <div style={{ marginTop:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                {isReceita ? 'Dia de recebimento' : 'Dia do vencimento'}
              </label>
              <input className="input" type="number" min="1" max="31" placeholder="Ex: 10" value={diaRef} onChange={e => setDiaRef(e.target.value)} />
            </div>
          )}
        </div>

        {/* Pago/Recebido */}
        <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
          <div className="switch-wrap">
            <div>
              <div className="switch-label">{isReceita ? 'Marcar como recebido' : 'Marcar como pago'}</div>
              <div className="switch-sub">{isReceita ? 'Já foi recebido?' : 'Já foi pago?'}</div>
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
          {saving && <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} />}
          {editData ? 'Atualizar' : `Salvar ${isReceita ? 'receita' : 'despesa'}`}
        </button>
      </div>
    </div>
  )
}

export default function FinanceiroPage({ user }) {
  const [despesas, setDespesas]         = useState([])
  const [receitas, setReceitas]         = useState([])
  const [receitasRegistro, setReceitasRegistro] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(null) // null | 'receita' | 'despesa'
  const [editData, setEditData]         = useState(null)
  const [editTipo, setEditTipo]         = useState(null)
  const [mesOffset, setMesOffset]       = useState(0)
  const [aba, setAba]                   = useState('resumo')
  const { toast, showToast }            = useToast()

  const getMes   = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes      = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })
  const mesStr   = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`
  const hoje     = new Date().getDate()

  useEffect(() => { fetchTudo() }, [mesOffset])

  async function fetchTudo() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes    = new Date(mes.getFullYear(), mes.getMonth()+1, 0).toISOString().split('T')[0]

    // Receitas manuais
    const { data: recManuais } = await supabase.from('receitas').select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false })

    // Clona recorrentes de receitas — pega o mais recente de cada recorrente
const { data: recRecorrentes } = await supabase.from('receitas').select('*')
  .eq('user_id', user.id)
  .eq('recorrente', true)
  .lt('data', inicioMes)
  .order('data', { ascending: false }) // mais recente primeiro

// Agrupa por descricao e pega só o mais recente de cada um
const recorrentesUnicos = Object.values(
  (recRecorrentes || []).reduce((acc, r) => {
    if (!acc[r.descricao]) acc[r.descricao] = r
    return acc
  }, {})
)

const recorrentesParaClonar = recorrentesUnicos.filter(r =>
  !(recManuais || []).some(d => d.descricao === r.descricao && d.recorrente === true)
)
    if (recorrentesParaClonar.length > 0) {
      const clones = recorrentesParaClonar.map(r => ({
        user_id: user.id,
        descricao: r.descricao,
        categoria: r.categoria,
        valor: r.valor,
        data: `${mesStr}-${String(r.dia_recebimento || 1).padStart(2,'0')}`,
        pago: false,
        recorrente: true,
        dia_recebimento: r.dia_recebimento,
        observacoes: r.observacoes,
        origem: 'manual',
      }))
      await supabase.from('receitas').insert(clones)
      const { data: atualizado } = await supabase.from('receitas').select('*')
        .eq('user_id', user.id)
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false })
      setReceitas(atualizado || [])
    } else {
      setReceitas(recManuais || [])
    }

    // Receitas da tela Registro (honorários com valor)
    const { data: regComValor } = await supabase.from('registros').select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .not('valor', 'is', null)
      .order('data', { ascending: false })
    setReceitasRegistro(regComValor || [])

    // Despesas do mês
const { data: despMes } = await supabase.from('despesas').select('*')
  .eq('user_id', user.id)
  .gte('data', inicioMes)
  .lte('data', fimMes)
  .order('data', { ascending: false })

const { data: despRecorrentes } = await supabase.from('despesas').select('*')
  .eq('user_id', user.id)
  .eq('recorrente', true)
  .lt('data', inicioMes)
  .order('data', { ascending: false })

const despRecorrentesUnicos = Object.values(
  (despRecorrentes || []).reduce((acc, r) => {
    if (!acc[r.descricao]) acc[r.descricao] = r
    return acc
  }, {})
)

const despParaClonar = despRecorrentesUnicos.filter(r =>
  !(despMes || []).some(d => d.descricao === r.descricao && d.recorrente === true)
)

if (despParaClonar.length > 0) {
  const clones = despParaClonar.map(r => ({
    user_id: user.id,
    descricao: r.descricao,
    categoria: r.categoria,
    valor: r.valor,
    data: `${mesStr}-${String(r.dia_vencimento || 1).padStart(2,'00')}`,
    pago: false,
    recorrente: true,
    dia_vencimento: r.dia_vencimento,
    observacoes: r.observacoes,
  }))
  await supabase.from('despesas').insert(clones)
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

  async function handleSave(payload, tipo) {
    if (!navigator.onLine) {
    showToast('Sem conexão. Conecte-se e tente novamente.')
    return}
    const tabela = tipo === 'receita' ? 'receitas' : 'despesas'
    if (editData) {
      const { error } = await supabase.from(tabela).update(payload).eq('id', editData.id)
      if (error) throw error
      showToast(`${tipo === 'receita' ? 'Receita' : 'Despesa'} atualizada!`)
    } else {
      const { error } = await supabase.from(tabela).insert({ ...payload, user_id: user.id })
      if (error) throw error
      showToast(`${tipo === 'receita' ? 'Receita' : 'Despesa'} salva!`)
    }
    fetchTudo()
  }

  async function togglePagoDespesa(id, pago) {
    await supabase.from('despesas').update({ pago: !pago }).eq('id', id)
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, pago: !d.pago } : d))
  }

  async function togglePagoReceita(id, pago) {
    await supabase.from('receitas').update({ pago: !pago }).eq('id', id)
    setReceitas(prev => prev.map(r => r.id === id ? { ...r, pago: !r.pago } : r))
  }

  async function handleDelete(id, tipo) {
    const tabela = tipo === 'receita' ? 'receitas' : 'despesas'
    if (!confirm(`Excluir esta ${tipo === 'receita' ? 'receita' : 'despesa'}?`)) return
    await supabase.from(tabela).delete().eq('id', id)
    if (tipo === 'receita') setReceitas(prev => prev.filter(r => r.id !== id))
    else setDespesas(prev => prev.filter(d => d.id !== id))
    showToast('Excluído!')
  }

  // Totais receitas manuais
  const totalRecManuais    = receitas.reduce((s, r) => s + (r.valor || 0), 0)
  const totalRecRecebidas  = receitas.filter(r => r.pago).reduce((s, r) => s + (r.valor || 0), 0)
  const totalRecPendentes  = receitas.filter(r => !r.pago).reduce((s, r) => s + (r.valor || 0), 0)

  // Totais receitas de registro (honorários)
  const totalHonorarios        = receitasRegistro.reduce((s, r) => s + (r.valor || 0), 0)
  const totalHonorariosRecebidos = receitasRegistro.filter(r => r.pago).reduce((s, r) => s + (r.valor || 0), 0)

  // Total geral receitas
  const totalReceitasGeral    = totalRecManuais + totalHonorarios
  const totalReceitasRecebidas = totalRecRecebidas + totalHonorariosRecebidos

  // Totais despesas
  const totalDespesas          = despesas.reduce((s, d) => s + (d.valor || 0), 0)
  const totalDespesasPagas     = despesas.filter(d => d.pago).reduce((s, d) => s + (d.valor || 0), 0)
  const totalDespesasPendentes = despesas.filter(d => !d.pago).reduce((s, d) => s + (d.valor || 0), 0)

  // Saldo
  const saldo = totalReceitasRecebidas - totalDespesasPagas

  // Alertas despesas
  const alertasDespesas = despesas.filter(d => {
    if (d.pago || !d.dia_vencimento) return false
    const diff = d.dia_vencimento - hoje
    return diff >= 0 && diff <= 3
  })

  // Alertas receitas
  const alertasReceitas = receitas.filter(r => {
    if (r.pago || !r.dia_recebimento) return false
    const diff = r.dia_recebimento - hoje
    return diff >= 0 && diff <= 3
  })

  const totalAlertas = alertasDespesas.length + alertasReceitas.length

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      {showForm && (
        <FormLancamento
          tipo={showForm}
          editData={editTipo === showForm ? editData : null}
          onSave={(payload) => handleSave(payload, showForm)}
          onClose={() => { setShowForm(null); setEditData(null); setEditTipo(null) }}
        />
      )}

      <div className="app-header">
        {/* Título + navegação de mês */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Financeiro</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              <button onClick={() => setMesOffset(m => m-1)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'0 2px', fontSize:16, lineHeight:1 }}>‹</button>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text3)', textTransform:'capitalize' }}>
                {mesOffset === 0 ? 'Este mês' : mesLabel}
              </span>
              <button onClick={() => setMesOffset(m => m+1)} disabled={mesOffset >= 0}
                style={{ background:'none', border:'none', cursor: mesOffset >= 0 ? 'default':'pointer', color: mesOffset >= 0 ? 'var(--border)':'var(--text3)', padding:'0 2px', fontSize:16, lineHeight:1 }}>›</button>
            </div>
          </div>
          {/* Saldo rápido no header */}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Saldo</div>
            <div style={{ fontSize:18, fontWeight:800, color: saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatCurrency(saldo)}
            </div>
          </div>
        </div>

        {/* Abas */}
        <div style={{ display:'flex', gap:0, marginTop:12, background:'var(--bg2)', borderRadius:'var(--radius)', padding:3 }}>
          {[['resumo','Resumo'],['receitas','Receitas'],['despesas','Despesas']].map(([v,l]) => (
            <button key={v} onClick={() => setAba(v)} style={{
              flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer',
              background: aba === v
                ? v === 'receitas' ? 'var(--green)'
                : v === 'despesas' ? 'var(--red)'
                : 'var(--card)'
                : 'transparent',
              color: aba === v ? 'white' : 'var(--text3)',
              fontFamily:'var(--font)', fontWeight:700, fontSize:13,
              boxShadow: aba === v ? 'var(--shadow-sm)' : 'none', transition:'all 0.15s'
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="app-content" style={{ padding:'0 0 80px' }}>

        {/* Alertas */}
        {totalAlertas > 0 && (
          <div style={{ margin:'12px 16px 0', background:'var(--amber-dim)', border:'1px solid var(--amber)', borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <AlertCircle size={16} color="var(--amber)" />
              <span style={{ fontSize:13, fontWeight:700, color:'var(--amber-text)' }}>
                {totalAlertas} lançamento{totalAlertas > 1 ? 's' : ''} com data próxima
              </span>
            </div>
            {alertasDespesas.map(a => (
              <div key={a.id} style={{ fontSize:12, color:'var(--amber-text)', marginTop:2 }}>
                💸 {a.descricao} — vence dia {a.dia_vencimento} · {formatCurrency(a.valor)}
              </div>
            ))}
            {alertasReceitas.map(a => (
              <div key={a.id} style={{ fontSize:12, color:'var(--green-text)', marginTop:2 }}>
                💰 {a.descricao} — recebe dia {a.dia_recebimento} · {formatCurrency(a.valor)}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div className="spinner" style={{ width:32, height:32 }} />
          </div>
        ) : (
          <>
            {/* ── RESUMO ── */}
            {aba === 'resumo' && (
              <div style={{ padding:'12px 16px' }}>
                {/* Saldo */}
                <div style={{
                  background: saldo >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
                  border: `1px solid ${saldo >= 0 ? 'var(--green)' : 'var(--red)'}`,
                  borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, textAlign:'center'
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color: saldo >= 0 ? 'var(--green-text)' : 'var(--red)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                    Saldo do mês
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, color: saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {formatCurrency(saldo)}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Recebido − Despesas pagas</div>
                </div>

                {/* Receitas */}
                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:10, boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <TrendingUp size={16} color="var(--green)" />
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>Receitas</span>
                  </div>
                  {[
                    ['Total previsto', totalReceitasGeral, 'var(--text)'],
                    ['Recebido', totalReceitasRecebidas, 'var(--green)'],
                    ['A receber', totalReceitasGeral - totalReceitasRecebidas, 'var(--amber)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color }}>{formatCurrency(val)}</span>
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'var(--text3)' }}>
                    {receitas.length} manual{receitas.length !== 1 ? 'is' : ''} + {receitasRegistro.length} honorário{receitasRegistro.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Despesas */}
                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <TrendingDown size={16} color="var(--red)" />
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>Despesas</span>
                  </div>
                  {[
                    ['Total previsto', totalDespesas, 'var(--text)'],
                    ['Pago', totalDespesasPagas, 'var(--red)'],
                    ['Pendente', totalDespesasPendentes, 'var(--amber)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color }}>{formatCurrency(val)}</span>
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'var(--text3)' }}>
                    {despesas.length} lançamento{despesas.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}

            {/* ── RECEITAS ── */}
            {aba === 'receitas' && (
              <>
                <div style={{ padding:'12px 16px 4px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  <div className="stat-card" style={{ textAlign:'center' }}>
                    <div className="stat-label">Previsto</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{formatCurrency(totalReceitasGeral)}</div>
                  </div>
                  <div className="stat-card" style={{ textAlign:'center' }}>
                    <div className="stat-label">Recebido</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{formatCurrency(totalReceitasRecebidas)}</div>
                  </div>
                  <div className="stat-card" style={{ textAlign:'center' }}>
                    <div className="stat-label">Pendente</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--amber)' }}>{formatCurrency(totalReceitasGeral - totalReceitasRecebidas)}</div>
                  </div>
                </div>

                {/* Receitas manuais */}
                {receitas.length > 0 && (
                  <>
                    <div className="section-label">Lançamentos manuais</div>
                    {receitas.map(r => {
                      const cfg = getCfg(r.categoria)
                      const recebeEmBreve = r.dia_recebimento && (r.dia_recebimento - hoje) <= 3 && (r.dia_recebimento - hoje) >= 0 && !r.pago
                      return (
                        <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background:'var(--card)', cursor:'pointer' }}
                          onClick={() => { setEditData(r); setEditTipo('receita'); setShowForm('receita') }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <TrendingUp size={16} color={cfg.color} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                {r.descricao}
                              </span>
                              {r.recorrente && <RefreshCw size={11} color="var(--text3)" />}
                              {recebeEmBreve && <AlertCircle size={11} color="var(--green)" />}
                            </div>
                            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                              {getCategoriaReceitaLabel(r.categoria)}
                              {r.dia_recebimento ? ` · recebe dia ${r.dia_recebimento}` : ` · ${formatDate(r.data)}`}
                            </div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                            <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color: r.pago ? 'var(--green)' : 'var(--text)' }}>
                              {formatCurrency(r.valor)}
                            </span>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <button className={`toggle-pay ${r.pago ? 'pago' : ''}`}
                                onClick={e => { e.stopPropagation(); togglePagoReceita(r.id, r.pago) }}>
                                {r.pago && <CheckCircle2 size={14} color="white" />}
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDelete(r.id, 'receita') }}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2 }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {/* Honorários da tela Registro */}
                {receitasRegistro.length > 0 && (
                  <>
                    <div className="section-label">Honorários (Registros)</div>
                    {receitasRegistro.map(r => (
                      <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background:'var(--card)' }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:'var(--green-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <TrendingUp size={16} color="var(--green)" />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {r.paciente_nome || '—'}
                          </div>
                          <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                            {formatDate(r.data)} · {r.convenio?.toUpperCase() || '—'}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color: r.pago ? 'var(--green)' : 'var(--text)' }}>
                            {formatCurrency(r.valor)}
                          </div>
                          <span className={`badge ${r.pago ? 'badge-green' : 'badge-amber'}`} style={{ marginTop:4 }}>
                            {r.pago ? 'Recebido' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {receitas.length === 0 && receitasRegistro.length === 0 && (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
                    <TrendingUp size={40} style={{ marginBottom:12, opacity:0.3 }} />
                    <div style={{ fontSize:15, fontWeight:600 }}>Nenhuma receita este mês</div>
                    <div style={{ fontSize:13, marginTop:6 }}>Toque em + para adicionar</div>
                  </div>
                )}
              </>
            )}

            {/* ── DESPESAS ── */}
            {aba === 'despesas' && (
              <>
                <div style={{ padding:'12px 16px 4px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  <div className="stat-card" style={{ textAlign:'center' }}>
                    <div className="stat-label">Total</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{formatCurrency(totalDespesas)}</div>
                  </div>
                  <div className="stat-card" style={{ textAlign:'center' }}>
                    <div className="stat-label">Pago</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>{formatCurrency(totalDespesasPagas)}</div>
                  </div>
                  <div className="stat-card" style={{ textAlign:'center' }}>
                    <div className="stat-label">Pendente</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--amber)' }}>{formatCurrency(totalDespesasPendentes)}</div>
                  </div>
                </div>

                {despesas.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
                    <TrendingDown size={40} style={{ marginBottom:12, opacity:0.3 }} />
                    <div style={{ fontSize:15, fontWeight:600 }}>Nenhuma despesa este mês</div>
                    <div style={{ fontSize:13, marginTop:6 }}>Toque em + para adicionar</div>
                  </div>
                ) : (
                  despesas.map(desp => {
                    const cfg = getCfg(desp.categoria)
                    const venceEmBreve = desp.dia_vencimento && (desp.dia_vencimento - hoje) <= 3 && (desp.dia_vencimento - hoje) >= 0 && !desp.pago
                    return (
                      <div key={desp.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background: venceEmBreve ? 'rgba(180,83,9,0.03)' : 'var(--card)', cursor:'pointer' }}
                        onClick={() => { setEditData(desp); setEditTipo('despesa'); setShowForm('despesa') }}>
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
                            <button className={`toggle-pay ${desp.pago ? 'pago' : ''}`}
                              onClick={e => { e.stopPropagation(); togglePagoDespesa(desp.id, desp.pago) }}>
                              {desp.pago && <CheckCircle2 size={14} color="white" />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(desp.id, 'despesa') }}
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
          </>
        )}
      </div>
{aba !== 'resumo' && (
  <button className="fab"
    onClick={() => { setEditData(null); setEditTipo(null); setShowForm(aba === 'receitas' ? 'receita' : 'despesa') }}
    style={{
      background: aba === 'receitas' ? 'var(--green)' : 'var(--red)',
      boxShadow: aba === 'receitas' ? '0 4px 16px rgba(26,143,94,0.4)' : '0 4px 16px rgba(192,57,43,0.4)'
    }}>
    <Plus size={22} color="white" />
  </button>
)}
    </>
  )
}