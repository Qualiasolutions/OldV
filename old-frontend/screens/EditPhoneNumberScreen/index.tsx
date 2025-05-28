import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import {
  TransparentView,
  TransparentPaddedView
} from 'components/molecules/ViewComponents';
import { Text, TextInput } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import PhoneNumberInput from 'components/forms/components/PhoneNumberInput';
import { useMemo, useState } from 'react';
import { Button } from 'components/molecules/ButtonComponents';
import {
  useCreateEmailValidationMutation,
  useCreatePhoneValidationMutation,
  useUpdateEmailValidationMutation,
  useUpdatePhoneValidationMutation
} from 'reduxStore/services/api/signup';
import { useUpdateUserDetailsMutation } from 'reduxStore/services/api/user';
import {
  isFieldErrorCodeError,
  isInvalidEmailError,
  isInvalidPhoneNumberError,
  isTakenEmailError,
  isTakenPhoneNumberError
} from 'types/signup';
import Toast from 'react-native-toast-message';
import ValidationCodeInput from 'components/molecules/ValidationCodeInput';
import { StyleSheet } from 'react-native';
import SafePressable from 'components/molecules/SafePressable';
import { PrimaryText } from 'components/molecules/TextComponents';
import * as EmailValidator from 'email-validator';
import { UpdateUserRequest } from 'types/users';

const styles = StyleSheet.create({
  topText: { marginBottom: 20 },
  currentDetails: { fontWeight: 'bold' },
  flex: { flex: 1 },
  submitButton: {
    marginTop: 20
  }
});

export function EditPhoneNumberScreen() {
  const { t } = useTranslation();
  const { data: userDetails } = useGetUserFullDetails();
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [switchingToPhone, setSwitchingToPhone] = useState(false);
  const [validationId, setValidationId] = useState<number | null>(null);
  const [updateUserDetails] = useUpdateUserDetailsMutation();
  const [createPhoneValidation, phoneValidationResult] =
    useCreatePhoneValidationMutation();

  const [createEmailValidation, emailValidationResult] =
    useCreateEmailValidationMutation();

  const [updatePhoneValidation] = useUpdatePhoneValidationMutation();
  const [updateEmailValidation] = useUpdateEmailValidationMutation();

  const isEmail = useMemo(() => {
    return userDetails && !userDetails.phone_number && !!userDetails.email;
  }, [userDetails]);

  const savingEmail = isEmail && !switchingToPhone;

  const createValidation = useMemo(() => {
    return async () => {
      if (isEmail) {
        return createEmailValidation({
          email: newEmail
        }).unwrap();
      }
      return createPhoneValidation({
        phone_number: newPhone
      }).unwrap();
    };
  }, [
    newEmail,
    newPhone,
    createEmailValidation,
    createPhoneValidation,
    isEmail
  ]);

  if (!userDetails) {
    return <FullPageSpinner />;
  }

  if (validationId) {
    return (
      <TransparentFullPageScrollView>
        <TransparentPaddedView>
          <ValidationCodeInput
            validationId={validationId}
            isEmail={!!savingEmail}
            onVerify={async (validationCode) => {
              if (isEmail) {
                await updateEmailValidation({
                  code: validationCode,
                  id: validationId
                }).unwrap();
              } else {
                await updatePhoneValidation({
                  code: validationCode,
                  id: validationId
                }).unwrap();
              }
            }}
            onResend={() => {
              if (isEmail) {
                createEmailValidation({
                  email: savingEmail ? newEmail : newPhone
                });
              } else {
                createPhoneValidation({
                  phone_number: savingEmail ? newEmail : newPhone
                });
              }
            }}
            onSuccess={() => {
              const req: UpdateUserRequest = { user_id: userDetails.id };
              if (isEmail) {
                req.email = newEmail;
              } else {
                req.phone_number = newPhone;
              }
              updateUserDetails(req)
                .unwrap()
                .then(() => {
                  Toast.show({
                    type: 'success',
                    text1: savingEmail
                      ? t('screens.editPhoneNumber.updateEmailSuccess')
                      : t('screens.editPhoneNumber.updateSuccess')
                  });
                  setValidationId(null);
                  setNewPhone('');
                })
                .catch((err) => {
                  console.error(err);
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.invalidCodeError')
                  });
                });
            }}
            onError={(err) => {
              if (isFieldErrorCodeError('code', 'invalid_code')(err)) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.invalidCodeError')
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
          />
        </TransparentPaddedView>
      </TransparentFullPageScrollView>
    );
  }

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView>
        <TransparentView style={styles.topText}>
          <Text>
            {isEmail
              ? t('screens.editPhoneNumber.currentEmail')
              : t('screens.editPhoneNumber.currentPhone')}
          </Text>
          <Text style={styles.currentDetails}>
            {isEmail ? userDetails.email : userDetails.phone_number}
          </Text>
        </TransparentView>
        <Text style={styles.topText}>
          {savingEmail
            ? t('screens.editPhoneNumber.enterNewEmail')
            : t('screens.editPhoneNumber.enterNew')}
        </Text>
        {savingEmail ? (
          <TransparentView>
            <TextInput value={newEmail} onChangeText={setNewEmail} />
          </TransparentView>
        ) : (
          <PhoneNumberInput
            onChangeFormattedText={setNewPhone}
            containerStyle={styles.flex}
          />
        )}
        {isEmail && (
          <SafePressable>
            <PrimaryText
              text={
                switchingToPhone
                  ? t('components.phoneOrEmailInput.useEmail')
                  : t('components.phoneOrEmailInput.usePhone')
              }
              onPress={() => setSwitchingToPhone(!switchingToPhone)}
            />
          </SafePressable>
        )}
        {phoneValidationResult.isLoading || emailValidationResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            title={t('common.update')}
            onPress={async () => {
              await createValidation()
                .then((res) => {
                  setValidationId(res.id);
                })
                .catch((err) => {
                  if (isInvalidPhoneNumberError(err)) {
                    Toast.show({
                      type: 'error',
                      text1: t('screens.editPhoneNumber.invalidPhone')
                    });
                  } else if (isInvalidEmailError(err)) {
                    Toast.show({
                      type: 'error',
                      text1: t('screens.editPhoneNumber.invalidEmail')
                    });
                  } else if (isTakenPhoneNumberError(err)) {
                    Toast.show({
                      type: 'error',
                      text1: t('screens.editPhoneNumber.takenPhone')
                    });
                  } else if (isTakenEmailError(err)) {
                    Toast.show({
                      type: 'error',
                      text1: t('screens.editPhoneNumber.takenEmail')
                    });
                  } else {
                    Toast.show({
                      type: 'error',
                      text1: t('common.errors.generic')
                    });
                  }
                });
            }}
            disabled={
              (savingEmail && !EmailValidator.validate(newEmail)) ||
              (!savingEmail && newPhone.length < 9)
            }
            style={styles.submitButton}
          />
        )}
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
