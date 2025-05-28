import { useLayoutEffect } from 'react';
import {
  NativeStackHeaderProps,
  NativeStackNavigationOptions
} from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { headerMapping } from 'headers/utils/headerMappings';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from 'components/Themed';

export default function useCategoryHeader(
  categoryName: string,
  actualName?: boolean
) {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const headerTintColor = useThemeColor({}, 'white');

  useLayoutEffect(() => {
    if (categoryName) {
      const HeaderComponent =
        headerMapping.categories[categoryName] ||
        headerMapping.categories.default;

      const header = HeaderComponent
        ? (props: NativeStackHeaderProps) => <HeaderComponent {...props} />
        : null;

      const options: Partial<NativeStackNavigationOptions> = {
        title: actualName ? categoryName : t(`categories.${categoryName}`),
        headerShown: true,
        headerTintColor
      };

      if (header) {
        options.header = header;
      }

      navigation.setOptions(options);
    }
  }, [navigation, route, t, categoryName, actualName, headerTintColor]);
}
