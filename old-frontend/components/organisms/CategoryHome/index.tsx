import React from 'react';
import { ContentTabParamList } from 'types/base';
import { FullPageSpinner } from 'components/molecules/Spinners';
import linkConfig from './subCategories';
import LinkList from '../../lists/LinkList';
import { TransparentView } from 'components/molecules/ViewComponents';
import ListButton from 'components/molecules/ListButton';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

const styles = StyleSheet.create({
  button: {
    marginTop: 10
  }
});

const CategoryPreferences = ({ categoryId }: { categoryId: number }) => {
  const { data: allCategories, isLoading, error } = useGetAllCategoriesQuery();
  const categoryData = allCategories?.byId[categoryId];

  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<ContentTabParamList>>();

  return (
    <TransparentView>
      <ListButton
        text={t('screens.categoryList.categoryPreferences', {
          category: categoryData?.readable_name
        })}
        onPress={() => {
          navigation.navigate('CategoryPreferences', { categoryId });
        }}
        style={StyleSheet.flatten([styles.button])}
      />
    </TransparentView>
  );
};

export default function CategoryHome({ categoryId }: { categoryId: number }) {
  const { data: allCategories, isLoading, error } = useGetAllCategoriesQuery();
  const categoryData = allCategories?.byId[categoryId];

  if (!categoryData) {
    return <FullPageSpinner />;
  }

  const BOTTOM_PADDING = 100;
  return (
    <TransparentFullPageScrollView>
      <TransparentView style={{ paddingBottom: BOTTOM_PADDING }}>
        <LinkList links={linkConfig[categoryData.name]} />
        <CategoryPreferences categoryId={categoryId} />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
