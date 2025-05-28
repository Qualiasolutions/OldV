import { TextInput } from 'components/Themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useCreatePlanningSublistMutation } from 'reduxStore/services/api/lists';
import { Button } from './ButtonComponents';
import { TransparentView } from './ViewComponents';

const addSublistStyles = StyleSheet.create({
  textInput: { flex: 1, height: 30, maxWidth: 150 },
  listInputPair: { flexDirection: 'row', width: '100%', alignItems: 'center' },
  buttonWrapper: { alignItems: 'flex-start', flexDirection: 'row' },
  button: { paddingVertical: 5, marginHorizontal: 5, height: 30 }
});
export default function AddSublistInputPair({ list }: { list: number }) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [createPlanningSublist] = useCreatePlanningSublistMutation();

  return (
    <TransparentView>
      <TransparentView style={addSublistStyles.listInputPair}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          style={addSublistStyles.textInput}
        />
        <TransparentView style={addSublistStyles.buttonWrapper}>
          <Button
            style={addSublistStyles.button}
            disabled={!newName}
            title={t('components.planningLists.addSublist')}
            onPress={async () => {
              try {
                setNewName('');
                await createPlanningSublist({
                  list,
                  title: newName
                }).unwrap();
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
          />
        </TransparentView>
      </TransparentView>
    </TransparentView>
  );
}
