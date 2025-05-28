import { useNavigation } from '@react-navigation/native';
import dueDateMembershipField from 'components/forms/entityFormFieldTypes/utils/dueDateMembershipField';
import reminderDropDownField from 'components/forms/entityFormFieldTypes/utils/reminderDropDownField';
import { FormFieldTypes } from 'components/forms/formFieldTypes';
import TypedForm from 'components/forms/TypedForm';
import { FieldValueTypes } from 'components/forms/types';
import hasAllRequired from 'components/forms/utils/hasAllRequired';
import parseFormValues from 'components/forms/utils/parseFormValues';
import { Button } from 'components/molecules/ButtonComponents';
import { Modal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import {
  TransparentFullPageScrollView,
  TransparentScrollView
} from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { PrimaryText } from 'components/molecules/TextComponents';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import useEntityById from 'hooks/entities/useEntityById';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useSelector } from 'react-redux';
import { useCreateTaskMutation } from 'reduxStore/services/api/tasks';
import { selectNextTaskFromEntityAndHiddenTag } from 'reduxStore/slices/tasks/selectors';
import { elevation } from 'styles/elevation';
import { FixedTaskResponseType, HiddenTagType } from 'types/tasks';

const styles = StyleSheet.create({
  titleBar: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  title: { fontSize: 24, marginRight: 10 },
  titleEdit: { fontSize: 20 },
  dueDateFormContainer: { paddingHorizontal: 5, flexGrow: 0 },
  dueDateContainer: { marginBottom: 15 }
});

