/* =========================================
   APP.JS
   Точка входа с защитой от падений.
   ========================================= */


/* =========================================
   БЕЗОПАСНЫЕ ХЕЛПЕРЫ
   ========================================= */


function on(id, event, fn) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, fn);
    } else {
        console.warn("Не найден элемент:", id);
    }
}


let firstStartupError = null;

function safeRun(label, fn) {
    try {
        fn();
    } catch (err) {
        console.error("Ошибка " + label + ":", err);
        if (!firstStartupError) {
            firstStartupError = label + ": " + err.message;
        }
    }
}


/* =========================================
   ПОДПИСКИ НА КНОПКИ
   ========================================= */


on("startWorkout", "click", () => {
    if (typeof startNewWorkout === "function") startNewWorkout();
});

on("continueWorkout", "click", () => {
    if (typeof continueExistingWorkout === "function") continueExistingWorkout();
});

on("extraWorkout", "click", () => {
    if (typeof startExtraWorkout === "function") startExtraWorkout();
});

on("minusRep", "click", () => {
    if (typeof decreaseReps === "function") decreaseReps();
});

on("plusRep", "click", () => {
    if (typeof increaseReps === "function") increaseReps();
});

on("completeSet", "click", () => {
    if (typeof completeCurrentSet === "function") completeCurrentSet();
});

on("failedSet", "click", () => {
    if (typeof failCurrentSet === "function") failCurrentSet();
});

on("skipRest", "click", () => {
    if (typeof skipRest === "function") skipRest();
});

on("addRest", "click", () => {
    if (typeof addRest === "function") addRest();
});

on("exitWorkout", "click", () => {
    if (typeof exitWorkout === "function") exitWorkout();
});

on("doneHome", "click", () => {
    if (typeof goHome === "function") goHome();
});

on("historyButton", "click", () => {
    if (typeof showHistory === "function") showHistory();
});

on("programButton", "click", () => {
    if (typeof showProgram === "function") showProgram();
});

on("progressButton", "click", () => {
    if (typeof showProgress === "function") showProgress();
});

on("settingsButton", "click", () => {
    if (typeof showSettings === "function") showSettings();
});

on("saveSettings", "click", () => {
    if (typeof handleSaveSettings === "function") handleSaveSettings();
});

on("resetProgress", "click", () => {
    if (typeof resetProgress === "function") resetProgress();
});

on("shareApp", "click", () => {
    if (typeof shareApp === "function") shareApp();
});

on("checkUpdate", "click", () => {
    if (typeof checkForUpdates === "function") checkForUpdates();
});

on("exportData", "click", () => {
    if (typeof exportData === "function") exportData();
});

on("importData", "click", () => {
    const fileInput = document.getElementById("importFile");
    if (fileInput) fileInput.click();
});

on("importFile", "change", event => {
    const file = event.target.files[0];
    if (file && typeof importDataFile === "function") {
        importDataFile(file);
        event.target.value = "";
    }
});

on("showWelcomeAgain", "click", () => {
    if (typeof showWelcomeAgain === "function") showWelcomeAgain();
});

on("globalBack", "click", () => {
    if (typeof goHome === "function") goHome();
});

on("gripVisual", "click", () => {
    if (typeof openGripModal === "function") openGripModal();
});

on("gripModalClose", "click", () => {
    if (typeof closeGripModal === "function") closeGripModal();
});

on("gripModal", "click", event => {
    if (event.target.id === "gripModal" &&
        typeof closeGripModal === "function") {
        closeGripModal();
    }
});

on("achievementModalClose", "click", () => {
    if (typeof closeAchievementModal === "function") closeAchievementModal();
});

on("achievementModal", "click", event => {
    if (event.target.id === "achievementModal" &&
        typeof closeAchievementModal === "function") {
        closeAchievementModal();
    }
});

on("welcomeStart", "click", () => {
    if (typeof handleWelcomeStart === "function") handleWelcomeStart();
});


/* =========================================
   КНОПКИ РЕЖИМА ПРОГРАММЫ
   ========================================= */


