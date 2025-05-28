import { TransparentView } from 'components/molecules/ViewComponents';
import {
  useDeletePlanningListItemMutation,
  useDeleteShoppingListItemMutation,
  useGetAllPlanningListsQuery,
  useGetAllPlanningSublistsQuery,
  useGetAllShoppingListsQuery
} from 'reduxStore/services/api/lists';
import { StyleSheet } from 'react-native';
import { PlanningListItem, ShoppingListItem } from 'types/lists';
import { PageSubtitle } from 'components/molecules/TextComponents';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Modal } from 'components/molecules/Modals';
import { LinkButton } from './ButtonComponents';
import { useDispatch, useSelector } from 'react-redux';
import { selectListItemToAction } from 'reduxStore/slices/lists/selectors';
import { setListItemToAction } from 'reduxStore/slices/lists/actions';

const styles = StyleSheet.create({
  linkButton: { marginVertical: 6 },
  actionModalContent: {
    alignItems: 'center'
  },
  modalBox: { paddingHorizontal: 30 }
});

const isShoppingListItem = (
  item: PlanningListItem | ShoppingListItem
): item is ShoppingListItem => {
  return 'store' in item;
};

export default function ListItemActionModal() {
  const [deleteListItem] = useDeletePlanningListItemMutation();
  const [deleteShoppingListItem] = useDeleteShoppingListItemMutation();
  const { data: allSublists, isLoading: isLoadingSublists } =
    useGetAllPlanningSublistsQuery();
  const { data: allLists, isLoading: isLoadingLists } =
    useGetAllPlanningListsQuery();
  const { data: allShoppingLists, isLoading: isLoadingShoppingLists } =
    useGetAllShoppingListsQuery();

  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const item = useSelector(selectListItemToAction);
  const isShoppingList = item && isShoppingListItem(item);

  const isLoading =
    isLoadingLists ||
    isLoadingSublists ||
    isLoadingShoppingLists ||
    !allLists ||
    !allSublists ||
    !allShoppingLists;

  if (isLoading) {
    return null;
  }

  const parentSublist =
    isShoppingList || !item ? null : allSublists.byId[item?.sublist];
  const parentList = item
    ? isShoppingList
      ? allShoppingLists.byId[item.list]
      : parentSublist
      ? allLists.byId[parentSublist.list]
      : null
    : null;

  const onDismiss = () => {
    dispatch(setListItemToAction(null));
  };

  return (
    <Modal
      visible={!!item}
      onRequestClose={onDismiss}
      boxStyle={styles.modalBox}
    >
      <TransparentView style={styles.actionModalContent}>
        <PageSubtitle text={item?.title || ''} />
        <LinkButton
          onPress={() => {
            onDismiss();
            if (item) {
              if (isShoppingList) {
                deleteShoppingListItem(item.id);
              } else {
                deleteListItem(item.id);
              }
            }
          }}
          title={t('components.planningLists.itemActionModal.deleteItem')}
          style={styles.linkButton}
        />
        <LinkButton
          onPress={() => {
            if (item) {
              onDismiss();
              (navigation.navigate as any)('AddTask', {
                type: 'TASK',
                title: item.title,
                members: parentList ? parentList.members : null
              });
            }
          }}
          title={t('components.planningLists.itemActionModal.createTask')}
          style={styles.linkButton}
        />
      </TransparentView>
    </Modal>
  );
}
