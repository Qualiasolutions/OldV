import React, { ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { Text, TextInput } from 'components/Themed';
import DateTimeTextInput from 'components/forms/components/DateTimeTextInput';
import {
  AddFamilyMembersField,
  AddMembersField,
  CalculatedDurationField,
  CheckboxField,
  DateField,
  DateTimeField,
  DropDownField,
  DropDownWithOtherField,
  DurationField,
  FormFieldTypes,
  hasListMode,
  hasPlaceholder,
  OptionalYearDate,
  RadioField,
  RecurrenceSelectorField,
  RoutineField,
  StringField,
  TagSelectorField,
  TimezoneField
} from './formFieldTypes';
import RadioInput from 'components/forms/components/RadioInput';
import {
  TransparentView,
  WhiteBox,
  WhiteView
} from 'components/molecules/ViewComponents';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { ColorPicker } from 'components/forms/components/ColorPickers';
import MemberSelector from 'components/forms/components/MemberSelector';
import PhoneNumberInput from 'components/forms/components/PhoneNumberInput';
import { Feather } from '@expo/vector-icons';
import FamilySelector from 'components/forms/components/FamilySelector';
import { OptionalYearDateInput } from 'components/forms/components/OptionalYearDateInput';
import DropDown from 'components/forms/components/DropDown';
import { WhiteImagePicker } from 'components/forms/components/ImagePicker';
import createNullStringObject from './utils/createNullStringObject';
import { FieldErrorTypes, FieldValueTypes } from './types';
import { useTranslation } from 'react-i18next';
import TimezoneSelect from './components/TimezoneSelect';
import { elevation } from '../../styles/elevation';
import RecurrenceSelector from './components/RecurrenceSelector';
import CalculatedDuration from './components/CalculatedDuration';
import InputWithLabel from 'components/molecules/InputWithLabel';
import EntityAndTagSelector from './components/TagSelector';
import Checkbox from 'components/molecules/Checkbox';
import Duration from './components/Duration';
import isFieldShown from './utils/isFieldShown';
import ActionSelector from './components/ActionSelector';
import ReminderSelector from './components/ReminderSelector';
import RoutineSelector from './components/RoutineSelector';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

const parseFieldName = (name: string) => {
  return name
    .split('_')
    .map((part) => part[0].toLocaleUpperCase() + part.slice(1))
    .join(' ');
};

const getAssociatedUpdates = (
  f: DateTimeField,
  field: string,
  formValues: FieldValueTypes,
  newValue: Date
) => {
  const associatedUpdates: { [key: string]: Date } = {};
  if (f.associatedEndTimeField) {
    if (newValue) {
      if (
        !formValues[f.associatedEndTimeField] ||
        (!formValues[field] && formValues[f.associatedEndTimeField] < newValue)
      ) {
        /*
          If the end time field isn't set or the previous start time isn't
          set but the end time is before the new start time then set the
          end time to be an hour ahead of the new start time.
        */
        const associatedDateTime = new Date(newValue);
        associatedDateTime.setHours(associatedDateTime.getHours() + 1);
        associatedUpdates[f.associatedEndTimeField] = associatedDateTime;
      } else if (formValues[f.associatedEndTimeField] && formValues[field]) {
        /*
          Otherwise if the old start time is set then maintain the
          event length
        */
        const currentDelta =
          formValues[f.associatedEndTimeField].getTime() -
          formValues[field].getTime();
        associatedUpdates[f.associatedEndTimeField] = new Date(
          newValue.getTime() + currentDelta
        );
      }
    }
  }
  if (f.associatedStartTimeField) {
    if (newValue) {
      if (
        !formValues[f.associatedStartTimeField] ||
        (!formValues[field] &&
          formValues[f.associatedStartTimeField] > newValue)
      ) {
        /*
          If the start time field isn't set or the previous end time isn't
          set but the start time is after the new end time then set the
          start time to be an hour before the new end time.
        */
        const associatedDateTime = new Date(newValue);
        associatedDateTime.setHours(associatedDateTime.getHours() - 1);
        associatedUpdates[f.associatedStartTimeField] = associatedDateTime;
      } else if (
        formValues[field] &&
        newValue < formValues[f.associatedStartTimeField]
      ) {
        /*
          Otherwise if the old end time is set but the new end time
          is before the start time then maintain the event length
        */
        const currentDelta =
          formValues[field].getTime() -
          formValues[f.associatedStartTimeField].getTime();
        associatedUpdates[f.associatedStartTimeField] = new Date(
          newValue.getTime() - currentDelta
        );
      }
    }
  }
  return associatedUpdates;
};

const styles = StyleSheet.create({
  inlineDateInput: {
    flexShrink: 1,
    width: '100%'
  },
  membersPair: { alignItems: 'flex-start' },
  calendarIcon: {
    position: 'absolute',
    right: 20,
    bottom: 12,
    color: 'grey'
  },
  textInput: {
    minHeight: 44,
    height: 'auto',
    flexShrink: 1,
    minWidth: 100
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  textAreaCount: { textAlign: 'right' },
  addFamilyMembers: {
    marginTop: 20
  },
  fieldSection: {
    marginBottom: 50,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 30
  },
  flex: {
    flexGrow: 1
  },
  inputLabel: {
    minWidth: 110
  },
  inputPair: {
    marginBottom: 15
  },
  fullWidth: { width: '100%' },
  colourBarContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
});

export default function TypedForm({
  fields,
  formValues,
  formType = 'CREATE',
  inlineFields = false,
  fieldColor = '#ffffff',
  onFormValuesChange = () => {},
  style = {},
  sectionStyle = {}
}: {
  fields: FormFieldTypes;
  formValues: FieldValueTypes;
  formType?: 'UPDATE' | 'CREATE';
  inlineFields?: boolean;
  fieldColor?: string;
  onFormValuesChange?: (vals: FieldValueTypes) => void;
  style?: ViewStyle;
  sectionStyle?: ViewStyle;
}) {
  const { t } = useTranslation();

  const fieldSections = useMemo(() => {
    return Array.isArray(fields) ? fields : [fields];
  }, [fields]);

  const flatFields = useMemo(() => {
    return Array.isArray(fields)
      ? fields.reduce((a, b) => ({ ...a, ...b }))
      : fields;
  }, [fields]);

  const [formErrors, setFormErrors] = React.useState<FieldErrorTypes>(
    createNullStringObject(flatFields)
  );

  const textInputStyle = StyleSheet.flatten([
    Platform.OS === 'ios' ? { paddingTop: 10 } : {}, // multiline text inputs don't center vertically on iPhone
    styles.textInput,
    { backgroundColor: fieldColor }
  ]);

  const produceLabelFromFieldName = useMemo(() => {
    return (fieldName: string) => {
      const displayName =
        flatFields &&
        flatFields[fieldName] &&
        Object.keys(flatFields[fieldName]).includes('displayName')
          ? flatFields[fieldName].displayName
          : parseFieldName(fieldName);

      const asterisk =
        displayName && flatFields && flatFields[fieldName]?.required ? '*' : '';
      return `${displayName}${asterisk}`;
    };
  }, [flatFields]);

  const InputPair = useCallback(
    ({
      field,
      children,
      labelStyle,
      inlineFieldsOverride,
      containerStyle,
      pairStyle
    }: {
      field: string;
      children: ReactNode;
      labelStyle?: ViewStyle;
      inlineFieldsOverride?: boolean;
      containerStyle?: ViewStyle;
      pairStyle?: ViewStyle;
    }) => {
      const fieldObj = flatFields[field];
      if (!isFieldShown(fieldObj)) {
        return null;
      }

      return (
        <InputWithLabel
          key={field}
          error={formErrors[field] || ''}
          label={produceLabelFromFieldName(field)}
          inlineFields={
            inlineFieldsOverride === undefined
              ? inlineFields
              : inlineFieldsOverride
          }
          labelStyle={labelStyle}
          labelWrapperStyle={styles.inputLabel}
          style={containerStyle}
          pairStyle={pairStyle}
          helpText={fieldObj.helpText}
        >
          {children}
        </InputWithLabel>
      );
    },
    [formErrors, inlineFields, produceLabelFromFieldName, flatFields]
  );

  const ValueDependentInputPair = useCallback(
    ({
      field,
      children,
      values,
      labelStyle,
      inlineFieldsOverride
    }: {
      field: string;
      children: ReactNode;
      values: FieldValueTypes;
      labelStyle?: ViewStyle;
      inlineFieldsOverride?: boolean;
    }) => {
      /*
        Some fields depend on the values of other fields - we use
        this component to rerender components when the field values
        change. It can cause problems for some component types so
        is not used for text fields, some tag selectors etc
      */
      const fieldObj = flatFields[field];
      if (!isFieldShown(fieldObj, values)) {
        return null;
      }

      return (
        <InputPair
          field={field}
          children={children}
          labelStyle={labelStyle}
          containerStyle={styles.inputPair}
          inlineFieldsOverride={inlineFieldsOverride}
        />
      );
    },
    [InputPair, flatFields]
  );

  const formFields = useMemo(
    () =>
      fieldSections.map((section, i) => {
        const sectionFields = Object.keys(section).map((field: string) => {
          const fieldType = flatFields[field];
          const inlineOverride = fieldType.inlineOverride;

          switch (fieldType.type) {
            case 'string': {
              const f = flatFields[field] as StringField;
              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <TextInput
                    value={formValues[field]}
                    onChangeText={(newValue) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: newValue
                      });
                    }}
                    style={textInputStyle}
                    autoCapitalize={
                      f.transform === 'uppercase' ? 'characters' : 'sentences'
                    }
                    editable={!f.disabled}
                    multiline
                  />
                </InputPair>
              );
            }
            case 'phoneNumber':
              let defaultNumber = ""
              let defaultCode = "GB"
              try {
                const parsedNo = parsePhoneNumberWithError(formValues[field])
                defaultNumber = parsedNo.nationalNumber
                defaultCode = parsedNo.country || "GB"
              } catch (e) {}
              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <PhoneNumberInput
                    value={defaultNumber}
                    defaultValue={defaultNumber}
                    defaultCode={defaultCode as any}
                    onChangeFormattedText={(newValue) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: newValue
                      });
                    }}
                    textContainerStyle={{
                      backgroundColor: fieldColor
                    }}
                    placeholder={
                      inlineFields ? t('misc.phoneNo') : t('misc.phoneNumber')
                    }
                    containerStyle={styles.fullWidth}
                  />
                </InputPair>
              );
            case 'OptionalYearDate': {
              const f = flatFields[field];
              const knownYearField = (f as OptionalYearDate).knownYearField;

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <OptionalYearDateInput
                    value={formValues[field]}
                    knownYear={
                      knownYearField ? formValues[knownYearField] : false
                    }
                    onValueChange={(newValue: Date, knownYear: boolean) => {
                      const knownYearFields = knownYearField
                        ? {
                            [(f as OptionalYearDate).knownYearField as string]:
                              knownYear
                          }
                        : {};
                      onFormValuesChange({
                        ...formValues,
                        ...knownYearFields,
                        [field]: newValue
                      });
                    }}
                    textInputStyle={StyleSheet.flatten([
                      textInputStyle,
                      { minWidth: 0 }
                    ])}
                  />
                </InputPair>
              );
            }
            case 'Date': {
              const f = flatFields[field] as DateField;
              const limitValues: { [key: string]: Date } = {};
              if (f.associatedEndDateField) {
                if (formValues[f.associatedEndDateField]) {
                  limitValues.maximum = formValues[f.associatedEndDateField];
                }
              }
              if (f.associatedStartDateField) {
                if (formValues[f.associatedStartDateField]) {
                  limitValues.minimum = formValues[f.associatedStartDateField];
                }
              }
              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={inlineOverride}
                >
                  <DateTimeTextInput
                    value={formValues[field]}
                    maximumDate={limitValues.maximum}
                    minimumDate={limitValues.minimum}
                    onValueChange={(newValue: Date) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: newValue
                      });
                      setFormErrors({ ...formErrors, [field]: '' });
                    }}
                    mode="date"
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                    containerStyle={styles.inlineDateInput}
                    textInputStyle={textInputStyle}
                  />
                  <Feather
                    name="calendar"
                    size={20}
                    style={styles.calendarIcon}
                  />
                </ValueDependentInputPair>
              );
            }
            case 'DateTime': {
              const f = flatFields[field] as DateTimeField;
              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={inlineOverride}
                >
                  <DateTimeTextInput
                    value={formValues[field]}
                    onValueChange={(newValue: Date) => {
                      const associatedUpdates = getAssociatedUpdates(
                        f,
                        field,
                        formValues,
                        newValue
                      );
                      onFormValuesChange({
                        ...formValues,
                        ...associatedUpdates,
                        [field]: newValue
                      });
                      setFormErrors({ ...formErrors, [field]: '' });
                    }}
                    containerStyle={styles.inlineDateInput}
                    textInputStyle={textInputStyle}
                    mode="datetime"
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                  <Feather
                    name="calendar"
                    size={20}
                    style={styles.calendarIcon}
                  />
                </ValueDependentInputPair>
              );
            }
            case 'radio': {
              const f = flatFields[field] as RadioField;
              const permittedValueObjects = f.permittedValues.map(
                (value: any) => ({
                  label: f.valueToDisplay(value),
                  value
                })
              );

              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={inlineOverride}
                >
                  <RadioInput
                    value={formValues[field]}
                    permittedValues={permittedValueObjects}
                    onValueChange={(value: any) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: value.id
                      });
                      setFormErrors({ ...formErrors, [field]: '' });
                    }}
                  />
                </ValueDependentInputPair>
              );
            }
            case 'checkbox': {
              const f = flatFields[field] as CheckboxField;
              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={inlineOverride}
                >
                  <Checkbox
                    smoothChecking={false}
                    checked={formValues[field]}
                    onValueChange={async (value: any) => {
                      const newFormValues = {
                        ...formValues,
                        [field]: !value
                      };

                      if (f.forceUnchecked) {
                        for (const fieldName of f.forceUnchecked) {
                          newFormValues[fieldName] = false;
                        }
                      }

                      onFormValuesChange(newFormValues);
                    }}
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                </ValueDependentInputPair>
              );
            }
            case 'colour': {
              return (
                <WhiteBox key={field} elevated={false} style={styles.inputPair}>
                  {formErrors[field] ? <Text>{formErrors[field]}</Text> : null}
                  <InputPair
                    field={field}
                    key={field}
                    inlineFieldsOverride={true}
                  >
                    <TransparentView style={styles.colourBarContainer}>
                      <ColorPicker
                        value={formValues[field]}
                        onValueChange={(value: string) => {
                          onFormValuesChange({
                            ...formValues,
                            [field]: value
                          });
                          setFormErrors({ ...formErrors, [field]: '' });
                        }}
                      />
                    </TransparentView>
                  </InputPair>
                </WhiteBox>
              );
            }
            case 'addMembers': {
              const f = flatFields[field] as AddMembersField;

              if (!isFieldShown(f, formValues)) {
                return null;
              }

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  pairStyle={styles.membersPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <MemberSelector
                    values={formValues[field] || []}
                    onValueChange={(selectedMembers) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: selectedMembers
                      });
                    }}
                    changeMembersText={f.changeMembersText || ''}
                    disabled={f.disabled}
                  />
                </InputPair>
              );
            }
            case 'TextArea':
              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <TransparentView style={styles.flex}>
                    <TextInput
                      value={formValues[field]}
                      onChangeText={(newValue) => {
                        onFormValuesChange({
                          ...formValues,
                          [field]: newValue
                        });
                      }}
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: fieldColor
                        }
                      ]}
                      multiline={true}
                      maxLength={150}
                    />
                    <AlmostBlackText
                      text={`${formValues[field]?.length || 0}/150`}
                      style={styles.textAreaCount}
                    />
                  </TransparentView>
                </InputPair>
              );
            case 'addFamilyMembers': {
              const f = flatFields[field] as AddFamilyMembersField;
              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <FamilySelector
                    data={f.permittedValues}
                    values={formValues[field] || []}
                    onValueChange={(selectedMembers: any) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: [...selectedMembers]
                      });
                    }}
                  />
                </InputPair>
              );
            }
            case 'dropDown': {
              const f = flatFields[field] as DropDownField;

              if (!isFieldShown(f, formValues)) {
                return null;
              }

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <DropDown
                    value={formValues[field]}
                    items={f.permittedValues}
                    setFormValues={(item) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: item
                      });
                    }}
                    dropdownPlaceholder={
                      (hasPlaceholder(f) && f.placeholder) || undefined
                    }
                    listMode={(hasListMode(f) && f.listMode) || undefined}
                    style={textInputStyle}
                    containerStyle={styles.flex}
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                </InputPair>
              );
            }
            case 'dropDownWithOther': {
              const f = flatFields[field] as DropDownWithOtherField;
              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <DropDown
                    value={formValues[field]}
                    items={f.permittedValues}
                    setFormValues={(item) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: item
                      });
                    }}
                    allowOther={true}
                    dropdownPlaceholder={
                      (hasPlaceholder(f) && f.placeholder) || undefined
                    }
                    listMode={(hasListMode(f) && f.listMode) || undefined}
                    style={textInputStyle}
                    containerStyle={styles.flex}
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                </InputPair>
              );
            }
            case 'routineSelector': {
              const f = flatFields[field] as RoutineField;

              if (!isFieldShown(f, formValues)) {
                return null;
              }

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <RoutineSelector
                    value={formValues[field]}
                    onChange={(item) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: item
                      });
                    }}
                    textInputStyle={textInputStyle}
                    containerStyle={styles.flex}
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                </InputPair>
              );
            }
            case 'Image': {
              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={StyleSheet.flatten([
                    styles.inputPair,
                    { zIndex: 10 }
                  ])}
                  inlineFieldsOverride={inlineOverride}
                >
                  <WhiteImagePicker
                    onImageSelect={(image) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: image
                      });
                    }}
                    defaultImageUrl={
                      formValues[field]?.uri || formValues[field] || ''
                    }
                    displayInternalImage={false}
                    style={{
                      backgroundColor: fieldColor
                    }}
                  />
                </InputPair>
              );
            }
            case 'timezone': {
              const f = flatFields[field] as TimezoneField;

              if (!isFieldShown(f, formValues)) {
                return null;
              }

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <TimezoneSelect
                    value={formValues[field]}
                    onSelectTimezone={(value) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: value
                      });
                    }}
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                </InputPair>
              );
            }
            case 'recurrenceSelector': {
              const f = flatFields[field] as RecurrenceSelectorField;
              const firstOccurrence: Date = formValues[f.firstOccurrenceField];

              if (!firstOccurrence) {
                return null;
              }

              if (!isFieldShown(f, formValues)) {
                return null;
              }

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <TransparentView>
                    <RecurrenceSelector
                      value={formValues[field]}
                      onChange={(value) => {
                        onFormValuesChange({
                          ...formValues,
                          [field]: value
                        });
                      }}
                      onChangeFirstOccurrenceField={(value) => {
                        const firstOccurrenceField =
                          flatFields[f.firstOccurrenceField];
                        const associatedUpdates = getAssociatedUpdates(
                          firstOccurrenceField as DateTimeField,
                          f.firstOccurrenceField,
                          formValues,
                          value
                        );
                        onFormValuesChange({
                          ...formValues,
                          ...associatedUpdates,
                          [f.firstOccurrenceField]: value
                        });
                      }}
                      firstOccurrence={firstOccurrence}
                      disabled={f.disabled || false}
                      reverse={f.reverse}
                    />
                  </TransparentView>
                </InputPair>
              );
            }
            case 'actionsSelector': {
              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={false}
                >
                  <TransparentView>
                    <ActionSelector
                      value={formValues[field]}
                      onChange={(value) => {
                        onFormValuesChange({
                          ...formValues,
                          [field]: value
                        });
                      }}
                    />
                  </TransparentView>
                </ValueDependentInputPair>
              );
            }
            case 'reminderSelector': {
              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={false}
                >
                  <TransparentView>
                    <ReminderSelector
                      value={formValues[field]}
                      onChange={(value) => {
                        onFormValuesChange({
                          ...formValues,
                          [field]: value
                        });
                      }}
                    />
                  </TransparentView>
                </ValueDependentInputPair>
              );
            }
            case 'tagSelector': {
              const f = flatFields[field] as TagSelectorField;

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <TransparentView>
                    <EntityAndTagSelector
                      value={formValues[field]}
                      onChange={(value) => {
                        onFormValuesChange({
                          ...formValues,
                          [field]: value
                        });
                      }}
                      extraTagOptions={f.extraTagOptions}
                    />
                  </TransparentView>
                </InputPair>
              );
            }
            case 'calculatedDuration': {
              const f = flatFields[field] as CalculatedDurationField;
              const startDatetime: Date = formValues[f.startFieldName];
              const endDatetime: Date = formValues[f.endFieldName];

              if (!(startDatetime && endDatetime)) {
                return null;
              }

              return (
                <ValueDependentInputPair
                  field={field}
                  key={field}
                  values={formValues}
                  inlineFieldsOverride={inlineOverride}
                >
                  <CalculatedDuration
                    startDatetime={startDatetime}
                    endDatetime={endDatetime}
                    textInputStyle={{
                      backgroundColor: fieldColor
                    }}
                  />
                </ValueDependentInputPair>
              );
            }
            case 'duration': {
              const f = flatFields[field] as DurationField;
              if (!isFieldShown(f, formValues)) {
                return null;
              }

              return (
                <InputPair
                  field={field}
                  key={field}
                  containerStyle={styles.inputPair}
                  inlineFieldsOverride={inlineOverride}
                >
                  <Duration
                    value={formValues[field]}
                    textInputStyle={textInputStyle}
                    onChange={(value) => {
                      onFormValuesChange({
                        ...formValues,
                        [field]: value
                      });
                    }}
                    disabled={
                      f.disabled || (formType === 'UPDATE' && f.disableUpdate)
                    }
                  />
                </InputPair>
              );
            }
          }
        });
        return (
          <WhiteView
            style={[styles.fieldSection, elevation.elevated, sectionStyle]}
            key={i}
          >
            {sectionFields}
          </WhiteView>
        );
      }),
    [
      InputPair,
      ValueDependentInputPair,
      fieldColor,
      fieldSections,
      flatFields,
      formErrors,
      formType,
      formValues,
      inlineFields,
      onFormValuesChange,
      sectionStyle,
      t,
      textInputStyle
    ]
  );

  return (
    <TransparentView style={style}>
      <TransparentView>{formFields}</TransparentView>
    </TransparentView>
  );
}
