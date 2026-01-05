/* public/sw.js */

// Push mesajı geldiğinde çalışır
self.addEventListener("push", function (event) {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json(); // .NET'ten JSON gönderiyoruz (title, body, url vs.)
  } catch {
    data = { title: "Bildirim", body: event.data.text() };
  }

  const title = data.title || "Bildirim";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: data.url || "/", // tıklayınca açılacak adres (ileride doldururuz)
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Bildirime tıklanınca
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "OPEN_URL", url });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
