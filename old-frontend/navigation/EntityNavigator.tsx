import Calendar from 'components/calendars/TaskCalendar';
import EditEntityForm from 'components/forms/EditEntityForm';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import MessageThread from 'components/organisms/MessageThread';
import ReferencesList from 'components/organisms/ReferencesList';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCategoryById } from 'reduxStore/slices/categories/selectors';
import { selectMemberEntityById } from 'reduxStore/slices/entities/selectors';
import EntityHome, {
  resourceTypeToComponent
} from 'screens/EntityPages/EntityHome';
import EntityOverview, {
  RESOURCE_TYPE_TO_COMPONENT
} from 'screens/EntityPages/EntityOverview';
import { EntityTypeName } from 'types/entities';
import QuickNavigator, { QuickNavPage } from './base/QuickNavigator';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import GuestListPage from 'components/organisms/GuestListPage';
import useEntityById from 'hooks/entities/useEntityById';
import useTasksForEntityId from 'hooks/tasks/useTasksForEntityId';
import useScheduledEntityIds from 'hooks/entities/useScheduledEntityIds';
import NoPermissionsPage from 'components/molecules/NoPermissionsPage';
import useGetUserFullDetails from 'hooks/useGetUserDetails';

const styles = StyleSheet.create({
  editForm: { paddingBottom: 100 }
});

const INITIAL_ROUTE_NAME_MAPPINGS: { [key in EntityTypeName]?: string } = {
  List: 'Home',
  Event: 'Overview'
};

const CalendarComponent = ({ entityId }: { entityId: number }) => {
  const filteredTasks = useTasksForEntityId(entityId);
  const filteredEntities = useScheduledEntityIds(undefined, entityId);
  return (
    <Calendar
      filteredTasks={filteredTasks}
      filteredEntities={filteredEntities}
    />
  );
};

function EntityNavigator({ entityId }: { entityId: number }) {
  const entity = useEntityById(entityId);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const category = useSelector(selectCategoryById(entity?.category || -1));

  const isMemberEntity = !!useSelector(selectMemberEntityById(entityId));

  const pages: QuickNavPage[] = [
    {
      name: 'Edit',
      title: t('pageTitles.edit'),
      component: (
        <TransparentFullPageScrollView contentContainerStyle={styles.editForm}>
          <EditEntityForm
            entityId={entityId}
            onSubmitSuccess={() => {
              navigation.goBack();
            }}
          />
        </TransparentFullPageScrollView>
      )
    }
  ];

  if (
    entity &&
    resourceTypeToComponent[entity?.resourcetype] &&
    isMemberEntity
  ) {
    pages.push({
      name: 'Home',
      title: t('pageTitles.home'),
      component: <EntityHome entityId={entityId} />
    });
  }

  if (entity && entity?.resourcetype in RESOURCE_TYPE_TO_COMPONENT) {
    pages.push({
      name: 'Overview',
      title: t('pageTitles.overview'),
      component: <EntityOverview entityId={entityId} />
    });
  }
  pages.push({
    name: 'Calendar',
    title: t('pageTitles.calendar'),
    component: <CalendarComponent entityId={entityId} />
  });
  if (isMemberEntity) {
    pages.push({
      name: 'References',
      title: t('pageTitles.references'),
      component: <ReferencesList entities={[entityId]} />
    });
    pages.push({
      name: 'Messages',
      title: t('pageTitles.messages'),
      component: <MessageThread entityId={entityId} />
    });
  }
  if (entity && isMemberEntity && entity.resourcetype === 'Event') {
    pages.push({
      name: 'GuestList',
      title: t('pageTitles.guestList'),
      component: <GuestListPage entityId={entityId} />
    });
  }

  const quickNavPages = pages;

  return (
    <QuickNavigator
      categoryName={category?.name || ''}
      initialRouteName={
        entity?.resourcetype
          ? INITIAL_ROUTE_NAME_MAPPINGS[entity?.resourcetype] || 'Calendar'
          : 'Calendar'
      }
      quickNavPages={quickNavPages}
    />
  );
}

export default function EntityNavigatorMain({
  entityId
}: {
  entityId: number;
}) {
  const entity = useEntityById(entityId);
  const { data: userDetails } = useGetUserFullDetails();
  if (!(userDetails && entity?.members.includes(userDetails.id))) {
    return <NoPermissionsPage />;
  }

  return <EntityNavigator entityId={entityId} />;
}
