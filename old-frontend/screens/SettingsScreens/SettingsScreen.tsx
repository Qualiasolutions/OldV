import { StyleSheet } from 'react-native';
import { Button } from 'components/molecules/ButtonComponents';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTranslation } from 'react-i18next';
import { SettingsTabParamList } from 'types/base';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { FullPageSpinner } from 'components/molecules/Spinners';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  button: {
    marginBottom: 10
  }
});

const SettingsScreen = ({
  navigation
}: NativeStackScreenProps<SettingsTabParamList, 'Settings'>) => {
  const { t } = useTranslation();
  const { data: user } = useGetUserFullDetails();

  if (!user) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      <TransparentView>
        <Button
          title={t('pageTitles.familySettings')}
          onPress={() => {
            navigation.navigate('FamilySettings');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.integrations')}
          onPress={() => {
            navigation.navigate('Integrations');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.personalAssistant')}
          onPress={() => {
            navigation.navigate('PersonalAssistant');
          }}
          style={styles.button}
          disabled={!user.is_premium}
        />
        <Button
          title={t('pageTitles.routineAndTimeBlocks')}
          onPress={() => {
            navigation.navigate('RoutinesAndTimeBlocks');
          }}
          style={styles.button}
          disabled={!user.is_premium}
        />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
};

export default SettingsScreen;
