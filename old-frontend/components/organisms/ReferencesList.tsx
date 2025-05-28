import { Feather } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import DateTimeTextInput from 'components/forms/components/DateTimeTextInput';
import DropDown from 'components/forms/components/DropDown';
import { Button } from 'components/molecules/ButtonComponents';
import { Modal, YesNoModal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner, SmallSpinner } from 'components/molecules/Spinners';
import {
  TransparentContainerView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { PasswordInput, Text, TextInput, useThemeColor } from 'components/Themed';
import ENTITY_TYPE_TO_CATEGORY from 'constants/EntityTypeToCategory';
import INFO_CATEGORY_TAGS from 'constants/InfoCategoryTags';
import dayjs from 'dayjs';
import useEntityById from 'hooks/entities/useEntityById';
import useEntities from 'hooks/useEntities';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useSelector } from 'react-redux';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import {
  useGetAllEntitiesQuery,
  useGetMemberEntitiesQuery
} from 'reduxStore/services/api/entities';
import {
  useCreateReferenceGroupMutation,
  useCreateReferenceMutation,
  useDeleteReferenceGroupMutation,
  useDeleteReferenceMutation,
  useGetAllReferenceGroupsQuery,
  useGetAllReferencesQuery,
  useRetrievePasswordReferenceMutation,
  useUpdateReferenceGroupMutation,
  useUpdateReferenceMutation
} from 'reduxStore/services/api/references';
import { useGetAllTagsQuery } from 'reduxStore/services/api/tags';
import {
  useCreateReferencesSetupCompletionMutation,
  useGetReferencesSetupCompletionsQuery
} from 'reduxStore/services/api/user';
import {
  selectReferenceById,
  selectReferenceGroupsByEntityId,
  selectReferenceGroupsByTagName,
  selectReferencesByGroupId
} from 'reduxStore/slices/references/selectors';
import { RootTabParamList } from 'types/base';
import { EntityTypeName } from 'types/entities';
import { Reference, ReferenceType } from 'types/references';

const SETUP_TEXT_PAGES = ['PBF to add intro info here'];

const setupPagesStyles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start'
  },
  button: { marginTop: 20 }
});

const SetupPages = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const { data: userDetails } = useGetUserFullDetails();
  const [createReferencesCompletion, createReferencesCompletionResult] =
    useCreateReferencesSetupCompletionMutation();

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentContainerView style={setupPagesStyles.container}>
      <Text>{SETUP_TEXT_PAGES[currentPage]}</Text>
      {createReferencesCompletionResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          onPress={() => {
            if (currentPage === SETUP_TEXT_PAGES.length - 1) {
              createReferencesCompletion({
                user: userDetails.id
              });
            } else {
              setCurrentPage(currentPage + 1);
            }
          }}
          title={t('common.continue')}
          style={setupPagesStyles.button}
        />
      )}
    </TransparentContainerView>
  );
};

