/* =========================================
   UI.JS
   Переключение экранов и отрисовка.
   ========================================= */


const screens = document.querySelectorAll(".screen");


function showScreen(id) {

    screens.forEach(screen => {
        screen.hidden = screen.id !== id;
    });

    window.scrollTo(0, 0);
}


/* =========================================
   ГЛАВНЫЙ ЭКРАН
   ========================================= */


function renderHome() {

    const activeWorkout = loadJSON(
        STORAGE_KEYS.activeWorkout,
        null
    );

    const preview = activeWorkout
        ? activeWorkout.workout
        : getNextWorkout();

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
        `${settings.weight} кг`;

    renderMaxPushups();

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

    let maxPushups = 10;

    history.forEach(record => {
        record.results?.forEach(result => {
            const value = Number(result.actual);
            if (Number.isFinite(value) && value > maxPushups) {
                maxPushups = value;
            }
        });
    });

    document.getElementById("maxPushups").textContent = maxPushups;
}


/* =========================================
   ЭКРАН ТРЕНИРОВКИ
   ========================================= */


function renderWorkoutScreen() {

    if (!workout) return;

    const titleEl = document.getElementById("workoutGrip");
    const restEl = document.getElementById("workoutRest");

    titleEl.textContent = workout.isTest
        ? `Тест · ${workout.grip}`
        : `${workout.grip} хват`;

    restEl.textContent = `${workout.rest} сек`;
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

    document.getElementById("workoutStatus").textContent =
        `Отдых: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}


/* =========================================
   ЭКРАН РЕЗУЛЬТАТА
   ========================================= */


function renderDoneScreen(record, saved) {

    document.getElementById("doneSets").textContent =
        record.results.length;

    document.getElementById("donePlanned").textContent =
        record.totalPlanned;

    document.getElementById("doneActual").textContent =
        record.totalActual;

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


/* =========================================
   ИСТОРИЯ
   ========================================= */


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

    [...history].reverse().forEach(record => {

        const item = document.createElement("div");
        item.className = "history-item";

        const date = new Date(record.date);

        const title = record.isTest
            ? `Тест · ${record.grip}`
            : `${record.grip} хват`;

        const subtitle = record.week
            ? `Неделя ${record.week} · День ${record.day}`
            : "";

        const diffText =
            difficultyLabels[record.difficulty] || "";

        item.innerHTML = `
            <div class="history-date">
                ${date.toLocaleString("ru-RU")}
            </div>
            <div class="history-main">
                ${title}
            </div>
            <div class="history-total">
                ${subtitle ? subtitle + " · " : ""}
                Факт: ${record.totalActual} из ${record.totalPlanned}
                ${diffText ? " · " + diffText : ""}
            </div>
        `;

        list.appendChild(item);
    });
}


/* =========================================
   ПРОГРАММА
   ========================================= */


function renderProgram() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const completed = history.length;
    const total = PROGRAM.length;

    document.getElementById("programProgress").textContent =
        `${completed} / ${total}`;

    let html = "";

    for (let week = 1; week <= 24; week++) {

        const startIndex = (week - 1) * 3;
        const doneInWeek = Math.max(
            0,
            Math.min(3, completed - startIndex)
        );

        const isCurrent =
            completed >= startIndex &&
            completed < startIndex + 3;

        const isDone = completed >= startIndex + 3;

        const template = PROGRAM[startIndex];

        const info = template.isTest
            ? `${template.grip} · тест`
            : `${template.grip} · ${template.sets}×${template.reps}`;

        let cls = "program-week";
        if (isDone) cls += " done";
        if (isCurrent) cls += " current";

        html += `
            <div class="${cls}">
                <div>
                    <div class="program-week-title">
                        Неделя ${week}
                    </div>
                    <div class="program-week-info">
                        ${info}
                    </div>
                </div>
                <div class="program-week-progress">
                    ${doneInWeek} / 3
                </div>
            </div>
        `;
    }

    document.getElementById("programList").innerHTML = html;
}


/* =========================================
   НАСТРОЙКИ
   ========================================= */


function renderSettings() {
    document.getElementById("weightInput").value = settings.weight;
}


function saveSettings() {

    const input = document.getElementById("weightInput");
    const weight = Number(input.value);

    if (!Number.isFinite(weight) || weight < 30 || weight > 250) {
        alert("Введите корректный вес от 30 до 250 кг.");
        return;
    }

    settings.weight = Math.round(weight * 10) / 10;

    saveJSON(STORAGE_KEYS.settings, settings);

    const weightHistory = loadJSON(STORAGE_KEYS.weightHistory, []);
    const last = weightHistory[weightHistory.length - 1];

    if (!last || last.weight !== settings.weight) {
        weightHistory.push({
            date: new Date().toISOString(),
            weight: settings.weight
        });
        saveJSON(STORAGE_KEYS.weightHistory, weightHistory);
    }

    renderHome();
    showScreen("screenHome");
}


function resetProgress() {

    const confirmed = confirm(
        "Сбросить весь прогресс?\n\n" +
        "Это удалит:\n" +
        "• всю историю тренировок\n" +
        "• текущую активную тренировку\n" +
        "• историю веса\n\n" +
        "Программа начнётся с Недели 1, Дня 1."
    );

    if (!confirmed) return;

    removeStorage(STORAGE_KEYS.history);
    removeStorage(STORAGE_KEYS.activeWorkout);
    removeStorage(STORAGE_KEYS.weightHistory);

    alert("Прогресс сброшен.");

    ensureWeightHistory();
    renderHome();
    showScreen("screenHome");
}


/* =========================================
   ПРОГРЕСС
   ========================================= */


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


function formatDelta(value, unit) {

    if (value > 0) return `+${value} ${unit}`;
    if (value < 0) return `${value} ${unit}`;
    return "без изменений";
}


function renderWeightChart(data) {

    if (!data || data.length < 2) {
        return "<p class='chart-empty'>Недостаточно данных для графика. Меняйте вес в настройках — точки появятся здесь.</p>";
    }

    const last = data.slice(-30);

    const width = 320;
    const height = 140;
    const padL = 8;
    const padR = 40;
    const padT = 16;
    const padB = 24;

    const values = last.map(d => d.weight);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const points = last.map((d, i) => ({
        x: padL + (i / (last.length - 1)) * innerW,
        y: padT + innerH - ((d.weight - minV) / range) * innerH
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
        `<text x="${width - 6}" y="${padT + 4}" text-anchor="end" class="chart-label">${maxV.toFixed(1)}</text>`;

    const minLabel =
        `<text x="${width - 6}" y="${padT + innerH}" text-anchor="end" class="chart-label">${minV.toFixed(1)}</text>`;

    const dFirst = new Date(last[0].date);
    const dLast = new Date(last[last.length - 1].date);

    const fmt = d =>
        `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;

    const startDate =
        `<text x="${padL}" y="${height - 6}" text-anchor="start" class="chart-label">${fmt(dFirst)}</text>`;

    const endDate =
        `<text x="${width - padR}" y="${height - 6}" text-anchor="end" class="chart-label">${fmt(dLast)}</text>`;

    return `
        <svg viewBox="0 0 ${width} ${height}" class="weight-chart" role="img" aria-label="График веса">
            <path d="${pathD}" />
            ${circles}
            ${maxLabel}
            ${minLabel}
            ${startDate}
            ${endDate}
        </svg>
    `;
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


    const startWeight = weightHistory[0]?.weight ?? settings.weight;
    const nowWeight = weightHistory.length
        ? weightHistory[weightHistory.length - 1].weight
        : settings.weight;

    document.getElementById("weightStart").textContent =
        `${startWeight} кг`;

    document.getElementById("weightNow").textContent =
        `${nowWeight} кг`;

    const wDelta = Math.round((nowWeight - startWeight) * 10) / 10;

    document.getElementById("weightDelta").textContent =
        formatDelta(wDelta, "кг");


    document.getElementById("weightChartContainer").innerHTML =
        renderWeightChart(weightHistory);


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
}


function showProgress() {
    renderProgress();
    showScreen("screenProgress");
}


function ensureWeightHistory() {

    const wh = loadJSON(STORAGE_KEYS.weightHistory, null);

    if (wh && wh.length > 0) return;

    saveJSON(STORAGE_KEYS.weightHistory, [{
        date: new Date().toISOString(),
        weight: settings.weight
    }]);
}


/* =========================================
   НАВИГАЦИЯ
   ========================================= */


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