import { Feather } from '@expo/vector-icons';
import TypedForm from 'components/forms/TypedForm';
import { FieldValueTypes } from 'components/forms/types';
import createInitialObject from 'components/forms/utils/createInitialObject';
import hasAllRequired from 'components/forms/utils/hasAllRequired';
import parseFormValues from 'components/forms/utils/parseFormValues';
import { Button } from 'components/molecules/ButtonComponents';
import { Modal, YesNoModal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import {
  TransparentFullPageScrollView,
  TransparentScrollView
} from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, ViewStyle } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import {
  useCreateSchoolBreakMutation,
  useCreateSchoolTermMutation,
  useCreateSchoolYearMutation,
  useDeleteSchoolBreakMutation,
  useDeleteSchoolTermMutation,
  useDeleteSchoolYearMutation,
  useGetAllSchoolBreaksQuery,
  useGetAllSchoolTermsQuery,
  useGetAllSchoolYearsQuery,
  useUpdateSchoolBreakMutation,
  useUpdateSchoolTermMutation,
  useUpdateSchoolYearMutation
} from 'reduxStore/services/api/schoolTerms';
import { elevation } from 'styles/elevation';
import { EntityResponseType } from 'types/entities';
import { SchoolBreak, SchoolTerm, SchoolYear } from 'types/schoolTerms';
import { getHumanReadableDate } from 'utils/datesAndTimes';
import {
  useSchoolBreakFieldTypes,
  useSchoolYearFieldTypes
} from './formFieldTypes';

const yearCardStyles = StyleSheet.create({
  titleSection: { flexDirection: 'row' },
  title: { fontSize: 18, marginRight: 10 },
  itemNameText: { marginRight: 6 },
  datesText: { fontSize: 14, marginRight: 5 },
  addBreakButtonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  breaksHeader: {
    fontSize: 18
  },
  addBreakButton: {
    paddingHorizontal: 14,
    paddingVertical: 5
  },
  termBreakModalContent: { maxWidth: '100%', maxHeight: '100%' },
  termBreakModalButtonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  termBreakModalButton: {
    margin: 5
  },
  termBreakForm: { marginBottom: 0 },
  breaksOrTermsWrapper: { marginTop: 10 },
  modalBox: { width: '100%' },
  schoolSection: { marginBottom: 5 },
  datePair: {
    flexDirection: 'row'
  }
});

const SectionModal = ({
  visible,
  onRequestClose,
  onCreate,
  onUpdate,
  onDelete,
  section,
  isTerm
}: {
  visible: boolean;
  onRequestClose: () => void;
  onCreate: (values: any) => Promise<void>;
  onUpdate: (values: any) => Promise<void>;
  onDelete: () => Promise<void>;
  section?: SchoolTerm | SchoolBreak;
  isTerm?: boolean;
}) => {
  const formFields = useSchoolBreakFieldTypes(!!isTerm);
  const [formValues, setFormValues] = useState({});
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initialFormValues = section
      ? createInitialObject(formFields, undefined, section)
      : createInitialObject(formFields, undefined, {
          show_on_calendars: true,
          show_only_start_and_end: true
        });
    setFormValues(initialFormValues);
  }, [formFields, section, visible]); // Include visible here so that it clears on close

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      boxStyle={yearCardStyles.modalBox}
    >
      <TransparentScrollView style={yearCardStyles.termBreakModalContent}>
        <TypedForm
          fields={formFields}
          formValues={formValues}
          onFormValuesChange={(values: FieldValueTypes) => {
            setFormValues(values);
          }}
          inlineFields={false}
          sectionStyle={StyleSheet.flatten([
            elevation.unelevated,
            yearCardStyles.termBreakForm
          ])}
        />
        <TransparentView style={yearCardStyles.termBreakModalButtonWrapper}>
          <Button
            title={t('common.cancel')}
            onPress={onRequestClose}
            style={yearCardStyles.termBreakModalButton}
          />
          {submitting ? (
            <PaddedSpinner />
          ) : (
            <>
              <Button
                title={section ? t('common.update') : t('common.add')}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    const parsedValues: any = parseFormValues(
                      formValues,
                      formFields
                    );

                    if (section) {
                      await onUpdate(parsedValues);
                    } else {
                      await onCreate(parsedValues);
                    }
                    onRequestClose();
                  } catch (err) {
                    Toast.show({
                      type: 'error',
                      text1: t('common.errors.generic')
                    });
                  }
                  setSubmitting(false);
                }}
                style={yearCardStyles.termBreakModalButton}
              />
              {section && (
                <Button
                  title={t('common.delete')}
                  onPress={async () => {
                    setSubmitting(true);
                    try {
                      await onDelete();
                    } catch (err) {
                      Toast.show({
                        type: 'error',
                        text1: t('common.errors.generic')
                      });
                    }
                    setSubmitting(false);
                  }}
                  style={yearCardStyles.termBreakModalButton}
                />
              )}
            </>
          )}
        </TransparentView>
      </TransparentScrollView>
    </Modal>
  );
};

