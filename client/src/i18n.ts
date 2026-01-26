import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";

const getInitialLanguage = () => {
    const browserLang = navigator.language.split('-')[0];
    return ['en', 'es'].includes(browserLang) ? browserLang : 'es';
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslations },
            es: { translation: esTranslations },
        },
        lng: getInitialLanguage(),
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
        parseMissingKeyHandler: (key: string) => {
            // Safety fallback: admin.fields.user_name -> "User Name"
            const parts = key.split('.');
            const lastPart = parts[parts.length - 1];
            return lastPart
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        }
    });

export default i18n;
