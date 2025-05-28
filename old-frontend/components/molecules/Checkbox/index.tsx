import { useThemeColor } from 'components/Themed';
import React, { useEffect, useState } from 'react';
import { ViewStyle, ImageSourcePropType } from 'react-native';
import { StyleSheet } from 'react-native';
import { Image } from '../ImageComponents';
import SafePressable from '../SafePressable';
import { AlmostBlackText } from '../TextComponents';
import { TransparentView } from '../ViewComponents';

export const CHECKBOX_HEIGHT = 23;
export const CHECKBOX_WIDTH = 23;
export const CHECKBOX_RADIUS = 2;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 5
  },
  checkbox: {
    height: CHECKBOX_HEIGHT,
    width: CHECKBOX_WIDTH,
    borderRadius: CHECKBOX_RADIUS,
    justifyContent: 'center',
    alignItems: 'center'
  },
  check: {
    height: 17,
    width: 13
  }
});

type CheckboxProps = {
  checked?: boolean;
  style?: ViewStyle;
  wrapperStyle?: ViewStyle;
  disabled?: boolean;
  smoothChecking?: boolean;
  color?: string;
  onValueChange?: (value: any) => Promise<void>;
  label?: string;
  image?: ImageSourcePropType;
};

export default function Checkbox({
  checked = false,
  style = {},
  wrapperStyle = {},
  disabled = false,
  smoothChecking = true,
  color,
  onValueChange,
  label,
  image
}: CheckboxProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const greyColor = useThemeColor({}, 'grey');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isChecked = smoothChecking
    ? (submitting && !checked) || (!submitting && checked)
    : checked;
  const backgroundColor = isChecked ? color || primaryColor : greyColor;

  /*
  In order to smooth the checking, we ensure that it is checked
  from the point of being clicked to the point at which the
  received value of `checked` changes.

  In the event that the `onPress` handler errors, we also call
  setSubmitting(false) so that it isn't forced to be checked.
  */
  useEffect(() => {
    setSubmitting(false);
  }, [checked]);

  const onPress = async () => {
    if (onValueChange) {
      if (smoothChecking) {
        setSubmitting(true);
      }
      try {
        await onValueChange(checked);
      } catch (err) {
        setSubmitting(false);
      }
    }
  };

  return (
    <TransparentView style={[styles.wrapper, wrapperStyle]}>
      <SafePressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.checkbox, { backgroundColor }, style]}
      >
        {isChecked && (
          <Image
            source={image || require('assets/images/icons/check.png')}
            style={styles.check}
          />
        )}
      </SafePressable>
      {label && (
        <SafePressable onPress={onPress} disabled={disabled}>
          <AlmostBlackText text={label} />
        </SafePressable>
      )}
    </TransparentView>
  );
}
