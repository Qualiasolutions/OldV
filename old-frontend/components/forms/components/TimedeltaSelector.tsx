import { Feather } from '@expo/vector-icons';
import { Button } from 'components/molecules/ButtonComponents';
import { Modal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

type IntervalType = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK';
export type TimeDeltaObject = { timedelta: string };

const useTimeDeltaStringToReadableString = () => {
  const { t } = useTranslation();

  return (td: string) => {
    const parts = td.split(' ');
    if (parts.length === 1) {
      // If there are no days then insert 0 days
      parts.unshift('');
    }
    const numDays = parseInt(parts[0]);
    const [numHours, numMinutes] = parts[1]
      .split(':')
      .map((val) => parseInt(val));

    return `${numDays ? `${numDays} ${t('common.days')} ` : ''}${
      numHours ? `${numHours} ${t('common.hours')} ` : ''
    }${numMinutes ? `${numMinutes} ${t('common.minutes')} ` : ''}before`;
  };
};

const NUMBER_ITEMS: { value: number; label: string }[] = [];
for (let i = 1; i < 61; i++) {
  NUMBER_ITEMS.push({
    value: i,
    label: `${i}`
  });
}
const NumberSelector = ({
  value,
  onChange
}: {
  value: number | null;
  onChange: (val: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <DropDownPicker
      value={value}
      items={NUMBER_ITEMS}
      multiple={false}
      setValue={(item) => {
        if (item(null)) {
          onChange(item(null));
        }
      }}
      open={open}
      setOpen={setOpen}
      listMode="MODAL"
      placeholder={''}
    />
  );
};

const TIME_INTERVAL_ITEMS: {
  [key in IntervalType]: { value: IntervalType; label: string };
} = {
  MINUTE: {
    value: 'MINUTE',
    label: 'Minutes Before'
  },
  HOUR: {
    value: 'HOUR',
    label: 'Hours Before'
  },
  DAY: {
    value: 'DAY',
    label: 'Days Before'
  },
  WEEK: {
    value: 'WEEK',
    label: 'Weeks Before'
  }
};
const TimeIntervalSelector = ({
  value,
  onChange,
  intervalTypes
}: {
  value: IntervalType | null;
  onChange: (val: IntervalType) => void;
  intervalTypes: IntervalType[];
}) => {
  const [open, setOpen] = useState(false);
  return (
    <DropDownPicker
      value={value}
      items={intervalTypes.map((type) => TIME_INTERVAL_ITEMS[type])}
      multiple={false}
      setValue={(item) => {
        if (item(null)) {
          onChange(item(null));
        }
      }}
      open={open}
      setOpen={setOpen}
      listMode="MODAL"
      placeholder={''}
    />
  );
};

type ActionSelectorModalProps = {
  open: boolean;
  value: TimeDeltaObject[];
  onChange: (newValue: TimeDeltaObject[]) => void;
  onRequestClose: () => void;
  max?: number;
  intervalTypes?: IntervalType[];
};

const modalStyles = StyleSheet.create({
  container: { width: '100%' },
  dropdownContainer: { flex: 1 },
  selectionRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  exisitingValueRow: { flexDirection: 'row' },
  deleteActionCross: { marginLeft: 10 },
  buttonWrapper: { flexDirection: 'row', marginTop: 10 },
  addButton: { paddingVertical: 5, paddingHorizontal: 10, marginLeft: 5 }
});

const TimedeltaSelectorModal = ({
  open,
  value,
  onChange,
  onRequestClose,
  max,
  intervalTypes = ['MINUTE', 'HOUR', 'DAY', 'WEEK']
}: ActionSelectorModalProps) => {
  const [newNumIntervals, setNewNumIntervals] = useState<number | null>(null);
  const [newIntervalType, setNewIntervalType] = useState<IntervalType | null>(
    null
  );

  const { t } = useTranslation();
  const timeDeltaStringToReadableString = useTimeDeltaStringToReadableString();

  const resetVals = () => {
    setNewNumIntervals(null);
    setNewIntervalType(null);
  };
  return (
    <Modal
      visible={open}
      onRequestClose={onRequestClose}
      boxStyle={modalStyles.container}
    >
      <TransparentView style={modalStyles.container}>
        {value.map((timedeltaObj, i) => (
          <TransparentView key={i} style={modalStyles.exisitingValueRow}>
            <Text>
              {timeDeltaStringToReadableString(timedeltaObj.timedelta)}
            </Text>
            <SafePressable
              onPress={() => {
                onChange(
                  value.filter((valueAction) => valueAction !== timedeltaObj)
                );
              }}
            >
              <Feather
                name="delete"
                color={'red'}
                size={25}
                style={modalStyles.deleteActionCross}
              />
            </SafePressable>
          </TransparentView>
        ))}
        {(!max || value.length < max) && (
          <TransparentView style={modalStyles.selectionRow}>
            <TransparentView style={modalStyles.dropdownContainer}>
              <NumberSelector
                value={newNumIntervals}
                onChange={setNewNumIntervals}
              />
            </TransparentView>
            <TransparentView style={modalStyles.dropdownContainer}>
              <TimeIntervalSelector
                value={newIntervalType}
                onChange={setNewIntervalType}
                intervalTypes={intervalTypes}
              />
            </TransparentView>
            <Button
              onPress={() => {
                if (newNumIntervals) {
                  if (newIntervalType === 'MINUTE') {
                    onChange([
                      ...value,
                      {
                        timedelta: `0 00:${newNumIntervals
                          .toString()
                          .padStart(2, '0')}:00`
                      }
                    ]);
                    resetVals();
                  } else if (newIntervalType === 'HOUR') {
                    const numDays = Math.floor(newNumIntervals / 24);
                    const numHours = newNumIntervals - 24 * numDays;

                    onChange([
                      ...value,
                      {
                        timedelta: `${numDays
                          .toString()
                          .padStart(2, '0')} ${numHours
                          .toString()
                          .padStart(2, '0')}:00:00`
                      }
                    ]);
                    resetVals();
                  } else if (newIntervalType === 'DAY') {
                    onChange([
                      ...value,
                      {
                        timedelta: `${newNumIntervals} 00:00:00`
                      }
                    ]);
                    resetVals();
                  } else if (newIntervalType === 'WEEK') {
                    onChange([
                      ...value,
                      {
                        timedelta: `${7 * newNumIntervals} 00:00:00`
                      }
                    ]);
                    resetVals();
                  }
                }
              }}
              title={t('common.add')}
              style={modalStyles.addButton}
            />
          </TransparentView>
        )}
      </TransparentView>
      <TransparentView style={modalStyles.buttonWrapper}>
        <Button title={t('common.finish')} onPress={onRequestClose} />
      </TransparentView>
    </Modal>
  );
};

export default function TimedeltaSelector({
  value,
  onChange,
  max,
  placeholder,
  intervalTypes = ['MINUTE', 'HOUR', 'DAY', 'WEEK'],
  open,
  setOpen
}: {
  value: TimeDeltaObject[];
  onChange: (actions: TimeDeltaObject[]) => void;
  max?: number;
  placeholder?: string;
  intervalTypes?: IntervalType[];
  open: boolean;
  setOpen: (val: boolean) => void;
}) {
  const timeDeltaStringToReadableString = useTimeDeltaStringToReadableString();

  return (
    <TransparentView>
      <SafePressable onPress={() => setOpen(true)}>
        {value.length > 0 ? (
          <TransparentView>
            {value.map((timedeltaObj, i) => {
              return (
                <Text key={i}>
                  {timeDeltaStringToReadableString(timedeltaObj.timedelta)}
                </Text>
              );
            })}
          </TransparentView>
        ) : (
          <Text>{placeholder || 'ADD TIMEDELTAS'}</Text>
        )}
      </SafePressable>
      <TimedeltaSelectorModal
        open={open}
        onRequestClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        max={max}
        intervalTypes={intervalTypes}
      />
    </TransparentView>
  );
}
