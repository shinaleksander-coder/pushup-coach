/* =========================================
   SERVICE WORKER
   ========================================= */


const CACHE_NAME = "pushup-coach-v17";


const ASSETS = [
    "./",
    "./index.html",
    "./styles.css?v=14",
    "./storage.js?v=14",
    "./grips.js?v=14",
    "./program.js?v=14",
    "./workout.js?v=14",
    "./ui.js?v=14",
    "./app.js?v=14",
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
                .catch(() => {
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                });
        })
    );
});