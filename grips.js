/* =========================================
   GRIPS.JS
   SVG-схемы хватов и пояснения.
   ========================================= */


const GRIP_DATA = {

    "Обычный": {
        description:
            "Руки на ширине плеч. Классическая постановка — база для всех остальных хватов. Основная нагрузка ложится на грудные мышцы и трицепс.",
        svg: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="38" r="16" fill="currentColor"/>
                <rect x="88" y="54" width="24" height="80" rx="12" fill="currentColor"/>
                <path d="M 90 70 L 55 105" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 110 70 L 145 105" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 93 134 L 88 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 107 134 L 112 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
            </svg>
        `
    },

    "Узкий": {
        description:
            "Руки уже ширины плеч, кисти почти под центром груди. Больше нагрузки уходит на трицепс, меньше — на грудные. Тяжелее обычного.",
        svg: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="38" r="16" fill="currentColor"/>
                <rect x="88" y="54" width="24" height="80" rx="12" fill="currentColor"/>
                <path d="M 90 70 L 82 108" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 110 70 L 118 108" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 93 134 L 88 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 107 134 L 112 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
            </svg>
        `
    },

    "Широкий": {
        description:
            "Руки шире плеч. Основная нагрузка — на внешнюю часть грудных мышц. Плечи работают активнее, поэтому важен контроль техники.",
        svg: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="38" r="16" fill="currentColor"/>
                <rect x="88" y="54" width="24" height="80" rx="12" fill="currentColor"/>
                <path d="M 90 70 L 35 100" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 110 70 L 165 100" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 93 134 L 88 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 107 134 L 112 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
            </svg>
        `
    },

    "Ноги выше": {
        description:
            "Стопы на возвышении (стул, диван, ступенька). Тело под наклоном. Основная нагрузка уходит на верхнюю часть грудных мышц и плечи.",
        svg: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="38" r="16" fill="currentColor"/>
                <rect x="88" y="54" width="24" height="80" rx="12" fill="currentColor"/>
                <path d="M 90 70 L 55 105" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 110 70 L 145 105" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 93 134 L 88 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <path d="M 107 134 L 112 178" stroke="currentColor" stroke-width="9" stroke-linecap="round" fill="none"/>
                <rect x="60" y="158" width="80" height="14" rx="4" fill="currentColor" opacity="0.3"/>
                <text x="148" y="172" font-size="18" font-weight="700" fill="currentColor">↑</text>
            </svg>
        `
    }

};


function getGripSVG(grip) {

    const data = GRIP_DATA[grip];

    if (!data) {
        return GRIP_DATA["Обычный"].svg;
    }

    return data.svg;
}


function getGripDescription(grip) {

    const data = GRIP_DATA[grip];

    if (!data) {
        return GRIP_DATA["Обычный"].description;
    }

    return data.description;
}