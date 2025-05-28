import React, { useCallback } from 'react';
import { Image, StyleSheet, ViewStyle } from 'react-native';
import {
  ContentTabParamList,
  RootTabParamList,
  SettingsTabParamList
} from 'types/base';
import { TransparentView, WhiteBox } from 'components/molecules/ViewComponents';
import { BlackText, WhiteText } from 'components/molecules/TextComponents';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'components/Themed';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from './TouchableOpacityComponents';

// We will need to add more types here as we use
// this for more sub-navigators
type ListLinkProps = {
  text: string;
  toScreen?: string;
  toScreenParams?: object;
  navMethod?: 'push' | 'navigate';
  style?: ViewStyle;
  selected?: boolean;
  onPressContainer?: () => void;
  onSelect?: (v: boolean) => Promise<void>;
  subType?: string;
};

export default function EventListLink({
  text,
  toScreen,
  navMethod = 'navigate',
  toScreenParams = {},
  style = {},
  selected = false,
  onPressContainer,
  onSelect,
  subType
}: ListLinkProps) {
  const navigation = useNavigation<
    | BottomTabNavigationProp<RootTabParamList>
    | StackNavigationProp<ContentTabParamList>
    | StackNavigationProp<SettingsTabParamList>
  >();

  const greyColor = useThemeColor({}, 'grey');
  const primaryColor = useThemeColor({}, 'primary');

  const { t } = useTranslation();

  const styles = StyleSheet.create({
    listEntry: {
      paddingHorizontal: 24,
      marginTop: 10,
      borderRadius: 10,
      borderWidth: 1
    },
    listEntryInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      alignItems: 'center'
    },
    listEntryText: {
      fontSize: 18,
      marginLeft: 23
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    check: {
      height: 20,
      width: 13,
      tintColor: primaryColor
    },
    hideTab: {
      backgroundColor: primaryColor,
      width: 100,
      marginTop: 10,
      paddingVertical: 12,
      marginLeft: -10,
      justifyContent: 'center',
      alignItems: 'center'
    },
    faded: { opacity: 0.3 }
  });

  function returnEventImage() {
    switch (subType) {
      case 'food':
        return <Ionicons name="fast-food" color={primaryColor} size={20} />;
      case 'venue':
        return <Feather name="map-pin" color={primaryColor} size={20} />;
      case 'party_favours':
        return <Ionicons name="partly-sunny" color={primaryColor} size={20} />;
      case 'gifts':
        return <Ionicons name="gift" color={primaryColor} size={20} />;
      case 'music':
        return <Ionicons name="musical-note" color={primaryColor} size={20} />;
      case 'decorations':
        return (
          <Ionicons
            name="md-partly-sunny-outline"
            color={primaryColor}
            size={20}
          />
        );
      case 'guest_list':
        return <Ionicons name="person" color={primaryColor} size={20} />;
      case 'add':
        return <Ionicons name="add" color={primaryColor} size={20} />;
      default:
        return (
          <Image
            source={require('assets/images/icons/check.png')}
            style={styles.check}
          />
        );
    }
  }

  const renderRightActions = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={() => onSelect && onSelect(selected)}
        style={styles.hideTab}
      >
        <WhiteText text={t('common.hide')} />
      </TouchableOpacity>
    );
  }, [selected, onSelect, styles, t]);

  const Wrapper = selected ? Swipeable : TransparentView;

  return (
    <Wrapper
      useNativeAnimations={true}
      overshootRight={false}
      renderRightActions={renderRightActions}
      containerStyle={{ overflow: 'visible' }}
    >
      <WhiteBox
        style={[
          styles.listEntry,
          selected && { backgroundColor: greyColor },
          !selected && subType !== 'add' && styles.faded,
          style
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (onPressContainer) {
              return onPressContainer();
            }
            if (!selected && onSelect) {
              return onSelect(selected);
            }
            if (navMethod === 'push') {
              (navigation as any).push(toScreen, toScreenParams);
            } else {
              (navigation.navigate as any)(toScreen, toScreenParams);
            }
          }}
          style={[styles.listEntryInner]}
        >
          <TransparentView style={styles.row}>
            {returnEventImage()}
            <BlackText text={text} style={styles.listEntryText} />
          </TransparentView>

          {subType !== 'add' && (
            <Feather name={!selected ? 'eye-off' : 'chevron-right'} size={25} />
          )}
        </TouchableOpacity>
      </WhiteBox>
    </Wrapper>
  );
}
