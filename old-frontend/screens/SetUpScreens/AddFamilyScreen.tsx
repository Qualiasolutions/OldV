import React from 'react';

import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Button } from 'components/molecules/ButtonComponents';

import { SetupTabParamList } from 'types/base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PageTitle,
  PageSubtitle,
  AlmostBlackText
} from 'components/molecules/TextComponents';
import {
  AlmostWhiteContainerView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { useGetUserInvitesQuery } from 'reduxStore/services/api/user';
import {
  PickedFile,
  WhiteImagePicker
} from 'components/forms/components/ImagePicker';
import { useUpdateFamilyDetailsMutation } from 'reduxStore/services/api/family';
import SafePressable from 'components/molecules/SafePressable';
import useGetUserFullDetails from 'hooks/useGetUserDetails';

const styles = StyleSheet.create({
  confirmButton: {
    marginTop: 30,
    marginBottom: 15
  },
  imagePicker: {
    marginBottom: 30
  },
  addedMembers: { zIndex: -1 }
});

const AddFamilyScreen = ({
  navigation
}: NativeStackScreenProps<SetupTabParamList, 'AddFamily'>) => {
  const { data: userFullDetails } = useGetUserFullDetails();
  const { data: userInvites } = useGetUserInvitesQuery();

  const familyPhoneNumbers =
    userFullDetails?.family.users
      .map((user) => user.phone_number)
      .filter((phone) => phone) || [];

  const familyEmails =
    userFullDetails?.family.users
      .map((user) => user.email)
      .filter((email) => email) || [];

  const familyInvites = userInvites?.filter(
    (invite) =>
      invite.family === userFullDetails?.family.id &&
      !(
        invite.phone_number && familyPhoneNumbers.includes(invite.phone_number)
      ) &&
      !(invite.email && familyEmails.includes(invite.email))
  );

  const [updateFamilyDetails] = useUpdateFamilyDetailsMutation();

  const uploadProfileImage = (image: PickedFile) => {
    if (userFullDetails) {
      const data = new FormData();
      data.append('image', image as any);

      updateFamilyDetails({
        familyId: userFullDetails.family.id,
        formData: data
      });
    }
  };

  const { t } = useTranslation();

  const addedMembersContent =
    familyInvites && familyInvites.length > 0 ? (
      familyInvites.map((invite) => (
        <TransparentView key={invite.id}>
          <AlmostBlackText text={invite.phone_number || invite.email || ''} />
        </TransparentView>
      ))
    ) : (
      <AlmostBlackText text={t('screens.addFamily.currentlyNone')} />
    );

  return (
    <AlmostWhiteContainerView>
      <PageTitle text={t('screens.addFamily.title')} />
      <PageSubtitle text={t('screens.addFamily.startAdding')} />
      <WhiteImagePicker
        style={styles.imagePicker}
        onImageSelect={(image) => {
          uploadProfileImage(image as any);
        }}
        defaultImageUrl={userFullDetails?.family?.presigned_image_url}
        displayInternalImage={false}
      />
      <TransparentView style={styles.addedMembers}>
        {addedMembersContent}
      </TransparentView>
      <Button
        title={t('screens.addFamily.addMember')}
        onPress={() => {
          navigation.push('AddFamilyMember');
        }}
        style={styles.confirmButton}
      />
      <SafePressable
        onPress={() => {
          navigation.push('WelcomeToVuet');
        }}
      >
        <Button
          title={t('common.next')}
          onPress={() => {
            navigation.push('WelcomeToVuet');
          }}
          style={styles.confirmButton}
        />
      </SafePressable>
    </AlmostWhiteContainerView>
  );
};

export default AddFamilyScreen;