const SchoolBreakModal = ({
  visible,
  onRequestClose,
  yearId,
  schoolBreak
}: {
  visible: boolean;
  onRequestClose: () => void;
  yearId: number;
  schoolBreak?: SchoolBreak;
}) => {
  const [createBreak] = useCreateSchoolBreakMutation();
  const [updateBreak] = useUpdateSchoolBreakMutation();
  const [deleteBreak] = useDeleteSchoolBreakMutation();

  const onCreate = async (parsedValues: any) => {
    await createBreak({
      ...parsedValues,
      school_year: yearId
    }).unwrap();
  };

  const onUpdate = async (parsedValues: any) => {
    if (schoolBreak) {
      await updateBreak({
        ...parsedValues,
        school_year: yearId,
        id: schoolBreak.id
      }).unwrap();
    }
  };

  const onDelete = async () => {
    if (schoolBreak) {
      await deleteBreak({
        id: schoolBreak.id
      }).unwrap();
    }
  };

  return (
    <SectionModal
      visible={visible}
      onRequestClose={onRequestClose}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      section={schoolBreak}
    />
  );
};

const SchoolTermModal = ({
  visible,
  onRequestClose,
  yearId,
  term
}: {
  visible: boolean;
  onRequestClose: () => void;
  yearId: number;
  term?: SchoolTerm;
}) => {
  const [createTerm] = useCreateSchoolTermMutation();
  const [updateTerm] = useUpdateSchoolTermMutation();
  const [deleteTerm] = useDeleteSchoolTermMutation();

  const onCreate = async (parsedValues: any) => {
    await createTerm({
      ...parsedValues,
      school_year: yearId
    }).unwrap();
  };

  const onUpdate = async (parsedValues: any) => {
    if (term) {
      await updateTerm({
        ...parsedValues,
        school_year: yearId,
        id: term.id
      }).unwrap();
    }
  };

  const onDelete = async () => {
    if (term) {
      await deleteTerm({
        id: term.id
      }).unwrap();
    }
  };

  return (
    <SectionModal
      visible={visible}
      onRequestClose={onRequestClose}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      section={term}
      isTerm={true}
    />
  );
};

const YearModal = ({
  visible,
  onRequestClose,
  year
}: {
  visible: boolean;
  onRequestClose: () => void;
  year: SchoolYear;
}) => {
  const formFields = useSchoolYearFieldTypes();
  const [formValues, setFormValues] = useState({});
  const [updateYear, updateYearResult] = useUpdateSchoolYearMutation();
  const [deleteYear, deleteYearResult] = useDeleteSchoolYearMutation();
  const [deletingYear, setDeletingYear] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const initialValues = createInitialObject(formFields, undefined, year);
    setFormValues(initialValues);
  }, [formFields, year]);

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      boxStyle={yearCardStyles.modalBox}
    >
      <TypedForm
        fields={formFields}
        formValues={formValues}
        sectionStyle={StyleSheet.flatten([
          elevation.unelevated,
          yearCardStyles.termBreakForm
        ])}
        onFormValuesChange={(values: FieldValueTypes) => {
          setFormValues(values);
        }}
      />
      <TransparentView style={yearCardStyles.termBreakModalButtonWrapper}>
        {updateYearResult.isLoading || deleteYearResult.isLoading ? (
          <PaddedSpinner />
        ) : (
          <>
            <Button
              title={t('common.update')}
              onPress={async () => {
                try {
                  const parsedValues: any = parseFormValues(
                    formValues,
                    formFields
                  );
                  await updateYear({
                    ...parsedValues,
                    id: year.id
                  });
                  onRequestClose();
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              style={yearCardStyles.termBreakModalButton}
            />
            <Button
              title={t('common.delete')}
              onPress={() => {
                setDeletingYear(true);
              }}
              style={yearCardStyles.termBreakModalButton}
            />
          </>
        )}
      </TransparentView>
      <YesNoModal
        visible={deletingYear}
        title={t('components.schoolTerms.deleteYearConfirmationTitle')}
        question={t('components.schoolTerms.deleteYearConfirmationQuestion')}
        onYes={async () => {
          try {
            await deleteYear({
              id: year.id
            });
            onRequestClose();
            setDeletingYear(false);
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: t('common.errors.generic')
            });
          }
        }}
        onNo={() => {
          setDeletingYear(false);
        }}
        onRequestClose={() => {
          setDeletingYear(false);
        }}
      />
    </Modal>
  );
};