const addReferenceStyles = StyleSheet.create({
  refInputPair: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 4
  },
  input: { flex: 1, marginRight: 10 },
  buttonWrapper: { alignItems: 'flex-start' },
  button: { paddingVertical: 5 },
  dropdown: { width: 130, marginRight: 10, flex: 0, height: 24 },
  dropdownText: { fontSize: 12 }
});
const AddReference = ({ groupId }: { groupId: number }) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<ReferenceType | ''>('');
  const borderColor = useThemeColor({}, 'grey');

  const { data: userDetails } = useGetUserFullDetails();
  const [createNewReference] = useCreateReferenceMutation();

  useEffect(() => {
    if (newType === 'DATE') {
      setNewValue('');
    }
  }, [newType]);

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentView>
      <TransparentView style={addReferenceStyles.refInputPair}>
        <DropDown
          value={newType}
          items={[
            { value: 'NAME', label: 'Name' },
            { value: 'ACCOUNT_NUMBER', label: 'Account number' },
            { value: 'USERNAME', label: 'Username' },
            { value: 'PASSWORD', label: 'Password' },
            { value: 'WEBSITE', label: 'Website' },
            { value: 'NOTE', label: 'Note' },
            { value: 'ADDRESS', label: 'Address' },
            { value: 'PHONE_NUMBER', label: 'Phone number' },
            { value: 'DATE', label: 'Date' },
            { value: 'OTHER', label: 'Other' }
          ]}
          setFormValues={(value) => {
            setNewType(value);
          }}
          listMode="MODAL"
          dropdownPlaceholder={t('common.type')}
          containerStyle={addReferenceStyles.dropdown}
          textStyle={addReferenceStyles.dropdownText}
          style={{ borderColor }}
        />
        <TextInput
          value={newName}
          onChangeText={setNewName}
          style={addReferenceStyles.input}
          placeholder={t('common.name')}
        />
        {newType === 'DATE' ? (
          <DateTimeTextInput
            value={newValue ? new Date(newValue) : null}
            onValueChange={(newDateValue: Date) => {
              setNewValue(dayjs(newDateValue).format('YYYY-MM-DD'));
            }}
            mode="date"
            textInputStyle={addReferenceStyles.input}
          />
        ) : (
          <TextInput
            value={newValue}
            onChangeText={setNewValue}
            style={addReferenceStyles.input}
            placeholder={t('common.value')}
          />
        )}
      </TransparentView>
      <TransparentView style={addReferenceStyles.buttonWrapper}>
        <Button
          style={addReferenceStyles.button}
          disabled={!newName || !newValue || !newType}
          title={t('common.add')}
          onPress={async () => {
            try {
              setNewName('');
              setNewValue('');
              await createNewReference({
                name: newName,
                value: newValue,
                type: newType || 'OTHER',
                group: groupId,
                created_by: userDetails.id
              }).unwrap();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }}
        />
      </TransparentView>
    </TransparentView>
  );
};

