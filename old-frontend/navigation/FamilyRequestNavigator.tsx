import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { FamilyRequestTabParamList } from '../types/base';
import FamilyRequestScreen from 'screens/FamilyRequestScreens/FamilyRequestScreen';

const FamilyRequestStack =
  createNativeStackNavigator<FamilyRequestTabParamList>();

export function FamilyRequestNavigator() {
  return (
    <FamilyRequestStack.Navigator initialRouteName="FamilyRequest">
      <FamilyRequestStack.Screen
        name="FamilyRequest"
        component={FamilyRequestScreen}
        options={{ headerShown: false }}
      />
    </FamilyRequestStack.Navigator>
  );
}
