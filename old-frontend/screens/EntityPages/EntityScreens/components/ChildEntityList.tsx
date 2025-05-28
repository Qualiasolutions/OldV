import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import ListLink from 'components/molecules/ListLink';
import { FullPageSpinner } from 'components/molecules/Spinners';
import AddEntityForm from 'components/forms/AddEntityForm';
import { EntityResponseType, EntityTypeName } from 'types/entities';
import linkMapping from 'components/entityCards';
import { TransparentView } from 'components/molecules/ViewComponents';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { useTranslation } from 'react-i18next';
import { datetimeSettingsMapping } from 'components/lists/utils/datetimeSettingsMapping';
import { entityOrderings } from 'components/lists/utils/entityOrderings';
import { sectionNameMapping } from 'components/lists/utils/sectionNameMapping';
import useGetUserFullDetails from 'hooks/useGetUserDetails';

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

export default function ChildEntityList({
  entityId,
  entityTypes = null,
  showCreateForm = false
}: {
  entityId: number;
  entityTypes: EntityTypeName[] | null;
  showCreateForm: boolean;
}) {
  const { t } = useTranslation();
  const { data: userDetails } = useGetUserFullDetails();
  const [monthsBack, setMonthsBack] = useState(0);
  const {
    data: allEntities,
    isLoading,
    error
  } = useGetAllEntitiesQuery(undefined, {
    skip: !userDetails?.id
  });
  const entityData = allEntities?.byId[entityId];

  if (isLoading || !entityData) {
    return <FullPageSpinner />;
  }

  const childEntityIds = entityData.child_entities || [];
  let childEntities = childEntityIds.map((id) => allEntities?.byId[id]);

  if (entityTypes) {
    childEntities = childEntities.filter((entity) =>
      entityTypes.includes(entity.resourcetype)
    );
  }

  if (entityTypes && entityTypes.length === 1) {
    const entityDatetimeSettings =
      datetimeSettingsMapping[entityTypes[0]] || null;
    const ordering = entityOrderings[entityTypes[0]] || null;
    const orderedEntityData = ordering
      ? childEntities.sort(ordering)
      : [...childEntities];

    const datetimeFilteredEntityData = useMemo(() => {
      const earliestDate = new Date();
      earliestDate.setMonth(earliestDate.getMonth() - monthsBack);

      if (!entityDatetimeSettings) {
        return orderedEntityData;
      }
      if (!entityDatetimeSettings.hidePrevious) {
        return orderedEntityData;
      }

      return orderedEntityData.filter((entity) => {
        if (new Date(entity[entityDatetimeSettings.endField]) < earliestDate) {
          return false;
        }
        return true;
      });
    }, [orderedEntityData, monthsBack]);

    const sections = {} as { [key: string]: EntityResponseType[] };

    const toSectionName =
      sectionNameMapping[entityData[0]?.resourcetype] || null;
    if (toSectionName) {
      for (const entity of datetimeFilteredEntityData) {
        if (sections[toSectionName(entity)]) {
          sections[toSectionName(entity)].push(entity);
        } else {
          sections[toSectionName(entity)] = [entity];
        }
      }
    }
  }

  const childEntityList =
    childEntities.length > 0 ? (
      childEntities.map((entity) => {
        const resourceType = entity.resourcetype;
        const Link = linkMapping[resourceType] || DefaultLink;
        return <Link key={entity.id} entity={entity} />;
      })
    ) : (
      <AlmostBlackText
        text={t('misc.currentlyNoEntities', {
          entityType: entityTypes
            ? entityTypes
                .map((entityType) => t(`entityTypes.${entityType}`))
                .join(' or ')
            : ''
        })}
        style={styles.noEntitiesText}
      />
    );

  return (
    <TransparentView>
      {childEntityList}
      {showCreateForm && entityTypes?.length === 1 && (
        <AddEntityForm entityType={entityTypes && entityTypes[0]} />
      )}
    </TransparentView>
  );
}

const styles = StyleSheet.create({
  noEntitiesText: {
    fontSize: 20,
    padding: 20
  }
});