const AddReferenceGroup = ({
  entityId,
  tagName
}: {
  entityId?: number;
  tagName?: string;
}) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const { data: userDetails } = useGetUserFullDetails();
  const [createNewReferenceGroup] = useCreateReferenceGroupMutation();

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentView>
      <TransparentView style={addReferenceStyles.refInputPair}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          style={addReferenceStyles.input}
        />
        <TransparentView style={addReferenceStyles.buttonWrapper}>
          <Button
            style={addReferenceStyles.button}
            disabled={!newName}
            title={t('common.add')}
            onPress={async () => {
              try {
                setNewName('');
                await createNewReferenceGroup({
                  name: newName,
                  entities: entityId ? [entityId] : [],
                  tags: tagName ? [tagName] : [],
                  created_by: userDetails.id
                }).unwrap();
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
          />
        </TransparentView>
      </TransparentView>
    </TransparentView>
  );
};

const passwordModalStyles = StyleSheet.create({
  passText: { marginBottom: 10 },
  passwordInput: { marginBottom: 10 }
});
const PasswordModal = ({
  onRequestClose,
  visible,
  reference
}: {
  onRequestClose: () => void;
  visible: boolean;
  reference: Reference;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [retrievePass, retrievePassResult] =
    useRetrievePasswordReferenceMutation();
  return (
    <Modal
      onRequestClose={() => {
        setValue('');
        setAccountPassword('');
        onRequestClose();
      }}
      visible={visible}
    >
      <TransparentView>
        <Text style={passwordModalStyles.passText}>
          {reference.name}: {value || '●●●●●●'}
        </Text>
        {!value && (
          <TransparentView>
            <Text>{t('components.referenceItem.passwordModal.blurb')}</Text>
            <PasswordInput
              style={passwordModalStyles.passwordInput}
              onChangeText={setAccountPassword}
              value={accountPassword}
            />

            {retrievePassResult.isLoading ? (
              <PaddedSpinner />
            ) : (
              <Button
                title={t('common.show')}
                onPress={async () => {
                  try {
                    const passObj = await retrievePass({
                      reference: reference.id,
                      password: accountPassword
                    }).unwrap();
                    setValue(passObj.value);
                  } catch (err) {
                    Toast.show({
                      type: 'error',
                      text1: t('common.errors.generic')
                    });
                  }
                }}
                disabled={!accountPassword}
              />
            )}
          </TransparentView>
        )}
      </TransparentView>
    </Modal>
  );
};

const refItemsStyles = StyleSheet.create({
  nameStyle: { marginRight: 20, fontWeight: 'bold' },
  refPair: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  actionIcon: {
    marginLeft: 10
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10
  },
  editingInput: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    height: 25,
    marginRight: 5,
    minWidth: 80,
    width: 'auto'
  }
});
const ReferenceItem = ({ reference }: { reference: Reference }) => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const { data: referenceGroups } = useGetAllReferenceGroupsQuery();
  const { t } = useTranslation();
  const [newName, setNewName] = useState(reference.name);
  const [newValue, setNewValue] = useState(reference.value);

  const [updateReference, updateReferenceResult] = useUpdateReferenceMutation();
  const [deleteReference] = useDeleteReferenceMutation();

  const resetValues = useCallback(() => {
    setNewName(reference.name);
    setNewValue(reference.value);
  }, [reference.value, reference.name]);

  useEffect(() => {
    resetValues();
  }, [resetValues]);

  if (!referenceGroups) {
    return null;
  }

  const isLoading = updateReferenceResult.isLoading;

  if (isLoading) {
    return <SmallSpinner />;
  }

  const group = referenceGroups.byId[reference.group];

  return (
    <TransparentView style={refItemsStyles.refPair}>
      {editing ? (
        <TransparentView style={refItemsStyles.editingContainer}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            style={refItemsStyles.editingInput}
            placeholder={t('common.name')}
          />
          {reference.type === 'DATE' ? (
            <DateTimeTextInput
              value={newValue ? new Date(newValue) : null}
              onValueChange={(newDateValue: Date) => {
                setNewValue(dayjs(newDateValue).format('YYYY-MM-DD'));
              }}
              mode="date"
              textInputStyle={refItemsStyles.editingInput}
            />
          ) : (
            <TextInput
              value={newValue}
              onChangeText={setNewValue}
              style={refItemsStyles.editingInput}
              placeholder={t('common.value')}
            />
          )}
          <SafePressable
            onPress={() => {
              updateReference({
                id: reference.id,
                name: newName,
                value: newValue
              });
              setEditing(false);
            }}
          >
            <Feather
              name="check"
              size={20}
              color="green"
              style={refItemsStyles.actionIcon}
            />
          </SafePressable>
          <SafePressable
            onPress={() => {
              setEditing(false);
              resetValues();
            }}
          >
            <Feather
              name="x"
              size={20}
              color="red"
              style={refItemsStyles.actionIcon}
            />
          </SafePressable>
        </TransparentView>
      ) : (
        <>
          <Text style={refItemsStyles.nameStyle}>{reference.name}</Text>
          <Text>
            {reference.type === 'PASSWORD' ? '●●●●●●' : reference.value}
          </Text>
        </>
      )}
      {!editing && (
        <>
          {reference.type === 'DATE' && (
            <SafePressable
              onPress={() => {
                navigation.navigate('AddTask', {
                  title: reference.name,
                  date: reference.value,
                  entities: group.entities,
                  tags: group.tags,
                  type: 'DUE_DATE'
                });
              }}
            >
              <Feather
                name="plus"
                size={30}
                color="green"
                style={refItemsStyles.actionIcon}
              />
            </SafePressable>
          )}
          {reference.type === 'PASSWORD' && (
            <SafePressable
              onPress={() => {
                setShowPasswordModal(true);
              }}
            >
              <Feather
                name="eye"
                size={20}
                color="green"
                style={refItemsStyles.actionIcon}
              />
            </SafePressable>
          )}
          <SafePressable
            onPress={() => {
              setEditing(true);
            }}
          >
            <Feather
              name="edit"
              size={20}
              color="orange"
              style={refItemsStyles.actionIcon}
            />
          </SafePressable>
          <SafePressable
            onPress={() => {
              deleteReference({ id: reference.id });
            }}
          >
            <Feather
              name="trash"
              size={20}
              color="red"
              style={refItemsStyles.actionIcon}
            />
          </SafePressable>
        </>
      )}
      <PasswordModal
        onRequestClose={() => setShowPasswordModal(false)}
        visible={showPasswordModal}
        reference={reference}
      />
    </TransparentView>
  );
};

