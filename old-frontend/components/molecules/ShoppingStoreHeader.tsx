import { TransparentView } from 'components/molecules/ViewComponents';
import { Text, TextInput } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import {
  useDeleteShoppingListStoreMutation,
  useUpdateShoppingListStoreMutation
} from 'reduxStore/services/api/lists';
import { StyleSheet } from 'react-native';
import { useState } from 'react';
import { ShoppingListStore } from 'types/lists';
import SafePressable from 'components/molecules/SafePressable';
import { Feather } from '@expo/vector-icons';
import { YesNoModal } from './Modals';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

const styles = StyleSheet.create({
  listHeader: {
    height: 40,
    textAlignVertical: 'center',
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

export default function ShoppingStoreHeader({
  store
}: {
  store: ShoppingListStore;
}) {
  const [deleteStore] = useDeleteShoppingListStoreMutation();
  const [updateStore] = useUpdateShoppingListStoreMutation();
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newStoreName, setNewStoreName] = useState(store.name);

  const { t } = useTranslation();

  if (editingName) {
    return (
      <TransparentView style={styles.listHeaderSection}>
        <TextInput
          style={[styles.listHeader, styles.listHeaderText]}
          value={newStoreName}
          onChangeText={setNewStoreName}
          autoFocus={true}
          onBlur={() => {
            // Set a timeout because otherwise the update is sometimes not processed
            setTimeout(() => {
              setEditingName(false);
              setNewStoreName(store.name);
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
              await updateStore({
                id: store.id,
                name: newStoreName
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
        <Text style={styles.listHeaderText}>{store.name}</Text>
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
        title={t('components.planningLists.deleteStoreModal.title')}
        question={t('components.planningLists.deleteStoreModal.blurb')}
        visible={deleting}
        onYes={() => {
          deleteStore(store.id);
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
}
