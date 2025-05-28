import React, { useEffect, useMemo, useState } from 'react';
import { useThemeColor } from 'components/Themed';
import { useNavigation } from '@react-navigation/native';
import { useFormCreateEntityMutation } from 'reduxStore/services/api/entities';
import { useTranslation } from 'react-i18next';
import { EntityTypeName } from 'types/entities';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { fieldColorMapping } from './utils/fieldColorMapping';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import useForm from './entityFormFieldTypes/useForm';
import TypedForm from './TypedForm';
import { FieldValueTypes } from './types';
import { Button } from 'components/molecules/ButtonComponents';
import { parseFormDataFormValues } from './utils/parseFormValues';
import createInitialObject from './utils/createInitialObject';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import hasAllRequired from './utils/hasAllRequired';
import { PaddedSpinner } from 'components/molecules/Spinners';

export default function AddEntityForm({
  entityType,
  defaults
}: {
  entityType: EntityTypeName;
  defaults?: { [key: string]: any };
}) {
  const navigation = useNavigation();

  const entityForm = useForm(entityType, false);
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState<FieldValueTypes>({});
  const [formCreateEntity, formCreateEntityResult] =
    useFormCreateEntityMutation();
  const { data: userDetails } = useGetUserFullDetails();

  const flatFields = useMemo(() => {
    return Array.isArray(entityForm)
      ? entityForm.reduce((a, b) => ({ ...a, ...b }))
      : entityForm;
  }, [entityForm]);

  const fieldColor = useThemeColor(
    {},
    fieldColorMapping[entityType] || fieldColorMapping.default
  );

  useEffect(() => {
    if (userDetails && !formCreateEntityResult.isLoading) {
      const initialValues = createInitialObject(
        flatFields,
        userDetails,
        defaults || {}
      );
      setFormValues(initialValues);
    }
  }, [flatFields, userDetails, formCreateEntityResult, defaults]);

  const allRequired = hasAllRequired(formValues, flatFields);

  return (
    <TransparentView>
      <TypedForm
        fields={entityForm || {}}
        formValues={formValues}
        onFormValuesChange={setFormValues}
        fieldColor={fieldColor}
        inlineFields={true}
      />
      <TransparentPaddedView>
        {formCreateEntityResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <Button
            title={t('common.create')}
            onPress={async () => {
              try {
                const parsedFormData = parseFormDataFormValues(
                  formValues,
                  flatFields
                );
                parsedFormData.append('resourcetype', entityType);

                await formCreateEntity({
                  formData: parsedFormData
                }).unwrap();

                Toast.show({
                  type: 'success',
                  text1: t('screens.addEntity.createSuccess', {
                    entityType: t(`entityResourceTypeNames.${entityType}`)
                  })
                });
                navigation.goBack();
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
            disabled={!allRequired}
          />
        )}
      </TransparentPaddedView>
    </TransparentView>
  );
}
