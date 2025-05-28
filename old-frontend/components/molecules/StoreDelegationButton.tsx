import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, ViewStyle } from 'react-native';

import { SmallButton } from './ButtonComponents';
import { Modal } from './Modals';
import { TransparentView } from './ViewComponents';
import StoreDelegations from './StoreDelegations';

const styles = StyleSheet.create({
  buttonWrapper: {
    flexDirection: 'row'
  }
});

export default function StoreDelegationButton({
  storeId,
  style
}: {
  storeId: number;
  style?: ViewStyle;
}) {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  return (
    <TransparentView style={style || {}}>
      <TransparentView style={styles.buttonWrapper}>
        <SmallButton
          title={t('components.shoppingLists.delegationButton.delegations')}
          onPress={() => setShowModal(true)}
        />
      </TransparentView>
      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <StoreDelegations storeId={storeId} />
      </Modal>
    </TransparentView>
  );
}
