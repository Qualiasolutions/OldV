import DateField from 'react-native-datefield';
import { useThemeColor } from 'components/Themed';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  textInput: {
    borderWidth: 1,
    width: 80,
    padding: 3,
    borderRadius: 10,
    height: 40,
    marginVertical: 5,
    paddingVertical: 5,
    marginRight: 10,
    paddingHorizontal: 15,
    fontFamily: 'Poppins'
  },
  yearInput: {
    flex: 1,
    marginRight: 0
  }
});

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

type DateFieldProps = ThemeProps & DateField['props'];

export function WhiteDateInput(props: DateFieldProps) {
  const {
    lightColor,
    darkColor,
    styleInput,
    styleInputYear,
    containerStyle,
    ...otherProps
  } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'white'
  );

  const textColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'almostBlack'
  );

  const borderColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'grey'
  );

  return (
    <DateField
      containerStyle={[styles.container, containerStyle]}
      styleInputYear={[styles.yearInput, styleInputYear]}
      styleInput={[
        {
          backgroundColor,
          color: textColor,
          borderColor
        },
        styles.textInput,
        styleInput
      ]}
      {...otherProps}
    />
  );
}

export function AlmostWhiteDateInput(props: DateFieldProps) {
  const {
    lightColor,
    darkColor,
    styleInput,
    styleInputYear,
    containerStyle,
    ...otherProps
  } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'almostWhite'
  );

  const textColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'almostBlack'
  );

  const borderColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'grey'
  );

  return (
    <DateField
      containerStyle={[styles.container, containerStyle]}
      styleInputYear={[styles.yearInput, styleInputYear]}
      styleInput={[
        {
          backgroundColor,
          color: textColor,
          borderColor
        },
        styles.textInput,
        styleInput
      ]}
      {...otherProps}
    />
  );
}
