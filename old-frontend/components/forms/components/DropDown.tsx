import { TextInput, useThemeColor, View } from 'components/Themed';
import { useState } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import DropDownPicker, { ListModeType } from 'react-native-dropdown-picker';

const otherKey = '%%%%%%OTHER%%%%%%';

const styles = StyleSheet.create({
  pickerStyle: {
    borderWidth: 1,
    minHeight: 0 // Need to override the default
  },
  textStyle: {
    fontFamily: 'Poppins',
    fontSize: 15
  },
  textInput: {
    height: 50,
    flex: 1,
    marginTop: 10
  }
});

export default function DropDown({
  value = '',
  items = [],
  setFormValues = () => {},
  dropdownPlaceholder = 'Select',
  listMode = 'SCROLLVIEW',
  style = {},
  textInputStyle = {},
  textStyle = {},
  labelStyle = {},
  containerStyle = {},
  allowOther = false,
  disabled = false
}: {
  value: string;
  items: { label: string; value: any; disabled?: boolean }[];
  setFormValues: (item: any) => void;
  dropdownPlaceholder?: string;
  listMode?: ListModeType;
  style?: ViewStyle;
  textInputStyle?: ViewStyle;
  textStyle?: TextStyle;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  allowOther?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [showOther, setShowOther] = useState<boolean>(false);
  const borderColor = useThemeColor({}, 'grey');
  const disabledTextColor = useThemeColor({}, 'disabledGrey');

  return (
    <View style={containerStyle}>
      <DropDownPicker
        listMode={listMode}
        open={open}
        value={value}
        items={
          allowOther ? [...items, { label: 'Other', value: otherKey }] : items
        }
        setOpen={setOpen}
        setValue={(item) => {
          if (item(null) === otherKey) {
            setFormValues('');
            return setShowOther(true);
          }
          setShowOther(false);
          setFormValues(item(null));
        }}
        placeholder={dropdownPlaceholder}
        style={[styles.pickerStyle, { borderColor }, style]}
        textStyle={[
          styles.textStyle,
          disabled
            ? {
                color: disabledTextColor
              }
            : {},
          textStyle
        ]}
        labelStyle={labelStyle}
        disabledItemLabelStyle={{ color: disabledTextColor }}
        disabled={disabled}
      />
      {showOther && (
        <TextInput
          value={value}
          placeholder="Type here"
          onChangeText={(newValue) => {
            setFormValues(newValue);
          }}
          style={[styles.textInput, textInputStyle]}
        />
      )}
    </View>
  );
}
