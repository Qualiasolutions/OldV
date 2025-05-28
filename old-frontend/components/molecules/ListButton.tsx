import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlackText } from 'components/molecules/TextComponents';
import { Feather } from '@expo/vector-icons';
import { elevation } from 'styles/elevation';
import { useThemeColor } from 'components/Themed';
import SafePressable from './SafePressable';

const styles = StyleSheet.create({
  listEntry: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listEntryText: {
    fontSize: 18
  }
});

type ListButtonProps = {
  text: string;
  onPress?: () => void;
  style?: ViewStyle;
  iconName?: keyof typeof Feather.glyphMap;
};

export default function ListButton({
  text,
  onPress,
  style = {},
  iconName
}: ListButtonProps) {
  const whiteColor = useThemeColor({}, 'white');
  const almostWhiteColor = useThemeColor({}, 'almostWhite');
  return (
    <SafePressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listEntry,
        style,
        elevation.elevated,
        {
          backgroundColor: pressed ? almostWhiteColor : whiteColor
        }
      ]}
    >
      <BlackText text={text} style={styles.listEntryText} />
      {iconName && <Feather name={iconName} size={25} />}
    </SafePressable>
  );
}
