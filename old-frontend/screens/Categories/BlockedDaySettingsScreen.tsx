import Checkbox from 'components/molecules/Checkbox';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import useEntityTypeHeader from 'headers/hooks/useEntityTypeHeader';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import {
  useCreateBlockedCategoryMutation,
  useDeleteBlockedCategoryMutation,
  useGetBlockedCategoriesQuery
} from 'reduxStore/services/api/settings';
import { ContentTabScreenProps } from 'types/base';
import { BlockedCategoryType } from 'types/settings';

type BlockedDaysSettingsScreenProps =
  ContentTabScreenProps<'BlockedDaysSettings'>;

const styles = StyleSheet.create({
  checkboxListContainer: { marginBottom: 30 },
  checkboxListHeader: { fontSize: 20, marginBottom: 10 },
  checkboxPair: {
    flexDirection: 'row',
    marginRight: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200
  },
  checkbox: { marginLeft: 10 },
  noOptionsText: {
    padding: 20
  }
});

const BlockTypeSelector = ({ type }: { type: BlockedCategoryType }) => {
  const { t } = useTranslation();
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const { data: userDetails, isLoading: isLoadingUserDetails } =
    useGetUserFullDetails();

  const { data: blockedCategories, isLoading: isLoadingBlockedCategories } =
    useGetBlockedCategoriesQuery(type);

  const [deleteBlockedCategory, deleteResult] =
    useDeleteBlockedCategoryMutation();
  const [createBlockedCategory, createResult] =
    useCreateBlockedCategoryMutation();

  const isLoading =
    isLoadingBlockedCategories ||
    !blockedCategories ||
    isLoadingCategories ||
    !allCategories ||
    isLoadingUserDetails ||
    !userDetails;
  if (isLoading) {
    return null;
  }

  return (
    <TransparentPaddedView>
      <Text style={styles.checkboxListHeader}>
        {t(`blockedCategories.instructions.${type}`)}:
      </Text>
      <TransparentView style={styles.checkboxListContainer}>
        {allCategories.ids.map((catId) => {
          const configId = blockedCategories.ids.filter((id) => {
            return blockedCategories.byId[id].category === catId;
          })[0];
          return (
            <TransparentView key={catId} style={styles.checkboxPair}>
              <Text>{t(`categories.${allCategories.byId[catId].name}`)}</Text>
              <Checkbox
                style={styles.checkbox}
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
      </TransparentView>
    </TransparentPaddedView>
  );
};

const TYPE_MAPPINGS: { [key: string]: BlockedCategoryType[] } = {
  SOCIAL_INTERESTS: ['birthdays', 'family-birthdays', 'national-holidays'],
  EDUCATION: ['term-time'],
  CAREER: ['days-off'],
  TRAVEL: ['trips']
};

export default function BlockedDaysSettingsScreen({
  route,
  navigation
}: BlockedDaysSettingsScreenProps) {
  const { t } = useTranslation();
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const categoryData = allCategories?.byId[route.params.categoryId];

  useEntityTypeHeader(categoryData?.name || '');

  const isLoading = isLoadingCategories || !categoryData || !allCategories;

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!TYPE_MAPPINGS[categoryData.name]) {
    return (
      <Text style={styles.noOptionsText}>
        {t('screens.blockedDayPreferences.noOptionsBlurb')}
      </Text>
    );
  } else {
    const selectors = TYPE_MAPPINGS[categoryData.name].map((typeName) => (
      <BlockTypeSelector type={typeName} key={typeName} />
    ));

    return (
      <TransparentFullPageScrollView>{selectors}</TransparentFullPageScrollView>
    );
  }
}
