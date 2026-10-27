/* =========================================
   PROGRAM.JS
   ========================================= */


const PROGRAM_GRIPS = [
    "Обычный",
    "Узкий",
    "Широкий",
    "Ноги выше"
];


const BLOCK_WEEKS = 6;


const PROGRAM_MODES = {

    base: {
        weeks: 24,
        daysPerWeek: 3,
        sets: 3,
        repBase: 5,
        repGrowth: 1,
        repCeil: 9,
        rest: 90
    },

    strength: {
        weeks: 24,
        daysPerWeek: 3,
        sets: 4,
        repBase: 6,
        repGrowth: 1,
        repCeil: 11,
        rest: 90
    }

};


function buildProgram(config) {

    const weeks = config.weeks || 24;
    const daysPerWeek = config.daysPerWeek || 3;
    const sets = config.sets || 3;
    const repBase = config.repBase || 5;
    const repGrowth =
        config.repGrowth !== undefined ? config.repGrowth : 1;
    const repCeil = config.repCeil || repBase + 6;
    const rest = config.rest || 90;

    const program = [];
    const total = weeks * daysPerWeek;

    for (let i = 0; i < total; i++) {

        const week = Math.floor(i / daysPerWeek);
        const dayInWeek = i % daysPerWeek;

        const block = Math.floor(week / BLOCK_WEEKS);
        const weekInBlock = week % BLOCK_WEEKS;

        const isTestWeek = weekInBlock === BLOCK_WEEKS - 1;
        const isTest = isTestWeek && dayInWeek === 0;

        let s = sets;
        let r;
        let rt = rest;

        if (isTest) {
            s = 1;
            r = 0;
            rt = 180;
        } else if (isTestWeek) {
            s = sets;
            r = repBase;
            rt = rest;
        } else {
            s = sets;
            r = Math.min(
                repCeil,
                repBase + weekInBlock * repGrowth
            );
        }

        const grip =
            PROGRAM_GRIPS[block % PROGRAM_GRIPS.length];

        program.push({
            index: i,
            week: week + 1,
            day: dayInWeek + 1,
            grip,
            sets: s,
            reps: r,
            rest: rt,
            isTest
        });
    }

    return program;
}


function getActiveConfig() {

    const mode = settings.programMode || "base";

    if (mode === "custom") {

        const sets = clamp(settings.customSets, 2, 6, 3);
        const repBase = clamp(settings.customRepBase, 3, 20, 5);
        const growth = clamp(settings.customGrowth, 0, 2, 1);
        const days = clamp(settings.customDays, 2, 7, 3);

        return {
            weeks: 24,
            daysPerWeek: days,
            sets: sets,
            repBase: repBase,
            repGrowth: growth,
            repCeil: Math.min(25, repBase + 6),
            rest: 90
        };
    }

    return PROGRAM_MODES[mode] || PROGRAM_MODES.base;
}


function clamp(value, min, max, fallback) {

    const n = Number(value);

    if (!Number.isFinite(n)) return fallback;

    return Math.max(min, Math.min(max, Math.round(n)));
}


let PROGRAM = buildProgram(getActiveConfig());


function rebuildProgram() {
    PROGRAM = buildProgram(getActiveConfig());
}


/* =========================================
   ФИЛЬТРАЦИЯ ИСТОРИИ
   ========================================= */


// Только плановые тренировки (не допы, не тесты, не отдых)
function getPlanRecords(history) {
    return history.filter(r => !r.isExtra && !r.isTest && !r.isRest);
}


function getExtraRecords(history) {
    return history.filter(r => r.isExtra === true);
}


function getRestRecords(history) {
    return history.filter(r => r.isRest === true);
}


/* =========================================
   УТИЛИТЫ
   ========================================= */


function getEffectiveReps(record) {

    if (!record || !Array.isArray(record.results) ||
        record.results.length === 0) {
        return 0;
    }

    const sum = record.results.reduce(
        (acc, r) => acc + Number(r.actual),
        0
    );

    return Math.round(sum / record.results.length);
}


function applyRestOverride(rest) {
    if (settings.restOverride !== null &&
        settings.restOverride !== undefined) {
        return settings.restOverride;
    }
    return rest;
}


/* =========================================
   НАГРУЗКА / ПЕРЕТРЕНИРОВАННОСТЬ
   ========================================= */


