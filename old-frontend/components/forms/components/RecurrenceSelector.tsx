import { Button } from 'components/molecules/ButtonComponents';
import InputWithLabel from 'components/molecules/InputWithLabel';
import { Modal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import { PrimaryText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import dayjs from 'dayjs';
import { t } from 'i18next';
import ordinal from 'ordinal';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Recurrence, RecurrenceType } from 'types/tasks';
import { getUTCValuesFromDateTimeString } from 'utils/datesAndTimes';
import DateTimeTextInput from './DateTimeTextInput';

type RecurrenceValue = Omit<Recurrence, 'id'>;

const styles = StyleSheet.create({
  formContainer: { width: '100%' },
  formInnerContainer: { flexDirection: 'row' },
  intervalSelectorWrapper: { marginRight: 5, flex: 1 },
  typeSelectorWrapper: { marginLeft: 5, flex: 1 },
  untilInput: { marginVertical: 10 },
  summaryPressables: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryIntervalPiece: { marginRight: 10 },
  modalBox: { width: '100%' },
  buttonWrapper: { flexDirection: 'row' },
  okButton: { marginRight: 5 },
  optionsList: { maxHeight: 250 },
  option: {
    paddingVertical: 3,
    borderBottomWidth: 1
  }
});

const getIntervalText = (recurrence: RecurrenceValue) => {
  const { interval_length: intervalLength } = recurrence;
  if (intervalLength === 1) {
    return `Every`;
  }
  if (intervalLength === 2) {
    return `Every other`;
  }
  return `Every ${ordinal(intervalLength)}`;
};

const getTypeText = (recurrence: RecurrenceValue) => {
  const { recurrence: type } = recurrence;

  if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'WEEKDAILY'].includes(type)) {
    const typeMap: { [key in RecurrenceType]: string } = {
      DAILY: 'day',
      WEEKLY: 'week',
      MONTHLY: 'month',
      YEARLY: 'year',
      WEEKDAILY: 'weekday',
      MONTHLY_LAST_WEEK: '',
      MONTH_WEEKLY: '',
      YEAR_MONTH_WEEKLY: ''
    };

    return typeMap[type];
  }

  if (type === 'MONTH_WEEKLY') {
    return 'month';
  }

  if (type === 'MONTHLY_LAST_WEEK') {
    return 'month';
  }

  if (type === 'YEAR_MONTH_WEEKLY') {
    return 'year';
  }

  return '';
};

const getWeekNumber = (firstOccurrence: Date) => {
  const firstOccDayJs = dayjs(firstOccurrence);
  const dayNumber = parseInt(firstOccDayJs.format('D'));
  const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;
  return weekNumber;
};

const getWeekNumberString = (
  recurrence: RecurrenceValue,
  firstOccurrence: Date
) => {
  if (recurrence.recurrence === 'MONTHLY_LAST_WEEK') {
    return 'last';
  }
  const firstOccDayJs = dayjs(firstOccurrence);
  const dayNumber = parseInt(firstOccDayJs.format('D'));
  const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;
  return ordinal(weekNumber);
};

const getDayName = (firstOccurrence: Date) => {
  const firstOccDayJs = dayjs(firstOccurrence);
  const dayName = firstOccDayJs.format('dddd');
  return dayName;
};

const getMonthName = (firstOccurrence: Date) => {
  const firstOccDayJs = dayjs(firstOccurrence);
  const monthName = firstOccDayJs.format('MMMM');
  return monthName;
};

