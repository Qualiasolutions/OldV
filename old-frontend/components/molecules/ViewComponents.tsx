import { useThemeColor } from 'components/Themed';
import { StyleSheet } from 'react-native';
import { View as DefaultView } from 'react-native';
import { TransparentFullPageScrollView } from './ScrollViewComponents';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  padded: {
    paddingHorizontal: 23,
    paddingVertical: 10
  },
  box: {
    borderRadius: 16,
    padding: 10,
    borderWidth: 1
  },
  elevated: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { height: 2, width: 2 },
    elevation: 3
  }
});

export type ViewProps = ThemeProps & DefaultView['props'];

export function WhiteContainerView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'white');
  const borderColor = useThemeColor({}, 'grey');

  return (
    <DefaultView
      style={[{ backgroundColor, borderColor }, styles.container, style]}
      {...otherProps}
    />
  );
}

export function AlmostWhiteContainerView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'almostWhite');
  const borderColor = useThemeColor({}, 'grey');

  return (
    <TransparentFullPageScrollView keyboardShouldPersistTaps="handled">
      <DefaultView
        style={[{ backgroundColor, borderColor }, styles.container, style]}
        {...otherProps}
      />
    </TransparentFullPageScrollView>
  );
}

export function TransparentContainerView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'transparent');

  return (
    <DefaultView
      style={[{ backgroundColor }, styles.container, style]}
      {...otherProps}
    />
  );
}

export function WhiteView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'white');
  const borderColor = useThemeColor({}, 'grey');

  return (
    <DefaultView
      style={[{ backgroundColor, borderColor }, style]}
      {...otherProps}
    />
  );
}

export function AlmostWhiteView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'almostWhite');
  const borderColor = useThemeColor({}, 'grey');

  return (
    <DefaultView
      style={[{ backgroundColor, borderColor }, style]}
      {...otherProps}
    />
  );
}

export function PrimaryColouredView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'primary');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function TransparentView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'transparent');
  const borderColor = useThemeColor({}, 'grey');

  return (
    <DefaultView
      style={[{ backgroundColor, borderColor }, style]}
      {...otherProps}
    />
  );
}

export function TransparentPaddedView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'transparent');

  return (
    <TransparentView
      style={[styles.padded, { backgroundColor }, style]}
      {...otherProps}
    />
  );
}

export function WhitePaddedView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'white');
  return (
    <TransparentView
      style={[styles.padded, { backgroundColor }, style]}
      {...otherProps}
    />
  );
}

type BoxProps = ViewProps & { elevated?: boolean };

export function WhiteBox({ elevated = true, ...props }: BoxProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'white'
  );
  const borderColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'grey'
  );

  const elevationStyle = elevated ? styles.elevated : {};

  return (
    <DefaultView
      style={[
        { backgroundColor, borderColor },
        styles.box,
        elevationStyle,
        style
      ]}
      {...otherProps}
    />
  );
}
