import Checkbox from 'components/molecules/Checkbox';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useTranslation } from 'react-i18next';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import {
  useCreateFamilyCategoryViewPermissionMutation,
  useDeleteFamilyCategoryViewPermissionMutation,
  useGetAllFamilyCategoryViewPermissionsQuery
} from 'reduxStore/services/api/settings';
import { Category } from 'types/categories';

type CategoryToggleProps = {
  category: Category;
  checked: boolean;
  onChange: (value: boolean) => Promise<void>;
};
const CategoryToggle = ({
  category,
  checked,
  onChange
}: CategoryToggleProps) => {
  return (
    <TransparentView
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 10
      }}
    >
      <Text style={{ marginRight: 10, width: 100 }}>
        {category.readable_name}
      </Text>
      <Checkbox checked={checked} onValueChange={onChange} />
    </TransparentView>
  );
};

export default function WhatMyFamilySeesScreen() {
  const { data: userDetails } = useGetUserFullDetails();

  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const { data: familyViewPermissions, isLoading: isLoadingPermissions } =
    useGetAllFamilyCategoryViewPermissionsQuery();

  const [createFamilyCategoryViewPermission, createRes] =
    useCreateFamilyCategoryViewPermissionMutation();
  const [deleteFamilyCategoryViewPermission, deleteRes] =
    useDeleteFamilyCategoryViewPermissionMutation();

  const { t } = useTranslation();

  const isLoading =
    isLoadingCategories ||
    isLoadingPermissions ||
    !allCategories ||
    !familyViewPermissions ||
    !userDetails;

  if (isLoading) {
    return <FullPageSpinner />;
  }

  const permissionIds: { [key: number]: number } = {};
  for (const id of allCategories.ids) {
    const permissionObj = Object.values(familyViewPermissions.byId).find(
      (perm) => perm.category === id
    );
    if (permissionObj) {
      permissionIds[id] = permissionObj.id;
    }
  }

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView style={{ alignItems: 'center' }}>
        <Text>{t('screens.whatMyFamilySees.blurb')}</Text>
        <TransparentView style={{ marginTop: 20 }}>
          {allCategories.ids.map((id) => (
            <CategoryToggle
              key={id}
              category={allCategories.byId[id]}
              checked={!!permissionIds[id]}
              onChange={async (value) => {
                if (!value) {
                  createFamilyCategoryViewPermission({
                    category: id,
                    user: userDetails.id
                  });
                } else {
                  deleteFamilyCategoryViewPermission({ id: permissionIds[id] });
                }
              }}
            />
          ))}
        </TransparentView>
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
