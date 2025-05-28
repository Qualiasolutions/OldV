import { Text } from 'components/Themed';
import { useTranslation } from 'react-i18next';

export default function GenericError({
  errorMessage
}: {
  errorMessage?: string;
}) {
  const { t } = useTranslation();
  return <Text>{t('components.genericError.message')}</Text>;
}
