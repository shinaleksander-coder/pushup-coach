/* =========================================
   UI.JS
   ========================================= */


const screens = document.querySelectorAll(".screen");

const SCREEN_TITLES = {
    screenHome: "Твой персональный тренер",
    screenWorkout: "Тренировка",
    screenDone: "Тренировка завершена",
    screenProgress: "Прогресс",
    screenHistory: "История",
    screenProgram: "Программа",
    screenSettings: "Настройки"
};


const ACHIEVEMENTS = [
    { id: "first", icon: "🎯", title: "Первая тренировка", desc: "Программа началась", check: (h, max) => h.filter(r => !r.isExtra).length >= 1 },
    { id: "week1", icon: "📅", title: "Первая неделя", desc: "Первая неделя программы пройдена", check: (h, max) => h.filter(r => !r.isExtra).length >= (getActiveConfig().daysPerWeek || 3) },
    { id: "ten", icon: "🔟", title: "10 тренировок", desc: "Уже не новичок", check: (h, max) => h.filter(r => !r.isExtra).length >= 10 },
    { id: "twentyfive", icon: "💪", title: "25 тренировок", desc: "Четверть пути", check: (h, max) => h.filter(r => !r.isExtra).length >= 25 },
    { id: "fifty", icon: "🚀", title: "50 тренировок", desc: "Больше половины программы", check: (h, max) => h.filter(r => !r.isExtra).length >= 50 },
    { id: "record10", icon: "⭐", title: "Рекорд 10", desc: "10 повторов в подходе", check: (h, max) => max >= 10 },
    { id: "record15", icon: "🌟", title: "Рекорд 15", desc: "15 повторов в подходе", check: (h, max) => max >= 15 },
    { id: "record20", icon: "🏅", title: "Рекорд 20", desc: "20 повторов в подходе", check: (h, max) => max >= 20 },
    { id: "record25", icon: "👑", title: "Рекорд 25", desc: "25 повторов в подходе", check: (h, max) => max >= 25 },
    { id: "first_test", icon: "🎓", title: "Первый тест", desc: "Тест на максимум пройден", check: (h, max) => h.some(r => r.isTest) },
    { id: "extra", icon: "➕", title: "Сверх плана", desc: "Первая дополнительная тренировка", check: (h, max) => h.some(r => r.isExtra) },
    { id: "extra5", icon: "🔥", title: "Рвение", desc: "5 дополнительных тренировок", check: (h, max) => h.filter(r => r.isExtra).length >= 5 }
];


let editingHistoryIndex = -1;
let editingHistoryDraft = null;
let achievementQueue = [];


function showScreen(id) {

    screens.forEach(screen => {
        screen.hidden = screen.id !== id;
    });

    const backButton = document.getElementById("globalBack");

    if (id === "screenHome") {
        backButton.classList.add("hidden");
    } else {
        backButton.classList.remove("hidden");
    }

    const subtitle = document.getElementById("appSubtitle");

    if (subtitle) {
        subtitle.textContent =
            SCREEN_TITLES[id] || "Твой персональный тренер";
    }

    window.scrollTo(0, 0);
}


function showWelcome() {

    const nameInput = document.getElementById("welcomeName");
    const weightInput = document.getElementById("welcomeWeight");

    if (nameInput) {
        nameInput.value =
            settings.name && settings.name !== "Спортсмен"
                ? settings.name
                : "";
    }

    if (weightInput) {
        weightInput.value = settings.weight || "";
    }

    document
        .getElementById("welcomeOverlay")
        .classList.remove("hidden");
}


function hideWelcome() {
    document
        .getElementById("welcomeOverlay")
        .classList.add("hidden");
}


function showWelcomeOnFirstLaunch() {
    const shown = loadJSON(STORAGE_KEYS.welcomeShown, false);
    if (!shown) showWelcome();
}


function showWelcomeAgain() {
    showWelcome();
}


function updateWeightHistory(newWeight, weightWasEmpty) {

    if (newWeight === null || newWeight === undefined) return;

    const wh = loadJSON(STORAGE_KEYS.weightHistory, []);

    const hasOnlyDefaults =
        wh.length > 0 && wh.every(x => x.weight === 82);

    if (weightWasEmpty || hasOnlyDefaults) {
        saveJSON(STORAGE_KEYS.weightHistory, [{
            date: new Date().toISOString(),
            weight: newWeight
        }]);
        return;
    }

    const last = wh[wh.length - 1];

    if (!last || last.weight !== newWeight) {
        wh.push({
            date: new Date().toISOString(),
            weight: newWeight
        });
        saveJSON(STORAGE_KEYS.weightHistory, wh);
    }
}