const entityRefStyles = StyleSheet.create({
  container: { padding: 10, marginBottom: 10, width: '100%' },
  titleBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nameInput: {
    minWidth: 120,
    width: 'auto',
    fontSize: 14
  },
  nameTitle: { fontSize: 16 }
});

const ReferenceGroupItem = ({ groupId }: { groupId: number }) => {
  const [editing, setEditing] = useState(false);
  const references = useSelector(selectReferencesByGroupId(groupId));
  const refGroup = useSelector(selectReferenceById(groupId));
  const [newName, setNewName] = useState(refGroup?.name || '');
  const { t } = useTranslation();
  const [updateGroup, updateGroupResult] = useUpdateReferenceGroupMutation();
  const [deleteGroup] = useDeleteReferenceGroupMutation();
  const [deletingGroup, setDeletingGroup] = useState(false);

  const refViews = references
    .filter((ref) => !!ref?.id)
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .map((ref) => <ReferenceItem reference={ref} key={ref.id} />);

  if (!refGroup) {
    return null;
  }

  const isLoading = updateGroupResult.isLoading;

  return (
    <WhiteBox style={entityRefStyles.container}>
      <TransparentView style={entityRefStyles.titleBox}>
        {isLoading ? (
          <SmallSpinner />
        ) : editing ? (
          <>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={t('common.name')}
              style={entityRefStyles.nameInput}
            />
            <SafePressable
              onPress={() => {
                updateGroup({
                  id: refGroup.id,
                  name: newName
                });
                setEditing(false);
              }}
            >
              <Feather
                name="check"
                size={20}
                color="green"
                style={refItemsStyles.actionIcon}
              />
            </SafePressable>
            <SafePressable
              onPress={() => {
                setEditing(false);
                setNewName('');
              }}
            >
              <Feather
                name="x"
                size={20}
                color="red"
                style={refItemsStyles.actionIcon}
              />
            </SafePressable>
          </>
        ) : (
          <Text style={entityRefStyles.nameTitle}>{refGroup.name}</Text>
        )}
        {!editing && (
          <>
            <SafePressable
              onPress={() => {
                setEditing(true);
              }}
            >
              <Feather
                name="edit"
                size={20}
                color="orange"
                style={refItemsStyles.actionIcon}
              />
            </SafePressable>
            <SafePressable
              onPress={() => {
                setDeletingGroup(true);
              }}
            >
              <Feather
                name="trash"
                size={20}
                color="red"
                style={refItemsStyles.actionIcon}
              />
            </SafePressable>
          </>
        )}
      </TransparentView>
      {refViews}
      <AddReference groupId={groupId} />
      <YesNoModal
        title={t('components.referencesList.deletingGroup')}
        question={t('components.referencesList.deletingGroupConfirmation')}
        visible={!!deletingGroup}
        onYes={() => deleteGroup({ id: refGroup.id })}
        onNo={() => {
          setDeletingGroup(false);
        }}
      />
    </WhiteBox>
  );
};