document
    .querySelectorAll(".mode-button")
    .forEach(btn => {
        btn.addEventListener("click", () => {

            const mode = btn.dataset.mode;

            let history = [];
            try {
                history = loadJSON(STORAGE_KEYS.history, []);
            } catch (e) {
                console.warn(e);
            }

            const programIndex =
                history.filter(r => !r.isExtra).length;

            if (programIndex > 0 && mode !== "custom") {

                const modes = (typeof PROGRAM_MODES !== "undefined")
                    ? PROGRAM_MODES
                    : {};

                const newConfig =
                    modes[mode] || modes.base || { daysPerWeek: 3 };

                const newDays = newConfig.daysPerWeek || 3;

                const newWeek =
                    Math.floor(programIndex / newDays) + 1;

                const newDay =
                    (programIndex % newDays) + 1;

                const title = btn.querySelector(".mode-button-title");
                const label = title ? title.textContent : mode;

                const ok = confirm(
                    `Сменить режим на «${label}»?\n\n` +
                    `Ты прошёл ${programIndex} плановых тренировок.\n` +
                    `В новой программе продолжишь с Недели ${newWeek}, Дня ${newDay}.\n\n` +
                    `История, вес и достижения сохранятся.`
                );

                if (!ok) return;
            }

            settings.programMode = mode;
            saveJSON(STORAGE_KEYS.settings, settings);

            if (typeof rebuildProgram === "function") rebuildProgram();
            if (typeof renderProgram === "function") renderProgram();
            if (typeof renderHome === "function") renderHome();
        });
    });


/* =========================================
   ПРИМЕНИТЬ СВОЮ ПРОГРАММУ
   ========================================= */


on("saveCustom", "click", () => {

    const daysEl = document.getElementById("customDays");
    const setsEl = document.getElementById("customSets");
    const repBaseEl = document.getElementById("customRepBase");
    const growthEl = document.getElementById("customGrowth");

    if (!daysEl || !setsEl || !repBaseEl || !growthEl) return;

    const days = Number(daysEl.value);
    const sets = Number(setsEl.value);
    const repBase = Number(repBaseEl.value);
    const growth = Number(growthEl.value);

    if (!Number.isFinite(repBase) ||
        repBase < 3 || repBase > 20) {
        alert("Старт повторов: от 3 до 20.");
        return;
    }

    const history = loadJSON(STORAGE_KEYS.history, []);
    const programIndex =
        history.filter(r => !r.isExtra).length;

    if (programIndex > 0) {

        const newWeek = Math.floor(programIndex / days) + 1;
        const newDay = (programIndex % days) + 1;

        const ok = confirm(
            `Применить индивидуальную программу?\n\n` +
            `Ты прошёл ${programIndex} плановых тренировок.\n` +
            `Продолжишь с Недели ${newWeek}, Дня ${newDay}.\n\n` +
            `История, вес и достижения сохранятся.`
        );

        if (!ok) return;
    }

    settings.customDays = days;
    settings.customSets = sets;
    settings.customRepBase = repBase;
    settings.customGrowth = growth;
    settings.programMode = "custom";

    saveJSON(STORAGE_KEYS.settings, settings);

    if (typeof rebuildProgram === "function") rebuildProgram();
    if (typeof renderProgram === "function") renderProgram();
    if (typeof renderHome === "function") renderHome();

    alert("Индивидуальная программа применена.");
});


/* =========================================
   НАСТРОЙКА ОТДЫХА
   ========================================= */


let lastRestValue = "program";

on("restInput", "change", event => {

    const newVal = event.target.value;

    if (newVal === "program") {
        lastRestValue = "program";
        return;
    }

    const sec = Number(newVal);

    if (sec < 90) {

        const ok = confirm(
            `Сократить отдых до ${sec} секунд?\n\n` +
            `Достаточный отдых между подходами — ` +
            `это не про «слабость», а про то, ` +
            `чтобы следующий подход был качественным.\n\n` +
            `При коротком отдыхе падает объём и растёт риск травмы.\n\n` +
            `Оставляем на твоё усмотрение — продолжить?`
        );

        if (!ok) {
            event.target.value = lastRestValue;
            return;
        }
    }

    lastRestValue = newVal;
});


/* =========================================
   РЕДАКТИРОВАНИЕ ИСТОРИИ
   ========================================= */


