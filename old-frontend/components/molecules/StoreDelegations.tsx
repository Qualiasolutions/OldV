import { Text } from 'components/Themed';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import {
  useCreateStoreDelegationsMutation,
  useDeleteStoreDelegationMutation,
  useGetAllShoppingListsQuery,
  useGetAllShoppingListStoresQuery,
  useGetAllStoreDelegationsQuery
} from 'reduxStore/services/api/lists';
import { selectListsForStoreId } from 'reduxStore/slices/lists/selectors';
import { ShoppingListDelegation } from 'types/lists';
import UserWithColor from './UserWithColor';
import { TransparentView } from './ViewComponents';
import { UserResponse } from 'types/users';
import DropDown from 'components/forms/components/DropDown';
import { TouchableOpacity } from './TouchableOpacityComponents';
import { Feather } from '@expo/vector-icons';
import { PaddedSpinner } from './Spinners';
import PhoneNumberMemberFinder from './PhoneNumberMemberFinder';
import { TransparentScrollView } from './ScrollViewComponents';
import { useGetUserMinimalDetailsFromIdQuery } from 'reduxStore/services/api/user';

const styles = StyleSheet.create({
  dropdownContainer: { maxWidth: 150 },
  familyMemberDelegations: {
    marginBottom: 20
  },
  listedDelegationWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userWithColourWrapper: {
    marginBottom: 5
  },
  addExternalWrapper: {
    marginTop: 20,
    width: '100%'
  },
  modalContainer: { width: '100%', flexGrow: 0 },
  modalContainerInner: { paddingBottom: 50 },
  storeTitle: { fontSize: 20, marginBottom: 10 }
});

const ListedDelegation = ({
  delegation
}: {
  delegation: ShoppingListDelegation;
}) => {
  const { data: userDetails } = useGetUserFullDetails();
  const [deleteDelegation] = useDeleteStoreDelegationMutation();

  if (!userDetails) {
    return null;
  }
  return (
    <TransparentView style={styles.listedDelegationWrapper}>
      <Text>{delegation.list_name}</Text>
      <TouchableOpacity
        onPress={() => {
          deleteDelegation(delegation.id);
        }}
      >
        <Feather name="x" color="red" size={24} />
      </TouchableOpacity>
    </TransparentView>
  );
};

const DelegationsList = ({
  userId,
  storeId,
  onDelegateSuccess
}: {
  userId: number;
  storeId: number;
  onDelegateSuccess?: () => void;
}) => {
  const { data: delegations } = useGetAllStoreDelegationsQuery();
  const { data: shoppingLists } = useGetAllShoppingListsQuery();
  const [createDelegations, createDelegationsResult] =
    useCreateStoreDelegationsMutation();
  const storeLists = useSelector(selectListsForStoreId(storeId));
  const { data: userDetails } = useGetUserFullDetails();
  const { t } = useTranslation();

  if (!delegations || !shoppingLists || !userDetails) {
    return null;
  }

  const userDelegations = delegations.ids
    .filter((id) => delegations.byId[id].delegatee === userId)
    .map((id) => delegations.byId[id])
    .filter((delegation) => delegation.store === storeId);

  const assignedLists = userDelegations.map((delegation) => delegation.list);
  const unassignedLists = storeLists.filter(
    (id) => !assignedLists.includes(id)
  );
  const dropdownOptions = unassignedLists.map((listId) => {
    const list = shoppingLists.byId[listId];
    return {
      label: list.name,
      value: list.id
    };
  });

  return (
    <TransparentView>
      {userDelegations.map((delegation) => (
        <ListedDelegation delegation={delegation} key={delegation.id} />
      ))}
      {createDelegationsResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <DropDown
          items={dropdownOptions}
          value={''}
          setFormValues={async (val) => {
            await createDelegations([
              {
                store: storeId,
                list: val,
                delegatee: userId,
                delegator: userDetails.id
              }
            ]).unwrap();
            if (onDelegateSuccess) {
              onDelegateSuccess();
            }
          }}
          containerStyle={styles.dropdownContainer}
          dropdownPlaceholder={t(
            'components.shoppingLists.delegationButton.delegate'
          )}
          listMode={'MODAL'}
        />
      )}
    </TransparentView>
  );
};

