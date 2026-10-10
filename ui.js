/* =========================================
   UI.JS
   ========================================= */


const screens = document.querySelectorAll(".screen");

const SCREEN_TITLES = {
    screenHome: "Твой персональный тренер",
    screenWorkout: "Тренировка",
    screenDone: "Тренировка завершена",
    screenProgress: "Прогресс",
    screenLeaderboard: "Рейтинг",
    screenHistory: "История",
    screenProgram: "Программа",
    screenSettings: "Настройки"
};


const ACHIEVEMENTS = [
    {
        id: "first",
        icon: "🎯",
        title: "Первая тренировка",
        desc: "Программа началась",
        how: "Просто начни — первая тренировка откроет эту веху.",
        check: (h) => h.filter(r => !r.isExtra).length >= 1,
        progress: (h) => ({ current: Math.min(h.filter(r => !r.isExtra).length, 1), target: 1 })
    },
    {
        id: "week1",
        icon: "📅",
        title: "Первая неделя",
        desc: "Первая неделя программы пройдена",
        how: "Пройди полностью первую неделю по программе.",
        check: (h) => h.filter(r => !r.isExtra).length >= (getActiveConfig().daysPerWeek || 3),
        progress: (h) => ({
            current: Math.min(h.filter(r => !r.isExtra).length, getActiveConfig().daysPerWeek || 3),
            target: getActiveConfig().daysPerWeek || 3
        })
    },
    {
        id: "ten",
        icon: "🔟",
        title: "10 тренировок",
        desc: "Уже не новичок",
        how: "Пройди 10 плановых тренировок.",
        check: (h) => h.filter(r => !r.isExtra).length >= 10,
        progress: (h) => ({ current: Math.min(h.filter(r => !r.isExtra).length, 10), target: 10 })
    },
    {
        id: "twentyfive",
        icon: "💪",
        title: "25 тренировок",
        desc: "Четверть пути",
        how: "Пройди 25 плановых тренировок.",
        check: (h) => h.filter(r => !r.isExtra).length >= 25,
        progress: (h) => ({ current: Math.min(h.filter(r => !r.isExtra).length, 25), target: 25 })
    },
    {
        id: "fifty",
        icon: "🚀",
        title: "50 тренировок",
        desc: "Больше половины программы",
        how: "Пройди 50 плановых тренировок.",
        check: (h) => h.filter(r => !r.isExtra).length >= 50,
        progress: (h) => ({ current: Math.min(h.filter(r => !r.isExtra).length, 50), target: 50 })
    },
    {
        id: "record10",
        icon: "⭐",
        title: "Рекорд 10",
        desc: "10 повторов в подходе",
        how: "Сделай 10 повторов в одном подходе.",
        check: (h, max) => max >= 10,
        progress: (h, max) => ({ current: Math.min(max, 10), target: 10 })
    },
    {
        id: "record15",
        icon: "🌟",
        title: "Рекорд 15",
        desc: "15 повторов в подходе",
        how: "Сделай 15 повторов в одном подходе.",
        check: (h, max) => max >= 15,
        progress: (h, max) => ({ current: Math.min(max, 15), target: 15 })
    },
    {
        id: "record20",
        icon: "🏅",
        title: "Рекорд 20",
        desc: "20 повторов в подходе",
        how: "Сделай 20 повторов в одном подходе.",
        check: (h, max) => max >= 20,
        progress: (h, max) => ({ current: Math.min(max, 20), target: 20 })
    },
    {
        id: "record25",
        icon: "👑",
        title: "Рекорд 25",
        desc: "25 повторов в подходе",
        how: "Сделай 25 повторов в одном подходе.",
        check: (h, max) => max >= 25,
        progress: (h, max) => ({ current: Math.min(max, 25), target: 25 })
    },
    {
        id: "first_test",
        icon: "🎓",
        title: "Первый тест",
        desc: "Тест на максимум пройден",
        how: "Дойди до тестовой недели (каждая 6-я) и пройди тест.",
        check: (h) => h.some(r => r.isTest)
    },
    {
        id: "extra",
        icon: "➕",
        title: "Сверх плана",
        desc: "Первая дополнительная тренировка",
        how: "Сделай первую дополнительную тренировку сверх программы.",
        check: (h) => h.some(r => r.isExtra),
        progress: (h) => ({ current: Math.min(h.filter(r => r.isExtra).length, 1), target: 1 })
    },
    {
        id: "extra5",
        icon: "🔥",
        title: "Рвение",
        desc: "5 дополнительных тренировок",
        how: "Сделай 5 дополнительных тренировок сверх программы.",
        check: (h) => h.filter(r => r.isExtra).length >= 5,
        progress: (h) => ({ current: Math.min(h.filter(r => r.isExtra).length, 5), target: 5 })
    }
];


