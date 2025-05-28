import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Calendar from 'components/calendars/TaskCalendar';
import ProfessionalEntityListPage from 'components/lists/ProfessionalEntityListPage';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import ReferencesList from 'components/organisms/ReferencesList';
import useCategoryHeader from 'headers/hooks/useCategoryHeader';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectProfessionalCategoryById } from 'reduxStore/slices/categories/selectors';
import { selectEntitiesByProfessionalCategory } from 'reduxStore/slices/entities/selectors';
import { selectScheduledTaskIdsByProfessionalCategory } from 'reduxStore/slices/tasks/selectors';
import { ContentTabParamList } from 'types/base';
import QuickNavigator from './base/QuickNavigator';

export default function ProfessionalCategoryNavigator({
  route
}: NativeStackScreenProps<ContentTabParamList, 'ProfessionalCategory'>) {
  const categoryId = route.params.categoryId;
  const { t } = useTranslation();
  const category = useSelector(
    selectProfessionalCategoryById(categoryId || -1)
  );

  useCategoryHeader(category?.name || t('common.uncategorised'), true);
  const taskSelector = useMemo(
    () => selectScheduledTaskIdsByProfessionalCategory(categoryId || -1),
    [categoryId]
  );
  const filteredTasks = useSelector(taskSelector);
  const filteredEntities = useSelector(
    selectEntitiesByProfessionalCategory(categoryId || -1)
  );

  const homeComponent = useMemo(() => {
    return (
      <TransparentFullPageScrollView>
        <ProfessionalEntityListPage professionalCategory={categoryId} />
      </TransparentFullPageScrollView>
    );
  }, [categoryId]);

  const calendarComponent = useMemo(() => {
    return <Calendar showFilters={false} filteredTasks={filteredTasks} />;
  }, [filteredTasks]);

  const referencesComponent = useMemo(() => {
    return <ReferencesList entities={filteredEntities} />;
  }, [filteredEntities]);

  const quickNavPages = [];
  if (homeComponent) {
    quickNavPages.push({
      name: 'Home',
      title: t('pageTitles.home'),
      component: homeComponent
    });
  }
  if (calendarComponent) {
    quickNavPages.push({
      name: 'Calendar',
      title: t('pageTitles.calendar'),
      component: calendarComponent
    });
  }
  quickNavPages.push({
    name: 'References',
    title: t('pageTitles.references'),
    component: referencesComponent
  });

  return <QuickNavigator categoryName={''} quickNavPages={quickNavPages} />;
}
