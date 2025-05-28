import { FontAwesome } from '@expo/vector-icons';
import { Text } from 'components/Themed';
import {
  Image,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle
} from 'react-native';
import { WhiteText } from './TextComponents';

export default function SquareButton({
  onPress,
  fontAwesomeIconName,
  fontAwesomeIconSize = 30,
  fontAwesomeIconColor = '#000',
  buttonText = '',
  buttonSize = 30,
  buttonStyle = {},
  buttonTextStyle = {},
  customIcon = undefined
}: {
  onPress: Function;
  fontAwesomeIconName?: keyof typeof FontAwesome.glyphMap;
  fontAwesomeIconSize?: number;
  fontAwesomeIconColor?: string;
  buttonText?: string;
  buttonSize?: number;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  customIcon?: JSX.Element;
}) {
  let icon;
  if (fontAwesomeIconName) {
    icon = (
      <FontAwesome
        name={fontAwesomeIconName}
        size={fontAwesomeIconSize}
        color={fontAwesomeIconColor}
      />
    );
  } else if (buttonText) {
    icon = (
      <WhiteText
        style={[
          styles.buttonText,
          {
            width: buttonSize,
            height: buttonSize
          },
          buttonTextStyle
        ]}
        text={buttonText}
        bold={true}
      />
    );
  } else if (customIcon) {
    icon = customIcon;
  }

  return (
    <TouchableOpacity
      style={[styles.squareButton, buttonStyle]}
      onPress={() => {
        onPress();
      }}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  squareButton: {
    backgroundColor: '#C4C4C4',
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5
  },
  buttonText: {
    fontSize: 11
  }
});
