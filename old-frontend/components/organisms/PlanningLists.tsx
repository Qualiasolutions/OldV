import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import {
  useGetAllPlanningListsQuery,
  useGetAllPlanningSublistsQuery,
  useUpdatePlanningListMutation
} from 'reduxStore/services/api/lists';
import { StyleSheet } from 'react-native';
import { useState } from 'react';
import { Button } from 'components/molecules/ButtonComponents';
import { PlanningList } from 'types/lists';
import SafePressable from 'components/molecules/SafePressable';
import { Modal } from 'components/molecules/Modals';
import UserTags from 'components/molecules/UserTags';
import MemberSelector from 'components/forms/components/MemberSelector';
import AddListButton from 'components/molecules/AddListButton';
import AddSublistInputPair from 'components/molecules/AddSublistInputPair';
import SublistView from 'components/molecules/SublistView';
import PlanningListHeader from 'components/molecules/PlanningListHeader';
import { selectCategoryById } from 'reduxStore/slices/categories/selectors';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  categoryHeader: { fontSize: 20, marginRight: 20 },
  categoryHeaderSection: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  categoryHeaderLeft: {
    flexDirection: 'row'
  },
  listDropdownButton: {
    flexDirection: 'row'
  },
  listHeader: { fontSize: 18, marginRight: 10 },
  listHeaderSection: { flexDirection: 'row', alignItems: 'center' },
  listBox: { marginBottom: 20 },
  sublists: { paddingLeft: 10 },
  sublistView: { marginBottom: 20 },
  saveMembersButton: {
    marginTop: 20
  }
});

const PlanningListView = ({ list }: { list: PlanningList }) => {
  const { data: allSublists, isLoading: isLoadingSublists } =
    useGetAllPlanningSublistsQuery();

  const [updateList, updateListResult] = useUpdatePlanningListMutation();
  const [editingMembers, setEditingMembers] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const [newMembers, setNewMembers] = useState(list.members);
  const { t } = useTranslation();

  const isLoading = isLoadingSublists || !allSublists;

  if (isLoading) {
    return null;
  }

  const sublists = allSublists.byList[list.id] || [];

  return (
    <WhiteBox style={styles.listBox}>
      <PlanningListHeader
        list={list}
        isShoppingList={false}
        expanded={showItems}
        onClickExpand={() => setShowItems(!showItems)}
      />
      {showItems && (
        <TransparentView style={styles.sublists}>
          {sublists.map((sublistId) => {
            const sublist = allSublists.byId[sublistId];
            return (
              <SublistView
                sublist={sublist}
                key={sublistId}
                style={styles.sublistView}
              />
            );
          })}
          <AddSublistInputPair list={list.id} />
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

const CategoryPlanningLists = ({ categoryId }: { categoryId: number }) => {
  const { data: planningLists, isLoading: isLoadingPlanningLists } =
    useGetAllPlanningListsQuery();
  const category = useSelector(selectCategoryById(categoryId));
  const { t } = useTranslation();
  const [showLists, setShowLists] = useState(false);

  if (!planningLists || !category) {
    return null;
  }

  return (
    <TransparentPaddedView>
      <TransparentView style={styles.categoryHeaderSection}>
        <TransparentView style={styles.categoryHeaderLeft}>
          <Text style={styles.categoryHeader}>
            {t(`categories.${category.name}`)}
          </Text>
          {planningLists.byCategory[category.id] && (
            <SafePressable
              onPress={() => {
                setShowLists(!showLists);
              }}
              style={styles.listDropdownButton}
            >
              <Feather
                name={showLists ? 'chevron-up' : 'chevron-down'}
                size={25}
              />
              {!showLists && (
                <Text>
                  {planningLists.byCategory[category.id].length}{' '}
                  {planningLists.byCategory[category.id].length > 1
                    ? t('common.lists')
                    : t('common.list')}
                </Text>
              )}
            </SafePressable>
          )}
        </TransparentView>
        <AddListButton category={category.id} />
      </TransparentView>
      {showLists &&
        planningLists.byCategory[category.id] &&
        planningLists.byCategory[category.id].map((listId) => {
          const list = planningLists.byId[listId];
          return <PlanningListView list={list} key={listId} />;
        })}
    </TransparentPaddedView>
  );
};

export default function PlanningLists() {
  const { data: planningLists, isLoading: isLoadingPlanningLists } =
    useGetAllPlanningListsQuery();

  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const isLoading =
    isLoadingPlanningLists ||
    isLoadingCategories ||
    !planningLists ||
    !allCategories;
  if (isLoading) {
    return <FullPageSpinner />;
  }

  const categoryViews = Object.values(allCategories.byId).map((category) => (
    <CategoryPlanningLists categoryId={category.id} key={category.id} />
  ));

  return (
    <WhiteFullPageScrollView contentContainerStyle={styles.container}>
      {categoryViews}
    </WhiteFullPageScrollView>
  );
}
