import React from 'react';

import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Button } from 'components/molecules/ButtonComponents';

import { PageTitle, PageSubtitle } from 'components/molecules/TextComponents';
import { AlmostWhiteContainerView } from 'components/molecules/ViewComponents';
import {
  useUpdateUserDetailsMutation,
  useUpdateUserInviteMutation
} from 'reduxStore/services/api/user';
import { useCreateFriendshipMutation } from 'reduxStore/services/api/friendships';
import useActiveInvitesForUser from 'headers/hooks/useActiveInvitesForUser';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { PaddedSpinner } from 'components/molecules/Spinners';

const styles = StyleSheet.create({
  confirmButton: {
    marginTop: 20
  }
});

const FamilyRequestScreen = () => {
  const { data: userFullDetails } = useGetUserFullDetails();

  const [updateUserDetails, updateUserDetailsResult] =
    useUpdateUserDetailsMutation();
  const [updateUserInvite, updateUserInviteResult] =
    useUpdateUserInviteMutation();
  const [createFriendship] = useCreateFriendshipMutation();

  const { t } = useTranslation();

  const { data: invitesForUser } = useActiveInvitesForUser(true);

  if (!(invitesForUser && userFullDetails)) {
    return null;
  }

  const firstInviteForUser =
    invitesForUser && invitesForUser.length > 0 ? invitesForUser[0] : null;

  return (
    <AlmostWhiteContainerView>
      <PageTitle
        text={
          firstInviteForUser?.family
            ? t('screens.familyRequest.familyTitle')
            : t('screens.familyRequest.friendTitle')
        }
      />
      <PageSubtitle
        text={
          firstInviteForUser?.family
            ? t('screens.familyRequest.familySubtitle', {
                name: `${firstInviteForUser?.invitee.first_name} ${firstInviteForUser?.invitee.last_name}`
              })
            : t('screens.familyRequest.friendSubtitle', {
                name: `${firstInviteForUser?.invitee.first_name} ${firstInviteForUser?.invitee.last_name}`
              })
        }
      />
      {updateUserDetailsResult.isLoading || updateUserInviteResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <>
          <Button
            title={t('common.accept')}
            onPress={() => {
              if (userFullDetails) {
                if (firstInviteForUser) {
                  if (firstInviteForUser.family) {
                    updateUserDetails({
                      user_id: userFullDetails.id,
                      family: firstInviteForUser?.family
                    });
                  } else {
                    createFriendship({
                      friend: userFullDetails.id,
                      creator: firstInviteForUser.invitee.id
                    });
                  }
                }
              }
            }}
            style={styles.confirmButton}
          />
          <Button
            title={t('common.reject')}
            onPress={() => {
              if (invitesForUser) {
                updateUserInvite({
                  id: invitesForUser[0].id,
                  rejected: true
                });
              }
            }}
            style={styles.confirmButton}
          />
        </>
      )}
    </AlmostWhiteContainerView>
  );
};

export default FamilyRequestScreen;