const EntityReferences = ({ entityId }: { entityId: number }) => {
  const referenceGroups = useSelector(
    selectReferenceGroupsByEntityId(entityId)
  );
  const entity = useEntityById(entityId);

  if (!entity) {
    return null;
  }

  const refViews = referenceGroups
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .filter((refGroup) => !!refGroup?.id)
    .map((refGroup) => (
      <ReferenceGroupItem groupId={refGroup.id} key={refGroup.id} />
    ));

  return (
    <TransparentView style={entityRefStyles.container}>
      <Text style={entityRefStyles.nameTitle}>{entity.name}</Text>
      {refViews}
      <AddReferenceGroup entityId={entityId} />
    </TransparentView>
  );
};

const TagReferences = ({ tagName }: { tagName: string }) => {
  const { t } = useTranslation();
  const referenceGroups = useSelector(selectReferenceGroupsByTagName(tagName));

  const refViews = referenceGroups
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .filter((refGroup) => !!refGroup?.id)
    .map((refGroup) => (
      <ReferenceGroupItem groupId={refGroup.id} key={refGroup.id} />
    ));

  return (
    <TransparentView style={entityRefStyles.container}>
      <Text style={entityRefStyles.nameTitle}>{t(`tags.${tagName}`)}</Text>
      {refViews}
      <AddReferenceGroup tagName={tagName} />
    </TransparentView>
  );
};

const FlatReferencesList = ({
  entities,
  tags,
  tagsFirst
}: {
  entities?: number[];
  tags?: string[];
  tagsFirst?: boolean;
}) => {
  const tagViews = tags
    ? tags.map((tagName) => <TagReferences tagName={tagName} key={tagName} />)
    : null;

  const entityViews = entities
    ? entities.map((entityId) => (
        <EntityReferences entityId={entityId} key={entityId} />
      ))
    : null;

  const content = tagsFirst ? (
    <>
      {tagViews}
      {entityViews}
    </>
  ) : (
    <>
      {entityViews}
      {tagViews}
    </>
  );
  return <TransparentView>{content}</TransparentView>;
};

const referencesListStyles = {
  categoryHeader: { fontSize: 20 },
  container: { padding: 10 },
  categorySection: { marginBottom: 30 }
};

