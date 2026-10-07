/* =========================================
   WORKOUT.JS
   ========================================= */


let workout = null;

let currentSet = 0;
let workoutResults = [];
let actualReps = 0;
let restEndsAt = 0;
let remainingSeconds = 0;
let timerInterval = null;
let startedAt = 0;
let lastCountdownSecond = -1;
let isExtraWorkout = false;


/* =========================================
   СТАРТ / ВОССТАНОВЛЕНИЕ
   ========================================= */


function startNewWorkout() {
    startWorkoutInternal(false);
}


function startExtraWorkout() {
    startWorkoutInternal(true);
}


function startWorkoutInternal(isExtra) {

    isExtraWorkout = isExtra === true;

    const forceRepeat =
        loadJSON(STORAGE_KEYS.repeatLast, false) === true;

    removeStorage(STORAGE_KEYS.repeatLast);

    let next;

    if (isExtraWorkout) {

        const history = loadJSON(STORAGE_KEYS.history, []);
        const programIndex =
            history.filter(r => !r.isExtra).length;

        const base =
            PROGRAM[programIndex] ||
            PROGRAM[PROGRAM.length - 1];

        if (!base) {
            alert("Программа завершена.");
            return;
        }

        const adapted =
            getNextWorkoutFor(history, false) || base;

        next = {
            ...base,
            reps: adapted.reps || base.reps,
            rest: adapted.rest || base.rest,
            reason: "Дополнительная тренировка"
        };

    } else {

        next = getNextWorkout(forceRepeat);
    }

    if (!next) {
        alert("Программа завершена. Отличная работа!");
        return;
    }

    workout = next;
    currentSet = 0;
    workoutResults = [];
    actualReps = workout.isTest ? 0 : workout.reps;
    restEndsAt = 0;
    remainingSeconds = 0;
    startedAt = Date.now();
    lastCountdownSecond = -1;

    unlockAudio();

    showScreen("screenWorkout");
    renderWorkoutScreen();
    startSet();
}


function continueExistingWorkout() {

    const saved = loadJSON(STORAGE_KEYS.activeWorkout, null);

    if (!saved || !saved.workout) {
        startNewWorkout();
        return;
    }

    workout = saved.workout;
    currentSet = Number(saved.currentSet || 0);
    lastCountdownSecond = -1;
    isExtraWorkout = saved.isExtra === true;

    actualReps = Number(
        saved.actualReps ??
        (workout.isTest ? 0 : workout.reps)
    );

    workoutResults = Array.isArray(saved.workoutResults)
        ? saved.workoutResults
        : [];

    restEndsAt = Number(saved.restEndsAt || 0);
    remainingSeconds = Number(saved.remainingSeconds || 0);
    startedAt = Number(saved.startedAt || Date.now());

    showScreen("screenWorkout");
    renderWorkoutScreen();

    const now = Date.now();

    if (restEndsAt > now) {
        remainingSeconds = Math.max(
            0,
            Math.ceil((restEndsAt - now) / 1000)
        );
        showRestControls();
        updateTimer();
        timerInterval = setInterval(tickRestTimer, 250);
    } else if (restEndsAt > 0) {
        restEndsAt = 0;
        remainingSeconds = 0;
        startSet();
    } else {
        renderSetScreen();
    }
}


/* =========================================
   ЖИЗНЕННЫЙ ЦИКЛ ПОДХОДА
   ========================================= */


function startSet() {

    if (!workout || currentSet >= workout.sets) {
        finishWorkout();
        return;
    }

    clearRestTimer();

    restEndsAt = 0;
    remainingSeconds = 0;
    actualReps = workout.isTest ? 0 : workout.reps;
    lastCountdownSecond = -1;

    renderSetScreen();
    saveActiveWorkout();
}


function completeCurrentSet() {

    const planned = workout.isTest
        ? actualReps
        : workout.reps;

    workoutResults.push({
        set: currentSet + 1,
        planned,
        actual: actualReps,
        isTest: workout.isTest
    });

    currentSet++;

    if (currentSet >= workout.sets) {
        finishWorkout();
        return;
    }

    enterRestPhase();
}


function failCurrentSet() {
    actualReps = 0;
    updateActualReps();
    completeCurrentSet();
}


function decreaseReps() {
    if (actualReps > 0) {
        actualReps--;
        updateActualReps();
        saveActiveWorkout();
    }
}


function increaseReps() {
    actualReps++;
    updateActualReps();
    saveActiveWorkout();
}


/* =========================================
   ОТДЫХ
   ========================================= */


function enterRestPhase() {

    clearRestTimer();

    restEndsAt = Date.now() + workout.rest * 1000;
    remainingSeconds = workout.rest;
    lastCountdownSecond = -1;

    showRestControls();
    updateTimer();
    saveActiveWorkout();

    timerInterval = setInterval(tickRestTimer, 250);
}


function tickRestTimer() {

    if (!restEndsAt) return;

    const left = Math.max(
        0,
        Math.ceil((restEndsAt - Date.now()) / 1000)
    );

    if (left !== remainingSeconds) {
        remainingSeconds = left;
        updateTimer();
        saveActiveWorkout();
        maybeCountdown(left);
    }

    if (left <= 0) {
        endRestPhase();
    }
}


