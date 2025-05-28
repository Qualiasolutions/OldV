import React from 'react';
import { useThemeColor, View } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import {
  GestureResponderEvent,
  Modal as DefaultModal,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { AlmostBlackText, PrimaryText } from './TextComponents';
import {
  TransparentContainerView,
  TransparentView,
  WhiteBox
} from './ViewComponents';

import SafePressable from './SafePressable';

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  opaqueBackground: {
    color: '#000000',
    opacity: 0.8
  },
  textWrapper: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    textAlign: 'center'
  },
  yesNoTitle: {
    fontSize: 16,
    marginBottom: 5
  },
  yesNoBoxStyle: {
    padding: 0,
    overflow: 'hidden'
  },
  yesNoButtons: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1
  },
  yesNoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  yesButton: {
    borderRightWidth: 1
  },
  modalView: {
    flex: 1,
    padding: 0
  }
});

export type ModalProps = DefaultModal['props'] & { boxStyle?: ViewStyle };

export function Modal(props: ModalProps) {
  const { children, boxStyle, onRequestClose, ...otherProps } = props;

  return (
    <DefaultModal
      animationType="fade"
      transparent={true}
      onRequestClose={onRequestClose}
      {...otherProps}
    >
      <TransparentContainerView>
        <SafePressable
          style={[styles.background, styles.opaqueBackground]}
          onPress={onRequestClose}
        >
          <View style={[styles.background, styles.opaqueBackground]} />
        </SafePressable>
        <WhiteBox style={boxStyle}>{children}</WhiteBox>
      </TransparentContainerView>
    </DefaultModal>
  );
}

type YesNoModalProps = ModalProps & {
  title?: string;
  question: string;
  onYes: (event: GestureResponderEvent) => void;
  onNo: (event: GestureResponderEvent) => void;
};

export function YesNoModal(props: YesNoModalProps) {
  const borderColor = useThemeColor({}, 'grey');
  const { t } = useTranslation();

  const { title, question, onYes, onNo, boxStyle, ...otherProps } = props;
  const titleView = title ? (
    <PrimaryText text={title} style={[styles.text, styles.yesNoTitle]} />
  ) : null;

  return (
    <Modal
      boxStyle={StyleSheet.flatten([styles.yesNoBoxStyle, boxStyle])}
      {...otherProps}
    >
      <TransparentView style={styles.textWrapper}>
        {titleView}
        <AlmostBlackText style={styles.text} text={question} />
      </TransparentView>
      <TransparentView style={[{ borderColor }, styles.yesNoButtons]}>
        <SafePressable
          onPress={onYes}
          style={({ pressed }) => [
            {
              borderColor,
              backgroundColor: pressed ? borderColor : ''
            },
            styles.yesNoButton,
            styles.yesButton
          ]}
        >
          <TransparentView>
            <AlmostBlackText text={t('common.yes')} />
          </TransparentView>
        </SafePressable>
        <SafePressable
          onPress={onNo}
          style={({ pressed }) => [
            {
              borderColor,
              backgroundColor: pressed ? borderColor : ''
            },
            styles.yesNoButton
          ]}
        >
          <TransparentView>
            <AlmostBlackText text={t('common.no')} />
          </TransparentView>
        </SafePressable>
      </TransparentView>
    </Modal>
  );
}
