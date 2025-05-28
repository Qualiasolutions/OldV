import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { useTranslation } from 'react-i18next';
import {
  useGetAllShoppingListItemsQuery,
  useGetAllShoppingListsQuery,
  useGetAllShoppingListStoresQuery,
  useUpdateShoppingListMutation
} from 'reduxStore/services/api/lists';
import { StyleSheet } from 'react-native';
import { useState } from 'react';
import { Button } from 'components/molecules/ButtonComponents';
import { ShoppingList, ShoppingListStore } from 'types/lists';
import SafePressable from 'components/molecules/SafePressable';
import { Modal } from 'components/molecules/Modals';
import UserTags from 'components/molecules/UserTags';
import MemberSelector from 'components/forms/components/MemberSelector';
import AddListButton from 'components/molecules/AddListButton';
import PlanningListHeader from 'components/molecules/PlanningListHeader';
import ListItemView from 'components/molecules/ListItemView';
import AddListItemInputPair from 'components/molecules/AddListItemInputPair';
import ShoppingStoreHeader from 'components/molecules/ShoppingStoreHeader';
import StoreDelegationButton from 'components/molecules/StoreDelegationButton';
import { Feather } from '@expo/vector-icons';
import { Text } from 'components/Themed';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  listBox: { marginBottom: 20 },
  sublists: { paddingLeft: 10 },
  sublistView: { marginBottom: 20 },
  saveMembersButton: {
    marginTop: 20
  },
  addListButtonWrapper: { marginBottom: 10, flexDirection: 'row' },
  groupByStoreButton: { paddingVertical: 5, marginHorizontal: 5 },
  listDropdownButton: { flexDirection: 'row', marginLeft: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  delegationButtonWrapper: {
    marginBottom: 4
  }
});

const ShoppingListView = ({ list }: { list: ShoppingList }) => {
  const { data: allItems, isLoading: isLoadingItems } =
    useGetAllShoppingListItemsQuery();

  const [updateList, updateListResult] = useUpdateShoppingListMutation();
  const [editingMembers, setEditingMembers] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const [newMembers, setNewMembers] = useState(list.members);
  const { t } = useTranslation();

  const isLoading = isLoadingItems || !allItems;

  if (isLoading) {
    return null;
  }

  const items = allItems.byList[list.id] || [];

  return (
    <WhiteBox style={styles.listBox}>
      <TransparentView style={styles.header}>
        <PlanningListHeader
          list={list}
          isShoppingList={true}
          expanded={showItems}
          onClickExpand={() => setShowItems(!showItems)}
          numItems={items.length}
        />
      </TransparentView>
      {showItems && (
        <TransparentView style={styles.sublists}>
          {items.map((itemId) => (
            <ListItemView key={itemId} item={allItems.byId[itemId]} />
          ))}
          <AddListItemInputPair list={list.id} isShoppingList={true} />
        </TransparentView>
      )}
      <SafePressable
        onPress={() => {
          setEditingMembers(true);
        }}
      >
        <UserTags memberIds={list.members} />
      </SafePressable>
      <Modal
        visible={editingMembers}
        onRequestClose={() => {
          setEditingMembers(false);
        }}
      >
        <MemberSelector
          values={newMembers}
          onValueChange={(selectedMembers) => {
            setNewMembers(selectedMembers);
          }}
        />
        {updateListResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            onPress={async () => {
              await updateList({
                id: list.id,
                members: newMembers
              }).unwrap();
              setEditingMembers(false);
            }}
            title={t('common.save')}
            style={styles.saveMembersButton}
          />
        )}
      </Modal>
    </WhiteBox>
  );
};

const ShoppingStoreView = ({ store }: { store: ShoppingListStore }) => {
  const { data: allItems, isLoading: isLoadingItems } =
    useGetAllShoppingListItemsQuery();
  const [showItems, setShowItems] = useState(false);
  const { t } = useTranslation();

  const isLoading = isLoadingItems || !allItems;

  if (isLoading) {
    return null;
  }

  const items = allItems.byStore[store.id || -1] || [];

  if (items.length === 0) {
    return null;
  }

  return (
    <WhiteBox style={styles.listBox}>
      <TransparentView style={styles.header}>
        <ShoppingStoreHeader store={store} />
        {
          <TouchableOpacity
            onPress={() => {
              setShowItems(!showItems);
            }}
            style={styles.listDropdownButton}
          >
            <Feather
              name={showItems ? 'chevron-up' : 'chevron-down'}
              size={25}
            />
            {!showItems && (
              <Text>
                {items.length}{' '}
                {items.length === 1 ? t('common.item') : t('common.items')}
              </Text>
            )}
          </TouchableOpacity>
        }
      </TransparentView>
      <TransparentView style={styles.delegationButtonWrapper}>
        <StoreDelegationButton storeId={store.id} />
      </TransparentView>
      {showItems && (
        <TransparentView style={styles.sublists}>
          {items.map((itemId) => (
            <ListItemView key={itemId} item={allItems.byId[itemId]} />
          ))}
        </TransparentView>
      )}
    </WhiteBox>
  );
};

export default function ShoppingLists() {
  const { data: shoppingLists, isLoading: isLoadingShoppingLists } =
    useGetAllShoppingListsQuery();
  const { data: shoppingStores, isLoading: isLoadingShoppingStores } =
    useGetAllShoppingListStoresQuery();

  const [groupByStore, setGroupByStore] = useState(false);
  const { t } = useTranslation();

  const isLoading =
    isLoadingShoppingLists ||
    !shoppingLists ||
    isLoadingShoppingStores ||
    !shoppingStores;
  if (isLoading) {
    return <FullPageSpinner />;
  }

  const content = groupByStore
    ? shoppingStores.ids.map((storeId) => {
        const store = shoppingStores.byId[storeId];
        return <ShoppingStoreView store={store} key={storeId} />;
      })
    : shoppingLists.ids.map((listId) => {
        const list = shoppingLists.byId[listId];
        return <ShoppingListView list={list} key={listId} />;
      });

  return (
    <WhiteFullPageScrollView contentContainerStyle={styles.container}>
      <TransparentPaddedView>
        <TransparentView style={styles.addListButtonWrapper}>
          <AddListButton isShoppingList={true} />
          <Button
            title={
              groupByStore
                ? t('components.shoppingLists.groupByList')
                : t('components.shoppingLists.groupByStore')
            }
            onPress={() => {
              setGroupByStore(!groupByStore);
            }}
            style={styles.groupByStoreButton}
          />
        </TransparentView>
        {content}
      </TransparentPaddedView>
    </WhiteFullPageScrollView>
  );
}
