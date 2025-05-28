/*
  TaskCalendar - this is a calendar component for displaying tasks (and periods)
*/

import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import dayjs from 'dayjs';
import { getUTCValuesFromDateString } from 'utils/datesAndTimes';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { selectEnforcedDate } from 'reduxStore/slices/calendars/selectors';
import SafePressable from 'components/molecules/SafePressable';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  monthPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthText: { fontWeight: 'bold', fontSize: 20, marginRight: 10 }
});

export default function MonthSelector({
  onValueChange
}: {
  onValueChange: (date: Date) => void;
}) {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const enforcedDate = useSelector(selectEnforcedDate);
  const { data: userDetails } = useGetUserFullDetails();

  const now = dayjs(new Date());
  const { monthShortName, year } = enforcedDate
    ? getUTCValuesFromDateString(enforcedDate)
    : { monthShortName: now.format('MMM'), year: now.format('YYYY') };

  if (!userDetails) {
    return null;
  }
  return (
    <>
      <SafePressable
        onPress={() => {
          setIsDatePickerVisible(true);
        }}
        style={styles.monthPressable}
      >
        <AlmostBlackText
          text={`${monthShortName} ${year}`}
          style={styles.monthText}
        />
        <AlmostBlackText text="▼" />
      </SafePressable>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={'date'}
        date={enforcedDate ? new Date(enforcedDate) : undefined}
        onConfirm={(newValue) => {
          setIsDatePickerVisible(false);
          onValueChange(newValue);
        }}
        onCancel={() => {
          setIsDatePickerVisible(false);
        }}
      />
    </>
  );
}