const DueDateInputForm = ({
  entityId,
  hiddenTag,
  onSuccess
}: {
  entityId: number;
  hiddenTag: HiddenTagType;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const { t: modelFieldTranslations } = useTranslation('modelFields');
  const { data: userFullDetails } = useGetUserFullDetails();
  const [createTask, createTaskResult] = useCreateTaskMutation();
  const [formValues, setFormValues] = useState<{ [key: string]: any }>({
    due_date: null,
    reminder_interval: null,
    due_date_members: null
  });

  const resetValues = useCallback(() => {
    setFormValues({
      due_date: null,
      reminder_interval: null,
      due_date_members: null
    });
  }, []);

  const formFields: FormFieldTypes = useMemo(() => {
    if (!userFullDetails) {
      return {} as {};
    }

    return {
      due_date: {
        type: 'Date',
        required: true,
        displayName: modelFieldTranslations('tasks.task.date')
      },
      reminder_interval: reminderDropDownField(
        'due_date',
        modelFieldTranslations('entities.entity.reminder'),
        false
      ),
      due_date_members: dueDateMembershipField(
        'due_date',
        false,
        modelFieldTranslations('entities.entity.taskMembers'),
        modelFieldTranslations('tasks.task.changeMembers')
      )
    };
  }, [userFullDetails, modelFieldTranslations]);

  if (!userFullDetails) {
    return null;
  }

  const allRequired = hasAllRequired(formValues, formFields);

  return (
    <TransparentScrollView style={styles.dueDateFormContainer}>
      <TypedForm
        fields={formFields}
        formValues={formValues}
        onFormValuesChange={(values: FieldValueTypes) => {
          setFormValues(values);
        }}
        inlineFields={false}
        sectionStyle={StyleSheet.flatten([
          {
            backgroundColor: 'transparent',
            marginBottom: 0,
            paddingHorizontal: 0
          },
          elevation.unelevated
        ])}
      />
      {createTaskResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          onPress={async () => {
            const parsedFormValues = parseFormValues(formValues, formFields);
            try {
              const timeDeltaMapping: { [key: string]: string } = {
                DAILY: '1 day, 00:00:00',
                WEEKLY: '7 days, 00:00:00',
                MONTHLY: '30 days, 00:00:00'
              };
              await createTask({
                entities: [entityId],
                hidden_tag: hiddenTag,
                resourcetype: 'FixedTask',
                date: parsedFormValues.due_date,
                duration: 15,
                type: 'DUE_DATE',
                members: parsedFormValues.due_date_members,
                title: t('components.entityPages.car.dueDateTitle', {
                  dueDateType: t(`hiddenTags.${hiddenTag}`)
                }),
                actions: parsedFormValues.reminder_interval
                  ? [
                      {
                        action_timedelta:
                          timeDeltaMapping[parsedFormValues.reminder_interval]
                      }
                    ]
                  : []
              }).unwrap();
              resetValues();
              onSuccess();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }}
          title={t('common.submit')}
          disabled={!allRequired}
        />
      )}
    </TransparentScrollView>
  );
};

export default function CarPage({ entityId }: { entityId: number }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const entity = useEntityById(entityId);
  const [dueDateToAdd, setDueDateToAdd] = useState<HiddenTagType | ''>('');

  const nextMotTask = useSelector(
    selectNextTaskFromEntityAndHiddenTag(entityId, 'MOT_DUE')
  );
  const nextInsuranceTask = useSelector(
    selectNextTaskFromEntityAndHiddenTag(entityId, 'INSURANCE_DUE')
  );
  const nextServiceTask = useSelector(
    selectNextTaskFromEntityAndHiddenTag(entityId, 'SERVICE_DUE')
  );
  const nextTaxTask = useSelector(
    selectNextTaskFromEntityAndHiddenTag(entityId, 'TAX_DUE')
  );
  const nextWarrantyTask = useSelector(
    selectNextTaskFromEntityAndHiddenTag(entityId, 'WARRANTY_DUE')
  );

  const dueDateTasks: {
    [key in
      | 'MOT_DUE'
      | 'INSURANCE_DUE'
      | 'SERVICE_DUE'
      | 'TAX_DUE'
      | 'WARRANTY_DUE']: FixedTaskResponseType | undefined | null;
  } = {
    MOT_DUE: nextMotTask,
    INSURANCE_DUE: nextInsuranceTask,
    SERVICE_DUE: nextServiceTask,
    TAX_DUE: nextTaxTask,
    WARRANTY_DUE: nextWarrantyTask
  };

  const supportedHiddenTags: HiddenTagType[] = [
    'MOT_DUE',
    'INSURANCE_DUE',
    'SERVICE_DUE',
    'TAX_DUE',
    'WARRANTY_DUE'
  ];

  if (!entity) {
    return null;
  }

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView>
        <TransparentView style={styles.titleBar}>
          <Text style={styles.title}>{entity.name}</Text>
        </TransparentView>
        {supportedHiddenTags.map((hiddenTag, i) => {
          const nextTask = dueDateTasks[hiddenTag];
          const content = nextTask ? (
            <TransparentView>
              <Text>
                {t('components.entityPages.car.nextDueDate', {
                  dueDateType: t(`hiddenTags.${hiddenTag}`)
                })}
                : {nextTask.date}
              </Text>
              <SafePressable
                onPress={() => {
                  (navigation.navigate as any)('EditTask', {
                    taskId: nextTask.id
                  });
                }}
              >
                <PrimaryText text="Edit" />
              </SafePressable>
            </TransparentView>
          ) : (
            <TransparentView>
              <SafePressable
                onPress={() => {
                  setDueDateToAdd(hiddenTag);
                }}
              >
                <PrimaryText
                  text={t('components.entityPages.car.addDueDate', {
                    dueDateType: t(`hiddenTags.${hiddenTag}`)
                  })}
                />
              </SafePressable>
            </TransparentView>
          );

          return (
            <TransparentView key={i} style={styles.dueDateContainer}>
              {content}
            </TransparentView>
          );
        })}
      </TransparentPaddedView>
      <Modal
        visible={!!dueDateToAdd}
        onRequestClose={() => setDueDateToAdd('')}
      >
        <Text>
          {t('components.entityPages.car.addingDueDate', {
            dueDateType: t(`hiddenTags.${dueDateToAdd}`)
          })}
        </Text>
        {dueDateToAdd && (
          <DueDateInputForm
            entityId={entityId}
            hiddenTag={dueDateToAdd}
            onSuccess={() => {
              setDueDateToAdd('');
            }}
          />
        )}
      </Modal>
    </TransparentFullPageScrollView>
  );
}
