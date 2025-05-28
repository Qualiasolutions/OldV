const extraData = {
  vuetApiUrl: process.env.REACT_NATIVE_PACKAGER_HOSTNAME
    ? `${process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim()}:8000`
    : process.env.ENV === 'LOCAL'
    ? 'localhost:8000'
    : 'api.vuet.app',
  vuetWebUrl: process.env.REACT_NATIVE_PACKAGER_HOSTNAME
    ? `http://${process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim()}:3000`
    : process.env.ENV === 'LOCAL'
    ? 'http://localhost:3000'
    : 'https://web.vuet.app',
  stripeCustomerPortalUrl:
    'https://billing.stripe.com/p/login/test_eVadQR61H4mC02Q5kk',
  processEnv: process.env.ENV,
  eas: {
    projectId: 'b18c0824-d4d7-4c56-a8f3-def1b1e8117f'
  }
};

export default {
  expo: {
    name: 'Vuet',
    slug: 'vuet-app',
    newArchEnabled: true,
    version: '1.0.7',
    orientation: 'portrait',
    owner: 'vuet',
    icon: './assets/images/logo.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    plugins: [
      'sentry-expo',
      'expo-font',
      'expo-localization',
      'expo-asset',
      'expo-web-browser'
    ],
    splash: {
      image: './assets/images/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/b18c0824-d4d7-4c56-a8f3-def1b1e8117f'
    },
    runtimeVersion: {
      policy: 'sdkVersion'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      buildNumber: '1.0.7',
      bundleIdentifier: 'com.vuet.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/logo.png',
        backgroundColor: '#ffffff'
      },
      versionCode: 0
    },
    web: {
      favicon: './assets/images/favicon.png'
    },
    extra: extraData,
    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps',
          config: {
            organization: 'vuet',
            project: 'vuet-app',
            authToken:
              '9b0b8561dec79d15dede6423679440e1f240401db6b6aab99a2d888dd79c1198'
          }
        }
      ]
    }
  },
  build: {
    dev: {
      channel: 'master',
      env: {
        IOS_BUNDLE_ID: 'vuet-app',
        ANDROID_PACKAGE_NAME: 'vuet-app'
      }
    }
  }
};
