import { StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types/base';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen({
  navigation
}: RootTabScreenProps<'NotFound'>) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('screens.notFound.noScreen')}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={styles.link}
      >
        <Text style={styles.linkText}>{t('screens.notFound.goHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 20
  },
  link: {
    marginTop: 15,
    paddingVertical: 15
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7'
  }
});
