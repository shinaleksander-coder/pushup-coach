/* =========================================
   SERVICE WORKER
   ========================================= */


const CACHE_NAME = "pushup-coach-v33";


const ASSETS = [
    "./",
    "./index.html",
    "./styles.css?v=26",
    "./storage.js?v=26",
    "./grips.js?v=26",
    "./program.js?v=26",
    "./workout.js?v=26",
    "./push.js?v=26",
    "./leaderboard.js?v=26",
    "./ui.js?v=26",
    "./app.js?v=26",
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
        data: {
            url: payload.url || "./"
        },
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});


self.addEventListener("notificationclick", event => {

    event.notification.close();

    const targetUrl = event.notification.data?.url || "./";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(list => {

                for (const client of list) {
                    if ("focus" in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});