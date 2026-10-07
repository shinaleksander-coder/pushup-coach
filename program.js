/* =========================================
   PROGRAM.JS
   24-недельная программа + умный движок.
   ========================================= */


const PROGRAM_GRIPS = [
    "Обычный",
    "Узкий",
    "Широкий",
    "Ноги выше"
];


function buildProgram() {

    const program = [];

    for (let i = 0; i < 72; i++) {

        const week = Math.floor(i / 3);
        const dayInWeek = i % 3;

        const block = Math.floor(week / 6);
        const weekInBlock = week % 6;

        const isTestWeek = weekInBlock === 5;
        const isTest = isTestWeek && dayInWeek === 0;

        let sets, reps, rest;

        if (isTest) {
            sets = 1;
            reps = 0;
            rest = 180;
        } else if (isTestWeek) {
            sets = 3;
            reps = 5;
            rest = 90;
        } else {
            sets = 3;
            reps = 5 + weekInBlock;
            rest = 90;
        }

        program.push({
            index: i,
            week: week + 1,
            day: dayInWeek + 1,
            grip: PROGRAM_GRIPS[block],
            sets,
            reps,
            rest,
            isTest
        });
    }

    return program;
}


const PROGRAM = buildProgram();


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


// Сколько ПЛАНОВЫХ сессий пройдено.
// Дополнительные (isExtra) не считаются.
function getProgramIndex() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    return history.filter(r => !r.isExtra).length;
}


/* =========================================
   ДВИЖОК
   ========================================= */


// Основная логика. history передаётся явно,
// чтобы её можно было использовать и для симуляции.
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
                    reason: "Повтор последней тренировки"
                };
            }
        }
    }

    if (programIndex >= PROGRAM.length) return null;

    const base = PROGRAM[programIndex];

    if (base.isTest) {
        return { ...base, reason: "Контрольный тест на максимум" };
    }

    if (base.week % 6 === 0) {
        return { ...base, reason: "Разгрузочная неделя" };
    }

    const sameGrip = history.filter(
        r => r.grip === base.grip && !r.isTest
    );

    if (sameGrip.length === 0) {
        return { ...base, reason: "Старт блока" };
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

    let rest = base.rest;

    if (diff === "easy" && allDone) {
        rest = Math.max(60, base.rest - 30);
    } else if (diff === "very_hard") {
        rest = Math.min(180, base.rest + 30);
    }

    return { ...base, reps, rest, reason };
}


function getNextWorkout(forceRepeatLast) {
    const history = loadJSON(STORAGE_KEYS.history, []);
    return getNextWorkoutFor(history, forceRepeatLast);
}


// Прогноз будущих тренировок. Идёт от текущей
// позиции и до конца программы. Для каждой
// тренировки считает оптимальный план
// (предполагая «нормально» и полное выполнение).
function predictFutureWorkouts() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const programIndex =
        history.filter(r => !r.isExtra).length;

    const virtual = [...history];
    const predictions = [];

    const remaining = PROGRAM.length - programIndex;
    const limit = Math.min(remaining, 60);

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

        // Записываем «идеальную» тренировку
        // в виртуальную историю
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