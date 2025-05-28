import { useThemeColor } from 'components/Themed';
import { StyleSheet } from 'react-native';
import { Image as DefaultImage } from 'react-native';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ImageProps = ThemeProps &
  DefaultImage['props'] & { tinted: boolean };

export function ConditionallyTintedImage(props: ImageProps) {
  const { style, lightColor, darkColor, tinted, ...otherProps } = props;
  const untintedColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'almostBlack'
  );

  const tintedColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'primary'
  );

  return (
    <DefaultImage
      style={[{ tintColor: tinted ? tintedColor : untintedColor }, style]}
      {...otherProps}
    />
  );
}

export function Image(props: DefaultImage['props']) {
  return <DefaultImage {...props} />;
}
