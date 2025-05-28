import React, { useEffect } from 'react';

import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

import { UnauthorisedTabParamList } from 'types/base';
import { useCreateAccountMutation } from 'reduxStore/services/api/signup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useDispatch } from 'react-redux';
import {
  setAccessToken,
  setRefreshToken
} from 'reduxStore/slices/auth/actions';
import {
  PageTitle,
  PageSubtitle,
  AlmostBlackText
} from 'components/molecules/TextComponents';
import {
  AlmostWhiteContainerView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { RegisterAccountRequest } from 'types/signup';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';

const ENV = Constants.expoConfig?.extra?.processEnv;

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
  passwordInput: {
    width: '100%'
  }
});

const CreatePasswordScreen = ({
  route
}: NativeStackScreenProps<UnauthorisedTabParamList, 'CreatePassword'>) => {
  const [password, onChangePassword] = React.useState<string>('');
  const [passwordConfirm, onChangePasswordConfirm] = React.useState<string>('');
  const { t } = useTranslation();

  const [createAccount, createAccountResult] = useCreateAccountMutation();

  const dispatch = useDispatch();

  const { isEmail, phoneNumber } = route.params;

  useEffect(() => {
    if (createAccountResult.isSuccess) {
      const { access_token: accessToken, refresh_token: refreshToken } =
        createAccountResult.data;

      dispatch(setAccessToken(accessToken));
      dispatch(setRefreshToken(refreshToken));
    } else {
      if (createAccountResult.error) {
        Toast.show({
          type: 'error',
          text1: t('common.errors.generic')
        });
      }
    }
  }, [createAccountResult, dispatch, t]);

  return (
    <TransparentFullPageScrollView>
      <AlmostWhiteContainerView>
        <PageTitle text={t('screens.createPassword.title')} />
        <PageSubtitle text={t('screens.createPassword.addPassword')} />
        <TransparentView style={styles.inputLabelWrapper}>
          <AlmostBlackText
            style={styles.inputLabel}
            text={t('screens.createPassword.password')}
          />
        </TransparentView>
        <PasswordInput
          accessibilityLabel="password-input"
          value={password}
          onChangeText={(text) => onChangePassword(text)}
          style={styles.passwordInput}
        />
        <TransparentView style={styles.inputLabelWrapper}>
          <AlmostBlackText
            style={styles.inputLabel}
            text={t('screens.createPassword.confirmPassword')}
          />
        </TransparentView>
        <PasswordInput
          accessibilityLabel="password-input-confirmation"
          value={passwordConfirm}
          onChangeText={(text) => onChangePasswordConfirm(text)}
          style={styles.passwordInput}
        />
        {createAccountResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            title={t('common.save')}
            onPress={() => {
              const minimumPasswordLength = ENV === 'LOCAL' ? 2 : 8;
              if (password.length < minimumPasswordLength) {
                Toast.show({
                  type: 'error',
                  text1: t('screens.createPassword.passwordTooShort', {
                    minimumLength: minimumPasswordLength
                  })
                });
              } else if (password !== passwordConfirm) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.passwordsDontMatch')
                });
              } else {
                const req: RegisterAccountRequest = {
                  password,
                  password2: passwordConfirm
                };
                if (isEmail) {
                  req.email = phoneNumber;
                } else {
                  req.phone_number = phoneNumber;
                }
                createAccount(req);
              }
            }}
            style={styles.confirmButton}
          />
        )}
      </AlmostWhiteContainerView>
    </TransparentFullPageScrollView>
  );
};

export default CreatePasswordScreen;
