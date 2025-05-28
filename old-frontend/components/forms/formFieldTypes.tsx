import { UseTranslationResponse } from 'react-i18next';
import { ListModeType } from 'react-native-dropdown-picker';
import { CategoryName } from 'types/categories';
import { UserResponse } from 'types/users';

export type PermittedTypes =
  | 'string'
  | 'Date'
  | 'OptionalYearDate'
  | 'DateTime'
  | 'radio'
  | 'checkbox'
  | 'colour'
  | 'phoneNumber'
  | 'addMembers'
  | 'TextArea'
  | 'addFamilyMembers'
  | 'dropDown'
  | 'routineSelector'
  | 'recurrenceSelector'
  | 'actionsSelector'
  | 'reminderSelector'
  | 'tagSelector'
  | 'calculatedDuration'
  | 'duration'
  | 'dropDownWithOther'
  | 'timezone'
  | 'Image';

export type TextTransform = 'uppercase' | 'lowercase';

export type BaseField<TypeName extends PermittedTypes, ValueType> = {
  type: TypeName;
  required: boolean;
  displayName?: string | UseTranslationResponse<string> | undefined;
  initialValue?: ValueType;
  disabled?: boolean;
  disableUpdate?: boolean;
  shownFields?: { [fieldName: string]: any }[];
  hidden?: boolean;
  sourceField?: string;
  targetField?: string;
  helpText?: string;
  inlineOverride?: boolean;
};

export type StringField = BaseField<'string', string> & {
  transform?: TextTransform;
};
export type TextArea = BaseField<'TextArea', string>;
export type DateField = BaseField<'Date', Date> & {
  associatedStartDateField?: string;
  associatedEndDateField?: string;
};
export type OptionalYearDate = BaseField<'OptionalYearDate', Date> & {
  knownYearField?: string | undefined;
};
export type DateTimeField = BaseField<'DateTime', Date> & {
  associatedStartTimeField?: string;
  associatedEndTimeField?: string;
  utc?: boolean;
};
export type RadioField = BaseField<'radio', any> & {
  permittedValues: any[];
  valueToDisplay: (val: any) => string;
};
export type CheckboxField = BaseField<'checkbox', any> & {
  forceUnchecked?: string[];
};

export type AddMembersField = BaseField<'addMembers', any> & {
  permittedValues?: {
    friends: UserResponse[];
    family: UserResponse[];
  };
  valueToDisplay: (val: any) => string;
  changeMembersText?: string;
};
export type AddFamilyMembersField = BaseField<'addFamilyMembers', any> & {
  permittedValues: any[];
  valueToDisplay: (val: any) => string;
};

export type DropDownField = BaseField<'dropDown', any> & {
  permittedValues: any[];
  initialValue?: any;
  placeholder?: string;
  listMode?: ListModeType;
};
export type DropDownWithOtherField = BaseField<'dropDownWithOther', any> & {
  permittedValues: any[];
  displayName?: string;
  initialValue?: any;
  placeholder?: string;
  listMode?: ListModeType;
};

export type RoutineField = BaseField<'routineSelector', any>;

export type RecurrenceSelectorField = BaseField<'recurrenceSelector', any> & {
  firstOccurrenceField: string;
  reverse?: boolean;
};

export type ActionsSelectorField = BaseField<'actionsSelector', any>;
export type ReminderSelectorField = BaseField<'reminderSelector', any>;

export type TagSelectorField = BaseField<'tagSelector', any> & {
  extraTagOptions?: {
    [key in CategoryName]?: { value: string; label: string }[];
  };
};

export type CalculatedDurationField = BaseField<'calculatedDuration', any> & {
  startFieldName: string;
  endFieldName: string;
};

export type DurationField = BaseField<'duration', any>;

// TODO - make these more specific (match regex?)
export type ColourField = BaseField<'colour', string>;
export type PhoneNumberField = BaseField<'phoneNumber', string>;

export type ImageField = BaseField<'Image', string | object> & {
  centered?: boolean;
};

export type TimezoneField = BaseField<'timezone', string> & {
  displayName?: string;
  initialValue?: any;
  placeholder?: string;
  listMode?: ListModeType;
};

export type Field =
  | StringField
  | DateField
  | OptionalYearDate
  | DateTimeField
  | RadioField
  | CheckboxField
  | ColourField
  | PhoneNumberField
  | AddMembersField
  | TextArea
  | AddFamilyMembersField
  | DropDownField
  | DropDownWithOtherField
  | RoutineField
  | RecurrenceSelectorField
  | TagSelectorField
  | ActionsSelectorField
  | ReminderSelectorField
  | CalculatedDurationField
  | DurationField
  | ImageField
  | TimezoneField;

export type FlatFormFieldTypes = {
  [key: string]: Field;
};
export type FormFieldTypes = FlatFormFieldTypes | FlatFormFieldTypes[];

export const hasValueToDisplay = (
  x: any
): x is AddMembersField | AddFamilyMembersField | RadioField =>
  x.valueToDisplay;

export const hasPermittedValues = (
  x: any
): x is
  | AddMembersField
  | AddFamilyMembersField
  | RadioField
  | DropDownField
  | DropDownWithOtherField => !!x.permittedValues;

export const hasPlaceholder = (
  x: any
): x is DropDownField | DropDownWithOtherField => !!x.placeholder;

export const hasListMode = (
  x: any
): x is DropDownField | DropDownWithOtherField => !!x.listMode;
