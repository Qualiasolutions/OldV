import { BlackText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { TextInput, useThemeColor } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import { StyleSheet, ViewStyle } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    width: 70,
    marginRight: 10
  }
});
export default function Duration({
  value,
  textInputStyle,
  onChange,
  disabled
}: {
  value?: number | null;
  textInputStyle: ViewStyle;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const disabledTextColor = useThemeColor({}, 'disabledGrey');

  return (
    <TransparentView style={styles.container}>
      <TextInput
        value={value ? String(value) : ''}
        keyboardType="numeric"
        style={[
          textInputStyle,
          styles.input,
          disabled ? { color: disabledTextColor } : {}
        ]}
        onChangeText={(val) => {
          onChange(parseInt(val));
        }}
        editable={!disabled}
      />
      <BlackText text={t('common.minutes')} />
    </TransparentView>
  );
}
