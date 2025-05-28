import { Modal } from 'components/molecules/Modals';

import ModalContent from './ModalContent';

export default function TaskCompletionModal({
  taskId,
  onSubmitSuccess = () => {},
  onRequestClose = () => {},
  visible = false,
  recurrenceIndex = undefined
}: {
  taskId: number;
  title?: string;
  onSubmitSuccess?: () => void;
  onRequestClose?: () => void;
  visible?: boolean;
  recurrenceIndex?: number;
}) {
  const modalContent = ModalContent({
    taskId,
    recurrenceIndex,
    onDismiss: onRequestClose,
    onSubmitSuccess: onSubmitSuccess
  });

  if (modalContent) {
    return (
      <Modal onRequestClose={onRequestClose} visible={visible}>
        {modalContent}
      </Modal>
    );
  }
  return null;
}