export default function ReferencesList({
  entities,
  entityTypes,
  tags,
  tagsFirst,
  categories,
  showCategoryHeaders
}: {
  entities?: number[];
  entityTypes?: EntityTypeName[];
  tags?: string[];
  tagsFirst?: boolean;
  categories?: number[];
  showCategoryHeaders?: boolean;
}) {
  const { t } = useTranslation();
  const { data: allEntities } = useGetAllEntitiesQuery();
  const { data: memberEntities } = useGetMemberEntitiesQuery();
  const { data: allCategories } = useGetAllCategoriesQuery();
  const { data: allTags } = useGetAllTagsQuery();
  const { data: allReferenceGroups, isLoading: isLoadingReferenceGroups } =
    useGetAllReferenceGroupsQuery();
  const { isLoading: isLoadingReferences } = useGetAllReferencesQuery(); // Pull refs
  const { data: referenceCompetions } =
    useGetReferencesSetupCompletionsQuery(undefined);

  const relevantEntities = useEntities({
    entities,
    entityTypes,
    tags,
    categories
  });

  if (
    isLoadingReferenceGroups ||
    isLoadingReferences ||
    !allEntities ||
    !memberEntities ||
    !allCategories ||
    !allTags ||
    !allReferenceGroups ||
    !referenceCompetions
  ) {
    return <PaddedSpinner />;
  }

  if (referenceCompetions.length === 0) {
    return <SetupPages />;
  }

  const tagsToShow = (
    tags ||
    Array(
      ...new Set([
        ...Object.keys(INFO_CATEGORY_TAGS),
        ...Object.keys(allReferenceGroups.byTagName)
      ])
    )
  ).filter((tagName) => {
    if (tags && tags.includes(tagName)) {
      return true;
    }
    if (categories) {
      for (const category of categories) {
        const categoryObj = allCategories.byId[category];
        if (INFO_CATEGORY_TAGS[tagName] === categoryObj.name) {
          return true;
        }
        if (allTags[categoryObj.name]?.includes(tagName)) {
          return true;
        }
      }
    }
    if (!(categories || entities || entityTypes || tags)) {
      // If no args are provided then we show everything
      return Object.keys(allReferenceGroups.byTagName).includes(tagName);
    }
    return false;
  });

  const entitiesToShow: number[] =
    categories || entities || entityTypes || tags
      ? relevantEntities
      : Object.keys(memberEntities.byId)
          .map((id) => parseInt(id))
          .filter((entityId) => {
            return Object.keys(allReferenceGroups.byEntity)
              .map((e) => parseInt(e))
              .includes(entityId);
          });

  const tagsAndEntitiesToShowByCategory: {
    [key: number]: { tags: string[]; entities: number[] };
  } = {};

  for (const tag of tagsToShow) {
    const cat = tag.split('__')[0];
    const catId = allCategories.byName[cat].id;
    if (!tagsAndEntitiesToShowByCategory[catId]) {
      tagsAndEntitiesToShowByCategory[catId] = { tags: [], entities: [] };
    }
    tagsAndEntitiesToShowByCategory[catId].tags.push(tag);
  }

  for (const entity of entitiesToShow) {
    const catId = allEntities.byId[entity].category;
    if (catId) {
      if (!tagsAndEntitiesToShowByCategory[catId]) {
        tagsAndEntitiesToShowByCategory[catId] = { tags: [], entities: [] };
      }
      tagsAndEntitiesToShowByCategory[catId].entities.push(entity);
    }
  }

  let categoryName = '';
  let entityNames = '';
  if (categories) {
    const categoryNames = categories.map(
      (categoryId) => allCategories.byId[categoryId].name
    );

    categoryName = categoryNames
      .map((name) => t(`categories.${name}`))
      .join(' and ');

    entityNames = (Object.keys(ENTITY_TYPE_TO_CATEGORY) as EntityTypeName[])
      .filter((entityTypeName) => {
        const name = ENTITY_TYPE_TO_CATEGORY[entityTypeName];
        return name && categoryNames.includes(name);
      })
      .map((entityTypeName) => t(`entityResourceTypeNames.${entityTypeName}`))
      .join(' or ');
  } else if (entityTypes) {
    categoryName = entityTypes
      .map((entityType) => t(`entityResourceTypeNames.${entityType}`))
      .join(' and ');

    entityNames = categoryName;
  }

  const content =
    Object.keys(tagsAndEntitiesToShowByCategory).length > 0 ? (
      Object.keys(tagsAndEntitiesToShowByCategory).map((categoryId) => {
        const categoryIdNumber = parseInt(categoryId);
        return (
          <TransparentView
            key={categoryIdNumber}
            style={referencesListStyles.categorySection}
          >
            {showCategoryHeaders && (
              <Text style={referencesListStyles.categoryHeader}>
                {categoryIdNumber === -1
                  ? ''
                  : t(
                      `categories.${allCategories.byId[categoryIdNumber].name}`
                    )}
              </Text>
            )}
            <FlatReferencesList
              entities={
                tagsAndEntitiesToShowByCategory[categoryIdNumber].entities
              }
              tags={tagsAndEntitiesToShowByCategory[categoryIdNumber].tags}
              tagsFirst={tagsFirst}
            />
          </TransparentView>
        );
      })
    ) : (
      <Text>
        {categoryName && entityNames
          ? t('components.referencesList.noReferences', {
              categoryName,
              entityNames
            })
          : t('components.referencesList.noReferencesDefault')}
      </Text>
    );

  return (
    <TransparentFullPageScrollView style={referencesListStyles.container}>
      {content}
    </TransparentFullPageScrollView>
  );
}
