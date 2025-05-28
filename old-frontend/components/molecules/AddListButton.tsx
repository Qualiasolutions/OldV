import { TransparentView } from 'components/molecules/ViewComponents';
import { Text, TextInput } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import {
  useCreatePlanningListFromDefaultTemplateMutation,
  useCreatePlanningListMutation,
  useCreatePlanningListTemplateMutation,
  useCreateShoppingListMutation,
  useGetAllPlanningListTemplatesQuery
} from 'reduxStore/services/api/lists';
import { StyleSheet } from 'react-native';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useState } from 'react';
import { Button } from 'components/molecules/ButtonComponents';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { Modal } from 'components/molecules/Modals';
import DropDown from 'components/forms/components/DropDown';
import { selectCategoryById } from 'reduxStore/slices/categories/selectors';
import { useSelector } from 'react-redux';

const addListStyles = StyleSheet.create({
  listInputPair: { flexDirection: 'row', width: '100%', alignItems: 'center' },
  input: { marginVertical: 10, width: '100%' },
  buttonWrapper: { alignItems: 'flex-start', flexDirection: 'row' },
  button: { paddingVertical: 5, marginHorizontal: 5 },
  selectTemplateDropdown: { marginBottom: 10 },
  createFromTemplateModalContent: {
    alignItems: 'center',
    width: 250,
    maxWidth: '100%'
  },
  modalOr: {
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center'
  }
});

type AddListStep = 'TEMPLATE_SELECTION' | 'NAME';
const AddListModal = ({
  category,
  isShoppingList,
  visible,
  onRequestClose
}: {
  category?: number;
  isShoppingList?: boolean;
  visible: boolean;
  onRequestClose: () => void;
}) => {
  const [newName, setNewName] = useState('');
  const [newListTemplateId, setNewListTemplateId] = useState('');
  const [step, setStep] = useState<AddListStep>('TEMPLATE_SELECTION');

  const { data: userDetails } = useGetUserFullDetails();
  const { t } = useTranslation();
  const [createNewPlanningList] = useCreatePlanningListMutation();
  const [createNewShoppingList] = useCreateShoppingListMutation();
  const [createTemplate] = useCreatePlanningListTemplateMutation();
  const [createTemplateFromDefault] =
    useCreatePlanningListFromDefaultTemplateMutation();

  const categoryObj = useSelector(selectCategoryById(category || -1));

  const {
    data: planningListTemplates,
    isLoading: isLoadingPlanningListTemplates
  } = useGetAllPlanningListTemplatesQuery();

  const isLoading =
    !userDetails || isLoadingPlanningListTemplates || !planningListTemplates;

  if (isLoading) {
    return null;
  }

  let content = null;
  if (isShoppingList) {
    content = (
      <>
        <Text>
          {t('components.planningLists.createFromTemplateModal.blurb')}
        </Text>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          style={addListStyles.input}
        />
        <TransparentView style={addListStyles.buttonWrapper}>
          <Button
            style={addListStyles.button}
            title={t('components.planningLists.addListModal.add')}
            onPress={async () => {
              try {
                onRequestClose();
                await createNewShoppingList({
                  name: newName,
                  members: [userDetails.id]
                }).unwrap();
                setNewName('');
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
          />
        </TransparentView>
      </>
    );
  } else {
    if (!category) {
      content = null;
    } else {
      const templateOptions = planningListTemplates.ids
        .map((templateId) => {
          const template = planningListTemplates.byId[templateId];
          return {
            value: templateId,
            label: template.name,
            category: template.category
          };
        })
        .filter((opt) => opt.category === category);

      const defaultTemplates: { [key: string]: string[] } = {
        EDUCATION: ['BEFORE_AFTER_TERM_TIME'],
        TRAVEL: ['PLAN_TRIP', 'PACKING_LIST'],
        SOCIAL_INTERESTS: [
          'PLAN_BIRTHDAY_ANNIVERSARY',
          'PLAN_HOLIDAY',
          'PLAN_EVENT'
        ]
      };
      let defaultTemplateNames: string[] = [];
      for (const cat in defaultTemplates) {
        if (defaultTemplates[cat]) {
          defaultTemplateNames = defaultTemplateNames.concat(
            defaultTemplates[cat]
          );
        }
      }

      const defaultTemplateOptions = categoryObj
        ? (defaultTemplates[categoryObj.name] || []).map((templateName) => ({
            label: t(`templates.planningLists.${templateName}`),
            value: templateName
          }))
        : [];

      content =
        step === 'TEMPLATE_SELECTION' ? (
          <>
            <Button
              style={addListStyles.button}
              title={t('components.planningLists.addListModal.createNew')}
              onPress={async () => {
                setNewListTemplateId('');
                setStep('NAME');
              }}
            />
            <TransparentView style={addListStyles.modalOr}>
              <Text>{t('common.or')}</Text>
            </TransparentView>
            <DropDown
              value={newListTemplateId}
              items={[...templateOptions, ...defaultTemplateOptions]}
              setFormValues={(id) => {
                setNewListTemplateId(id);
                setStep('NAME');
              }}
              listMode="MODAL"
              style={addListStyles.selectTemplateDropdown}
              dropdownPlaceholder={t(
                'components.planningLists.addListModal.selectTemplate'
              )}
            />
          </>
        ) : (
          <>
            <Text>
              {t('components.planningLists.createFromTemplateModal.blurb')}
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={addListStyles.input}
            />
            <TransparentView style={addListStyles.buttonWrapper}>
              <Button
                style={addListStyles.button}
                title={t('common.back')}
                onPress={() => {
                  setNewListTemplateId('');
                  setStep('TEMPLATE_SELECTION');
                }}
              />
              <Button
                style={addListStyles.button}
                title={t('components.planningLists.addListModal.add')}
                onPress={async () => {
                  try {
                    onRequestClose();
                    if (newListTemplateId) {
                      if (defaultTemplateNames.includes(newListTemplateId)) {
                        await createTemplateFromDefault({
                          title: newName,
                          list_template: newListTemplateId
                        });
                      } else {
                        await createTemplate({
                          title: newName,
                          list: parseInt(newListTemplateId),
                          from_template: true
                        });
                      }
                    } else {
                      await createNewPlanningList({
                        category,
                        name: newName,
                        members: [userDetails.id]
                      }).unwrap();
                    }
                    setNewName('');
                    setStep('TEMPLATE_SELECTION');
                    setNewListTemplateId('');
                  } catch (err) {
                    Toast.show({
                      type: 'error',
                      text1: t('common.errors.generic')
                    });
                  }
                }}
              />
            </TransparentView>
          </>
        );
    }
  }

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      <TransparentView style={addListStyles.createFromTemplateModalContent}>
        {content}
      </TransparentView>
    </Modal>
  );
};

export default function AddListButton({
  category,
  isShoppingList
}: {
  category?: number;
  isShoppingList?: boolean;
}) {
  const { t } = useTranslation();
  const [addingNew, setAddingNew] = useState(false);

  return (
    <TransparentView>
      <TransparentView>
        <TransparentView style={addListStyles.buttonWrapper}>
          <Button
            style={addListStyles.button}
            title={t('components.planningLists.addList')}
            onPress={() => {
              setAddingNew(true);
            }}
          />
        </TransparentView>
      </TransparentView>
      <AddListModal
        isShoppingList={isShoppingList}
        category={category}
        visible={addingNew}
        onRequestClose={() => {
          setAddingNew(false);
        }}
      />
    </TransparentView>
  );
}