// Последние 5 секунд: бип + вибро + (опционально) речь.
function maybeCountdown(secondsLeft) {

    if (secondsLeft < 1 || secondsLeft > 5) return;
    if (secondsLeft === lastCountdownSecond) return;

    lastCountdownSecond = secondsLeft;

    // Всегда: короткий бип (это работает и в фоне)
    try {
        playTick();
    } catch (e) { /* ignore */ }

    // Вибрация (Android, где поддерживается)
    try {
        if (navigator.vibrate) {
            navigator.vibrate(40);
        }
    } catch (e) { /* ignore */ }

    // Если включено — ещё и голос
    if (settings.voiceCountdown) {
        try {
            speakNumber(secondsLeft);
        } catch (e) { /* ignore */ }
    }
}


function endRestPhase() {

    clearRestTimer();

    restEndsAt = 0;
    remainingSeconds = 0;
    lastCountdownSecond = -1;

    notifyRestFinished();

    startSet();
}


function skipRest() {
    endRestPhase();
}


function addRest() {

    if (!restEndsAt) return;

    restEndsAt += 30 * 1000;

    remainingSeconds = Math.max(
        0,
        Math.ceil((restEndsAt - Date.now()) / 1000)
    );

    updateTimer();
    saveActiveWorkout();
}


function clearRestTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


/* =========================================
   ЗАВЕРШЕНИЕ
   ========================================= */


function finishWorkout() {

    clearRestTimer();

    restEndsAt = 0;
    remainingSeconds = 0;

    const totalActual = workoutResults.reduce(
        (sum, r) => sum + Number(r.actual),
        0
    );

    const totalPlanned = workoutResults.reduce(
        (sum, r) => sum + Number(r.planned),
        0
    );

    const bestThisWorkout = workoutResults.reduce(
        (max, r) => Math.max(max, Number(r.actual)),
        0
    );

    const previousMax = getPreviousMax();

    const isNewRecord =
        bestThisWorkout > previousMax && previousMax > 0;

    const finishedAt = Date.now();

    const workoutRecord = {
        date: new Date(finishedAt).toISOString(),
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,

        week: workout.week,
        day: workout.day,
        grip: workout.grip,
        isTest: workout.isTest,
        isExtra: isExtraWorkout,

        plannedSets: workout.sets,
        plannedReps: workout.reps,

        totalPlanned,
        totalActual,
        bestSet: bestThisWorkout,
        results: workoutResults
    };

    const saved = saveWorkout(workoutRecord);

    removeStorage(STORAGE_KEYS.activeWorkout);

    currentSet = 0;
    workoutResults = [];
    actualReps = 0;
    startedAt = 0;
    workout = null;
    isExtraWorkout = false;

    renderDoneScreen(workoutRecord, saved, isNewRecord);
    showScreen("screenDone");

    setTimeout(checkAchievements, 100);
}


function getPreviousMax() {

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


function saveWorkout(record) {

    try {
        const history = loadJSON(STORAGE_KEYS.history, []);
        history.push(record);
        return saveJSON(STORAGE_KEYS.history, history);
    } catch (error) {
        console.warn("Не удалось сохранить тренировку", error);
        return false;
    }
}


/* =========================================
   АКТИВНАЯ ТРЕНИРОВКА
   ========================================= */


function saveActiveWorkout() {

    const activeWorkout = {
        workout,
        currentSet,
        actualReps,
        workoutResults,
        restEndsAt,
        remainingSeconds,
        startedAt,
        isExtra: isExtraWorkout
    };

    saveJSON(STORAGE_KEYS.activeWorkout, activeWorkout);
}


/* =========================================
   СЛОЖНОСТЬ
   ========================================= */


function setWorkoutDifficulty(level) {

    const history = loadJSON(STORAGE_KEYS.history, []);

    if (history.length === 0) return;

    const last = history[history.length - 1];
    last.difficulty = level;

    saveJSON(STORAGE_KEYS.history, history);

    document
        .querySelectorAll(".difficulty-button")
        .forEach(btn => {
            btn.classList.toggle(
                "selected",
                btn.dataset.level === level
            );
        });
}


/* =========================================
   ЗВУК / ГОЛОС / ВИБРАЦИЯ
   ========================================= */


let audioCtx = null;


function unlockAudio() {

    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;

        if (!audioCtx) {
            audioCtx = new Ctx();
        }

        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
    } catch (error) {
        console.warn("AudioContext недоступен", error);
    }
}


// Короткий "клик" — 1 сек отсчёта.
function playTick() {

    if (!audioCtx) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = 700;

    gain.gain.value = 0.0001;

    osc.connect(gain).connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    osc.start(now);

    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.stop(now + 0.12);
}


// Более длинный сигнал — на "ноль" и по завершении.
function playBeep() {

    if (!audioCtx) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;

    gain.gain.value = 0.0001;

    osc.connect(gain).connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    osc.start(now);

    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.stop(now + 0.35);
}


function speakNumber(n) {

    if (!("speechSynthesis" in window)) return;

    try {
        const u = new SpeechSynthesisUtterance(String(n));
        u.lang = "ru-RU";
        u.rate = 1.15;
        u.volume = 0.9;
        window.speechSynthesis.speak(u);
    } catch (error) {
        console.warn("Голос недоступен", error);
    }
}


function notifyRestFinished() {

    try {
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } catch (error) {
        console.warn("Вибрация недоступна", error);
    }

    try {
        playBeep();
    } catch (error) {
        console.warn("Звук недоступен", error);
    }
}