const recurrenceToName = (
  recurrence: RecurrenceValue,
  firstOccurrence: Date,
  reverse?: boolean
) => {
  const { interval_length: intervalLength, recurrence: type } = recurrence;

  const latestOccurenceUtcValues = recurrence.latest_occurrence
    ? getUTCValuesFromDateTimeString(recurrence.latest_occurrence)
    : null;
  const latestOccurrenceString = latestOccurenceUtcValues
    ? `${latestOccurenceUtcValues.day} ${latestOccurenceUtcValues.monthName} ${latestOccurenceUtcValues.year}`
    : '';
  const untilString = latestOccurrenceString
    ? reverse
      ? `${t(
          'components.recurrenceSelector.from'
        ).toLowerCase()} ${latestOccurrenceString}`
      : `${t(
          'components.recurrenceSelector.until'
        ).toLowerCase()} ${latestOccurrenceString}`
    : reverse
    ? `${t('components.recurrenceSelector.from').toLowerCase()} ${t(
        'components.recurrenceSelector.now'
      ).toLowerCase()}`
    : t('components.recurrenceSelector.forever').toLowerCase();

  if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'WEEKDAILY'].includes(type)) {
    const typeMap: { [key in RecurrenceType]: string } = {
      DAILY: 'day',
      WEEKLY: 'week',
      MONTHLY: 'month',
      YEARLY: 'year',
      WEEKDAILY: 'weekday',
      MONTHLY_LAST_WEEK: '',
      MONTH_WEEKLY: '',
      YEAR_MONTH_WEEKLY: ''
    };

    if (intervalLength === 1 || intervalLength === 2) {
      return `${getIntervalText(recurrence)} ${typeMap[type]} ${untilString}`;
    }
    return `${getIntervalText(recurrence)} ${typeMap[type]}s ${untilString}`;
  }

  const firstOccDayJs = dayjs(firstOccurrence);
  const dayNumber = parseInt(firstOccDayJs.format('D'));
  const dayName = firstOccDayJs.format('dddd');
  const monthName = firstOccDayJs.format('MMMM');
  const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;

  if (type === 'MONTH_WEEKLY') {
    if (intervalLength === 1) {
      return `Every month on the ${ordinal(
        weekNumber
      )} ${dayName} ${untilString}`;
    }
    if (intervalLength === 2) {
      return `Every other month on the ${ordinal(
        weekNumber
      )} ${dayName} ${untilString}`;
    }
    return `Every ${ordinal(intervalLength)} month on the ${ordinal(
      weekNumber
    )} ${dayName} ${untilString}`;
  }

  if (type === 'MONTHLY_LAST_WEEK') {
    if (intervalLength === 1) {
      return `Every month on the last ${dayName} ${untilString}`;
    }
    if (intervalLength === 2) {
      return `Every other month on the last ${dayName} ${untilString}`;
    }
    return `Every ${ordinal(
      intervalLength
    )} month on the last ${dayName} ${untilString}`;
  }

  if (type === 'YEAR_MONTH_WEEKLY') {
    if (intervalLength === 1) {
      return `Every year on the ${ordinal(
        weekNumber
      )} ${dayName} in ${monthName} ${untilString}`;
    }
    if (intervalLength === 2) {
      return `Every other year on the ${ordinal(
        weekNumber
      )} ${dayName} in ${monthName} ${untilString}`;
    }
    return `Every ${intervalLength} years on the ${ordinal(
      weekNumber
    )} ${dayName} in ${monthName} ${untilString}`;
  }

  return '';
};

const INTERVAL_ITEMS = [
  {
    value: '1',
    label: 'Every'
  },
  {
    value: '2',
    label: 'Every other'
  }
];

for (let i = 3; i <= 30; i++) {
  INTERVAL_ITEMS.push({ value: `${i}`, label: `Every ${ordinal(i)}` });
}

const WEEK_NUMBER_OPTIONS: {
  value: number | 'LAST';
  label: string;
}[] = [
  {
    value: 1,
    label: '1st'
  },
  {
    value: 2,
    label: '2nd'
  },
  {
    value: 3,
    label: '3rd'
  },
  {
    value: 4,
    label: '4th'
  },
  {
    value: 'LAST',
    label: 'last'
  }
];

const DAY_NAME_OPTIONS = [
  {
    value: 0,
    label: 'Sunday'
  },
  {
    value: 1,
    label: 'Monday'
  },
  {
    value: 2,
    label: 'Tuesday'
  },
  {
    value: 3,
    label: 'Wednesday'
  },
  {
    value: 4,
    label: 'Thursday'
  },
  {
    value: 5,
    label: 'Friday'
  },
  {
    value: 6,
    label: 'Saturday'
  }
];

