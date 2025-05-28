import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';
import Splash from './screens/SplashScreen';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { CombinedState } from '@reduxjs/toolkit';
import reducer from './reduxStore/reducers';
import { EntireState } from './reduxStore/types';

import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { RootAction } from 'reduxStore/actions';
import { vuetApi } from 'reduxStore/services/api/api';
import { setupListeners } from '@reduxjs/toolkit/dist/query';
import './i18n/i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { enableFreeze } from 'react-native-screens';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions
} from 'react-native';
import { EventProvider } from 'react-native-outside-press';
import * as Sentry from 'sentry-expo';

import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';

import '@formatjs/intl-displaynames/polyfill';
import '@formatjs/intl-displaynames/locale-data/en'; // locale-data for en

import '@formatjs/intl-listformat/polyfill';
import '@formatjs/intl-listformat/locale-data/en'; // locale-data for en

import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en'; // locale-data for en

import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/en'; // locale-data for en

import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/locale-data/en'; // locale-data for en

import '@formatjs/intl-datetimeformat/polyfill';
import '@formatjs/intl-datetimeformat/locale-data/en'; // locale-data for en
import '@formatjs/intl-datetimeformat/add-all-tz'; // Add ALL tz data
import InnerWrapper from './InnerWrapper';

Sentry.init({
  dsn: 'https://e9f24e9652b93b84a68b4f42955b9062@o4506071647715328.ingest.sentry.io/4506071663443969',
  enableInExpoDevelopment: true,
  debug: true // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

// @ts-ignore
Date.prototype._toLocaleString = Date.prototype.toLocaleString;
// @ts-ignore
Date.prototype.toLocaleString = function (a, b) {
  if (b && Object.keys(b).length === 1 && 'timeZone' in b && a === 'en-US') {
    return (
      Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: b.timeZone
      })
        .format(this)
        .replace(/(\d{2})\/(\d{2})\/(\d{4}),/g, '$3-$1-$2')
        .replace(' ', 'T') + 'Z'
    );
  }
  // @ts-ignore
  return this._toLocaleString(a, b);
};

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: [vuetApi.reducerPath],
  stateReconciler: autoMergeLevel2
};

const pReducer = persistReducer<CombinedState<EntireState>, RootAction>(
  persistConfig,
  reducer as any
);

const store = configureStore({
  reducer: pReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(vuetApi.middleware)
});
const persistor = persistStore(store);

setupListeners(store.dispatch);

enableFreeze();

const styles = StyleSheet.create({
  root: { width: '100%', height: '100%' },
  eventProvider: { flex: 1 }
});

function App() {
  const loadedCachedResources = useCachedResources();
  const colorScheme = useColorScheme();

  const windowHeight = Dimensions.get('window').height;

  if (!loadedCachedResources) {
    return null;
  } else {
    return (
      <Provider store={store}>
        <PersistGate loading={<Splash />} persistor={persistor}>
          <SafeAreaProvider>
            <EventProvider style={styles.eventProvider}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <GestureHandlerRootView style={styles.root}>
                  <InnerWrapper>
                    <Navigation colorScheme={colorScheme} />
                  </InnerWrapper>
                </GestureHandlerRootView>
              </KeyboardAvoidingView>
              <StatusBar translucent={true} />
              <Toast
                position="bottom"
                bottomOffset={windowHeight / 2 - 20}
                visibilityTime={2000}
              />
            </EventProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    );
  }
}

export default Sentry.Native.wrap(App);
