import { useTranslation } from 'react-i18next';
import {
  useCreatePreferredDaysMutation,
  useGetAllPreferredDaysQuery,
  useUpdatePreferredDaysMutation
} from 'reduxStore/services/api/settings';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { Table, TableWrapper, Row, Col } from 'react-native-table-component';
import { StyleSheet } from 'react-native';
import { Modal } from 'components/molecules/Modals';
import { Text } from 'components/Themed';
import { useEffect, useState } from 'react';
import { Button } from 'components/molecules/ButtonComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { PreferredDaysDays } from 'types/settings';
import { capitalize } from 'lodash';
import Checkbox from 'components/molecules/Checkbox';
import SafePressable from 'components/molecules/SafePressable';
import { DayType } from 'types/datesAndTimes';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

const styles = StyleSheet.create({
  tableText: {
    textAlign: 'center',
    margin: 4
  },
  tableHeaderText: {
    fontWeight: 'bold'
  }
});

const DAYS: DayType[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const DEFAULT_PREFERENCES = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false
};

type EditTaskLimitModalProps = {
  categoryId: number;
  visible: boolean;
  onRequestClose: () => void;
};
const EditPreferredDaysModal = ({
  categoryId,
  visible,
  onRequestClose
}: EditTaskLimitModalProps) => {
  const { data: preferredDays, isLoading: isLoadingPreferredDays } =
    useGetAllPreferredDaysQuery();

  const { t } = useTranslation();

  const [updatePreferredDays, updateResult] = useUpdatePreferredDaysMutation();
  const [createPreferredDays, createResult] = useCreatePreferredDaysMutation();
  const { data: userDetails } = useGetUserFullDetails();

  const [newPreferences, setNewPreferences] = useState<PreferredDaysDays>({
    ...DEFAULT_PREFERENCES
  });
  const [preferencesToUpdate, setPreferencesToUpdate] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (preferredDays) {
      const preferencesToEdit = Object.values(preferredDays.byId).find(
        (conf) => conf.category === categoryId
      );
      if (preferencesToEdit) {
        setNewPreferences({
          ...preferencesToEdit
        });
        setPreferencesToUpdate(preferencesToEdit.id);
      } else {
        setPreferencesToUpdate(null);
        setNewPreferences({ ...DEFAULT_PREFERENCES });
      }
    }
  }, [categoryId, preferredDays]);

  const isLoading = isLoadingPreferredDays || !preferredDays || !userDetails;
  if (isLoading) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      style={{ width: '100%' }}
    >
      <TransparentView
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: '80%',
          marginBottom: 20
        }}
      >
        {DAYS.map((day) => (
          <TransparentView style={{ marginHorizontal: 10 }} key={day}>
            <Text>{capitalize(day).slice(0, 2)}</Text>
            <Checkbox
              checked={newPreferences[day]}
              onValueChange={async (value) => {
                setNewPreferences({
                  ...newPreferences,
                  [day]: !value
                });
              }}
            />
          </TransparentView>
        ))}
      </TransparentView>
      <Button
        title={t('common.update')}
        onPress={() => {
          if (!preferencesToUpdate) {
            createPreferredDays({
              category: categoryId,
              user: userDetails.id,
              ...newPreferences
            })
              .unwrap()
              .then(() => {
                onRequestClose();
              })
              .catch(() => {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              });
          } else {
            updatePreferredDays({
              id: preferencesToUpdate,
              category: categoryId,
              user: userDetails.id,
              ...newPreferences
            })
              .unwrap()
              .then(() => {
                onRequestClose();
              })
              .catch(() => {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              });
          }
        }}
      />
    </Modal>
  );
};

export default function PreferredDayPreferencesScreen() {
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const { data: allPreferredDays, isLoading: isLoadingPreferredDays } =
    useGetAllPreferredDaysQuery();

  const [categoryToEdit, setCategoryToEdit] = useState<null | number>(null);

  const isLoading =
    isLoadingCategories ||
    isLoadingPreferredDays ||
    !allCategories ||
    !allPreferredDays;

  if (isLoading) {
    return <FullPageSpinner />;
  }

  const categoryIds = allCategories.ids;

  const PreferencesPressable = ({
    categoryId,
    text
  }: {
    categoryId: number;
    text: string;
  }) => {
    return (
      <SafePressable onPress={() => setCategoryToEdit(categoryId)}>
        <Text style={styles.tableText}>{text}</Text>
      </SafePressable>
    );
  };

  const preferenceCells: { [key: number]: React.ReactNode } = {};
  for (const id of categoryIds) {
    const categoryPreferredDays = Object.values(allPreferredDays.byId).find(
      (preferences) => preferences.category === id
    );

    if (categoryPreferredDays) {
      preferenceCells[id] = (
        <PreferencesPressable
          categoryId={id}
          text={DAYS.filter((day) => categoryPreferredDays[day])
            .map((day) => capitalize(day).slice(0, 2))
            .join(', ')}
        />
      );
    } else {
      preferenceCells[id] = <PreferencesPressable categoryId={id} text="-" />;
    }
  }

  const rowHeight = 44;
  const headerHeight = 60;

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView style={{ flex: 1 }}>
        <Table borderStyle={{ borderWidth: 1 }}>
          <Row
            data={['', 'Preferred days']}
            style={{ width: '100%', height: headerHeight }}
            textStyle={StyleSheet.flatten([
              styles.tableText,
              styles.tableHeaderText
            ])}
          />
          <TableWrapper style={{ flexDirection: 'row' }}>
            <Col
              heightArr={categoryIds.map((id) => rowHeight)}
              data={categoryIds.map(
                (id) => allCategories.byId[id].readable_name
              )}
              textStyle={StyleSheet.flatten([
                styles.tableText,
                styles.tableHeaderText
              ])}
            />
            <Col
              heightArr={categoryIds.map((id) => rowHeight)}
              data={categoryIds.map((id) => preferenceCells[id])}
              textStyle={styles.tableText}
            />
          </TableWrapper>
        </Table>
        <EditPreferredDaysModal
          visible={!!categoryToEdit}
          categoryId={categoryToEdit || 0}
          onRequestClose={() => setCategoryToEdit(null)}
        />
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