const MONTH_NAME_OPTIONS = [
  {
    value: 0,
    label: 'January'
  },
  {
    value: 1,
    label: 'February'
  },
  {
    value: 2,
    label: 'March'
  },
  {
    value: 3,
    label: 'April'
  },
  {
    value: 4,
    label: 'May'
  },
  {
    value: 5,
    label: 'June'
  },
  {
    value: 6,
    label: 'July'
  },
  {
    value: 7,
    label: 'August'
  },
  {
    value: 8,
    label: 'September'
  },
  {
    value: 9,
    label: 'October'
  },
  {
    value: 10,
    label: 'November'
  },
  {
    value: 11,
    label: 'December'
  }
];

const getTypeOptions = (firstOccurrence: Date) => {
  const firstOccDayJs = dayjs(firstOccurrence);
  const dayName = firstOccDayJs.format('dddd');
  const dayNumber = parseInt(firstOccDayJs.format('D'));
  const weekdayNumber = parseInt(firstOccDayJs.format('d'));
  const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;
  const monthName = firstOccDayJs.format('MMMM');

  const firstOccurrenceCopy = new Date(firstOccurrence);
  firstOccurrenceCopy.setDate(firstOccurrenceCopy.getDate() + 7);
  const isLastWeek =
    firstOccurrence.getMonth() !== firstOccurrenceCopy.getMonth();

  const typeItems: {
    value: RecurrenceType;
    label: string;
  }[] = [
    {
      value: 'DAILY',
      label: 'Day'
    }
  ];

  if (weekdayNumber < 5) {
    typeItems.push({
      value: 'WEEKDAILY',
      label: 'Weekday'
    });
  }

  typeItems.push({
    value: 'WEEKLY',
    label: 'Week'
  });

  typeItems.push({
    value: 'MONTHLY',
    label: 'Month'
  });

  typeItems.push({
    value: 'YEARLY',
    label: 'Year'
  });

  if (weekNumber < 5) {
    typeItems.push({
      value: 'MONTH_WEEKLY',
      label: `Month on the ${ordinal(weekNumber)} ${dayName}`
    });
  }

  if (isLastWeek) {
    typeItems.push({
      value: 'MONTHLY_LAST_WEEK',
      label: `Month on the last ${dayName}`
    });
  }

  typeItems.push({
    value: 'YEAR_MONTH_WEEKLY',
    label: `Year on the ${ordinal(weekNumber)} ${dayName} in ${monthName}`
  });

  return typeItems;
};

