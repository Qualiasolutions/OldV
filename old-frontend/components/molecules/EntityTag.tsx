import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeColor } from 'components/Themed';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectEntityById } from 'reduxStore/slices/entities/selectors';
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
    overflow: 'hidden',
    height: 16,
    marginRight: 2
  }
});

export default function EntityTag({ entity }: { entity: number }) {
  const navigation = useNavigation<
    | BottomTabNavigationProp<RootTabParamList>
    | StackNavigationProp<ContentTabParamList>
    | StackNavigationProp<SettingsTabParamList>
  >();
  const greyColor = useThemeColor({}, 'grey');

  const entityObj = useSelector(selectEntityById(entity));

  if (!entityObj) {
    return null;
  }

  return (
    <SafePressable
      onPress={() => {
        (navigation.navigate as any)('ContentNavigator', {
          screen: 'EntityScreen',
          initial: false,
          params: { entityId: entity }
        });
      }}
    >
      <BlackText
        text={entityObj.name}
        style={[styles.tag, { backgroundColor: greyColor }]}
      />
    </SafePressable>
  );
}
