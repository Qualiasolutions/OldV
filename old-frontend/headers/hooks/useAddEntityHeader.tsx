import { useLayoutEffect } from 'react';
import {
  NativeStackHeaderProps,
  NativeStackNavigationOptions
} from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { headerMapping } from 'headers/utils/headerMappings';
import { headerTintColorMapping } from 'headers/utils/headerTintColorMapping';
import { headerRightMapping } from 'headers/utils/headerRightMapping';
import { useTranslation } from 'react-i18next';

export default function useAddEntityHeader(entityTypeName: string) {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    if (entityTypeName) {
      const HeaderRightComponent = Object.keys(headerRightMapping).includes(
        entityTypeName
      )
        ? headerRightMapping.entityTypes[entityTypeName]
        : headerRightMapping.entityTypes.default;

      const headerRight = () =>
        HeaderRightComponent ? (
          <HeaderRightComponent navigation={navigation} route={route} />
        ) : null;

      const headerTintColor = Object.keys(headerTintColorMapping).includes(
        entityTypeName
      )
        ? headerTintColorMapping[entityTypeName]
        : headerTintColorMapping.default;

      const HeaderComponent =
        headerMapping.entityTypes[entityTypeName] ||
        headerMapping.entityTypes.default;

      const header = HeaderComponent
        ? (props: NativeStackHeaderProps) => <HeaderComponent {...props} />
        : null;

      const options: Partial<NativeStackNavigationOptions> = {
        title: `Add ${t(`entityResourceTypeNames.${entityTypeName}`)}`,
        headerRight,
        headerTintColor,
        headerShown: true
      };

      if (header) {
        options.header = header;
      }

      navigation.setOptions(options);
    }
  }, [entityTypeName]);
}
