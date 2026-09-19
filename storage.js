/* =========================================
   STORAGE.JS
   Работа с localStorage и настройками.
   ========================================= */


const STORAGE_KEYS = {
    history: "workoutHistory",
    activeWorkout: "activeWorkout",
    settings: "appSettings",
    weightHistory: "weightHistory",
    installDismissed: "installDismissed",
    welcomeShown: "welcomeShown",
    migrationV12: "migrationV12"
};


function loadJSON(key, fallback) {

    try {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        return JSON.parse(value);
    } catch (error) {
        console.warn("Ошибка чтения localStorage:", error);
        return fallback;
    }
}


function saveJSON(key, value) {

    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn("Не удалось сохранить данные:", error);
        return false;
    }
}


function removeStorage(key) {

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("Не удалось удалить данные:", error);
    }
}


const defaultSettings = {
    name: "Спортсмен",
    weight: null
};


const settings = {
    ...defaultSettings,
    ...loadJSON(STORAGE_KEYS.settings, {})
};