function getTrainingLoad() {

    const history = loadJSON(STORAGE_KEYS.history, []);

    const thisWeek = history.filter(r => {
        if (r.isRest) return false;
        return isDateInCurrentWeek(r.date);
    });

    const total = thisWeek.length;
    const hard = thisWeek.filter(r =>
        r.difficulty === "hard" || r.difficulty === "very_hard"
    ).length;

    let level = "ok";
    if (total >= 6 && hard >= 3) level = "critical";
    else if (total >= 5 && hard >= 2) level = "warning";

    return { total, hard, level };
}

/* =========================================
   НЕДЕЛИ ПН–ВС
   ========================================= */


// Возвращает ключ "YYYY-MM-DD" понедельника недели,
// в которую попадает дата. Работает по локальному времени.
function getWeekStartKey(dateInput) {

    const d = new Date(dateInput);
    const t = d.getTime();
    if (!Number.isFinite(t)) return null;

    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Форматируем в ЛОКАЛЬНОМ времени,
    // а не через toISOString (он переводит в UTC и сдвигает)
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const dd = String(monday.getDate()).padStart(2, "0");

    return `${y}-${m}-${dd}`;
}

// Проверяет, попадает ли дата в текущую календарную неделю (Пн–Вс)
function isDateInCurrentWeek(dateInput) {
    const key = getWeekStartKey(dateInput);
    if (!key) return false;
    return key === getWeekStartKey(new Date());
}


// Карта: ключ понедельника → суммарный объём за неделю
function buildWeeklyVolumeMap(history) {

    const map = {};

    history.forEach(record => {
        if (record.isRest) return;

        const key = getWeekStartKey(record.date);
        if (!key) return;

        const total = Number(record.totalActual) || 0;
        if (!map[key]) map[key] = 0;
        map[key] += total;
    });

    return map;
}


/* =========================================
   ДОП. ТРЕНИРОВКА — ПРОВЕРКА
   ========================================= */


function canDoExtra() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const daysPerWeek = getActiveConfig().daysPerWeek || 3;

    const planRecords = getPlanRecords(history);

    // Сколько допов на текущей календарной неделе (Пн–Вс)
    const extrasThisWeek = getExtraRecords(history).filter(r =>
        isDateInCurrentWeek(r.date)
    ).length;

    // Жёсткий лимит — 3 допа на неделе
    if (extrasThisWeek >= 3) {
        return {
            allowed: false,
            reason:
                "Уже 3 дополнительные тренировки на этой неделе. " +
                "Дальше — только во вред."
        };
    }

    // Сколько плановых уже сделано на этой неделе
    const doneThisWeek = planRecords.filter(r =>
        isDateInCurrentWeek(r.date)
    ).length;

    if (doneThisWeek < daysPerWeek) {
        return {
            allowed: true,
            warning:
                `На этой неделе не закрыто плановых: ` +
                `${daysPerWeek - doneThisWeek} из ${daysPerWeek}. ` +
                `Дополнительная тренировка может помешать восстановлению.`
        };
    }

    // Мягкое предупреждение — объём недели выше среднего
    // по последним 4 календарным неделям
    const currentWeekVolume = history
        .filter(r => !r.isRest && isDateInCurrentWeek(r.date))
        .reduce((sum, r) =>
            sum + (Number(r.totalActual) || 0), 0);

    const last4 = [];
    const now = new Date();

    for (let i = 1; i <= 4; i++) {

        const weekDate = new Date(
            now.getTime() - i * 7 * 24 * 60 * 60 * 1000
        );
        const weekKey = getWeekStartKey(weekDate);

        let vol = 0;

        history.forEach(r => {
            if (r.isRest) return;
            if (getWeekStartKey(r.date) === weekKey) {
                vol += Number(r.totalActual) || 0;
            }
        });

        if (vol > 0) last4.push(vol);
    }

    let warning = null;

    if (last4.length >= 2) {
        const avg = last4.reduce((a, b) => a + b, 0) / last4.length;

        if (currentWeekVolume > avg * 1.4) {
            warning =
                "Объём недели уже на 40% выше среднего. " +
                "Восстановление может не успеть.";
        }
    }

    return { allowed: true, warning };
}


/* =========================================
   ЗАПИСЬ ОТДЫХА
   ========================================= */


function addRestDay(reason) {

    const history = loadJSON(STORAGE_KEYS.history, []);

    history.push({
        date: new Date().toISOString(),
        isRest: true,
        reason: reason || "Отдых по плану"
    });

    saveJSON(STORAGE_KEYS.history, history);
}


/* =========================================
   ПРОПУСКИ И ДНИ БЕЗ ТРЕНИРОВКИ
   ========================================= */


