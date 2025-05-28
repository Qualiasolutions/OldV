import React, { useState } from 'react';

import { Image, ScrollView, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { SettingsTabParamList } from 'types/base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  AlmostWhiteView,
  TransparentView,
  WhiteView
} from 'components/molecules/ViewComponents';
import { useDeleteUserInviteMutation } from 'reduxStore/services/api/user';
import {
  FullWidthImagePicker,
  PickedFile
} from 'components/forms/components/ImagePicker';
import { useUpdateFamilyDetailsMutation } from 'reduxStore/services/api/family';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { UserInviteResponse, UserResponse } from 'types/users';
import { YesNoModal } from 'components/molecules/Modals';
import useActiveInvitesForUser from 'headers/hooks/useActiveInvitesForUser';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import SafePressable from 'components/molecules/SafePressable';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import UserWithColor from 'components/molecules/UserWithColor';

const styles = StyleSheet.create({
  familyHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  familyHeaderText: { fontSize: 22 },
  scrollContainer: {
    height: '100%'
  },
  colourBar: {
    width: 70,
    height: 6
  },
  listContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 40,
    justifyContent: 'flex-start'
  },
  listHeader: {
    borderBottomWidth: 1,
    marginBottom: 10
  },
  headerText: {},
  listElement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10
  },
  listElementText: {
    fontSize: 18
  },
  listLeft: {
    maxWidth: '80%'
  },
  listRight: {
    flexDirection: 'row'
  },
  editIcon: {
    width: 20,
    height: 20,
    margin: 5
  },
  plusIcon: {
    width: 30,
    height: 30,
    marginLeft: 10
  },
  imagePickerContainer: { zIndex: 10 }
});

const FamilySettingsScreen = ({
  navigation
}: NativeStackScreenProps<SettingsTabParamList, 'FamilySettings'>) => {
  const { data: userFullDetails } = useGetUserFullDetails();

  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [userInviteToDelete, setUserInviteToDelete] =
    useState<UserInviteResponse | null>(null);

  const { data: userInvites } = useActiveInvitesForUser(false);

  const [updateFamilyDetails] = useUpdateFamilyDetailsMutation();
  const [deleteUserInvite] = useDeleteUserInviteMutation();

  const { t } = useTranslation();

  const uploadProfileImage = (image: PickedFile) => {
    if (userFullDetails) {
      const data = new FormData();
      // typescript complaining about `image` not being a Blob but it works :shrug:
      data.append('image', image as any);

      updateFamilyDetails({
        familyId: userFullDetails.family.id,
        formData: data
      });
    }
  };

  const familyPhoneNumbers =
    userFullDetails?.family.users
      .map((user) => user.phone_number)
      .filter((num) => !!num) || [];
  const familyEmails =
    userFullDetails?.family.users
      .map((user) => user.email)
      .filter((email) => !!email) || [];

  const familyInvites = userInvites?.filter(
    (invite) =>
      invite.family === userFullDetails?.family.id &&
      !(
        invite?.phone_number &&
        familyPhoneNumbers.includes(invite?.phone_number)
      ) &&
      !(invite?.email && familyEmails.includes(invite?.email))
  );

  const userToListElement = (
    user: UserResponse | UserInviteResponse,
    isPending: boolean = false
  ) => {
    const isUserInvite = (usr: any): usr is UserInviteResponse => isPending;
    return (
      <TransparentView style={styles.listElement} key={user.id}>
        <UserWithColor
          name={
            isUserInvite(user)
              ? `${user.phone_number || user.email} (${t('common.pending')})`
              : `${user.first_name} ${user.last_name}`
          }
          memberColour={isUserInvite(user) ? '' : user.member_colour}
          userImage={isUserInvite(user) ? '' : user.presigned_profile_image_url}
        />
        <TransparentView style={styles.listRight}>
          <SafePressable
            onPress={() => {
              if (isUserInvite(user)) {
                setUserInviteToDelete(user);
              } else {
                setUserToDelete(user);
              }
            }}
          >
            <Image
              style={styles.editIcon}
              source={require('../../assets/images/icons/remove-circle.png')}
            />
          </SafePressable>
        </TransparentView>
      </TransparentView>
    );
  };

  const familyMemberList = userFullDetails?.family.users.map((user) =>
    userToListElement(user)
  );
  const familyInvitesList = familyInvites?.map((user) =>
    userToListElement(user, true)
  );

  return (
    <ScrollView style={styles.scrollContainer}>
      <YesNoModal
        title="Before you proceed"
        question={`Are you sure you want to remove ${userToDelete?.first_name} ${userToDelete?.last_name} from the family?`}
        visible={!!userToDelete}
        onYes={() => {
          setUserToDelete(null);
          Toast.show({
            type: 'error',
            text1: 'Action not currently supported'
          });
        }}
        onNo={() => {
          setUserToDelete(null);
        }}
      />
      <YesNoModal
        title="Before you proceed"
        question={`Are you sure you want to cancel the invite for ${
          userInviteToDelete?.phone_number || userInviteToDelete?.email
        }?`}
        visible={!!userInviteToDelete}
        onYes={() => {
          if (userInviteToDelete) {
            deleteUserInvite({ id: userInviteToDelete.id });
            setUserInviteToDelete(null);
          }
        }}
        onNo={() => {
          setUserInviteToDelete(null);
        }}
      />
      <AlmostWhiteView style={styles.imagePickerContainer}>
        <FullWidthImagePicker
          onImageSelect={(image) => {
            uploadProfileImage(image);
          }}
          defaultImageUrl={userFullDetails?.family?.presigned_image_url}
          displayInternalImage={false}
        />
      </AlmostWhiteView>
      <AlmostWhiteView style={styles.familyHeader}>
        <AlmostBlackText
          style={styles.familyHeaderText}
          text={t('screens.familySettings.familyMembers')}
        />
        <SafePressable
          onPress={() => {
            navigation.navigate('CreateUserInvite', {
              familyRequest: true
            });
          }}
        >
          <Image
            source={require('assets/images/icons/plus.png')}
            style={styles.plusIcon}
          />
        </SafePressable>
      </AlmostWhiteView>
      <WhiteView style={styles.listContainer}>
        {familyMemberList}
        {familyInvitesList}
      </WhiteView>
    </ScrollView>
  );
};

export default FamilySettingsScreen;
