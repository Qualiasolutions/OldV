import Checkbox from 'components/molecules/Checkbox';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  useCreateTimeBlockMutation,
  useDeleteTimeBlockMutation,
  useGetAllTimeBlocksQuery
} from 'reduxStore/services/api/timeblocks';
import DateTimeTextInput from 'components/forms/components/DateTimeTextInput';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/molecules/ButtonComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'center'
  },
  dayOption: {
    marginRight: 10,
    marginBottom: 10
  },
  breakpointsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  breakpointContainer: {
    marginBottom: 15
  },
  breakpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  breakpointLabel: {
    width: 100,
    fontSize: 16
  },
  timeBlockCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 5
  },
  timeBlockText: {
    fontSize: 16
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center'
  },
  button: {
    marginRight: 10
  },
  noTimeBlocks: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16
  }
});

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Tu' },
  { value: 3, label: 'We' },
  { value: 4, label: 'Th' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' },
  { value: 7, label: 'Su' }
];

// Helper function to format time for display
const formatTimeDisplay = (time: string) => {
  if (!time) return '';
  return dayjs(`2000-01-01T${time}`).format('h:mm A');
};

export default function TimeBlocksList() {
  const { t } = useTranslation();
  const { data: allTimeBlocks } = useGetAllTimeBlocksQuery();
  const [createTimeBlock, createResult] = useCreateTimeBlockMutation();
  const [deleteTimeBlock, deleteResult] = useDeleteTimeBlockMutation();
  const { data: userDetails } = useGetUserFullDetails();

  const [selectedDay, setSelectedDay] = useState(1); // Monday by default
  const [breakpoints, setBreakpoints] = useState<string[]>([
    '07:00',
    '12:00',
    '17:00'
  ]);
  const [saving, setSaving] = useState(false);

  // Filter timeblocks for the selected day
  const timeBlocksForDay = useMemo(() => {
    return (
      allTimeBlocks?.ids
        .filter((id) => allTimeBlocks.byId[id].day === selectedDay)
        .map((id) => allTimeBlocks.byId[id])
        .sort((a, b) => a.start_time.localeCompare(b.start_time)) || []
    );
  }, [allTimeBlocks, selectedDay]);

  // Initialize breakpoints from existing timeblocks if available
  useEffect(() => {
    if (timeBlocksForDay.length > 0) {
      // Extract breakpoints from the timeblocks
      const newBreakpoints: string[] = [];

      // Sort timeblocks by start time
      const sortedBlocks = [...timeBlocksForDay].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );

      // Get breakpoints from end times (except the last one)
      sortedBlocks.forEach((block, index) => {
        if (index < sortedBlocks.length - 1 && block.end_time !== '00:00') {
          newBreakpoints.push(block.end_time);
        }
      });

      if (newBreakpoints.length > 0) {
        // Sort the breakpoints
        setBreakpoints(newBreakpoints.sort((a, b) => a.localeCompare(b)));
      }
    }
  }, [selectedDay, timeBlocksForDay]);

  // Calculate timeblocks from breakpoints
  const calculateTimeBlocks = useCallback(() => {
    const sortedBreakpoints = [...breakpoints].sort((a, b) =>
      a.localeCompare(b)
    );
    const timeBlocks = [];

    // First block: 00:00 to first breakpoint
    if (sortedBreakpoints.length > 0) {
      timeBlocks.push({
        start_time: '00:00',
        end_time: sortedBreakpoints[0]
      });
    }

    // Middle blocks
    for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
      timeBlocks.push({
        start_time: sortedBreakpoints[i],
        end_time: sortedBreakpoints[i + 1]
      });
    }

    // Last block: last breakpoint to 00:00
    if (sortedBreakpoints.length > 0) {
      timeBlocks.push({
        start_time: sortedBreakpoints[sortedBreakpoints.length - 1],
        end_time: '00:00'
      });
    } else {
      // If no breakpoints, just one full day block
      timeBlocks.push({
        start_time: '00:00',
        end_time: '00:00'
      });
    }

    return timeBlocks;
  }, [breakpoints]);

  // Save timeblocks to the API
  const saveTimeBlocks = async () => {
    if (!userDetails?.id) {
      Toast.show({
        type: 'error',
        text1: t('common.errors.generic')
      });
      return;
    }

    try {
      setSaving(true);

      // Delete all existing timeblocks for this day
      const deletePromises = timeBlocksForDay.map((block) =>
        deleteTimeBlock({ id: block.id })
      );
      await Promise.all(deletePromises);

      // Create new timeblocks based on breakpoints
      const timeBlocks = calculateTimeBlocks();
      const createPromises = timeBlocks.map((block) =>
        createTimeBlock({
          ...block,
          day: selectedDay,
          members: [userDetails.id]
        })
      );
      await Promise.all(createPromises);

      Toast.show({
        type: 'success',
        text1: t('common.updateSuccess', 'Time blocks updated successfully')
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.errors.generic')
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle breakpoint changes
  const updateBreakpoint = (index: number, newTime: string) => {
    const newBreakpoints = [...breakpoints];
    newBreakpoints[index] = newTime;

    // Sort breakpoints to ensure they're in ascending order
    setBreakpoints(newBreakpoints.sort((a, b) => a.localeCompare(b)));
  };

  // Add a new breakpoint
  const addBreakpoint = () => {
    if (breakpoints.length < 3) {
      // Find a time that's not already used
      let newTime = '12:00';
      if (breakpoints.includes(newTime)) {
        newTime = '15:00';
        if (breakpoints.includes(newTime)) {
          newTime = '09:00';
          if (breakpoints.includes(newTime)) {
            newTime = '18:00';
          }
        }
      }

      // Add the new breakpoint and sort
      const newBreakpoints = [...breakpoints, newTime];
      setBreakpoints(newBreakpoints.sort((a, b) => a.localeCompare(b)));
    }
  };

  // Remove a breakpoint
  const removeBreakpoint = (index: number) => {
    const newBreakpoints = [...breakpoints];
    newBreakpoints.splice(index, 1);
    setBreakpoints(newBreakpoints.sort((a, b) => a.localeCompare(b)));
  };

  // Calculate current timeblocks from breakpoints
  const currentTimeBlocks = calculateTimeBlocks();

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView>
        <WhiteBox>
          <TransparentView style={styles.daySelector}>
            {DAYS_OF_WEEK.map((day) => (
              <Checkbox
                key={day.value}
                checked={selectedDay === day.value}
                onValueChange={async () => setSelectedDay(day.value)}
                label={day.label}
                wrapperStyle={styles.dayOption}
              />
            ))}
          </TransparentView>
        </WhiteBox>

        <WhiteBox style={styles.card}>
          <Text style={styles.breakpointsHeader}>
            {t('common.timeBlockBreakpoints', 'Set Day Breakpoints')}
          </Text>

          <TransparentView style={styles.breakpointContainer}>
            {breakpoints.map((time, index) => (
              <TransparentView key={index} style={styles.breakpoint}>
                <Text style={styles.breakpointLabel}>
                  {`Time ${index + 1}`}
                </Text>
                <DateTimeTextInput
                  value={dayjs(`2000-01-01T${time}`).toDate()}
                  onValueChange={(newValue: Date) => {
                    updateBreakpoint(index, dayjs(newValue).format('HH:mm'));
                  }}
                  mode="time"
                />
                <Button
                  title="✕"
                  onPress={() => removeBreakpoint(index)}
                  style={{ marginLeft: 10, width: 40 }}
                />
              </TransparentView>
            ))}

            {breakpoints.length < 3 && (
              <Button
                title={t('common.addBreakpoint', 'Add Breakpoint')}
                onPress={addBreakpoint}
                style={{ marginTop: 10 }}
              />
            )}
          </TransparentView>

          <Text style={styles.breakpointsHeader}>
            {t('common.resultingTimeBlocks', 'Resulting Time Blocks')}
          </Text>

          {currentTimeBlocks.map((block, index) => (
            <TransparentView key={index} style={styles.timeBlockCard}>
              <Text style={styles.timeBlockText}>
                {`${formatTimeDisplay(block.start_time)} - ${
                  block.end_time === '00:00'
                    ? '12:00 AM (next day)'
                    : formatTimeDisplay(block.end_time)
                }`}
              </Text>
            </TransparentView>
          ))}

          <TransparentView style={styles.buttons}>
            {createResult.isLoading || deleteResult.isLoading || saving ? (
              <PaddedSpinner />
            ) : (
              <Button
                title={t('common.save')}
                onPress={saveTimeBlocks}
                style={styles.button}
              />
            )}
          </TransparentView>
        </WhiteBox>
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
