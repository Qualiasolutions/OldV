import { useThemeColor } from 'components/Themed';
import { ColorName } from 'constants/Colors';
import { StyleSheet } from 'react-native';
import { ScrollView as DefaultScrollView } from 'react-native';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ViewProps = ThemeProps & DefaultScrollView['props'];

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%'
  },
  contentContainer: {
    flexGrow: 1
  }
});

function FullPageScrollViewWithColor(
  backgroundColorName: ColorName,
  borderColorName: ColorName
): (props: ViewProps) => JSX.Element {
  return function ColouredScrollView(props: ViewProps) {
    const { style, contentContainerStyle, ...otherProps } = props;
    const backgroundColor = useThemeColor({}, backgroundColorName);
    const borderColor = useThemeColor({}, borderColorName);

    return (
      <DefaultScrollView
        style={[{ backgroundColor, borderColor }, styles.container, style]}
        {...otherProps}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
      />
    );
  };
}

function ScrollViewWithColor(
  backgroundColorName: ColorName,
  borderColorName: ColorName
): (props: ViewProps) => JSX.Element {
  return function ColouredScrollView(props: ViewProps) {
    const { style, ...otherProps } = props;
    const backgroundColor = useThemeColor({}, backgroundColorName);
    const borderColor = useThemeColor({}, borderColorName);

    return (
      <DefaultScrollView
        style={[{ backgroundColor, borderColor }, style]}
        {...otherProps}
        keyboardShouldPersistTaps="handled"
      />
    );
  };
}

export const TransparentScrollView = ScrollViewWithColor(
  'transparent',
  'transparent'
);

export const WhiteScrollView = ScrollViewWithColor('white', 'white');

export const WhiteFullPageScrollView = FullPageScrollViewWithColor(
  'white',
  'grey'
);
export const TransparentFullPageScrollView = FullPageScrollViewWithColor(
  'transparent',
  'grey'
);
