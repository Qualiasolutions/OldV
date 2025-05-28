import { useThemeColor } from 'components/Themed';
import { PressableProps, StyleSheet, ViewStyle } from 'react-native';
import { elevation } from 'styles/elevation';
import SafePressable from './SafePressable';

const styles = StyleSheet.create({
  box: {
    borderRadius: 16,
    padding: 10,
    borderWidth: 1
  }
});

export default function ElevatedPressableBox({
  style,
  ...props
}: PressableProps & { style?: ViewStyle }) {
  const backgroundColor = useThemeColor({}, 'white');
  const borderColor = useThemeColor({}, 'grey');

  return (
    <SafePressable
      style={({ pressed }) => [
        pressed ? elevation.unelevated : elevation.elevated,
        { backgroundColor, borderColor },
        style,
        styles.box
      ]}
      {...props}
    />
  );
}
