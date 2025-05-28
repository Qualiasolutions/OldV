import { PrimaryText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SafePressable from 'components/molecules/SafePressable';

import { Button } from 'components/molecules/ButtonComponents';
import { Feather } from '@expo/vector-icons';
import { useLazyGetUserMinimalDetailsQuery } from 'reduxStore/services/api/user';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import PhoneNumberInput from 'components/forms/components/PhoneNumberInput';

const styles = StyleSheet.create({
  phoneNumberInputWrapper: {
    width: '100%'
  },
  phoneNumberInput: { flex: 1, marginRight: 10 },
  phoneNumberInputPair: {
    flexDirection: 'row',
    width: '100%'
  },
  phoneNumberAddButton: {
    alignItems: 'flex-end'
  },
  cancelButton: { marginHorizontal: 10 }
});

export default function PhoneNumberMemberFinder({
  onFindId,
  addText
}: {
  onFindId: (id: number) => void;
  addText?: string;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [newExternalNumber, setNewExternalNumber] = useState('');
  const [getMinimalDetails, getMinimalDetailsResult] =
    useLazyGetUserMinimalDetailsQuery();
  const { t } = useTranslation();

  return (
    <TransparentView style={styles.phoneNumberInputWrapper}>
      {addingNew ? (
        <>
          <TransparentView style={styles.phoneNumberInputPair}>
            <PhoneNumberInput
              onChangeFormattedText={(newPhoneNumber) => {
                setNewExternalNumber(newPhoneNumber);
              }}
              containerStyle={styles.phoneNumberInput}
            />
            <TransparentView style={styles.phoneNumberAddButton}>
              {getMinimalDetailsResult.isLoading ? (
                <PaddedSpinner />
              ) : (
                <>
                  <Button
                    onPress={async () => {
                      try {
                        const res = await getMinimalDetails(
                          newExternalNumber
                        ).unwrap();
                        onFindId(res.id);
                      } catch (err) {
                        // This doesn't show under modal
                        Toast.show({
                          type: 'error',
                          text1: t('components.memberSelector.noMemberError')
                        });
                      }
                    }}
                    title={t('common.add')}
                  />
                </>
              )}
            </TransparentView>
          </TransparentView>
          <>
            <TouchableOpacity
              onPress={() => setAddingNew(false)}
              style={styles.cancelButton}
            >
              <PrimaryText text={t('common.cancel')} />
            </TouchableOpacity>
            {getMinimalDetailsResult.isError && (
              <TransparentView style={styles.phoneNumberAddButton}>
                <Feather name="x" color="red" size={40} />
                <PrimaryText
                  text={t('components.memberSelector.noMemberError')}
                />
              </TransparentView>
            )}
          </>
        </>
      ) : (
        <SafePressable onPress={() => setAddingNew(true)}>
          <PrimaryText text={addText || t('common.addNew')} />
        </SafePressable>
      )}
    </TransparentView>
  );
}