let editingHistoryIndex = -1;
let editingHistoryDraft = null;
let achievementQueue = [];
let achievementModalMode = "new";


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
            : "—";

    renderProgressStats();
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


function renderProgressStats() {

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

    const maxEl = document.getElementById("maxPushups");
    if (maxEl) {
        maxEl.textContent = maxPushups > 0 ? maxPushups : "—";
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    let weeklyVolume = 0;
    let prevWeeklyVolume = 0;

    history.forEach(record => {
        const t = new Date(record.date).getTime();
        const total = Number(record.totalActual) || 0;

        if (t >= weekAgo) {
            weeklyVolume += total;
        } else if (t >= twoWeeksAgo) {
            prevWeeklyVolume += total;
        }
    });

    const weeklyEl = document.getElementById("weeklyVolume");
    if (weeklyEl) {
        weeklyEl.textContent = weeklyVolume > 0 ? weeklyVolume : "—";
    }

    const deltaLine = document.getElementById("weeklyDeltaLine");

    if (deltaLine) {

        if (weeklyVolume > 0 && prevWeeklyVolume > 0) {

            const d = weeklyVolume - prevWeeklyVolume;

            if (d > 0) {
                deltaLine.textContent =
                    `🔥 Прирост: +${d} к прошлой неделе`;
                deltaLine.className = "delta-line delta-up";
            } else if (d < 0) {
                deltaLine.textContent =
                    `Снижение: ${d} к прошлой неделе`;
                deltaLine.className = "delta-line delta-down";
            } else {
                deltaLine.textContent =
                    "На уровне прошлой недели";
                deltaLine.className = "delta-line";
            }

        } else if (weeklyVolume > 0) {
            deltaLine.textContent =
                "Первая активная неделя";
            deltaLine.className = "delta-line";
        } else {
            deltaLine.textContent = "";
            deltaLine.className = "delta-line hidden";
        }
    }
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


function getAvailableGrips() {

    const stats = getProgramStats();
    const daysPerWeek = getActiveConfig().daysPerWeek || 3;
    const programIndex = stats.planDone;

    const currentWeek = Math.floor(programIndex / daysPerWeek);
    const currentBlock = Math.floor(currentWeek / BLOCK_WEEKS);

    const maxBlock = Math.min(
        currentBlock,
        PROGRAM_GRIPS.length - 1
    );

    return PROGRAM_GRIPS.slice(0, maxBlock + 1);
}


function openExtraConfigModal() {

    const gripSelect = document.getElementById("extraGrip");
    const setsSelect = document.getElementById("extraSets");
    const repsSelect = document.getElementById("extraReps");
    const hintEl = document.getElementById("extraHint");

    if (!gripSelect || !setsSelect || !repsSelect) return;

    const grips = getAvailableGrips();

    gripSelect.innerHTML = grips
        .map(g => `<option value="${g}">${g}</option>`)
        .join("");

    let setsHtml = "";
    for (let i = 1; i <= 10; i++) {
        setsHtml += `<option value="${i}" ${i === 3 ? "selected" : ""}>${i}</option>`;
    }
    setsSelect.innerHTML = setsHtml;

    const next = getNextWorkout(false);
    let defaultReps = 10;

    if (next && next.reps) {
        defaultReps = Math.max(3, Math.round(next.reps / 2));
    }

    let repsHtml = "";
    for (let i = 1; i <= 50; i++) {
        repsHtml += `<option value="${i}" ${i === defaultReps ? "selected" : ""}>${i}</option>`;
    }
    repsSelect.innerHTML = repsHtml;

    if (hintEl) {
        if (grips.length === 1) {
            hintEl.textContent =
                "Пока доступен только «Обычный» хват. " +
                "Остальные откроются по мере прохождения программы.";
        } else {
            hintEl.textContent =
                `Доступно ${grips.length} хватов — открываются по мере прохождения блоков.`;
        }
    }

    document.getElementById("extraConfigModal")
        .classList.remove("hidden");
}


function closeExtraConfigModal() {
    document.getElementById("extraConfigModal")
        .classList.add("hidden");
}


function submitExtraConfig() {

    const gripEl = document.getElementById("extraGrip");
    const setsEl = document.getElementById("extraSets");
    const repsEl = document.getElementById("extraReps");

    if (!gripEl || !setsEl || !repsEl) return;

    const grip = gripEl.value;
    const sets = Number(setsEl.value);
    const reps = Number(repsEl.value);

    closeExtraConfigModal();

    if (typeof startExtraWorkout === "function") {
        startExtraWorkout({ grip, sets, reps });
    }
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

    setTimeout(() => {
        if (typeof submitToLeaderboard === "function") {
            submitToLeaderboard().catch(() => {});
        }
    }, 1500);
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

    const extraEl = document.getElementById("achievementModalExtra");
    if (extraEl) {
        extraEl.innerHTML = "";
        extraEl.classList.add("hidden");
    }

    document.getElementById("achievementModalClose").textContent = "Класс";

    achievementModalMode = "new";

    document.getElementById("achievementModal")
        .classList.remove("hidden");
}


function openAchievementInfo(id) {

    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;

    const history = loadJSON(STORAGE_KEYS.history, []);
    const max = getRecord();
    const unlocked = getUnlockedAchievements();
    const isUnlocked = unlocked.includes(a.id);

    document.getElementById("achievementModalIcon").textContent = a.icon;
    document.getElementById("achievementModalTitle").textContent = a.title;

    const textEl = document.getElementById("achievementModalText");
    textEl.textContent = isUnlocked
        ? "✅ Открыто"
        : a.desc;

    const extraEl = document.getElementById("achievementModalExtra");
    extraEl.innerHTML = "";

    if (a.how) {
        const howEl = document.createElement("div");
        howEl.className = "achievement-how";
        howEl.innerHTML =
            `<strong>Как получить:</strong><br>${escapeHtml(a.how)}`;
        extraEl.appendChild(howEl);
    }

    if (!isUnlocked && a.progress) {
        try {
            const p = a.progress(history, max);
            if (p && p.target > 0) {
                const pct = Math.min(
                    100,
                    Math.round((p.current / p.target) * 100)
                );

                const progEl = document.createElement("div");
                progEl.className = "achievement-progress";
                progEl.innerHTML = `
                    <div class="achievement-progress-head">
                        <strong>Прогресс:</strong>
                        <span>${p.current} / ${p.target}</span>
                    </div>
                    <div class="achievement-progress-bar">
                        <div class="achievement-progress-fill" style="width: ${pct}%"></div>
                    </div>
                `;
                extraEl.appendChild(progEl);
            }
        } catch (e) { /* ignore */ }
    }

    extraEl.classList.remove("hidden");

    document.getElementById("achievementModalClose").textContent = "Понятно";

    achievementModalMode = "info";

    document.getElementById("achievementModal")
        .classList.remove("hidden");
}


function closeAchievementModal() {

    document.getElementById("achievementModal")
        .classList.add("hidden");

    const extraEl = document.getElementById("achievementModalExtra");
    if (extraEl) {
        extraEl.innerHTML = "";
        extraEl.classList.add("hidden");
    }

    if (achievementModalMode === "new" &&
        achievementQueue.length > 0) {
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
            <button
                type="button"
                class="achievement-item ${isUnlocked ? "unlocked" : "locked"}"
                data-ach-id="${a.id}"
            >
                <div class="achievement-item-icon">
                    ${isUnlocked ? a.icon : "🔒"}
                </div>
                <div class="achievement-item-title">
                    ${escapeHtml(a.title)}
                </div>
            </button>
        `;
    }).join("");

    container
        .querySelectorAll(".achievement-item")
        .forEach(btn => {
            btn.addEventListener("click", () => {
                openAchievementInfo(btn.dataset.achId);
            });
        });
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

    renderPushSection();
    renderAbout();
}


function renderPushSection() {

    const statusEl = document.getElementById("pushStatus");
    const disabledEl = document.getElementById("pushDisabled");
    const enabledEl = document.getElementById("pushEnabled");

    if (!statusEl || !disabledEl || !enabledEl) return;

    if (typeof pushSupported !== "function" ||
        !pushSupported()) {

        statusEl.textContent =
            "На этом устройстве уведомления недоступны.";
        statusEl.className = "push-status status-warning";

        disabledEl.classList.add("hidden");
        enabledEl.classList.add("hidden");
        return;
    }

    const subscriptionId =
        typeof getSubscriptionId === "function"
            ? getSubscriptionId()
            : null;

    const permission =
        typeof getPushPermissionState === "function"
            ? getPushPermissionState()
            : "default";

    if (!subscriptionId) {

        if (permission === "denied") {
            statusEl.textContent =
                "Разрешение отклонено. Откройте Настройки iPhone → " +
                "Уведомления → Push-Up Coach и включите вручную.";
            statusEl.className = "push-status status-error";
        } else {
            statusEl.textContent =
                "🔕 Напоминания выключены";
            statusEl.className = "push-status status-disabled";
        }

        disabledEl.classList.remove("hidden");
        enabledEl.classList.add("hidden");
        return;
    }

    statusEl.textContent =
        "🔔 Напоминания включены";
    statusEl.className = "push-status status-enabled";

    disabledEl.classList.add("hidden");
    enabledEl.classList.remove("hidden");

    const timeEl = document.getElementById("pushTime");
    const savedTime =
        localStorage.getItem("pushReminderTime") || "19:00";
    if (timeEl) timeEl.value = savedTime;

    let savedDays = [1, 3, 5];

    try {
        const stored = JSON.parse(
            localStorage.getItem("pushDays")
        );
        if (Array.isArray(stored) && stored.length > 0) {
            savedDays = stored;
        }
    } catch (e) { /* дефолт */ }

    document
        .querySelectorAll(".push-day-checkbox")
        .forEach(cb => {
            const day = Number(cb.dataset.pushDay);
            cb.checked = savedDays.includes(day);
        });
}


function getPushDaysFromUI() {

    const days = [];

    document
        .querySelectorAll(".push-day-checkbox")
        .forEach(cb => {
            if (cb.checked) {
                days.push(Number(cb.dataset.pushDay));
            }
        });

    return days;
}


function refreshPushAfterAction() {
    renderPushSection();
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


let leaderboardData = null;
let leaderboardTab = "weekly";


function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}


function showLeaderboard() {
    showScreen("screenLeaderboard");
    refreshLeaderboard();
}


async function refreshLeaderboard() {

    const listEl = document.getElementById("leaderboardList");

    if (listEl) {
        listEl.innerHTML =
            "<p class='lb-empty'>Загрузка…</p>";
    }

    try {
        await submitToLeaderboard();
    } catch (e) { /* ignore */ }

    leaderboardData = await loadLeaderboard();
    renderLeaderboard();
}


function renderLeaderboard() {

    const listEl = document.getElementById("leaderboardList");
    const metaEl = document.getElementById("lbMeta");

    if (!listEl) return;

    if (!leaderboardData) {
        listEl.innerHTML =
            "<p class='lb-empty'>Не удалось загрузить. Проверь связь.</p>";
        if (metaEl) metaEl.textContent = "";
        return;
    }

    const list = leaderboardTab === "weekly"
        ? leaderboardData.weekly
        : leaderboardData.allTime;

    if (metaEl) {
        if (leaderboardTab === "weekly") {
            metaEl.innerHTML =
                "🏆 <strong>Топ недели по общему количеству отжиманий.</strong><br>" +
                "Большая цифра справа — сколько всего отжался за неделю. " +
                "Под именем — личный рекорд за один подход.";
        } else {
            metaEl.innerHTML =
                "🏆 <strong>Топ за всё время по общему количеству отжиманий.</strong><br>" +
                "Большая цифра справа — сколько всего отжался. " +
                "Под именем — личный рекорд за один подход.";
        }
    }

    if (list.length === 0) {
        listEl.innerHTML =
            "<p class='lb-empty'>Пока никого нет. Будь первым!</p>";
        return;
    }

    const myId = getLeaderboardDeviceId();

    let html = "";

    list.forEach((item, i) => {

        const isMe = item.deviceId === myId;

        let rank;
        if (i === 0) rank = "🥇";
        else if (i === 1) rank = "🥈";
        else if (i === 2) rank = "🥉";
        else rank = String(i + 1);

        const volume = leaderboardTab === "weekly"
            ? item.weeklyVolume
            : item.totalVolume;

        const bestOf = leaderboardTab === "weekly"
            ? item.weeklyBestSet
            : item.bestSet;

        html += `
            <div class="lb-row ${isMe ? "lb-me" : ""}">
                <div class="lb-rank">${rank}</div>
                <div class="lb-content">
                    <div class="lb-name">${escapeHtml(item.name)}</div>
                    <div class="lb-sub">личный рекорд: ${bestOf} за подход</div>
                </div>
                <div class="lb-stat">${volume}</div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}


function exportData() {

    let json;
    let filename;

    try {
        const data = {
            version: "1.9.6",
            exportedAt: new Date().toISOString(),
            settings: loadJSON(STORAGE_KEYS.settings, {}),
            history: loadJSON(STORAGE_KEYS.history, []),
            weightHistory: loadJSON(STORAGE_KEYS.weightHistory, []),
            achievements: loadJSON(STORAGE_KEYS.achievements, [])
        };

        json = JSON.stringify(data, null, 2);
        filename =
            `pushup-coach-backup-${new Date()
                .toISOString()
                .slice(0, 10)}.json`;

    } catch (err) {
        alert("Ошибка сбора данных: " + err.message);
        return;
    }

    if (navigator.share && navigator.canShare) {
        try {
            const blob = new Blob([json], { type: "application/json" });
            const file = new File([blob], filename, {
                type: "application/json"
            });

            if (navigator.canShare({ files: [file] })) {

                navigator.share({
                    files: [file],
                    title: "Push-Up Coach — бэкап"
                })
                .catch(err => {
                    if (err && err.name === "AbortError") return;
                    exportFallbackDownload(json, filename);
                });

                return;
            }
        } catch (err) { /* ignore */ }
    }

    exportFallbackDownload(json, filename);
}


function exportFallbackDownload(json, filename) {

    try {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 2000);

    } catch (err) {
        exportFallbackClipboard(json);
    }
}


async function exportFallbackClipboard(json) {

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(json);
            alert(
                "Скачивание файла недоступно в этом режиме.\n\n" +
                "Данные скопированы в буфер обмена."
            );
            return;
        }
    } catch (err) { /* ignore */ }

    alert("Не удалось сохранить файл.");
}


