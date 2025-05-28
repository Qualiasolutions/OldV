import React from 'react';

import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { SetupTabParamList } from 'types/base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PageTitle } from 'components/molecules/TextComponents';
import { TransparentPaddedView } from 'components/molecules/ViewComponents';

import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import UserInviteForm from 'components/organisms/UserInviteForm';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    paddingTop: 40
  }
});

const AddFamilyMemberScreen = ({
  navigation
}: NativeStackScreenProps<SetupTabParamList, 'AddFamilyMember'>) => {
  const { t } = useTranslation();

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView style={styles.container}>
        <PageTitle text={t('screens.addFamilyMember.title')} />
        <UserInviteForm
          isFamilyRequest={true}
          onSuccess={() => {
            navigation.push('AddFamily');
          }}
        />
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
};

export default AddFamilyMemberScreen;