function renderHome() {

    const activeWorkout = loadJSON(
        STORAGE_KEYS.activeWorkout,
        null
    );

    const preview = activeWorkout
        ? activeWorkout.workout
        : getNextWorkout(false);

    const titleEl = document.getElementById("homeWorkoutTitle");
    const gripEl = document.getElementById("homeGrip");
    const setsEl = document.getElementById("homeSets");
    const restEl = document.getElementById("homeRest");

    if (!preview) {
        titleEl.textContent = "Программа завершена";
        gripEl.textContent = "—";
        setsEl.textContent = "—";
        restEl.textContent = "—";
    } else {
        titleEl.textContent = preview.isTest
            ? `Неделя ${preview.week} · День ${preview.day} — тест`
            : `Неделя ${preview.week} · День ${preview.day}`;

        gripEl.textContent = preview.grip;

        setsEl.textContent = preview.isTest
            ? "макс"
            : `${preview.sets} × ${preview.reps}`;

        restEl.textContent = `${preview.rest} сек`;
    }

    const reasonEl = document.getElementById("homeReason");

    if (preview && preview.reason) {
        reasonEl.textContent = preview.reason;
        reasonEl.classList.remove("hidden");
    } else {
        reasonEl.textContent = "";
        reasonEl.classList.add("hidden");
    }

    document.getElementById("currentWeight").textContent =
        settings.weight
            ? `${settings.weight} кг`
            : "не указан";

    renderMaxPushups();
    renderMissedBanner();
    renderCompare();

    const startButton = document.getElementById("startWorkout");
    const continueButton = document.getElementById("continueWorkout");

    if (activeWorkout) {
        startButton.classList.add("hidden");
        continueButton.classList.remove("hidden");
    } else {
        startButton.classList.remove("hidden");
        continueButton.classList.add("hidden");
    }
}


function renderMaxPushups() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    let maxPushups = 0;

    history.forEach(record => {
        record.results?.forEach(result => {
            const value = Number(result.actual);
            if (Number.isFinite(value) && value > maxPushups) {
                maxPushups = value;
            }
        });
    });

    document.getElementById("maxPushups").textContent =
        maxPushups > 0 ? maxPushups : "—";
}


function renderMissedBanner() {

    const banner = document.getElementById("homeFreezeBanner");
    if (!banner) return;

    const info = getMissedInfo();

    if (info.level === "none" || isBannerSkippedToday()) {
        banner.classList.add("hidden");
        return;
    }

    banner.classList.remove("hidden");
    banner.classList.remove(
        "freeze-banner", "strong-banner", "soft-banner"
    );

    const missedText = info.missedPlan > 0
        ? `Пропущено <strong>${info.missedPlan}</strong> плановых. `
        : "";

    if (info.level === "freeze") {

        banner.classList.add("freeze-banner");

        banner.innerHTML = `
            <div class="freeze-text">
                <strong>${info.days} дней</strong> без тренировки.
                Нагрузка будет снижена, чтобы вернуться мягко.
            </div>
            <div class="freeze-actions">
                <button class="freeze-button freeze-continue" id="freezeContinue">
                    Продолжить
                </button>
                <button class="freeze-button freeze-repeat" id="freezeRepeat">
                    Повторить
                </button>
            </div>
        `;

        document.getElementById("freezeContinue")
            .addEventListener("click", () => {
                skipBannerForToday();
                banner.classList.add("hidden");
            });

        document.getElementById("freezeRepeat")
            .addEventListener("click", () => {
                saveJSON(STORAGE_KEYS.repeatLast, true);
                skipBannerForToday();
                banner.classList.add("hidden");
                startNewWorkout();
            });

        return;
    }

    if (info.level === "strong") {

        banner.classList.add("strong-banner");

        banner.innerHTML = `
            <div class="freeze-text">
                <strong>${info.days} дней</strong> без тренировки. ${missedText}
                Нагрузка снижена, чтобы вернуться в ритм.
            </div>
            <div class="freeze-actions">
                <button class="freeze-button freeze-continue" id="missedStart">
                    Начать сейчас
                </button>
                <button class="freeze-button freeze-skip" id="missedSkip">
                    Пропустить день
                </button>
            </div>
        `;

        document.getElementById("missedStart")
            .addEventListener("click", () => {
                banner.classList.add("hidden");
                startNewWorkout();
            });

        document.getElementById("missedSkip")
            .addEventListener("click", () => {
                skipBannerForToday();
                banner.classList.add("hidden");
            });

        return;
    }

    banner.classList.add("soft-banner");

    banner.innerHTML = `
        <div class="freeze-text">
            <strong>${info.days} дня</strong> без тренировки.
            Самое время вспомнить про программу.
        </div>
        <div class="freeze-actions">
            <button class="freeze-button freeze-continue" id="missedStart">
                Начать сейчас
            </button>
            <button class="freeze-button freeze-skip" id="missedSkip">
                Позже
            </button>
        </div>
    `;

    document.getElementById("missedStart")
        .addEventListener("click", () => {
            banner.classList.add("hidden");
            startNewWorkout();
        });

    document.getElementById("missedSkip")
        .addEventListener("click", () => {
            skipBannerForToday();
            banner.classList.add("hidden");
        });
}


function renderCompare() {

    const el = document.getElementById("homeCompare");
    if (!el) return;

    const history = loadJSON(STORAGE_KEYS.history, []);

    if (history.length === 0) {
        el.classList.add("hidden");
        return;
    }

    const nowMax = getRecord();
    if (nowMax === 0) {
        el.classList.add("hidden");
        return;
    }

    const weekAgo = getStrengthBefore(7);

    if (!weekAgo || weekAgo === nowMax) {
        el.classList.add("hidden");
        return;
    }

    const diff = nowMax - weekAgo;
    const sign = diff > 0 ? "+" : "";

    el.classList.remove("hidden");
    el.textContent =
        `📊 Неделю назад: ${weekAgo} · Сейчас: ${nowMax} (${sign}${diff})`;
}


