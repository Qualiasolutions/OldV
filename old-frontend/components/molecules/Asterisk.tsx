import { useThemeColor } from 'components/Themed';
import React from 'react';
import { Text } from 'react-native';

export default function Asterisk({ textColor = '' }) {
  const color = useThemeColor({}, 'primary');
  return (
    <Text style={[{ color }, !!textColor && { color: textColor }]}>*</Text>
  );
}
