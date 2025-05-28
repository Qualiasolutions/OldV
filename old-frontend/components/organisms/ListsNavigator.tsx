import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import DelegatedLists from './DelegatedLists';
import PlanningLists from './PlanningLists';
import ShoppingLists from './ShoppingLists';
import ListItemActionModal from 'components/molecules/ListItemActionModal';

export type NavigatorParamList = {
  Home: undefined;
  PlanningLists: undefined;
  ShoppingLists: undefined;
  DelegatedLists: undefined;
};
const TopTabs = createMaterialTopTabNavigator<NavigatorParamList>();

export default function ListsNavigator() {
  const { t } = useTranslation();

  return (
    <>
      <ListItemActionModal />
      <TopTabs.Navigator
        initialRouteName="Home"
        screenOptions={{ tabBarLabelStyle: { fontSize: 11 } }}
      >
        <TopTabs.Screen
          name="PlanningLists"
          component={PlanningLists}
          options={{
            title: t('pageTitles.myPlanningLists')
          }}
        />
        <TopTabs.Screen
          name="ShoppingLists"
          component={ShoppingLists}
          options={{
            title: t('pageTitles.myShoppingLists')
          }}
        />
        <TopTabs.Screen
          name="DelegatedLists"
          component={DelegatedLists}
          options={{
            title: t('pageTitles.delegatedLists')
          }}
        />
      </TopTabs.Navigator>
    </>
  );
}
