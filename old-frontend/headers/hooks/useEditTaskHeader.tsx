import { useLayoutEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import { BackOnlyHeaderWithSafeArea } from 'headers/BackOnlyHeader';
import { SmallButton } from 'components/molecules/ButtonComponents';
import { useTranslation } from 'react-i18next';
import {
  BottomTabHeaderProps,
  BottomTabNavigationProp
} from '@react-navigation/bottom-tabs';
import { RootTabParamList } from 'types/base';
import { useThemeColor } from 'components/Themed';

export default function useEditTaskHeader({
  taskId,
  recurrenceIndex
}: {
  taskId: number;
  recurrenceIndex?: number;
}) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const route = useRoute();
  const { t } = useTranslation();
  const task = useSelector(selectTaskById(taskId));
  const primaryColor = useThemeColor({}, 'primary');

  useLayoutEffect(() => {
    if (task) {
      const headerRight = (
        <SmallButton
          title={t('common.chat')}
          onPress={() => {
            navigation.navigate('Chat', {
              screen: 'MessageThread',
              initial: false,
              params: {
                taskId,
                recurrenceIndex
              }
            });
          }}
        />
      );
      const header = (props: BottomTabHeaderProps) => (
        <BackOnlyHeaderWithSafeArea headerRight={headerRight} {...props} />
      );

      navigation.setOptions({
        title: task.title,
        header,
        headerShown: true
      });
    }
  }, [task, navigation, route, recurrenceIndex, t, taskId, primaryColor]);
}
