import SafePressable from 'components/molecules/SafePressable';
import { Text } from 'components/Themed';
import iWantToOptions from 'constants/iWantToOptions';
import { useMemo } from 'react';
import { Linking } from 'react-native';
import { useGetAllReferenceGroupsQuery } from 'reduxStore/services/api/references';
import { QuickNavTabParamList } from 'types/base';
import { CategoryName } from 'types/categories';
import { createDropDownNavigator } from './DropDownNavigator';

const TopTabs = createDropDownNavigator<QuickNavTabParamList>();
const QUICK_NAV_ID = 'QUICK_NAV';
const I_WANT_TO_ID = 'I_WANT_TO';

export type QuickNavPage = {
  component: JSX.Element | null;
  name: string;
  title: string;
};

export default function QuickNavigator({
  initialRouteName,
  categoryName,
  quickNavPages
}: {
  initialRouteName?: string;
  categoryName: CategoryName | '';
  quickNavPages: QuickNavPage[];
}) {
  const { data: referenceGroups } = useGetAllReferenceGroupsQuery();

  const iWantToComponents = useMemo(() => {
    if (!categoryName) {
      return {};
    }
    const comps: { [key: string]: () => JSX.Element } = {};
    for (const opt of iWantToOptions[categoryName]) {
      comps[opt.title] = () => (
        <SafePressable
          onPress={() => {
            if (opt.link) {
              Linking.openURL(opt.link);
            }
          }}
        >
          <Text>{opt.link || opt.title}</Text>
        </SafePressable>
      );
    }
    return comps;
  }, [categoryName]);

  if (!referenceGroups) {
    return null;
  }

  return (
    <TopTabs.Navigator initialRouteName={initialRouteName}>
      {quickNavPages.map(({ component, name, title }, i) => (
        <TopTabs.Screen
          key={i}
          name={name}
          options={{
            title: title,
            dropDownId: QUICK_NAV_ID
          }}
        >
          {() => component}
        </TopTabs.Screen>
      ))}
      {Object.entries(iWantToComponents).map(([opt, comp], i) => (
        <TopTabs.Screen
          key={i}
          name={`IWantTo_${i}`}
          component={comp}
          options={{
            title: opt,
            dropDownId: I_WANT_TO_ID
          }}
        />
      ))}
    </TopTabs.Navigator>
  );
}
