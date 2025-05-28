import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  ContentTabParamList,
  RootTabParamList,
  SettingsTabParamList
} from 'types/base';
import { TransparentView } from 'components/molecules/ViewComponents';
import {
  AlmostBlackText,
  BlackText
} from 'components/molecules/TextComponents';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import Layout from 'constants/Layout';
import Checkbox from './Checkbox';
import { Feather } from '@expo/vector-icons';
import SafePressable from './SafePressable';

const styles = StyleSheet.create({
  listEntry: {
    width: Layout.window.width,
    paddingHorizontal: 24,
    paddingVertical: 21,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1
  },
  listEntryText: {
    fontSize: 18,
    marginLeft: 23
  },
  row: { flexDirection: 'row', alignItems: 'center' }
});

// We will need to add more types here as we use
// this for more sub-navigators
type ListLinkProps = {
  text: string;
  toScreen?:
    | keyof RootTabParamList
    | keyof ContentTabParamList
    | keyof SettingsTabParamList;
  toScreenParams?: object;
  navMethod?: 'push' | 'navigate' | undefined;
  style?: ViewStyle;
  selected?: boolean;
  onPressContainer?: (selected?: boolean) => void;
  onSelect?: (v: boolean) => Promise<void>;
  showArrow?: boolean;
  subText?: string;
  disabled?: boolean;
};

export default function ListLinkWithCheckbox({
  text,
  toScreen,
  navMethod = 'navigate',
  toScreenParams = {},
  style = {},
  selected = false,
  onPressContainer,
  onSelect,
  showArrow = true,
  subText = '',
  disabled = false
}: ListLinkProps) {
  const navigation = useNavigation<
    | BottomTabNavigationProp<RootTabParamList>
    | StackNavigationProp<ContentTabParamList>
    | StackNavigationProp<SettingsTabParamList>
  >();

  return (
    <SafePressable
      onPress={() => {
        if (!disabled) {
          if (onPressContainer) {
            return onPressContainer(selected);
          }
          if (navMethod === 'push') {
            (navigation as any).push(toScreen, toScreenParams);
          } else {
            (navigation.navigate as any)(toScreen, toScreenParams);
          }
        }
      }}
    >
      <TransparentView style={[styles.listEntry, style]}>
        <TransparentView style={styles.row}>
          <Checkbox onValueChange={onSelect} checked={selected} />
          <TransparentView>
            <BlackText text={text} style={styles.listEntryText} />
            {subText ? (
              <AlmostBlackText
                text={subText}
                style={[styles.listEntryText, { fontSize: 15 }]}
              />
            ) : null}
          </TransparentView>
        </TransparentView>

        {showArrow && <Feather name="chevron-right" size={30} />}
      </TransparentView>
    </SafePressable>
  );
}
