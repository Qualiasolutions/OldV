import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ListEntryResponse } from 'types/lists';
import Checkbox from 'components/molecules/Checkbox';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import {
  useDeleteListEntryMutation,
  useUpdateListEntryMutation
} from 'reduxStore/services/api/lists';
import { Swipeable, TouchableHighlight } from 'react-native-gesture-handler';
import { parsePresignedUrl } from 'utils/urls';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Image } from 'components/molecules/ImageComponents';
import { TextInput, useThemeColor } from 'components/Themed';
import SafePressable from 'components/molecules/SafePressable';
import { Feather } from '@expo/vector-icons';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useTranslation } from 'react-i18next';
import { Modal } from 'components/molecules/Modals';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from 'types/base';

export default function ListEntry({
  listEntry
}: {
  listEntry: ListEntryResponse;
}) {
  const [deleteListEntry] = useDeleteListEntryMutation();
  const [updateListEntry] = useUpdateListEntryMutation();
  const primaryColor = useThemeColor({}, 'primary');
  const [updatingText, setUpdatingText] = useState(false);
  const [newTitle, setNewTitle] = useState(listEntry.title);
  const [fullPageImage, setFullPageImage] = useState(false);
  const trashImage = require('assets/images/icons/trash.png');

  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  const styles = StyleSheet.create({
    listEntryContainer: {
      width: '100%',
      borderWidth: 0,
      borderBottomWidth: 1,
      borderColor: useThemeColor({}, 'grey'),
      backgroundColor: useThemeColor({}, 'white'),
      flexDirection: 'row'
    },
    listEntrySwipeable: {
      paddingRight: 40,
      paddingLeft: 40,
      paddingTop: 10,
      paddingBottom: 40,
      flexGrow: 1
    },
    title: {
      fontSize: 16,
      paddingLeft: 10,
      flexDirection: 'row',
      alignItems: 'center'
    },
    titleWrapper: {
      display: 'flex',
      flexDirection: 'row'
    },
    image: {
      width: 100,
      height: 100
    },
    content: {
      width: 200
    },
    deleteButton: {
      width: 35,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1
    },
    deleteButtonInner: {
      backgroundColor: primaryColor,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: 35
    },
    actionButton: { marginLeft: 10 },
    deleteButtonImage: { margin: 'auto' },
    fullPageImage: {
      width: '100%',
      height: '100%'
    },
    createTaskIcon: {
      marginLeft: 10
    }
  });

  const updateSelected = useCallback(
    (selected: boolean) => {
      updateListEntry({
        id: listEntry.id,
        selected: selected
      });
    },
    [listEntry, updateListEntry]
  );

  const imageSource = parsePresignedUrl(listEntry?.presigned_image_url);
  const imageSourceLarge = parsePresignedUrl(
    listEntry?.presigned_image_url_large
  );

  const renderRightActions = () => {
    return (
      <TouchableHighlight
        style={styles.deleteButton}
        onPress={() => {
          deleteListEntry(listEntry.id);
        }}
      >
        <TransparentView style={styles.deleteButtonInner}>
          <Image source={trashImage} style={styles.deleteButtonImage} />
        </TransparentView>
      </TouchableHighlight>
    );
  };

  return (
    <TransparentView style={styles.listEntryContainer}>
      <Swipeable
        useNativeAnimations={true}
        overshootRight={false}
        renderRightActions={renderRightActions}
        containerStyle={styles.listEntrySwipeable}
      >
        <>
          <TransparentView style={styles.content}>
            <TransparentView style={styles.titleWrapper}>
              <Checkbox
                checked={listEntry.selected}
                onValueChange={async (val) => {
                  updateSelected(!val);
                }}
              />
              {listEntry.title ? (
                updatingText ? (
                  <TransparentView style={styles.title}>
                    <TextInput
                      value={newTitle}
                      onChangeText={setNewTitle}
                      autoFocus={true}
                      onBlur={() => {
                        // Set a timeout because otherwise the update is sometimes not processed
                        setTimeout(() => {
                          setUpdatingText(false);
                          setNewTitle(listEntry.title);
                        }, 100);
                      }}
                    />
                    <SafePressable
                      onPress={() => {
                        setUpdatingText(false);
                      }}
                      style={styles.actionButton}
                    >
                      <Feather name="x" size={20} color="red" />
                    </SafePressable>
                    <SafePressable
                      onPress={async () => {
                        try {
                          setUpdatingText(false);
                          await updateListEntry({
                            id: listEntry.id,
                            title: newTitle
                          }).unwrap();
                        } catch (err) {
                          Toast.show({
                            type: 'error',
                            text1: t('common.errors.generic')
                          });
                        }
                      }}
                      style={styles.actionButton}
                    >
                      <Feather name="check" size={20} color="green" />
                    </SafePressable>
                  </TransparentView>
                ) : (
                  <>
                    <SafePressable
                      onPress={() => {
                        setUpdatingText(true);
                      }}
                    >
                      <AlmostBlackText
                        text={listEntry.title}
                        style={styles.title}
                      />
                    </SafePressable>
                    <SafePressable
                      style={styles.createTaskIcon}
                      onPress={() => {
                        navigation.navigate('AddTask', {
                          title: listEntry.title,
                          entities: [],
                          tags: []
                        });
                      }}
                    >
                      <Feather name="plus" size={20} color="green" />
                    </SafePressable>
                  </>
                )
              ) : imageSource ? (
                <SafePressable
                  style={styles.title}
                  onPress={() => {
                    setFullPageImage(true);
                  }}
                >
                  <Image source={{ uri: imageSource }} style={styles.image} />
                </SafePressable>
              ) : null}
            </TransparentView>
          </TransparentView>
        </>
      </Swipeable>
      <Modal
        visible={fullPageImage}
        onRequestClose={() => {
          setFullPageImage(false);
        }}
        boxStyle={styles.fullPageImage}
      >
        <Image
          source={{ uri: imageSourceLarge }}
          style={styles.fullPageImage}
        />
      </Modal>
    </TransparentView>
  );
}
