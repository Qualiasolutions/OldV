import React from 'react';
import {
  AlmostWhiteView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Image, StyleSheet } from 'react-native';
import { parsePresignedUrl } from 'utils/urls';
import UserInitialsWithColor from './UserInitialsWithColor';
import { UserResponse } from 'types/users';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },
  profileImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    width: '60%',
    height: '60%'
  }
});

type UserProp = {
  presigned_profile_image_url?: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string | null;
  member_colour: string;
};

export default function UserInitialsWithImage({
  user,
  isPending
}: {
  user: UserProp;
  isPending: boolean;
}) {
  const userImage = user.presigned_profile_image_url;
  return (
    <TransparentView style={styles.container}>
      <AlmostWhiteView style={styles.profileImageWrapper}>
        {userImage ? (
          <Image
            source={{ uri: parsePresignedUrl(userImage) }}
            style={styles.profileImage}
          />
        ) : (
          <Image
            source={require('assets/images/icons/user-head.png')}
            style={[styles.profileImage, styles.placeholderImage]}
          />
        )}
      </AlmostWhiteView>
      <UserInitialsWithColor user={user} isPending={isPending} />
    </TransparentView>
  );
}
