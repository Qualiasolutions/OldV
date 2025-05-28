import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetUserInvitesQuery } from 'reduxStore/services/api/user';
import { selectAccessToken } from 'reduxStore/slices/auth/selectors';

export default function useActiveInvitesForUser(ownInvites: boolean) {
  const jwtAccessToken = useSelector(selectAccessToken);
  const { data: userFullDetails, isLoading: isLoadingUserDetails } =
    useGetUserFullDetails();

  const { data: userInvites, isLoading: isLoadingUserInvites } =
    useGetUserInvitesQuery(undefined, {
      skip: !jwtAccessToken || !userFullDetails?.family?.id
    });

  return useMemo(() => {
    if (!jwtAccessToken) {
      return {
        data: [],
        isLoading: false
      };
    }

    const isLoading = isLoadingUserDetails || isLoadingUserInvites;

    if (isLoading) {
      return {
        data: [],
        isLoading: true
      };
    }

    if (!userInvites) {
      return {
        data: [],
        isLoading: false
      };
    }

    const invitesForUser = userInvites.filter(
      (invite) =>
        // If ownInvites then only want invites for user
        (!ownInvites ||
          invite.phone_number === userFullDetails?.phone_number) &&
        // Don't want rejected invites
        !invite.rejected &&
        // Don't want accepted invites
        !invite.accepted &&
        // If ownInvites then don't want invites for own family
        (!ownInvites || userFullDetails?.family?.id !== invite.family) &&
        // Don't want friend invites for already-added friends
        !(
          !invite.family &&
          userFullDetails?.friends
            ?.map((user) => user.id)
            .includes(invite.invitee.id)
        )
    );

    return {
      isLoading: false,
      data: invitesForUser
    };
  }, [
    isLoadingUserInvites,
    isLoadingUserDetails,
    jwtAccessToken,
    ownInvites,
    userFullDetails,
    userInvites
  ]);
}
