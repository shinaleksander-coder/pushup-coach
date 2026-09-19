/* =========================================
   APP.JS
   Точка входа: обработчики кнопок и запуск.
   ========================================= */


document.getElementById("startWorkout")
    .addEventListener("click", startNewWorkout);

document.getElementById("continueWorkout")
    .addEventListener("click", continueExistingWorkout);

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

document.getElementById("historyBack")
    .addEventListener("click", goHome);

document.getElementById("programButton")
    .addEventListener("click", showProgram);

document.getElementById("programBack")
    .addEventListener("click", goHome);

document.getElementById("progressButton")
    .addEventListener("click", showProgress);

document.getElementById("progressBack")
    .addEventListener("click", goHome);

document.getElementById("settingsButton")
    .addEventListener("click", showSettings);

document.getElementById("settingsBack")
    .addEventListener("click", goHome);

document.getElementById("saveSettings")
    .addEventListener("click", saveSettings);

document.getElementById("resetProgress")
    .addEventListener("click", resetProgress);


/* =========================================
   СЛОЖНОСТЬ ТРЕНИРОВКИ
   ========================================= */


document
    .querySelectorAll(".difficulty-button")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            setWorkoutDifficulty(btn.dataset.level);
        });
    });


/* =========================================
   УСТАНОВКА ПРИЛОЖЕНИЯ (PWA)
   ========================================= */


let deferredInstallPrompt = null;


const installButton =
    document.getElementById("installApp");


window.addEventListener("beforeinstallprompt", event => {

    event.preventDefault();

    deferredInstallPrompt = event;

    if (installButton) {
        installButton.classList.remove("hidden");
    }
});


if (installButton) {

    installButton.addEventListener("click", async () => {

        if (!deferredInstallPrompt) return;

        deferredInstallPrompt.prompt();

        const choice =
            await deferredInstallPrompt.userChoice;

        if (choice.outcome === "accepted") {
            installButton.classList.add("hidden");
        }

        deferredInstallPrompt = null;
    });
}


window.addEventListener("appinstalled", () => {

    deferredInstallPrompt = null;

    if (installButton) {
        installButton.classList.add("hidden");
    }
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


ensureWeightHistory();
renderHome();
showScreen("screenHome");

console.log("Push-Up Coach v0.6 запущен");