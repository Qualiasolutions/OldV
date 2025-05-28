import { Button } from 'components/molecules/ButtonComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { TextInput } from 'components/Themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useCreateContactMessageMutation } from 'reduxStore/services/api/contact';
import { validate } from 'email-validator';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

const styles = StyleSheet.create({
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 10
  },
  buttonWrapper: {
    marginTop: 10,
    flexDirection: 'row'
  }
});

function ContactScreen() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [createMessage, createMessageResult] =
    useCreateContactMessageMutation();
  return (
    <TransparentPaddedView>
      <TextInput
        value={message}
        onChangeText={setMessage}
        style={styles.textArea}
        multiline={true}
        maxLength={1000}
        placeholder={t('screens.contact.placeholder')}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('common.emailAddress')}
      />
      <TransparentView style={styles.buttonWrapper}>
        {createMessageResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            title={t('common.submit')}
            disabled={!(message && email && validate(email))}
            onPress={async () => {
              try {
                await createMessage({
                  email,
                  message
                }).unwrap();
                Toast.show({
                  type: 'success',
                  text1: t('screens.contact.success')
                });
                setEmail('');
                setMessage('');
              } catch {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
          />
        )}
      </TransparentView>
    </TransparentPaddedView>
  );
}

export default ContactScreen;
