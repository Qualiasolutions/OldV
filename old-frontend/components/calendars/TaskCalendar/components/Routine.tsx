import { StyleSheet } from 'react-native';
import { Text, useThemeColor } from 'components/Themed';
import React from 'react';

import { TransparentView } from 'components/molecules/ViewComponents';

import { ITEM_HEIGHT } from './shared';
import { useSelector } from 'react-redux';
import { selectRoutineById } from 'reduxStore/slices/routines/selectors';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';

const styles = StyleSheet.create({
  leftInfo: {
    marginRight: 20,
    flexDirection: 'row'
  },
  outerContainer: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    justifyContent: 'center'
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 2,
    width: '100%'
  },
  routineName: { fontSize: 16 }
});

type PropTypes = {
  id: number;
  date: string;
};

export default function Routine({ id, date }: PropTypes) {
  const routine = useSelector(selectRoutineById(id));
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, 'almostWhite');
  const borderColor = useThemeColor({}, 'almostBlack');
  if (!routine) {
    return (
      <TransparentView
        style={[styles.outerContainer, { height: ITEM_HEIGHT }]}
      />
    );
  }
  return (
    <TransparentView style={[styles.outerContainer, { height: ITEM_HEIGHT }]}>
      <TouchableOpacity
        onPress={() => {
          (navigation.navigate as any)('RoutineTasks', {
            id,
            date
          });
        }}
        style={[styles.container, { backgroundColor, borderColor }]}
      >
        <TransparentView style={styles.leftInfo}>
          <Text>
            {routine.start_time.slice(0, 5)} - {routine.end_time.slice(0, 5)}
          </Text>
        </TransparentView>
        <Text style={styles.routineName}>{routine.name}</Text>
      </TouchableOpacity>
    </TransparentView>
  );
}
