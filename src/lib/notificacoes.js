export async function solicitarPermissao() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export function dispararNotificacao(titulo, opcoes = {}) {
  if (Notification.permission !== 'granted') return
  new Notification(titulo, {
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    ...opcoes
  })
}

export function agendarNotificacao(titulo, diaDoMes, opcoes = {}) {
  if (Notification.permission !== 'granted') return

  const agora = new Date()
  const hoje  = agora.getDate()
  const alvo  = new Date(agora.getFullYear(), agora.getMonth(), diaDoMes, 9, 0, 0)
  const delay = alvo - agora

  if (diaDoMes < hoje) {
    // Já passou — dispara imediatamente ao abrir o app
    dispararNotificacao(titulo, opcoes)
  } else if (diaDoMes === hoje) {
    // É hoje — dispara imediatamente também
    dispararNotificacao(titulo, opcoes)
  } else if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) {
    // Nos próximos 7 dias — agenda pro horário certo
    setTimeout(() => {
      new Notification(titulo, {
        icon: '/icon-192.png',
        badge: '/favicon.ico',
        ...opcoes
      })
    }, delay)
  }
}