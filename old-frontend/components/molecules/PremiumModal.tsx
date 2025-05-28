import { Text, useThemeColor, View } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setShowPremiumModal } from 'reduxStore/slices/misc/actions';
import { selectShowPremiumModal } from 'reduxStore/slices/misc/selectors';
import { SmallButton } from './ButtonComponents';
import { Modal } from './Modals';
import Constants from 'expo-constants';

const vuetWebUrl = Constants.expoConfig?.extra?.vuetWebUrl;

const useStyles = () => {
  const primaryColor = useThemeColor({}, 'primary');
  return StyleSheet.create({
    title: {
      fontSize: 16,
      color: primaryColor
    },
    buttonWrapper: {
      flexDirection: 'row',
      marginTop: 6
    }
  });
};

export default function PremiumModal() {
  const { t } = useTranslation();
  const visible = useSelector(selectShowPremiumModal);
  const dispatch = useDispatch();
  const styles = useStyles();

  return (
    <Modal
      visible={visible}
      onRequestClose={() => {
        dispatch(setShowPremiumModal(false));
      }}
    >
      <Text style={styles.title} bold={true}>
        {t('components.premiumModal.upgradeToPremium')}
      </Text>
      <Text>{t('components.premiumModal.blurb')}</Text>
      <View style={styles.buttonWrapper}>
        <SmallButton
          title={t('components.premiumModal.upgrade')}
          onPress={() => {
            Linking.openURL(vuetWebUrl);
          }}
        />
      </View>
    </Modal>
  );
}
