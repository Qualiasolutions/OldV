import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteView
} from 'components/molecules/ViewComponents';
import { useTranslation } from 'react-i18next';
import {
  useDeleteEntityMutation,
  useUpdateEntityWithoutCacheInvalidationMutation
} from 'reduxStore/services/api/entities';

import { TextInput } from 'components/Themed';
import {
  useCreateListEntryMutation,
  useFormCreateListEntryMutation
} from 'reduxStore/services/api/lists';
import { EntityResponseType, isListEntity } from 'types/entities';
import { userService } from 'utils/userService';
import { UserResponse } from 'types/users';
import ListEntry from './components/ListEntry';
import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { Button } from 'components/molecules/ButtonComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import {
  ImagePicker,
  PickedFile
} from 'components/forms/components/ImagePicker';
import { Text } from 'components/Themed';
import SafePressable from 'components/molecules/SafePressable';
import { Feather } from '@expo/vector-icons';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { YesNoModal } from 'components/molecules/Modals';
import useEntityById from 'hooks/entities/useEntityById';

const styles = StyleSheet.create({
  listEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  listEntryText: {},
  newItemInputWrapper: {
    flexDirection: 'row',
    height: 40,
    marginVertical: 10
  },
  newItemInput: {
    height: '100%',
    flexGrow: 1,
    width: '50%'
  },
  submitButton: {
    height: '100%',
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: 'center'
  },
  bottomActions: {
    alignItems: 'flex-end',
    marginBottom: 100
  },
  listHeader: {
    height: 40,
    textAlignVertical: 'center',
    textAlign: 'center',
    justifyContent: 'center'
  },
  listHeaderText: { fontSize: 18 },
  listHeaderSection: { flexDirection: 'row', alignItems: 'center' },
  sublists: { paddingLeft: 10 },
  listTemplateLink: { marginLeft: 10 },
  saveTemplateButtonWrapper: { flexDirection: 'row', justifyContent: 'center' },
  saveTemplateModalContent: {
    maxWidth: 250,
    alignItems: 'center'
  }
});

const ListHeader = ({ list }: { list: EntityResponseType }) => {
  const [deleteList] = useDeleteEntityMutation();
  const [updateList] = useUpdateEntityWithoutCacheInvalidationMutation();
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newListName, setNewListName] = useState(list.name);

  const { t } = useTranslation();

  if (editingName) {
    return (
      <TransparentView style={styles.listHeaderSection}>
        <TextInput
          style={[styles.listHeader, styles.listHeaderText]}
          value={newListName}
          onChangeText={setNewListName}
          autoFocus={true}
          onBlur={() => {
            // Set a timeout because otherwise the update is sometimes not processed
            setTimeout(() => {
              setEditingName(false);
              setNewListName(list.name);
            }, 100);
          }}
        />
        <SafePressable
          onPress={() => {
            setEditingName(false);
          }}
          style={styles.listTemplateLink}
        >
          <Feather name="x" size={20} color="red" />
        </SafePressable>
        <SafePressable
          onPress={async () => {
            try {
              setEditingName(false);
              await updateList({
                id: list.id,
                name: newListName
              }).unwrap();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }}
          style={styles.listTemplateLink}
        >
          <Feather name="check" size={20} color="green" />
        </SafePressable>
      </TransparentView>
    );
  }

  return (
    <TransparentView style={styles.listHeaderSection}>
      <SafePressable
        onPress={() => {
          setEditingName(true);
        }}
        style={styles.listHeader}
      >
        <Text style={styles.listHeaderText}>{list.name}</Text>
      </SafePressable>
      <SafePressable
        onPress={() => {
          setDeleting(true);
        }}
        style={styles.listTemplateLink}
      >
        <Feather name="trash" size={20} color="red" />
      </SafePressable>
      <SafePressable
        onPress={() => {
          setEditingName(true);
        }}
        style={styles.listTemplateLink}
      >
        <Feather name="edit" size={20} color="orange" />
      </SafePressable>
      <YesNoModal
        title={t('components.planningLists.deleteListModal.title')}
        question={t('components.planningLists.deleteListModal.blurb')}
        visible={deleting}
        onYes={() => {
          deleteList({ id: list.id });
        }}
        onNo={() => {
          setDeleting(false);
        }}
        onRequestClose={() => {
          setDeleting(false);
        }}
      />
    </TransparentView>
  );
};

export default function ListEntityPage({
  entityId,
  hideHeader
}: {
  entityId: number;
  hideHeader?: boolean;
}) {
  const { data: userFullDetails } = useGetUserFullDetails();
  const entityData = useEntityById(entityId);
  const { t } = useTranslation();
  const [newEntryTitle, setNewEntryTitle] = useState<string>('');
  const [createListEntry] = useCreateListEntryMutation();
  const [formCreateListEntry] = useFormCreateListEntryMutation();

  const listEntryComponents = useMemo(() => {
    if (!(entityData && isListEntity(entityData))) {
      return null;
    }
    const sortedListEntries = entityData.list_entries
      .slice()
      .sort((a, b) => a.id - b.id);

    return sortedListEntries.map((listEntry) => (
      <ListEntry listEntry={listEntry} key={listEntry.id} />
    ));
  }, [entityData]);

  if (!entityData || !isListEntity(entityData)) {
    return null;
  }

  const memberIds: number[] = Array(...new Set(entityData.members));
  const members: UserResponse[] = [];

  if (userFullDetails) {
    memberIds.forEach((id: number) => {
      members.push(
        userService.getUserByIdFromUserFullDetails(id, userFullDetails)!
      );
    });
  }

  const createEntry = () => {
    if (newEntryTitle) {
      createListEntry({
        list: entityData.id,
        title: newEntryTitle
      });
      setNewEntryTitle('');
    }
  };

  const createImageEntry = (image: PickedFile) => {
    const data = new FormData();
    data.append('image', image as any);
    data.append('list', `${entityData.id}`);
    formCreateListEntry({ formData: data });
  };

  return (
    <WhiteFullPageScrollView>
      <WhiteView>
        {!hideHeader && (
          <TransparentPaddedView>
            <ListHeader list={entityData} />
          </TransparentPaddedView>
        )}
        {listEntryComponents}
        <TransparentPaddedView style={styles.bottomActions}>
          <TransparentView style={styles.newItemInputWrapper}>
            <TextInput
              value={newEntryTitle}
              onChangeText={(value) => setNewEntryTitle(value)}
              blurOnSubmit={false}
              onSubmitEditing={createEntry}
              placeholder={t('screens.listEntity.typeOrUpload')}
              style={styles.newItemInput}
            />
            <Button
              title={t('common.add')}
              onPress={createEntry}
              style={styles.submitButton}
              disabled={!newEntryTitle}
            />
          </TransparentView>
          <TransparentView style={styles.newItemInputWrapper}>
            <ImagePicker
              onImageSelect={(image: PickedFile) => {
                createImageEntry(image);
              }}
              backgroundColor="transparent"
              PressableComponent={({ onPress }: { onPress: () => void }) => (
                <Button
                  title="Add Image"
                  onPress={onPress}
                  style={styles.submitButton}
                />
              )}
              modalOffsets={{
                top: 30,
                left: -50
              }}
            />
          </TransparentView>
        </TransparentPaddedView>
      </WhiteView>
    </WhiteFullPageScrollView>
  );
}
