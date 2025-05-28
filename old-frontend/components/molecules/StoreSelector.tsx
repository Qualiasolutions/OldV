import { Text, TextInput } from 'components/Themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import {
  useCreateShoppingListStoreMutation,
  useDeleteShoppingListStoreMutation,
  useGetAllShoppingListStoresQuery,
  useUpdateShoppingListStoreMutation
} from 'reduxStore/services/api/lists';
import { TransparentView } from './ViewComponents';
import { StyleSheet } from 'react-native';
import DropDown from 'components/forms/components/DropDown';
import { Modal, YesNoModal } from './Modals';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Button, SmallButton } from './ButtonComponents';
import { TouchableOpacity } from './TouchableOpacityComponents';
import { Feather } from '@expo/vector-icons';
import { ShoppingListStore } from 'types/lists';
import { TransparentScrollView } from './ScrollViewComponents';

const styles = StyleSheet.create({
  buttonWrapper: { alignItems: 'flex-start', flexDirection: 'row' },
  storeSelectorDropdown: { flexShrink: 1 },
  addStoreNameInput: {
    marginBottom: 10,
    width: '100%'
  },
  addStoreModalContent: { alignItems: 'center' },
  dropdownContainer: { maxWidth: 120 },
  dropdownText: { fontSize: 11 },
  manageStoreListing: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  manageStoreListingText: {
    marginRight: 10
  },
  manageStoreListingActionIcon: {
    marginRight: 10
  },
  manageStoreListings: {
    flexGrow: 0,
    flexShrink: 1
  },
  editStoreNameInput: {},
  doneButton: { marginTop: 10 }
});

const ManageStoreListing = ({ store }: { store: ShoppingListStore }) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newStoreName, setNewStoreName] = useState(store.name);
  const [updateStore] = useUpdateShoppingListStoreMutation();
  const [deleteStore] = useDeleteShoppingListStoreMutation();
  const { t } = useTranslation();

  return (
    <>
      <TransparentView style={styles.manageStoreListing}>
        {editing ? (
          <TextInput
            value={newStoreName}
            onChangeText={setNewStoreName}
            style={styles.editStoreNameInput}
            autoFocus={true}
            onBlur={() => {
              // Set a timeout because otherwise the update is sometimes not processed
              setTimeout(() => {
                setEditing(false);
                setNewStoreName(store.name);
              }, 100);
            }}
          />
        ) : (
          <Text style={styles.manageStoreListingText}>{store.name}</Text>
        )}

        {editing ? (
          <>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await updateStore({
                    id: store.id,
                    name: newStoreName
                  });
                  setEditing(false);
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              style={styles.manageStoreListingActionIcon}
            >
              <Feather name="check" color="green" size={24} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => {
                setDeleting(true);
              }}
              style={styles.manageStoreListingActionIcon}
            >
              <Feather name="x" color="red" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setEditing(true);
              }}
              style={styles.manageStoreListingActionIcon}
            >
              <Feather name="edit" color="orange" size={24} />
            </TouchableOpacity>
          </>
        )}
      </TransparentView>
      <YesNoModal
        visible={deleting}
        onYes={async () => {
          await deleteStore(store.id).unwrap();
        }}
        onNo={() => setDeleting(false)}
        question={t('components.planningLists.storeSelector.deleteQuestion')}
      />
    </>
  );
};

export default function StoreSelector({
  onSelect,
  value
}: {
  onSelect: (storeId: number) => void;
  value: number | null;
}) {
  const { data: shoppingListStores, isLoading: isLoadingStores } =
    useGetAllShoppingListStoresQuery(undefined);

  const { data: userDetails } = useGetUserFullDetails();

  const [createStore] = useCreateShoppingListStoreMutation();

  const { t } = useTranslation();
  const [addingNew, setAddingNew] = useState(false);
  const [managingStores, setManaging] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  const isLoading = isLoadingStores || !shoppingListStores || !userDetails;
  if (isLoading) {
    return null;
  }

  const dropDownItems = shoppingListStores.ids.map((storeId) => {
    const store = shoppingListStores.byId[storeId];
    return {
      value: `${storeId}`,
      label: store.name
    };
  });

  dropDownItems.push({
    value: 'NEW',
    label: t('components.planningLists.storeSelector.addNew')
  });

  dropDownItems.push({
    value: 'MANAGE',
    label: t('components.planningLists.storeSelector.manageStores')
  });

  return (
    <TransparentView style={styles.storeSelectorDropdown}>
      <DropDown
        containerStyle={styles.dropdownContainer}
        value={`${value}`}
        items={dropDownItems}
        setFormValues={(val) => {
          if (val === 'NEW') {
            setAddingNew(true);
          } else if (val === 'MANAGE') {
            setManaging(true);
          } else {
            onSelect(val);
          }
        }}
        listMode="MODAL"
        dropdownPlaceholder={t('components.planningLists.storeSelector.store')}
        labelStyle={styles.dropdownText}
      />
      <Modal visible={addingNew} onRequestClose={() => setAddingNew(false)}>
        <TransparentView style={styles.addStoreModalContent}>
          <Text>{t('components.planningLists.storeSelector.nameBlurb')}</Text>
          <TextInput
            value={newStoreName}
            onChangeText={setNewStoreName}
            style={styles.addStoreNameInput}
          />
          <TransparentView style={styles.buttonWrapper}>
            <Button
              title={t('common.add')}
              onPress={async () => {
                try {
                  await createStore({
                    name: newStoreName,
                    created_by: userDetails.id
                  }).unwrap;
                  setNewStoreName('');
                  setAddingNew(false);
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
      </Modal>
      <Modal visible={managingStores} onRequestClose={() => setManaging(false)}>
        <TransparentView>
          <TransparentScrollView style={styles.manageStoreListings}>
            {shoppingListStores.ids.map((storeId) => {
              const store = shoppingListStores.byId[storeId];
              return <ManageStoreListing store={store} key={storeId} />;
            })}
          </TransparentScrollView>
          <SmallButton
            title={t('common.done')}
            onPress={() => setManaging(false)}
            style={styles.doneButton}
          />
        </TransparentView>
      </Modal>
    </TransparentView>
  );
}
