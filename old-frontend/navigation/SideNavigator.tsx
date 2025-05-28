import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList
} from '@react-navigation/drawer';

import React, { useCallback, useState } from 'react';

import { SideNavigatorTabParamList } from '../types/base';

import { BottomTabNavigator } from './RootNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import HelpScreen from 'screens/HelpScreen';
import NotificationsScreen from 'screens/NotificationsScreen';
import ContactScreen from 'screens/ContactScreen';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from 'components/Themed';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useGetPushTokensQuery,
  useUpdatePushTokenMutation
} from 'reduxStore/services/api/notifications';
import { useDispatch, useSelector } from 'react-redux';
import { selectRefreshToken } from 'reduxStore/slices/auth/selectors';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { selectPushToken } from 'reduxStore/slices/notifications/selectors';
import { blacklistTokenAsync } from 'utils/authRequests';
import { logOut as logOutAction } from 'reduxStore/slices/auth/actions';
import TransparentDrawerHeader from 'headers/TransparentDrawerHeader';
import { YesNoModal } from 'components/molecules/Modals';
import { MyAccountNavigator } from './MyAccountNavigator';

const styles = StyleSheet.create({
  drawerItem: {
    borderBottomWidth: 1,
    height: 70,
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0
  },
  drawerLabel: {
    fontFamily: 'Poppins',
    fontSize: 16
  }
});

const SideDrawer = createDrawerNavigator<SideNavigatorTabParamList>();

type CustomIconProps = {
  name: keyof typeof Feather.glyphMap;
  showChevron?: boolean;
};
function CustomIcon({ name, showChevron = true }: CustomIconProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const blackColor = useThemeColor({}, 'black');
  return (
    <>
      <Feather name={name} color={primaryColor} size={25} />
      {showChevron && (
        <Feather
          name="chevron-right"
          color={blackColor}
          size={25}
          style={{ position: 'absolute', right: 10 }}
        />
      )}
    </>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loggingOut, setLoggingOut] = useState(false);
  const jwtRefreshToken = useSelector(selectRefreshToken);
  const { data: userDetails } = useGetUserFullDetails();
  const devicePushToken = useSelector(selectPushToken);
  const { data: pushTokens } = useGetPushTokensQuery(userDetails?.id || -1, {
    skip: !userDetails?.id
  });
  const [updatePushToken] = useUpdatePushTokenMutation();

  const labelColor = useThemeColor({}, 'black');

  const matchingTokens = pushTokens?.filter(
    (pushToken) => pushToken.token === devicePushToken && pushToken.active
  );

  const logOut = async () => {
    if (matchingTokens) {
      for (const token of matchingTokens) {
        await updatePushToken({ id: token.id, active: false });
      }
    }
    if (jwtRefreshToken) {
      try {
        await blacklistTokenAsync(jwtRefreshToken);
      } catch (err) {
        // Silence errors and log out anyway
        console.error(err);
      }
    }
    dispatch(logOutAction());
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label={t('screens.drawer.logOut')}
        onPress={() => {
          setLoggingOut(true);
        }}
        icon={() => <CustomIcon name="log-out" showChevron={false} />}
        labelStyle={[styles.drawerLabel, { color: labelColor }]}
      />
      <YesNoModal
        title={t('components.logOutModal.logOut')}
        question={t('components.logOutModal.sure')}
        visible={!!loggingOut}
        onYes={logOut}
        onNo={() => {
          setLoggingOut(false);
        }}
      />
    </DrawerContentScrollView>
  );
}

export function SideNavigator({
  hasJustSignedUp
}: {
  hasJustSignedUp: boolean;
}) {
  const borderColor = useThemeColor({}, 'grey');
  const labelColor = useThemeColor({}, 'black');
  const headerTintColor = useThemeColor({}, 'primary');

  const bottomTabNavigator = useCallback(
    () => <BottomTabNavigator hasJustSignedUp={hasJustSignedUp} />,
    [hasJustSignedUp]
  );

  return (
    <SideDrawer.Navigator
      initialRouteName="BottomTabNavigator"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerItemStyle: [styles.drawerItem, { borderColor }],
        drawerLabelStyle: [styles.drawerLabel, { color: labelColor }],
        headerTintColor,
        headerTitleAlign: 'center',
        header: (props) => <TransparentDrawerHeader {...props} />
      }}
    >
      <SideDrawer.Screen
        name="BottomTabNavigator"
        component={bottomTabNavigator}
        options={{
          title: 'Home',
          headerShown: false,
          drawerIcon: () => <CustomIcon name="home" />
        }}
      />
      <SideDrawer.Screen
        name="MyAccountNavigator"
        component={MyAccountNavigator}
        options={{
          title: 'My Account',
          drawerIcon: () => <CustomIcon name="user" />
        }}
      />
      {/* <SideDrawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: () => <CustomIcon name="bell" />
        }}
      /> */}
      <SideDrawer.Screen
        name="SettingsNavigator"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          drawerIcon: () => <CustomIcon name="settings" />
        }}
      />
      {/* <SideDrawer.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: 'Help',
          drawerIcon: () => <CustomIcon name="help-circle" />
        }}
      /> */}
      <SideDrawer.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Contact',
          drawerIcon: () => <CustomIcon name="mail" />
        }}
      />
    </SideDrawer.Navigator>
  );
}
