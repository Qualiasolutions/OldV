import Calendar from 'components/calendars/TaskCalendar';
import EntityListPage from 'components/lists/EntityListPage';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import ReferencesList from 'components/organisms/ReferencesList';
import ENTITY_TYPE_TO_CATEGORY from 'constants/EntityTypeToCategory';
import useScheduledEntityIds from 'hooks/entities/useScheduledEntityIds';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectScheduledTaskIdsByEntityTypes } from 'reduxStore/slices/tasks/selectors';
import { EntityTypeName } from 'types/entities';
import QuickNavigator from './base/QuickNavigator';

export default function EntityTypeNavigator({
  entityTypes,
  entityTypeName
}: {
  entityTypes: EntityTypeName[];
  entityTypeName: string;
}) {
  const { t } = useTranslation();
  const taskSelector = useMemo(
    () => selectScheduledTaskIdsByEntityTypes(entityTypes),
    [entityTypes]
  );
  const filteredTasks = useSelector(taskSelector);
  const filteredEntities = useScheduledEntityIds(entityTypes);

  const homeComponent = useMemo(() => {
    return (
      <TransparentFullPageScrollView>
        <EntityListPage
          entityTypes={entityTypes}
          entityTypeName={entityTypeName}
        />
      </TransparentFullPageScrollView>
    );
  }, [entityTypes, entityTypeName]);

  const calendarComponent = useMemo(() => {
    return (
      <Calendar
        showFilters={false}
        filteredTasks={filteredTasks}
        filteredEntities={filteredEntities}
      />
    );
  }, [filteredTasks, filteredEntities]);

  const referencesComponent = useMemo(() => {
    return <ReferencesList entityTypes={entityTypes} />;
  }, [entityTypes]);

  const categoryName = ENTITY_TYPE_TO_CATEGORY[entityTypes[0]];

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

  return (
    <QuickNavigator
      categoryName={categoryName || ''}
      quickNavPages={quickNavPages}
    />
  );
}
