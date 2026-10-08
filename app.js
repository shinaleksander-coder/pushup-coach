/* =========================================
   APP.JS
   ========================================= */


document.getElementById("startWorkout")
    .addEventListener("click", startNewWorkout);

document.getElementById("continueWorkout")
    .addEventListener("click", continueExistingWorkout);

document.getElementById("extraWorkout")
    .addEventListener("click", startExtraWorkout);

document.getElementById("minusRep")
    .addEventListener("click", decreaseReps);

document.getElementById("plusRep")
    .addEventListener("click", increaseReps);

document.getElementById("completeSet")
    .addEventListener("click", completeCurrentSet);

document.getElementById("failedSet")
    .addEventListener("click", failCurrentSet);

document.getElementById("skipRest")
    .addEventListener("click", skipRest);

document.getElementById("addRest")
    .addEventListener("click", addRest);

document.getElementById("exitWorkout")
    .addEventListener("click", exitWorkout);

document.getElementById("doneHome")
    .addEventListener("click", goHome);

document.getElementById("historyButton")
    .addEventListener("click", showHistory);

document.getElementById("programButton")
    .addEventListener("click", showProgram);

document.getElementById("progressButton")
    .addEventListener("click", showProgress);

document.getElementById("settingsButton")
    .addEventListener("click", showSettings);

document.getElementById("saveSettings")
    .addEventListener("click", saveSettings);

document.getElementById("resetProgress")
    .addEventListener("click", resetProgress);

document.getElementById("shareApp")
    .addEventListener("click", shareApp);

document.getElementById("checkUpdate")
    .addEventListener("click", checkForUpdates);

document.getElementById("exportData")
    .addEventListener("click", exportData);

document.getElementById("importData")
    .addEventListener("click", () => {
        document.getElementById("importFile").click();
    });

document.getElementById("importFile")
    .addEventListener("change", event => {
        const file = event.target.files[0];
        if (file) {
            importDataFile(file);
            event.target.value = "";
        }
    });

document.getElementById("showWelcomeAgain")
    .addEventListener("click", showWelcomeAgain);

document.getElementById("globalBack")
    .addEventListener("click", goHome);

document.getElementById("gripVisual")
    .addEventListener("click", openGripModal);

document.getElementById("gripModalClose")
    .addEventListener("click", closeGripModal);

document.getElementById("gripModal")
    .addEventListener("click", event => {
        if (event.target.id === "gripModal") {
            closeGripModal();
        }
    });


document.getElementById("achievementModalClose")
    .addEventListener("click", closeAchievementModal);

document.getElementById("achievementModal")
    .addEventListener("click", event => {
        if (event.target.id === "achievementModal") {
            closeAchievementModal();
        }
    });


/* =========================================
   МОДАЛКА КОНФЛИКТА ДНЕЙ
   ========================================= */


document.getElementById("modeConflictAdjust")
    .addEventListener("click", confirmModeAdjust);

document.getElementById("modeConflictKeep")
    .addEventListener("click", confirmModeKeep);

document.getElementById("modeConflictCancel")
    .addEventListener("click", cancelModeConflict);


/* =========================================
   НАСТРОЙКА ОТДЫХА
   ========================================= */


let lastRestValue = "program";


document.getElementById("restInput")
    .addEventListener("change", event => {

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
   ДНИ НЕДЕЛИ
   ========================================= */


document
    .querySelectorAll(".day-checkbox")
    .forEach(cb => {
        cb.addEventListener("change", () => {
            updateDaysHint();
        });
    });


/* =========================================
   РЕЖИМ ПРОГРАММЫ
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

                const ok = confirm(
                    `Сменить режим на «${btn.querySelector(".mode-button-title").textContent}»?\n\n` +
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
            updateDaysHint();
        });
    });


document.getElementById("saveCustom")
    .addEventListener("click", () => {

        const days = Number(
            document.getElementById("customDays").value
        );

        const sets = Number(
            document.getElementById("customSets").value
        );

        const repBase = Number(
            document.getElementById("customRepBase").value
        );

        const growth = Number(
            document.getElementById("customGrowth").value
        );

        if (!Number.isFinite(repBase) ||
            repBase < 3 || repBase > 20) {
            alert("Старт повторов: от 3 до 20.");
            return;
        }

        const history = loadJSON(STORAGE_KEYS.history, []);
        const programIndex =
            history.filter(r => !r.isExtra).length;

        if (programIndex > 0) {

            const newWeek =
                Math.floor(programIndex / days) + 1;

            const newDay =
                (programIndex % days) + 1;

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
        updateDaysHint();

        alert("Индивидуальная программа применена.");
    });


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


document.getElementById("welcomeStart")
    .addEventListener("click", handleWelcomeStart);


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


document.getElementById("historyEditSave")
    .addEventListener("click", saveHistoryEdit);

document.getElementById("historyEditCancel")
    .addEventListener("click", closeHistoryEdit);

document.getElementById("historyModal")
    .addEventListener("click", event => {
        if (event.target.id === "historyModal") {
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
            setWorkoutDifficulty(btn.dataset.level);
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
    showInstallButton();
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
    if (restEndsAt > 0) {
        tickRestTimer();
    }
});


/* =========================================
   ЗАПУСК
   ========================================= */


migrateToV12();
ensureWeightHistory();

rebuildProgram();

checkAchievements(true);

renderHome();
showScreen("screenHome");
showInstallButton();
runSplash();

console.log("Push-Up Coach v1.8 запущен");