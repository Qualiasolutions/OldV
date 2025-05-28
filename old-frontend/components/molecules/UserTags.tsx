import { StyleSheet } from 'react-native';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useMemo } from 'react';
import { BlackText } from './TextComponents';
import UserInitialsWithColor from './UserInitialsWithColor';
import { TransparentView } from './ViewComponents';

const styles = StyleSheet.create({
  memberColor: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 2
  },
  userInitials: {
    marginLeft: 2
  },
  numExternalMembers: { marginLeft: 5 }
});

export default function UserTags({ memberIds }: { memberIds: number[] }) {
  const { data: userDetails } = useGetUserFullDetails();
  const [membersList, numExternalMembers] = useMemo(() => {
    const familyMembersList = userDetails?.family?.users?.filter((item: any) =>
      memberIds.includes(item.id)
    );
    const friendMembersList = userDetails?.friends?.filter((item: any) =>
      memberIds.includes(item.id)
    );
    const members = Array(
      ...new Set([...(familyMembersList || []), ...(friendMembersList || [])])
    );
    return [members, memberIds.length - members.length];
  }, [userDetails, memberIds]);

  return (
    <TransparentView pointerEvents="none" style={styles.memberColor}>
      {membersList?.map((user) => (
        <UserInitialsWithColor
          user={user}
          style={styles.userInitials}
          key={user.id}
        />
      )) || []}
      {numExternalMembers ? (
        <BlackText
          text={`+${numExternalMembers}`}
          style={styles.numExternalMembers}
        />
      ) : null}
    </TransparentView>
  );
}
