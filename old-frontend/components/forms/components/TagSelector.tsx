import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Button, SmallButton } from 'components/molecules/ButtonComponents';
import Checkbox from 'components/molecules/Checkbox';
import { Modal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { TransparentView, WhiteBox } from 'components/molecules/ViewComponents';
import EntityCheckboxes from 'components/organisms/EntityCheckboxes';
import { Text, View } from 'components/Themed';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import {
  useGetAllEntitiesQuery,
  useGetMemberEntitiesQuery
} from 'reduxStore/services/api/entities';
import { useGetAllTagsQuery } from 'reduxStore/services/api/tags';
import { RootTabParamList } from 'types/base';
import { CategoryName } from 'types/categories';
import { EntityTypeName } from 'types/entities';

const styles = StyleSheet.create({
  checkboxContainer: { flexGrow: 0, paddingHorizontal: 10 },
  entityCheckboxPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  entityCheckboxLabel: {
    marginRight: 10
  },
  buttonWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  createNewButton: {
    marginVertical: 20
  },
  button: { marginHorizontal: 5 },
  clearButton: { marginRight: 5 },
  baseButton: { marginBottom: 2 },
  requiredTagSection: { marginVertical: 10 },
  selectedEntitiesSummary: { marginBottom: 10 },
  modalBoxStyle: { width: '100%' }
});

type ValueType = {
  entities: number[];
  tags: string[];
};

type TagSelectorProps = {
  selectedEntities: number[];
  selectedTags: string[];
  value: string[];
  requiredTags: {
    PET: boolean;
  };
  requiredEntityTypes: {
    name: string;
    resourceTypes: EntityTypeName[];
    parent?: number[];
  }[];
  permittedEntityTypes: {
    name: string;
    resourceTypes: EntityTypeName[];
    parent?: number[];
  }[];
  onChange: (tags: string[]) => void;
  onChangeEntities: (entities: number[]) => void;
};

const StepTwoSelector = ({
  selectedEntities,
  selectedTags,
  requiredTags,
  requiredEntityTypes,
  permittedEntityTypes,
  onChange,
  onChangeEntities
}: TagSelectorProps) => {
  const { t } = useTranslation();

  const { data: memberEntities, isLoading: isLoadingMemberEntities } =
    useGetMemberEntitiesQuery(undefined);
  const { data: allEntities, isLoading: isLoadingAllEntities } =
    useGetAllEntitiesQuery();

  const { data: allTags, isLoading: isLoadingTags } =
    useGetAllTagsQuery(undefined);

  const isLoading =
    isLoadingMemberEntities ||
    !memberEntities ||
    isLoadingAllEntities ||
    !allEntities ||
    isLoadingTags ||
    !allTags;

  if (isLoading) {
    return null;
  }

  const checkboxOnValueChange = (currentTagName: string) => async () => {
    if (selectedTags.includes(currentTagName)) {
      const newValue = selectedTags.filter(
        (tagName) => tagName !== currentTagName
      );
      onChange(newValue);
    } else {
      onChange([...selectedTags, currentTagName]);
    }
  };

  const entityCheckboxOnChange = (currentEntityId: number) => async () => {
    if (selectedEntities.includes(currentEntityId)) {
      const newValue = selectedEntities.filter(
        (tagName) => tagName !== currentEntityId
      );
      onChangeEntities(newValue);
    } else {
      onChangeEntities([...selectedEntities, currentEntityId]);
    }
  };

  return (
    <TransparentView>
      {selectedEntities.length > 0 && (
        <TransparentView style={styles.selectedEntitiesSummary}>
          <Text bold={true}>
            {t('components.tagSelector.selectedEntities')}:
          </Text>
          <Text>
            {selectedEntities
              .filter((ent) => allEntities.byId[ent])
              .map((ent) => allEntities.byId[ent].name)
              .join(', ')}
          </Text>
        </TransparentView>
      )}
      {selectedTags.length > 0 && (
        <TransparentView style={styles.selectedEntitiesSummary}>
          <Text bold={true}>{t('components.tagSelector.selectedTags')}:</Text>
          <Text>{selectedTags.map((tag) => t(`tags.${tag}`)).join(', ')}</Text>
        </TransparentView>
      )}

      {requiredTags.PET && (
        <TransparentView style={styles.requiredTagSection}>
          <Text>{t('components.tagSelector.requiresPetTag')}:</Text>
          {allTags.PETS &&
            allTags.PETS.map((petTagName) => (
              <SafePressable
                style={styles.entityCheckboxPair}
                key={petTagName}
                onPress={checkboxOnValueChange(petTagName)}
              >
                <TransparentView style={styles.entityCheckboxLabel}>
                  <Text>{t(`tags.${petTagName}`)}</Text>
                </TransparentView>
                <Checkbox
                  checked={selectedTags.includes(petTagName)}
                  disabled={true}
                />
              </SafePressable>
            ))}
        </TransparentView>
      )}
      {[
        ...requiredEntityTypes.map((opts) => ({ ...opts, type: 'REQUIRED' })),
        ...permittedEntityTypes.map((opts) => ({ ...opts, type: 'PERMITTED' }))
      ].map(({ name, resourceTypes, parent, type }) => {
        const matchingEntities = Object.values(memberEntities.byId).filter(
          (entity) => {
            const hasValidParent =
              !parent || (entity.parent && parent.includes(entity.parent));
            return (
              hasValidParent &&
              resourceTypes.includes(entity.resourcetype) &&
              !entity.hidden
            );
          }
        );
        return (
          <TransparentView style={styles.requiredTagSection} key={name}>
            <Text>
              {type === 'REQUIRED'
                ? t('components.tagSelector.requiresTag', {
                    requirementName: name
                  })
                : t('components.tagSelector.allowedTag', {
                    requirementName: name
                  })}
              :
            </Text>
            {matchingEntities.length > 0 ? (
              matchingEntities.map((entity) => (
                <SafePressable
                  style={styles.entityCheckboxPair}
                  key={entity.id}
                  onPress={entityCheckboxOnChange(entity.id)}
                >
                  <TransparentView style={styles.entityCheckboxLabel}>
                    <Text>{entity.name}</Text>
                  </TransparentView>
                  <Checkbox
                    checked={selectedEntities.includes(entity.id)}
                    disabled={true}
                  />
                </SafePressable>
              ))
            ) : (
              <Text bold={true}>
                {t('components.tagSelector.noEntities', {
                  entityType: name
                })}
              </Text>
            )}
          </TransparentView>
        );
      })}
    </TransparentView>
  );
};

type EntityAndTagSelectorModalProps = {
  open: boolean;
  value: ValueType;
  onChange: (newValue: ValueType) => void;
  onRequestClose: () => void;
  extraTagOptions?: {
    [key in CategoryName]?: { value: string; label: string }[];
  };
};

const EntityAndTagSelectorModal = ({
  open,
  value,
  onChange,
  onRequestClose,
  extraTagOptions
}: EntityAndTagSelectorModalProps) => {
  const [isStepTwo, setIsStepTwo] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState(value.entities);
  const [selectedTags, setSelectedTags] = useState(value.tags);
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { data: memberEntities, isLoading: isLoadingMemberEntities } =
    useGetMemberEntitiesQuery(undefined);
  const { data: allEntities, isLoading: isLoadingAllEntities } =
    useGetAllEntitiesQuery(undefined);
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();
  const { data: allTags, isLoading: isLoadingTags } = useGetAllTagsQuery();

  useEffect(() => {
    setSelectedEntities(value.entities);
    setSelectedTags(value.tags);
  }, [value]);

  const resetValues = useCallback(() => {
    setSelectedEntities(value.entities);
    setIsStepTwo(false);
  }, [value]);

  useEffect(() => {
    resetValues();
  }, [resetValues, open]);

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

  const petCategoryId = allCategories.byName.PETS.id;
  const requiresPetTag = selectedEntities.some(
    (ent) =>
      allEntities.byId[ent] && allEntities.byId[ent].category === petCategoryId
  );
  const hasPetTag = selectedTags.some((tag) => allTags.PETS?.includes(tag));

  const requiresAppointmentTag = selectedEntities.some(
    (ent) =>
      allEntities.byId[ent] && allEntities.byId[ent].resourcetype === 'Patient'
  );

  const requiresMatchingStudentTag = selectedEntities.some(
    (ent) =>
      allEntities.byId[ent] &&
      ['Student'].includes(allEntities.byId[ent].resourcetype)
  );

  const allowedMatchingEmployeeTag = selectedEntities.some(
    (ent) =>
      allEntities.byId[ent] &&
      ['Employee'].includes(allEntities.byId[ent].resourcetype)
  );

  const selectedEvents = selectedEntities.filter(
    (ent) =>
      allEntities.byId[ent] && allEntities.byId[ent].resourcetype === 'Event'
  );

  const requiredEntityTypes: {
    name: string;
    resourceTypes: EntityTypeName[];
  }[] = [];
  if (requiresAppointmentTag) {
    requiredEntityTypes.push({
      name: 'Appointment or Health Goal',
      resourceTypes: ['Appointment', 'HealthGoal']
    });
  }
  if (requiresMatchingStudentTag) {
    requiredEntityTypes.push({
      name: 'School, Extracurricular or Academic Plan',
      resourceTypes: ['School', 'ExtracurricularPlan', 'AcademicPlan']
    });
  }

  const permittedEntityTypes: {
    name: string;
    resourceTypes: EntityTypeName[];
    parent?: number[];
  }[] = [];
  if (allowedMatchingEmployeeTag) {
    permittedEntityTypes.push({
      name: 'Days off or Career goal',
      resourceTypes: ['DaysOff', 'CareerGoal']
    });
  }

  if (selectedEvents.length > 0) {
    for (const event of selectedEvents) {
      const eventEntity = allEntities.byId[event];
      const childEntities = eventEntity.child_entities;
      let hasVisibleChild = false;
      for (const childEntityId of childEntities) {
        if (!allEntities.byId[childEntityId].hidden) {
          hasVisibleChild = true;
          break;
        }
      }
      if (hasVisibleChild) {
        permittedEntityTypes.push({
          name: `${eventEntity.name} sub`,
          resourceTypes: ['EventSubentity'],
          parent: [event]
        });
      }
    }
  }

  let hasRequiredEntityTags = true;
  for (const requiredType of requiredEntityTypes) {
    if (
      !selectedEntities.some(
        (ent) =>
          allEntities.byId[ent] &&
          requiredType.resourceTypes.includes(
            allEntities.byId[ent].resourcetype
          )
      )
    ) {
      hasRequiredEntityTags = false;
      break;
    }
  }

  return (
    <Modal
      visible={open}
      onRequestClose={onRequestClose}
      boxStyle={styles.modalBoxStyle}
    >
      {isStepTwo ? (
        <TransparentScrollView contentContainerStyle={styles.checkboxContainer}>
          <StepTwoSelector
            selectedEntities={selectedEntities}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            onChangeEntities={setSelectedEntities}
            value={selectedTags}
            requiredTags={{
              PET: requiresPetTag
            }}
            requiredEntityTypes={requiredEntityTypes}
            permittedEntityTypes={permittedEntityTypes}
          />
        </TransparentScrollView>
      ) : (
        <TransparentScrollView style={styles.checkboxContainer}>
          <SmallButton
            title={t('components.tagSelector.createNewEntity')}
            style={styles.createNewButton}
            onPress={() => {
              onRequestClose();
              navigation.navigate('ContentNavigator', {
                screen: 'Categories',
                initial: false
              });
            }}
          />
          <EntityCheckboxes
            value={{
              entities: selectedEntities,
              tags: selectedTags
            }}
            setSelectedEntities={setSelectedEntities}
            setSelectedTags={setSelectedTags}
            extraTagOptions={extraTagOptions}
          />
        </TransparentScrollView>
      )}
      {isStepTwo ? (
        <TransparentView style={styles.buttonWrapper}>
          <SmallButton
            title={t('common.back')}
            onPress={() => setIsStepTwo(false)}
            style={styles.button}
          />
          <SmallButton
            title={t('common.finish')}
            onPress={() => {
              onChange({
                entities: selectedEntities,
                tags: selectedTags
              });
              onRequestClose();
            }}
            style={styles.button}
            disabled={(requiresPetTag && !hasPetTag) || !hasRequiredEntityTags}
          />
        </TransparentView>
      ) : (
        <TransparentView style={styles.buttonWrapper}>
          <Button
            title={t('common.next')}
            onPress={() => setIsStepTwo(true)}
            style={styles.button}
            disabled={
              !(selectedEntities && selectedEntities.length > 0) &&
              !(selectedTags && selectedTags.length > 0)
            }
          />
        </TransparentView>
      )}
    </Modal>
  );
};

type Props = {
  value: ValueType;
  onChange: (value: ValueType) => void;
  extraTagOptions?: {
    [key in CategoryName]?: { value: string; label: string }[];
  };
};
export default function EntityAndTagSelector({
  value,
  onChange,
  extraTagOptions
}: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { data: allEntities, isLoading: isLoadingAllEntities } =
    useGetAllEntitiesQuery();

  const isLoading = isLoadingAllEntities || !allEntities;

  if (isLoading) {
    return <PaddedSpinner />;
  }

  return (
    <TransparentView>
      {(value.entities && value.entities.length > 0) ||
      (value.tags && value.tags.length > 0) ? (
        <WhiteBox>
          <Text bold={true}>{t('components.tagSelector.selectedTags')}</Text>
          {value.entities.map((entityId) => {
            const entity = allEntities.byId[entityId];
            if (!entity) return null;
            const parentName = entity.parent_name;
            let displayName = entity.name;
            if (parentName) {
              displayName += ` (${parentName})`;
            }
            return entity ? <Text key={entityId}>{displayName}</Text> : null;
          })}
          {value.tags.map((tagName) => (
            <Text key={tagName}>{t(`tags.${tagName}`)}</Text>
          ))}
          <View style={styles.buttonWrapper}>
            <SmallButton
              onPress={() => onChange({ entities: [], tags: [] })}
              title={t('common.clear')}
              style={[styles.clearButton, styles.baseButton]}
            />
            <SmallButton
              onPress={() => setOpen(true)}
              title={t('common.change')}
              style={styles.baseButton}
            />
          </View>
        </WhiteBox>
      ) : (
        <SmallButton
          onPress={() => setOpen(true)}
          title={t('components.tagSelector.selectTags')}
        />
      )}
      <EntityAndTagSelectorModal
        open={open}
        onRequestClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        extraTagOptions={extraTagOptions}
      />
    </TransparentView>
  );
}
