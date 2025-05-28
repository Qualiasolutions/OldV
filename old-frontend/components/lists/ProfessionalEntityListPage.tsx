import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import ListLink from 'components/molecules/ListLink';
import { EntityResponseType, isProfessionalEntity } from 'types/entities';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { useSelector } from 'react-redux';
import { selectProfessionalCategoryById } from 'reduxStore/slices/categories/selectors';

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    paddingBottom: 100
  },
  noEntitiesText: {
    fontSize: 20,
    padding: 20
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

type ProfessionalEntityListPageProps = {
  professionalCategory: number | null;
};

export default function ProfessionalEntityListPage({
  professionalCategory
}: ProfessionalEntityListPageProps) {
  const {
    data: allEntities,
    isLoading,
    isFetching
  } = useGetAllEntitiesQuery(undefined);
  const entityData = useMemo(() => {
    return Object.values(allEntities?.byId || {}).filter((entity) => {
      if (isProfessionalEntity(entity)) {
        if (entity.professional_category === professionalCategory) {
          return true;
        }
      }
      return false;
    });
  }, [allEntities, professionalCategory]);
  const category = useSelector(
    selectProfessionalCategoryById(professionalCategory || -1)
  );

  const { t } = useTranslation();

  let filteredEntityData = entityData;

  if (isLoading || !filteredEntityData) {
    return <FullPageSpinner />;
  }

  const listLinks = filteredEntityData.map((entity) => {
    return <DefaultLink key={entity.id} entity={entity} />;
  });

  if (listLinks.length === 0) {
    return (
      <TransparentView>
        <TransparentPaddedView style={styles.container}>
          <AlmostBlackText
            text={t('misc.currentlyNoProfessionalEntities', {
              categoryName: category?.name || t('common.uncategorised')
            })}
            style={styles.noEntitiesText}
          />
        </TransparentPaddedView>
      </TransparentView>
    );
  }

  return (
    <TransparentView>
      <TransparentPaddedView style={styles.container}>
        {listLinks}
        {isFetching && <PaddedSpinner />}
      </TransparentPaddedView>
    </TransparentView>
  );
}
