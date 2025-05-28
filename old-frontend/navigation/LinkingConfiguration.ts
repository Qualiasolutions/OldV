/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { TabParamList } from '../types/base';

const linking: LinkingOptions<TabParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Home: '',
      Transport: 'transport',
      SettingsNavigator: {
        path: 'settings',
        screens: {
          Settings: '',
          FamilySettings: 'family',
          CreateUserInvite: 'create-user-invite'
        }
      },
      ContentNavigator: {
        path: 'content',
        screens: {
          AllReferences: 'all-references',
          Categories: 'categories-grid',
          CategoryList: 'category-list',
          EntityList: 'entity-list',
          EntityScreen: 'entity-screen',
          EditEntity: 'edit-entity',
          AddEntity: 'add-entity',
          HolidayList: 'holiday-list',
          HolidayDetail: 'holiday-detail'
        }
      },
      EntityNavigator: {
        path: 'entity',
        screens: {
          Home: 'home',
          Calendar: 'calendar',
          References: 'references'
        }
      },
      AddTask: 'add-task',
      EditTask: 'edit-task',
      Login: 'login',
      Signup: 'signup',
      ValidatePhone: 'validate-phone',
      CreatePassword: 'create-password',
      ForgotPassword: 'forgot-password',
      NotFound: '*',
      CreateAccount: 'create-account',
      AddFamily: 'add-family',
      AddFamilyMember: 'add-family-member',
      WelcomeToVuet: 'welcome',
      FamilyRequest: 'family-request'
    }
  }
};

export default linking;
