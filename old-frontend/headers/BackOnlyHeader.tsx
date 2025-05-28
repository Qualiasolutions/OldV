import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import {
  TransparentView,
  WhiteView
} from 'components/molecules/ViewComponents';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, ViewStyle } from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { useThemeColor } from 'components/Themed';

const styles = StyleSheet.create({
  container: {
    padding: 0,
    paddingLeft: 20,
    paddingRight: 40,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  safeAreaContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  flexShrink: { flexShrink: 1 }
});
export default function BackOnlyHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps
) {
  const navigationState = props.navigation.getState();
  const primaryColor = useThemeColor({}, 'primary');

  if (navigationState.index === 0) {
    return null;
  }

  return (
    <TransparentView style={[styles.container]}>
      <TransparentView style={styles.flexShrink}>
        <HeaderBackButton
          tintColor={props.options.headerTintColor || primaryColor}
          onPress={props.navigation.goBack}
        />
      </TransparentView>
    </TransparentView>
  );
}

function BackOnlyHeaderWithSafeAreaBase({
  style,
  headerRight,
  ...otherProps
}: (NativeStackHeaderProps | BottomTabHeaderProps) & {
  style?: ViewStyle;
  headerRight?: JSX.Element;
}) {
  // This causes the error
  // "Warning: React has detected a change in the order of Hooks called by BottomTabView"
  const statusBarHeight = getStatusBarHeight();
  const navigationState = otherProps.navigation.getState();
  const primaryColor = useThemeColor({}, 'primary');

  if (navigationState.index === 0) {
    return null;
  }

  return (
    <WhiteView style={[style, { marginTop: statusBarHeight }]}>
      <TransparentView style={[styles.flexShrink, styles.content]}>
        <HeaderBackButton
          tintColor={otherProps.options.headerTintColor || primaryColor}
          onPress={otherProps.navigation.goBack}
        />
        {headerRight || null}
      </TransparentView>
    </WhiteView>
  );
}

export function BackOnlyHeaderWithSafeArea({
  headerRight,
  ...props
}: (NativeStackHeaderProps | BottomTabHeaderProps) & {
  headerRight?: JSX.Element;
}) {
  return (
    <BackOnlyHeaderWithSafeAreaBase
      {...props}
      style={StyleSheet.flatten([styles.container, styles.safeAreaContainer])}
      headerRight={headerRight}
    />
  );
}

export function AlmostWhiteBackOnlyHeaderWithSafeArea({
  headerRight,
  ...props
}: (NativeStackHeaderProps | BottomTabHeaderProps) & {
  headerRight?: JSX.Element;
}) {
  const almostWhite = useThemeColor({}, 'almostWhite');
  return (
    <BackOnlyHeaderWithSafeAreaBase
      {...props}
      style={StyleSheet.flatten([
        styles.container,
        {
          backgroundColor: almostWhite
        }
      ])}
      headerRight={headerRight}
    />
  );
}
