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

export default function RoutinesAndTimeBlocksScreen({
  navigation
}: NativeStackScreenProps<SettingsTabParamList, 'RoutinesAndTimeBlocks'>) {
  const { t } = useTranslation();
  const { data: user } = useGetUserFullDetails();

  if (!user) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      <TransparentView>
        <Button
          title={t('pageTitles.routines')}
          onPress={() => {
            navigation.navigate('Routines');
          }}
          style={styles.button}
          disabled={!user.is_premium}
        />
        <Button
          title={t('pageTitles.timeBlocks')}
          onPress={() => {
            navigation.navigate('TimeBlocks');
          }}
          style={styles.button}
          disabled={!user.is_premium}
        />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