const FamilyMemberDelegations = ({
  user,
  storeId
}: {
  user: UserResponse;
  storeId: number;
}) => {
  return (
    <TransparentView style={styles.familyMemberDelegations}>
      <TransparentView style={styles.userWithColourWrapper}>
        <UserWithColor
          name={`${user.first_name} ${user.last_name}`}
          memberColour={user.member_colour}
          showUserImage={false}
        />
      </TransparentView>
      <DelegationsList storeId={storeId} userId={user.id} />
    </TransparentView>
  );
};

const ExternalMemberDelegations = ({
  userId,
  storeId,
  onDelegateSuccess
}: {
  userId: number;
  storeId: number;
  onDelegateSuccess?: () => void;
}) => {
  const { data: userDetails } = useGetUserMinimalDetailsFromIdQuery(userId);

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentView style={styles.familyMemberDelegations}>
      <TransparentView style={styles.userWithColourWrapper}>
        <UserWithColor
          name={`${userDetails.phone_number}`}
          memberColour={userDetails.member_colour}
          showUserImage={false}
        />
      </TransparentView>
      <DelegationsList
        storeId={storeId}
        userId={userId}
        onDelegateSuccess={onDelegateSuccess}
      />
    </TransparentView>
  );
};

const ExternalMemberDelegator = ({ storeId }: { storeId: number }) => {
  const { data: delegations } = useGetAllStoreDelegationsQuery();
  const { data: userDetails } = useGetUserFullDetails();
  const { t } = useTranslation();
  const [externalMemberId, setExternalMemberId] = useState(0);

  if (!delegations || !userDetails) {
    return null;
  }

  const familyUserIds = userDetails.family.users.map((user) => user.id);

  const externalDelegations = delegations.ids
    .filter((delegationId) => {
      const delegation = delegations.byId[delegationId];
      return (
        delegation.store === storeId &&
        !familyUserIds.includes(delegation.delegatee)
      );
    })
    .map((delegationId) => delegations.byId[delegationId]);

  const externalDelegationsByUserId: {
    [key: number]: ShoppingListDelegation[];
  } = {};
  for (const delegation of externalDelegations) {
    externalDelegationsByUserId[delegation.delegatee] = [
      ...(externalDelegationsByUserId[delegation.delegatee] || []),
      delegation
    ];
  }

  return (
    <TransparentView style={styles.addExternalWrapper}>
      {Object.keys(externalDelegationsByUserId).map((userId) => {
        return (
          <ExternalMemberDelegations
            key={userId}
            userId={parseInt(userId)}
            storeId={storeId}
          />
        );
      })}
      {externalMemberId ? (
        <ExternalMemberDelegations
          userId={externalMemberId}
          storeId={storeId}
          onDelegateSuccess={() => {
            setExternalMemberId(0);
          }}
        />
      ) : (
        <PhoneNumberMemberFinder
          onFindId={(memberId) => {
            if (
              !(memberId in externalDelegationsByUserId) &&
              !familyUserIds.includes(memberId)
            ) {
              setExternalMemberId(memberId);
            }
          }}
          addText={t(
            'components.shoppingLists.delegationButton.delegateToSomeoneElse'
          )}
        />
      )}
    </TransparentView>
  );
};

export default function StoreDelegations({ storeId }: { storeId: number }) {
  const { data: userDetails } = useGetUserFullDetails();
  const { data: allStores } = useGetAllShoppingListStoresQuery();

  if (!userDetails || !allStores) {
    return null;
  }

  return (
    <TransparentScrollView
      style={styles.modalContainer}
      contentContainerStyle={[
        styles.modalContainer,
        styles.modalContainerInner
      ]}
    >
      <Text style={styles.storeTitle}>{allStores.byId[storeId].name}</Text>
      {userDetails.family.users
        .filter((user) => user.id !== userDetails.id)
        .map((user) => (
          <FamilyMemberDelegations
            user={user}
            storeId={storeId}
            key={user.id}
          />
        ))}
      <ExternalMemberDelegator storeId={storeId} />
    </TransparentScrollView>
  );
}
