import { SettingsTabParamList } from 'types/base';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TransparentContainerView } from 'components/molecules/ViewComponents';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { StyleSheet } from 'react-native';
import UserInviteForm from 'components/organisms/UserInviteForm';

const styles = StyleSheet.create({
  otherOptsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: { marginTop: 10 },
  container: { justifyContent: 'flex-start' },
  emailTextInput: { width: '100%' }
});

const CreateUserInviteScreen = ({
  navigation,
  route
}: NativeStackScreenProps<SettingsTabParamList, 'CreateUserInvite'>) => {
  const isFamilyRequest = route.params?.familyRequest;

  return (
    <TransparentFullPageScrollView>
      <TransparentContainerView style={styles.container}>
        <UserInviteForm
          isFamilyRequest={isFamilyRequest}
          onSuccess={() => {
            if (isFamilyRequest) {
              navigation.navigate('FamilySettings');
            } else {
              navigation.navigate('FriendSettings');
            }
          }}
        />
      </TransparentContainerView>
    </TransparentFullPageScrollView>
  );
};

export default CreateUserInviteScreen;