function getStrengthBefore(daysAgo) {

    const history = loadJSON(STORAGE_KEYS.history, []);
    if (history.length === 0) return null;

    const target =
        Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    let record = null;

    for (let i = history.length - 1; i >= 0; i--) {
        const t = new Date(history[i].date).getTime();
        if (t <= target) { record = history[i]; break; }
    }

    if (!record) return null;

    let max = 0;
    record.results?.forEach(r => {
        const a = Number(r.actual);
        if (a > max) max = a;
    });

    return max || null;
}


function getRecord() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    let max = 0;

    history.forEach(record => {
        record.results?.forEach(r => {
            const a = Number(r.actual);
            if (a > max) max = a;
        });
    });

    return max;
}


function renderWorkoutRecord() {

    const recordEl = document.getElementById("workoutRecord");
    if (!recordEl) return;

    const record = getRecord();

    if (record > 0) {
        recordEl.textContent = `🏆 Рекорд: ${record} повторений`;
        recordEl.classList.remove("hidden");
    } else {
        recordEl.textContent = "";
        recordEl.classList.add("hidden");
    }
}


function renderWorkoutScreen() {

    if (!workout) return;

    const titleEl = document.getElementById("workoutGrip");
    const restEl = document.getElementById("workoutRest");

    const extraMark = isExtraWorkout ? " · доп" : "";

    titleEl.textContent = workout.isTest
        ? `Тест · ${workout.grip}${extraMark}`
        : `${workout.grip} хват${extraMark}`;

    restEl.textContent = `${workout.rest} сек`;

    renderGripVisual(workout.grip);
    renderWorkoutRecord();
}


function renderGripVisual(grip) {

    const container = document.getElementById("gripVisual");
    if (!container) return;
    container.innerHTML = getGripSVG(grip);
}


function renderSetScreen() {

    clearRestTimer();

    document.getElementById("currentSet").textContent =
        `${currentSet + 1} / ${workout.sets}`;

    document.getElementById("plannedReps").textContent =
        workout.isTest ? "макс" : workout.reps;

    updateActualReps();

    document.getElementById("workoutStatus").textContent =
        workout.isTest
            ? "Тест на максимум. Сделай сколько сможешь."
            : `Сделай ${workout.reps} чистых повторений`;

    document
        .getElementById("workoutStatus")
        .classList.remove("countdown-final");

    showSetControls();
}


function showSetControls() {

    document.getElementById("repControls").classList.remove("hidden");
    document.getElementById("completeSet").classList.remove("hidden");
    document.getElementById("failedSet").classList.remove("hidden");
    document.getElementById("restControls").classList.add("hidden");

    setControlsEnabled(true);
}


function showRestControls() {

    document.getElementById("repControls").classList.add("hidden");
    document.getElementById("completeSet").classList.add("hidden");
    document.getElementById("failedSet").classList.add("hidden");
    document.getElementById("restControls").classList.remove("hidden");

    setControlsEnabled(false);
}


function setControlsEnabled(enabled) {
    document.getElementById("minusRep").disabled = !enabled;
    document.getElementById("plusRep").disabled = !enabled;
    document.getElementById("completeSet").disabled = !enabled;
    document.getElementById("failedSet").disabled = !enabled;
}


function updateActualReps() {
    document.getElementById("actualReps").textContent = actualReps;
}


