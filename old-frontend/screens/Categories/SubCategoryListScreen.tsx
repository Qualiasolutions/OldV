import LinkList, { LinkListLink } from 'components/lists/LinkList';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import useColouredHeader from 'headers/hooks/useColouredHeader';
import { useTranslation } from 'react-i18next';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import { ContentTabScreenProps } from 'types/base';

type SubCategoryListScreenProps = ContentTabScreenProps<'SubCategoryList'>;

export default function SubCategoryListScreen({
  route
}: SubCategoryListScreenProps) {
  const categoryIds = route.params.categoryIds;
  const { data: categories, isLoading } = useGetAllCategoriesQuery();
  const { t } = useTranslation();

  const title = categoryIds
    .map((categoryId) => t(`categories.${categories?.byId[categoryId].name}`))
    .join(', ');

  useColouredHeader('', '', title);

  if (isLoading || !categories) {
    return null;
  }

  const linkList: LinkListLink[] = categoryIds.map((categoryId) => ({
    name: categories?.byId[categoryId].name,
    toScreen: 'CategoryList',
    navMethod: 'push',
    toScreenParams: { categoryId }
  }));

  return (
    <TransparentFullPageScrollView>
      <TransparentView style={{ paddingBottom: 100 }}>
        <LinkList links={linkList} />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
