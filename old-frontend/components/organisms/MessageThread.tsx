import { useIsFocused } from '@react-navigation/native';
import { Button } from 'components/molecules/ButtonComponents';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import UserTags from 'components/molecules/UserTags';
import {
  TransparentContainerView,
  TransparentView,
  WhiteView
} from 'components/molecules/ViewComponents';
import { Text, TextInput, useThemeColor } from 'components/Themed';
import useEntityById from 'hooks/entities/useEntityById';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import {
  useCreateMessageMutation,
  useGetMessagesForActionIdQuery,
  useGetMessagesForEntityIdQuery
} from 'reduxStore/services/api/messages';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';
import { elevation } from 'styles/elevation';
import { MessageResponse } from 'types/messages';
import { useGetMessagesForTaskIdQuery } from '../../reduxStore/services/api/messages';

const useMessageStyles = () => {
  const userBackgroundColor = useThemeColor({}, 'mediumGrey');
  const userTextColor = useThemeColor({}, 'white');
  const otherTextColor = useThemeColor({}, 'white');
  const otherBackgroundColor = useThemeColor({}, 'lightBlue');
  return StyleSheet.create({
    message: {
      marginBottom: 2
    },
    messageText: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
      overflow: 'hidden'
    },
    userMessage: {
      alignItems: 'flex-end',
      marginLeft: 50
    },
    userMessageText: {
      backgroundColor: userBackgroundColor,
      color: userTextColor
    },
    otherMessage: { marginRight: 50 },
    otherMessageText: {
      backgroundColor: otherBackgroundColor,
      color: otherTextColor
    },
    firstMessage: { marginTop: 10 },
    name: { fontWeight: 'bold', marginBottom: 2 }
  });
};

const Message = ({
  message,
  firstFromUser
}: {
  message: MessageResponse;
  firstFromUser: boolean;
}) => {
  const { data: userDetails } = useGetUserFullDetails();
  const messageStyles = useMessageStyles();

  if (!userDetails) {
    return null;
  }

  const isUserMessage = userDetails.id === message.user;

  return (
    <TransparentView
      style={[
        messageStyles.message,
        isUserMessage ? messageStyles.userMessage : messageStyles.otherMessage,
        firstFromUser && messageStyles.firstMessage
      ]}
    >
      {firstFromUser && <Text style={messageStyles.name}>{message.name}</Text>}
      <Text
        style={[
          messageStyles.messageText,
          isUserMessage
            ? messageStyles.userMessageText
            : messageStyles.otherMessageText
        ]}
      >
        {message.text}
      </Text>
    </TransparentView>
  );
};

const styles = StyleSheet.create({
  sendInput: {
    marginRight: 10,
    flexGrow: 1,
    height: '100%',
    width: 10
  },
  sendInputPair: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 5
  },
  container: {
    paddingTop: 0,
    paddingHorizontal: 0,
    width: '100%'
  },
  containerScrollView: {
    paddingBottom: 100,
    paddingTop: 20,
    paddingHorizontal: 5
  },
  topWrapper: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    width: '100%'
  },
  horizontalPadding: {
    paddingHorizontal: 10
  }
});

export type Props = {
  entityId?: number;
  taskId?: number;
  actionId?: number;
  recurrenceIndex?: number;
};
export default function MessageThread({
  entityId,
  taskId,
  actionId,
  recurrenceIndex
}: Props) {
  const isFocused = useIsFocused();

  const { data: entityMessages } = useGetMessagesForEntityIdQuery(
    entityId || -1,
    {
      skip: !entityId || !isFocused,
      pollingInterval: 3000
    }
  );

  const { data: taskMessages } = useGetMessagesForTaskIdQuery(
    {
      taskId: taskId || -1,
      recurrenceIndex: recurrenceIndex === undefined ? null : recurrenceIndex
    },
    {
      skip: !taskId || !isFocused,
      pollingInterval: 3000
    }
  );

  const { data: actionMessages } = useGetMessagesForActionIdQuery(
    actionId || -1,
    {
      skip: !actionId || !isFocused,
      pollingInterval: 3000
    }
  );

  const scheduledTask = useSelector(
    selectScheduledTask({ actionId, id: taskId, recurrenceIndex })
  );
  const entity = useEntityById(entityId || -1);

  const [createMessage, createMessageResult] = useCreateMessageMutation();

  const { data: userDetails } = useGetUserFullDetails();

  const [newMessage, setNewMessage] = useState('');
  const { t } = useTranslation();

  const messages =
    (entityId && entityMessages) ||
    (taskId && taskMessages) ||
    (actionId && actionMessages);
  if (!messages || !userDetails) {
    return null;
  }

  let messageViews = [];
  let prevMessage = null;
  for (const message of messages) {
    messageViews.push(
      <Message
        message={message}
        firstFromUser={!prevMessage || message.user !== prevMessage.user}
        key={message.id}
      />
    );
    prevMessage = message;
  }

  return (
    <TransparentContainerView style={styles.container}>
      <WhiteView style={[styles.topWrapper, elevation.elevated]}>
        {scheduledTask && <UserTags memberIds={scheduledTask.members} />}
        {entity && <UserTags memberIds={entity.members} />}
      </WhiteView>
      <TransparentFullPageScrollView
        contentContainerStyle={[
          styles.containerScrollView,
          styles.horizontalPadding
        ]}
      >
        {messageViews}
      </TransparentFullPageScrollView>
      <TransparentView style={[styles.sendInputPair, styles.horizontalPadding]}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.sendInput}
        />
        {createMessageResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            title={t('components.messageThread.send')}
            disabled={!newMessage}
            onPress={async () => {
              setNewMessage('');
              await createMessage({
                text: newMessage,
                user: userDetails.id,
                entity: entityId || null,
                task: taskId || null,
                action: actionId || null,
                recurrence_index:
                  recurrenceIndex === undefined ? null : recurrenceIndex
              }).unwrap();
            }}
          />
        )}
      </TransparentView>
    </TransparentContainerView>
  );
}
