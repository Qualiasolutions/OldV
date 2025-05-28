import React from 'react';

import { StyleSheet } from 'react-native';

import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  setAccessToken,
  setRefreshToken
} from 'reduxStore/slices/auth/actions';

import { Text, PasswordInput } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

import { getTokenAsync } from 'utils/authRequests';

import { UnauthorisedTabParamList } from 'types/base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PageTitle,
  PageSubtitle,
  PrimaryText,
  AlmostBlackText
} from 'components/molecules/TextComponents';
import {
  AlmostWhiteContainerView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import SafePressable from 'components/molecules/SafePressable';
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
  otherOptsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%'
  },
  usernameInput: { marginBottom: 10, width: '100%' },
  passwordInput: { width: '100%' }
});

const LoginScreen = ({
  navigation
}: NativeStackScreenProps<UnauthorisedTabParamList, 'Login'>) => {
  const [username, setUsername] = React.useState<string>('');
  const [password, onChangePassword] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [usingEmail, setUsingEmail] = React.useState<boolean>(false);

  const { t } = useTranslation();

  const dispatch = useDispatch();

  const setTokenAsync = async (
    usernameToUse: string,
    passwordToUse: string,
    isEmail: boolean
  ) => {
    try {
      const res = await getTokenAsync(usernameToUse, passwordToUse, isEmail);
      const { access, refresh } = res;
      if (access) {
        dispatch(setAccessToken(access));
        dispatch(setRefreshToken(refresh));
      } else {
        Toast.show({
          type: 'error',
          text1: t('screens.logIn.failedLogin')
        });
        setSubmitting(false);
      }
    } catch (err) {
      console.log(err);
      Toast.show({
        type: 'error',
        text1: t('screens.logIn.failedLogin')
      });
      setSubmitting(false);
    }
  };

  return (
    <AlmostWhiteContainerView>
      <PageTitle text={t('screens.logIn.welcomeBack')} />
      <PageSubtitle
        text={
          usingEmail
            ? t('screens.logIn.enterEmail')
            : t('screens.logIn.enterNumber')
        }
      />
      <TransparentView style={styles.usernameInput}>
        <PhoneOrEmailInput
          usingEmail={usingEmail}
          value={username}
          changeUsingEmail={setUsingEmail}
          onValueChange={setUsername}
        />
      </TransparentView>
      <TransparentView style={styles.inputLabelWrapper}>
        <AlmostBlackText
          style={styles.inputLabel}
          text={t('screens.logIn.password')}
        />
      </TransparentView>
      <PasswordInput
        value={password}
        onChangeText={(text) => onChangePassword(text)}
        style={styles.passwordInput}
      />
      <TransparentView style={styles.otherOptsWrapper}>
        <SafePressable
          onPress={() => {
            navigation.navigate('ForgotPassword', { useEmail: usingEmail });
          }}
        >
          <PrimaryText text={t('screens.logIn.forgotPassword')} bold={true} />
        </SafePressable>
      </TransparentView>
      {submitting ? (
        <PaddedSpinner spinnerColor="buttonDefault" />
      ) : (
        <Button
          title={t('common.confirm')}
          onPress={() => {
            setSubmitting(true);
            setTokenAsync(username, password, usingEmail);
          }}
          style={styles.confirmButton}
        />
      )}
      <Text>{t('screens.logIn.dontHaveAccount')}</Text>
      <SafePressable
        onPress={() => {
          navigation.navigate('Signup');
        }}
      >
        <PrimaryText text={t('screens.logIn.signUp')} bold={true} />
      </SafePressable>
    </AlmostWhiteContainerView>
  );
};

export default LoginScreen;
