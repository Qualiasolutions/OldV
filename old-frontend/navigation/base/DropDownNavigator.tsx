import {
  createNavigatorFactory,
  ParamListBase,
  TabActions,
  TabRouter,
  useNavigationBuilder
} from '@react-navigation/native';
import {
  NativeStackNavigationOptions,
  NativeStackNavigatorProps
} from '@react-navigation/native-stack/lib/typescript/src/types';
import DropDown from 'components/forms/components/DropDown';
import {
  TransparentView,
  WhitePaddedView
} from 'components/molecules/ViewComponents';
import { t } from 'i18next';
import { StyleSheet } from 'react-native';
import { elevation } from 'styles/elevation';

type NavigatorOptions = NativeStackNavigationOptions & {
  dropDownId: string;
};

const styles = StyleSheet.create({
  header: { zIndex: 10, flexDirection: 'row' },
  dropDownWrapper: { flex: 1, marginHorizontal: 2 },
  dropDown: {},
  screenContainer: { flex: 1 }
});
export function DropDownNavigator({
  initialRouteName,
  children,
  screenOptions
}: NativeStackNavigatorProps) {
  const { state, navigation, descriptors, NavigationContent } =
    useNavigationBuilder(TabRouter, {
      children,
      screenOptions,
      initialRouteName
    });

  const routesByDropdownId: {
    [key: string]: { key: string; name: string }[];
  } = {};
  for (const route of state.routes) {
    const descriptor = descriptors[route.key];
    if (
      !routesByDropdownId[(descriptor.options as NavigatorOptions).dropDownId]
    ) {
      routesByDropdownId[
        (descriptor.options as NavigatorOptions).dropDownId as string
      ] = [];
    }
    routesByDropdownId[
      (descriptor.options as NavigatorOptions).dropDownId as string
    ].push(route);
  }

  return (
    <NavigationContent>
      <WhitePaddedView style={[styles.header, elevation.elevated]}>
        {Object.entries(routesByDropdownId).map(([dropDownId, routes]) => (
          <TransparentView style={styles.dropDownWrapper} key={dropDownId}>
            <DropDown
              listMode="MODAL"
              dropdownPlaceholder={t(
                `navigation.dropdown.placeholders.${dropDownId}`
              )}
              value={''}
              style={styles.dropDown}
              items={routes.map((route) => ({
                label: descriptors[route.key].options.title || '',
                value: route.key
              }))}
              setFormValues={(routeKey) => {
                const route = descriptors[routeKey].route;
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                }) as { defaultPrevented: boolean };
                if (!event.defaultPrevented) {
                  navigation.dispatch({
                    ...TabActions.jumpTo(route.name),
                    target: state.key
                  });
                }
              }}
            />
          </TransparentView>
        ))}
      </WhitePaddedView>
      <TransparentView style={[styles.screenContainer]}>
        {state.routes.map((route, i) => {
          const displayStyle = {
            height: i === state.index ? '100%' : 0,
            overflow: 'hidden' as 'hidden'
          };
          return (
            <TransparentView
              key={route.key}
              style={[StyleSheet.absoluteFill, displayStyle]}
            >
              {descriptors[route.key].render()}
            </TransparentView>
          );
        })}
      </TransparentView>
    </NavigationContent>
  );
}

export const createDropDownNavigator =
  createNavigatorFactory(DropDownNavigator);
