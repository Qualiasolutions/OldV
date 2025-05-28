import Checkbox from 'components/molecules/Checkbox';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { StyleSheet, ViewStyle } from 'react-native';

export type RadioObjectValueType<T> = {
  id: T;
};
export type RadioPermittedValues<T> = {
  value: RadioObjectValueType<T>;
  label: string;
}[];

const styles = StyleSheet.create({
  label: { marginRight: 10 },
  wrapper: { flexDirection: 'row' }
});

export default function RadioInput<T>({
  value,
  label,
  permittedValues,
  onValueChange,
  buttonsContainerStyle,
  checkboxWrapperStyle,
  checkboxStyle
}: {
  value: any;
  label?: string;
  permittedValues: RadioPermittedValues<T>;
  onValueChange: (value: RadioObjectValueType<T>) => void;
  buttonsContainerStyle?: ViewStyle;
  checkboxWrapperStyle?: ViewStyle;
  checkboxStyle?: ViewStyle;
}) {
  const radioButtons = permittedValues.map((obj: any, i: number) => {
    return (
      <Checkbox
        checked={value === obj.value.id}
        smoothChecking={false}
        onValueChange={async (val) => {
          onValueChange(obj.value);
        }}
        label={obj.label}
        key={i}
        wrapperStyle={checkboxWrapperStyle || {}}
        style={checkboxStyle || {}}
      />
    );
  });
  return (
    <TransparentView style={styles.wrapper}>
      {label && <AlmostBlackText text={label} style={styles.label} />}
      <TransparentView style={buttonsContainerStyle || {}}>
        {radioButtons}
      </TransparentView>
    </TransparentView>
  );
}
