import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Checkbox from './Checkbox';
import SafePressable from './SafePressable';
import { PaddedSpinner } from './Spinners';
import UserWithColor from './UserWithColor';
import { TransparentView } from './ViewComponents';
import { UserResponse } from 'types/users';

const styles = StyleSheet.create({
  itemWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 5
  },
  checkbox: { marginLeft: 20 }
});

export default function UserCheckboxes({
  value,
  onToggleUser
}: {
  value: number[];
  onToggleUser: (value: number) => void;
}) {
  const { data: userDetails } = useGetUserFullDetails();
  const familyUsers = userDetails?.family?.users;

  if (!familyUsers) {
    return <PaddedSpinner />;
  }
  return (
    <TransparentView>
      {familyUsers.map((user) => {
        return (
          <SafePressable
            style={styles.itemWrapper}
            key={user.id}
            onPress={() => {
              onToggleUser(user.id);
            }}
          >
            <UserWithColor
              name={`${user.first_name} ${user.last_name}`}
              memberColour={user.member_colour}
              userImage={user.presigned_profile_image_url}
              showUserImage={true}
            />
            <Checkbox
              checked={value && value.includes(user.id)}
              style={styles.checkbox}
              disabled={true}
            />
          </SafePressable>
        );
      })}
    </TransparentView>
  );
}
