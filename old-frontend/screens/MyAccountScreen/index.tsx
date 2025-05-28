import { useTranslation } from 'react-i18next';

import { TransparentPaddedView } from 'components/molecules/ViewComponents';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { Button } from 'components/molecules/ButtonComponents';
import { useNavigation } from '@react-navigation/native';

export default function MyAccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView>
        <TransparentPaddedView>
          <Button
            title={t('screens.myAccount.accountDetails')}
            onPress={() => {
              (navigation.navigate as any)('EditAccountDetails');
            }}
          />
        </TransparentPaddedView>
        <TransparentPaddedView>
          <Button
            title={t('screens.myAccount.accountType')}
            onPress={() => {
              (navigation.navigate as any)('EditAccountType');
            }}
          />
        </TransparentPaddedView>
        <TransparentPaddedView>
          <Button
            title={t('screens.myAccount.phoneNumber')}
            onPress={() => {
              (navigation.navigate as any)('EditPhoneNumber');
            }}
          />
        </TransparentPaddedView>
        <TransparentPaddedView>
          <Button
            title={t('screens.myAccount.security')}
            onPress={() => {
              (navigation.navigate as any)('EditSecurity');
            }}
          />
        </TransparentPaddedView>
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
