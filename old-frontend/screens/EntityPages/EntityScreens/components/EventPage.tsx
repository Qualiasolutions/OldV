import {
  useCreateEntityMutation,
  useGetAllEntitiesQuery,
  useGetMemberEntitiesQuery,
  useUpdateEntityWithoutCacheInvalidationMutation
} from 'reduxStore/services/api/entities';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import {
  TransparentScrollView,
  WhiteFullPageScrollView
} from 'components/molecules/ScrollViewComponents';
import { StyleSheet } from 'react-native';
import {
  AlmostBlackText,
  BlackText,
  PrimaryText
} from 'components/molecules/TextComponents';
import { TextInput, useThemeColor } from 'components/Themed';
import EventListLink from 'components/molecules/EventListLink';
import { Modal } from 'components/molecules/Modals';
import { useCallback, useEffect, useState } from 'react';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MemberSelector from 'components/forms/components/MemberSelector';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { SmallButton } from 'components/molecules/ButtonComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';

const useStyle = function () {
  return StyleSheet.create({
    container: {
      paddingTop: 10,
      paddingBottom: 100
    },
    closeCircle: { alignSelf: 'flex-end' },
    addNewContainer: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20
    },
    addNewContainerOuter: { width: '100%' },
    addNewHeader: {
      fontSize: 18
    },
    addNewButton: {
      height: 37,
      width: 152,
      borderRadius: 10,
      marginTop: 26,
      justifyContent: 'center',
      alignItems: 'center'
    },
    input: { width: '100%', flex: 0, marginVertical: 20 },
    info: {
      fontSize: 16
    },
    infoContainer: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 20
    },
    rightContainer: {
      marginLeft: 20
    },
    addNewLink: { marginTop: 20 }
  });
};

export default function EventScreen({ entityId }: { entityId: number }) {
  const [addNewModal, setAddNewModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [newMembers, setNewMembers] = useState<number[]>([]);
  const [createTrigger, createTriggerResult] = useCreateEntityMutation();
  const [updateTrigger] = useUpdateEntityWithoutCacheInvalidationMutation();

  const { t } = useTranslation();
  const { data: userData } = useGetUserFullDetails();
  const { data: allEntities, isFetching: isLoadingEntities } =
    useGetAllEntitiesQuery();
  const { data: memberEntities, isFetching: isLoadingMemberEntities } =
    useGetMemberEntitiesQuery();
  const entityData = allEntities?.byId[entityId];

  const styles = useStyle();

  const isLoading =
    isLoadingEntities ||
    isLoadingMemberEntities ||
    createTriggerResult.isLoading;

  useEffect(() => {
    if (userData) {
      setNewMembers([userData.id]);
    }
  }, [userData]);

  const childEntityIds = entityData?.child_entities || [];

  const childEntityList = childEntityIds
    .filter((id) => !!memberEntities?.byId[id])
    .map((id) => {
      return (
        <EventListLink
          key={id}
          text={allEntities?.byId[id].name || ''}
          toScreen="EntityScreen"
          toScreenParams={{ entityId: id }}
          navMethod="push"
          selected={!allEntities?.byId[id].hidden}
          subType={allEntities?.byId[id].subtype}
          onSelect={async () => {
            const res = (await updateTrigger({
              resourcetype: allEntities?.byId[id].resourcetype,
              id,
              hidden: !allEntities?.byId[id].hidden
            })) as any;

            if (res && res?.error && res?.error.status >= 400) {
              throw Error('Network request error');
            }
          }}
        />
      );
    });

  const customLink = isLoading ? (
    <PaddedSpinner style={styles.addNewLink} />
  ) : (
    <EventListLink
      text="Add New"
      onPressContainer={() => {
        setAddNewModal(true);
      }}
      subType="add"
      style={styles.addNewLink}
    />
  );

  const onAddNew = useCallback(() => {
    setAddNewModal(false);
    createTrigger({
      resourcetype: 'EventSubentity',
      name: itemName,
      parent: entityId,
      members: newMembers
    });
  }, [setAddNewModal, createTrigger, entityId, itemName, newMembers]);

  const closeAddNewModal = useCallback(() => {
    setAddNewModal(false);
  }, [setAddNewModal]);

  return (
    <WhiteFullPageScrollView>
      <TransparentView style={styles.infoContainer}>
        <FontAwesome
          name="thumb-tack"
          size={20}
          style={{
            transform: [{ rotateZ: '45deg' }]
          }}
          color={useThemeColor({}, 'primary')}
        />
        <TransparentView style={styles.rightContainer}>
          <BlackText
            text={t('screens.eventPage.thingsToDo')}
            style={styles.info}
          />
          <AlmostBlackText
            text={t('common.pleaseSelect')}
            style={styles.info}
          />
        </TransparentView>
      </TransparentView>
      <TransparentPaddedView style={styles.container}>
        {childEntityList}
        {entityData?.resourcetype === 'Event' && (
          <EventListLink
            text={t('screens.eventPage.guestList')}
            toScreen="GuestList"
            toScreenParams={{ entityId: entityId }}
            navMethod="navigate"
            selected={true}
            subType={'guest_list'}
          />
        )}
        {customLink}
      </TransparentPaddedView>

      <Modal
        visible={addNewModal}
        boxStyle={styles.addNewContainer}
        onRequestClose={() => setAddNewModal(false)}
      >
        <TransparentScrollView
          contentContainerStyle={styles.addNewContainer}
          style={styles.addNewContainerOuter}
        >
          <Ionicons
            name="close-circle"
            size={30}
            style={styles.closeCircle}
            onPress={closeAddNewModal}
          />
          <PrimaryText text={t('common.addNew')} style={styles.addNewHeader} />
          <TextInput
            style={styles.input}
            onChangeText={setItemName}
            placeholder={t('common.addTitle')}
          />
          <MemberSelector
            values={newMembers}
            onValueChange={(selectedMembers) => {
              setNewMembers(selectedMembers);
            }}
          />
          <SmallButton
            disabled={!itemName || newMembers.length === 0}
            onPress={onAddNew}
            style={styles.addNewButton}
            title={t('common.save')}
          />
        </TransparentScrollView>
      </Modal>
    </WhiteFullPageScrollView>
  );
}
