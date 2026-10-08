/* =========================================
   PUSH.JS
   Логика push-уведомлений
   ========================================= */


const PUSH_SERVER =
    "https://pushup-push.shin-pushup-coach.workers.dev";

const VAPID_PUBLIC_KEY =
    "BNOjoXEQleMnIzz0eHQxr8R-9f-HHAraAD4rjoXStOcNZI2twf4ljI0rYk_Dcb_T75PmuMe4RmKcu1ikK4mRFqc";


const PUSH_KEYS = {
    subscriptionId: "pushSubscriptionId",
    reminderTime: "pushReminderTime",
    days: "pushDays"
};


function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !window.MSStream;
}


function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}


function pushSupported() {

    if (!("serviceWorker" in navigator)) return false;
    if (!("PushManager" in window)) return false;
    if (!("Notification" in window)) return false;

    // На iOS push работает только в установленном PWA
    if (isIOSDevice() && !isStandalone()) return false;

    return true;
}


function getPushPermissionState() {
    if (!pushSupported()) return "unsupported";
    return Notification.permission;
}


function getPushSettings() {

    const time =
        localStorage.getItem(PUSH_KEYS.reminderTime) || "19:00";

    let days = [1, 3, 5];

    try {
        const stored = JSON.parse(
            localStorage.getItem(PUSH_KEYS.days)
        );
        if (Array.isArray(stored) && stored.length > 0) {
            days = stored;
        }
    } catch (e) { /* дефолт */ }

    return {
        enabled: true,
        reminderTime: time,
        timezone: getTimezone(),
        days
    };
}


function getTimezone() {
    try {
        return Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone || "Europe/Moscow";
    } catch (e) {
        return "Europe/Moscow";
    }
}


function getSubscriptionId() {
    return localStorage.getItem(PUSH_KEYS.subscriptionId) || null;
}


function saveSubscriptionId(id) {
    if (id) {
        localStorage.setItem(PUSH_KEYS.subscriptionId, id);
    }
}


function clearSubscriptionId() {
    localStorage.removeItem(PUSH_KEYS.subscriptionId);
}


function saveReminderTime(time) {
    localStorage.setItem(PUSH_KEYS.reminderTime, time);
}


function saveDays(days) {
    localStorage.setItem(PUSH_KEYS.days, JSON.stringify(days));
}


function urlBase64ToUint8Array(base64String) {

    const padding = "=".repeat(
        (4 - (base64String.length % 4)) % 4
    );

    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
        arr[i] = raw.charCodeAt(i);
    }

    return arr;
}


async function subscribeToPush() {

    if (!pushSupported()) {

        if (isIOSDevice() && !isStandalone()) {
            return {
                ok: false,
                error:
                    "На iPhone уведомления работают только в " +
                    "установленном приложении. Нажмите «Поделиться» " +
                    "в Safari → «На экран Домой», потом откройте " +
                    "приложение с иконки."
            };
        }

        return {
            ok: false,
            error: "Уведомления не поддерживаются на этом устройстве."
        };
    }

    if (Notification.permission === "denied") {
        return {
            ok: false,
            error:
                "Разрешение на уведомления отклонено. Откройте " +
                "Настройки iPhone → Уведомления → Push-Up Coach и " +
                "включите их вручную."
        };
    }

    let permission = Notification.permission;

    if (permission !== "granted") {
        try {
            permission = await Notification.requestPermission();
        } catch (err) {
            return { ok: false, error: "Ошибка запроса разрешения" };
        }
    }

    if (permission !== "granted") {
        return { ok: false, error: "Разрешение не выдано" };
    }

    let registration;
    try {
        registration = await navigator.serviceWorker.ready;
    } catch (err) {
        return { ok: false, error: "Service Worker не готов" };
    }

    let subscription;

    try {
        subscription =
            await registration.pushManager.getSubscription();
    } catch (err) {
        subscription = null;
    }

    if (!subscription) {
        try {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey:
                    urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        } catch (err) {
            return {
                ok: false,
                error: "Не удалось подписаться: " + err.message
            };
        }
    }

    const settings = getPushSettings();

    try {

        const response = await fetch(
            PUSH_SERVER + "/subscribe",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    settings
                })
            }
        );

        if (!response.ok) {
            return {
                ok: false,
                error: "Сервер ответил: " + response.status
            };
        }

        const data = await response.json();

        if (data.id) {
            saveSubscriptionId(data.id);
        }

        return { ok: true };

    } catch (err) {
        return {
            ok: false,
            error: "Ошибка соединения с сервером"
        };
    }
}


async function unsubscribeFromPush() {

    const id = getSubscriptionId();

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription =
            await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
        }
    } catch (err) { /* ignore */ }

    if (id) {
        try {
            await fetch(PUSH_SERVER + "/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
        } catch (err) { /* ignore */ }
    }

    clearSubscriptionId();

    return { ok: true };
}


async function updatePushSettings() {

    const id = getSubscriptionId();
    if (!id) return { ok: false, error: "Нет подписки" };

    try {
        const response = await fetch(PUSH_SERVER + "/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
                settings: getPushSettings()
            })
        });

        return { ok: response.ok };

    } catch (err) {
        return { ok: false, error: "Ошибка соединения" };
    }
}


async function testPushNotification() {

    const id = getSubscriptionId();

    if (!id) {
        return {
            ok: false,
            error: "Сначала включите напоминания"
        };
    }

    try {
        const response = await fetch(PUSH_SERVER + "/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                error: data.error || "Ошибка сервера"
            };
        }

        return { ok: true };

    } catch (err) {
        return { ok: false, error: "Ошибка соединения" };
    }
}