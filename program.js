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
   ПРОПУСКИ И ДНИ БЕЗ ТРЕНИРОВКИ
   ========================================= */


function getLastWorkoutDate() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    if (history.length === 0) return null;

    return new Date(history[history.length - 1].date);
}


// Информация о пропусках и «свежести» последней тренировки.
// Уровни:
//   none   — 0-3 дня, всё ок
//   soft   — 4-6 дней, мягкое напоминание
//   strong — 7-13 дней, сильное + авто-снижение
//   freeze — 14+ дней, заморозка
function getMissedInfo() {

    const empty = {
        level: "none",
        days: 0,
        weeklyTarget: 0,
        weeklyDone: 0,
        weeklyMissed: 0,
        missedPlan: 0
    };

    const last = getLastWorkoutDate();
    if (!last) return empty;

    const daysSince = Math.floor(
        (Date.now() - last.getTime()) / (24 * 60 * 60 * 1000)
    );

    const weeklyTarget = getActiveConfig().daysPerWeek || 3;

    // Выполнено за последние 7 дней (только плановые)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const history = loadJSON(STORAGE_KEYS.history, []);
    const weeklyDone = history.filter(r =>
        !r.isExtra && new Date(r.date).getTime() >= weekAgo
    ).length;

    const weeklyMissed = Math.max(0, weeklyTarget - weeklyDone);

    // Пропущенные плановые дни с последней тренировки
    let missedPlan = 0;

    const trainingDays = Array.isArray(settings.trainingDays)
        ? settings.trainingDays
        : [];

    if (trainingDays.length > 0) {
        // Считаем по конкретным дням недели
        for (let i = 1; i <= daysSince; i++) {
            const d = new Date(last.getTime() + i * 24 * 60 * 60 * 1000);
            const dow = d.getDay() === 0 ? 7 : d.getDay();
            if (trainingDays.includes(dow)) missedPlan++;
        }
    } else {
        // Плавающий интервал
        const interval = 7 / weeklyTarget;
        missedPlan = Math.max(0, Math.floor(daysSince / interval) - 1);
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
        missedPlan
    };
}


// Проверяет, отложен ли баннер на сегодня
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

    const planDone =
        history.filter(r => !r.isExtra).length;

    const extrasCount =
        history.filter(r => r.isExtra).length;

    const planTotal = PROGRAM.length;
    const total = planTotal + extrasCount;
    const completed = planDone + extrasCount;

    return {
        planDone,
        planTotal,
        extrasCount,
        completed,
        total
    };
}


/* =========================================
   ДВИЖОК
   ========================================= */


function getNextWorkoutFor(history, forceRepeatLast) {

    const programIndex =
        history.filter(r => !r.isExtra).length;

    if (forceRepeatLast && programIndex > 0) {

        let last = null;

        for (let i = history.length - 1; i >= 0; i--) {
            if (!history[i].isExtra) {
                last = history[i];
                break;
            }
        }

        if (last) {
            const template = PROGRAM.find(
                p => p.week === last.week &&
                     p.day === last.day &&
                     p.grip === last.grip
            ) || PROGRAM[programIndex - 1];

            if (template) {
                const reps = getEffectiveReps(last) ||
                    last.plannedReps || template.reps;

                return {
                    ...template,
                    reps,
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
        r => r.grip === base.grip && !r.isTest
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

    const recent = sameGrip.slice(-5);

    let recentBest = 0;

    recent.forEach(r => {
        const e = getEffectiveReps(r);
        if (e > recentBest) recentBest = e;
    });

    const anchor = Math.max(
        base.reps,
        prevEffective,
        recentBest > 0 ? recentBest - 1 : 0
    );

    const allDone = prev.results.every(
        r => Number(r.actual) >= Number(r.planned)
    );

    const diff = prev.difficulty || "normal";

    let reps;
    let reason;

    if (diff === "very_hard") {
        reps = anchor - 2;
        reason = "Очень тяжело — сбрасываем нагрузку";
    } else if (!allDone || diff === "hard") {
        reps = anchor - 1;
        reason = allDone
            ? "Было тяжело — закрепляем нагрузку"
            : "Не всё получилось — чуть снижаем";
    } else if (diff === "easy") {
        reps = anchor + 1;
        reason = "Было легко — добавляем повтор";
    } else {
        reps = anchor;
        reason = "Идём на твоём уровне";
    }

    reps = Math.max(3, Math.max(base.reps - 3, reps));

    // Авто-снижение после длинного перерыва
    const missedInfo = getMissedInfo();

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
    const programIndex =
        history.filter(r => !r.isExtra).length;

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