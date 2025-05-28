import { Text } from 'components/Themed';
import Checkbox from './Checkbox';
import SafePressable from './SafePressable';
import { StyleSheet } from 'react-native';
import { TransparentView } from './ViewComponents';

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 3
  }
});

export default function CheckboxesList({
  options,
  onToggleItem
}: {
  options: { label: string; value: any; checked?: boolean }[];
  onToggleItem: (val: any) => void;
}) {
  return (
    <TransparentView>
      {options.map((option) => {
        return (
          <SafePressable
            key={option.value}
            style={styles.listItem}
            onPress={() => {
              onToggleItem(option.value);
            }}
          >
            <Text>{option.label}</Text>
            <Checkbox checked={option.checked} disabled={true} />
          </SafePressable>
        );
      })}
    </TransparentView>
  );
}
