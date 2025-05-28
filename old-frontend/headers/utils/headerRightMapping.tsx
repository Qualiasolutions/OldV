import { WhiteText } from 'components/molecules/TextComponents';
import { useTranslation } from 'react-i18next';
import SafePressable from 'components/molecules/SafePressable';

export const headerRightMapping = {
  entities: {
    default: () => null
  },
  entityTypes: {
    holidays: ({ route, navigation }) => {
      const { t } = useTranslation();
      return (
        <SafePressable onPress={() => navigation.navigate('HolidayList')}>
          <WhiteText text={t('misc.editCountryList')} />
        </SafePressable>
      );
    },
    'holiday-dates': ({ route, navigation }) => {
      const { t } = useTranslation();
      return (
        <SafePressable onPress={() => navigation.navigate('HolidayList')}>
          <WhiteText text={t('misc.editCountryList')} />
        </SafePressable>
      );
    },
    default: () => null
  }
} as {
  entities: {
    [key: string]: React.ElementType | undefined;
  };
  entityTypes: {
    [key: string]: React.ElementType | undefined;
  };
};
