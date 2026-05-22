export const TIPOS_PRODUCAO = [
  { value: 'atendimento_domiciliar',          label: 'Atendimento domiciliar' },
  { value: 'avaliacao_diaria',                label: 'Avaliação diária / Internação' },
  { value: 'biopsia_renal',                   label: 'Biópsia renal' },
  { value: 'cateter_duplo_lumen',             label: 'Cateter duplo lúmen (CDL) - Implante' },
  { value: 'cateter_triplo_lumen',            label: 'Cateter triplo lúmen (CTL) - Implante' },
  { value: 'fav',                             label: 'Confecção de FAV' },
  { value: 'consulta_cemig',                  label: 'Consulta médica Cemig' },
  { value: 'consulta_medica',                 label: 'Consulta médica' },
  { value: 'consulta_particular',             label: 'Consulta médica particular' },
  { value: 'consulta_unimed',                 label: 'Consulta médica Unimed' },
  { value: 'dialise_peritoneal_capd',         label: 'Diálise peritoneal (CAPD) - Consulta mensal' },
  { value: 'dialise_peritoneal_dpa',          label: 'Diálise peritoneal (DPA) - Consulta mensal' },
  { value: 'dialise_peritoneal_intermitente', label: 'Diálise peritoneal intermitente (DPI)' },
  { value: 'hemodialise',                     label: 'Hemodiálise' },
  { value: 'hemodialise_continua',            label: 'Hemodiálise contínua' },
  { value: 'interconsulta',                   label: 'Interconsulta' },
  { value: 'permcath',                        label: 'Permcath - Implante' },
  { value: 'plantao_enfermaria',              label: 'Plantão de Enfermaria' },
  { value: 'plantao_hd',                      label: 'Plantão de Hemodiálise' },
  { value: 'plantao_ps',                      label: 'Plantão de PS' },
  { value: 'plantao_regulacao',               label: 'Plantão de Regulação de Leitos' },
  { value: 'plantao_uti',                     label: 'Plantão de UTI' },
  { value: 'retorno',                         label: 'Retorno' },
  { value: 'teleconsulta',                    label: 'Teleconsulta' },
  { value: 'tenckhoff',                       label: 'Tenckhoff - Implante de cateter' },
  { value: 'outros',                          label: 'Outros (especificar)' },
]

export const CONVENIOS = [
  { value: 'bradesco',   label: 'Bradesco Saúde' },
  { value: 'cassi',      label: 'Cassi' },
  { value: 'cemig',      label: 'Cemig' },
  { value: 'hapvida',    label: 'Hapvida' },
  { value: 'ipsemg',     label: 'IPSEMG' },
  { value: 'ipsm',       label: 'IPSM (Polícia Militar)' },
  { value: 'sus',        label: 'SUS' },
  { value: 'unimed',     label: 'Unimed' },
  { value: 'particular', label: 'Particular' },
  { value: 'outros',     label: 'Outros' },
]

export const LOCAIS_PADRAO = [
  { value: 'casa_paciente',       label: 'Casa do paciente' },
  { value: 'consultorio_particular', label: 'Consultório particular' },
  { value: 'hospital_bp',         label: 'Hospital Beneficência Portuguesa' },
  { value: 'hospital_ha',         label: 'Hospital Hélio Angotti' },
  { value: 'hospital_sao_marcos', label: 'Hospital São Marcos Uberaba' },
  { value: 'hospital_unimed',     label: 'Hospital Unimed Uberaba' },
  { value: 'hospital_mp',         label: 'Hospital Universitário Mário Palmério' },
  { value: 'instituto_hemodialise', label: 'Instituto de Hemodiálise' },
  { value: 'outros',              label: 'Outro (especificar)' },
]

export const CATEGORIAS_RECEITA = [
  { value: 'aluguel_apa',    label: 'Aluguel Apartamento' },
  { value: 'aluguel_casa1',  label: 'Aluguel Casa 104' },
  { value: 'aluguel_casa2',  label: 'Aluguel Casa 106' },
  { value: 'aluguel_casa3',  label: 'Aluguel Casa 108' },
  { value: 'aluguel_casa4',  label: 'Aluguel Casa 112' },
  { value: 'ebserh',         label: 'EBSERH' },
  { value: 'ihtru',          label: 'IHTRU' },
  { value: 'particular',     label: 'Particular' },
  { value: 'uftm',           label: 'UFTM' },
  { value: 'unimed',         label: 'Unimed' },
  { value: 'outros',         label: 'Outros (especificar)' },
]

export const CATEGORIAS_DESPESA = [
  { value: 'aluguel',         label: 'Aluguel consultório' },
  { value: 'cartao_credito',  label: 'Cartão de crédito' },
  { value: 'celular',         label: 'Celular' },
  { value: 'cemig_ap',        label: 'Cemig Apartamento' },
  { value: 'cemig_casa',      label: 'Cemig Casa' },
  { value: 'condominio_ap',   label: 'Condomínio Apartamento' },
  { value: 'condominio_casa', label: 'Condomínio Casa' },
  { value: 'crm_pf',          label: 'Anuidade CRM - PF' },
  { value: 'crm_pj',          label: 'Anuidade CRM - PJ' },
  { value: 'cursos',          label: 'Cursos / Congressos' },
  { value: 'imposto',         label: 'Imposto / Contador' },
  { value: 'internet_1',      label: 'Internet Pais' },
  { value: 'internet_2',      label: 'Internet Casa' },
  { value: 'material',        label: 'Material / Equipamento' },
  { value: 'plano_saude',     label: 'Plano de saúde PF' },
  { value: 'sbn',             label: 'Anuidade SBN' },
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

export const getCategoriaReceitaLabel = (value) => {
  const c = CATEGORIAS_RECEITA.find(c => c.value === value)
  return c ? c.label : value
}