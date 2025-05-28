import SafePressable from 'components/molecules/SafePressable';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  colorView: {
    width: 100,
    height: 15
  }
});

const generateRandomColor = () => {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    parts.push(Math.floor(256 * Math.random()));
  }
  return parts
    .map((intCode) => ('0' + intCode.toString(16)).slice(-2))
    .join('');
};
export function ColorPicker({
  value,
  onValueChange,
  height,
  width
}: {
  value: string;
  onValueChange: (value: string) => any;
  height?: number;
  width?: number;
}) {
  useEffect(() => {
    if (!value) {
      const newColor = generateRandomColor();
      onValueChange(newColor);
    }
  }, [value, onValueChange]);

  return (
    <SafePressable
      onPress={() => {
        const newColor = generateRandomColor();
        onValueChange(newColor);
      }}
    >
      <View
        style={[
          styles.colorView,
          {
            backgroundColor: `#${value}`
          },
          height ? { height: height } : null,
          width ? { width: width } : null
        ]}
      />
    </SafePressable>
  );
}
