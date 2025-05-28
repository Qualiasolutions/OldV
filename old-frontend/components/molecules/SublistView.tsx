import { TransparentView } from 'components/molecules/ViewComponents';
import { Text, TextInput } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import {
  useDeletePlanningSublistMutation,
  useGetAllPlanningListItemsQuery,
  useGetAllPlanningListsQuery,
  useUpdatePlanningSublistMutation
} from 'reduxStore/services/api/lists';
import { StyleSheet, ViewStyle } from 'react-native';
import { useState } from 'react';
import { PlanningSublist } from 'types/lists';
import SafePressable from 'components/molecules/SafePressable';
import { Feather } from '@expo/vector-icons';
import { YesNoModal } from 'components/molecules/Modals';
import AddListItemInputPair from 'components/molecules/AddListItemInputPair';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import ListItemView from './ListItemView';

const styles = StyleSheet.create({
  listHeaderSection: { flexDirection: 'row', alignItems: 'center' },
  sublistHeader: {
    fontSize: 16,
    height: 28,
    paddingVertical: 0,
    paddingHorizontal: 5
  },
  listItemView: { paddingLeft: 10, flexDirection: 'row', alignItems: 'center' },
  actionButton: { marginLeft: 10 }
});

const SublistHeader = ({ sublist }: { sublist: PlanningSublist }) => {
  const [deleting, setDeleting] = useState(false);
  const [deleteSublist] = useDeletePlanningSublistMutation();
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const [newSublistName, setNewSublistName] = useState(sublist.title);
  const [updateSublist] = useUpdatePlanningSublistMutation();

  if (editingName) {
    return (
      <TransparentView style={styles.listHeaderSection}>
        <TextInput
          style={styles.sublistHeader}
          value={newSublistName}
          onChangeText={setNewSublistName}
          autoFocus={true}
          onBlur={() => {
            // Set a timeout because otherwise the update is sometimes not processed
            setTimeout(() => {
              setEditingName(false);
              setNewSublistName(sublist.title);
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
              await updateSublist({
                id: sublist.id,
                title: newSublistName
              }).unwrap();
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
      </TransparentView>
    );
  }

  return (
    <TransparentView style={styles.listHeaderSection}>
      <SafePressable
        onPress={() => {
          setEditingName(true);
        }}
      >
        <Text style={styles.sublistHeader}>{sublist.title}</Text>
      </SafePressable>
      <SafePressable
        onPress={() => {
          setDeleting(true);
        }}
        style={styles.actionButton}
      >
        <Feather name="trash" size={16} color="red" />
      </SafePressable>
      <SafePressable
        onPress={() => {
          setEditingName(true);
        }}
        style={styles.actionButton}
      >
        <Feather name="edit" size={16} color="orange" />
      </SafePressable>
      <YesNoModal
        title={t('components.planningLists.deleteSublistModal.title')}
        question={t('components.planningLists.deleteSublistModal.blurb')}
        visible={deleting}
        onYes={() => {
          deleteSublist(sublist.id);
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

export default function SublistView({
  sublist,
  style
}: {
  sublist: PlanningSublist;
  style?: ViewStyle;
}) {
  const { data: allListItems, isLoading: isLoadingListItems } =
    useGetAllPlanningListItemsQuery();

  const { data: allLists, isLoading: isLoadingLists } =
    useGetAllPlanningListsQuery();

  const isLoading =
    isLoadingListItems || !allListItems || isLoadingLists || !allLists;

  if (isLoading) {
    return null;
  }

  const sublistItems = allListItems.bySublist[sublist.id] || [];

  return (
    <TransparentView style={style || {}}>
      <SublistHeader sublist={sublist} />
      {sublistItems.map((itemId) => {
        const item = allListItems.byId[itemId];
        return <ListItemView item={item} key={item.id} />;
      })}
      <TransparentView style={styles.listItemView}>
        <AddListItemInputPair sublist={sublist.id} />
      </TransparentView>
    </TransparentView>
  );
}
