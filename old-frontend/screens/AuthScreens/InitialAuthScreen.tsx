import React from 'react';

import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { PasswordInput, TextInput } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

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
import SafePressable from 'components/molecules/SafePressable';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

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

export default function InitialAuthScreen({
  navigation
}: NativeStackScreenProps<UnauthorisedTabParamList, 'Login'>) {
  const [username, setUsername] = React.useState<string>('');
  const [password, onChangePassword] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const { t } = useTranslation();

  return (
    <AlmostWhiteContainerView>
      <PageTitle text={t('screens.logIn.welcomeBack')} />
      <PageSubtitle text={t('screens.logIn.enterEmail')} />
      <TransparentView style={styles.inputLabelWrapper}>
        <AlmostBlackText
          style={styles.inputLabel}
          text={t('screens.logIn.username')}
        />
      </TransparentView>
      <TransparentView style={styles.usernameInput}>
        <TextInput
          onChangeText={setUsername}
          // style={styles.textInput}
          value={username}
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
      {submitting ? (
        <PaddedSpinner spinnerColor="buttonDefault" />
      ) : (
        <Button
          title={t('common.confirm')}
          onPress={() => {
            if (username === 'pbf@vuet.app' && password === '673432') {
              navigation.navigate('Login');
            } else {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }}
          style={styles.confirmButton}
        />
      )}
    </AlmostWhiteContainerView>
  );
}
