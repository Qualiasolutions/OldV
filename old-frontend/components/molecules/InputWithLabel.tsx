import { Feather } from '@expo/vector-icons';
import { Text } from 'components/Themed';
import { ReactNode, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Modal } from './Modals';
import SafePressable from './SafePressable';
import { AlmostBlackText } from './TextComponents';
import { TransparentView } from './ViewComponents';

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 14,
    marginRight: 10,
    flexShrink: 1,
    maxWidth: '85%'
  },
  helpButton: {
    marginRight: 10
  },
  inlineInputPair: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inlineChildrenWrapper: {
    flex: 1
  },
  labelWrapper: {
    flexDirection: 'row'
  }
});

export default function InputWithLabel({
  label,
  children,
  error,
  inlineFields,
  labelStyle,
  labelWrapperStyle,
  pairStyle,
  style,
  helpText
}: {
  label: string;
  children: ReactNode;
  error?: string;
  inlineFields?: boolean;
  labelStyle?: ViewStyle;
  labelWrapperStyle?: ViewStyle;
  pairStyle?: ViewStyle;
  style?: ViewStyle;
  helpText?: string;
}) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  return (
    <TransparentView style={style || {}}>
      {error ? <Text>{error}</Text> : null}
      <TransparentView
        style={inlineFields ? [styles.inlineInputPair, pairStyle || {}] : {}}
      >
        <TransparentView style={[labelWrapperStyle || {}, styles.labelWrapper]}>
          <AlmostBlackText
            text={label}
            style={[styles.inputLabel, labelStyle || {}]}
          />
          {helpText && (
            <SafePressable
              onPress={() => setShowInfoModal(true)}
              style={styles.helpButton}
            >
              <Feather name="info" size={20} />
            </SafePressable>
          )}
        </TransparentView>
        <TransparentView
          style={inlineFields ? styles.inlineChildrenWrapper : {}}
        >
          {children}
        </TransparentView>
      </TransparentView>
      {helpText && (
        <Modal
          visible={showInfoModal}
          onRequestClose={() => setShowInfoModal(false)}
        >
          <Text>{helpText}</Text>
        </Modal>
      )}
    </TransparentView>
  );
}
