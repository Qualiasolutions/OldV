import { Text } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import { TransparentContainerView } from './ViewComponents';

export default function NoPermissionsPage() {
  const { t } = useTranslation();
  return (
    <TransparentContainerView>
      <Text>{t('screens.entityScreen.noPermsBlurb')}</Text>
    </TransparentContainerView>
  );
}
