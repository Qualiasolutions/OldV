import { Button } from 'components/molecules/ButtonComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { PageTitle } from 'components/molecules/TextComponents';
import { TransparentPaddedView } from 'components/molecules/ViewComponents';
import { PasswordInput } from 'components/Themed';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useSecureUpdateUserDetailsMutation } from 'reduxStore/services/api/user';
import { isFieldErrorCodeError } from 'types/signup';

export default function EditSecurityScreen() {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConf, setNewPasswordConf] = useState('');
  const [updateUserDetails, updateUserDetailsResult] =
    useSecureUpdateUserDetailsMutation();
  const { data: userDetails } = useGetUserFullDetails();

  if (!userDetails) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentPaddedView>
      <PageTitle text={t('screens.editSecurity.updatePassword')} />
      <PasswordInput
        value={oldPassword}
        onChangeText={setOldPassword}
        placeholder={t('screens.editSecurity.oldPassword')}
        style={{ marginBottom: 30 }}
      />
      <PasswordInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t('screens.editSecurity.newPassword')}
        style={{ marginBottom: 10 }}
      />
      <PasswordInput
        value={newPasswordConf}
        onChangeText={setNewPasswordConf}
        placeholder={t('screens.editSecurity.newPasswordConf')}
        style={{ marginBottom: 30 }}
      />

      {updateUserDetailsResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          title={t('common.update')}
          onPress={async () => {
            try {
              await updateUserDetails({
                user_id: userDetails.id,
                password: newPassword,
                old_password: oldPassword
              }).unwrap();
              Toast.show({
                type: 'success',
                text1: t('screens.editSecurity.passwordSuccess')
              });
            } catch (err) {
              if (
                isFieldErrorCodeError(
                  'old_password',
                  'invalid_old_password'
                )(err)
              ) {
                Toast.show({
                  type: 'error',
                  text1: t('screens.editSecurity.oldPasswordIncorrect')
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }
          }}
          disabled={
            !oldPassword || !newPassword || !(newPassword === newPasswordConf)
          }
        />
      )}
    </TransparentPaddedView>
  );
}
