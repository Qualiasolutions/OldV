import { useThemeColor } from 'components/Themed';
import { GestureResponderEvent, StyleSheet } from 'react-native';
import SafePressable from './SafePressable';
import { BlackText } from './TextComponents';
import { TouchableOpacity } from './TouchableOpacityComponents';

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    padding: 15,
    textAlign: 'center',
    alignItems: 'center'
  },
  smallButton: {
    paddingVertical: 5
  },
  linkButton: {
    textAlign: 'center',
    alignItems: 'center'
  }
});

export function Button(props: {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  style?: object;
  disabled?: boolean;
}) {
  const { style, title, disabled, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'buttonDefault');
  const disabledBackgroundColor = useThemeColor({}, 'disabledGrey');
  const textColor = useThemeColor({}, 'buttonTextDefault');
  const color = useThemeColor({}, 'text');

  return (
    <SafePressable
      style={({ pressed }) => [
        {
          backgroundColor:
            disabled || pressed ? disabledBackgroundColor : backgroundColor,
          color
        },
        styles.button,
        style
      ]}
      disabled={disabled}
      {...otherProps}
    >
      <BlackText style={[{ color: textColor }]} text={title} bold={true} />
    </SafePressable>
  );
}

export function LinkButton(props: {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  style?: object;
  disabled?: boolean;
}) {
  const { style, title, disabled, ...otherProps } = props;
  const textColor = useThemeColor({}, 'secondary');

  return (
    <TouchableOpacity
      style={[styles.linkButton, style]}
      disabled={disabled}
      {...otherProps}
    >
      <BlackText style={[{ color: textColor }]} text={title} bold={true} />
    </TouchableOpacity>
  );
}

export function SmallButton(props: {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  style?: object;
  disabled?: boolean;
}) {
  const { style, title, disabled, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'buttonDefault');
  const disabledBackgroundColor = useThemeColor({}, 'disabledGrey');
  const textColor = useThemeColor({}, 'buttonTextDefault');
  const color = useThemeColor({}, 'text');

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: disabled ? disabledBackgroundColor : backgroundColor,
          color
        },
        styles.button,
        styles.smallButton,
        style
      ]}
      disabled={disabled}
      {...otherProps}
    >
      <BlackText style={[{ color: textColor }]} text={title} bold={true} />
    </TouchableOpacity>
  );
}
