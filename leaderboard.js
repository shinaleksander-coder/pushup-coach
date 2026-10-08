/* =========================================
   LEADERBOARD.JS
   Логика рейтинга
   ========================================= */


const LEADERBOARD_SERVER =
    "https://pushup-push.shin-pushup-coach.workers.dev";


/* =========================================
   DEVICE ID
   ========================================= */


function getLeaderboardDeviceId() {

    let id = localStorage.getItem("pushupDeviceId");

    if (!id || id.length < 8) {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        id = Array.from(arr)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
        localStorage.setItem("pushupDeviceId", id);
    }

    return id;
}


/* =========================================
   СБОР СТАТИСТИКИ
   ========================================= */


function collectLeaderboardStats() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    if (history.length === 0) return null;

    let bestSet = 0;
    let totalVolume = 0;

    history.forEach(r => {
        totalVolume += Number(r.totalActual) || 0;
        r.results?.forEach(res => {
            const a = Number(res.actual);
            if (a > bestSet) bestSet = a;
        });
    });

    const sorted = [...history].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let firstBestSet = 0;
    sorted[0]?.results?.forEach(res => {
        const a = Number(res.actual);
        if (a > firstBestSet) firstBestSet = a;
    });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const last30 = history.filter(r =>
        new Date(r.date).getTime() >= thirtyDaysAgo
    ).length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekly = history.filter(r =>
        new Date(r.date).getTime() >= sevenDaysAgo
    );

    let weeklyBestSet = 0;
    let weeklyVolume = 0;

    weekly.forEach(r => {
        weeklyVolume += Number(r.totalActual) || 0;
        r.results?.forEach(res => {
            const a = Number(res.actual);
            if (a > weeklyBestSet) weeklyBestSet = a;
        });
    });

    return {
        deviceId: getLeaderboardDeviceId(),
        name: settings.name || "Спортсмен",
        bestSet,
        firstBestSet,
        totalVolume,
        totalWorkouts: history.length,
        last30Workouts: last30,
        weeklyBestSet,
        weeklyVolume
    };
}


/* =========================================
   ОТПРАВКА
   ========================================= */


async function submitToLeaderboard() {

    const stats = collectLeaderboardStats();
    if (!stats) return { ok: false, error: "no data" };

    try {
        const res = await fetch(
            LEADERBOARD_SERVER + "/leaderboard/submit",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stats)
            }
        );

        const data = await res.json();

        if (res.status === 409 && data.error === "name locked") {
            // Ник закреплён — пробуем переименоваться
            const renamed = await renameOnServer(stats.name);
            if (renamed) {
                return submitToLeaderboard();
            }
            return { ok: false, error: "name locked" };
        }

        return { ok: res.ok, data };

    } catch (err) {
        return { ok: false, error: "network" };
    }
}


async function loadLeaderboard() {

    try {
        const res = await fetch(LEADERBOARD_SERVER + "/leaderboard");
        const data = await res.json();
        if (res.ok && data.ok) return data;
        return null;
    } catch (err) {
        return null;
    }
}


async function renameOnServer(newName) {

    const deviceId = getLeaderboardDeviceId();

    try {
        const res = await fetch(
            LEADERBOARD_SERVER + "/leaderboard/rename",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId, name: newName })
            }
        );
        return res.ok;
    } catch (err) {
        return false;
    }
}


async function deleteMeFromLeaderboard() {

    const deviceId = getLeaderboardDeviceId();

    try {
        const res = await fetch(
            LEADERBOARD_SERVER + "/leaderboard/delete",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId })
            }
        );
        return res.ok;
    } catch (err) {
        return false;
    }
}