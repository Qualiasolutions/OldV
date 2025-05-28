import { FlatFormFieldTypes } from 'components/forms/formFieldTypes';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import { selectEntitiesByEntityTypes } from 'reduxStore/slices/entities/selectors';

const schoolsSelector = selectEntitiesByEntityTypes(['School']);

export const useSchoolYearFieldTypes = () => {
  const { t } = useTranslation('modelFields');
  const schoolEntities = useSelector(schoolsSelector);
  const { data: allEntities } = useGetAllEntitiesQuery();

  const schoolOptions = useMemo(() => {
    if (!allEntities || !schoolEntities) {
      return [];
    }
    return allEntities
      ? schoolEntities.map((entityId) => {
          const entity = allEntities.byId[entityId];
          return {
            label: entity.name,
            value: entityId
          };
        })
      : [];
  }, [schoolEntities, allEntities]);

  const fields = useMemo<FlatFormFieldTypes>(() => {
    return {
      year: {
        type: 'string',
        required: true,
        displayName: t('schoolYear.year')
      },
      school: {
        type: 'dropDown',
        required: true,
        displayName: t('schoolYear.school'),
        permittedValues: schoolOptions,
        listMode: 'MODAL'
      },
      start_date: {
        type: 'Date',
        required: true,
        displayName: t('schoolYear.start_date')
      },
      end_date: {
        type: 'Date',
        required: true,
        displayName: t('schoolYear.end_date')
      },
      show_on_calendars: {
        type: 'checkbox',
        required: false,
        displayName: t('schoolYear.show_on_calendars')
      }
    };
  }, [schoolOptions, t]);

  return fields;
};

export const useSchoolBreakFieldTypes = (isTerm: boolean) => {
  const { t } = useTranslation('modelFields');

  const fields = useMemo<FlatFormFieldTypes>(() => {
    return {
      name: {
        type: 'string',
        required: true,
        displayName: t('schoolBreak.name')
      },
      start_date: {
        type: 'Date',
        required: true,
        displayName: isTerm
          ? t('schoolTerm.start_date')
          : t('schoolBreak.start_date'),
        associatedEndDateField: 'end_date'
      },
      end_date: {
        type: 'Date',
        required: true,
        displayName: isTerm
          ? t('schoolTerm.end_date')
          : t('schoolBreak.end_date'),
        associatedStartDateField: 'start_date'
      },
      show_on_calendars: {
        type: 'checkbox',
        required: true,
        displayName: t('schoolBreak.show_on_calendars')
      },
      show_only_start_and_end: {
        type: 'checkbox',
        required: true,
        displayName: t('schoolBreak.show_only_start_and_end'),
        helpText: t('tasks.helpText.show_only_start_and_end')
      }
    };
  }, [t, isTerm]);

  return fields;
};
