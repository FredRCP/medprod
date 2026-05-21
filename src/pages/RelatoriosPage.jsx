import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, getTipoLabel } from '../lib/constants'
import { FileText, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export default function RelatoriosPage({ user }) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)
  const [mesOffset, setMesOffset] = useState(0)
  const { toast, showToast } = useToast()

  const getMes = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + mesOffset)
    return d
  }
  const mes = getMes()
  const mesLabel = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => { fetchRegistros() }, [mesOffset])

  async function fetchRegistros() {
    setLoading(true)
    const inicioMes = `${mesStr}-01`
    const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('registros')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: true })
    setRegistros(data || [])
    setLoading(false)
  }

  // Estatísticas por tipo
  const porTipo = registros.reduce((acc, r) => {
    const key = r.tipo_producao === 'outros' ? (r.procedimento_custom || 'Outros') : getTipoLabel(r.tipo_producao)
    if (!acc[key]) acc[key] = { count: 0, valor: 0 }
    acc[key].count++
    acc[key].valor += r.valor || 0
    return acc
  }, {})

  const totalGeral = registros.reduce((s, r) => s + (r.valor || 0), 0)
  const totalPago = registros.filter(r => r.pago).reduce((s, r) => s + (r.valor || 0), 0)

  async function exportPDF() {
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
      doc.text(`Total de atendimentos: ${registros.length}`, 14, 37)
      doc.text(`Total faturado: ${formatCurrency(totalGeral)}`, 14, 44)
      doc.text(`Total recebido: ${formatCurrency(totalPago)}`, 14, 51)
      doc.text(`A receber: ${formatCurrency(totalGeral - totalPago)}`, 14, 58)

      // Tabela principal
      autoTable(doc, {
        startY: 68,
        head: [['Data', 'Procedimento', 'Paciente', 'Convênio', 'Local', 'Valor', 'Status']],
        body: registros.map(r => [
          formatDate(r.data),
          r.tipo_producao === 'outros' ? (r.procedimento_custom || 'Outros') : getTipoLabel(r.tipo_producao),
          r.paciente_nome || '—',
          r.convenio ? r.convenio.toUpperCase() : '—',
          r.local_custom || r.local_atendimento || '—',
          r.valor ? formatCurrency(r.valor) : '—',
          r.pago ? 'Pago' : 'Pendente',
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [124, 106, 247] },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        columnStyles: {
          0: { cellWidth: 18 }, 1: { cellWidth: 42 }, 2: { cellWidth: 30 },
          3: { cellWidth: 18 }, 4: { cellWidth: 28 }, 5: { cellWidth: 20 }, 6: { cellWidth: 18 }
        }
      })

      // Resumo por tipo
      const finalY = doc.lastAutoTable.finalY + 12
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Resumo por tipo de produção', 14, finalY)
      autoTable(doc, {
        startY: finalY + 6,
        head: [['Tipo', 'Qtd', 'Total']],
        body: Object.entries(porTipo).map(([tipo, { count, valor }]) => [tipo, count, formatCurrency(valor)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [124, 106, 247] },
      })

      doc.save(`medprod_${mesStr}.pdf`)
      showToast('PDF exportado!')
    } catch (err) {
      showToast('Erro ao gerar PDF')
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

  async function exportExcel() {
    setExporting('excel')
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MedProd'
      wb.created = new Date()

      // ── Aba Registros ──
      const ws = wb.addWorksheet('Registros')
      ws.columns = [
        { header: 'Data', key: 'data', width: 12 },
        { header: 'Tipo', key: 'tipo', width: 28 },
        { header: 'Procedimento', key: 'proc', width: 22 },
        { header: 'Paciente', key: 'paciente', width: 24 },
        { header: 'Data Nasc.', key: 'dob', width: 13 },
        { header: 'Idade', key: 'idade', width: 8 },
        { header: 'Convênio', key: 'convenio', width: 13 },
        { header: 'Local', key: 'local', width: 22 },
        { header: 'Valor (R$)', key: 'valor', width: 13 },
        { header: 'Pago', key: 'pago', width: 8 },
        { header: 'Observações', key: 'obs', width: 28 },
      ]
      // Cabeçalho colorido
      ws.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C6AF7' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })
      ws.getRow(1).height = 22

      registros.forEach((r, i) => {
        const row = ws.addRow({
          data: formatDate(r.data),
          tipo: getTipoLabel(r.tipo_producao),
          proc: r.procedimento_custom || '',
          paciente: r.paciente_nome || '',
          dob: r.paciente_dob ? formatDate(r.paciente_dob) : '',
          idade: r.paciente_idade || '',
          convenio: r.convenio ? r.convenio.toUpperCase() : '',
          local: r.local_custom || r.local_atendimento || '',
          valor: r.valor || '',
          pago: r.pago ? 'Sim' : 'Não',
          obs: r.observacoes || '',
        })
        if (i % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } }
          })
        }
        // Colorir coluna Pago
        const pagoCell = row.getCell('pago')
        pagoCell.font = { bold: true, color: { argb: r.pago ? 'FF22C55E' : 'FFF59E0B' } }
      })

      // ── Aba Resumo ──
      const ws2 = wb.addWorksheet('Resumo')
      ws2.columns = [
        { header: 'Tipo', key: 'tipo', width: 32 },
        { header: 'Quantidade', key: 'qtd', width: 13 },
        { header: 'Total (R$)', key: 'valor', width: 15 },
      ]
      ws2.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C6AF7' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      })
      Object.entries(porTipo).forEach(([tipo, { count, valor }]) => {
        ws2.addRow({ tipo, qtd: count, valor })
      })
      ws2.addRow({})
      const totalRow = ws2.addRow({ tipo: 'TOTAL GERAL', qtd: registros.length, valor: totalGeral })
      totalRow.font = { bold: true }
      const pagoRow = ws2.addRow({ tipo: 'TOTAL PAGO', qtd: registros.filter(r => r.pago).length, valor: totalPago })
      pagoRow.font = { bold: true, color: { argb: 'FF22C55E' } }
      const pendRow = ws2.addRow({ tipo: 'TOTAL PENDENTE', qtd: registros.filter(r => !r.pago).length, valor: totalGeral - totalPago })
      pendRow.font = { bold: true, color: { argb: 'FFF59E0B' } }

      // Download
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `medprod_${mesStr}.xlsx`; a.click()
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMesOffset(m => m - 1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Relatórios</div>
            <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{mesLabel}</div>
          </div>
          <button onClick={() => setMesOffset(m => m + 1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }} disabled={mesOffset >= 0}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="app-content" style={{ padding: '16px 20px 100px' }}>
        {/* Exportação */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-ghost" onClick={exportPDF} disabled={!!exporting || loading}>
            {exporting === 'pdf' ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <FileText size={16} />}
            Exportar PDF
          </button>
          <button className="btn btn-ghost" onClick={exportExcel} disabled={!!exporting || loading}>
            {exporting === 'excel' ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={16} />}
            Exportar Excel
          </button>
        </div>

        {/* Resumo financeiro */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Atendimentos</div>
            <div className="stat-value">{registros.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Faturado</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{formatCurrency(totalGeral)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recebido</div>
            <div className="stat-value green" style={{ fontSize: 16 }}>{formatCurrency(totalPago)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">A receber</div>
            <div className="stat-value amber" style={{ fontSize: 16 }}>{formatCurrency(totalGeral - totalPago)}</div>
          </div>
        </div>

        {/* Por tipo */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Por tipo de produção
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : Object.keys(porTipo).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Sem registros neste mês</div>
        ) : (
          Object.entries(porTipo)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([tipo, { count, valor }]) => (
              <div key={tipo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--card)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{tipo}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{count} {count === 1 ? 'atendimento' : 'atendimentos'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: valor > 0 ? 'var(--text)' : 'var(--text3)' }}>
                    {valor > 0 ? formatCurrency(valor) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {totalGeral > 0 && valor > 0 ? `${Math.round((valor / totalGeral) * 100)}%` : ''}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </>
  )
}
