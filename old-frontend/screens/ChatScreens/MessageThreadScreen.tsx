import MessageThread from 'components/organisms/MessageThread';
import { MessagesTabScreenProps } from 'types/base';

type MessageThreadScreenProps = MessagesTabScreenProps<'MessageThread'>;

function MessageThreadScreen({ route }: MessageThreadScreenProps) {
  return (
    <MessageThread
      entityId={route.params.entityId || undefined}
      taskId={route.params.taskId || undefined}
      actionId={route.params.actionId || undefined}
      recurrenceIndex={
        route.params.recurrenceIndex === null
          ? undefined
          : route.params.recurrenceIndex
      }
    />
  );
}

export default MessageThreadScreen;
