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

export default function PersonalAssistantScreen({
  navigation
}: NativeStackScreenProps<SettingsTabParamList, 'PersonalAssistant'>) {
  const { t } = useTranslation();

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      <TransparentView>
        <Button
          title={t('pageTitles.whatMyFamilySees')}
          onPress={() => {
            navigation.navigate('WhatMyFamilySees');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.addingTasks')}
          onPress={() => {
            navigation.navigate('AddingTasks');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.dayPreferences')}
          onPress={() => {
            navigation.navigate('DayPreferences');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.categoryPreferences')}
          onPress={() => {
            navigation.navigate('CategoryPreferences');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.taskLimits')}
          onPress={() => {
            navigation.navigate('TaskLimits');
          }}
          style={styles.button}
        />
        <Button
          title={t('pageTitles.flexibleTaskPreferences')}
          onPress={() => {
            navigation.navigate('FlexibleTaskPreferences');
          }}
          style={styles.button}
        />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
