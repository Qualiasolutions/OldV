import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootTabParamList } from 'types/base';

import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { FullPageSpinner } from 'components/molecules/Spinners';
import GenericTaskForm from 'components/forms/GenericTaskForm';
import { useSelector } from 'react-redux';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import useDefaultTaskValues from 'hooks/useDefaultTaskValues';
import useEditTaskHeader from 'headers/hooks/useEditTaskHeader';

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100
  }
});

export default function EditTaskScreen({
  route,
  navigation
}: NativeStackScreenProps<RootTabParamList, 'EditTask'>) {
  const { taskId, recurrenceIndex } = route.params;

  const taskObj = useSelector(selectTaskById(taskId));
  const taskToEditType = taskObj?.type;
  const defaultValues = useDefaultTaskValues(taskId, recurrenceIndex);

  useEditTaskHeader({ taskId, recurrenceIndex });

  if (!(defaultValues && Object.keys(defaultValues).length > 0)) {
    return <FullPageSpinner />;
  }

  if (!taskToEditType) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentFullPageScrollView>
      <TransparentView style={styles.container}>
        <GenericTaskForm
          type={taskToEditType}
          isEdit={true}
          defaults={defaultValues}
          taskId={route.params.taskId}
          recurrenceIndex={route.params.recurrenceIndex}
          recurrenceOverwrite={route.params.recurrenceOverwrite}
          onSuccess={() => {
            navigation.goBack();
          }}
        />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
