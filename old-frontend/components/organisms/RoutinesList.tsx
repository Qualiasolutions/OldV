import Checkbox from 'components/molecules/Checkbox';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { Text, TextInput } from 'components/Themed';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import {
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useGetAllRoutinesQuery,
  useUpdateRoutineMutation
} from 'reduxStore/services/api/routines';
import { selectRoutineById } from 'reduxStore/slices/routines/selectors';
import DateTimeTextInput from 'components/forms/components/DateTimeTextInput';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/molecules/ButtonComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import FamilySelector from 'components/forms/components/FamilySelector';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';

const routineCardStyles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    marginBottom: 10
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  checkboxPair: { marginRight: 15 },
  times: { marginTop: 10, flexDirection: 'row' },
  members: { marginTop: 20 },
  membersLabel: { fontSize: 16 },
  buttons: {
    flexDirection: 'row',
    marginTop: 20
  },
  button: {
    marginRight: 10
  },
  endTime: {
    marginLeft: 10
  }
});

const RoutineCard = ({ id }: { id?: number }) => {
  const { t } = useTranslation();
  const routine = useSelector(selectRoutineById(id || -1));
  const [updateRoutine, updateResult] = useUpdateRoutineMutation();
  const [deleteRoutine] = useDeleteRoutineMutation();
  const [createRoutine, createResult] = useCreateRoutineMutation();
  const { data: userDetails } = useGetUserFullDetails();

  const [newName, setNewName] = useState(routine?.name || '');

  const [newMonday, setNewMonday] = useState(routine?.monday || false);
  const [newTuesday, setNewTuesday] = useState(routine?.tuesday || false);
  const [newWednesday, setNewWednesday] = useState(routine?.wednesday || false);
  const [newThursday, setNewThursday] = useState(routine?.thursday || false);
  const [newFriday, setNewFriday] = useState(routine?.friday || false);
  const [newSaturday, setNewSaturday] = useState(routine?.saturday || false);
  const [newSunday, setNewSunday] = useState(routine?.sunday || false);

  const [newStartTime, setNewStartTime] = useState(routine?.start_time || '');
  const [newEndTime, setNewEndTime] = useState(routine?.end_time || '');

  const [newMembers, setNewMembers] = useState(routine?.members || []);

  const resetValues = useCallback(() => {
    setNewName('');
    setNewMonday(false);
    setNewTuesday(false);
    setNewWednesday(false);
    setNewThursday(false);
    setNewFriday(false);
    setNewSaturday(false);
    setNewSunday(false);
    setNewStartTime('');
    setNewEndTime('');
    setNewMembers([]);
  }, []);

  const updateDisabled =
    routine &&
    newName === routine.name &&
    JSON.stringify(newMembers) === JSON.stringify(routine.members) &&
    newStartTime === routine.start_time &&
    newEndTime === routine.end_time &&
    newMonday === routine.monday &&
    newTuesday === routine.tuesday &&
    newWednesday === routine.wednesday &&
    newThursday === routine.thursday &&
    newFriday === routine.friday &&
    newSaturday === routine.saturday &&
    newSunday === routine.sunday;

  const createDisabled =
    !routine &&
    (newMembers.length === 0 ||
      !newStartTime ||
      !newEndTime ||
      !newName ||
      (!newMonday &&
        !newTuesday &&
        !newWednesday &&
        !newThursday &&
        !newFriday &&
        !newSaturday &&
        !newSunday));

  return (
    <>
      <WhiteBox style={routineCardStyles.card}>
        <TextInput
          style={routineCardStyles.title}
          value={newName}
          onChangeText={setNewName}
        />
        <TransparentView style={routineCardStyles.checkboxContainer}>
          <Checkbox
            checked={newMonday}
            onValueChange={async (val) => setNewMonday(!val)}
            label="Mo"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
          <Checkbox
            checked={newTuesday}
            onValueChange={async (val) => setNewTuesday(!val)}
            label="Tu"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
          <Checkbox
            checked={newWednesday}
            onValueChange={async (val) => setNewWednesday(!val)}
            label="We"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
          <Checkbox
            checked={newThursday}
            onValueChange={async (val) => setNewThursday(!val)}
            label="Th"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
          <Checkbox
            checked={newFriday}
            onValueChange={async (val) => setNewFriday(!val)}
            label="Fr"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
          <Checkbox
            checked={newSaturday}
            onValueChange={async (val) => setNewSaturday(!val)}
            label="Sa"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
          <Checkbox
            checked={newSunday}
            onValueChange={async (val) => setNewSunday(!val)}
            label="Su"
            wrapperStyle={routineCardStyles.checkboxPair}
          />
        </TransparentView>
        <TransparentView style={routineCardStyles.times}>
          <TransparentView>
            <Text>{t('common.start')}</Text>
            <DateTimeTextInput
              value={dayjs(`2000-01-01T${newStartTime}`).toDate()}
              onValueChange={(newValue: Date) => {
                setNewStartTime(dayjs(newValue).format('HH:mm'));
              }}
              mode="time"
            />
          </TransparentView>
          <TransparentView style={routineCardStyles.endTime}>
            <Text>{t('common.end')}</Text>
            <DateTimeTextInput
              value={dayjs(`2000-01-01T${newEndTime}`).toDate()}
              onValueChange={(newValue: Date) => {
                const newEndTimeToSet = dayjs(newValue).format('HH:mm');
                if (newEndTimeToSet > newStartTime) {
                  setNewEndTime(newEndTimeToSet);
                }
              }}
              mode="time"
            />
          </TransparentView>
        </TransparentView>
        <TransparentView style={routineCardStyles.members}>
          <Text style={routineCardStyles.membersLabel}>
            {t('common.members')}
          </Text>
          <FamilySelector
            data={userDetails?.family?.users || []}
            values={newMembers || []}
            onValueChange={(selectedMembers) => {
              setNewMembers(selectedMembers);
            }}
            inline={true}
          />
        </TransparentView>
        {createResult.isLoading || updateResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <TransparentView style={routineCardStyles.buttons}>
            <Button
              title={routine ? t('common.update') : t('common.create')}
              disabled={updateDisabled || createDisabled}
              onPress={async () => {
                try {
                  const routineBody = {
                    name: newName,
                    monday: newMonday,
                    tuesday: newTuesday,
                    wednesday: newWednesday,
                    thursday: newThursday,
                    friday: newFriday,
                    saturday: newSaturday,
                    sunday: newSunday,
                    start_time: newStartTime,
                    end_time: newEndTime,
                    members: newMembers
                  };
                  if (routine) {
                    await updateRoutine({
                      ...routineBody,
                      id: routine.id
                    }).unwrap();
                  } else {
                    await createRoutine(routineBody).unwrap();
                    resetValues();
                  }
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              style={routineCardStyles.button}
            />
            {routine && (
              <Button
                title={t('common.delete')}
                onPress={() => {
                  try {
                    deleteRoutine({ id: routine.id });
                  } catch (err) {
                    Toast.show({
                      type: 'error',
                      text1: t('common.errors.generic')
                    });
                  }
                }}
                style={routineCardStyles.button}
              />
            )}
          </TransparentView>
        )}
      </WhiteBox>
    </>
  );
};

export default function RoutinesList() {
  const { data: allRoutines } = useGetAllRoutinesQuery();

  const routineCards = allRoutines?.ids.map((id) => (
    <RoutineCard id={id} key={id} />
  ));
  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView>
        {routineCards}
        <RoutineCard />
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