function updateTimer() {

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const statusEl = document.getElementById("workoutStatus");

    statusEl.textContent =
        `Отдых: ${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (remainingSeconds > 0 && remainingSeconds <= 5) {
        statusEl.classList.add("countdown-final");
    } else {
        statusEl.classList.remove("countdown-final");
    }
}


function openGripModal() {

    if (!workout) return;

    document.getElementById("gripModalVisual").innerHTML =
        getGripSVG(workout.grip);

    document.getElementById("gripModalTitle").textContent =
        workout.grip + " хват";

    document.getElementById("gripModalText").textContent =
        getGripDescription(workout.grip);

    document.getElementById("gripModal").classList.remove("hidden");
}


function closeGripModal() {
    document.getElementById("gripModal").classList.add("hidden");
}


function renderDoneScreen(record, saved, isNewRecord) {

    document.getElementById("doneSets").textContent =
        record.results.length;

    document.getElementById("donePlanned").textContent =
        record.totalPlanned;

    document.getElementById("doneActual").textContent =
        record.totalActual;

    const badge = document.getElementById("doneRecordBadge");

    if (isNewRecord && record.bestSet) {
        badge.textContent =
            `🏆 Новый рекорд: ${record.bestSet} повторений`;
        badge.classList.remove("hidden");
    } else {
        badge.textContent = "";
        badge.classList.add("hidden");
    }

    document
        .querySelectorAll(".difficulty-button")
        .forEach(btn => {
            btn.classList.toggle(
                "selected",
                btn.dataset.level === record.difficulty
            );
        });

    const list = document.getElementById("doneResults");
    list.innerHTML = "";

    record.results.forEach(result => {
        const item = document.createElement("div");
        item.className = "result-item";

        item.innerHTML = `
            <span>Подход ${result.set}</span>
            <strong>${result.actual} / ${result.planned}</strong>
        `;

        list.appendChild(item);
    });

    if (!saved) {
        const warning = document.createElement("p");
        warning.textContent =
            "Не удалось сохранить тренировку. Проверьте память браузера.";
        warning.style.opacity = "0.7";
        list.appendChild(warning);
    }
}


function getUnlockedAchievements() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const max = getRecord();

    const unlocked = [];

    ACHIEVEMENTS.forEach(a => {
        try {
            if (a.check(history, max)) {
                unlocked.push(a.id);
            }
        } catch (e) { /* пропускаем */ }
    });

    return unlocked;
}


function getShownAchievements() {
    return loadJSON(STORAGE_KEYS.achievements, []);
}


function checkAchievements(silent) {

    const unlocked = getUnlockedAchievements();
    const shown = getShownAchievements();

    const newly = ACHIEVEMENTS.filter(a =>
        unlocked.includes(a.id) && !shown.includes(a.id)
    );

    if (newly.length === 0) return;

    const updated = shown.concat(newly.map(a => a.id));
    saveJSON(STORAGE_KEYS.achievements, updated);

    if (silent) return;

    achievementQueue = newly.slice();
    setTimeout(showNextAchievement, 400);
}


function showNextAchievement() {

    if (achievementQueue.length === 0) return;

    const a = achievementQueue.shift();

    document.getElementById("achievementModalIcon").textContent = a.icon;
    document.getElementById("achievementModalTitle").textContent = a.title;
    document.getElementById("achievementModalText").textContent = a.desc;

    document.getElementById("achievementModal")
        .classList.remove("hidden");
}


function closeAchievementModal() {

    document.getElementById("achievementModal")
        .classList.add("hidden");

    if (achievementQueue.length > 0) {
        setTimeout(showNextAchievement, 300);
    }
}


function renderAchievements() {

    const container = document.getElementById("achievementsList");
    if (!container) return;

    const unlocked = getUnlockedAchievements();

    container.innerHTML = ACHIEVEMENTS.map(a => {
        const isUnlocked = unlocked.includes(a.id);

        return `
            <div class="achievement-item ${isUnlocked ? "unlocked" : "locked"}">
                <div class="achievement-item-icon">
                    ${isUnlocked ? a.icon : "🔒"}
                </div>
                <div class="achievement-item-title">
                    ${a.title}
                </div>
            </div>
        `;
    }).join("");
}


function renderHistory() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const list = document.getElementById("historyList");

    list.innerHTML = "";

    if (history.length === 0) {
        list.innerHTML = "<p>Тренировок пока нет.</p>";
        return;
    }

    const difficultyLabels = {
        easy: "легко",
        normal: "нормально",
        hard: "тяжело",
        very_hard: "очень тяжело"
    };

    [...history].reverse().forEach((record, reversedIndex) => {

        const originalIndex = history.length - 1 - reversedIndex;

        const item = document.createElement("div");
        item.className = "history-item";
        item.dataset.index = originalIndex;

        if (record.isExtra) {
            item.classList.add("history-extra");
        }

        const date = new Date(record.date);

        const title = record.isTest
            ? `Тест · ${record.grip}`
            : `${record.grip} хват`;

        const subtitle = record.week
            ? `Неделя ${record.week} · День ${record.day}`
            : "";

        const diffText = difficultyLabels[record.difficulty] || "";

        const extraTag = record.isExtra
            ? '<span class="history-extra-tag">доп</span>'
            : "";

        item.innerHTML = `
            <div class="history-date">
                ${date.toLocaleString("ru-RU")}
            </div>
            <div class="history-main">
                ${title} ${extraTag}
            </div>
            <div class="history-total">
                ${subtitle ? subtitle + " · " : ""}
                Факт: ${record.totalActual} из ${record.totalPlanned}
                ${diffText ? " · " + diffText : ""}
            </div>
            <div class="history-edit-icon">
                ✏️
            </div>
        `;

        item.addEventListener("click", () => {
            openHistoryEdit(originalIndex);
        });

        list.appendChild(item);
    });
}


function openHistoryEdit(index) {

    const history = loadJSON(STORAGE_KEYS.history, []);
    if (!history[index]) return;

    editingHistoryIndex = index;
    editingHistoryDraft = JSON.parse(JSON.stringify(history[index]));

    const record = editingHistoryDraft;
    const date = new Date(record.date);

    const title = record.isTest
        ? `Тест · ${record.grip}`
        : `${record.grip} хват`;

    const subtitle = record.week
        ? `Неделя ${record.week} · День ${record.day}`
        : "";

    const extraNote = record.isExtra
        ? '<div class="edit-subtitle">Дополнительная тренировка</div>'
        : "";

    document.getElementById("historyEditInfo").innerHTML = `
        <div class="edit-date">
            ${date.toLocaleString("ru-RU")}
        </div>
        <div class="edit-title">
            ${title}
        </div>
        ${subtitle
            ? `<div class="edit-subtitle">${subtitle}</div>`
            : ""}
        ${extraNote}
    `;

    document
        .querySelectorAll(".edit-difficulty-button")
        .forEach(btn => {
            btn.classList.toggle(
                "selected",
                btn.dataset.level === record.difficulty
            );
        });

    renderEditSets();

    document.getElementById("historyModal")
        .classList.remove("hidden");
}


function renderEditSets() {

    const container = document.getElementById("historyEditSets");
    container.innerHTML = "";

    editingHistoryDraft.results.forEach((result, i) => {

        const row = document.createElement("div");
        row.className = "edit-set-row";

        row.innerHTML = `
            <span class="edit-set-label">
                Подход ${result.set}
            </span>
            <button
                class="edit-set-button"
                data-action="minus"
                data-index="${i}"
            >
                −
            </button>
            <span class="edit-set-value">
                ${result.actual}
            </span>
            <button
                class="edit-set-button"
                data-action="plus"
                data-index="${i}"
            >
                +
            </button>
        `;

        container.appendChild(row);
    });

    container
        .querySelectorAll(".edit-set-button")
        .forEach(btn => {
            btn.addEventListener("click", () => {

                const i = Number(btn.dataset.index);
                const action = btn.dataset.action;
                const current =
                    editingHistoryDraft.results[i].actual;

                if (action === "minus" && current > 0) {
                    editingHistoryDraft.results[i].actual =
                        current - 1;
                }

                if (action === "plus") {
                    editingHistoryDraft.results[i].actual =
                        current + 1;
                }

                renderEditSets();
            });
        });
}


function closeHistoryEdit() {
    editingHistoryIndex = -1;
    editingHistoryDraft = null;
    document.getElementById("historyModal").classList.add("hidden");
}


function saveHistoryEdit() {

    if (editingHistoryIndex < 0 || !editingHistoryDraft) return;

    const history = loadJSON(STORAGE_KEYS.history, []);

    editingHistoryDraft.totalActual =
        editingHistoryDraft.results.reduce(
            (sum, r) => sum + Number(r.actual),
            0
        );

    editingHistoryDraft.bestSet =
        editingHistoryDraft.results.reduce(
            (max, r) => Math.max(max, Number(r.actual)),
            0
        );

    history[editingHistoryIndex] = editingHistoryDraft;
    saveJSON(STORAGE_KEYS.history, history);

    closeHistoryEdit();
    renderHistory();
    renderHome();
}


function renderProgram() {
    renderProgramModeButtons();
    renderCustomConfig();
    renderProgramList();
}


function renderProgramModeButtons() {

    const currentMode = settings.programMode || "base";

    document
        .querySelectorAll(".mode-button")
        .forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.dataset.mode === currentMode
            );
        });
}


function renderCustomConfig() {

    const card = document.getElementById("customConfig");
    if (!card) return;

    const isCustom = (settings.programMode || "base") === "custom";

    if (isCustom) {
        card.classList.remove("hidden");
    } else {
        card.classList.add("hidden");
    }

    document.getElementById("customDays").value =
        settings.customDays || 3;

    document.getElementById("customSets").value =
        settings.customSets || 3;

    document.getElementById("customRepBase").value =
        settings.customRepBase || 5;

    document.getElementById("customGrowth").value =
        settings.customGrowth !== undefined
            ? settings.customGrowth
            : 1;
}


function renderProgramList() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const stats = getProgramStats();
    const missedInfo = getMissedInfo();
    const planRecords = history.filter(r => !r.isExtra);
    const extras = history.filter(r => r.isExtra);

    document.getElementById("programProgress").textContent =
        `${stats.planDone} / ${stats.planTotal}`;

    const extrasEl = document.getElementById("programExtras");

    if (stats.extrasCount > 0) {
        extrasEl.textContent =
            `+${stats.extrasCount} доп · всего ${stats.completed} из ${stats.total}`;
        extrasEl.classList.remove("hidden");
    } else {
        extrasEl.textContent = "";
        extrasEl.classList.add("hidden");
    }

    const missedRow = document.getElementById("programMissedRow");

    if (missedRow) {
        if (missedInfo.weeklyTarget > 0 &&
            missedInfo.weeklyMissed > 0) {

            missedRow.textContent =
                `⚠ Пропущено за неделю: ${missedInfo.weeklyMissed} из ${missedInfo.weeklyTarget}`;

            missedRow.classList.remove("hidden");

            if (missedInfo.weeklyMissed >= 2) {
                missedRow.classList.add("missed-critical");
            } else {
                missedRow.classList.remove("missed-critical");
            }
        } else {
            missedRow.textContent = "";
            missedRow.classList.add("hidden");
        }
    }

    const predictions = predictFutureWorkouts();
    const daysPerWeek = getActiveConfig().daysPerWeek || 3;
    const totalWeeks = Math.ceil(PROGRAM.length / daysPerWeek);

    let html = "";
    let currentBlock = -1;

    for (let week = 1; week <= totalWeeks; week++) {

        const block = Math.floor((week - 1) / BLOCK_WEEKS);

        if (block !== currentBlock) {
            currentBlock = block;
            const grip =
                PROGRAM_GRIPS[block % PROGRAM_GRIPS.length];
            html += `<div class="program-block-title">Блок ${block + 1} · ${grip} хват</div>`;
        }

        const startIndex = (week - 1) * daysPerWeek;
        const endIndex = startIndex + daysPerWeek;

        const doneInWeek = Math.max(
            0,
            Math.min(daysPerWeek, stats.planDone - startIndex)
        );

        const isCurrent =
            stats.planDone >= startIndex &&
            stats.planDone < endIndex;

        const isDone = stats.planDone >= endIndex;

        const template = PROGRAM[startIndex];
        if (!template) continue;

        let planText;

        if (isDone) {

            const weekRecords =
                planRecords.slice(startIndex, endIndex);

            if (weekRecords.length > 0) {
                const avgReps = Math.round(
                    weekRecords.reduce(
                        (sum, r) => sum + getEffectiveReps(r), 0
                    ) / weekRecords.length
                );

                planText = template.isTest
                    ? "тест"
                    : `${template.sets}×${avgReps}`;
            } else {
                planText = template.isTest
                    ? "тест"
                    : `${template.sets}×${template.reps}`;
            }

        } else {

            const predIndex = startIndex - stats.planDone;
            const pred = predictions[Math.max(0, predIndex)];

            if (pred) {
                planText = pred.isTest
                    ? "тест"
                    : `${pred.sets}×${pred.reps}`;
            } else {
                planText = template.isTest
                    ? "тест"
                    : `${template.sets}×${template.reps}`;
            }
        }

        const info = `${template.grip} · ${planText}`;

        let cls = "program-week";
        if (isDone) cls += " done";
        if (isCurrent) cls += " current";

        const weekExtras = extras.filter(r => r.week === week);
        const extraRow = weekExtras.length > 0
            ? `<div class="program-week-extras">+${weekExtras.length} доп</div>`
            : "";

        html += `
            <div class="${cls}">
                <div>
                    <div class="program-week-title">
                        Неделя ${week}
                    </div>
                    <div class="program-week-info">
                        ${info}
                    </div>
                    ${extraRow}
                </div>
                <div class="program-week-progress">
                    ${doneInWeek} / ${daysPerWeek}
                </div>
            </div>
        `;
    }

    document.getElementById("programList").innerHTML = html;
}


function renderSettings() {

    document.getElementById("nameInput").value =
        settings.name && settings.name !== "Спортсмен"
            ? settings.name
            : "";

    document.getElementById("weightInput").value =
        settings.weight || "";

    document.getElementById("voiceInput").checked =
        settings.voiceCountdown !== false;

    document.getElementById("restInput").value =
        settings.restOverride === null ||
        settings.restOverride === undefined
            ? "program"
            : String(settings.restOverride);

    const savedDays = Array.isArray(settings.trainingDays)
        ? settings.trainingDays
        : [];

    document
        .querySelectorAll(".day-checkbox")
        .forEach(cb => {
            const day = Number(cb.dataset.day);
            cb.checked = savedDays.includes(day);
        });

    renderAbout();
}


function renderAbout() {

    const history = loadJSON(STORAGE_KEYS.history, []);

    document.getElementById("aboutName").textContent =
        settings.name || "—";

    document.getElementById("aboutWorkouts").textContent =
        history.length;

    if (history.length === 0) {
        document.getElementById("aboutFirstDate").textContent = "—";
        return;
    }

    const first = new Date(history[0].date);

    document.getElementById("aboutFirstDate").textContent =
        first.toLocaleDateString("ru-RU");
}


function collectSettingsFromForm() {

    const nameInput = document.getElementById("nameInput");
    const weightInput = document.getElementById("weightInput");
    const voiceInput = document.getElementById("voiceInput");
    const restInput = document.getElementById("restInput");

    const name = nameInput.value.trim() || "Спортсмен";

    const weightWasEmpty =
        settings.weight === null || settings.weight === undefined;

    const weightStr = weightInput.value.trim();
    let weight = null;

    if (weightStr !== "") {
        weight = Number(weightStr);

        if (!Number.isFinite(weight) || weight < 30 || weight > 250) {
            alert("Введите корректный вес от 30 до 250 кг, либо оставьте поле пустым.");
            return null;
        }

        weight = Math.round(weight * 10) / 10;
    }

    let restOverride = null;

    if (restInput.value !== "program") {
        const n = Number(restInput.value);
        if (Number.isFinite(n) && n >= 15 && n <= 300) {
            restOverride = n;
        }
    }

    const trainingDays = [];

    document
        .querySelectorAll(".day-checkbox")
        .forEach(cb => {
            if (cb.checked) {
                trainingDays.push(Number(cb.dataset.day));
            }
        });

    return {
        name,
        weight,
        weightWasEmpty,
        voiceCountdown: voiceInput.checked,
        restOverride,
        trainingDays
    };
}


function applySettings(data) {

    settings.name = data.name;
    settings.weight = data.weight;
    settings.voiceCountdown = data.voiceCountdown;
    settings.restOverride = data.restOverride;
    settings.trainingDays = data.trainingDays;

    saveJSON(STORAGE_KEYS.settings, settings);

    updateWeightHistory(data.weight, data.weightWasEmpty);

    renderHome();
    showScreen("screenHome");
}


function pluralDays(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "тренировка";
    if (mod10 >= 2 && mod10 <= 4 &&
        (mod100 < 10 || mod100 >= 20)) return "тренировки";
    return "тренировок";
}


function exportData() {

    const data = {
        version: "1.8.3",
        exportedAt: new Date().toISOString(),
        settings: loadJSON(STORAGE_KEYS.settings, {}),
        history: loadJSON(STORAGE_KEYS.history, []),
        weightHistory: loadJSON(STORAGE_KEYS.weightHistory, []),
        achievements: loadJSON(STORAGE_KEYS.achievements, [])
    };

    const json = JSON.stringify(data, null, 2);

    const filename =
        `pushup-coach-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

    const blob = new Blob([json], { type: "application/json" });

    try {
        const file = new File([blob], filename, {
            type: "application/json"
        });

        if (navigator.canShare &&
            navigator.canShare({ files: [file] })) {

            navigator.share({
                files: [file],
                title: "Push-Up Coach — бэкап"
            }).catch(() => {});
            return;
        }
    } catch (e) { /* обычное скачивание */ }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function importDataFile(file) {

    const reader = new FileReader();

    reader.onload = (e) => {

        try {
            const data = JSON.parse(e.target.result);

            if (!data.history || !Array.isArray(data.history)) {
                alert("Неверный формат файла.");
                return;
            }

            const ok = confirm(
                `Загрузить данные?\n\n` +
                `Тренировок в файле: ${data.history.length}\n\n` +
                `Это заменит текущий прогресс.`
            );

            if (!ok) return;

            if (data.settings) {
                saveJSON(STORAGE_KEYS.settings, data.settings);
            }

            saveJSON(STORAGE_KEYS.history, data.history);

            if (data.weightHistory) {
                saveJSON(STORAGE_KEYS.weightHistory, data.weightHistory);
            }

            if (data.achievements) {
                saveJSON(STORAGE_KEYS.achievements, data.achievements);
            }

            removeStorage(STORAGE_KEYS.activeWorkout);

            alert("Данные загружены. Приложение перезагрузится.");

            location.reload();

        } catch (err) {
            alert("Ошибка чтения файла: " + err.message);
        }
    };

    reader.readAsText(file);
}


function getStrengthStats() {

    const history = loadJSON(STORAGE_KEYS.history, []);

    if (history.length === 0) {
        return { start: 0, now: 0 };
    }

    let start = 0;
    history[0].results?.forEach(r => {
        const a = Number(r.actual);
        if (a > start) start = a;
    });

    let now = start;
    history.forEach(record => {
        record.results?.forEach(r => {
            const a = Number(r.actual);
            if (a > now) now = a;
        });
    });

    return { start, now };
}


function getMaxByGrip() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const max = {};

    history.forEach(record => {
        record.results?.forEach(r => {
            const a = Number(r.actual);
            if (!max[record.grip] || a > max[record.grip]) {
                max[record.grip] = a;
            }
        });
    });

    return max;
}


