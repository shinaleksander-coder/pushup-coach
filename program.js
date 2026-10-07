/* =========================================
   PROGRAM.JS
   24-недельная программа и движок.
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


/* =========================================
   ТРЕНИРОВОЧНЫЙ ДВИЖОК
   ========================================= */


function getNextWorkout(forceRepeatLast) {

    const history = loadJSON(STORAGE_KEYS.history, []);

    // Если пользователь выбрал «повторить последнюю»
    // и есть история — используем тот же план.
    if (forceRepeatLast && history.length > 0) {

        const last = history[history.length - 1];
        const base = PROGRAM[history.length - 1] || null;

        // Находим ближайший шаблон из программы
        // по неделе/дню — или используем саму запись.
        const template = PROGRAM.find(
            p => p.week === last.week &&
                 p.day === last.day &&
                 p.grip === last.grip
        ) || base;

        if (template) {

            const reps = getEffectiveReps(last) ||
                last.plannedReps || template.reps;

            return {
                ...template,
                reps,
                reason: "Повтор последней тренировки"
            };
        }

        return null;
    }

    const index = history.length;

    if (index >= PROGRAM.length) return null;

    const base = PROGRAM[index];

    if (base.isTest) {
        return { ...base, reason: "Контрольный тест на максимум" };
    }

    if (base.week % 6 === 0) {
        return { ...base, reason: "Разгрузочная неделя" };
    }

    // Все не-тестовые тренировки того же хвата
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

    // Умный отдых: адаптация по прошлой сложности
    let rest = base.rest;

    if (diff === "easy" && allDone) {
        rest = Math.max(60, base.rest - 30);
    } else if (diff === "very_hard") {
        rest = Math.min(180, base.rest + 30);
    }

    return { ...base, reps, rest, reason };
}