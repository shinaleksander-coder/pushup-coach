/* =========================================
   PROGRAM.JS
   24-недельная программа.
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
   ТРЕНИРОВОЧНЫЙ ДВИЖОК
   ========================================= */


function getNextWorkout() {

    const history = loadJSON(STORAGE_KEYS.history, []);
    const index = history.length;

    if (index >= PROGRAM.length) return null;

    const base = PROGRAM[index];

    if (base.isTest) {
        return { ...base, reason: "Контрольный тест на максимум" };
    }

    // Разгрузочная неделя (6-я в блоке) — движок не применяем
    if (base.week % 6 === 0) {
        return { ...base, reason: "Разгрузочная неделя" };
    }

    // Последняя НЕтестовая тренировка с тем же хватом
    let previous = null;
    for (let i = history.length - 1; i >= 0; i--) {
        const r = history[i];
        if (r.grip === base.grip && !r.isTest) {
            previous = r;
            break;
        }
    }

    if (!previous) {
        return { ...base, reason: "Старт блока" };
    }

    const allDone = previous.results.every(
        r => Number(r.actual) >= Number(r.planned)
    );

    const diff = previous.difficulty || "normal";

    // Якорь — план прошлой тренировки
    const anchor = Number(previous.plannedReps) || base.reps;

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
        // normal: следуем программе, но не теряем набранное
        reps = Math.max(base.reps, anchor);
        reason = "Нормально — идём по программе";
    }

    // Коридор от базы: −3 .. +5
    reps = Math.max(base.reps - 3, Math.min(base.reps + 5, reps));
    reps = Math.max(3, reps);

    return { ...base, reps, reason };
}