function importDataFile(file) {

    const reader = new FileReader();

    reader.onload = (e) => {

        try {
            const data = JSON.parse(e.target.result);

            if (!data.history || !Array.isArray(data.history)) {
                alert("Неверный формат файла: нет массива history.");
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

    reader.onerror = () => {
        alert("Не удалось прочитать файл.");
    };

    reader.readAsText(file);
}


function getStrengthStats() {

    const history = loadJSON(STORAGE_KEYS.history, []);

    if (history.length === 0) {
        return {
            start: 0,
            now: 0,
            weekly: 0,
            prevWeekly: 0
        };
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

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    let weekly = 0;
    let prevWeekly = 0;

    history.forEach(record => {
        const t = new Date(record.date).getTime();
        let best = 0;
        record.results?.forEach(r => {
            const a = Number(r.actual);
            if (a > best) best = a;
        });

        if (t >= weekAgo) {
            if (best > weekly) weekly = best;
        } else if (t >= twoWeeksAgo) {
            if (best > prevWeekly) prevWeekly = best;
        }
    });

    return { start, now, weekly, prevWeekly };
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


const CHART_PERIODS = {
    "1m": { label: "Месяц", days: 30 },
    "3m": { label: "3 мес", days: 90 },
    "6m": { label: "6 мес", days: 180 },
    "all": { label: "Всё", days: null }
};


const chartState = {
    weight: { period: "3m" },
    volume: { period: "all" }
};


function filterByPeriod(data, period) {

    if (period === "all") return data;

    const days = CHART_PERIODS[period]?.days;
    if (!days) return data;

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return data.filter(d => {
        const t = new Date(d.date).getTime();
        return t >= cutoff;
    });
}


function renderInteractiveChart(containerId, data, options) {

    const container = document.getElementById(containerId);
    if (!container) return;

    options = options || {};

    const stateKey = options.stateKey || "weight";
    const unit = options.unit || "";
    const label = options.label || "";
    const inverseColors = options.inverseColors === true;

    const valueFormatter = options.valueFormatter ||
        (v => Math.round(v).toString());

    const currentPeriod = chartState[stateKey].period;
    const filtered = filterByPeriod(data, currentPeriod);

    const buttonsHtml = Object.entries(CHART_PERIODS)
        .map(([key, cfg]) =>
            `<button class="chart-period-btn ${currentPeriod === key ? "active" : ""}" data-period="${key}" data-chart="${stateKey}">${cfg.label}</button>`
        )
        .join("");

    if (filtered.length < 2) {

        container.innerHTML = `
            <div class="chart-periods">${buttonsHtml}</div>
            <p class="chart-empty">Недостаточно данных для выбранного периода. Попробуй другой диапазон.</p>
        `;

        bindChartPeriodButtons(container);
        return;
    }

    const width = 320;
    const height = 160;
    const padL = 12;
    const padR = 42;
    const padT = 20;
    const padB = 28;

    const values = filtered.map(d => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const points = filtered.map((d, i) => ({
        x: padL + (i / (filtered.length - 1)) * innerW,
        y: padT + innerH - ((d.value - minV) / range) * innerH,
        value: d.value,
        date: d.date
    }));

    let pathD = "";

    if (points.length === 2) {
        pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} ` +
                `L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
    } else {

        pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

        for (let i = 0; i < points.length - 1; i++) {

            const p0 = points[i - 1] || points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            pathD +=
                ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ` +
                `${cp2x.toFixed(1)},${cp2y.toFixed(1)} ` +
                `${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        }
    }

    const areaD =
        pathD +
        ` L ${points[points.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)}` +
        ` L ${points[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

    const showEveryN = points.length > 15
        ? Math.ceil(points.length / 8)
        : 1;

    const circles = points
        .map((p, i) => {

            const isLast = i === points.length - 1;
            const showDot = isLast || i % showEveryN === 0;

            const r = isLast ? 4 : 3;
            const opacity = isLast ? 1 : 0.7;

            return `
                <circle
                    class="chart-dot"
                    cx="${p.x.toFixed(1)}"
                    cy="${p.y.toFixed(1)}"
                    r="${r}"
                    data-index="${i}"
                    opacity="${showDot ? opacity : 0}"
                />
            `;
        })
        .join("");

    const maxLabel = valueFormatter(maxV);
    const minLabel = valueFormatter(minV);

    const firstDate = new Date(points[0].date);
    const lastDate = new Date(points[points.length - 1].date);

    const fmtDate = (d) =>
        `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;

    const startDateLabel = fmtDate(firstDate);
    const endDateLabel = fmtDate(lastDate);

    const firstVal = points[0].value;
    const lastVal = points[points.length - 1].value;
    const diff = Math.round((lastVal - firstVal) * 10) / 10;
    const diffSign = diff > 0 ? "+" : "";
    const diffLabel = `${diffSign}${diff}${unit ? " " + unit : ""}`;

    // Инверсия цветов для веса: сброс = хорошо, набор = плохо
    let diffColorClass = "";

    if (diff !== 0) {
        if (inverseColors) {
            diffColorClass = diff < 0 ? "up" : "down";
        } else {
            diffColorClass = diff > 0 ? "up" : "down";
        }
    }

    container.innerHTML = `
        <div class="chart-periods">${buttonsHtml}</div>

        <div class="chart-wrap" data-chart="${stateKey}">

            <svg
                class="interactive-chart"
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="xMidYMid meet"
            >

                <defs>
                    <linearGradient
                        id="chart-gradient-${stateKey}"
                        x1="0" y1="0" x2="0" y2="1"
                    >
                        <stop offset="0%" stop-color="currentColor" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
                    </linearGradient>
                </defs>

                <path
                    class="chart-area"
                    d="${areaD}"
                    fill="url(#chart-gradient-${stateKey})"
                />

                <path
                    class="chart-line"
                    d="${pathD}"
                />

                ${circles}

                <text
                    class="chart-label"
                    x="${width - 6}"
                    y="${padT + 4}"
                    text-anchor="end"
                >${maxLabel}</text>

                <text
                    class="chart-label"
                    x="${width - 6}"
                    y="${padT + innerH + 4}"
                    text-anchor="end"
                >${minLabel}</text>

                <text
                    class="chart-label"
                    x="${padL}"
                    y="${height - 8}"
                    text-anchor="start"
                >${startDateLabel}</text>

                <text
                    class="chart-label"
                    x="${width - padR}"
                    y="${height - 8}"
                    text-anchor="end"
                >${endDateLabel}</text>

            </svg>

            <div class="chart-tooltip hidden" data-tooltip="${stateKey}">
                <div class="chart-tooltip-value"></div>
                <div class="chart-tooltip-date"></div>
            </div>

        </div>

        <div class="chart-summary">
            <span class="chart-summary-label">${label}:</span>
            <span class="chart-summary-main">
                <strong>${valueFormatter(lastVal)}${unit ? " " + unit : ""}</strong>
                <span class="chart-diff ${diffColorClass}">${diffLabel}</span>
            </span>
        </div>
    `;

    const lineEl = container.querySelector(".chart-line");

    if (lineEl) {
        const length = lineEl.getTotalLength();
        lineEl.style.strokeDasharray = length;
        lineEl.style.strokeDashoffset = length;
        lineEl.style.transition = "stroke-dashoffset 1.2s ease-out";
        lineEl.style.opacity = "1";

        requestAnimationFrame(() => {
            lineEl.style.strokeDashoffset = "0";
        });
    }

    bindChartInteractions(container, points, {
        unit,
        valueFormatter,
        xLabel: fmtDate
    });

    bindChartPeriodButtons(container);
}


function bindChartPeriodButtons(container) {

    container
        .querySelectorAll(".chart-period-btn")
        .forEach(btn => {
            btn.addEventListener("click", () => {

                const stateKey = btn.dataset.chart;
                const period = btn.dataset.period;

                chartState[stateKey].period = period;

                if (stateKey === "weight") {
                    renderWeightChart();
                } else if (stateKey === "volume") {
                    renderVolumeChart();
                }
            });
        });
}


function bindChartInteractions(container, points, opts) {

    const dots = container.querySelectorAll(".chart-dot");
    const tooltip = container.querySelector(".chart-tooltip");

    if (!tooltip) return;

    const valueEl = tooltip.querySelector(".chart-tooltip-value");
    const dateEl = tooltip.querySelector(".chart-tooltip-date");

    function showTooltip(point) {

        valueEl.textContent =
            opts.valueFormatter(point.value) +
            (opts.unit ? " " + opts.unit : "");

        dateEl.textContent = new Date(point.date)
            .toLocaleDateString("ru-RU");

        tooltip.classList.remove("hidden");

        const svg = container.querySelector(".interactive-chart");
        const rect = svg.getBoundingClientRect();
        const wrapRect = container
            .querySelector(".chart-wrap")
            .getBoundingClientRect();

        const scaleX = rect.width / 320;
        const scaleY = rect.height / 160;

        const x = point.x * scaleX;
        const y = point.y * scaleY;

        let left = x - 60;
        let top = y - 60;

        left = Math.max(8, Math.min(left, wrapRect.width - 128));
        top = Math.max(4, top);

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    }

    function hideTooltip() {
        tooltip.classList.add("hidden");
    }

    dots.forEach(dot => {
        dot.addEventListener("click", (e) => {
            e.stopPropagation();
            const idx = Number(dot.dataset.index);
            showTooltip(points[idx]);
        });

        dot.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            const idx = Number(dot.dataset.index);
            showTooltip(points[idx]);
        }, { passive: true });
    });

    container.addEventListener("click", hideTooltip);
}


function renderWeightChart() {

    const weightHistory = loadJSON(STORAGE_KEYS.weightHistory, [])
        .map(d => ({
            date: d.date,
            value: Number(d.weight)
        }));

    renderInteractiveChart("weightChartContainer", weightHistory, {
        stateKey: "weight",
        unit: "кг",
        label: "Сейчас",
        valueFormatter: v => v.toFixed(1),
        inverseColors: true
    });
}


function renderVolumeChart() {

    const volume = getWeeklyVolume()
        .map(d => ({
            date: new Date().toISOString(),
            value: d.volume,
            week: d.week
        }));

    renderInteractiveChart("volumeChartContainer", volume, {
        stateKey: "volume",
        unit: "",
        label: "Последняя неделя",
        valueFormatter: v => Math.round(v).toString()
    });
}


function renderProgress() {

    const strength = getStrengthStats();

    document.getElementById("strengthStart").textContent =
        strength.start ? strength.start : "—";

    document.getElementById("strengthNow").textContent =
        strength.now ? strength.now : "—";

    document.getElementById("strengthDelta").textContent =
        strength.now && strength.start
            ? formatDelta(strength.now - strength.start, "повторов")
            : "Нет данных";

    const weeklyEl = document.getElementById("strengthWeekly");
    const prevWeeklyEl = document.getElementById("strengthPrevWeekly");
    const weeklyDeltaEl = document.getElementById("weeklyDelta");

    if (weeklyEl) {
        weeklyEl.textContent =
            strength.weekly > 0 ? strength.weekly : "—";
    }

    if (prevWeeklyEl) {
        prevWeeklyEl.textContent =
            strength.prevWeekly > 0 ? strength.prevWeekly : "—";
    }

    if (weeklyDeltaEl) {
        if (strength.weekly > 0 && strength.prevWeekly > 0) {
            const d = strength.weekly - strength.prevWeekly;
            if (d > 0) {
                weeklyDeltaEl.textContent =
                    `🔥 Прирост +${d} к прошлой неделе`;
                weeklyDeltaEl.className = "delta-line delta-up";
            } else if (d < 0) {
                weeklyDeltaEl.textContent =
                    `Снижение ${d} к прошлой неделе`;
                weeklyDeltaEl.className = "delta-line delta-down";
            } else {
                weeklyDeltaEl.textContent =
                    "На уровне прошлой недели";
                weeklyDeltaEl.className = "delta-line";
            }
        } else if (strength.weekly > 0) {
            weeklyDeltaEl.textContent =
                "Первая тренировка за последние 7 дней";
            weeklyDeltaEl.className = "delta-line";
        } else {
            weeklyDeltaEl.textContent = "";
            weeklyDeltaEl.className = "delta-line";
        }
    }


    const weightHistory = loadJSON(STORAGE_KEYS.weightHistory, []);

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

    renderWeightChart();
    renderVolumeChart();


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