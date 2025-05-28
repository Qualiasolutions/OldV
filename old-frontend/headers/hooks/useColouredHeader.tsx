import { useLayoutEffect } from 'react';
import {
  NativeStackHeaderProps,
  NativeStackNavigationOptions
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { headerWithBackgroundColor } from 'headers/utils/headerMappings';

export default function useColouredHeader(
  backgroundColor: string,
  tintColor: string,
  title: string
) {
  const navigation = useNavigation();
  const HeaderComponent = headerWithBackgroundColor(backgroundColor);

  useLayoutEffect(() => {
    const options: Partial<NativeStackNavigationOptions> = {
      title,
      headerTintColor: tintColor || '#ffffff',
      headerShown: true,
      header: (props: NativeStackHeaderProps) => <HeaderComponent {...props} />
    };
    navigation.setOptions(options);
  }, [backgroundColor, tintColor, title]);
}
