/* =========================================
   SERVICE WORKER
   Офлайн-кэш приложения.
   ========================================= */


const CACHE_NAME = "pushup-coach-v6";


const ASSETS = [
    "./",
    "./index.html",
    "./styles.css?v=5",
    "./storage.js?v=5",
    "./program.js?v=5",
    "./workout.js?v=5",
    "./ui.js?v=5",
    "./app.js?v=5",
    "./manifest.json",
    "./icon.svg"
];


/* =========================================
   УСТАНОВКА
   ========================================= */


self.addEventListener("install", event => {

    event.waitUntil(

        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});


/* =========================================
   АКТИВАЦИЯ
   ========================================= */


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


/* =========================================
   ПЕРЕХВАТ ЗАПРОСОВ
   Стратегия: cache-first с fallback на сеть.
   ========================================= */


self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Не кэшируем сторонние запросы
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

                    // Офлайн и нет в кэше — отдаём главную
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                });
        })
    );
});