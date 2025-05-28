import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColor } from 'components/Themed';
import MessageListScreen from 'screens/ChatScreens/MessageListScreen';
import MessageThreadScreen from 'screens/ChatScreens/MessageThreadScreen';
import { MessagesTabParamList } from 'types/base';

const MessagesStack = createNativeStackNavigator<MessagesTabParamList>();

export default function MessagesNavigator() {
  const primaryColor = useThemeColor({}, 'primary');
  return (
    <MessagesStack.Navigator
      initialRouteName="MessagesList"
      screenOptions={{
        headerShown: false,
        headerTintColor: primaryColor
      }}
    >
      <MessagesStack.Screen name="MessagesList" component={MessageListScreen} />
      <MessagesStack.Screen
        name="MessageThread"
        component={MessageThreadScreen}
        options={{
          headerShown: true,
          headerTitle: ''
        }}
      />
    </MessagesStack.Navigator>
  );
}
