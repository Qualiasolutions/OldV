import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { TransparentView } from 'components/molecules/ViewComponents';

import { useCreateUserInviteMutation } from 'reduxStore/services/api/user';
import { SmallButton } from 'components/molecules/ButtonComponents';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { isFieldErrorCodeError, isInvalidPhoneNumberError } from 'types/signup';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { StyleSheet } from 'react-native';
import * as EmailValidator from 'email-validator';
import { CreateUserInviteRequest } from 'types/users';
import PhoneOrEmailInput from 'components/molecules/PhoneOrEmailInput';

const styles = StyleSheet.create({
  button: { marginTop: 10 },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  wrapper: { width: '100%' }
});

export default function UserInviteForm({
  isFamilyRequest,
  onSuccess
}: {
  isFamilyRequest: boolean;
  onSuccess?: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [usingEmail, setUsingEmail] = useState(false);
  const { data: userFullDetails } = useGetUserFullDetails();

  const [createUserInvite, createUserInviteResult] =
    useCreateUserInviteMutation();

  const { t } = useTranslation();

  if (!userFullDetails) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentView style={styles.wrapper}>
      <PhoneOrEmailInput
        usingEmail={usingEmail}
        value={usingEmail ? email : phoneNumber}
        changeUsingEmail={setUsingEmail}
        onValueChange={(val) => {
          if (usingEmail) {
            setEmail(val);
          } else {
            setPhoneNumber(val);
          }
        }}
      />
      {createUserInviteResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <TransparentView style={styles.buttonWrapper}>
          <SmallButton
            style={styles.button}
            title={t('common.invite')}
            disabled={
              (usingEmail && !EmailValidator.validate(email)) ||
              (!usingEmail && phoneNumber.length < 9)
            }
            onPress={async () => {
              try {
                const req: CreateUserInviteRequest = {
                  invitee: userFullDetails.id,
                  family: isFamilyRequest ? userFullDetails.family.id : null
                };

                if (usingEmail) {
                  req.email = email;
                } else {
                  req.phone_number = phoneNumber;
                }
                await createUserInvite(req).unwrap();
                Toast.show({
                  type: 'success',
                  text1: t('screens.createUserInvite.success')
                });
                if (onSuccess) {
                  onSuccess();
                }
                // if (isFamilyRequest) {
                //   navigation.navigate('FamilySettings');
                // } else {
                //   navigation.navigate('FriendSettings');
                // }
              } catch (err) {
                if (isInvalidPhoneNumberError(err)) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.invalidPhone')
                  });
                } else if (
                  isFieldErrorCodeError(
                    'phone_number',
                    'already_has_family'
                  )(err)
                ) {
                  Toast.show({
                    type: 'error',
                    text1: t('screens.createUserInvite.errors.alreadyHasFamily')
                  });
                } else if (
                  isFieldErrorCodeError(
                    'phone_number',
                    'already_in_family'
                  )(err)
                ) {
                  Toast.show({
                    type: 'error',
                    text1: t('screens.createUserInvite.errors.alreadyInFamily')
                  });
                } else if (
                  isFieldErrorCodeError('phone_number', 'already_invited')(err)
                ) {
                  Toast.show({
                    type: 'error',
                    text1: t('screens.createUserInvite.errors.alreadyInvited')
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }
            }}
          />
        </TransparentView>
      )}
    </TransparentView>
  );
}
