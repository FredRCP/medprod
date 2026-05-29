import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, getCategoriaLabel, getCategoriaReceitaLabel } from '../lib/constants'
import { Plus, CheckCircle2, Trash2, RefreshCw, AlertCircle, X, Loader2, TrendingDown, TrendingUp, Calendar, FileText, Download } from 'lucide-react'
import { useToast } from '../hooks/useToast'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const CATEGORIA_COLORS = {
  aluguel:          { color: '#b45309', bg: '#fef3e2' },
  cartao_credito:   { color: '#c0392b', bg: '#fdecea' },
  celular:          { color: '#7c3aed', bg: '#ede9fe' },
  cemig_ap:         { color: '#b45309', bg: '#fef3e2' },
  cemig_casa:       { color: '#b45309', bg: '#fef3e2' },
  condominio_ap:    { color: '#b45309', bg: '#fef3e2' },
  condominio_casa:  { color: '#b45309', bg: '#fef3e2' },
  crm_pf:           { color: '#7c3aed', bg: '#ede9fe' },
  crm_pj:           { color: '#7c3aed', bg: '#ede9fe' },
  contador:         { color: '#c0392b', bg: '#fdecea' },
  internet_1:       { color: '#0e7490', bg: '#e0f5f9' },
  internet_2:       { color: '#0e7490', bg: '#e0f5f9' },
  plano_saude:      { color: '#0e7490', bg: '#e0f5f9' },
  sbn:              { color: '#7c3aed', bg: '#ede9fe' },
  aluguel_apa:      { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa1:    { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa2:    { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa3:    { color: '#b45309', bg: '#fef3e2' },
  aluguel_casa4:    { color: '#b45309', bg: '#fef3e2' },
  ebserh:           { color: '#1a6fb5', bg: '#e8f2fc' },
  ihtru:            { color: '#7c3aed', bg: '#ede9fe' },
  particular:       { color: '#1a8f5e', bg: '#e6f7f1' },
  uftm:             { color: '#0e7490', bg: '#e0f5f9' },
  unimed:           { color: '#1a8f5e', bg: '#e6f7f1' },
  outros:           { color: '#7a94a8', bg: '#f0f4f8' },
  plantao_hd:       { color: '#0e7490', bg: '#e0f5f9' },
  plantao_regulacao:{ color: '#b45309', bg: '#fef3e2' },
}
function getCfg(cat) { return CATEGORIA_COLORS[cat] || { color: '#7a94a8', bg: '#f0f4f8' } }

function FormLancamento({ tipo, onSave, onClose, editData }) {
  const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA
  const isReceita  = tipo === 'receita'

  const [categoria,      setCategoria]      = useState(editData?.categoria || '')
  const [categoriaCustom,setCategoriaCustom]= useState('')
  const [valor,          setValor]          = useState(editData?.valor ? String(editData.valor) : '')
  const [data,           setData]           = useState(editData?.data || new Date().toISOString().split('T')[0])
  const [pago,           setPago]           = useState(editData?.pago ?? false)
  const [recorrente,     setRecorrente]     = useState(editData?.recorrente ?? false)
  const [intervalo,      setIntervalo]      = useState(editData?.intervalo || 'mensal')
  const [diaRef,         setDiaRef]         = useState(
    editData?.dia_vencimento || editData?.dia_recebimento
      ? String(editData.dia_vencimento || editData.dia_recebimento) : ''
  )
  const [mesRecorrencia, setMesRecorrencia] = useState(
    editData?.mes_recorrencia ? String(editData.mes_recorrencia) : ''
  )
  const [parcelado,      setParcelado]      = useState(!!(editData?.parcelas_total))
  const [parcelasTotal,  setParcelasTotal]  = useState(editData?.parcelas_total ? String(editData.parcelas_total) : '')
  const [parcelasPagas,  setParcelasPagas]  = useState(editData?.parcelas_pagas ? String(editData.parcelas_pagas) : '0')
  const [observacoes,    setObservacoes]    = useState(editData?.observacoes || '')
  const [saving,         setSaving]         = useState(false)
  const { toast, showToast }               = useToast()

  async function handleSave() {
    if (!categoria) { showToast('Selecione a categoria'); return }
    if (!valor)     { showToast('Informe o valor'); return }
    if (parcelado && (!parcelasTotal || parseInt(parcelasTotal) < 1)) {
      showToast('Informe o número de parcelas'); return
    }
    if (recorrente && intervalo === 'anual' && !mesRecorrencia) {
      showToast('Selecione o mês de recorrência'); return
    }
    setSaving(true)
    try {
      await onSave({
        descricao: categorias.find(c => c.value === categoria)?.label || categoria,
        categoria,
        valor: parseFloat(valor.replace(',', '.')),
        data, pago, recorrente,
        intervalo: recorrente ? intervalo : 'mensal',
        mes_recorrencia: recorrente && intervalo === 'anual' && mesRecorrencia ? parseInt(mesRecorrencia) : null,
        ...(isReceita
          ? { dia_recebimento: recorrente && diaRef ? parseInt(diaRef) : null }
          : { dia_vencimento:  recorrente && diaRef ? parseInt(diaRef) : null }
        ),
        parcelas_total: parcelado ? parseInt(parcelasTotal) : null,
        parcelas_pagas: parcelado ? parseInt(parcelasPagas) : null,
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

  const parcelasRestantes = parcelado && parcelasTotal
    ? parseInt(parcelasTotal) - parseInt(parcelasPagas || 0) : null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--card)', borderRadius:'var(--radius-lg)', padding:'8px 20px 32px', maxHeight:'92dvh', overflowY:'auto' }}>
        {toast && <div className="toast">{toast}</div>}
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:99, margin:'10px auto 16px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>
            {editData ? `Editar ${isReceita?'receita':'despesa'}` : `Nova ${isReceita?'receita':'despesa'}`}
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
          <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} style={{ maxWidth:'100%', minWidth:0, width:'100%' }} />
        </div>

        {/* Recorrente */}
        <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
          <div className="switch-wrap">
            <div>
              <div className="switch-label">{isReceita ? 'Receita recorrente' : 'Despesa recorrente'}</div>
              <div className="switch-sub">Aparece automaticamente</div>
            </div>
            <button className={`switch ${recorrente ? 'on' : ''}`} onClick={() => setRecorrente(r => !r)}>
              <div className="switch-knob" />
            </button>
          </div>
          {recorrente && (
            <div style={{ marginTop:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Frequência</label>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                {[['mensal','Mensal'],['anual','Anual']].map(([v,l]) => (
                  <span key={v} className={`chip ${intervalo===v?'active':''}`} onClick={() => setIntervalo(v)} style={{ fontSize:13 }}>{l}</span>
                ))}
              </div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                {isReceita ? 'Dia de recebimento' : 'Dia do vencimento'}
              </label>
              <input className="input" type="number" min="1" max="31" placeholder="Ex: 10" value={diaRef} onChange={e => setDiaRef(e.target.value)} />
              {intervalo === 'anual' && (
                <div style={{ marginTop:12 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Mês de vencimento</label>
                  <select className="input" value={mesRecorrencia} onChange={e => setMesRecorrencia(e.target.value)}>
                    <option value="">Selecione o mês...</option>
                    {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Parcelado */}
        <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
          <div className="switch-wrap">
            <div>
              <div className="switch-label">Parcelado</div>
              <div className="switch-sub">Tem número fixo de parcelas</div>
            </div>
            <button className={`switch ${parcelado ? 'on' : ''}`} onClick={() => setParcelado(p => !p)}>
              <div className="switch-knob" />
            </button>
          </div>
          {parcelado && (
            <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Total de parcelas</label>
                <input className="input" type="number" min="1" placeholder="Ex: 6" value={parcelasTotal} onChange={e => setParcelasTotal(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Já pagas</label>
                <input className="input" type="number" min="0" placeholder="0" value={parcelasPagas} onChange={e => setParcelasPagas(e.target.value)} />
              </div>
              {parcelasRestantes !== null && (
                <div style={{ gridColumn:'1/-1', fontSize:12, color:'var(--accent)', fontWeight:700 }}>
                  Restam {parcelasRestantes} parcela{parcelasRestantes !== 1 ? 's' : ''}
                </div>
              )}
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
  const [despesas,         setDespesas]         = useState([])
  const [receitas,         setReceitas]         = useState([])
  const [receitasRegistro, setReceitasRegistro] = useState([])
  const [loading,          setLoading]          = useState(true)
  const [exporting,        setExporting]        = useState(null)
  const [showExportModal,  setShowExportModal]  = useState(null)
  const [exportInicio,     setExportInicio]     = useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`)
  const [exportFim,        setExportFim]        = useState(new Date().toISOString().split('T')[0])
  const [showForm,         setShowForm]         = useState(null)
  const [editData,         setEditData]         = useState(null)
  const [editTipo,         setEditTipo]         = useState(null)
  const [mesOffset,        setMesOffset]        = useState(0)
  const [aba,              setAba]              = useState('resumo')
  const { toast, showToast } = useToast()

  const getMes   = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes      = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })
  const mesStr   = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`
  const mesAtual = mes.getMonth() + 1
  const hoje     = new Date().getDate()

  useEffect(() => { fetchTudo() }, [mesOffset])

  async function clonarRecorrentes(tabela, listaMes, inicioMes, campoData) {
    const { data: recorrentes } = await supabase.from(tabela).select('*')
      .eq('user_id', user.id).eq('recorrente', true)
      .lt('data', inicioMes).order('data', { ascending: false })

    const unicos = Object.values(
      (recorrentes || []).reduce((acc, r) => {
        if (!acc[r.descricao]) acc[r.descricao] = r
        return acc
      }, {})
    )

    const paraClonar = unicos.filter(r => {
      if ((listaMes || []).some(d => d.descricao === r.descricao && d.recorrente === true)) return false
      if (r.parcelas_total && r.parcelas_pagas >= r.parcelas_total) return false
      if (r.intervalo === 'anual' && r.mes_recorrencia && r.mes_recorrencia !== mesAtual) return false
      return true
    })

    if (paraClonar.length === 0) return null

    const clones = paraClonar.map(r => {
      const diaRef = r.dia_vencimento || r.dia_recebimento || 1
      return {
        user_id: user.id, descricao: r.descricao, categoria: r.categoria, valor: r.valor,
        data: `${mesStr}-${String(diaRef).padStart(2,'0')}`,
        pago: false, recorrente: true,
        intervalo: r.intervalo || 'mensal',
        mes_recorrencia: r.mes_recorrencia || null,
        ...(campoData === 'dia_vencimento'  ? { dia_vencimento:  r.dia_vencimento }  : {}),
        ...(campoData === 'dia_recebimento' ? { dia_recebimento: r.dia_recebimento } : {}),
        parcelas_total: r.parcelas_total || null,
        parcelas_pagas: r.parcelas_pagas != null ? r.parcelas_pagas + 1 : null,
        observacoes: r.observacoes, origem: 'manual',
      }
    })

    await supabase.from(tabela).insert(clones)
    for (const r of paraClonar) {
      if (r.parcelas_total) {
        await supabase.from(tabela).update({ parcelas_pagas: (r.parcelas_pagas || 0) + 1 }).eq('id', r.id)
      }
    }
    return true
  }

  async function fetchTudo() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes    = new Date(mes.getFullYear(), mes.getMonth()+1, 0).toISOString().split('T')[0]

    const { data: recManuais } = await supabase.from('receitas').select('*')
      .eq('user_id', user.id).gte('data', inicioMes).lte('data', fimMes)
      .order('data', { ascending: false })
    const clonouRec = await clonarRecorrentes('receitas', recManuais, inicioMes, 'dia_recebimento')
    if (clonouRec) {
      const { data: at } = await supabase.from('receitas').select('*')
        .eq('user_id', user.id).gte('data', inicioMes).lte('data', fimMes).order('data', { ascending: false })
      setReceitas(at || [])
    } else { setReceitas(recManuais || []) }

    const { data: regComValor } = await supabase.from('registros').select('*')
      .eq('user_id', user.id).gte('data', inicioMes).lte('data', fimMes)
      .not('valor', 'is', null).order('data', { ascending: false })
    setReceitasRegistro(regComValor || [])

    const { data: despMes } = await supabase.from('despesas').select('*')
      .eq('user_id', user.id).gte('data', inicioMes).lte('data', fimMes).order('data', { ascending: false })
    const clonouDesp = await clonarRecorrentes('despesas', despMes, inicioMes, 'dia_vencimento')
    if (clonouDesp) {
      const { data: at } = await supabase.from('despesas').select('*')
        .eq('user_id', user.id).gte('data', inicioMes).lte('data', fimMes).order('data', { ascending: false })
      setDespesas(at || [])
    } else { setDespesas(despMes || []) }

    setLoading(false)
  }

  async function handleSave(payload, tipo) {
    if (!navigator.onLine) { showToast('Sem conexão. Conecte-se e tente novamente.'); return }
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

  const totalRecManuais          = receitas.reduce((s,r) => s+(r.valor||0), 0)
  const totalRecRecebidas        = receitas.filter(r=>r.pago).reduce((s,r) => s+(r.valor||0), 0)
  const totalHonorarios          = receitasRegistro.reduce((s,r) => s+(r.valor||0), 0)
  const totalHonorariosRecebidos = receitasRegistro.filter(r=>r.pago).reduce((s,r) => s+(r.valor||0), 0)
  const totalReceitasGeral       = totalRecManuais + totalHonorarios
  const totalReceitasRecebidas   = totalRecRecebidas + totalHonorariosRecebidos
  const totalDespesas            = despesas.reduce((s,d) => s+(d.valor||0), 0)
  const totalDespesasPagas       = despesas.filter(d=>d.pago).reduce((s,d) => s+(d.valor||0), 0)
  const totalDespesasPendentes   = despesas.filter(d=>!d.pago).reduce((s,d) => s+(d.valor||0), 0)
  const saldo                    = totalReceitasRecebidas - totalDespesasPagas

  const alertasDespesas = despesas.filter(d => !d.pago && d.dia_vencimento && (d.dia_vencimento-hoje)>=0 && (d.dia_vencimento-hoje)<=3)
  const alertasReceitas = receitas.filter(r => !r.pago && r.dia_recebimento && (r.dia_recebimento-hoje)>=0 && (r.dia_recebimento-hoje)<=3)
  const totalAlertas    = alertasDespesas.length + alertasReceitas.length

  function getLabelRecorrencia(item) {
    const partes = []
    if (item.parcelas_total) partes.push(`${item.parcelas_pagas||0}/${item.parcelas_total} parcelas`)
    if (item.intervalo === 'anual' && item.mes_recorrencia) partes.push(`anual · ${MESES[item.mes_recorrencia-1]}`)
    return partes.join(' · ')
  }

  async function buscarDadosPeriodo() {
    const { data: rec } = await supabase.from('receitas').select('*')
      .eq('user_id', user.id).gte('data', exportInicio).lte('data', exportFim)
      .order('data', { ascending: true })
    const { data: desp } = await supabase.from('despesas').select('*')
      .eq('user_id', user.id).gte('data', exportInicio).lte('data', exportFim)
      .order('data', { ascending: true })
    const { data: honor } = await supabase.from('registros').select('*')
      .eq('user_id', user.id).gte('data', exportInicio).lte('data', exportFim)
      .not('valor', 'is', null).order('data', { ascending: true })
    return { rec: rec||[], desp: desp||[], honor: honor||[] }
  }

  async function exportPDF() {
    setShowExportModal(null)
    setExporting('pdf')
    try {
      const { rec, desp, honor } = await buscarDadosPeriodo()
      if (rec.length === 0 && desp.length === 0 && honor.length === 0) {
        showToast('Nenhum dado no período'); setExporting(null); return
      }
      const { default: jsPDF }     = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
      const periodoLabel = `${formatDate(exportInicio)} a ${formatDate(exportFim)}`
      const totalRecGeral  = rec.reduce((s,r)=>s+(r.valor||0),0) + honor.reduce((s,r)=>s+(r.valor||0),0)
      const totalRecRec    = rec.filter(r=>r.pago).reduce((s,r)=>s+(r.valor||0),0) + honor.filter(r=>r.pago).reduce((s,r)=>s+(r.valor||0),0)
      const totalDespGeral = desp.reduce((s,d)=>s+(d.valor||0),0)
      const totalDespPago  = desp.filter(d=>d.pago).reduce((s,d)=>s+(d.valor||0),0)
      const saldoPer       = totalRecRec - totalDespPago

      doc.setFont('helvetica','bold'); doc.setFontSize(18)
      doc.text('MedProd — Relatório Financeiro', 14, 20)
      doc.setFont('helvetica','normal'); doc.setFontSize(11)
      doc.text(`Período: ${periodoLabel}`, 14, 30)
      doc.text(`Saldo: ${formatCurrency(saldoPer)}`, 14, 37)
      doc.text(`Receitas: ${formatCurrency(totalRecGeral)}  ·  Despesas: ${formatCurrency(totalDespGeral)}`, 14, 44)

      doc.setFont('helvetica','bold'); doc.setFontSize(13)
      doc.text('Receitas', 14, 56)
      autoTable(doc, {
        startY: 60,
        head: [['Descrição','Categoria','Data','Valor','Status']],
        body: [
          ...rec.map(r => [r.descricao, getCategoriaReceitaLabel(r.categoria), formatDate(r.data), formatCurrency(r.valor), r.pago?'Recebido':'Pendente']),
          ...honor.map(r => [r.paciente_nome||'—','Honorário', formatDate(r.data), formatCurrency(r.valor), r.pago?'Recebido':'Pendente']),
        ],
        styles: { fontSize:8, cellPadding:2 },
        headStyles: { fillColor:[26,143,94] },
        alternateRowStyles: { fillColor:[240,248,244] },
        margin: { left:10, right:10 },
      })

      const y2 = doc.lastAutoTable.finalY + 10
      doc.setFont('helvetica','bold'); doc.setFontSize(13)
      doc.text('Despesas', 14, y2)
      autoTable(doc, {
        startY: y2 + 4,
        head: [['Descrição','Categoria','Data','Valor','Status']],
        body: desp.map(d => [d.descricao, getCategoriaLabel(d.categoria), formatDate(d.data), formatCurrency(d.valor), d.pago?'Pago':'Pendente']),
        styles: { fontSize:8, cellPadding:2 },
        headStyles: { fillColor:[176,48,32] },
        alternateRowStyles: { fillColor:[253,236,234] },
        margin: { left:10, right:10 },
      })

      doc.save(`medprod_financeiro_${exportInicio}_${exportFim}.pdf`)
      showToast('PDF exportado!')
    } catch(err) { showToast('Erro ao gerar PDF'); console.error(err) }
    finally { setExporting(null) }
  }

  async function exportExcel() {
    setShowExportModal(null)
    setExporting('excel')
    try {
      const { rec, desp, honor } = await buscarDadosPeriodo()
      if (rec.length === 0 && desp.length === 0 && honor.length === 0) {
        showToast('Nenhum dado no período'); setExporting(null); return
      }
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MedProd'; wb.created = new Date()
      const periodoLabel = `${formatDate(exportInicio)} a ${formatDate(exportFim)}`
      const hStyle = (cell, cor) => {
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:cor } }
        cell.font = { bold:true, color:{ argb:'FFFFFFFF' }, size:11 }
        cell.alignment = { vertical:'middle', horizontal:'center' }
      }

      // Receitas
      const wsRec = wb.addWorksheet('Receitas')
      wsRec.addRow([`MedProd — Receitas · ${periodoLabel}`]); wsRec.addRow([])
      wsRec.getRow(1).font = { bold:true, size:13, color:{ argb:'FF1A8F5E' } }
      wsRec.columns = [
        { header:'Descrição', key:'desc', width:28 }, { header:'Categoria', key:'cat', width:20 },
        { header:'Data', key:'data', width:12 }, { header:'Valor (R$)', key:'valor', width:14 },
        { header:'Status', key:'status', width:12 }, { header:'Parcelas', key:'parc', width:12 },
      ]
      wsRec.getRow(3).eachCell(cell => hStyle(cell, 'FF1A8F5E')); wsRec.getRow(3).height = 22
      const addRecRow = (desc, cat, data, valor, pago, parc) => {
        const row = wsRec.addRow({ desc, cat, data, valor, status:pago?'Recebido':'Pendente', parc:parc||'' })
        row.getCell('valor').numFmt='R$ #,##0.00'; row.getCell('valor').alignment={horizontal:'right'}
        row.getCell('status').font={bold:true,color:{argb:pago?'FF1A8F5E':'FF9A4A0A'}}
        row.getCell('status').alignment={horizontal:'center'}
      }
      rec.forEach(r => addRecRow(r.descricao, getCategoriaReceitaLabel(r.categoria), formatDate(r.data), r.valor, r.pago, r.parcelas_total?`${r.parcelas_pagas||0}/${r.parcelas_total}`:''))
      honor.forEach(r => addRecRow(r.paciente_nome||'—', 'Honorário', formatDate(r.data), r.valor, r.pago, ''))
      wsRec.addRow({})
      const totRec = wsRec.addRow({ desc:'TOTAL', valor: rec.reduce((s,r)=>s+(r.valor||0),0)+honor.reduce((s,r)=>s+(r.valor||0),0) })
      totRec.font={bold:true}; totRec.getCell('valor').numFmt='R$ #,##0.00'

      // Despesas
      const wsDesp = wb.addWorksheet('Despesas')
      wsDesp.addRow([`MedProd — Despesas · ${periodoLabel}`]); wsDesp.addRow([])
      wsDesp.getRow(1).font = { bold:true, size:13, color:{ argb:'FFB03020' } }
      wsDesp.columns = [
        { header:'Descrição', key:'desc', width:28 }, { header:'Categoria', key:'cat', width:20 },
        { header:'Data', key:'data', width:12 }, { header:'Valor (R$)', key:'valor', width:14 },
        { header:'Status', key:'status', width:12 }, { header:'Parcelas', key:'parc', width:12 },
      ]
      wsDesp.getRow(3).eachCell(cell => hStyle(cell, 'FFB03020')); wsDesp.getRow(3).height = 22
      desp.forEach(d => {
        const row = wsDesp.addRow({ desc:d.descricao, cat:getCategoriaLabel(d.categoria), data:formatDate(d.data), valor:d.valor, status:d.pago?'Pago':'Pendente', parc:d.parcelas_total?`${d.parcelas_pagas||0}/${d.parcelas_total}`:'' })
        row.getCell('valor').numFmt='R$ #,##0.00'; row.getCell('valor').alignment={horizontal:'right'}
        row.getCell('status').font={bold:true,color:{argb:d.pago?'FF1A8F5E':'FF9A4A0A'}}
        row.getCell('status').alignment={horizontal:'center'}
      })
      wsDesp.addRow({})
      const totDesp = wsDesp.addRow({ desc:'TOTAL', valor: desp.reduce((s,d)=>s+(d.valor||0),0) })
      totDesp.font={bold:true}; totDesp.getCell('valor').numFmt='R$ #,##0.00'

      // Resumo
      const wsRes = wb.addWorksheet('Resumo')
      wsRes.columns = [{ header:'Item', key:'item', width:28 }, { header:'Valor (R$)', key:'valor', width:16 }]
      wsRes.getRow(1).eachCell(cell => hStyle(cell, 'FF1E4F88')); wsRes.getRow(1).height = 22
      const totalRecGeral  = rec.reduce((s,r)=>s+(r.valor||0),0)+honor.reduce((s,r)=>s+(r.valor||0),0)
      const totalRecRec    = rec.filter(r=>r.pago).reduce((s,r)=>s+(r.valor||0),0)+honor.filter(r=>r.pago).reduce((s,r)=>s+(r.valor||0),0)
      const totalDespGeral = desp.reduce((s,d)=>s+(d.valor||0),0)
      const totalDespPago  = desp.filter(d=>d.pago).reduce((s,d)=>s+(d.valor||0),0)
      const saldoPer       = totalRecRec - totalDespPago
      const addResRow = (item, valor, cor) => {
        const row = wsRes.addRow({ item, valor })
        row.getCell('valor').numFmt='R$ #,##0.00'; row.getCell('valor').alignment={horizontal:'right'}
        if (cor) row.getCell('valor').font={bold:true,color:{argb:cor}}
      }
      addResRow('Receitas previstas',  totalRecGeral,               null)
      addResRow('Receitas recebidas',  totalRecRec,                 'FF1A8F5E')
      addResRow('Receitas pendentes',  totalRecGeral-totalRecRec,   'FF9A4A0A')
      addResRow('Despesas previstas',  totalDespGeral,              null)
      addResRow('Despesas pagas',      totalDespPago,               'FFB03020')
      addResRow('Despesas pendentes',  totalDespGeral-totalDespPago,'FF9A4A0A')
      addResRow('SALDO DO PERÍODO',    saldoPer, saldoPer>=0?'FF1A8F5E':'FFB03020')

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url; a.download=`medprod_financeiro_${exportInicio}_${exportFim}.xlsx`; a.click()
      URL.revokeObjectURL(url)
      showToast('Excel exportado!')
    } catch(err) { showToast('Erro ao gerar Excel'); console.error(err) }
    finally { setExporting(null) }
  }

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      {/* Modal formulário */}
      {showForm && (
        <FormLancamento
          tipo={showForm}
          editData={editTipo === showForm ? editData : null}
          onSave={(payload) => handleSave(payload, showForm)}
          onClose={() => { setShowForm(null); setEditData(null); setEditTipo(null) }}
        />
      )}

      {/* Modal exportação com período */}
      {showExportModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ width:'100%', maxWidth:400, background:'var(--card)', borderRadius:'var(--radius-lg)', padding:'24px 20px' }}>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>
              {showExportModal === 'pdf' ? '📄 Exportar PDF' : '📊 Exportar Excel'}
            </div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>Selecione o período desejado</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>De</label>
                <input className="input" type="date" value={exportInicio} max={exportFim} onChange={e => setExportInicio(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Até</label>
                <input className="input" type="date" value={exportFim} min={exportInicio} max={new Date().toISOString().split('T')[0]} onChange={e => setExportFim(e.target.value)} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button className="btn btn-ghost" onClick={() => setShowExportModal(null)}>Cancelar</button>
              <button
                onClick={() => showExportModal === 'pdf' ? exportPDF() : exportExcel()}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'11px', borderRadius:'var(--radius)',
                  background: showExportModal==='pdf' ? 'linear-gradient(135deg,#1a6fb5,#0e7490)' : 'linear-gradient(135deg,#1a8f5e,#059669)',
                  color:'white', border:'none', cursor:'pointer',
                  fontSize:14, fontWeight:700, fontFamily:'var(--font)',
                }}>
                {showExportModal==='pdf' ? <FileText size={16} /> : <Download size={16} />}
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-header">
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
                style={{ background:'none', border:'none', cursor: mesOffset>=0?'default':'pointer', color: mesOffset>=0?'var(--border)':'var(--text3)', padding:'0 2px', fontSize:16, lineHeight:1 }}>›</button>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Saldo</div>
            <div style={{ fontSize:18, fontWeight:800, color: saldo>=0?'var(--green)':'var(--red)' }}>{formatCurrency(saldo)}</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:0, marginTop:12, background:'var(--bg2)', borderRadius:'var(--radius)', padding:3 }}>
          {[['resumo','Resumo'],['receitas','Receitas'],['despesas','Despesas']].map(([v,l]) => (
            <button key={v} onClick={() => setAba(v)} style={{
              flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer',
              background: aba===v ? (v==='receitas'?'var(--green)':v==='despesas'?'var(--red)':'var(--card)') : 'transparent',
              color: aba===v ? (v==='resumo'?'var(--accent)':'white') : 'var(--text3)',
              fontFamily:'var(--font)', fontWeight:700, fontSize:13,
              boxShadow: aba===v?'var(--shadow-sm)':'none', transition:'all 0.15s'
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="app-content" style={{ padding:'0 0 80px' }}>

        {totalAlertas > 0 && (
          <div style={{ margin:'12px 16px 0', background:'var(--amber-dim)', border:'1px solid var(--amber)', borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <AlertCircle size={16} color="var(--amber)" />
              <span style={{ fontSize:13, fontWeight:700, color:'var(--amber-text)' }}>
                {totalAlertas} lançamento{totalAlertas>1?'s':''} com data próxima
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
                <div style={{
                  background: saldo>=0?'var(--green-dim)':'var(--red-dim)',
                  border: `1px solid ${saldo>=0?'var(--green)':'var(--red)'}`,
                  borderRadius:'var(--radius-lg)', padding:16, marginBottom:12, textAlign:'center'
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color:saldo>=0?'var(--green-text)':'var(--red)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Saldo do mês</div>
                  <div style={{ fontSize:28, fontWeight:800, color:saldo>=0?'var(--green)':'var(--red)' }}>{formatCurrency(saldo)}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Recebido − Despesas pagas</div>
                </div>

                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:10, boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <TrendingUp size={16} color="var(--green)" />
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>Receitas</span>
                  </div>
                  {[['Total previsto',totalReceitasGeral,'var(--text)'],['Recebido',totalReceitasRecebidas,'var(--green)'],['A receber',totalReceitasGeral-totalReceitasRecebidas,'var(--amber)']].map(([label,val,color]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color }}>{formatCurrency(val)}</span>
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{receitas.length} manual{receitas.length!==1?'is':''} + {receitasRegistro.length} honorário{receitasRegistro.length!==1?'s':''}</div>
                </div>

                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <TrendingDown size={16} color="var(--red)" />
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>Despesas</span>
                  </div>
                  {[['Total previsto',totalDespesas,'var(--text)'],['Pago',totalDespesasPagas,'var(--red)'],['Pendente',totalDespesasPendentes,'var(--amber)']].map(([label,val,color]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color }}>{formatCurrency(val)}</span>
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{despesas.length} lançamento{despesas.length!==1?'s':''}</div>
                </div>

                {/* Botões exportar */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <button onClick={() => setShowExportModal('pdf')} disabled={!!exporting||loading} style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'12px 16px', borderRadius:'var(--radius-lg)',
                    background:'linear-gradient(135deg,#1a6fb5,#0e7490)',
                    color:'white', border:'none', cursor:(!!exporting||loading)?'default':'pointer',
                    fontSize:13, fontWeight:700, fontFamily:'var(--font)',
                    boxShadow:'0 4px 12px rgba(26,111,181,0.35)',
                    opacity:(!!exporting||loading)?0.6:1, transition:'all 0.2s'
                  }}>
                    {exporting==='pdf' ? <Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> : <FileText size={16} />}
                    PDF
                  </button>
                  <button onClick={() => setShowExportModal('excel')} disabled={!!exporting||loading} style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'12px 16px', borderRadius:'var(--radius-lg)',
                    background:'linear-gradient(135deg,#1a8f5e,#059669)',
                    color:'white', border:'none', cursor:(!!exporting||loading)?'default':'pointer',
                    fontSize:13, fontWeight:700, fontFamily:'var(--font)',
                    boxShadow:'0 4px 12px rgba(26,143,94,0.35)',
                    opacity:(!!exporting||loading)?0.6:1, transition:'all 0.2s'
                  }}>
                    {exporting==='excel' ? <Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> : <Download size={16} />}
                    Excel
                  </button>
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
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--amber)' }}>{formatCurrency(totalReceitasGeral-totalReceitasRecebidas)}</div>
                  </div>
                </div>

                {receitas.length > 0 && (
                  <>
                    <div className="section-label">Lançamentos manuais</div>
                    {receitas.map(r => {
                      const cfg = getCfg(r.categoria)
                      const recebeEmBreve = r.dia_recebimento && (r.dia_recebimento-hoje)<=3 && (r.dia_recebimento-hoje)>=0 && !r.pago
                      const labelExtra = getLabelRecorrencia(r)
                      return (
                        <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background:'var(--card)', cursor:'pointer' }}
                          onClick={() => { setEditData(r); setEditTipo('receita'); setShowForm('receita') }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {r.intervalo==='anual' ? <Calendar size={16} color={cfg.color} /> : <TrendingUp size={16} color={cfg.color} />}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.descricao}</span>
                              {r.recorrente && <RefreshCw size={11} color="var(--text3)" />}
                              {recebeEmBreve && <AlertCircle size={11} color="var(--green)" />}
                            </div>
                            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                              {getCategoriaReceitaLabel(r.categoria)}
                              {r.dia_recebimento ? ` · recebe dia ${r.dia_recebimento}` : ` · ${formatDate(r.data)}`}
                              {labelExtra ? ` · ${labelExtra}` : ''}
                            </div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                            <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:r.pago?'var(--green)':'var(--text)' }}>{formatCurrency(r.valor)}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <button className={`toggle-pay ${r.pago?'pago':''}`} onClick={e => { e.stopPropagation(); togglePagoReceita(r.id,r.pago) }}>
                                {r.pago && <CheckCircle2 size={14} color="white" />}
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDelete(r.id,'receita') }}
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

                {receitasRegistro.length > 0 && (
                  <>
                    <div className="section-label">Honorários (Registros)</div>
                    {receitasRegistro.map(r => (
                      <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background:'var(--card)' }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:'var(--green-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <TrendingUp size={16} color="var(--green)" />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.paciente_nome||'—'}</div>
                          <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{formatDate(r.data)} · {r.convenio?.toUpperCase()||'—'}</div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:r.pago?'var(--green)':'var(--text)' }}>{formatCurrency(r.valor)}</div>
                          <span className={`badge ${r.pago?'badge-green':'badge-amber'}`} style={{ marginTop:4 }}>{r.pago?'Recebido':'Pendente'}</span>
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
                    const venceEmBreve = desp.dia_vencimento && (desp.dia_vencimento-hoje)<=3 && (desp.dia_vencimento-hoje)>=0 && !desp.pago
                    const labelExtra = getLabelRecorrencia(desp)
                    return (
                      <div key={desp.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', background:venceEmBreve?'rgba(180,83,9,0.03)':'var(--card)', cursor:'pointer' }}
                        onClick={() => { setEditData(desp); setEditTipo('despesa'); setShowForm('despesa') }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {desp.intervalo==='anual' ? <Calendar size={16} color={cfg.color} /> : <TrendingDown size={16} color={cfg.color} />}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{desp.descricao}</span>
                            {desp.recorrente && <RefreshCw size={11} color="var(--text3)" />}
                            {venceEmBreve && <AlertCircle size={11} color="var(--amber)" />}
                          </div>
                          <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                            {getCategoriaLabel(desp.categoria)}
                            {desp.dia_vencimento ? ` · vence dia ${desp.dia_vencimento}` : ` · ${formatDate(desp.data)}`}
                            {labelExtra ? ` · ${labelExtra}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:desp.pago?'var(--green)':'var(--text)' }}>{formatCurrency(desp.valor)}</span>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <button className={`toggle-pay ${desp.pago?'pago':''}`} onClick={e => { e.stopPropagation(); togglePagoDespesa(desp.id,desp.pago) }}>
                              {desp.pago && <CheckCircle2 size={14} color="white" />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(desp.id,'despesa') }}
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
          onClick={() => { setEditData(null); setEditTipo(null); setShowForm(aba==='receitas'?'receita':'despesa') }}
          style={{
            background: aba==='receitas'?'var(--green)':'var(--red)',
            boxShadow: aba==='receitas'?'0 4px 16px rgba(26,143,94,0.4)':'0 4px 16px rgba(192,57,43,0.4)'
          }}>
          <Plus size={22} color="white" />
        </button>
      )}
    </>
  )
}