function getWeeklyVolume() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const map = {};

    history.forEach(r => {
        if (!r.week) return;
        const total = Number(r.totalActual) || 0;
        if (!map[r.week]) map[r.week] = 0;
        map[r.week] += total;
    });

    return Object.entries(map)
        .map(([week, volume]) => ({
            week: Number(week),
            volume
        }))
        .sort((a, b) => a.week - b.week);
}


function formatDelta(value, unit) {

    if (value > 0) return `+${value} ${unit}`;
    if (value < 0) return `${value} ${unit}`;
    return "без изменений";
}


function renderLineChart(data, options) {

    options = options || {};

    const width = options.width || 320;
    const height = options.height || 140;
    const padL = options.padL !== undefined ? options.padL : 8;
    const padR = options.padR !== undefined ? options.padR : 40;
    const padT = options.padT !== undefined ? options.padT : 16;
    const padB = options.padB !== undefined ? options.padB : 24;

    const last = data.slice(-30);

    const values = last.map(d => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const points = last.map((d, i) => ({
        x: padL + (i / (last.length - 1)) * innerW,
        y: padT + innerH - ((d.value - minV) / range) * innerH
    }));

    const pathD = points
        .map((p, i) =>
            (i === 0 ? "M" : "L") +
            p.x.toFixed(1) + "," + p.y.toFixed(1)
        )
        .join(" ");

    const circles = points
        .map(p =>
            `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" />`
        )
        .join("");

    const maxLabel =
        `<text x="${width - 6}" y="${padT + 4}" text-anchor="end" class="chart-label">${maxV.toFixed(0)}</text>`;

    const minLabel =
        `<text x="${width - 6}" y="${padT + innerH}" text-anchor="end" class="chart-label">${minV.toFixed(0)}</text>`;

    const defaultXLabel = (d) => {
        const dt = new Date(d.date);
        return `${dt.getDate()}.${(dt.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
    };

    const xLabel = options.xLabel || defaultXLabel;

    const startDate =
        `<text x="${padL}" y="${height - 6}" text-anchor="start" class="chart-label">${xLabel(last[0])}</text>`;

    const endDate =
        `<text x="${width - padR}" y="${height - 6}" text-anchor="end" class="chart-label">${xLabel(last[last.length - 1])}</text>`;

    return `
        <svg viewBox="0 0 ${width} ${height}" class="weight-chart" role="img">
            <path d="${pathD}" />
            ${circles}
            ${maxLabel}
            ${minLabel}
            ${startDate}
            ${endDate}
        </svg>
    `;
}


function renderWeightChart(data) {

    if (!data || data.length < 2) {
        return "<p class='chart-empty'>Недостаточно данных для графика. Меняйте вес в настройках — точки появятся здесь.</p>";
    }

    const points = data.slice(-30).map(d => ({
        date: d.date,
        value: d.weight
    }));

    return renderLineChart(points, {});
}


function renderVolumeChart(data) {

    if (!data || data.length < 2) {
        return "<p class='chart-empty'>Объём появится после двух и более недель тренировок.</p>";
    }

    const points = data.map(d => ({
        value: d.volume,
        week: d.week
    }));

    return renderLineChart(points, {
        xLabel: (d) => `нед. ${d.week}`
    });
}


function renderProgress() {

    const weightHistory = loadJSON(STORAGE_KEYS.weightHistory, []);
    const strength = getStrengthStats();

    document.getElementById("strengthStart").textContent =
        strength.start ? strength.start : "—";

    document.getElementById("strengthNow").textContent =
        strength.now ? strength.now : "—";

    document.getElementById("strengthDelta").textContent =
        strength.now && strength.start
            ? formatDelta(strength.now - strength.start, "повторов")
            : "Нет данных";


    const startWeight =
        weightHistory[0]?.weight ?? settings.weight;

    const nowWeight =
        weightHistory.length
            ? weightHistory[weightHistory.length - 1].weight
            : settings.weight;

    document.getElementById("weightStart").textContent =
        startWeight ? `${startWeight} кг` : "—";

    document.getElementById("weightNow").textContent =
        nowWeight ? `${nowWeight} кг` : "—";

    if (startWeight && nowWeight) {
        const wDelta =
            Math.round((nowWeight - startWeight) * 10) / 10;
        document.getElementById("weightDelta").textContent =
            formatDelta(wDelta, "кг");
    } else {
        document.getElementById("weightDelta").textContent = "Нет данных";
    }

    document.getElementById("weightChartContainer").innerHTML =
        renderWeightChart(weightHistory);


    const volume = getWeeklyVolume();

    document.getElementById("volumeChartContainer").innerHTML =
        renderVolumeChart(volume);


    const maxByGrip = getMaxByGrip();

    const grips = [
        "Обычный",
        "Узкий",
        "Широкий",
        "Ноги выше"
    ];

    document.getElementById("gripProgress").innerHTML =
        grips.map(grip => `
            <div class="grip-item">
                <div class="grip-name">${grip}</div>
                <div class="grip-value">
                    ${maxByGrip[grip] ? maxByGrip[grip] : "—"}
                </div>
            </div>
        `).join("");


    renderAchievements();
}


function showProgress() {
    renderProgress();
    showScreen("screenProgress");
}


function ensureWeightHistory() {

    const wh = loadJSON(STORAGE_KEYS.weightHistory, null);

    if (wh && wh.length > 0) return;

    if (settings.weight) {
        saveJSON(STORAGE_KEYS.weightHistory, [{
            date: new Date().toISOString(),
            weight: settings.weight
        }]);
    } else {
        saveJSON(STORAGE_KEYS.weightHistory, []);
    }
}


function goHome() {
    clearRestTimer();
    renderHome();
    showScreen("screenHome");
}


function showHistory() {
    renderHistory();
    showScreen("screenHistory");
}


function showProgram() {
    renderProgram();
    showScreen("screenProgram");
}


function showSettings() {
    renderSettings();
    showScreen("screenSettings");
}


function exitWorkout() {

    const confirmed = confirm(
        "Тренировка ещё не закончена.\n\n" +
        "Ваш текущий прогресс будет сохранён. Выйти?"
    );

    if (!confirmed) return;

    clearRestTimer();
    saveActiveWorkout();

    renderHome();
    showScreen("screenHome");
}


function resetProgress() {

    const confirmed = confirm(
        "Сбросить весь прогресс?\n\n" +
        "Это удалит:\n" +
        "• всю историю тренировок\n" +
        "• текущую активную тренировку\n" +
        "• историю веса\n" +
        "• достижения\n\n" +
        "Программа начнётся с Недели 1, Дня 1."
    );

    if (!confirmed) return;

    removeStorage(STORAGE_KEYS.history);
    removeStorage(STORAGE_KEYS.activeWorkout);
    removeStorage(STORAGE_KEYS.weightHistory);
    removeStorage(STORAGE_KEYS.achievements);

    alert("Прогресс сброшен.");

    ensureWeightHistory();
    renderHome();
    showScreen("screenHome");
}


function shareApp() {

    const url = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: "Push-Up Coach",
            text: "Персональный тренер по отжиманиям",
            url
        }).catch(() => {});
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(() => alert("Ссылка скопирована."))
            .catch(() => alert("Ссылка: " + url));
        return;
    }

    alert("Ссылка: " + url);
}


async function checkForUpdates() {

    const confirmed = confirm(
        "Проверить обновление?\n\n" +
        "Приложение снесёт кэш и перезагрузится. " +
        "Прогресс сохранится."
    );

    if (!confirmed) return;

    try {
        if ("serviceWorker" in navigator) {
            const regs =
                await navigator.serviceWorker.getRegistrations();
            for (const r of regs) {
                await r.unregister();
            }
        }

        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(
                keys.map(k => caches.delete(k))
            );
        }

        location.reload();
    } catch (error) {
        console.warn("Ошибка обновления:", error);
        location.reload();
    }
}