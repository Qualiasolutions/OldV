import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';
import { Text, useThemeColor } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell
} from 'react-native-confirmation-code-field';
import { PrimaryText } from './TextComponents';
import { TransparentPaddedView } from './ViewComponents';
import SafePressable from './SafePressable';
import { PaddedSpinner } from './Spinners';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  confirmButton: {
    marginTop: 30,
    marginBottom: 15
  },
  cell: {
    width: 52,
    borderRadius: 10,
    height: 72,
    lineHeight: 68,
    fontSize: 30,
    borderWidth: 1,
    margin: 4,
    textAlign: 'center',
    overflow: 'hidden'
  }
});

type ValidationCodeInputProps = {
  validationId: number;
  isEmail?: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onSuccess: () => void;
  onError: (err: any) => void;
};
export default function ValidationCodeInput({
  isEmail,
  onVerify,
  onResend,
  onSuccess,
  onError
}: ValidationCodeInputProps) {
  const [submitting, setSubmitting] = useState(false);
  const [validationCode, onChangeValidationCode] = useState<string>('');
  const ref = useBlurOnFulfill({ value: validationCode, cellCount: 6 });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: validationCode,
    setValue: onChangeValidationCode
  });

  const greyColor = useThemeColor({}, 'grey');
  const whiteColor = useThemeColor({}, 'white');

  const { t } = useTranslation();

  return (
    <TransparentPaddedView style={styles.container}>
      <Text>
        {isEmail
          ? t('screens.validatePhone.enterEmailCode')
          : t('screens.validatePhone.enterCode')}
      </Text>
      <CodeField
        ref={ref}
        {...props}
        value={validationCode}
        onChangeText={(code) => {
          onChangeValidationCode(code);
        }}
        cellCount={6}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <Text
            key={index}
            style={[
              styles.cell,
              { borderColor: greyColor, backgroundColor: whiteColor },
              isFocused && { borderColor: greyColor }
            ]}
            onLayout={getCellOnLayoutHandler(index)}
          >
            {symbol || (isFocused ? <Cursor /> : null)}
          </Text>
        )}
        autoFocus
      />
      {submitting ? (
        <PaddedSpinner />
      ) : (
        <Button
          title={t('common.verify')}
          onPress={async () => {
            setSubmitting(true);
            try {
              await onVerify(validationCode);
              onSuccess();
            } catch (err) {
              onError(err);
            }
            setSubmitting(false);
          }}
          style={styles.confirmButton}
        />
      )}
      <Text>{t('screens.validatePhone.didntGetCode')}</Text>
      <SafePressable
        onPress={() => {
          onResend();
        }}
      >
        <PrimaryText text={t('screens.validatePhone.resend')} bold={true} />
      </SafePressable>
    </TransparentPaddedView>
  );
}
