self.addEventListener('sync', event => {
  if (event.tag === 'verificar-vencimentos') {
    event.waitUntil(verificarVencimentos())
  }
})

async function verificarVencimentos() {
  // Vai fazer fetch dos dados e disparar notificações
  // Chamado pelo sistema em background
  const agora = new Date()
  const dia = agora.getDate()
  // Lógica para verificar se é dia de vencimento
  self.registration.showNotification('📅 Lembrete MedProd', {
    body: 'Verifique seus pagamentos e recebimentos',
    icon: '/icon-192.png'
  })
}