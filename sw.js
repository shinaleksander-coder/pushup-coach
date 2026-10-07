/* =========================================
   SERVICE WORKER
   Network-first для HTML.
   ========================================= */


const CACHE_NAME = "pushup-coach-v23";


const ASSETS = [
    "./",
    "./index.html",
    "./styles.css?v=19",
    "./storage.js?v=19",
    "./grips.js?v=19",
    "./program.js?v=19",
    "./workout.js?v=19",
    "./ui.js?v=19",
    "./app.js?v=19",
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