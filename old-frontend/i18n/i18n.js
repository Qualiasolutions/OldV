import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import dayjs from 'dayjs';
// Need to import any locales that we want to support
import 'dayjs/locale/es-us';
import 'dayjs/locale/en-gb';

import translationEN from './locales/common/en';
import modelFieldsEN from './locales/modelFields/en';
// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

dayjs.locale(Localization.locale);

const resources = {
  en: {
    translation: translationEN,
    modelFields: modelFieldsEN
  }
};

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  // .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: Localization.locale,
    fallbackLng: 'en',
    debug: true,

    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;
