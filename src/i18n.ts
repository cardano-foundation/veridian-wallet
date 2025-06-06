import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Languagedetector from "i18next-browser-languagedetector";
import en from "./locales/en/en.json";
import common from "./locales/en/custom.json";
import termsofuse from "./locales/en/termsofuse.json";
import privacypolicy from "./locales/en/privacypolicy.json";
import aboutssiagentcreate from "./locales/en/aboutssiagentcreate.json";
import aboutssiagentrecovery from "./locales/en/aboutssiagentrecovery.json";

i18n
  .use(initReactI18next)
  .use(Languagedetector)
  .init({
    resources: {
      en: {
        translation: en,
        common: common,
        termsofuse: termsofuse,
        privacypolicy: privacypolicy,
        aboutssiagentcreate: aboutssiagentcreate,
        aboutssiagentrecovery: aboutssiagentrecovery,
      },
    },
    lng: "en",
    fallbackLng: "en",
    ns: [
      "translation",
      "common",
      "termsofuse",
      "privacypolicy",
      "aboutssiagentcreate",
      "aboutssiagentrecovery",
    ],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
  });

export { i18n };
