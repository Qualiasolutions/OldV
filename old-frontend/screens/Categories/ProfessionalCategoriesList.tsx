import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SmallButton } from 'components/molecules/ButtonComponents';
import { Modal, YesNoModal } from 'components/molecules/Modals';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { PrimaryText } from 'components/molecules/TextComponents';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { Text, TextInput, useThemeColor } from 'components/Themed';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useSelector } from 'react-redux';
import {
  useCreateProfessionalCategoryMutation,
  useDeleteProfessionalCategoryMutation,
  useGetAllProfessionalCategoriesQuery,
  useUpdateProfessionalCategoryMutation
} from 'reduxStore/services/api/categories';
import { selectEntitiesByProfessionalCategory } from 'reduxStore/slices/entities/selectors';
import { ContentTabParamList } from 'types/base';
import { ProfessionalCategory } from 'types/categories';

const styles = StyleSheet.create({
  innerWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  newCategoryNameInput: {
    marginVertical: 10
  },
  categoryLink: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%'
  },
  actionButton: {
    marginLeft: 16
  },
  editNameInput: { minHeight: 24, paddingHorizontal: 5, flexShrink: 1 },
  editingNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%'
  }
});

const CreateCategoryButton = () => {
  const { t } = useTranslation();
  const primaryColor = useThemeColor({}, 'primary');
  const [createCategory, createCategoryResult] =
    useCreateProfessionalCategoryMutation();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const { data: userDetails } = useGetUserFullDetails();

  if (!userDetails) {
    return null;
  }

  return (
    <>
      <WhiteBox>
        <TouchableOpacity
          onPress={() => {
            setShowModal(true);
          }}
        >
          <Feather name="plus" size={36} color={primaryColor} />
        </TouchableOpacity>
      </WhiteBox>
      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Text>{t('components.professionalCategories.addCategoryBlurb')}</Text>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder={t('common.name')}
          style={styles.newCategoryNameInput}
        />
        {createCategoryResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <SmallButton
            title={t('common.save')}
            onPress={async () => {
              try {
                await createCategory({
                  name: newName,
                  user: userDetails.id
                });
                setNewName('');
                setShowModal(false);
              } catch {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
          />
        )}
      </Modal>
    </>
  );
};

const CategoryLink = ({
  category
}: {
  category: ProfessionalCategory | null;
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<ContentTabParamList>>();
  const [editingName, setEditingName] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [newName, setNewName] = useState(category?.name);
  const [updateCategory, updateCategoryResult] =
    useUpdateProfessionalCategoryMutation();
  const [deleteCategory, deleteCategoryResult] =
    useDeleteProfessionalCategoryMutation();

  return (
    <>
      <WhiteBox style={styles.categoryLink}>
        {editingName && category ? (
          <TransparentView style={styles.editingNameContainer}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              autoFocus={true}
              onBlur={() => {
                // Set a timeout because otherwise the update is sometimes not processed
                setTimeout(() => {
                  setEditingName(false);
                  setNewName(category.name);
                }, 100);
              }}
              style={styles.editNameInput}
              multiline
            />
            <TouchableOpacity
              onPress={() => {
                setEditingName(false);
              }}
              style={styles.actionButton}
            >
              <Feather name="x" size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (updateCategoryResult.isLoading) {
                  return;
                }

                try {
                  setEditingName(false);
                  await updateCategory({
                    id: category.id,
                    name: newName
                  }).unwrap();
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              style={styles.actionButton}
            >
              <Feather name="check" size={24} color="green" />
            </TouchableOpacity>
          </TransparentView>
        ) : (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ProfessionalCategory', {
                categoryId: category?.id || null
              });
            }}
          >
            <PrimaryText
              text={category?.name || t('common.uncategorised')}
              bold
            />
          </TouchableOpacity>
        )}
        {category && !editingName && (
          <>
            <TouchableOpacity
              onPress={() => {
                setEditingName(true);
              }}
              style={styles.actionButton}
            >
              <Feather name="edit" size={24} color="orange" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setDeletingCategory(true);
              }}
              style={styles.actionButton}
            >
              <Feather name="trash" size={24} color="red" />
            </TouchableOpacity>
          </>
        )}
      </WhiteBox>
      {category && (
        <YesNoModal
          visible={deletingCategory}
          question={t(
            'components.professionalCategories.deleteCategoryQuestion'
          )}
          onNo={() => setDeletingCategory(false)}
          onYes={async () => {
            if (!deleteCategoryResult.isLoading) {
              try {
                await deleteCategory(category.id).unwrap();
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }
          }}
        />
      )}
    </>
  );
};

export default function ProfessionalCategoriesList() {
  const { data: categories, isLoading: isLoadingCategories } =
    useGetAllProfessionalCategoriesQuery();

  const uncategorisedEntities = useSelector(
    selectEntitiesByProfessionalCategory(null)
  );

  if (isLoadingCategories || !categories) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView style={styles.innerWrapper}>
        {categories.ids.map((categoryId) => {
          const category = categories?.byId[categoryId];
          return <CategoryLink key={category.id} category={category} />;
        })}
        {uncategorisedEntities.length > 0 && <CategoryLink category={null} />}
        <CreateCategoryButton />
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
