import { useThemeColor } from 'components/Themed';
import { ColorName } from 'constants/Colors';
import { ActivityIndicator, ViewStyle } from 'react-native';
import {
  TransparentContainerView,
  TransparentPaddedView
} from './ViewComponents';

export type SpinnerProps = {
  spinnerColor?: ColorName;
  style?: ViewStyle;
};
export function PaddedSpinner({
  spinnerColor = 'primary',
  style = {}
}: SpinnerProps) {
  return (
    <TransparentPaddedView style={style}>
      <ActivityIndicator color={useThemeColor({}, spinnerColor)} size="large" />
    </TransparentPaddedView>
  );
}

export function SmallSpinner({
  spinnerColor = 'primary',
  style = {}
}: SpinnerProps) {
  return (
    <ActivityIndicator
      color={useThemeColor({}, spinnerColor)}
      size="small"
      style={style}
    />
  );
}

export function FullPageSpinner({
  spinnerColor = 'primary',
  style = {}
}: SpinnerProps) {
  return (
    <TransparentContainerView style={style}>
      <ActivityIndicator color={useThemeColor({}, spinnerColor)} size="large" />
    </TransparentContainerView>
  );
}
