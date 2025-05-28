import React from 'react';
import { Text, useThemeColor } from 'components/Themed';
import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { t } from 'i18next';
import Colors from '../../constants/Colors';
import SafePressable from './SafePressable';

export const styles = StyleSheet.create({
  dropDownView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.offWhite,
    paddingHorizontal: 15,
    height: 40,
    width: 242,
    borderRadius: 6
  }
});

const DropDown = ({
  value = t('common.pleaseSelect'),
  onPress = () => {},
  disabled = false
}) => {
  return (
    <SafePressable
      disabled={disabled}
      onPress={onPress}
      style={styles.dropDownView}
    >
      <Text
        style={
          value == t('common.pleaseSelect') && {
            color: Colors.light.mediumLightGrey
          }
        }
      >
        {value}
      </Text>
      <Feather
        name="chevron-down"
        size={20}
        color={useThemeColor({}, 'lightBlack')}
      />
    </SafePressable>
  );
};

export default DropDown;
