/* =========================================
   SERVICE WORKER
   ========================================= */


const CACHE_NAME = "pushup-coach-v42";


const ASSETS = [
    "./",
    "./index.html",
    "./styles.css?v=33",
    "./storage.js?v=33",
    "./grips.js?v=33",
    "./program.js?v=33",
    "./workout.js?v=33",
    "./push.js?v=33",
    "./leaderboard.js?v=33",
    "./ui.js?v=33",
    "./app.js?v=33",
    "./manifest.json",
    "./icon.svg"
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});


self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (
        event.request.mode === "navigate" ||
        event.request.destination === "document"
    ) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    const copy = response.clone();
                    caches
                        .open(CACHE_NAME)
                        .then(cache => cache.put(event.request, copy));
                    return response;
                })
                .catch(() =>
                    caches
                        .match(event.request)
                        .then(cached => cached || caches.match("./index.html"))
                )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request)
                .then(response => {
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    const copy = response.clone();
                    caches
                        .open(CACHE_NAME)
                        .then(cache =>
                            cache.put(event.request, copy)
                        );
                    return response;
                })
                .catch(() => null);
        })
    );
});


/* =========================================
   PUSH-УВЕДОМЛЕНИЯ
   ========================================= */


self.addEventListener("push", event => {

    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch (err) {
        payload = {
            title: "Push-Up Coach",
            body: event.data ? event.data.text() : ""
        };
    }

    const title = payload.title || "Push-Up Coach";
    const options = {
        body: payload.body || "Пора тренироваться",
        icon: "./icon.svg",
        badge: "./icon.svg",
        tag: payload.tag || "pushup-reminder",
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});


self.addEventListener("notificationclick", event => {

    event.notification.close();

    const targetUrl = self.registration.scope;

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(list => {

                for (const client of list) {
                    const clientUrl = new URL(client.url);
                    const scopeUrl = new URL(self.registration.scope);

                    if (clientUrl.origin === scopeUrl.origin &&
                        clientUrl.pathname.startsWith(scopeUrl.pathname)) {

                        if ("focus" in client) {
                            return client.focus();
                        }
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});