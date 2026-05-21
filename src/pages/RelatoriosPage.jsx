import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, getTipoLabel, TIPOS_PRODUCAO, CONVENIOS, LOCAIS_PADRAO } from '../lib/constants'
import { FileText, Download, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { useToast } from '../hooks/useToast'

function FiltroRelatorio({ filtros, onChange }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:16, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        <SlidersHorizontal size={14} /> Filtrar exportação
      </div>

      {/* Status */}
      <div className="field">
        <label>Status</label>
        <div style={{ display:'flex', gap:8 }}>
          {[['','Todos'],['pago','Pagos'],['pendente','Pendentes']].map(([v,l]) => (
            <span key={v} className={`chip ${filtros.status === v ? 'active' : ''}`} onClick={() => onChange({ ...filtros, status: v })}>{l}</span>
          ))}
        </div>
      </div>

      {/* Nome */}
      <div className="field">
        <label>Nome do paciente</label>
        <input className="input" placeholder="Filtrar por nome..." value={filtros.nome} onChange={e => onChange({ ...filtros, nome: e.target.value })} />
      </div>

      {/* Tipo */}
      <div className="field">
        <label>Tipo de produção</label>
        <select className="input" value={filtros.tipo} onChange={e => onChange({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos os tipos</option>
          {TIPOS_PRODUCAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Convênio */}
      <div className="field">
        <label>Convênio</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[{value:'',label:'Todos'}, ...CONVENIOS].map(c => (
            <span key={c.value} className={`chip ${filtros.convenio === c.value ? 'active' : ''}`} onClick={() => onChange({ ...filtros, convenio: c.value })}>{c.label}</span>
          ))}
        </div>
      </div>

      {/* Local */}
      <div className="field" style={{ marginBottom:0 }}>
        <label>Local</label>
        <select className="input" value={filtros.local} onChange={e => onChange({ ...filtros, local: e.target.value })}>
          <option value="">Todos os locais</option>
          {LOCAIS_PADRAO.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function RelatoriosPage({ user }) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)
  const [mesOffset, setMesOffset] = useState(0)
  const [showFiltros, setShowFiltros] = useState(false)
  const [filtros, setFiltros] = useState({ status:'', nome:'', tipo:'', convenio:'', local:'' })
  const { toast, showToast } = useToast()

  const getMes = () => { const d = new Date(); d.setMonth(d.getMonth() + mesOffset); return d }
  const mes = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesStr = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}`

  useEffect(() => { fetchRegistros() }, [mesOffset])

  async function fetchRegistros() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes = new Date(mes.getFullYear(), mes.getMonth()+1, 0).toISOString().split('T')[0]
    const { data } = await supabase.from('registros').select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: true })
    setRegistros(data || [])
    setLoading(false)
  }

  const temFiltroAtivo = Object.values(filtros).some(v => v)

  const filtrados = useMemo(() => registros.filter(r => {
    if (filtros.status === 'pago' && !r.pago) return false
    if (filtros.status === 'pendente' && r.pago) return false
    if (filtros.nome && !r.paciente_nome?.toLowerCase().includes(filtros.nome.toLowerCase())) return false
    if (filtros.tipo && r.tipo_producao !== filtros.tipo) return false
    if (filtros.convenio && r.convenio !== filtros.convenio) return false
    if (filtros.local && r.local_atendimento !== filtros.local) return false
    return true
  }), [registros, filtros])

  const porTipo = filtrados.reduce((acc, r) => {
    const key = r.tipo_producao === 'outros' ? (r.procedimento_custom || 'Outros') : getTipoLabel(r.tipo_producao)
    if (!acc[key]) acc[key] = { count: 0, valor: 0 }
    acc[key].count++
    acc[key].valor += r.valor || 0
    return acc
  }, {})

  const totalGeral = filtrados.reduce((s, r) => s + (r.valor || 0), 0)
  const totalPago = filtrados.filter(r => r.pago).reduce((s, r) => s + (r.valor || 0), 0)

  function descricaoFiltros() {
    const partes = []
    if (filtros.status === 'pago') partes.push('Pagos')
    if (filtros.status === 'pendente') partes.push('Pendentes')
    if (filtros.tipo) partes.push(getTipoLabel(filtros.tipo))
    if (filtros.convenio) partes.push(filtros.convenio.toUpperCase())
    if (filtros.local) partes.push(LOCAIS_PADRAO.find(l => l.value === filtros.local)?.label || filtros.local)
    if (filtros.nome) partes.push(`Paciente: ${filtros.nome}`)
    return partes.length > 0 ? partes.join(' · ') : 'Todos os registros'
  }

  async function exportPDF() {
    if (filtrados.length === 0) { showToast('Nenhum registro para exportar'); return }
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('MedProd — Relatório de Produção', 14, 20)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Período: ${mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}`, 14, 30)
      doc.text(`Filtro: ${descricaoFiltros()}`, 14, 37)
      doc.text(`Total de registros: ${filtrados.length}`, 14, 44)
      doc.text(`Total faturado: ${formatCurrency(totalGeral)}`, 14, 51)
      doc.text(`Total recebido: ${formatCurrency(totalPago)}`, 14, 58)
      doc.text(`A receber: ${formatCurrency(totalGeral - totalPago)}`, 14, 65)

      autoTable(doc, {
        startY: 75,
        head: [['Data', 'Procedimento', 'Paciente', 'Convênio', 'Local', 'Valor', 'Status']],
        body: filtrados.map(r => [
          formatDate(r.data),
          r.tipo_producao === 'outros' ? (r.procedimento_custom || 'Outros') : getTipoLabel(r.tipo_producao),
          r.paciente_nome || '—',
          r.convenio ? r.convenio.toUpperCase() : '—',
          r.local_custom || r.local_atendimento || '—',
          r.valor ? formatCurrency(r.valor) : '—',
          r.pago ? 'Pago' : 'Pendente',
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [26, 111, 181] },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        columnStyles: {
          0: { cellWidth: 18 }, 1: { cellWidth: 42 }, 2: { cellWidth: 30 },
          3: { cellWidth: 18 }, 4: { cellWidth: 28 }, 5: { cellWidth: 20 }, 6: { cellWidth: 18 }
        }
      })

      const finalY = doc.lastAutoTable.finalY + 12
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Resumo por tipo de produção', 14, finalY)
      autoTable(doc, {
        startY: finalY + 6,
        head: [['Tipo', 'Qtd', 'Total']],
        body: Object.entries(porTipo).map(([tipo, { count, valor }]) => [tipo, count, formatCurrency(valor)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [26, 111, 181] },
      })

      const nomeFiltro = temFiltroAtivo ? `_${filtros.status || filtros.tipo || 'filtrado'}` : ''
      doc.save(`medprod_${mesStr}${nomeFiltro}.pdf`)
      showToast('PDF exportado!')
    } catch (err) {
      showToast('Erro ao gerar PDF')
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

async function exportExcel() {
  if (filtrados.length === 0) { showToast('Nenhum registro para exportar'); return }
  setExporting('excel')
  try {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    wb.creator = 'MedProd'
    wb.created = new Date()

    const ws = wb.addWorksheet('Registros')

    // Linha de título
    ws.addRow(['MedProd — Relatório de Produção'])
    ws.addRow([`Período: ${mesLabel}`])
    ws.addRow([`Filtro: ${descricaoFiltros()}`])
    ws.addRow([]) // linha em branco

    // Estilo das 3 primeiras linhas
    ws.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF1A6FB5' } }
    ws.getRow(2).font = { size: 11, color: { argb: 'FF4A6075' } }
    ws.getRow(3).font = { size: 11, italic: true, color: { argb: 'FF7A94A8' } }

    // Cabeçalho na linha 5
    ws.columns = [
      { header: 'Data',        key: 'data',     width: 12 },
      { header: 'Tipo',        key: 'tipo',     width: 30 },
      { header: 'Paciente',    key: 'paciente', width: 26 },
      { header: 'Convênio',    key: 'convenio', width: 13 },
      { header: 'Local',       key: 'local',    width: 24 },
      { header: 'Valor (R$)',  key: 'valor',    width: 13 },
      { header: 'Pago',        key: 'pago',     width: 10 },
      { header: 'Observações', key: 'obs',      width: 30 },
    ]

    // Estilo do cabeçalho (linha 5)
    ws.getRow(5).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A6FB5' } }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1a6fb5' } }
      }
    })
    ws.getRow(5).height = 24

    // Dados
    filtrados.forEach((r, i) => {
      const row = ws.addRow({
        data:     formatDate(r.data),
        tipo:     r.tipo_producao === 'outros' ? (r.procedimento_custom || 'Outros') : getTipoLabel(r.tipo_producao),
        paciente: r.paciente_nome || '—',
        convenio: r.convenio ? r.convenio.toUpperCase() : '—',
        local:    r.local_custom || r.local_atendimento || '—',
        valor:    r.valor ? r.valor : '—',
        pago:     r.pago ? 'Sim' : 'Não',
        obs:      r.observacoes || '',
      })
      // Zebrado
      if (i % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
        })
      }
      // Coluna valor formatada
      const valorCell = row.getCell('valor')
      if (r.valor) {
        valorCell.numFmt = 'R$ #,##0.00'
        valorCell.value = r.valor
        valorCell.alignment = { horizontal: 'right' }
      }
      // Coluna pago colorida
      const pagoCell = row.getCell('pago')
      pagoCell.font = { bold: true, color: { argb: r.pago ? 'FF1A8F5E' : 'FFB45309' } }
      pagoCell.alignment = { horizontal: 'center' }
    })

    // Aba Resumo
    const ws2 = wb.addWorksheet('Resumo')
    ws2.columns = [
      { header: 'Tipo',       key: 'tipo',  width: 34 },
      { header: 'Quantidade', key: 'qtd',   width: 13 },
      { header: 'Total (R$)', key: 'valor', width: 16 },
    ]
    ws2.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A6FB5' } }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    ws2.getRow(1).height = 24

    Object.entries(porTipo).forEach(([tipo, { count, valor }]) => {
      const row = ws2.addRow({ tipo, qtd: count, valor })
      const valorCell = row.getCell('valor')
      valorCell.numFmt = 'R$ #,##0.00'
      valorCell.alignment = { horizontal: 'right' }
    })

    ws2.addRow({})

    const addResumoRow = (label, qtd, valor, cor) => {
      const row = ws2.addRow({ tipo: label, qtd, valor })
      row.font = { bold: true, color: cor ? { argb: cor } : undefined }
      row.getCell('valor').numFmt = 'R$ #,##0.00'
      row.getCell('valor').alignment = { horizontal: 'right' }
    }
    addResumoRow('TOTAL GERAL',    filtrados.length,                          totalGeral,            null)
    addResumoRow('TOTAL PAGO',     filtrados.filter(r => r.pago).length,      totalPago,             'FF1A8F5E')
    addResumoRow('TOTAL PENDENTE', filtrados.filter(r => !r.pago).length,     totalGeral - totalPago,'FFB45309')

    // Download
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const nomeFiltro = temFiltroAtivo ? `_${filtros.status || filtros.tipo || 'filtrado'}` : ''
    a.href = url
    a.download = `medprod_${mesStr}${nomeFiltro}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Excel exportado!')
  } catch (err) {
    showToast('Erro ao gerar Excel')
    console.error(err)
  } finally {
    setExporting(null)
  }
}

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <div className="app-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => setMesOffset(m => m-1)} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', padding:4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Relatórios</div>
            <div style={{ fontSize:16, fontWeight:700, textTransform:'capitalize' }}>{mesLabel}</div>
          </div>
          <button onClick={() => setMesOffset(m => m+1)} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', padding:4 }} disabled={mesOffset >= 0}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="app-content" style={{ padding:'16px 20px 40px' }}>

        {/* Toggle filtros */}
        <button
          onClick={() => setShowFiltros(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'11px 16px', borderRadius:'var(--radius-lg)', border:'1.5px solid', borderColor: temFiltroAtivo ? 'var(--accent)' : 'var(--border)', background: temFiltroAtivo ? 'var(--accent-dim)' : 'var(--card)', color: temFiltroAtivo ? 'var(--accent)' : 'var(--text2)', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:12, marginTop: 12, boxShadow:'var(--shadow-sm)' }}
        >
          <SlidersHorizontal size={16} />
          <span style={{ flex:1, textAlign:'left' }}>
            {temFiltroAtivo ? `Filtro: ${descricaoFiltros()}` : 'Filtrar relatório'}
          </span>
          {temFiltroAtivo && (
            <span onClick={e => { e.stopPropagation(); setFiltros({ status:'', nome:'', tipo:'', convenio:'', local:'' }) }}
              style={{ fontSize:12, color:'var(--red)', fontWeight:700 }}>
              <X size={14} /> Limpar
            </span>
          )}
        </button>

        {showFiltros && <FiltroRelatorio filtros={filtros} onChange={setFiltros} />}

        {/* Botões exportar */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <button className="btn btn-ghost" onClick={exportPDF} disabled={!!exporting || loading}>
            {exporting === 'pdf' ? <Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> : <FileText size={16} />}
            Exportar PDF
          </button>
          <button className="btn btn-ghost" onClick={exportExcel} disabled={!!exporting || loading}>
            {exporting === 'excel' ? <Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> : <Download size={16} />}
            Exportar Excel
          </button>
        </div>

        {/* Resumo */}
        <div className="stat-grid" style={{ marginBottom:16 }}>
          <div className="stat-card">
            <div className="stat-label">Registros</div>
            <div className="stat-value accent">{filtrados.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Faturado</div>
            <div className="stat-value" style={{ fontSize:16 }}>{formatCurrency(totalGeral)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recebido</div>
            <div className="stat-value green" style={{ fontSize:16 }}>{formatCurrency(totalPago)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">A receber</div>
            <div className="stat-value amber" style={{ fontSize:16 }}>{formatCurrency(totalGeral - totalPago)}</div>
          </div>
        </div>

        <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
          Por tipo de produção
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div className="spinner" style={{ width:32, height:32 }} />
          </div>
        ) : Object.keys(porTipo).length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>
            {temFiltroAtivo ? 'Nenhum resultado para os filtros aplicados' : 'Sem registros neste mês'}
          </div>
        ) : (
          Object.entries(porTipo)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([tipo, { count, valor }]) => (
              <div key={tipo} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'var(--card)', borderRadius:12, marginBottom:8, border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{tipo}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{count} {count === 1 ? 'atendimento' : 'atendimentos'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--mono)', color: valor > 0 ? 'var(--text)' : 'var(--text3)' }}>
                    {valor > 0 ? formatCurrency(valor) : '—'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    {totalGeral > 0 && valor > 0 ? `${Math.round((valor/totalGeral)*100)}%` : ''}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </>
  )
}