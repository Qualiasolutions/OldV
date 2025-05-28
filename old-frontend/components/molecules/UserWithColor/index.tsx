import React from 'react';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import {
  AlmostWhiteView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Image, StyleSheet, View } from 'react-native';
import { parsePresignedUrl } from 'utils/urls';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },
  memberColour: {
    height: 9,
    width: 78
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
  },
  usernameAndColor: { justifyContent: 'center' },
  nameText: { fontSize: 14 }
});

export default function UserWithColor({
  name = '',
  memberColour = '',
  userImage = '',
  showUserImage = true
}) {
  return (
    <TransparentView style={styles.container}>
      {showUserImage ? (
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
      ) : null}
      <TransparentView style={styles.usernameAndColor}>
        <AlmostBlackText text={name} style={styles.nameText} />
        {memberColour && (
          <View
            style={[
              styles.memberColour,
              { backgroundColor: `#${memberColour}` }
            ]}
          />
        )}
      </TransparentView>
    </TransparentView>
  );
}
