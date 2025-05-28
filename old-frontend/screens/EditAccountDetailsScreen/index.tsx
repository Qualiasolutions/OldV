import { useMyAccountForm } from './myAccountFormFieldTypes';
import { useTranslation } from 'react-i18next';

import { TransparentView } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useEffect, useState } from 'react';
import TypedForm from 'components/forms/TypedForm';
import { Button } from 'components/molecules/ButtonComponents';
import { useFormUpdateUserDetailsMutation } from 'reduxStore/services/api/user';
import { elevation } from 'styles/elevation';
import { parseFormDataFormValues } from 'components/forms/utils/parseFormValues';

const styles = StyleSheet.create({
  formContainer: {
    marginBottom: 20
  },
  buttonWrapper: {
    flex: 1,
    alignItems: 'center'
  }
});

type MyAccountFormFields = {
  profile_image: string;
  first_name: string;
  last_name: string;
  dob: Date;
  member_colour: string;
};

export default function EditAccountDetailsScreen() {
  const { data: userDetails } = useGetUserFullDetails();
  const { t } = useTranslation();
  const formFieldsTemplate = useMyAccountForm();
  const [newValues, setNewValues] = useState<null | MyAccountFormFields>(null);
  const [updateUserDetails, updateUserDetailsResult] =
    useFormUpdateUserDetailsMutation();

  useEffect(() => {
    if (userDetails) {
      setNewValues({
        profile_image: userDetails.presigned_profile_image_url || '',
        first_name: userDetails.first_name,
        last_name: userDetails.last_name,
        dob: new Date(`${userDetails.dob}T12:00:00`),
        member_colour: userDetails?.member_colour
      });
    }
  }, [userDetails]);

  if (!userDetails || !newValues) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentFullPageScrollView>
      <TransparentView style={styles.formContainer}>
        <TypedForm
          fields={formFieldsTemplate}
          formValues={newValues}
          onFormValuesChange={(values: MyAccountFormFields) => {
            setNewValues(values);
          }}
          inlineFields={false}
          sectionStyle={StyleSheet.flatten([
            { backgroundColor: 'transparent', marginBottom: 0 },
            elevation.unelevated
          ])}
        />
        <TransparentView style={styles.buttonWrapper}>
          {updateUserDetailsResult.isLoading ? (
            <PaddedSpinner />
          ) : (
            <Button
              onPress={async () => {
                try {
                  const parsedFormValues = parseFormDataFormValues(
                    newValues,
                    formFieldsTemplate
                  );
                  await updateUserDetails({
                    formData: parsedFormValues,
                    userId: userDetails.id
                  }).unwrap();
                  Toast.show({
                    type: 'success',
                    text1: t('screens.myAccount.updateSuccess')
                  });
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              title={t('common.update')}
            />
          )}
        </TransparentView>
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
