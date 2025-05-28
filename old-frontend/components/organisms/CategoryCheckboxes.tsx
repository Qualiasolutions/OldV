import CheckboxesList from 'components/molecules/CheckboxesList';
import { useTranslation } from 'react-i18next';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

export default function CategoryCheckboxes({
  value,
  onChange
}: {
  value: number[];
  onChange: (newValue: number[]) => void;
}) {
  const { t } = useTranslation();
  const { data: allCategories } = useGetAllCategoriesQuery();

  if (!allCategories) {
    return null;
  }

  const checkboxOptions = allCategories?.ids.map((id) => {
    return {
      value: id,
      label: t(`categories.${allCategories.byId[id].name}`),
      checked: value.includes(id)
    };
  });

  return (
    <CheckboxesList
      options={[
        {
          label: t('common.selectAll'),
          value: 'ALL',
          checked: value.length === allCategories?.ids.length
        },
        ...checkboxOptions
      ]}
      onToggleItem={(categoryId) => {
        if (categoryId === 'ALL') {
          if (value.length === allCategories?.ids.length) {
            onChange([]);
          } else {
            onChange(allCategories.ids);
          }
        } else {
          if (value.includes(categoryId)) {
            onChange(value.filter((id) => id !== categoryId));
          } else {
            onChange([...value, categoryId]);
          }
        }
      }}
    />
  );
}