type RecurrenceFormProps = {
  value: RecurrenceValue;
  onChange: (newValue: RecurrenceValue) => void;
  onChangeFirstOccurrenceField: (newValue: Date) => void;
  firstOccurrence: Date;
  reverse?: boolean;
};
const RecurrenceForm = ({
  value,
  onChange,
  onChangeFirstOccurrenceField,
  firstOccurrence,
  reverse
}: RecurrenceFormProps) => {
  const [choosing, setChoosing] = useState('');

  const defaultValues: RecurrenceValue = {
    earliest_occurrence: null,
    latest_occurrence: null,
    interval_length: 1,
    recurrence: 'DAILY'
  };

  const intervalText = getIntervalText(value);
  const typeText = getTypeText(value);
  const typeOptions = getTypeOptions(firstOccurrence);

  return (
    <TransparentView style={styles.formContainer}>
      <TransparentView style={styles.formInnerContainer}>
        <TransparentView>
          <TransparentView style={styles.summaryPressables}>
            <SafePressable
              onPress={() => {
                setChoosing('INTERVAL');
              }}
              style={styles.summaryIntervalPiece}
            >
              <PrimaryText text={intervalText} />
            </SafePressable>
            <SafePressable
              onPress={() => {
                setChoosing('TYPE');
              }}
              style={styles.summaryIntervalPiece}
            >
              <PrimaryText text={typeText} />
            </SafePressable>
            {[
              'MONTH_WEEKLY',
              'MONTHLY_LAST_WEEK',
              'YEAR_MONTH_WEEKLY'
            ].includes(value.recurrence) && (
              <TransparentView>
                <Text style={styles.summaryIntervalPiece}>on the</Text>
              </TransparentView>
            )}
            {[
              'MONTH_WEEKLY',
              'MONTHLY_LAST_WEEK',
              'YEAR_MONTH_WEEKLY'
            ].includes(value.recurrence) && (
              <SafePressable
                onPress={() => {
                  setChoosing('WEEK_NUMBER');
                }}
                style={styles.summaryIntervalPiece}
              >
                <PrimaryText
                  text={getWeekNumberString(value, firstOccurrence)}
                />
              </SafePressable>
            )}
            {[
              'MONTH_WEEKLY',
              'MONTHLY_LAST_WEEK',
              'YEAR_MONTH_WEEKLY'
            ].includes(value.recurrence) && (
              <SafePressable
                onPress={() => {
                  setChoosing('DAY_NAME');
                }}
                style={styles.summaryIntervalPiece}
              >
                <PrimaryText text={getDayName(firstOccurrence)} />
              </SafePressable>
            )}
            {value.recurrence === 'YEAR_MONTH_WEEKLY' && (
              <>
                <TransparentView style={styles.summaryIntervalPiece}>
                  <Text>in</Text>
                </TransparentView>
                <SafePressable
                  onPress={() => {
                    setChoosing('MONTH_NAME');
                  }}
                  style={styles.summaryIntervalPiece}
                >
                  <PrimaryText text={getMonthName(firstOccurrence)} />
                </SafePressable>
              </>
            )}
          </TransparentView>
          {choosing === 'TYPE' && (
            <TransparentScrollView style={styles.optionsList}>
              {typeOptions.map((opt, i) => (
                <SafePressable
                  key={i}
                  onPress={() => {
                    onChange({
                      ...value,
                      recurrence: opt.value
                    });
                    setChoosing('');
                  }}
                  style={styles.option}
                >
                  <Text>{opt.label}</Text>
                </SafePressable>
              ))}
            </TransparentScrollView>
          )}
          {choosing === 'INTERVAL' && (
            <TransparentScrollView style={styles.optionsList}>
              {INTERVAL_ITEMS.map((opt, i) => (
                <SafePressable
                  key={i}
                  onPress={() => {
                    const intervalLength = opt.value;
                    onChange({
                      ...value,
                      interval_length: parseInt(intervalLength)
                    });
                    setChoosing('');
                  }}
                  style={styles.option}
                >
                  <Text>{opt.label}</Text>
                </SafePressable>
              ))}
            </TransparentScrollView>
          )}
          {choosing === 'WEEK_NUMBER' && (
            <TransparentScrollView style={styles.optionsList}>
              {WEEK_NUMBER_OPTIONS.map((opt, i) => (
                <SafePressable
                  key={i}
                  style={styles.option}
                  onPress={() => {
                    const currentWeekNumber = getWeekNumber(firstOccurrence);
                    const newWeekNumber = opt.value;

                    const newDate = new Date(firstOccurrence);
                    const initialMonth = newDate.getMonth();
                    if (newWeekNumber === 'LAST') {
                      while (newDate.getMonth() === initialMonth) {
                        newDate.setDate(newDate.getDate() + 7);
                      }
                      // We overshot by one week
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      if (currentWeekNumber < newWeekNumber) {
                        const weekDelta = newWeekNumber - currentWeekNumber;
                        newDate.setDate(newDate.getDate() + 7 * weekDelta);
                      } else {
                        const weekDelta = currentWeekNumber - newWeekNumber;
                        newDate.setDate(newDate.getDate() - 7 * weekDelta);
                      }
                    }
                    onChangeFirstOccurrenceField(newDate);

                    if (newWeekNumber === 'LAST') {
                      onChange({
                        ...value,
                        recurrence: 'MONTHLY_LAST_WEEK'
                      });
                    } else {
                      onChange({
                        ...value,
                        recurrence: 'MONTH_WEEKLY'
                      });
                    }
                    setChoosing('');
                  }}
                >
                  <Text>{opt.label}</Text>
                </SafePressable>
              ))}
            </TransparentScrollView>
          )}
          {choosing === 'DAY_NAME' && (
            <TransparentScrollView style={styles.optionsList}>
              {DAY_NAME_OPTIONS.map((opt, i) => (
                <SafePressable
                  key={i}
                  style={styles.option}
                  onPress={() => {
                    const initialWeekNumber = getWeekNumber(firstOccurrence);
                    const newDay = opt.value;
                    const initialDay = firstOccurrence.getDay();

                    const newDate = new Date(firstOccurrence);

                    newDate.setDate(newDate.getDate() + newDay - initialDay);
                    if (getWeekNumber(newDate) === initialWeekNumber) {
                      // We are in the same week number, great!
                      onChangeFirstOccurrenceField(newDate);
                    } else {
                      if (newDay > initialDay) {
                        // We must have overshot, let's go a week back
                        newDate.setDate(newDate.getDate() - 7);
                      } else {
                        // We must have overshot, let's go a week forward
                        newDate.setDate(newDate.getDate() + 7);
                      }
                      onChangeFirstOccurrenceField(newDate);
                    }
                    setChoosing('');
                  }}
                >
                  <Text>{opt.label}</Text>
                </SafePressable>
              ))}
            </TransparentScrollView>
          )}
          {choosing === 'MONTH_NAME' && (
            <TransparentScrollView style={styles.optionsList}>
              {MONTH_NAME_OPTIONS.map((opt, i) => (
                <SafePressable
                  key={i}
                  style={styles.option}
                  onPress={() => {
                    const newMonth = opt.value;
                    const newDate = new Date(firstOccurrence);
                    newDate.setMonth(newMonth);
                    onChangeFirstOccurrenceField(newDate);
                    setChoosing('');
                  }}
                >
                  <Text>{opt.label}</Text>
                </SafePressable>
              ))}
            </TransparentScrollView>
          )}
        </TransparentView>
      </TransparentView>
      <InputWithLabel
        label={
          reverse
            ? t('components.recurrenceSelector.from')
            : t('components.recurrenceSelector.until')
        }
        inlineFields={true}
        style={styles.untilInput}
      >
        <DateTimeTextInput
          value={
            value?.latest_occurrence ? new Date(value.latest_occurrence) : null
          }
          minimumDate={new Date()}
          onValueChange={(newValue: Date | null) => {
            if (value) {
              onChange({
                ...value,
                latest_occurrence: newValue ? newValue.toISOString() : null
              });
            } else {
              onChange({
                ...defaultValues,
                latest_occurrence: newValue ? newValue.toISOString() : null
              });
            }
          }}
          mode="date"
          placeholder={
            reverse
              ? t('components.recurrenceSelector.now')
              : t('components.recurrenceSelector.forever')
          }
        />
      </InputWithLabel>
    </TransparentView>
  );
};

