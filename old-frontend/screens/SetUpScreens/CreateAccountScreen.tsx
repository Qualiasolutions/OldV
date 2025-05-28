import React, { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { TextInput } from 'components/Themed';
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
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import {
  useFormUpdateUserDetailsMutation,
  useUpdateUserDetailsMutation
} from 'reduxStore/services/api/user';
import { WhiteDateInput } from 'components/forms/components/DateInputs';
import { ColorPicker } from 'components/forms/components/ColorPickers';
import { WhiteImagePicker } from 'components/forms/components/ImagePicker';
import dayjs from 'dayjs';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';

const styles = StyleSheet.create({
  inputLabelWrapper: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%'
  },
  inputLabel: {
    fontSize: 12,
    textAlign: 'left'
  },
  confirmButton: {
    marginTop: 30,
    marginBottom: 15
  },
  memberColorBox: {
    width: '100%',
    marginTop: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textInput: { width: '100%' }
});

const CreateAccountScreen = ({
  navigation
}: NativeStackScreenProps<SetupTabParamList, 'CreateAccount'>) => {
  const { data: userFullDetails } = useGetUserFullDetails();

  const [firstName, onChangeFirstName] = React.useState<string>('');
  const [lastName, onChangeLastName] = React.useState<string>('');
  const [dateOfBirth, setDateOfBirth] = React.useState<Date | null>(null);
  const [memberColour, setMemberColour] = React.useState<string>('');
  const { t } = useTranslation();

  const [updateUserDetails, updateUserDetailsResult] =
    useUpdateUserDetailsMutation();
  const [formUpdateUserDetails] = useFormUpdateUserDetailsMutation();

  const uploadProfileImage = (image: File) => {
    if (userFullDetails) {
      const data = new FormData();
      data.append('profile_image', image);
      formUpdateUserDetails({
        userId: userFullDetails.id,
        formData: data
      });
    }
  };

  useEffect(() => {
    if (
      userFullDetails?.member_colour &&
      userFullDetails?.first_name &&
      userFullDetails?.last_name &&
      userFullDetails?.dob
    ) {
      if (userFullDetails.family.users.length <= 1) {
        navigation.push('AddFamily');
      } else {
        navigation.push('WelcomeToVuet');
      }
    }
  }, [userFullDetails, navigation]);

  if (!userFullDetails) {
    return null;
  }

  if (
    userFullDetails?.member_colour &&
    userFullDetails?.first_name &&
    userFullDetails?.last_name &&
    userFullDetails?.dob
  ) {
    return null;
  }

  const hasAllRequired = firstName && lastName && dateOfBirth && memberColour;

  return (
    <TransparentFullPageScrollView>
      <AlmostWhiteContainerView>
        <PageTitle text={t('screens.createAccount.title')} />
        <PageSubtitle text={t('screens.createAccount.addDetails')} />
        <WhiteImagePicker
          onImageSelect={(image) => {
            uploadProfileImage(image as any);
          }}
          defaultImageUrl={userFullDetails?.presigned_profile_image_url}
          displayInternalImage={false}
        />
        <TransparentView style={styles.inputLabelWrapper}>
          <AlmostBlackText
            style={styles.inputLabel}
            text={t('screens.createAccount.firstName')}
          />
        </TransparentView>
        <TextInput
          value={firstName}
          onChangeText={(text) => onChangeFirstName(text)}
          accessibilityLabel="first-name-input"
          style={styles.textInput}
        />
        <TransparentView style={styles.inputLabelWrapper}>
          <AlmostBlackText
            style={styles.inputLabel}
            text={t('screens.createAccount.lastName')}
          />
        </TransparentView>
        <TextInput
          value={lastName}
          onChangeText={(text) => onChangeLastName(text)}
          accessibilityLabel="last-name-input"
          style={styles.textInput}
        />
        <TransparentView style={styles.inputLabelWrapper}>
          <AlmostBlackText
            style={styles.inputLabel}
            text={t('screens.createAccount.dob')}
          />
        </TransparentView>
        <WhiteDateInput
          value={dateOfBirth}
          maximumDate={new Date()}
          onSubmit={(newValue: Date) => {
            setDateOfBirth(newValue);
          }}
          handleErrors={() => {
            Toast.show({
              type: 'error',
              text1: t('screens.createAccount.invalidDateMessage')
            });
          }}
        />
        <WhiteBox style={styles.memberColorBox} elevated={false}>
          <AlmostBlackText
            style={styles.inputLabel}
            text={t('screens.createAccount.memberColour')}
          />
          <ColorPicker
            value={memberColour}
            onValueChange={(value: string) => {
              setMemberColour(value);
            }}
          />
        </WhiteBox>
        {updateUserDetailsResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            title={t('common.next')}
            disabled={!hasAllRequired}
            onPress={async () => {
              if (userFullDetails?.id) {
                try {
                  await updateUserDetails({
                    user_id: userFullDetails?.id,
                    first_name: firstName,
                    last_name: lastName,
                    dob: dayjs(dateOfBirth).format('YYYY-MM-DD'),
                    member_colour: memberColour
                  }).unwrap();
                } catch (e) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }
            }}
            style={styles.confirmButton}
          />
        )}
      </AlmostWhiteContainerView>
    </TransparentFullPageScrollView>
  );
};

export default CreateAccountScreen;