function getLastWorkoutDateFor(history) {

    if (!Array.isArray(history) || history.length === 0) return null;

    // Ищем последнюю настоящую тренировку (не отдых)
    for (let i = history.length - 1; i >= 0; i--) {
        if (!history[i].isRest) {
            return new Date(history[i].date);
        }
    }

    return null;
}


function getLastWorkoutDate() {
    const history = loadJSON(STORAGE_KEYS.history, []);
    return getLastWorkoutDateFor(history);
}


function getMissedInfoFor(history, referenceTime) {

    const empty = {
        level: "none",
        days: 0,
        weeklyTarget: 0,
        weeklyDone: 0,
        weeklyMissed: 0,
        missedPlan: 0,
        byExactDays: false
    };

    const last = getLastWorkoutDateFor(history);
    if (!last) return empty;

    const now = referenceTime !== undefined
        ? referenceTime
        : Date.now();

    const daysSince = Math.floor(
        (now - last.getTime()) / (24 * 60 * 60 * 1000)
    );

    const weeklyTarget = getActiveConfig().daysPerWeek || 3;


        const weeklyDone = getPlanRecords(history).filter(r =>
        isDateInCurrentWeek(r.date)
    ).length;

    const weeklyMissed = Math.max(0, weeklyTarget - weeklyDone);

    const trainingDays = Array.isArray(settings.trainingDays)
        ? settings.trainingDays
        : [];

    const useExactDays =
        trainingDays.length > 0 &&
        trainingDays.length === weeklyTarget;

    let missedPlan = 0;

    if (useExactDays) {

        for (let i = 1; i <= daysSince; i++) {
            const d = new Date(
                last.getTime() + i * 24 * 60 * 60 * 1000
            );
            const dow = d.getDay() === 0 ? 7 : d.getDay();
            if (trainingDays.includes(dow)) missedPlan++;
        }

    } else {
        const interval = 7 / weeklyTarget;
        missedPlan = Math.max(
            0,
            Math.floor(daysSince / interval) - 1
        );
    }

    let level = "none";
    if (daysSince >= 14) level = "freeze";
    else if (daysSince >= 7) level = "strong";
    else if (daysSince >= 4) level = "soft";

    return {
        level,
        days: daysSince,
        weeklyTarget,
        weeklyDone,
        weeklyMissed,
        missedPlan,
        byExactDays: useExactDays
    };
}

function getMissedInfo() {
    const history = loadJSON(STORAGE_KEYS.history, []);
    return getMissedInfoFor(history);
}

function isBannerSkippedToday() {

    const skipDate = loadJSON(STORAGE_KEYS.skipBannerDate, null);
    if (!skipDate) return false;

    const today = new Date().toISOString().slice(0, 10);
    return skipDate === today;
}


function skipBannerForToday() {
    const today = new Date().toISOString().slice(0, 10);
    saveJSON(STORAGE_KEYS.skipBannerDate, today);
}


/* =========================================
   СТАТИСТИКА
   ========================================= */


function getProgramStats() {

    const history = loadJSON(STORAGE_KEYS.history, []);

    const planDone = getPlanRecords(history).length;
    const extrasCount = getExtraRecords(history).length;
    const restsCount = getRestRecords(history).length;

    const planTotal = PROGRAM.length;
    const total = planTotal + extrasCount;
    const completed = planDone + extrasCount;

    return {
        planDone,
        planTotal,
        extrasCount,
        restsCount,
        completed,
        total
    };
}


/* =========================================
   ДВИЖОК
   ========================================= */