type RecurrenceSelectorProps = {
  value: RecurrenceValue | null;
  onChange: (newValue: RecurrenceValue | null) => void;
  onChangeFirstOccurrenceField: (newValue: Date) => void;
  firstOccurrence: Date | null;
  disabled?: boolean;
  reverse?: boolean;
};
export default function RecurrenceSelector({
  value,
  onChange,
  onChangeFirstOccurrenceField,
  firstOccurrence,
  disabled,
  reverse
}: RecurrenceSelectorProps) {
  const [editing, setEditing] = useState(false);

  const defaultValue: RecurrenceValue = {
    earliest_occurrence: null,
    latest_occurrence: null,
    interval_length: 1,
    recurrence: 'DAILY'
  };

  const [newValue, setNewValue] = useState<RecurrenceValue>(
    value || defaultValue
  );
  const valueString =
    value && firstOccurrence
      ? recurrenceToName(value, firstOccurrence, reverse)
      : 'None';

  return (
    <TransparentView>
      <SafePressable
        onPress={() => {
          if (!disabled) {
            setEditing(true);
          }
        }}
      >
        <Text>{valueString}</Text>
      </SafePressable>
      <Modal
        visible={editing}
        onRequestClose={() => setEditing(false)}
        boxStyle={styles.modalBox}
      >
        {firstOccurrence ? (
          <RecurrenceForm
            value={newValue}
            onChange={(val) => setNewValue(val)}
            onChangeFirstOccurrenceField={onChangeFirstOccurrenceField}
            firstOccurrence={firstOccurrence}
            reverse={reverse}
          />
        ) : (
          <Text>Please set the first occurence</Text>
        )}
        <TransparentView style={styles.buttonWrapper}>
          <Button
            title={t('common.ok')}
            onPress={() => {
              onChange(newValue);
              setEditing(false);
            }}
            style={styles.okButton}
          />
          <Button
            title={t('common.clear')}
            onPress={() => {
              setNewValue(defaultValue);
              onChange(null);
              setEditing(false);
            }}
          />
        </TransparentView>
      </Modal>
    </TransparentView>
  );
}
