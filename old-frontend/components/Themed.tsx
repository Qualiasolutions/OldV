/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {
  Text as DefaultText,
  View as DefaultView,
  TextInput as DefaultTextInput,
  StyleSheet
} from 'react-native';
import {
  TransparentView,
} from 'components/molecules/ViewComponents';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import Colors, { ColorName } from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Poppins'
  },
  textBold: {
    fontFamily: 'Poppins-Bold'
  },
  textInput: {
    borderRadius: 10,
    minHeight: 40,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    fontFamily: 'Poppins'
  }
});

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'] & { bold?: boolean };
export type ViewProps = ThemeProps & DefaultView['props'];
export type TextInputProps = ThemeProps & DefaultTextInput['props'];

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, bold, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <DefaultText
      style={[{ color }, styles.text, bold ? styles.textBold : {}, style]}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'backgroundWhite'
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function TextInput(props: TextInputProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'backgroundWhite'
  );
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const placeholderTextColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'mediumGrey'
  );

  return (
    <DefaultTextInput
      style={[
        {
          backgroundColor,
          color
        },
        styles.textInput,
        style || {}
      ]}
      {...otherProps}
      placeholderTextColor={placeholderTextColor}
    />
  );
}


export function PasswordInput(props: TextInputProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'backgroundWhite'
  );
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const placeholderTextColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'mediumGrey'
  );

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  return (
    <TransparentView style={style}>
      <DefaultTextInput
        style={[
          {
            backgroundColor,
            color
          },
          styles.textInput,
          style || {borderWidth: 0}
        ]}
        {...otherProps}
        secureTextEntry={!isPasswordVisible}
        placeholderTextColor={placeholderTextColor}
      />
      <MaterialCommunityIcons
        name={isPasswordVisible ? 'eye-off' : 'eye'}
        size={24}
        color={color}
        style={{ position: 'absolute', right: 10, top: 10}}
        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
      />
    </TransparentView>
  );
}