const SchoolSection = ({
  item,
  style,
  isBreak
}: {
  item: SchoolBreak | SchoolTerm;
  style?: ViewStyle;
  isBreak?: boolean;
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  return (
    <>
      <SafePressable style={style || {}} onPress={() => setShowEditModal(true)}>
        <TransparentView style={yearCardStyles.titleSection}>
          <Text style={yearCardStyles.itemNameText}>{item.name}</Text>
          <Feather name="edit" size={16} color="orange" />
        </TransparentView>
        <Text>
          ({getHumanReadableDate(item.start_date)} -{' '}
          {getHumanReadableDate(item.end_date)})
        </Text>
      </SafePressable>
      {isBreak ? (
        <SchoolBreakModal
          visible={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          yearId={item.school_year}
          schoolBreak={item}
        />
      ) : (
        <SchoolTermModal
          visible={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          yearId={item.school_year}
          term={item}
        />
      )}
    </>
  );
};

const SchoolYearCard = ({
  year,
  school,
  style
}: {
  year: SchoolYear;
  school: EntityResponseType;
  style?: ViewStyle;
}) => {
  const { data: schoolBreaks, isLoading: isLoadingSchoolBreaks } =
    useGetAllSchoolBreaksQuery();

  const { data: schoolTerms, isLoading: isLoadingSchoolTerms } =
    useGetAllSchoolTermsQuery();

  const { t } = useTranslation();

  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showEditYearModal, setShowEditYearModal] = useState(false);

  const isLoading =
    isLoadingSchoolBreaks ||
    !schoolBreaks ||
    isLoadingSchoolTerms ||
    !schoolTerms;

  if (isLoading) {
    return null;
  }

  const termBreaks = schoolBreaks.byYear[year.id] || null;
  const termBreakComponents = termBreaks
    ? termBreaks.map((breakId) => {
        const schoolBreak = schoolBreaks.byId[breakId];
        return (
          <SchoolSection
            item={schoolBreak}
            key={breakId}
            style={yearCardStyles.schoolSection}
            isBreak={true}
          />
        );
      })
    : [];

  const terms = schoolTerms.byYear[year.id] || null;
  const termComponents = terms
    ? terms.map((termId) => {
        const term = schoolTerms.byId[termId];
        return (
          <SchoolSection
            item={term}
            key={termId}
            style={yearCardStyles.schoolSection}
          />
        );
      })
    : [];

  return (
    <WhiteBox style={style}>
      <SafePressable onPress={() => setShowEditYearModal(true)}>
        <TransparentView style={yearCardStyles.titleSection}>
          <Text style={yearCardStyles.title}>
            {year.year} {school.name}
          </Text>
          <Feather name="edit" size={20} color="orange" />
        </TransparentView>
        <TransparentView style={yearCardStyles.datePair}>
          <Text style={yearCardStyles.datesText} bold={true}>
            {t('components.schoolTerms.firstDay')}
          </Text>
          <Text style={yearCardStyles.datesText}>
            {getHumanReadableDate(year.start_date)}
          </Text>
        </TransparentView>
        <TransparentView style={yearCardStyles.datePair}>
          <Text style={yearCardStyles.datesText} bold={true}>
            {t('components.schoolTerms.lastDay')}
          </Text>
          <Text style={yearCardStyles.datesText}>
            {getHumanReadableDate(year.end_date)}
          </Text>
        </TransparentView>
      </SafePressable>
      <TransparentView style={yearCardStyles.breaksOrTermsWrapper}>
        {terms && (
          <TransparentPaddedView>
            <Text style={yearCardStyles.breaksHeader}>
              {t('components.schoolTerms.terms')}
            </Text>
            {termComponents}
          </TransparentPaddedView>
        )}
        <TransparentView style={yearCardStyles.addBreakButtonWrapper}>
          <Button
            title={t('components.schoolTerms.addTerm')}
            onPress={() => {
              setShowTermModal(true);
            }}
            style={yearCardStyles.addBreakButton}
          />
        </TransparentView>
      </TransparentView>
      <TransparentView style={yearCardStyles.breaksOrTermsWrapper}>
        {termBreaks && (
          <TransparentPaddedView>
            <Text style={yearCardStyles.breaksHeader}>
              {t('components.schoolTerms.breaks')}
            </Text>
            {termBreakComponents}
          </TransparentPaddedView>
        )}
        <TransparentView style={yearCardStyles.addBreakButtonWrapper}>
          <Button
            title={t('components.schoolTerms.addBreak')}
            onPress={() => {
              setShowBreakModal(true);
            }}
            style={yearCardStyles.addBreakButton}
          />
        </TransparentView>
      </TransparentView>
      <SchoolBreakModal
        visible={showBreakModal}
        onRequestClose={() => setShowBreakModal(false)}
        yearId={year.id}
      />
      <SchoolTermModal
        visible={showTermModal}
        onRequestClose={() => setShowTermModal(false)}
        yearId={year.id}
      />
      <YearModal
        visible={showEditYearModal}
        onRequestClose={() => setShowEditYearModal(false)}
        year={year}
      />
    </WhiteBox>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
    paddingTop: 20
  },
  button: {
    marginHorizontal: 5
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  schoolTermCard: { marginBottom: 10 }
});

export default function SchoolTermsScreen() {
  const { data: schoolYears, isLoading: isLoadingSchoolYears } =
    useGetAllSchoolYearsQuery();
  const [createSchoolYear] = useCreateSchoolYearMutation();
  const { data: allEntities, isLoading: isLoadingEntities } =
    useGetAllEntitiesQuery();
  const [addingTerm, setAddingTerm] = useState(false);
  const { t } = useTranslation();
  const formFields = useSchoolYearFieldTypes();

  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const initialValues = createInitialObject(formFields, undefined, {
      year: `${currentYear}/${currentYear + 1}`,
      show_on_calendars: true
    });
    setFormValues(initialValues);
  }, [formFields]);

  const isLoading =
    isLoadingSchoolYears || !schoolYears || isLoadingEntities || !allEntities;
  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (addingTerm) {
    const allRequired = hasAllRequired(formValues, formFields);

    return (
      <TransparentFullPageScrollView>
        <TransparentPaddedView>
          <TypedForm
            fields={formFields}
            formValues={formValues}
            onFormValuesChange={(values: FieldValueTypes) => {
              setFormValues(values);
            }}
            inlineFields={true}
          />
          <TransparentView style={styles.buttonWrapper}>
            <Button
              title={t('common.save')}
              onPress={async () => {
                const parsedFieldValues: any = parseFormValues(
                  formValues,
                  formFields
                );

                try {
                  await createSchoolYear(parsedFieldValues).unwrap();
                  setAddingTerm(false);
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              style={styles.button}
              disabled={!allRequired}
            />
            <Button
              title={t('common.back')}
              onPress={() => setAddingTerm(false)}
              style={styles.button}
            />
          </TransparentView>
        </TransparentPaddedView>
      </TransparentFullPageScrollView>
    );
  }

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      <TransparentPaddedView>
        {schoolYears.ids.map((schoolYearId) => {
          const schoolTerm = schoolYears.byId[schoolYearId];
          const school = allEntities.byId[schoolTerm.school];
          return (
            <SchoolYearCard
              key={schoolYearId}
              year={schoolYears.byId[schoolYearId]}
              school={school}
              style={styles.schoolTermCard}
            />
          );
        })}
        <TransparentView style={styles.buttonWrapper}>
          <Button
            title={t('components.schoolTerms.addSchoolYear')}
            onPress={() => setAddingTerm(true)}
          />
        </TransparentView>
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
