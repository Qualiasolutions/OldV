import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useThemeColor, View } from 'components/Themed';

import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from 'components/molecules/TopNav';
import { Text } from 'components/Themed';

import CategoriesGrid from './CategoriesGrid';
import { Switch } from 'react-native-gesture-handler';
import { TransparentView } from 'components/molecules/ViewComponents';
import ProfessionalCategoriesList from './ProfessionalCategoriesList';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white'
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10
  },
  toggle: {
    marginHorizontal: 10
  }
});

export default function CategoriesPage() {
  const [professionalMode, setProfessionalMode] = useState(false);
  const primaryColor = useThemeColor({}, 'primary');
  const lightYellowColor = useThemeColor({}, 'lightYellow');
  const greyColor = useThemeColor({}, 'grey');
  return (
    <SafeAreaView style={styles.container}>
      <TopNav />
      <TransparentView style={styles.toggleContainer}>
        <Text bold={!professionalMode}>Personal</Text>
        <Switch
          onValueChange={setProfessionalMode}
          value={professionalMode}
          thumbColor={professionalMode ? primaryColor : greyColor}
          trackColor={{ true: lightYellowColor }}
          style={styles.toggle}
        />
        <Text bold={professionalMode}>Professional</Text>
      </TransparentView>
      <View style={styles.container}>
        {professionalMode ? <ProfessionalCategoriesList /> : <CategoriesGrid />}
      </View>
    </SafeAreaView>
  );
}
