import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import ListLink from 'components/molecules/ListLink';
import linkMapping from 'components/entityCards';
import { EntityResponseType, EntityTypeName } from 'types/entities';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { StyleSheet } from 'react-native';
import { sectionNameMapping } from './utils/sectionNameMapping';
import { entityOrderings } from './utils/entityOrderings';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { datetimeSettingsMapping } from './utils/datetimeSettingsMapping';
import SafePressable from 'components/molecules/SafePressable';

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    paddingBottom: 100
  },
  noEntitiesText: {
    fontSize: 20,
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 27,
    fontWeight: '700'
  },
  showOlderWrapper: {
    padding: 20,
    paddingBottom: 0
  },
  showOlderText: {
    fontSize: 20
  },
  showNewerText: {
    fontSize: 20
  }
});

function DefaultLink({ entity }: { entity: EntityResponseType }) {
  return (
    <ListLink
      text={entity.name || ''}
      toScreen="EntityScreen"
      toScreenParams={{ entityId: entity.id }}
      navMethod="push"
    />
  );
}

type EntityListPageProps = {
  entityTypes: EntityTypeName[];
  entityTypeName: string;
  entityFilters?: ((ent: EntityResponseType) => boolean)[];
};

export default function EntityListPage({
  entityTypes,
  entityTypeName,
  entityFilters
}: EntityListPageProps) {
  const {
    data: allEntities,
    isLoading,
    isFetching
  } = useGetAllEntitiesQuery(undefined);

  const entityData = Object.values(allEntities?.byId || {}).filter((entity) =>
    entityTypes.includes(entity.resourcetype)
  );
  const { t } = useTranslation();
  const [monthsBack, setMonthsBack] = useState(0);

  let filteredEntityData = entityData;

  if (entityFilters) {
    for (const entityFilter of entityFilters) {
      filteredEntityData = filteredEntityData.filter(entityFilter);
    }
  }

  const entityDatetimeSettings =
    datetimeSettingsMapping[filteredEntityData[0]?.resourcetype] || null;
  const ordering = entityOrderings[filteredEntityData[0]?.resourcetype] || null;
  const orderedEntityData = ordering
    ? filteredEntityData.sort(ordering)
    : [...filteredEntityData];

  const [monthsAhead, setMonthsAhead] = useState(
    entityDatetimeSettings ? entityDatetimeSettings.monthsAhead || 0 : 0
  );

  const [previousEntityData, datetimeFilteredEntityData, futureEntityData] =
    useMemo(() => {
      const earliestDate = new Date();
      earliestDate.setMonth(earliestDate.getMonth() - monthsBack);

      const latestDate = new Date();
      latestDate.setMonth(latestDate.getMonth() + monthsAhead);

      const prev = entityDatetimeSettings?.hidePrevious
        ? orderedEntityData.filter(
            (entity) =>
              new Date(entity[entityDatetimeSettings.endField]) < earliestDate
          )
        : [];
      const future = entityDatetimeSettings?.monthsAhead
        ? orderedEntityData.filter(
            (entity) =>
              new Date(entity[entityDatetimeSettings.startField]) > latestDate
          )
        : [];

      const datetimeFiltered = orderedEntityData.filter((entity) => {
        return ![
          ...prev.map((ent) => ent.id),
          ...future.map((ent) => ent.id)
        ].includes(entity.id);
      });

      return [prev, datetimeFiltered, future];
    }, [orderedEntityData, monthsBack]);

  if (isLoading || !filteredEntityData) {
    return <FullPageSpinner />;
  }

  const sections = {} as { [key: string]: EntityResponseType[] };

  const toSectionName =
    sectionNameMapping[filteredEntityData[0]?.resourcetype] || null;
  if (toSectionName) {
    for (const entity of datetimeFilteredEntityData) {
      if (sections[toSectionName(entity)]) {
        sections[toSectionName(entity)].push(entity);
      } else {
        sections[toSectionName(entity)] = [entity];
      }
    }
  }

  let listLinks;
  if (toSectionName) {
    listLinks = Object.entries(sections).map((entry, i) => {
      const sectionTitle = entry[0];
      const entities = entry[1];
      return (
        <TransparentView key={i}>
          <AlmostBlackText style={styles.sectionTitle} text={sectionTitle} />
          {entities.map((entity) => {
            const resourceType = entity.resourcetype;
            const Link = linkMapping[resourceType] || DefaultLink;
            return <Link key={entity.id} entity={entity} />;
          })}
        </TransparentView>
      );
    });
  } else {
    listLinks = filteredEntityData.map((entity) => {
      const resourceType = entity.resourcetype;
      const Link = linkMapping[resourceType] || DefaultLink;
      return <Link key={entity.id} entity={entity} />;
    });
  }

  const showPreviousButton = entityDatetimeSettings?.allowShowPrevious
    ? monthsBack < 24 &&
      previousEntityData.length > 0 && (
        <SafePressable
          onPress={() => setMonthsBack(monthsBack + 6)}
          style={styles.showOlderWrapper}
        >
          <AlmostBlackText
            text={t('components.calendar.showOlderEvents')}
            style={styles.showOlderText}
          />
        </SafePressable>
      )
    : null;

  const showFutureButton =
    entityDatetimeSettings?.monthsAhead &&
    entityDatetimeSettings?.monthsAheadPerLoad
      ? (!entityDatetimeSettings.maxMonthsAhead ||
          monthsAhead < entityDatetimeSettings!.maxMonthsAhead) &&
        futureEntityData.length > 0 && (
          <SafePressable
            onPress={() =>
              setMonthsAhead(
                monthsAhead + (entityDatetimeSettings?.monthsAheadPerLoad || 0)
              )
            }
            style={styles.showOlderWrapper}
          >
            <AlmostBlackText
              text={t('components.calendar.showNewerEvents')}
              style={styles.showNewerText}
            />
          </SafePressable>
        )
      : null;

  if (listLinks.length === 0) {
    return (
      <TransparentView>
        {showPreviousButton}
        <TransparentPaddedView style={styles.container}>
          <AlmostBlackText
            text={t('misc.currentlyNoEntities', {
              entityType: t(`entityTypes.${entityTypeName}`)
            })}
            style={styles.noEntitiesText}
          />
        </TransparentPaddedView>
        {showFutureButton}
      </TransparentView>
    );
  }

  return (
    <TransparentView>
      <TransparentPaddedView style={styles.container}>
        {showPreviousButton}
        {listLinks}
        {isFetching && <PaddedSpinner />}
        {showFutureButton}
      </TransparentPaddedView>
    </TransparentView>
  );
}
