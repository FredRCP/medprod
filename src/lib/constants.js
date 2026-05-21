export const TIPOS_PRODUCAO = [
  { value: 'avaliacao_diaria',              label: 'Avaliação diária / Internação' },
  { value: 'atendimento_domiciliar',        label: 'Atendimento domiciliar' },
  { value: 'biopsia_renal',                 label: 'Biópsia renal' },
  { value: 'cateter_duplo_lumen',           label: 'Cateter duplo lúmen (CDL) - Implante' },
  { value: 'fav',                           label: 'Confecção de FAV' },
  { value: 'consulta_medica',               label: 'Consulta médica' },
  { value: 'dialise_peritoneal_capd',       label: 'Diálise peritoneal (CAPD) - Consulta mensal' },
  { value: 'dialise_peritoneal_dpa',        label: 'Diálise peritoneal (DPA) - consulta mensal' },
  { value: 'dialise_peritoneal_intermitente', label: 'Diálise peritoneal intermitente (DPI)' },
  { value: 'hemodialise',                   label: 'Hemodiálise' },
  { value: 'hemodialise_continua',          label: 'Hemodiálise contínua' },
  { value: 'interconsulta',                 label: 'Interconsulta' },
  { value: 'permcath',                      label: 'Permcath - Implante' },
  { value: 'retorno',                       label: 'Retorno' },
  { value: 'teleconsulta',                  label: 'Teleconsulta' },
  { value: 'tenckhoff',                     label: 'Tenckhoff - Implante de cateter' },
  { value: 'outros',                        label: 'Outros (especificar)' },
]

export const CONVENIOS = [
  { value: 'cemig',      label: 'Cemig' },
  { value: 'particular', label: 'Particular' },
  { value: 'sus',        label: 'SUS' },
  { value: 'unimed',     label: 'Unimed' },
  { value: 'outros',     label: 'Outros' },
]

export const LOCAIS_PADRAO = [
  { value: 'consultorio_particular',  label: 'Consultório particular' },
  { value: 'casa_paciente',           label: 'Domiciliar' },
  { value: 'hospital_sao_marcos',     label: 'Hospital São Marcos' },
  { value: 'hospital_unimed',         label: 'Hospital Unimed' },
  { value: 'instituto_hemodialise',   label: 'Instituto de Hemodiálise' },
  { value: 'outros',                  label: 'Outro (especificar)' },
]

export const getMesAno = (date = new Date()) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export const formatCurrency = (val) => {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export const getTipoLabel = (value) => {
  const t = TIPOS_PRODUCAO.find(t => t.value === value)
  return t ? t.label : value
}
