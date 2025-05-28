import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import {
  useCreatePushTokenMutation,
  useGetPushTokensQuery,
  useUpdatePushTokenMutation
} from 'reduxStore/services/api/notifications';
import { useDispatch } from 'react-redux';
import { setPushToken } from 'reduxStore/slices/notifications/actions';
import useGetUserFullDetails from './useGetUserDetails';

const getPushToken = async (): Promise<string | undefined> => {
  if (Device.isDevice && Platform.OS !== 'web') {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } else {
    alert('Must use physical device for Push Notifications');
  }
};

export default function useSetupPushNotifications() {
  const [isSetupComplete, setSetupComplete] = useState<boolean>(false);
  const [createPushToken, result] = useCreatePushTokenMutation();
  const { data: userDetails } = useGetUserFullDetails();
  const { data: pushTokens, isLoading: isLoadingPushTokens } =
    useGetPushTokensQuery(userDetails?.id || -1, {
      skip: !userDetails?.id
    });
  const [updatePushToken, updatePushTokenResult] = useUpdatePushTokenMutation();
  const dispatch = useDispatch();

  useEffect(() => {
    const setUp = async () => {
      // If no PushToken object exists in the backend for this device then
      // we must create a new one
      const token = await getPushToken();
      if (token) {
        dispatch(setPushToken(token));
      }

      if (pushTokens) {
        const matchingTokens = pushTokens?.filter(
          (pushToken) => pushToken.token === token && pushToken.active
        );

        if (token && matchingTokens && matchingTokens.length === 0) {
          await createPushToken({ token });
        } else if (matchingTokens) {
          for (const matchingToken of matchingTokens) {
            // Ensure that last_active is updated to now
            await updatePushToken({ id: matchingToken.id });
          }
        }
      }

      // Set notification config
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false
        })
      });

      // Set more notification config
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C'
        });
      }
      setSetupComplete(true);
    };

    // Set up notifications if a user is logged in and we
    // have loaded the push tokens from the server
    if (!isLoadingPushTokens && pushTokens) {
      setUp();
    }
  }, [isLoadingPushTokens]);

  return isSetupComplete;
}
