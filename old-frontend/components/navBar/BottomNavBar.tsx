import {
  PrimaryColouredView,
  TransparentView,
  WhiteBox,
  WhiteView
} from 'components/molecules/ViewComponents';
import { useThemeColor } from 'components/Themed';
import { Image, StyleSheet } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentTabParamList } from 'types/base';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import SafePressable from 'components/molecules/SafePressable';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    borderTopWidth: 1,
  },
  addButtonPressable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButtonImage: {
    width: 30,
    height: 30,
    tintColor: '#fff'
  },
  addButtonWrapper: {
    position: 'absolute',
    height: 60,
    width: 60,
    top: -50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -5
  },
  centralSection: {
    alignItems: 'center',
  },
  chevronDown: {
    marginBottom: 10,
    marginTop: 30
  },
  chevronUpBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  chevronUpWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 10
  }
});

const AddButton = ({ onPress }: { [key: string]: any }) => (
  <TransparentView style={styles.addButtonWrapper}>
    <TouchableHighlight style={styles.addButtonPressable} onPress={onPress}>
      <PrimaryColouredView style={styles.addButton}>
        <Image
          source={require('../../assets/images/plus_icon.png')}
          resizeMode="contain"
          style={styles.addButtonImage}
        />
      </PrimaryColouredView>
    </TouchableHighlight>
  </TransparentView>
);

export default function BottomNavBar({
  state,
  descriptors,
  navigation
}: BottomTabBarProps) {
  const [currentScreen, setCurrentScreen] = useState<string>('');
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [currentScreenParams, setCurrentScreenParams] = useState<{
    [key: string]: any;
  }>({});
  const lightGreyColor = useThemeColor({}, 'lightGrey');

  const entityScreenIdParam = useMemo(() => {
    let nestedState: any = { ...state };
    while (true) {
      const route = nestedState.routes[nestedState.index];
      if (route.name === 'EntityScreen') {
        return route.params.entityId;
      }
      if (route?.state?.index) {
        nestedState = { ...route.state };
      } else {
        return false;
      }
    }
  }, [state]);

  const getCurrentScreenAndParams = useCallback(() => {
    let nestedState: any = { ...state };
    while (true) {
      const route = nestedState.routes[nestedState.index];
      if (route?.state?.index) {
        nestedState = { ...route.state };
      } else {
        return route;
      }
    }
  }, [state]);

  const { data: userDetails } = useGetUserFullDetails();
  const { data: allEntities } = useGetAllEntitiesQuery(undefined, {
    skip: !userDetails?.id
  });

  const holidayEntities = allEntities
    ? Object.values(allEntities.byId).filter(
        (ent) => ent.resourcetype === 'Holiday'
      )
    : [];

  useEffect(() => {
    const { name, params } = getCurrentScreenAndParams();
    setCurrentScreen(name);
    setCurrentScreenParams(params);
  }, [state, getCurrentScreenAndParams]);

  if (navbarHidden) {
    return (
      <TransparentView style={styles.chevronUpWrapper}>
        <SafePressable onPress={() => setNavbarHidden(false)}>
          <WhiteBox style={styles.chevronUpBox}>
            <Feather name="chevron-up" size={30} />
          </WhiteBox>
        </SafePressable>
      </TransparentView>
    );
  }

  return (
    <WhiteView style={[{ borderTopColor: lightGreyColor }, styles.bar]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state?.index === index;

        if (route.name === 'PlusButton') {
          return (
            <TransparentView key={index} style={styles.centralSection}>
              <AddButton
                onPress={() => {
                  const ignoredScreens = ['AddTask'];
                  if (ignoredScreens.includes(currentScreen)) {
                    return;
                  } else if (entityScreenIdParam) {
                    navigation.navigate('AddTask', {
                      entities: [entityScreenIdParam]
                    });
                  } else if (['EntityList'].includes(currentScreen)) {
                    type RouteParams = ContentTabParamList['EntityList'];
                    const entityTypes = (currentScreenParams as RouteParams)
                      .entityTypes;

                    if (
                      entityTypes[0] === 'Holiday' &&
                      holidayEntities.length === 0
                    ) {
                      navigation.navigate('HolidayList');
                    } else {
                      navigation.navigate('AddEntity', {
                        entityTypes: entityTypes[0]
                      });
                    }
                  } else if (['ProfessionalCategory'].includes(currentScreen)) {
                    type RouteParams =
                      ContentTabParamList['ProfessionalCategory'];
                    const categoryId = (currentScreenParams as RouteParams)
                      .categoryId;

                    navigation.navigate('AddEntity', {
                      entityTypes: 'ProfessionalEntity',
                      defaults: {
                        professional_category: categoryId
                      }
                    });
                  } else if (currentScreen === 'HolidayDates') {
                    navigation.navigate('AddHolidayTask');
                  } else {
                    navigation.navigate('AddTask', { type: '' });
                  }
                }}
              />
              <SafePressable onPress={() => setNavbarHidden(true)}>
                <Feather
                  name="chevron-down"
                  style={styles.chevronDown}
                  size={30}
                />
              </SafePressable>
            </TransparentView>
          );
        } else if (options.tabBarIcon) {
          const forcedScreen =
            route.name === 'ContentNavigator'
              ? 'Categories'
              : route.name === 'SettingsNavigator'
              ? 'Settings'
              : '';
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (forcedScreen) {
                  navigation.navigate(route.name, { screen: forcedScreen });
                } else {
                  navigation.navigate(route.name);
                }
              }}
            >
              {options.tabBarIcon({ focused: isFocused, color: '', size: 0 })}
            </TouchableOpacity>
          );
        }
      })}
    </WhiteView>
  );
}
