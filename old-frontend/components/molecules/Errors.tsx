import { Text, useThemeColor } from 'components/Themed';
import { StyleSheet, TextStyle } from 'react-native';
import { View as DefaultView } from 'react-native';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ViewProps = ThemeProps & DefaultView['props'];

export function ErrorBox(
  props: ViewProps & { errorText: string; textStyle?: TextStyle }
) {
  const { style, textStyle, errorText, lightColor, darkColor, ...otherProps } =
    props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'errorBackground'
  );

  const textColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'errorText'
  );

  const styles = StyleSheet.create({
    errorBox: {
      paddingVertical: 10,
      margin: 10,
      paddingHorizontal: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: textColor
    }
  });

  return (
    <DefaultView
      style={[{ backgroundColor }, styles.errorBox, style]}
      {...otherProps}
    >
      <Text style={[{ color: textColor }, textStyle]}>{errorText}</Text>
    </DefaultView>
  );
}