document
    .querySelectorAll(".edit-difficulty-button")
    .forEach(btn => {
        btn.addEventListener("click", () => {

            if (typeof editingHistoryDraft === "undefined") return;
            if (!editingHistoryDraft) return;

            editingHistoryDraft.difficulty = btn.dataset.level;

            document
                .querySelectorAll(".edit-difficulty-button")
                .forEach(other => {
                    other.classList.toggle(
                        "selected",
                        other.dataset.level === btn.dataset.level
                    );
                });
        });
    });

on("historyEditSave", "click", () => {
    if (typeof saveHistoryEdit === "function") saveHistoryEdit();
});

on("historyEditCancel", "click", () => {
    if (typeof closeHistoryEdit === "function") closeHistoryEdit();
});

on("historyModal", "click", event => {
    if (event.target.id === "historyModal" &&
        typeof closeHistoryEdit === "function") {
        closeHistoryEdit();
    }
});


/* =========================================
   СЛОЖНОСТЬ
   ========================================= */


document
    .querySelectorAll(".difficulty-button")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            if (typeof setWorkoutDifficulty === "function") {
                setWorkoutDifficulty(btn.dataset.level);
            }
        });
    });


/* =========================================
   PWA
   ========================================= */


let deferredInstallPrompt = null;

const installButton = document.getElementById("installApp");


function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}


function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !window.MSStream;
}


function showInstallButton() {
    if (!installButton) return;
    if (isStandalone()) {
        installButton.classList.add("hidden");
        return;
    }
    installButton.classList.remove("hidden");
}


function showInstallInstructions() {

    if (isIOS()) {
        alert(
            "Установка на iPhone:\n\n" +
            "1. Нажмите кнопку «Поделиться»\n" +
            "   (квадрат со стрелкой вверх)\n\n" +
            "2. Пролистайте и выберите\n" +
            "   «На экран \"Домой\"»\n\n" +
            "3. Нажмите «Добавить»"
        );
    } else {
        alert(
            "Установка приложения:\n\n" +
            "Откройте меню браузера\n" +
            "и выберите «Установить приложение»."
        );
    }
}


window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (typeof showInstallButton === "function") showInstallButton();
});


if (installButton) {
    installButton.addEventListener("click", async () => {

        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            if (choice.outcome === "accepted") {
                installButton.classList.add("hidden");
            }
            deferredInstallPrompt = null;
        } else {
            showInstallInstructions();
        }
    });
}


window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installButton) installButton.classList.add("hidden");
});


/* =========================================
   SERVICE WORKER
   ========================================= */


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("sw.js")
            .catch(error => {
                console.warn(
                    "Service worker не зарегистрирован:",
                    error
                );
            });
    });
}


/* =========================================
   ВОЗВРАТ НА ВКЛАДКУ
   ========================================= */


document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (typeof restEndsAt !== "undefined" &&
        restEndsAt > 0 &&
        typeof tickRestTimer === "function") {
        tickRestTimer();
    }
});


/* =========================================
   ЗАПУСК
   ========================================= */


safeRun("migrateToV12", () => {
    if (typeof migrateToV12 === "function") migrateToV12();
});

safeRun("ensureWeightHistory", () => {
    if (typeof ensureWeightHistory === "function") ensureWeightHistory();
});

safeRun("rebuildProgram", () => {
    if (typeof rebuildProgram === "function") rebuildProgram();
});

safeRun("checkAchievements", () => {
    if (typeof checkAchievements === "function") checkAchievements(true);
});

safeRun("renderHome", () => {
    if (typeof renderHome === "function") renderHome();
});

safeRun("showScreen", () => {
    if (typeof showScreen === "function") showScreen("screenHome");
});

safeRun("showInstallButton", () => {
    if (typeof showInstallButton === "function") showInstallButton();
});

safeRun("runSplash", () => {
    if (typeof runSplash === "function") {
        runSplash();
    } else {
        // Защита: если функции нет — снимаем сплэш принудительно
        const splash = document.getElementById("splash");
        if (splash && splash.parentNode) {
            splash.parentNode.removeChild(splash);
        }
    }
});


// Показываем первую ошибку запуска, если была
if (firstStartupError) {
    setTimeout(() => {
        alert(
            "При запуске возникла ошибка:\n\n" +
            firstStartupError +
            "\n\nПожалуйста, сообщите её разработчику."
        );
    }, 500);
}


console.log("Push-Up Coach v1.8.2 запущен");