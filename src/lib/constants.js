export const TIPOS_PRODUCAO = [
  { value: 'avaliacao_diaria',               label: 'Avaliação diária / Internação' },
  { value: 'atendimento_domiciliar',         label: 'Atendimento domiciliar' },
  { value: 'biopsia_renal',                  label: 'Biópsia renal' },
  { value: 'cateter_duplo_lumen',            label: 'Cateter duplo lúmen (CDL) - Implante' },
  { value: 'cateter_triplo_lumen',           label: 'Cateter triplo lúmen (CDL) - Implante' },
  { value: 'fav',                            label: 'Confecção de FAV' },
  { value: 'consulta_cemig',                 label: 'Consulta médica Cemig' },
  { value: 'consulta_particular',            label: 'Consulta médica particular' },
  { value: 'consulta_unimed',                label: 'Consulta médica Unimed' },
  { value: 'consulta_medica',                label: 'Consulta médica' },
  { value: 'dialise_peritoneal_capd',        label: 'Diálise peritoneal (CAPD) - Consulta mensal' },
  { value: 'dialise_peritoneal_dpa',         label: 'Diálise peritoneal (DPA) - Consulta mensal' },
  { value: 'dialise_peritoneal_intermitente',label: 'Diálise peritoneal intermitente (DPI)' },
  { value: 'hemodialise',                    label: 'Hemodiálise' },
  { value: 'hemodialise_continua',           label: 'Hemodiálise contínua' },
  { value: 'interconsulta',                  label: 'Interconsulta' },
  { value: 'permcath',                       label: 'Permcath - Implante' },
  { value: 'plantao_enfermaria',             label: 'Plantão de Enfermaria' },
  { value: 'plantao_hd',                     label: 'Turno de Hemodiálise' },
  { value: 'plantao_ps',                     label: 'Plantão de PS' },
  { value: 'plantao_regulacao',              label: 'Plantão de Regulação de Leitos' },
  { value: 'plantao_uti',                    label: 'Plantão de UTI' },
  { value: 'retorno',                        label: 'Retorno' },
  { value: 'teleconsulta',                   label: 'Teleconsulta' },
  { value: 'tenckhoff',                      label: 'Tenckhoff - Implante de cateter' },
  { value: 'outros',                         label: 'Outros (especificar)' },
]

export const CONVENIOS = [
  { value: 'cemig',      label: 'Cemig' },
  { value: 'particular', label: 'Particular' },
  { value: 'sus',        label: 'SUS' },
  { value: 'unimed',     label: 'Unimed' },
  { value: 'outros',     label: 'Outros' },
]

export const LOCAIS_PADRAO = [
  { value: 'consultorio_particular', label: 'Consultório particular' },
  { value: 'casa_paciente',          label: 'Casa do paciente' },
  { value: 'hospital_bp',            label: 'Hospital Beneficência Portuguesa' }, 
  { value: 'hospital_ha',            label: 'Hospital Hélio Angotti - Hospital de Câncer do Triângulo' },
  { value: 'hospital_sao_marcos',    label: 'Hospital São Marcos UBeraba' },
  { value: 'hospital_unimed',        label: 'Hospital Unimed Uberaba' },
  { value: 'hopsital_mp',            label: 'Hospital Universitário Mário Palmério ' },
  { value: 'instituto_hemodialise',  label: 'Instituto de Hemodiálise' },
  { value: 'outros',                 label: 'Outro (especificar)' },

]

export const CATEGORIAS_RECEITA = [
  { value: 'ebserh',     label: 'EBSERH' },
  { value: 'uftm',       label: 'UFTM' },
  { value: 'ihtru',      label: 'IHTRU' },
  { value: 'unimed',     label: 'Unimed' },
  { value: 'aluguel',    label: 'Aluguel' },
  { value: 'particular', label: 'Particular' },
  { value: 'outros',     label: 'Outros (especificar)' },
]

export const getCategoriaReceitaLabel = (value) => {
  const c = CATEGORIAS_RECEITA.find(c => c.value === value)
  return c ? c.label : value
}

export const CATEGORIAS_DESPESA = [
  { value: 'crm_cfm',         label: 'Anuidade CRM' },
  { value: 'plano_saude',     label: 'Plano de saúde PF' },
  { value: 'aluguel',         label: 'Aluguel consultório' },
  { value: 'material',        label: 'Material / Equipamento' },
  { value: 'cursos',          label: 'Cursos / Congressos' },
  { value: 'imposto',         label: 'Imposto / Contador' },
  { value: 'celular',         label: 'Celular' },
  { value: 'internet',        label: 'Internet' },
  { value: 'condominio',      label: 'Condomínio' },
  { value: 'cartao_credito',  label: 'Cartão de crédito' },
  { value: 'outros',          label: 'Outros (especificar)' },
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

export const getCategoriaLabel = (value) => {
  const c = CATEGORIAS_DESPESA.find(c => c.value === value)
  return c ? c.label : value
}