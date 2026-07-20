import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TIPOS_PRODUCAO, CONVENIOS, LOCAIS_PADRAO } from '../lib/constants'
import { Trash2, Save, ChevronDown, ChevronUp, DollarSign, Loader2, Copy } from 'lucide-react'
import { useToast } from '../hooks/useToast'

function ListaSelector({ itens, valor, onChange, placeholder = 'Selecione...' }) {
  const [aberta, setAberta] = useState(false)
  const selecionado = itens.find(i => i.value === valor)
  function selecionar(v) { onChange(v); setAberta(false) }

  return (
    <div className="grupo-block" style={{ marginBottom:0 }}>
      <div className="grupo-header" onClick={() => setAberta(a => !a)}>
        <div className="grupo-header-left" style={{ flex:1 }}>
          <span className="grupo-title" style={{ color: selecionado ? 'var(--accent)' : 'var(--text3)', fontWeight: selecionado ? 700 : 500 }}>
            {selecionado ? selecionado.label : placeholder}
          </span>
          {selecionado && <span style={{ fontSize:14, color:'var(--green)' }}>✓</span>}
        </div>
        {aberta ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
      </div>
      {aberta && (
        <div className="grupo-body">
          {valor && (
            <div className="grupo-option" onClick={() => selecionar('')}
              style={{ color:'var(--text3)', fontStyle:'italic', fontSize:13 }}>
              <div className="grupo-option-radio" />
              <span>Limpar seleção</span>
            </div>
          )}
          {itens.map(item => (
            <div key={item.value}
              className={`grupo-option ${valor === item.value ? 'selected' : ''}`}
              onClick={() => selecionar(item.value)}>
              <div className="grupo-option-radio">
                {valor === item.value && <div className="grupo-option-radio-dot" />}
              </div>
              <span className="grupo-option-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RegistroPage({ user }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { showToast, toast } = useToast()
  const editData  = location.state?.edit || null

  const [data,               setData]               = useState(editData?.data || new Date().toISOString().split('T')[0])
  const [tipo,               setTipo]               = useState(editData?.tipo_producao || '')
  const [procedimentoCustom, setProcedimentoCustom] = useState(editData?.procedimento_custom || '')
  const [pacienteNome,       setPacienteNome]       = useState(editData?.paciente_nome || '')
  const [convenio,           setConvenio]           = useState(editData?.convenio || '')
  const [local,              setLocal]              = useState(editData?.local_atendimento || '')
  const [localCustom,        setLocalCustom]        = useState(editData?.local_custom || '')
  const [showFinanceiro,     setShowFinanceiro]     = useState(!!(editData?.valor))
  const [valor,              setValor]              = useState(editData?.valor ? String(editData.valor) : '')
  const [pago,               setPago]               = useState(editData?.pago || false)
  const [observacoes,        setObservacoes]        = useState(editData?.observacoes || '')
  const [saving,             setSaving]             = useState(false)
  const [sugestoes,          setSugestoes]          = useState([])
  const [todosNomes,         setTodosNomes]         = useState([])

  useEffect(() => {
    supabase.from('registros').select('paciente_nome')
      .eq('user_id', user.id).not('paciente_nome', 'is', null)
      .then(({ data }) => {
        const unicos = [...new Set((data || []).map(r => r.paciente_nome).filter(Boolean))].sort()
        setTodosNomes(unicos)
      })
  }, [])

  function handleNomeChange(val) {
    setPacienteNome(val)
    if (val.length < 2) { setSugestoes([]); return }
    setSugestoes(todosNomes.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 6))
  }

  async function handleSave() {
    if (!navigator.onLine) {
    showToast('Sem conexão. Conecte-se e tente novamente.')
    return
  }
    if (!tipo) { showToast('Selecione o tipo de produção'); return }
    if (!data) { showToast('Informe a data'); return }
    setSaving(true)
    try {
      const payload = {
        user_id: user.id, data, tipo_producao: tipo,
        procedimento_custom: tipo === 'outros' ? procedimentoCustom : null,
        paciente_nome: pacienteNome || null,
        convenio: convenio || null,
        local_atendimento: local || null,
        local_custom: local === 'outros' ? localCustom : null,
        valor: showFinanceiro && valor ? parseFloat(valor.replace(',', '.')) : null,
        pago: showFinanceiro ? pago : false,
        observacoes: observacoes || null,
      }
      if (editData) {
        const { error } = await supabase.from('registros').update(payload).eq('id', editData.id)
        if (error) throw error
        showToast('Registro atualizado!')
      } else {
        const { error } = await supabase.from('registros').insert(payload)
        if (error) throw error
        showToast('Registro salvo!')
      }
      setTimeout(() => navigate('/'), 800)
    } catch (err) {
      showToast(err.message || 'Erro ao salvar')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editData) return
    if (!confirm('Excluir este registro?')) return
    await supabase.from('registros').delete().eq('id', editData.id)
    showToast('Registro excluído')
    setTimeout(() => navigate('/'), 600)
  }

async function handleRepetir() {
  const hoje = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('registros').insert({
    user_id: user.id, data: hoje, tipo_producao: tipo,
    procedimento_custom: procedimentoCustom || null,
    paciente_nome: pacienteNome || null,
    convenio: convenio || null,
    local_atendimento: local || null,
    local_custom: localCustom || null,
    valor: showFinanceiro && valor ? parseFloat(valor.replace(',', '.')) : null,
    pago: false, observacoes: observacoes || null,
  })
  if (error) { showToast('Erro ao duplicar'); return }
  showToast('Registro duplicado para hoje!')
  setTimeout(() => navigate('/'), 800)
}

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      <div className="app-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800 }}>
              {editData ? 'Editar registro' : 'Novo registro'}
            </div>
            <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>
              {editData ? `Editando · ${editData.paciente_nome || 'sem nome'}` : 'Preencha os dados do atendimento'}
            </div>
          </div>
          {editData && (
            <button
              onClick={handleRepetir}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 12px', borderRadius:'var(--radius)',
                border:'1px solid var(--border)', background:'var(--card)',
                color:'var(--text2)', fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:'var(--font)'
              }}
            >
              <Copy size={13} /> Repetir hoje
            </button>
          )}
        </div>
      </div>

      <div className="app-content" style={{ padding:'16px 20px 40px' }}>

        {/* Data */}
        <div className="field">
          <label>Data do atendimento *</label>
          <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} />
        </div>

        {/* Tipo */}
        <div className="field">
          <label>Tipo de produção *</label>
          <ListaSelector itens={TIPOS_PRODUCAO} valor={tipo} onChange={setTipo} placeholder="Selecione o tipo de produção..." />
        </div>

        {tipo === 'outros' && (
          <div className="field">
            <label>Especificar procedimento</label>
            <input className="input" type="text" placeholder="Descreva o procedimento..." value={procedimentoCustom} onChange={e => setProcedimentoCustom(e.target.value)} />
          </div>
        )}

        {/* Nome com sugestões */}
        <div className="field">
          <label>Nome do paciente</label>
          <div style={{ position:'relative' }}>
            <input
              className="input" type="text" placeholder="Nome completo"
              value={pacienteNome} onChange={e => handleNomeChange(e.target.value)}
              autoComplete="off"
            />
            {sugestoes.length > 0 && (
              <div style={{
                position:'absolute', top:'100%', left:0, right:0,
                background:'var(--card)', border:'1px solid var(--border)',
                borderRadius:'var(--radius)', boxShadow:'var(--shadow)',
                zIndex:50, overflow:'hidden', marginTop:2
              }}>
                {sugestoes.map(nome => (
                  <div key={nome}
                    onClick={() => { setPacienteNome(nome); setSugestoes([]) }}
                    style={{ padding:'10px 14px', fontSize:14, cursor:'pointer', borderBottom:'1px solid var(--border)', color:'var(--text)', transition:'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >{nome}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Convênio */}
        <div className="field">
          <label>Convênio</label>
          <ListaSelector itens={CONVENIOS} valor={convenio} onChange={setConvenio} placeholder="Selecione o convênio..." />
        </div>

        {/* Local */}
        <div className="field">
          <label>Local de atendimento</label>
          <ListaSelector itens={LOCAIS_PADRAO} valor={local} onChange={setLocal} placeholder="Selecione o local..." />
          {local === 'outros' && (
            <input className="input" type="text" placeholder="Nome do local..." value={localCustom} onChange={e => setLocalCustom(e.target.value)} style={{ marginTop:10 }} />
          )}
        </div>

        {/* Financeiro */}
        <div className="finance-toggle" onClick={() => setShowFinanceiro(v => !v)}>
          <DollarSign size={18} color={showFinanceiro ? 'var(--accent)' : 'var(--text3)'} />
          <span className="finance-toggle-label" style={{ color: showFinanceiro ? 'var(--accent)' : undefined }}>
            Dados financeiros {showFinanceiro ? '(visível)' : ''}
          </span>
          {showFinanceiro ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
        </div>

        {showFinanceiro && (
          <div className="finance-body">
            <div className="field" style={{ marginBottom:16 }}>
              <label>Valor (R$) — opcional</label>
              <input className="input" type="text" inputMode="decimal" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
            <div className="switch-wrap">
              <div>
                <div className="switch-label">Marcar como pago</div>
                <div className="switch-sub">Pagamento já recebido?</div>
              </div>
              <button className={`switch ${pago ? 'on' : ''}`} onClick={() => setPago(p => !p)}>
                <div className="switch-knob" />
              </button>
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="field">
          <label>Observações</label>
          <textarea className="input" placeholder="Anotações adicionais..." value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} />
        </div>

        {/* Botões */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : <Save size={18} />}
            {editData ? 'Atualizar registro' : 'Salvar registro'}
          </button>

          {editData && (
            <button className="btn btn-danger" onClick={handleDelete} style={{ width:'100%' }}>
              <Trash2 size={16} /> Excluir registro
            </button>
          )}
        </div>
      </div>
    </>
  )
}