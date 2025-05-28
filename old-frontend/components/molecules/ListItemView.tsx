import { TransparentView } from 'components/molecules/ViewComponents';
import { Text, TextInput } from 'components/Themed';
import {
  useGetAllPlanningListsQuery,
  useUpdatePlanningListItemMutation,
  useUpdateShoppingListItemMutation
} from 'reduxStore/services/api/lists';
import { StyleSheet } from 'react-native';
import { useState } from 'react';
import {
  PlanningList,
  PlanningListItem,
  ShoppingList,
  ShoppingListItem
} from 'types/lists';
import SafePressable from 'components/molecules/SafePressable';
import { Feather } from '@expo/vector-icons';
import Checkbox from 'components/molecules/Checkbox';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useTranslation } from 'react-i18next';
import StoreSelector from './StoreSelector';
import { useDispatch } from 'react-redux';
import { setListItemToAction } from 'reduxStore/slices/lists/actions';

const styles = StyleSheet.create({
  listItemView: {
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  listItemTitle: {
    paddingVertical: 0,
    paddingHorizontal: 5,
    flexShrink: 1
  },
  listItemTitleText: {
    fontSize: 14
  },
  editTextInput: { height: 26 },
  checkbox: { width: 16, height: 16 },
  actionButton: { marginLeft: 10 }
});

const isShoppingListItem = (
  item: PlanningListItem | ShoppingListItem
): item is ShoppingListItem => {
  return 'store' in item;
};

export default function ListItemView({
  item
}: {
  item: PlanningListItem | ShoppingListItem;
}) {
  const { data: allLists, isLoading: isLoadingLists } =
    useGetAllPlanningListsQuery();

  const [updateListItem] = useUpdatePlanningListItemMutation();
  const [updateShoppingListItem] = useUpdateShoppingListItemMutation();

  const [editingName, setEditingName] = useState(false);
  const [newItemName, setNewItemName] = useState(item.title);

  const isShoppingList = isShoppingListItem(item);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isLoading = isLoadingLists || !allLists;

  if (isLoading) {
    return null;
  }

  const content = editingName ? (
    <>
      <TextInput
        style={[styles.listItemTitle, styles.editTextInput]}
        value={newItemName}
        onChangeText={setNewItemName}
        autoFocus={true}
        onBlur={() => {
          // Set a timeout because otherwise the update is sometimes not processed
          setTimeout(() => {
            setEditingName(false);
            setNewItemName(item.title);
          }, 100);
        }}
      />
      <SafePressable
        onPress={() => {
          setEditingName(false);
        }}
        style={styles.actionButton}
      >
        <Feather name="x" size={20} color="red" />
      </SafePressable>
      <SafePressable
        onPress={async () => {
          try {
            setEditingName(false);
            if (isShoppingList) {
              await updateShoppingListItem({
                id: item.id,
                title: newItemName
              }).unwrap();
            } else {
              await updateListItem({
                id: item.id,
                title: newItemName
              }).unwrap();
            }
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: t('common.errors.generic')
            });
          }
        }}
        style={styles.actionButton}
      >
        <Feather name="check" size={20} color="green" />
      </SafePressable>
    </>
  ) : (
    <>
      <SafePressable
        onPress={() => setEditingName(true)}
        style={styles.listItemTitle}
      >
        <Text style={styles.listItemTitleText}>{item.title}</Text>
      </SafePressable>
      {isShoppingList && (
        <StoreSelector
          onSelect={(storeId) => {
            updateShoppingListItem({
              id: item.id,
              store: storeId
            });
          }}
          value={item.store}
        />
      )}
      <SafePressable
        onPress={() => {
          dispatch(setListItemToAction(item));
        }}
        style={styles.actionButton}
      >
        <Feather name="more-horizontal" size={24} />
      </SafePressable>
    </>
  );

  return (
    <TransparentView style={styles.listItemView}>
      <Checkbox
        checked={item.checked}
        onValueChange={async () => {
          if (isShoppingList) {
            updateShoppingListItem({
              id: item.id,
              checked: !item.checked
            });
          } else {
            updateListItem({
              id: item.id,
              checked: !item.checked
            });
          }
        }}
        style={styles.checkbox}
      />
      {content}
    </TransparentView>
  );
}
