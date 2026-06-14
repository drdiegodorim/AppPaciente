// Service Worker for medication notifications
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.tag || 'medication-alert',
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'confirm', title: '✅ Tomei o Remédio' },
          { action: 'open_app', title: '📱 Abrir Diário' }
        ],
        data: data.data || {}
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Alerta de Medicamento', options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback text notification
      event.waitUntil(
        self.registration.showNotification('Alerta de Medicamento', {
          body: event.data.text(),
          icon: '/favicon.ico'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  const action = event.action;
  const notification = event.notification;
  const medData = notification.data;

  notification.close();

  // If clicked "Tomei o Remédio" (I took the medication), confirm it
  if (action === 'confirm' && medData.medicationId) {
    event.waitUntil(
      fetch('/api/push/confirm-medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: medData.patientId,
          medicationId: medData.medicationId,
          medicationName: medData.medicationName
        })
      }).then(() => {
        // Find existing window client to focus or open new one
        return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            // Send message to patient dashboard client to refresh intake state in real-time
            if ('postMessage' in client) {
              client.postMessage({
                type: 'MEDICATION_CONFIRMED_VIA_NOTIFICATION',
                medicationId: medData.medicationId,
                medicationName: medData.medicationName,
                dosage: medData.dosage,
                time: medData.time
              });
            }
            if ('focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        });
      })
    );
  } else {
    // Open or focus on the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
