import { useThemeColor } from 'components/Themed';
import { ColorName } from 'constants/Colors';
import { StyleSheet } from 'react-native';
import { Text as DefaultText } from 'react-native';

const styles = StyleSheet.create({
  common: {
    fontFamily: 'Poppins'
  },
  header: {
    fontSize: 26,
    marginBottom: 20
  },
  subheader: {
    fontSize: 14,
    marginBottom: 20
  }
});

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'] & { bold?: boolean };

const colouredText = (colorName: ColorName) => {
  return (props: TextProps & { text: string }) => {
    const { style, text, ...otherProps } = props;
    const color = useThemeColor({}, colorName);

    return (
      <DefaultText
        style={[
          { color },
          props.bold
            ? { fontFamily: 'Poppins-Bold' }
            : { fontFamily: 'Poppins' },
          style
        ]}
        {...otherProps}
      >
        {text}
      </DefaultText>
    );
  };
};

export const PrimaryText = colouredText('primary');
export const AlmostBlackText = colouredText('almostBlack');
export const LightBlackText = colouredText('lightBlack');
export const BlackText = colouredText('black');
export const OrangeText = colouredText('orange');
export const WhiteText = colouredText('white');
export const AlmostWhiteText = colouredText('almostWhite');
export const GreyText = colouredText('grey');
export const MediumGreyText = colouredText('mediumGrey');
export const MediumLightGreyText = colouredText('mediumLightGrey');

export function PageTitle(props: TextProps & { text: string }) {
  const { style, text, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    'headerText'
  );

  return (
    <PrimaryText
      style={[{ color }, styles.common, styles.header, style]}
      {...otherProps}
      text={text}
      bold={true}
    />
  );
}

export function PageSubtitle(props: TextProps & { text: string }) {
  const { style, text, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    'subheaderText'
  );

  return (
    <DefaultText
      style={[{ color }, styles.common, styles.subheader, style]}
      {...otherProps}
    >
      {text}
    </DefaultText>
  );
}
