import { useTranslation } from 'react-i18next';
import {
  useCreateBlockedCategoryMutation,
  useDeleteBlockedCategoryMutation,
  useGetBlockedCategoriesQuery
} from 'reduxStore/services/api/settings';

import { FullPageSpinner } from 'components/molecules/Spinners';
import { Table, TableWrapper, Row, Col } from 'react-native-table-component';
import { StyleSheet } from 'react-native';
import { Text } from 'components/Themed';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { AllBlockedCategories, BlockedCategoryType } from 'types/settings';
import Checkbox from 'components/molecules/Checkbox';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

const blockTypes: BlockedCategoryType[] = [
  'birthdays',
  'family-birthdays',
  'national-holidays',
  'term-time',
  'trips',
  'days-off'
];

const styles = StyleSheet.create({
  container: { width: '100%' },
  tableBorder: { borderWidth: 1 },
  tableContent: { flexDirection: 'row' },
  table: { margin: 20 },
  row: {},
  tableText: {
    textAlign: 'center',
    margin: 4
  },
  tableHeaderText: {
    fontWeight: 'bold'
  },
  checkboxWrapper: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  blurb: { paddingHorizontal: 20 }
});
export default function BlockedDayPreferencesScreen() {
  const { t } = useTranslation();
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const { data: userDetails, isLoading: isLoadingUserDetails } =
    useGetUserFullDetails();

  const blockedCategories: {
    [key: string]: { isLoading: boolean; data?: AllBlockedCategories };
  } = {};

  blockedCategories.birthdays = useGetBlockedCategoriesQuery('birthdays');
  blockedCategories['family-birthdays'] =
    useGetBlockedCategoriesQuery('family-birthdays');
  blockedCategories['national-holidays'] =
    useGetBlockedCategoriesQuery('national-holidays');
  blockedCategories['term-time'] = useGetBlockedCategoriesQuery('term-time');
  blockedCategories.trips = useGetBlockedCategoriesQuery('trips');
  blockedCategories['days-off'] = useGetBlockedCategoriesQuery('days-off');

  const [deleteBlockedCategory, deleteResult] =
    useDeleteBlockedCategoryMutation();
  const [createBlockedCategory, createResult] =
    useCreateBlockedCategoryMutation();

  const isLoading =
    isLoadingCategories ||
    isLoadingUserDetails ||
    !allCategories ||
    !userDetails ||
    Object.values(blockedCategories).some(
      (cats) => cats.isLoading || !cats.data
    );

  if (isLoading) {
    return <FullPageSpinner />;
  }

  const categoryIds = allCategories.ids;

  const rowHeight = 44;
  const headerHeight = 60;
  const colWidth = 100;
  const widthArray = [];
  for (let i = 1; i <= 7; i++) {
    widthArray.push(colWidth);
  }

  return (
    <>
      <Text style={styles.blurb}>
        {t('screens.blockedDayPreferences.blurb')}
      </Text>
      <TransparentFullPageScrollView style={styles.container} horizontal>
        <TransparentFullPageScrollView>
          <Table borderStyle={styles.tableBorder} style={styles.table}>
            <Row
              data={[
                '',
                t(`blockedCategories.names.birthdays`),
                t(`blockedCategories.names.family-birthdays`),
                t(`blockedCategories.names.national-holidays`),
                t(`blockedCategories.names.trips`),
                t(`blockedCategories.names.days-off`),
                t(`blockedCategories.names.term-time`)
              ]}
              style={StyleSheet.flatten([styles.row, { height: headerHeight }])}
              textStyle={StyleSheet.flatten([
                styles.tableText,
                styles.tableHeaderText
              ])}
              widthArr={widthArray}
            />
            <TableWrapper style={styles.tableContent}>
              <Col
                heightArr={categoryIds.map((id) => rowHeight)}
                data={categoryIds.map(
                  (id) => allCategories.byId[id].readable_name
                )}
                style={{ width: colWidth }}
                textStyle={StyleSheet.flatten([
                  styles.tableText,
                  styles.tableHeaderText
                ])}
              />
              {blockTypes.map((type) => {
                return (
                  <Col
                    heightArr={categoryIds.map((id) => rowHeight)}
                    style={{ width: colWidth }}
                    data={categoryIds.map((catId) => {
                      const configId = blockedCategories[
                        type
                      ].data?.ids?.filter((id) => {
                        return (
                          blockedCategories[type].data?.byId[id]?.category ===
                          catId
                        );
                      })[0];

                      return (
                        <TransparentView style={[styles.checkboxWrapper]}>
                          <Checkbox
                            checked={!!configId}
                            onValueChange={async () => {
                              if (configId) {
                                try {
                                  await deleteBlockedCategory({
                                    type,
                                    id: configId
                                  }).unwrap();
                                } catch (err) {
                                  Toast.show({
                                    type: 'error',
                                    text1: t('common.errors.generic')
                                  });
                                }
                              } else {
                                try {
                                  await createBlockedCategory({
                                    type,
                                    category: catId,
                                    user: userDetails.id
                                  }).unwrap();
                                } catch (err) {
                                  Toast.show({
                                    type: 'error',
                                    text1: t('common.errors.generic')
                                  });
                                }
                              }
                            }}
                          />
                        </TransparentView>
                      );
                    })}
                    textStyle={styles.tableText}
                  />
                );
              })}
            </TableWrapper>
          </Table>
        </TransparentFullPageScrollView>
      </TransparentFullPageScrollView>
    </>
  );
}
