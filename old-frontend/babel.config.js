module.exports = function (api) {
  api.cache(true);

  const rootImportOpts = {
    root: ['./'],
    alias: {
      components: './components',
      constants: './constants',
      utils: './utils',
      reduxStore: './reduxStore',
      screens: './screens',
      navigation: './navigation',
      globalStyles: './globalStyles',
      assets: './assets',
      types: './types',
      hooks: './hooks',
      headers: './headers',
      styles: './styles'
    }
  };

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', rootImportOpts],
      'react-native-reanimated/plugin'
    ]
  };
};
