// Service Worker minimo: solo recibe pushes y abre/enfoca la app al tocar
// la notificacion. No cachea nada -- La Pizarra no necesita funcionar
// offline, esto es puramente para que lleguen los recordatorios.

// Chrome en Android exige un manejador de 'fetch' registrado para
// considerar la app instalable (criterio de instalabilidad), aunque no
// haga nada -- sin esto, nunca aparece la opcion de "Instalar". No
// intercepta la peticion (sin respondWith), deja pasar todo a la red
// igual que si no existiera este Service Worker.
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  const datos = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(datos.title || 'La Pizarra', {
      body: datos.body || '',
      icon: '/la-pizarra-icon-192.png',
      data: { url: datos.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((listaClientes) => {
      const abierta = listaClientes.find((c) => c.url === url)
      if (abierta) return abierta.focus()
      return self.clients.openWindow(url)
    }),
  )
})
