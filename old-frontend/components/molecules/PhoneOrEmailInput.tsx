import PhoneNumberInput from 'components/forms/components/PhoneNumberInput';
import { StyleSheet } from 'react-native';

import { TextInput } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import SafePressable from './SafePressable';
import { AlmostBlackText, PrimaryText } from './TextComponents';
import { TransparentView } from './ViewComponents';

const styles = StyleSheet.create({
  inputLabelWrapper: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%'
  },
  inputLabel: {
    fontSize: 12,
    textAlign: 'left'
  },
  extraOpts: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%'
  },
  textInput: {
    width: '100%'
  },
  phoneNumberInputContainer: { height: 40, width: '100%' }
});

export default function PhoneOrEmailInput({
  value,
  usingEmail,
  changeUsingEmail,
  onValueChange
}: {
  value: string;
  usingEmail: boolean;
  changeUsingEmail: (isEmail: boolean) => void;
  onValueChange: (val: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <TransparentView style={styles.textInput}>
      <TransparentView style={styles.inputLabelWrapper}>
        <AlmostBlackText
          style={styles.inputLabel}
          text={
            usingEmail
              ? t('screens.signUp.emailAddress')
              : t('screens.signUp.phoneNumber')
          }
        />
      </TransparentView>
      <TransparentView style={styles.textInput}>
        {usingEmail ? (
          <TextInput
            onChangeText={onValueChange}
            style={styles.textInput}
            value={value}
          />
        ) : (
          <PhoneNumberInput
            value={value}
            defaultValue={value}
            onChangeFormattedText={(text) => {
              onValueChange(text);
            }}
            containerStyle={styles.phoneNumberInputContainer}
          />
        )}
      </TransparentView>
      <TransparentView style={styles.extraOpts}>
        <SafePressable
          onPress={() => {
            onValueChange('');
            changeUsingEmail(!usingEmail);
          }}
        >
          <PrimaryText
            text={
              usingEmail
                ? t('components.phoneOrEmailInput.usePhone')
                : t('components.phoneOrEmailInput.useEmail')
            }
          />
        </SafePressable>
      </TransparentView>
    </TransparentView>
  );
}
