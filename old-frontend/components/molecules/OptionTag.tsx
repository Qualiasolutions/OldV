import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeColor } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import {
  ContentTabParamList,
  RootTabParamList,
  SettingsTabParamList
} from 'types/base';
import SafePressable from './SafePressable';
import { BlackText } from './TextComponents';

const styles = StyleSheet.create({
  tag: {
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    height: 16,
    marginRight: 2,
    overflow: 'hidden'
  }
});

export default function OptionTag({ tagName }: { tagName: string }) {
  const navigation = useNavigation<
    | BottomTabNavigationProp<RootTabParamList>
    | StackNavigationProp<ContentTabParamList>
    | StackNavigationProp<SettingsTabParamList>
  >();
  const { t } = useTranslation();
  const greyColor = useThemeColor({}, 'grey');

  return (
    <SafePressable
      onPress={() => {
        (navigation.navigate as any)('ContentNavigator', {
          screen: 'TagScreen',
          initial: false,
          params: { tagName }
        });
      }}
    >
      <BlackText
        text={t(`tags.${tagName}`)}
        style={[styles.tag, { backgroundColor: greyColor }]}
      />
    </SafePressable>
  );
}
