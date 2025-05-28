import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColor } from 'components/Themed';
import EditAccountDetailsScreen from 'screens/EditAccountDetailsScreen';
import { EditAccountTypeScreen } from 'screens/EditAccountTypeScreen';
import { EditPhoneNumberScreen } from 'screens/EditPhoneNumberScreen';
import EditSecurityScreen from 'screens/EditSecurityScreen';
import MyAccountScreen from 'screens/MyAccountScreen';
import { MyAccountTabParamList } from 'types/base';
import BackOnlyHeader from 'headers/BackOnlyHeader';

const MyAccountStack = createNativeStackNavigator<MyAccountTabParamList>();

export function MyAccountNavigator() {
  const primaryColor = useThemeColor({}, 'primary');
  return (
    <MyAccountStack.Navigator
      initialRouteName="MyAccount"
      screenOptions={{
        headerShown: true,
        header: BackOnlyHeader
      }}
    >
      <MyAccountStack.Screen
        name="MyAccount"
        component={MyAccountScreen}
        options={{ title: '', headerShown: false }}
      />
      <MyAccountStack.Screen
        name="EditPhoneNumber"
        component={EditPhoneNumberScreen}
        options={{ title: '' }}
      />
      <MyAccountStack.Screen
        name="EditAccountType"
        component={EditAccountTypeScreen}
        options={{ title: '' }}
      />
      <MyAccountStack.Screen
        name="EditAccountDetails"
        component={EditAccountDetailsScreen}
        options={{ title: '' }}
      />
      <MyAccountStack.Screen
        name="EditSecurity"
        component={EditSecurityScreen}
        options={{ title: '' }}
      />
    </MyAccountStack.Navigator>
  );
}
