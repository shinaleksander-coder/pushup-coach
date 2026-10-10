/* =========================================
   APP.JS
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
   КНОПКИ
   ========================================= */


on("startWorkout", "click", () => {
    if (typeof startNewWorkout === "function") startNewWorkout();
});

on("continueWorkout", "click", () => {
    if (typeof continueExistingWorkout === "function") continueExistingWorkout();
});

on("extraWorkout", "click", () => {
    if (typeof openExtraConfigModal === "function") openExtraConfigModal();
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

on("leaderboardButton", "click", () => {
    if (typeof showLeaderboard === "function") showLeaderboard();
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

on("welcomeStart", "click", handleWelcomeStart);


/* =========================================
   ДОПОЛНИТЕЛЬНАЯ ТРЕНИРОВКА — МОДАЛКА
   ========================================= */


on("extraStart", "click", () => {
    if (typeof submitExtraConfig === "function") submitExtraConfig();
});

on("extraCancel", "click", () => {
    if (typeof closeExtraConfigModal === "function") closeExtraConfigModal();
});

on("extraConfigModal", "click", event => {
    if (event.target.id === "extraConfigModal" &&
        typeof closeExtraConfigModal === "function") {
        closeExtraConfigModal();
    }
});


/* =========================================
   РЕЙТИНГ — ОБРАБОТЧИКИ
   ========================================= */


document
    .querySelectorAll(".lb-tab")
    .forEach(btn => {
        btn.addEventListener("click", () => {

            leaderboardTab = btn.dataset.lbTab;

            document
                .querySelectorAll(".lb-tab")
                .forEach(b => b.classList.toggle(
                    "active",
                    b.dataset.lbTab === leaderboardTab
                ));

            renderLeaderboard();
        });
    });


on("lbRefresh", "click", () => {
    refreshLeaderboard();
});


/* =========================================
   PUSH — КНОПКИ
   ========================================= */


on("pushEnable", "click", async () => {

    const statusEl = document.getElementById("pushStatus");

    if (statusEl) {
        statusEl.textContent = "Подключаем…";
        statusEl.className = "push-status status-disabled";
    }

    const result = await subscribeToPush();

    if (!result.ok) {
        alert(result.error || "Не удалось включить напоминания");
    } else {
        const timeEl = document.getElementById("pushTime");
        if (timeEl) saveReminderTime(timeEl.value || "19:00");

        const days = getPushDaysFromUI();
        saveDays(days.length > 0 ? days : [1, 3, 5]);

        await updatePushSettings();
    }

    refreshPushAfterAction();
});


on("pushDisable", "click", async () => {

    const ok = confirm("Выключить напоминания?");

    if (!ok) return;

    const statusEl = document.getElementById("pushStatus");
    if (statusEl) {
        statusEl.textContent = "Отключаем…";
        statusEl.className = "push-status status-disabled";
    }

    await unsubscribeFromPush();
    refreshPushAfterAction();
});


on("pushTest", "click", async () => {

    const statusEl = document.getElementById("pushStatus");
    if (statusEl) {
        statusEl.textContent = "Отправляем тестовое уведомление…";
        statusEl.className = "push-status status-disabled";
    }

    const result = await testPushNotification();

    if (!result.ok) {
        alert(result.error || "Не удалось отправить уведомление");
    } else {
        alert(
            "Тестовое уведомление отправлено.\n\n" +
            "Оно придёт через несколько секунд. " +
            "Если приложение открыто — сверни его, " +
            "чтобы увидеть баннер."
        );
    }

    refreshPushAfterAction();
});


on("pushTime", "change", async (event) => {

    const newTime = event.target.value || "19:00";
    saveReminderTime(newTime);

    await updatePushSettings();
});


document
    .querySelectorAll(".push-day-checkbox")
    .forEach(cb => {
        cb.addEventListener("change", async () => {

            const days = getPushDaysFromUI();

            if (days.length === 0) {
                alert("Выбери хотя бы один день недели.");
                cb.checked = true;
                return;
            }

            saveDays(days);

            await updatePushSettings();
        });
    });


/* =========================================
   СОХРАНЕНИЕ НАСТРОЕК С ПРОВЕРКОЙ КОНФЛИКТА
   ========================================= */


function handleSaveSettings() {

    const data = collectSettingsFromForm();
    if (!data) return;

    const programDays = getActiveConfig().daysPerWeek || 3;
    const userDays = data.trainingDays.length;

    if (userDays === 0 || userDays === programDays) {
        applySettings(data);
        return;
    }

    const adjust = confirm(
        `В программе ${programDays} ${pluralDays(programDays)} в неделю, ` +
        `а ты отметил ${userDays}.\n\n` +
        `ОК — подстроить программу под ${userDays}-дневную ` +
        `(режим «Своя»).\n` +
        `Отмена — оставить программу ${programDays}-дневной, ` +
        `а дни сохранить как предпочтения.`
    );

    if (adjust) {
        settings.customDays = userDays;
        settings.customSets = settings.customSets || 3;
        settings.customRepBase = settings.customRepBase || 5;
        settings.customGrowth =
            settings.customGrowth !== undefined
                ? settings.customGrowth
                : 1;
        settings.programMode = "custom";

        saveJSON(STORAGE_KEYS.settings, settings);
        rebuildProgram();
    }

    applySettings(data);
}


/* =========================================
   ПРИВЕТСТВИЕ
   ========================================= */


function handleWelcomeStart() {

    const nameInput = document.getElementById("welcomeName");
    const weightInput = document.getElementById("welcomeWeight");

    const rawName = nameInput ? nameInput.value.trim() : "";
    const rawWeight = weightInput ? weightInput.value.trim() : "";

    const name = rawName || "Спортсмен";

    const weightWasEmpty =
        settings.weight === null || settings.weight === undefined;

    let weight = null;

    if (rawWeight !== "") {
        weight = Number(rawWeight);

        if (!Number.isFinite(weight) || weight < 30 || weight > 250) {
            alert("Введите корректный вес от 30 до 250 кг, либо оставьте поле пустым.");
            return;
        }

        weight = Math.round(weight * 10) / 10;
    }

    settings.name = name;
    settings.weight = weight;

    saveJSON(STORAGE_KEYS.settings, settings);
    updateWeightHistory(weight, weightWasEmpty);
    saveJSON(STORAGE_KEYS.welcomeShown, true);

    hideWelcome();
    renderHome();
    showScreen("screenHome");
}


/* =========================================
   МИГРАЦИЯ
   ========================================= */


function migrateToV12() {

    const done = loadJSON(STORAGE_KEYS.migrationV12, false);
    if (done) return;

    const wh = loadJSON(STORAGE_KEYS.weightHistory, []);
    const hasOnlyDefaults =
        wh.length > 0 && wh.every(x => x.weight === 82);
    const settingsIsDefault =
        settings.weight === 82 || settings.weight === null;

    if (hasOnlyDefaults && settingsIsDefault) {
        settings.weight = null;
        settings.name = "Спортсмен";
        saveJSON(STORAGE_KEYS.settings, settings);
        saveJSON(STORAGE_KEYS.weightHistory, []);
        saveJSON(STORAGE_KEYS.welcomeShown, false);
    }

    saveJSON(STORAGE_KEYS.migrationV12, true);
}


/* =========================================
   SPLASH
   ========================================= */


function runSplash() {

    const splash = document.getElementById("splash");

    if (!splash) {
        showWelcomeOnFirstLaunch();
        return;
    }

    setTimeout(() => {
        splash.classList.add("fade-out");

        setTimeout(() => {
            if (splash.parentNode) {
                splash.parentNode.removeChild(splash);
            }
            showWelcomeOnFirstLaunch();
        }, 600);
    }, 1400);
}


/* =========================================
   СМЕНА РЕЖИМА ПРОГРАММЫ
   ========================================= */


document
    .querySelectorAll(".mode-button")
    .forEach(btn => {
        btn.addEventListener("click", () => {

            const mode = btn.dataset.mode;

            const history =
                loadJSON(STORAGE_KEYS.history, []);

            const programIndex =
                history.filter(r => !r.isExtra).length;

            if (programIndex > 0 && mode !== "custom") {

                const newConfig =
                    PROGRAM_MODES[mode] || PROGRAM_MODES.base;

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

            rebuildProgram();
            renderProgram();
            renderHome();
        });
    });


/* =========================================
   ИНДИВИДУАЛЬНАЯ ПРОГРАММА
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

    rebuildProgram();
    renderProgram();
    renderHome();

    alert("Индивидуальная программа применена.");
});


/* =========================================
   ОТДЫХ
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


safeRun("migrateToV12", migrateToV12);
safeRun("ensureWeightHistory", ensureWeightHistory);
safeRun("rebuildProgram", rebuildProgram);
safeRun("checkAchievements", () => checkAchievements(true));
safeRun("renderHome", renderHome);
safeRun("showScreen", () => showScreen("screenHome"));
safeRun("showInstallButton", showInstallButton);
safeRun("runSplash", runSplash);


if (firstStartupError) {
    setTimeout(() => {
        alert(
            "При запуске возникла ошибка:\n\n" +
            firstStartupError
        );
    }, 500);
}


console.log("Push-Up Coach v1.9.4 запущен");