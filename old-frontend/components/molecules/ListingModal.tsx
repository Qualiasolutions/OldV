import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'components/Themed';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { TransparentView, WhiteView } from './ViewComponents';
import RBSheet from 'react-native-raw-bottom-sheet';
import Colors from '../../constants/Colors';
import Search from './Search';
import SafePressable from './SafePressable';
import Checkbox from './Checkbox';
import { FlatList } from 'react-native-gesture-handler';

type ListItem = {
  name: string;
  id: number | string;
  selected?: boolean;
  data?: any;
};

type ListingModalProps = {
  visible: boolean;
  data: ListItem[];
  onClose?: () => void;
  onSelect: (item: ListItem) => void;
  minSearchLength?: number;
};

const listingModalStyles = StyleSheet.create({
  bottomContainer: {
    width: '100%',
    padding: 23
  },
  listItem: {
    borderBottomColor: Colors.light.disabledGrey,
    borderBottomWidth: 1,
    justifyContent: 'center'
  }
});

const defaultListItemStyles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

const ITEM_HEIGHT = 50;

export default function ListingModal(props: ListingModalProps) {
  const bottomSheetRef = useRef<RBSheet>(null);
  const {
    visible,
    data = [],
    onClose = () => {},
    onSelect,
    minSearchLength = 0
  } = props;

  const [searchedText, setSearchedText] = useState('');

  useEffect(() => {
    if (visible) bottomSheetRef?.current?.open();
    else bottomSheetRef?.current?.close();
  }, [visible]);

  const filteredSectionData = data.filter(
    (option) =>
      searchedText.length >= minSearchLength &&
      option.name.toLowerCase().includes(searchedText.toLowerCase())
  );

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      return (
        <SafePressable
          style={[listingModalStyles.listItem, { height: ITEM_HEIGHT }]}
          key={item.id}
          onPress={() => onSelect(item)}
        >
          <TransparentView style={defaultListItemStyles.container}>
            <TransparentView>
              <Text> {item.name} </Text>
            </TransparentView>
            {/* <Checkbox checked={item.selected} /> */}
          </TransparentView>
        </SafePressable>
      );
    },
    [onSelect]
  );

  return (
    <RBSheet
      ref={bottomSheetRef}
      height={600}
      onClose={onClose}
      customStyles={{
        container: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20
        }
      }}
      dragFromTopOnly={true}
      closeOnDragDown={true}
    >
      <WhiteView style={listingModalStyles.bottomContainer}>
        <Search onChangeText={setSearchedText} value={searchedText} />
        <FlatList
          data={filteredSectionData.map((item) => ({
            ...item,
            title: item.name
          }))}
          renderItem={renderItem}
          getItemLayout={(dat, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index
          })}
          initialNumToRender={50}
        />
      </WhiteView>
    </RBSheet>
  );
}
