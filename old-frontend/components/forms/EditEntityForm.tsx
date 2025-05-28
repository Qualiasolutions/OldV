import { useThemeColor } from 'components/Themed';
import { useNavigation } from '@react-navigation/native';

import {
  useDeleteEntityMutation,
  useFormUpdateEntityMutation
} from 'reduxStore/services/api/entities';
import { TransparentView } from 'components/molecules/ViewComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { fieldColorMapping } from './utils/fieldColorMapping';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import useForm from './entityFormFieldTypes/useForm';
import { StyleSheet, ViewStyle } from 'react-native';
import useEntityById from 'hooks/entities/useEntityById';
import TypedForm from './TypedForm';
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'components/molecules/ButtonComponents';
import { t } from 'i18next';
import { parseFormDataFormValues } from './utils/parseFormValues';
import hasAllRequired from './utils/hasAllRequired';
import { YesNoModal } from 'components/molecules/Modals';
import createInitialObject from './utils/createInitialObject';
import useGetUserFullDetails from 'hooks/useGetUserDetails';

const styles = StyleSheet.create({
  bottomButtons: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 50,
    zIndex: -1,
    justifyContent: 'center'
  },
  button: {
    width: '50%',
    marginHorizontal: 5
  }
});
export default function EditEntityForm({
  entityId,
  style,
  onSubmitSuccess
}: {
  entityId: number;
  style?: ViewStyle;
  onSubmitSuccess?: () => void;
}) {
  const navigation = useNavigation();
  const entityToEdit = useEntityById(entityId);
  const { data: userDetails } = useGetUserFullDetails();
  const formFields = useForm(entityToEdit?.resourcetype || 'Car', true); // Could use any default entity type here
  const [formValues, setFormValues] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fieldColor = useThemeColor(
    {},
    entityToEdit
      ? fieldColorMapping[entityToEdit.resourcetype] ||
          fieldColorMapping.default
      : fieldColorMapping.default
  );

  const flatFields = useMemo(() => {
    return Array.isArray(formFields)
      ? formFields.reduce((a, b) => ({ ...a, ...b }))
      : formFields;
  }, [formFields]);

  const hasRequired = useMemo(() => {
    return hasAllRequired(formValues, flatFields);
  }, [flatFields, formValues]);

  useEffect(() => {
    if (entityToEdit) {
      const initialValues = createInitialObject(
        flatFields,
        userDetails || undefined,
        entityToEdit
      );
      setFormValues(initialValues);
    }
  }, [entityToEdit, flatFields, userDetails]);

  const [updateEntity, updateEntityResult] = useFormUpdateEntityMutation();
  const [deleteEntity, deleteEntityResult] = useDeleteEntityMutation();

  const isSubmitting =
    updateEntityResult.isLoading || deleteEntityResult.isLoading;

  if (!entityToEdit || !entityId) {
    return <FullPageSpinner />;
  }

  if (entityToEdit) {
    return (
      <TransparentView style={style || {}}>
        <TypedForm
          fields={formFields}
          formValues={formValues}
          onFormValuesChange={setFormValues}
          fieldColor={fieldColor}
          inlineFields={true}
        />
        {isSubmitting ? (
          <PaddedSpinner />
        ) : (
          <TransparentView style={styles.bottomButtons}>
            <Button
              title={t('common.update')}
              onPress={async () => {
                const updateBody = parseFormDataFormValues(
                  formValues,
                  flatFields
                );
                try {
                  await updateEntity({
                    formData: updateBody,
                    id: entityId
                  }).unwrap();
                  Toast.show({
                    type: 'success',
                    text1: `Succesfully updated ${entityToEdit.name}`
                  });
                  if (onSubmitSuccess) {
                    onSubmitSuccess();
                  }
                } catch {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              disabled={isSubmitting || !hasRequired}
              style={styles.button}
            />
            <Button
              title={t('common.delete')}
              onPress={() => {
                setShowDeleteModal(true);
              }}
              disabled={isSubmitting}
              style={styles.button}
            />
          </TransparentView>
        )}

        <YesNoModal
          title="Before you proceed"
          question={'Are you sure you want to delete?'}
          visible={showDeleteModal}
          onYes={async () => {
            try {
              setShowDeleteModal(false);
              await deleteEntity({ id: entityId }).unwrap();

              Toast.show({
                type: 'success',
                text1: 'Succesfully deleted entity'
              });
              navigation.goBack();
            } catch {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }}
          onNo={() => {
            setShowDeleteModal(false);
          }}
        />
      </TransparentView>
    );
  }
  return null;
}
