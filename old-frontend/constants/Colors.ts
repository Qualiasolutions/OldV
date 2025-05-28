const lightColors = {
  primary: '#AC3201',
  lightYellow: '#D9B67E',
  lightPrimary: '#C9663E',
  secondary: '#3E3647',
  error: '#ff0000',
  tintColor: '#2f95dc',
  almostBlack: '#707070',
  black: '#000',
  white: '#fff',
  almostWhite: '#efefef',
  transparent: 'rgba(0, 0, 0, 0)',
  grey: '#D8D8D8',
  lightGrey: '#E9E9E9',
  mediumGrey: '#686868',
  lightBlack: '#212121',
  offWhite: '#F2F2F2',
  mediumLightGrey: '#9B9B9B',
  disabledGrey: '#CCCCCC',
  green: '#4CB219',
  blue: '#0086DF',
  orange: '#FFA640',
  lightBlue: '#84A0B9',
  overlay: '#2C2C2C'
};

// TODO - dark theme
const darkColors = lightColors;

const colors = {
  light: {
    transparent: lightColors.transparent,
    text: lightColors.black,
    errorText: lightColors.error,
    errorBackground: lightColors.error + 'bb',
    primary: lightColors.primary,
    secondary: lightColors.secondary,
    lightPrimary: lightColors.lightPrimary,
    lightYellow: lightColors.lightYellow,
    black: lightColors.black,
    white: lightColors.white,
    almostBlack: lightColors.almostBlack,
    almostWhite: lightColors.almostWhite,
    grey: lightColors.grey,
    headerText: lightColors.primary,
    subheaderText: lightColors.almostBlack,
    backgroundWhite: lightColors.white,
    backgroundGrey: lightColors.almostWhite,
    buttonDefault: lightColors.secondary,
    buttonTextDefault: lightColors.white,
    tint: lightColors.tintColor,
    tabIconSelected: lightColors.tintColor,
    lightGrey: lightColors.lightGrey,
    lightBlack: lightColors.lightBlack,
    mediumGrey: lightColors.mediumGrey,
    offWhite: lightColors.offWhite,
    mediumLightGrey: lightColors.mediumLightGrey,
    disabledGrey: lightColors.disabledGrey,
    green: lightColors.green,
    blue: lightColors.blue,
    orange: lightColors.orange,
    lightBlue: lightColors.lightBlue,
    overlay: lightColors.overlay
  },
  // TODO - implement different dark mode colors
  dark: {
    transparent: darkColors.transparent,
    text: darkColors.black,
    errorText: darkColors.error,
    errorBackground: darkColors.error + '22',
    primary: darkColors.primary,
    secondary: lightColors.secondary,
    lightPrimary: lightColors.lightPrimary,
    lightYellow: lightColors.lightYellow,
    black: darkColors.black,
    white: darkColors.white,
    almostBlack: darkColors.almostBlack,
    almostWhite: darkColors.almostWhite,
    grey: darkColors.grey,
    headerText: darkColors.primary,
    subheaderText: darkColors.almostBlack,
    backgroundWhite: darkColors.white,
    backgroundGrey: darkColors.almostWhite,
    buttonDefault: darkColors.secondary,
    buttonTextDefault: darkColors.white,
    tint: darkColors.tintColor,
    tabIconSelected: darkColors.tintColor,
    lightGrey: darkColors.lightGrey,
    lightBlack: darkColors.lightBlack,
    mediumGrey: darkColors.mediumGrey,
    offWhite: darkColors.offWhite,
    mediumLightGrey: darkColors.mediumLightGrey,
    disabledGrey: darkColors.disabledGrey,
    green: darkColors.green,
    blue: darkColors.blue,
    orange: darkColors.orange,
    lightBlue: darkColors.lightBlue,
    overlay: darkColors.overlay
  }
};

export const DefaultTheme = {
  dark: true,
  colors: {
    primary: lightColors.primary,
    background: lightColors.almostWhite,
    card: lightColors.white,
    text: lightColors.black,
    border: lightColors.almostBlack,
    notification: lightColors.almostBlack
  }
};

export const DarkTheme = {
  dark: true,
  colors: {
    primary: lightColors.primary,
    background: lightColors.almostWhite,
    card: lightColors.white,
    text: lightColors.black,
    border: lightColors.almostBlack,
    notification: lightColors.almostBlack
  }
};

export type ColorName = keyof typeof colors.light & keyof typeof colors.dark;

export default colors;
