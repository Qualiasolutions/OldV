import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'components/molecules/ButtonComponents';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SettingsTabParamList } from 'types/base';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  button: {
    marginBottom: 10
  }
});

export default function DayPreferencesScreen({
  navigation
}: NativeStackScreenProps<SettingsTabParamList, 'DayPreferences'>) {
  const { t } = useTranslation();

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      <TransparentView>
        <Button
          title={t('pageTitles.blockedDayPreferences')}
          onPress={() => {
            navigation.navigate('BlockedDayPreferences');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.preferredDayPreferences')}
          onPress={() => {
            navigation.navigate('PreferredDayPreferences');
          }}
          style={styles.button}
        />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
