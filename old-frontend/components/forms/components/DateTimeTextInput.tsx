import SafePressable from 'components/molecules/SafePressable';
import { TransparentView } from 'components/molecules/ViewComponents';
import { TextInput, useThemeColor } from 'components/Themed';
import dayjs from 'dayjs';
import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function DateTimeTextInput({
  value,
  textInputStyle,
  containerStyle,
  onValueChange,
  mode = 'datetime',
  disabled = false,
  maximumDate,
  minimumDate,
  placeholder
}: {
  value: Date | null;
  textInputStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  onValueChange: Function;
  mode?: 'date' | 'datetime' | 'time';
  disabled?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
}) {
  const [isDatePickerVisible, setIsDatePickerVisible] =
    React.useState<boolean>(false);

  const disabledTextColor = useThemeColor({}, 'disabledGrey');

  const shownValue = value
    ? mode === 'date'
      ? dayjs(value).format('DD/MM/YYYY')
      : mode === 'datetime'
      ? dayjs(value).format('YYYY-MM-DD HH:mm')
      : dayjs(value).format('HH:mm')
    : '';

  return (
    <TransparentView style={containerStyle}>
      <SafePressable
        onPress={() => {
          if (!disabled) setIsDatePickerVisible(true);
        }}
      >
        <TransparentView pointerEvents="none">
          <TextInput
            value={shownValue}
            style={[
              textInputStyle || {},
              disabled ? { color: disabledTextColor } : {}
            ]}
            placeholder={placeholder || (mode === 'date' ? 'DD/MM/YYYY' : '')}
          />
        </TransparentView>
      </SafePressable>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode}
        display={Platform.OS === 'ios' ? 'inline' : undefined}
        date={value || undefined}
        onConfirm={(newValue) => {
          setIsDatePickerVisible(false);
          if (
            (minimumDate && newValue < minimumDate) ||
            (maximumDate && newValue > maximumDate)
          ) {
            return onValueChange(null);
          }
          onValueChange(newValue);
        }}
        onCancel={() => {
          setIsDatePickerVisible(false);
          // onValueChange(null);
        }}
        disabled={disabled}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
      />
    </TransparentView>
  );
}
