import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Calendar from 'components/calendars/TaskCalendar';
import { FullPageSpinner } from 'components/molecules/Spinners';
import ReferencesList from 'components/organisms/ReferencesList';
import INFO_CATEGORY_TAGS from 'constants/InfoCategoryTags';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import { selectScheduledTaskIdsByTagNames } from 'reduxStore/slices/tasks/selectors';
import { TagScreenTabParamList } from 'types/base';

const TopTabs = createMaterialTopTabNavigator<TagScreenTabParamList>();

export default function TagNavigator({ tagName }: { tagName: string }) {
  const { t } = useTranslation();
  const taskSelector = useMemo(
    () => selectScheduledTaskIdsByTagNames([tagName]),
    [tagName]
  );
  const filteredTasks = useSelector(taskSelector);
  const { data: allCategories } = useGetAllCategoriesQuery();

  const calendarComponent = useMemo(() => {
    return () => <Calendar showFilters={false} filteredTasks={filteredTasks} />;
  }, [filteredTasks]);

  const referencesComponent = useMemo(() => {
    if (Object.keys(INFO_CATEGORY_TAGS).includes(tagName)) {
      const category = allCategories?.byName[INFO_CATEGORY_TAGS[tagName]];

      if (!category) {
        return () => null;
      }

      return () => (
        <ReferencesList
          tagsFirst={true}
          categories={[category.id]}
          tags={[tagName]}
        />
      );
    }
    return () => <ReferencesList tags={[tagName]} />;
  }, [tagName, allCategories]);

  if (!allCategories) {
    return <FullPageSpinner />;
  }

  return (
    <TopTabs.Navigator initialRouteName="TagCalendar">
      <TopTabs.Screen
        name="TagCalendar"
        component={calendarComponent}
        options={{
          title: t('pageTitles.calendar')
        }}
      />
      <TopTabs.Screen
        name="TagReferences"
        component={referencesComponent}
        options={{
          title: t('pageTitles.references')
        }}
      />
    </TopTabs.Navigator>
  );
}