function getNextWorkoutFor(history, forceRepeatLast, referenceTime) {

    const planRecords = getPlanRecords(history);
    const programIndex = planRecords.length;

    if (forceRepeatLast && programIndex > 0) {

        const last = planRecords[programIndex - 1];

        if (last) {
            const template = PROGRAM.find(
                p => p.week === last.week &&
                     p.day === last.day &&
                     p.grip === last.grip
            ) || PROGRAM[programIndex - 1];

            if (template) {

                const prevPlanned =
                    Number(last.plannedReps) || template.reps;
                const prevEffective = getEffectiveReps(last);

                const anchor = Math.min(
                    prevPlanned + 1,
                    Math.max(prevPlanned, prevEffective)
                );

                return {
                    ...template,
                    reps: Math.max(3, anchor),
                    rest: applyRestOverride(template.rest),
                    reason: "Повтор последней тренировки"
                };
            }
        }
    }

    if (programIndex >= PROGRAM.length) return null;

    const base = PROGRAM[programIndex];

    if (base.isTest) {
        return {
            ...base,
            rest: applyRestOverride(base.rest),
            reason: "Контрольный тест на максимум"
        };
    }

    if (base.week % 6 === 0) {
        return {
            ...base,
            rest: applyRestOverride(base.rest),
            reason: "Разгрузочная неделя"
        };
    }

    const sameGrip = history.filter(
        r => r.grip === base.grip &&
             !r.isTest &&
             !r.isRest &&
             !r.isExtra
    );

    if (sameGrip.length === 0) {
        return {
            ...base,
            rest: applyRestOverride(base.rest),
            reason: "Старт блока"
        };
    }

    const prev = sameGrip[sameGrip.length - 1];

    const prevEffective = getEffectiveReps(prev);

    const prevPlanned =
        Number(prev.plannedReps) || base.reps;

    // Якорь: не выше плана прошлой + 1, не ниже плана прошлой
    const anchorCapped = Math.min(
        prevPlanned + 1,
        Math.max(prevPlanned, prevEffective)
    );

    // Также не ниже базы программы
    const anchor = Math.max(base.reps, anchorCapped);

    const allDone = prev.results.every(
        r => Number(r.actual) >= Number(r.planned)
    );

    const diff = prev.difficulty || "normal";

    let reps;
    let reason;

    if (diff === "very_hard") {
        reps = anchor - 2;
        reason = "Очень тяжело — сбрасываем нагрузку";
    } else if (diff === "hard") {
        reps = anchor;
        reason = "Тяжело — рост на паузе";
    } else if (!allDone) {
        reps = anchor;
        reason = "Не всё получилось — закрепляем";
    } else if (diff === "easy") {
        reps = anchor + 1;
        reason = "Легко — добавляем повтор";
    } else {
        // normal
        if (settings.aggressiveProgression) {

            const last2 = sameGrip.slice(-2);
            const twoNormals = last2.length === 2 &&
                last2.every(r => r.difficulty === "normal");

            if (twoNormals) {
                reps = anchor + 1;
                reason = "Два раза нормально — добавляем повтор";
            } else {
                reps = anchor;
                reason = "Нормально — оставляем как есть";
            }
        } else {
            reps = anchor;
            reason = "Нормально — оставляем как есть";
        }
    }

    reps = Math.max(3, reps);

    // После перерыва — считаем от переданной истории,
    // чтобы работало и для реального движка, и для прогноза
    const missedInfo = getMissedInfoFor(history, referenceTime);

    if (missedInfo.level === "strong") {
        reps = Math.max(3, reps - 1);
        reason = "После перерыва — входим мягко";
    } else if (missedInfo.level === "freeze") {
        reps = Math.max(3, reps - 2);
        reason = "Долгий перерыв — снижаем нагрузку";
    }

    let rest = base.rest;

    if (diff === "easy" && allDone) {
        rest = Math.max(60, base.rest - 30);
    } else if (diff === "very_hard") {
        rest = Math.min(180, base.rest + 30);
    }

    return {
        ...base,
        reps,
        rest: applyRestOverride(rest),
        reason
    };
}


function getNextWorkout(forceRepeatLast) {
    const history = loadJSON(STORAGE_KEYS.history, []);
    return getNextWorkoutFor(history, forceRepeatLast);
}


function predictFutureWorkouts() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const planRecords = getPlanRecords(history);
    const programIndex = planRecords.length;

    const virtual = [...history];
    const predictions = [];

    const remaining = PROGRAM.length - programIndex;
    const limit = Math.min(remaining, 100);

    for (let i = 0; i < limit; i++) {

        const next = getNextWorkoutFor(virtual, false);
        if (!next) break;

        predictions.push({
            index: programIndex + i,
            week: next.week,
            day: next.day,
            grip: next.grip,
            sets: next.sets,
            reps: next.reps,
            rest: next.rest,
            isTest: next.isTest
        });

        virtual.push({
            week: next.week,
            day: next.day,
            grip: next.grip,
            plannedReps: next.reps,
            plannedSets: next.sets,
            totalActual: next.reps * next.sets,
            totalPlanned: next.reps * next.sets,
            results: Array(next.sets).fill(0).map((_, idx) => ({
                set: idx + 1,
                planned: next.reps,
                actual: next.reps
            })),
            difficulty: "normal",
            isTest: next.isTest
        });
    }

    return predictions;
}