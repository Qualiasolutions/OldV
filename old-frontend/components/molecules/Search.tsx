import React from 'react';
import { TextInput, View, StyleSheet, Keyboard } from 'react-native';
import { t } from 'i18next';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from 'components/Themed';
import { default as Colors } from '../../constants/Colors';
import { TouchableOpacity } from './TouchableOpacityComponents';

const styles = StyleSheet.create({
  searchView: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: Colors.light.lightGrey,
    borderRadius: 20,
    paddingLeft: 18,
    paddingRight: 36
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 20,
    fontFamily: 'Poppins',
    fontSize: 16
  }
});

type SearchProps = {
  value: string;
  onChangeText: (val: string) => void;
  onSubmit?: (val: string) => void;
};

const Search = ({ value, onChangeText = () => {}, onSubmit }: SearchProps) => {
  const mediumGrey = useThemeColor({}, 'mediumGrey');
  return (
    <View style={styles.searchView}>
      <Feather name="search" size={22} color={mediumGrey} />
      <TextInput
        value={value}
        placeholder={t('common.search')}
        placeholderTextColor={mediumGrey}
        style={styles.textInput}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          if (onSubmit) {
            onSubmit(value);
            Keyboard.dismiss();
          }
        }}
      />
      {onSubmit && (
        <>
          {value && (
            <TouchableOpacity
              onPress={() => {
                onChangeText('');
                onSubmit('');
                Keyboard.dismiss();
              }}
            >
              <Feather name="x" size={22} color={mediumGrey} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              onSubmit(value);
              Keyboard.dismiss();
            }}
          >
            <Feather name="arrow-right" size={22} color={mediumGrey} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default Search;
