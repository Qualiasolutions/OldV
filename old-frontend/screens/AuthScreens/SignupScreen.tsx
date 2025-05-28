import React, { useState } from 'react';

import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

import { UnauthorisedTabParamList } from 'types/base';
import {
  useCreateEmailValidationMutation,
  useCreatePhoneValidationMutation
} from 'reduxStore/services/api/signup';
import {
  isFieldErrorCodeError,
  isInvalidPhoneNumberError,
  isInvalidEmailError
} from 'types/signup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PageTitle,
  PageSubtitle,
  PrimaryText
} from 'components/molecules/TextComponents';
import { AlmostWhiteContainerView } from 'components/molecules/ViewComponents';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import SafePressable from 'components/molecules/SafePressable';
import { PaddedSpinner } from 'components/molecules/Spinners';
import PhoneOrEmailInput from 'components/molecules/PhoneOrEmailInput';

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
  extraOpts: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%'
  },
  textInput: {
    width: '100%'
  }
});

const SignupScreen = ({
  navigation
}: NativeStackScreenProps<UnauthorisedTabParamList, 'Signup'>) => {
  const [usingEmail, setUsingEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');

  const [createPhoneValidation, phoneValidationResult] =
    useCreatePhoneValidationMutation();
  const [createEmailValidation, emailValidationResult] =
    useCreateEmailValidationMutation();

  const { t } = useTranslation();

  return (
    <AlmostWhiteContainerView>
      <PageTitle text={t('screens.signUp.welcome')} />
      <PageSubtitle
        text={
          usingEmail
            ? t('screens.signUp.useEmail')
            : t('screens.signUp.usePhoneNumber')
        }
      />
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
      {phoneValidationResult.isLoading || emailValidationResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          title={t('common.confirm')}
          onPress={async () => {
            if (usingEmail) {
              try {
                const res = await createEmailValidation({
                  email: email
                }).unwrap();
                navigation.navigate('ValidatePhone', {
                  validationId: res.id,
                  phoneNumber: res.email,
                  isEmail: true
                });
              } catch (error) {
                console.log(error);
                if (isFieldErrorCodeError('email', 'email_used')(error)) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.emailUsedError')
                  });
                } else if (isInvalidEmailError(error)) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.invalidEmail')
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }
            } else {
              try {
                const res = await createPhoneValidation({
                  phone_number: phoneNumber
                }).unwrap();
                navigation.navigate('ValidatePhone', {
                  validationId: res.id,
                  phoneNumber: res.phone_number
                });
              } catch (error) {
                if (
                  isFieldErrorCodeError(
                    'phone_number',
                    'phone_number_used'
                  )(error)
                ) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.phoneUsedError')
                  });
                } else if (isInvalidPhoneNumberError(error)) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.invalidPhone')
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }
            }
          }}
          style={styles.confirmButton}
        />
      )}
      <Text>{t('screens.signUp.alreadyHaveAccount')}</Text>
      <SafePressable
        onPress={() => {
          navigation.navigate('Login');
        }}
      >
        <PrimaryText text={t('screens.signUp.logIn')} bold={true} />
      </SafePressable>
    </AlmostWhiteContainerView>
  );
};

export default SignupScreen;
