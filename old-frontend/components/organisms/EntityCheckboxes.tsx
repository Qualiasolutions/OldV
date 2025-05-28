import Checkbox from 'components/molecules/Checkbox';
import SafePressable from 'components/molecules/SafePressable';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import INFO_CATEGORY_TAGS, {
  getTagFromCategory
} from 'constants/InfoCategoryTags';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import {
  useGetAllEntitiesQuery,
  useGetMemberEntitiesQuery
} from 'reduxStore/services/api/entities';
import { useGetAllTagsQuery } from 'reduxStore/services/api/tags';
import { CategoryName } from 'types/categories';

const HIDDEN_ENTITY_TYPES = [
  'List',
  'School',
  'AcademicPlan',
  'ExtracurricularPlan',
  'DaysOff',
  'CareerGoal',
  'Appointment',
  'HealthBeauty',
  'HealthGoal',
  'EventSubentity'
];
const styles = StyleSheet.create({
  entityCheckboxPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  entityCheckboxLabel: {
    marginRight: 10,
    flex: 1
  },
  categoryTitle: { fontSize: 22 },
  categoryCheckboxes: { marginBottom: 20 }
});

export default function EntityCheckboxes({
  value,
  setSelectedEntities,
  setSelectedTags,
  extraTagOptions
}: {
  value: {
    entities: number[];
    tags: string[];
  };
  setSelectedEntities: (entities: number[]) => void;
  setSelectedTags: (tags: string[]) => void;
  extraTagOptions?: {
    [key in CategoryName]?: { value: string; label: string }[];
  };
}) {
  const { t } = useTranslation();
  const { data: memberEntities, isLoading: isLoadingMemberEntities } =
    useGetMemberEntitiesQuery(undefined);
  const { data: allEntities, isLoading: isLoadingAllEntities } =
    useGetAllEntitiesQuery(undefined);
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();
  const { data: allTags, isLoading: isLoadingTags } = useGetAllTagsQuery();

  const isLoading =
    isLoadingMemberEntities ||
    isLoadingAllEntities ||
    isLoadingCategories ||
    isLoadingTags ||
    !memberEntities ||
    !allEntities ||
    !allTags ||
    !allCategories;

  if (isLoading) {
    return <PaddedSpinner />;
  }

  const infoCategoryIds = Object.values(INFO_CATEGORY_TAGS).map(
    (categoryName) => allCategories.byName[categoryName].id
  );

  return (
    <>
      {Array(
        ...new Set([
          ...Object.keys(memberEntities.byCategory).map((key) => parseInt(key)),
          ...infoCategoryIds
        ])
      ).map((categoryId) => {
        if (categoryId === -1) {
          // Don't show professional entities here
          // TODO - show them somewhere else?
          return null;
        }

        const category = allCategories.byId[categoryId];
        const entityIds = memberEntities.byCategory[category.id];
        const infoTag = getTagFromCategory(category.name);
        const extraTags = extraTagOptions && extraTagOptions[category.name];
        if (!entityIds && !infoTag && !extraTags) {
          return null;
        }

        const entityCheckboxes = (entityIds || []).map((entityId: number) => {
          const entity = memberEntities.byId[entityId];
          if (
            HIDDEN_ENTITY_TYPES.includes(entity.resourcetype) ||
            entity.hidden
          ) {
            // Don't want to show list entities here
            return null;
          }

          return (
            <SafePressable
              style={styles.entityCheckboxPair}
              key={entity.id}
              onPress={async () => {
                if (value.entities.includes(entity.id)) {
                  const newEntities = value.entities.filter(
                    (id) =>
                      id !== entity.id &&
                      !HIDDEN_ENTITY_TYPES.includes(
                        memberEntities.byId[id].resourcetype
                      )
                  );
                  setSelectedEntities(newEntities);
                } else {
                  setSelectedEntities(
                    [...value.entities, entity.id].filter(
                      (id) =>
                        !HIDDEN_ENTITY_TYPES.includes(
                          memberEntities.byId[id].resourcetype
                        )
                    )
                  );
                }
              }}
            >
              <TransparentView style={styles.entityCheckboxLabel}>
                <Text>
                  {entity.name}
                  {entity.parent_name && ` (${entity.parent_name})`}
                </Text>
              </TransparentView>
              <Checkbox
                checked={value.entities.includes(entity.id)}
                disabled={true}
              />
            </SafePressable>
          );
        });

        const tagCheckbox = infoTag ? (
          <SafePressable
            style={styles.entityCheckboxPair}
            key={infoTag}
            onPress={async () => {
              if (value.tags.includes(infoTag)) {
                const newTags = value.tags.filter((tag) => tag !== infoTag);
                setSelectedTags(newTags);
              } else {
                setSelectedTags([...value.tags, infoTag]);
              }
            }}
          >
            <TransparentView style={styles.entityCheckboxLabel}>
              <Text>{t(`tags.${infoTag}`)}</Text>
            </TransparentView>
            <Checkbox checked={value.tags.includes(infoTag)} disabled={true} />
          </SafePressable>
        ) : null;

        const extraTagCheckboxes = extraTags
          ? extraTags.map((tagOptions) => (
              <TransparentView style={styles.entityCheckboxPair} key={infoTag}>
                <TransparentView style={styles.entityCheckboxLabel}>
                  <Text>{tagOptions.label}</Text>
                </TransparentView>
                <Checkbox
                  checked={value.tags.includes(tagOptions.value)}
                  onValueChange={async () => {
                    if (value.tags.includes(tagOptions.value)) {
                      const newTags = value.tags.filter(
                        (tag) => tag !== tagOptions.value
                      );
                      setSelectedTags(newTags);
                    } else {
                      setSelectedTags([...value.tags, tagOptions.value]);
                    }
                  }}
                />
              </TransparentView>
            ))
          : null;

        return (
          <TransparentView key={categoryId}>
            <Text style={styles.categoryTitle}>
              {t(`categories.${category.name}`)}
            </Text>
            <TransparentView style={styles.categoryCheckboxes}>
              {entityCheckboxes}
              {tagCheckbox}
              {extraTagCheckboxes}
            </TransparentView>
          </TransparentView>
        );
      })}
    </>
  );
}
