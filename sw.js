self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// فحص الإشارة دورياً حتى والصفحة بالخلفية
async function checkSignal() {
  try {
    const r = await fetch("signal.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    const last = await getLast();
    if (last === null) { await setLast(d.id); return; }
    if (d.id !== last) {
      await setLast(d.id);
      await self.registration.showNotification("📞 مكالمة واردة من العمل", {
        body: d.from ? ("من: " + d.from) : "اضغط للرد على أحمد",
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192'%3E%3Crect width='192' height='192' fill='%231565c0'/%3E%3Ctext x='96' y='130' font-size='110' text-anchor='middle'%3E%F0%9F%93%9E%3C/text%3E%3C/svg%3E",
        vibrate: [400, 200, 400, 200, 400],
        requireInteraction: true,
        tag: "ahmad-call",
        data: { url: "./index.html" },
      });
      const cs = await self.clients.matchAll({ type: "window" });
      cs.forEach((c) => c.postMessage({ type: "RING" }));
    }
  } catch (e) {}
}

// تخزين آخر إشارة عبر Cache API
async function getLast() {
  const c = await caches.open("sig");
  const r = await c.match("last");
  if (!r) return null;
  return (await r.json()).id;
}
async function setLast(id) {
  const c = await caches.open("sig");
  await c.put("last", new Response(JSON.stringify({ id })));
}

setInterval(checkSignal, 5000);

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((cs) => {
      for (const c of cs) if ("focus" in c) return c.focus();
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
